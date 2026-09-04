import type { SingleChoiceQuestion } from '../contracts/question';
import { validateClueRecord, type ClueRecord } from './clueContract';
import {
  projectSemanticRiddlePlacement,
  type RiddleSurface,
  type SemanticRiddlePlacement
} from './riddlePlacement';

export interface RiddleCandidatePresentation {
  optionId: string;
  semanticRef: string;
  label: string;
  visualRefs: readonly string[];
}

export interface RiddleProductionItem {
  clue: ClueRecord;
  conceptIds: readonly string[];
  candidates: readonly RiddleCandidatePresentation[];
}

export interface RiddleSurfaceProjection {
  surface: RiddleSurface;
  clue: ClueRecord;
  question: SingleChoiceQuestion;
  placement: SemanticRiddlePlacement;
}

function productionRiddle(value: {
  clue: unknown;
  conceptIds: readonly string[];
  candidates: readonly RiddleCandidatePresentation[];
}): RiddleProductionItem {
  const clue = validateClueRecord(value.clue);
  if (!value.conceptIds.length || value.conceptIds.some((id) => !id.trim())) {
    throw new Error(`${clue.clueSetId}: conceptIds are required`);
  }
  if (new Set(value.conceptIds).size !== value.conceptIds.length) {
    throw new Error(`${clue.clueSetId}: duplicate conceptIds`);
  }

  const declared = new Set(clue.candidateSemanticRefs);
  const presented = new Set(value.candidates.map((candidate) => candidate.semanticRef));
  if (declared.size !== presented.size || [...declared].some((semanticRef) => !presented.has(semanticRef))) {
    throw new Error(`${clue.clueSetId}: candidate presentation must exactly match the declared candidate universe`);
  }
  if (new Set(value.candidates.map((candidate) => candidate.optionId)).size !== value.candidates.length) {
    throw new Error(`${clue.clueSetId}: duplicate option ids`);
  }
  for (const candidate of value.candidates) {
    if (!candidate.optionId.trim() || !candidate.label.trim() || candidate.visualRefs.length === 0) {
      throw new Error(`${clue.clueSetId}: every production candidate needs an option id, label and semantic visual`);
    }
  }

  return {
    clue,
    conceptIds: [...value.conceptIds],
    candidates: value.candidates.map((candidate) => ({ ...candidate, visualRefs: [...candidate.visualRefs] }))
  };
}

const bird = { optionId: 'bird', semanticRef: 'entity.animal.bird', label: 'Bird', visualRefs: ['entity.animal.bird'] } as const;
const fish = { optionId: 'fish', semanticRef: 'entity.animal.fish', label: 'Fish', visualRefs: ['entity.animal.fish'] } as const;
const duck = { optionId: 'duck', semanticRef: 'entity.animal.duck', label: 'Duck', visualRefs: ['entity.animal.duck'] } as const;
const dog = { optionId: 'dog', semanticRef: 'entity.animal.dog', label: 'Dog', visualRefs: ['entity.animal.dog'] } as const;
const rabbit = { optionId: 'rabbit', semanticRef: 'entity.animal.rabbit', label: 'Rabbit', visualRefs: ['entity.animal.rabbit'] } as const;
const cat = { optionId: 'cat', semanticRef: 'entity.animal.cat', label: 'Cat', visualRefs: ['entity.animal.cat'] } as const;
const cow = { optionId: 'cow', semanticRef: 'entity.animal.cow', label: 'Cow', visualRefs: ['entity.animal.cow'] } as const;
const earth = { optionId: 'earth', semanticRef: 'entity.universe.earth', label: 'Earth', visualRefs: ['entity.universe.earth'] } as const;
const sun = { optionId: 'sun', semanticRef: 'entity.nature.sun', label: 'Sun', visualRefs: ['entity.nature.sun'] } as const;

/**
 * Bounded production-candidate slice for #208 passes 081/085. The clue facts
 * are backed only by canonical knowledge rows already in the repository. The
 * question authoring state remains draft until a human editor explicitly
 * accepts the wording/age fit; engineering validity must not manufacture that
 * approval. R0 remains audio-first/zero-reading and exactly two-choice.
 */
