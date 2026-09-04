import production from '../../content/runtime/first-play-production.json?runtime';
import type {
  DragToTargetQuestion,
  PresentableItem,
  SingleChoiceQuestion,
  SingleChoicePresentationHint
} from '../contracts/question';
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

const reactionGrammar: Record<FirstPlayReactionEvent, {
  character: StoryCharacterId;
  signatureIndex: number;
  suffix?: string;
  mood: FirstPlayReactionMood;
}> = {
  discover: { character: 'dheu', signatureIndex: 1, mood: 'happy' },
  mischief: { character: 'shaitanu', signatureIndex: 0, mood: 'mischievous' },
  scaffold: { character: 'scientu', signatureIndex: 0, suffix: ' Look again.', mood: 'thinking' },
  change: { character: 'scientu', signatureIndex: 1, suffix: ' That clue changes things.', mood: 'celebrate' },
  celebrate: { character: 'dheu', signatureIndex: 3, mood: 'celebrate' }
};

export function resolveFirstPlayMicroReaction(event: FirstPlayReactionEvent): FirstPlayMicroReaction {
  const grammar = reactionGrammar[event];
  const persona = getStoryCharacterPersona(grammar.character);
  const signature = persona.speech.signatures[grammar.signatureIndex] ?? persona.speech.signatures[0] ?? '';
  return {
    character: grammar.character,
    text: `${signature}${grammar.suffix ?? ''}`.trim(),
    mood: grammar.mood
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

type VisualTuple = [label: string, visualRef: string];
interface RawTouch {
  id: string;
  kind: 'touch_discover';
  prompt: string;
  reactionEvent: 'discover' | 'mischief';
  item: string;
  spokenLabel: string;
}
interface RawChoice {
  id: string;
  kind: 'listen_find';
  prompt: string;
  options: string[];
  answer: string;
  conceptIds?: string[];
  knowledgeRefs?: string[];
}
interface RawPlace {
  id: string;
  kind: 'place_match';
  prompt: string;
  item: string;
  itemId: string;
  targets: Array<{ key: string; id: string; label?: string }>;
  targetId: string;
  tolerance: number;
}
interface RawContrast {
  id: string;
  kind: 'semantic_contrast';
  prompt: string;
  answer: string;
  states: ContainerState[];
  conceptIds: string[];
  knowledgeRefs: string[];
}
interface RawLetter {
  id: string;
  kind: 'letter_picture';
  prompt: string;
  grapheme: string;
  options: string[];
  answer: string;
}
interface RawCause {
  id: string;
  kind: 'cause_effect';
  prompt: string;
  beforeState: ContainerState;
  afterState: ContainerState;
}
type RawFirstPlay = RawTouch | RawChoice | RawPlace | RawContrast | RawLetter | RawCause;
interface RawVisualReasoning {
  id: string;
  kind: 'visual_scene_choice' | 'odd_one_out';
  prompt: string;
  options: string[];
  answer: string;
}
interface RawProduction {
  visuals: Record<string, VisualTuple>;
  firstPlay: RawFirstPlay[];
  visualReasoning: RawVisualReasoning[];
}

const raw = production as unknown as RawProduction;
const authoring = { status: 'reviewed' as const, source: 'fp' };
const questionFeedback = { correct: 'Yes!', incorrect: 'Again' };
const firstPlayPresentation: SingleChoicePresentationHint = {
  mode: 'visual_dominant',
  tier: 'first_play',
  labels: 'hidden'
};
const preschoolPresentation: SingleChoicePresentationHint = {
  mode: 'visual_dominant',
  tier: 'preschool',
  labels: 'secondary'
};

function visualItem(key: string, id = key, label?: string): PresentableItem {
  const definition = raw.visuals[key];
  if (!definition) throw new Error(`First Play visual is not registered in its runtime catalogue: ${key}`);
  return {
    id,
    label: label ?? definition[0],
    visualRefs: [definition[1]]
  };
}

function choiceQuestion(input: {
  id: string;
  prompt: string;
  options: PresentableItem[];
  answer: string;
  firstPlay: boolean;
  conceptIds?: string[];
  knowledgeRefs?: string[];
}): SingleChoiceQuestion {
  const question: SingleChoiceQuestion = {
    id: input.id,
    revision: 1,
    schemaVersion: 1,
    conceptIds: input.conceptIds ?? [],
    difficulty: input.firstPlay ? 1 : 2,
    language: 'en-IN',
    prompt: { text: input.prompt },
    feedback: questionFeedback,
    authoring,
    interaction: {
      type: 'single_choice',
      version: 1,
      shuffleOptions: true,
      presentation: input.firstPlay ? firstPlayPresentation : preschoolPresentation,
      options: input.options
    },
    solution: { type: 'exact_option', correctOptionIds: [input.answer] }
  };
  if (input.knowledgeRefs) question.knowledgeRefs = input.knowledgeRefs;
  return question;
}

function compileFirstPlay(entry: RawFirstPlay): FirstPlayActivity {
  if (entry.kind === 'touch_discover') {
    return {
      id: entry.id,
      kind: entry.kind,
      promptText: entry.prompt,
      reactionEvent: entry.reactionEvent,
      item: visualItem(entry.item),
      spokenLabel: entry.spokenLabel
    };
  }

  if (entry.kind === 'place_match') {
    const item = visualItem(entry.item, entry.itemId);
    const targets = entry.targets.map((target) => visualItem(target.key, target.id, target.label));
    const question: DragToTargetQuestion = {
      id: `${entry.id}.question`,
      revision: 1,
      schemaVersion: 1,
      conceptIds: [],
      difficulty: 1,
      language: 'en-IN',
      prompt: { text: entry.prompt },
      feedback: questionFeedback,
      authoring,
      interaction: { type: 'drag_to_target', version: 1, items: [item], targets },
      solution: { type: 'target_assignment', assignments: { [entry.itemId]: entry.targetId } }
    };
    return {
      id: entry.id,
      kind: entry.kind,
      question,
      dropSnapTolerancePx: entry.tolerance
    };
  }

  if (entry.kind === 'semantic_contrast') {
    return {
      id: entry.id,
      kind: entry.kind,
      question: choiceQuestion({
        id: `${entry.id}.question`,
        prompt: entry.prompt,
        options: entry.states.map((state) => ({
          id: state,
          label: `${state === 'full' ? 'Full' : 'Empty'} bucket`
        })),
        answer: entry.answer,
        firstPlay: true,
        conceptIds: entry.conceptIds,
        knowledgeRefs: entry.knowledgeRefs
      }),
      states: entry.states.map((state) => ({ optionId: state, state }))
    };
  }

  if (entry.kind === 'letter_picture') {
    return {
      id: entry.id,
      kind: entry.kind,
      grapheme: entry.grapheme,
      question: choiceQuestion({
        id: `${entry.id}.question`,
        prompt: entry.prompt,
        options: entry.options.map((key) => visualItem(key)),
        answer: entry.answer,
        firstPlay: true
      })
    };
  }

  if (entry.kind === 'cause_effect') {
    return {
      id: entry.id,
      kind: entry.kind,
      promptText: entry.prompt,
      beforeState: entry.beforeState,
      afterState: entry.afterState
    };
  }

  return {
    id: entry.id,
    kind: entry.kind,
    question: choiceQuestion({
      id: `${entry.id}.question`,
      prompt: entry.prompt,
      options: entry.options.map((key) => visualItem(key)),
      answer: entry.answer,
      firstPlay: true,
      conceptIds: entry.conceptIds,
      knowledgeRefs: entry.knowledgeRefs
    })
  };
}

function compileVisualReasoning(entry: RawVisualReasoning): VisualReasoningActivity {
  return {
    id: entry.id,
    kind: entry.kind,
    question: choiceQuestion({
      id: `${entry.id}.question`,
      prompt: entry.prompt,
      options: entry.options.map((key) => visualItem(key)),
      answer: entry.answer,
      firstPlay: false
    })
  };
}

export const FIRST_PLAY_ACTIVITIES: readonly FirstPlayActivity[] = raw.firstPlay.map(compileFirstPlay);
export const VISUAL_REASONING_ACTIVITIES: readonly VisualReasoningActivity[] = raw.visualReasoning.map(compileVisualReasoning);
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
