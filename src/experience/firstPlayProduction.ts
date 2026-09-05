import production from '../../content/runtime/first-play-production.json?runtime';
import type { DragToTargetQuestion, PresentableItem, SingleChoiceQuestion } from '../contracts/question';
import type { EvaluationResult } from '../contracts/runtime';
import { evaluate } from '../evaluation/evaluate';
import { getStoryCharacterPersona } from '../story/storyPersona';
import type { StoryCharacterId } from '../story/storyTypes';
import {
  applyFirstPlayEvidencePolicy,
  resolveFirstPlayFeedback,
  type FirstPlayFeedbackMode
} from './firstPlayRuntime';

export type FirstPlaySurfaceMode = 'first_play' | 'visual_reasoning';
export type FirstPlayReactionEvent = 'discover' | 'mischief' | 'scaffold' | 'change' | 'celebrate';
export type FirstPlayReactionMood = 'happy' | 'thinking' | 'mischievous' | 'celebrate';

export interface FirstPlayMicroReaction {
  character: StoryCharacterId;
  text: string;
  mood: FirstPlayReactionMood;
}

const reactions: Record<FirstPlayReactionEvent, [StoryCharacterId, number, FirstPlayReactionMood, string?]> = {
  discover: ['dheu', 1, 'happy'],
  mischief: ['shaitanu', 0, 'mischievous'],
  scaffold: ['scientu', 0, 'thinking', ' Look again.'],
  change: ['scientu', 1, 'celebrate', ' That clue changes things.'],
  celebrate: ['dheu', 3, 'celebrate']
};

export function resolveFirstPlayMicroReaction(event: FirstPlayReactionEvent): FirstPlayMicroReaction {
  const [character, signatureIndex, mood, suffix = ''] = reactions[event];
  const signatures = getStoryCharacterPersona(character).speech.signatures;
  return {
    character,
    mood,
    text: `${signatures[signatureIndex] ?? signatures[0] ?? ''}${suffix}`.trim()
  };
}

export interface TouchDiscoverActivity {
  id: string;
  kind: 'touch_discover';
  promptText: string;
  reactionEvent: 'discover' | 'mischief';
  item: PresentableItem;
  spokenLabel: string;
}

export interface ListenFindActivity {
  id: string;
  kind: 'listen_find';
  question: SingleChoiceQuestion;
}

export interface PlaceMatchActivity {
  id: string;
  kind: 'place_match';
  question: DragToTargetQuestion;
  dropSnapTolerancePx: number;
}

export interface LetterPictureActivity {
  id: string;
  kind: 'letter_picture';
  grapheme: string;
  question: SingleChoiceQuestion;
}

export type ContainerState = 'empty' | 'full';

export interface ContrastActivity {
  id: string;
  kind: 'semantic_contrast';
  question: SingleChoiceQuestion;
  states: ReadonlyArray<{ optionId: string; state: ContainerState }>;
}

export interface CauseEffectActivity {
  id: string;
  kind: 'cause_effect';
  promptText: string;
  beforeState: ContainerState;
  afterState: ContainerState;
}

export type FirstPlayActivity =
  | TouchDiscoverActivity
  | ListenFindActivity
  | PlaceMatchActivity
  | LetterPictureActivity
  | ContrastActivity
  | CauseEffectActivity;

export interface VisualReasoningActivity {
  id: string;
  kind: 'visual_scene_choice' | 'odd_one_out';
  question: SingleChoiceQuestion;
}

interface ProductionCatalogue {
  firstPlay: FirstPlayActivity[];
  visualReasoning: VisualReasoningActivity[];
}

const catalogue = production as unknown as ProductionCatalogue;

function enforceVisualSceneChoicePresentation(activity: VisualReasoningActivity): VisualReasoningActivity {
  if (activity.kind !== 'visual_scene_choice') return activity;

  const presentation = activity.question.interaction.presentation;
  return {
    ...activity,
    question: {
      ...activity.question,
      interaction: {
        ...activity.question.interaction,
        presentation: {
          mode: presentation?.mode ?? 'visual_dominant',
          tier: presentation?.tier ?? 'preschool',
          ...presentation,
          labels: 'hidden'
        }
      }
    }
  };
}

export const FIRST_PLAY_ACTIVITIES: readonly FirstPlayActivity[] = catalogue.firstPlay;
export const VISUAL_REASONING_ACTIVITIES: readonly VisualReasoningActivity[] =
  catalogue.visualReasoning.map(enforceVisualSceneChoicePresentation);
export const VISUAL_SCENE_CHOICE_ACTIVITIES: readonly VisualReasoningActivity[] = VISUAL_REASONING_ACTIVITIES.filter(
  (activity) => activity.kind === 'visual_scene_choice'
);
export const ODD_ONE_OUT_ACTIVITIES: readonly VisualReasoningActivity[] = VISUAL_REASONING_ACTIVITIES.filter(
  (activity) => activity.kind === 'odd_one_out'
);

export function evaluateFirstPlayQuestion(
  activity: ListenFindActivity | PlaceMatchActivity | LetterPictureActivity | ContrastActivity,
  response: unknown
): { result: EvaluationResult; feedback: FirstPlayFeedbackMode } {
  const result = applyFirstPlayEvidencePolicy('guided_practice', evaluate(activity.question, response));
  return {
    result,
    feedback: resolveFirstPlayFeedback('guided_practice', result)
  };
}
