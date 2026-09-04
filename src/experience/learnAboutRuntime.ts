import type { Question } from '../contracts/question';
import { resolveQuestionIds } from '../runtime/questionCatalog';
import { getLearnAboutTopicBinding } from './learnAboutBindings';
import { getLearnAboutTopic } from './learnAboutCatalog';
import type { LearnAboutDepthBand, LearnAboutRecipeFamily } from './learnAboutContract';
import {
  getAuthoritativeLearnAboutKnowledgeRefs,
  isAuthoritativeLearnAboutKnowledgeRef,
  resolveAuthoritativeLearnAboutKnowledgeRows,
  type LearnAboutKnowledgeRow
} from './learnAboutKnowledge';
import { projectLearnAboutActivities } from './learnAboutProjection';
import {
  RIDDLE_TIME_V1,
  projectRiddleToSurface,
  riddleKnowledgeRefs,
  type RiddleSurfaceProjection
} from './riddleCatalog';

export const LEARN_ABOUT_RUNTIME_ID = 'learn-about-v1' as const;

export type LearnAboutEvidenceMode = 'none' | 'evaluated_question';

export interface LearnAboutRuntimeCard {
  cardId: string;
  family: LearnAboutRecipeFamily;
  knowledgeRows: readonly LearnAboutKnowledgeRow[];
  evidenceMode: LearnAboutEvidenceMode;
  question?: Question;
  riddle?: RiddleSurfaceProjection;
}

export interface LearnAboutRuntimeSection {
  sectionId: string;
  childTitle: string;
  cards: readonly LearnAboutRuntimeCard[];
}

export interface LearnAboutRuntimeSession {
  runtimeId: typeof LEARN_ABOUT_RUNTIME_ID;
  topicId: string;
  childTitle: string;
  icon: string;
  depthBand: LearnAboutDepthBand;
  sections: readonly LearnAboutRuntimeSection[];
}

const DEPTH_ORDER: readonly LearnAboutDepthBand[] = [
  'd0_first_play',
  'd1_preschool',
  'd2_early_primary',
  'd3_deeper_primary'
];

function depthAtOrBelow(candidate: LearnAboutDepthBand, selected: LearnAboutDepthBand): boolean {
  return DEPTH_ORDER.indexOf(candidate) <= DEPTH_ORDER.indexOf(selected);
}

function sectionIsActive(depthBands: readonly LearnAboutDepthBand[], selected: LearnAboutDepthBand): boolean {
  return depthBands.some((band) => depthAtOrBelow(band, selected));
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

/**
 * One generic Learn About composer for every topic. It only turns canonical row
 * refs into discovery cards and delegates evaluated work to existing question
 * contracts. Merely creating/opening this session cannot emit mastery evidence.
 */
export function createLearnAboutRuntimeSession(
  topicId: string,
  depthBand: LearnAboutDepthBand
): LearnAboutRuntimeSession {
  const topic = getLearnAboutTopic(topicId);
  if (!topic) throw new Error(`Unknown Learn About topic ${topicId}`);
  const binding = getLearnAboutTopicBinding(topicId);
  if (!binding) throw new Error(`Missing Learn About binding for ${topicId}`);

  const authoritative = getAuthoritativeLearnAboutKnowledgeRefs();
  const admittedKnowledgeRefs = unique(
    topic.sections.flatMap((section) => section.knowledgeRefs).filter((ref) => authoritative.has(ref))
  );
  const supportedRelationshipRefs = unique(
    binding.sections
      .flatMap((section) => section.relationshipRefs ?? [])
      .filter((ref) => authoritative.has(ref))
  );
  const projected = projectLearnAboutActivities(topic, depthBand, {
    admittedKnowledgeRefs,
    supportedRelationshipRefs
  });

  const cardsBySection = new Map<string, LearnAboutRuntimeCard[]>();
  const addCard = (sectionId: string, card: LearnAboutRuntimeCard): void => {
    const cards = cardsBySection.get(sectionId) ?? [];
    cards.push(card);
    cardsBySection.set(sectionId, cards);
  };

  for (const activity of projected) {
    addCard(activity.sectionId, {
      cardId: `${activity.sectionId}.${activity.family}`,
      family: activity.family,
      knowledgeRows: resolveAuthoritativeLearnAboutKnowledgeRows(activity.knowledgeRefs),
      evidenceMode: 'none'
    });
  }

  for (const section of topic.sections) {
    if (!sectionIsActive(section.depthBands, depthBand)) continue;
    const sectionBinding = binding.sections.find((candidate) => candidate.sectionId === section.sectionId);
    if (!sectionBinding) continue;

    if (section.recipeFamilies.includes('guess')) {
      for (const guess of sectionBinding.guesses ?? []) {
        if (!depthAtOrBelow(guess.minDepth, depthBand)) continue;
        const item = RIDDLE_TIME_V1.find((candidate) => candidate.clue.clueSetId === guess.clueSetId);
        if (!item) throw new Error(`${section.sectionId}: unknown shared clue ${guess.clueSetId}`);
        const evidenceRefs = riddleKnowledgeRefs(item);
        if (evidenceRefs.some((ref) => !isAuthoritativeLearnAboutKnowledgeRef(ref))) continue;
        if (evidenceRefs.some((ref) => !section.knowledgeRefs.includes(ref))) {
          throw new Error(`${section.sectionId}: shared clue evidence must be declared by the topic section`);
        }
        const riddle = projectRiddleToSurface(item, 'learn_about');
        addCard(section.sectionId, {
          cardId: `${section.sectionId}.guess.${guess.clueSetId}`,
          family: 'guess',
          knowledgeRows: resolveAuthoritativeLearnAboutKnowledgeRows(evidenceRefs),
          evidenceMode: 'evaluated_question',
          question: riddle.question,
          riddle
        });
      }
    }

    if (section.recipeFamilies.includes('practice') && sectionBinding.practiceQuestionIds?.length) {
      for (const question of resolveQuestionIds([...sectionBinding.practiceQuestionIds])) {
        const questionKnowledgeRefs = question.knowledgeRefs ?? [];
        if (questionKnowledgeRefs.length === 0) continue;
        if (questionKnowledgeRefs.some((ref) => !isAuthoritativeLearnAboutKnowledgeRef(ref))) continue;
        if (questionKnowledgeRefs.some((ref) => !section.knowledgeRefs.includes(ref))) continue;
        addCard(section.sectionId, {
          cardId: `${section.sectionId}.practice.${question.id}`,
          family: 'practice',
          knowledgeRows: resolveAuthoritativeLearnAboutKnowledgeRows(questionKnowledgeRefs),
          evidenceMode: 'evaluated_question',
          question
        });
      }
    }
  }

  return {
    runtimeId: LEARN_ABOUT_RUNTIME_ID,
    topicId: topic.topicId,
    childTitle: topic.childTitle,
    icon: binding.icon,
    depthBand,
    sections: topic.sections
      .filter((section) => sectionIsActive(section.depthBands, depthBand))
      .map((section) => ({
        sectionId: section.sectionId,
        childTitle: section.childTitle,
        cards: cardsBySection.get(section.sectionId) ?? []
      }))
      .filter((section) => section.cards.length > 0)
  };
}