export const RIDDLE_TIME_V1: readonly RiddleProductionItem[] = [
  productionRiddle({
    clue: {
      schemaVersion: 1,
      clueSetId: 'riddle.r0.bird.feathers',
      mechanism: 'concept_clues',
      demandBand: 'r0',
      authority: 'canonical_semantic',
      readingRequired: false,
      language: 'en',
      answerSemanticRef: bird.semanticRef,
      candidateSemanticRefs: [bird.semanticRef, fish.semanticRef],
      clues: [{ clueId: 'riddle.r0.bird.feathers.1', text: 'Who has feathers?', evidenceRefs: ['kr.animals.bird.covering.feathers'] }]
    },
    conceptIds: ['animals.body-coverings.feathers'],
    candidates: [bird, fish]
  }),
  productionRiddle({
    clue: {
      schemaVersion: 1,
      clueSetId: 'riddle.r0.fish.scales',
      mechanism: 'concept_clues',
      demandBand: 'r0',
      authority: 'canonical_semantic',
      readingRequired: false,
      language: 'en',
      answerSemanticRef: fish.semanticRef,
      candidateSemanticRefs: [fish.semanticRef, bird.semanticRef],
      clues: [{ clueId: 'riddle.r0.fish.scales.1', text: 'Who has scales?', evidenceRefs: ['kr.animals.fish.covering.scales'] }]
    },
    conceptIds: ['animals.body-coverings.scales'],
    candidates: [fish, bird]
  }),
  productionRiddle({
    clue: {
      schemaVersion: 1,
      clueSetId: 'riddle.r0.duck.webbed-feet',
      mechanism: 'concept_clues',
      demandBand: 'r0',
      authority: 'canonical_semantic',
      readingRequired: false,
      language: 'en',
      answerSemanticRef: duck.semanticRef,
      candidateSemanticRefs: [duck.semanticRef, dog.semanticRef],
      clues: [{ clueId: 'riddle.r0.duck.webbed-feet.1', text: 'Who has webbed feet?', evidenceRefs: ['kr.animals.duck.feature.webbed-feet'] }]
    },
    conceptIds: ['animals.adaptations.webbed-feet'],
    candidates: [duck, dog]
  }),
  productionRiddle({
    clue: {
      schemaVersion: 1,
      clueSetId: 'riddle.r0.dog.kennel',
      mechanism: 'concept_clues',
      demandBand: 'r0',
      authority: 'canonical_semantic',
      readingRequired: false,
      language: 'en',
      answerSemanticRef: dog.semanticRef,
      candidateSemanticRefs: [dog.semanticRef, rabbit.semanticRef],
      clues: [{ clueId: 'riddle.r0.dog.kennel.1', text: 'Who lives in a kennel?', evidenceRefs: ['kr.animals.dog.home.kennel'] }]
    },
    conceptIds: ['animals.homes.kennel'],
    candidates: [dog, rabbit]
  }),
  productionRiddle({
    clue: {
      schemaVersion: 1,
      clueSetId: 'riddle.r2.dog.domestic-kennel',
      mechanism: 'inference',
      demandBand: 'r2',
      authority: 'canonical_semantic',
      readingRequired: false,
      language: 'en',
      answerSemanticRef: dog.semanticRef,
      candidateSemanticRefs: [dog.semanticRef, rabbit.semanticRef, cat.semanticRef],
      clues: [
        { clueId: 'riddle.r2.dog.domestic-kennel.1', text: 'I am a domestic animal.', evidenceRefs: ['kr.animals.dog.domestic'] },
        { clueId: 'riddle.r2.dog.domestic-kennel.2', text: 'My home can be a kennel.', evidenceRefs: ['kr.animals.dog.home.kennel'] }
      ]
    },
    conceptIds: ['animals.dog.domestic-classification', 'animals.homes.kennel'],
    candidates: [dog, rabbit, cat]
  }),
  productionRiddle({
    clue: {
      schemaVersion: 1,
      clueSetId: 'riddle.r2.cow.calf-shed',
      mechanism: 'inference',
      demandBand: 'r2',
      authority: 'canonical_semantic',
      readingRequired: false,
      language: 'en',
      answerSemanticRef: cow.semanticRef,
      candidateSemanticRefs: [cow.semanticRef, dog.semanticRef, cat.semanticRef],
      clues: [
        { clueId: 'riddle.r2.cow.calf-shed.1', text: 'My baby is called a calf.', evidenceRefs: ['kr.animals.cow.young.calf'] },
        { clueId: 'riddle.r2.cow.calf-shed.2', text: 'I live in a cowshed.', evidenceRefs: ['kr.animals.cow.home.shed'] }
      ]
    },
    conceptIds: ['animals.young-ones.calf', 'animals.homes.cowshed'],
    candidates: [cow, dog, cat]
  }),
  productionRiddle({
    clue: {
      schemaVersion: 1,
      clueSetId: 'riddle.r2.earth.planet-third',
      mechanism: 'inference',
      demandBand: 'r2',
      authority: 'canonical_semantic',
      readingRequired: false,
      language: 'en',
      answerSemanticRef: earth.semanticRef,
      candidateSemanticRefs: [earth.semanticRef, sun.semanticRef],
      clues: [
        { clueId: 'riddle.r2.earth.planet-third.1', text: 'I am a planet.', evidenceRefs: ['kr.universe.earth.type.planet'] },
        { clueId: 'riddle.r2.earth.planet-third.2', text: 'I am third from the Sun.', evidenceRefs: ['kr.universe.earth.position.third'] }
      ]
    },
    conceptIds: ['universe.earth.planet', 'universe.planets.earth-position'],
    candidates: [earth, sun]
  }),
  productionRiddle({
    clue: {
      schemaVersion: 1,
      clueSetId: 'riddle.r2.dog.puppy-kennel',
      mechanism: 'inference',
      demandBand: 'r2',
      authority: 'canonical_semantic',
      readingRequired: false,
      language: 'en',
      answerSemanticRef: dog.semanticRef,
      candidateSemanticRefs: [dog.semanticRef, cat.semanticRef, rabbit.semanticRef],
      clues: [
        { clueId: 'riddle.r2.dog.puppy-kennel.1', text: 'My baby is called a puppy.', evidenceRefs: ['kr.animals.dog.young.puppy'] },
        { clueId: 'riddle.r2.dog.puppy-kennel.2', text: 'I can live in a kennel.', evidenceRefs: ['kr.animals.dog.home.kennel'] }
      ]
    },
    conceptIds: ['animals.young-ones.puppy', 'animals.homes.kennel'],
    candidates: [dog, cat, rabbit]
  })
];

export function riddleKnowledgeRefs(item: RiddleProductionItem): string[] {
  return [...new Set(item.clue.clues.flatMap((clue) => clue.evidenceRefs ?? []))];
}

export function riddleToSingleChoiceQuestion(item: RiddleProductionItem): SingleChoiceQuestion {
  if (!item.clue.answerSemanticRef) {
    throw new Error(`${item.clue.clueSetId}: production semantic riddle requires answerSemanticRef`);
  }
  const correct = item.candidates.find((candidate) => candidate.semanticRef === item.clue.answerSemanticRef);
  if (!correct) throw new Error(`${item.clue.clueSetId}: answer presentation is missing`);

  return {
    id: `question.${item.clue.clueSetId}`,
    revision: 1,
    schemaVersion: 1,
    conceptIds: [...item.conceptIds],
    knowledgeRefs: riddleKnowledgeRefs(item),
    difficulty: item.clue.demandBand === 'r0' ? 1 : 3,
    language: item.clue.language ?? 'en',
    prompt: { text: item.clue.demandBand === 'r0' ? 'Listen and choose.' : 'Who am I?' },
    feedback: {
      correct: 'You got it!',
      incorrect: 'Try again. You can use another clue.'
    },
    authoring: { status: 'draft', source: 'kidsplay-riddle-v1-candidate' },
    interaction: {
      type: 'single_choice',
      version: 1,
      shuffleOptions: true,
      options: item.candidates.map((candidate) => ({
        id: candidate.optionId,
        label: candidate.label,
        semanticRef: candidate.semanticRef,
        visualRefs: [...candidate.visualRefs]
      }))
    },
    solution: { type: 'exact_option', correctOptionIds: [correct.optionId] }
  };
}

/**
 * Surface projection is navigation/presentation-only. The same ClueRecord and
 * same existing SingleChoice evaluator contract are reused in Play, Learn About
 * and Adventure. Placement authority remains owned by riddlePlacement.ts.
 */
export function projectRiddleToSurface(item: RiddleProductionItem, surface: RiddleSurface): RiddleSurfaceProjection {
  const question = riddleToSingleChoiceQuestion(item);
  return {
    surface,
    clue: item.clue,
    question,
    placement: projectSemanticRiddlePlacement(item.clue, question, surface)
  };
}
