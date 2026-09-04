import type { DragToTargetQuestion, PresentableItem, SingleChoiceQuestion, SingleChoicePresentationTier } from '../contracts/question';
import type { EvaluationResult } from '../contracts/runtime';
import { evaluate } from '../evaluation/evaluate';
import { getStoryCharacterPersona } from '../story/storyPersona';
import type { StoryCharacterId } from '../story/storyTypes';
import { applyFirstPlayEvidencePolicy, resolveFirstPlayFeedback, type FirstPlayFeedbackMode } from './firstPlayRuntime';
import type { FirstPlayEvidenceClass, FirstPlayStage } from './firstPlayPolicy';

export type FirstPlaySurfaceMode = 'first_play' | 'visual_reasoning';
export type FirstPlayReactionEvent = 'discover' | 'mischief' | 'scaffold' | 'change' | 'celebrate';
export type FirstPlayReactionMood = 'happy' | 'thinking' | 'mischievous' | 'celebrate' | 'ready';

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
  return { character: grammar.character, text: `${signature}${grammar.suffix ?? ''}`.trim(), mood: grammar.mood };
}

interface FirstPlayActivityBase {
  id: string;
  stage: FirstPlayStage;
  evidenceClass: FirstPlayEvidenceClass;
  promptText: string;
  reactionEvent: FirstPlayReactionEvent;
}

export interface TouchDiscoverActivity extends FirstPlayActivityBase {
  kind: 'touch_discover';
  item: PresentableItem;
  spokenLabel: string;
}

export interface ListenFindActivity extends FirstPlayActivityBase {
  kind: 'listen_find';
  question: SingleChoiceQuestion;
}

export interface PlaceMatchActivity extends FirstPlayActivityBase {
  kind: 'place_match';
  question: DragToTargetQuestion;
  dropSnapTolerancePx: number;
}

export interface LetterPictureActivity extends FirstPlayActivityBase {
  kind: 'letter_picture';
  grapheme: string;
  question: SingleChoiceQuestion;
}

export type ContainerState = 'empty' | 'full';

export interface ContrastActivity extends FirstPlayActivityBase {
  kind: 'semantic_contrast';
  question: SingleChoiceQuestion;
  states: ReadonlyArray<{ optionId: string; state: ContainerState }>;
}

export interface CauseEffectActivity extends FirstPlayActivityBase {
  kind: 'cause_effect';
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
  promptText: string;
  question: SingleChoiceQuestion;
}

const reviewedAuthoring = { status: 'reviewed' as const, source: 'first-play-v1' };
const visualItem = (id: string, label: string, visualRef: string): PresentableItem => ({
  id,
  label,
  semanticRef: id,
  visualRefs: [visualRef]
});

const visual = {
  dog: visualItem('dog', 'Dog', 'entity.animal.dog'),
  cow: visualItem('cow', 'Cow', 'entity.animal.cow'),
  rabbit: visualItem('rabbit', 'Rabbit', 'entity.animal.rabbit'),
  bell: visualItem('bell', 'Bell', 'entity.school.bell'),
  earth: visualItem('earth', 'Earth', 'entity.universe.earth'),
  sun: visualItem('sun', 'Sun', 'entity.nature.sun'),
  apple: visualItem('apple', 'Apple', 'entity.food.apple'),
  orange: visualItem('orange', 'Orange', 'entity.food.orange'),
  bus: visualItem('bus', 'Bus', 'entity.transport.bus'),
  train: visualItem('train', 'Train', 'entity.transport.train'),
  ship: visualItem('ship', 'Ship', 'entity.transport.ship'),
  aeroplane: visualItem('aeroplane', 'Aeroplane', 'entity.transport.aeroplane'),
  telephone: visualItem('telephone', 'Telephone', 'entity.communication.telephone'),
  radio: visualItem('radio', 'Radio', 'entity.communication.radio'),
  newspaper: visualItem('newspaper', 'Newspaper', 'entity.communication.newspaper'),
  television: visualItem('television', 'Television', 'entity.communication.television'),
  eyes: visualItem('eyes', 'Eyes', 'entity.body.eyes'),
  ears: visualItem('ears', 'Ears', 'entity.body.ears'),
  nose: visualItem('nose', 'Nose', 'entity.body.nose'),
  tongue: visualItem('tongue', 'Tongue', 'entity.body.tongue'),
  teeth: visualItem('teeth', 'Teeth', 'entity.body.teeth'),
  pea: visualItem('pea', 'Pea plant', 'entity.plant.pea'),
  pumpkin: visualItem('pumpkin', 'Pumpkin plant', 'entity.plant.pumpkin'),
  lotus: visualItem('lotus', 'Lotus', 'entity.plant.lotus'),
  honeybee: visualItem('honeybee', 'Honeybee', 'entity.animal.bee'),
  wheat: visualItem('wheat', 'Wheat', 'entity.food.wheat'),
  fish: visualItem('fish', 'Fish', 'entity.animal.fish'),
  bird: visualItem('bird', 'Bird', 'entity.animal.bird'),
  duck: visualItem('duck', 'Duck', 'entity.animal.duck')
} as const;

function choiceQuestion(input: {
  id: string;
  promptText: string;
  options: PresentableItem[];
  correctOptionId: string;
  tier: SingleChoicePresentationTier;
  labels?: 'visible' | 'secondary' | 'hidden';
  conceptIds?: string[];
  knowledgeRefs?: string[];
}): SingleChoiceQuestion {
  return {
    id: input.id,
    revision: 1,
    schemaVersion: 1,
    conceptIds: input.conceptIds ?? [],
    knowledgeRefs: input.knowledgeRefs ?? [],
    difficulty: input.tier === 'first_play' ? 1 : 2,
    language: 'en-IN',
    prompt: { text: input.promptText },
    feedback: { correct: 'Yes!', incorrect: 'Try again.' },
    authoring: reviewedAuthoring,
    interaction: {
      type: 'single_choice',
      version: 1,
      shuffleOptions: true,
      presentation: {
        mode: 'visual_dominant',
        tier: input.tier,
        labels: input.labels ?? (input.tier === 'first_play' ? 'hidden' : 'secondary')
      },
      options: input.options
    },
    solution: { type: 'exact_option', correctOptionIds: [input.correctOptionId] }
  };
}

function dragQuestion(input: {
  id: string;
  promptText: string;
  item: PresentableItem;
  targets: PresentableItem[];
  correctTargetId: string;
}): DragToTargetQuestion {
  return {
    id: input.id,
    revision: 1,
    schemaVersion: 1,
    conceptIds: [],
    knowledgeRefs: [],
    difficulty: 1,
    language: 'en-IN',
    prompt: { text: input.promptText },
    feedback: { correct: 'Yes!', incorrect: 'Try again.' },
    authoring: reviewedAuthoring,
    interaction: { type: 'drag_to_target', version: 1, items: [input.item], targets: input.targets },
    solution: { type: 'target_assignment', assignments: { [input.item.id]: input.correctTargetId } }
  };
}

const listenDog = choiceQuestion({
  id: 'first-play.listen-find.dog',
  promptText: 'Where is the dog?',
  options: [visual.dog, visual.cow],
  correctOptionId: 'dog',
  tier: 'first_play'
});

const listenEarth = choiceQuestion({
  id: 'first-play.listen-find.earth',
  promptText: 'Find Earth.',
  options: [visual.earth, visual.sun],
  correctOptionId: 'earth',
  tier: 'first_play',
  conceptIds: ['universe.earth.planet'],
  knowledgeRefs: ['kr.universe.earth.type.planet']
});

const letterApple = choiceQuestion({
  id: 'first-play.letter-picture.a-apple.question',
  promptText: 'A ... Apple',
  options: [visual.apple, visual.orange],
  correctOptionId: 'apple',
  tier: 'first_play'
});

const fullEmpty = choiceQuestion({
  id: 'first-play.contrast.full-empty',
  promptText: 'Touch the full bucket.',
  options: [
    { id: 'full', label: 'Full bucket', semanticRef: 'full' },
    { id: 'empty', label: 'Empty bucket', semanticRef: 'empty' }
  ],
  correctOptionId: 'full',
  tier: 'first_play',
  conceptIds: ['vocabulary.state.full', 'vocabulary.state.empty', 'vocabulary.container.amount'],
  knowledgeRefs: ['kr.vocab.state.full.contrasts-with-empty']
});

export const FIRST_PLAY_ACTIVITIES: readonly FirstPlayActivity[] = [
  {
    id: 'first-play.touch.dog',
    kind: 'touch_discover',
    stage: 'fp0_touch_discover',
    evidenceClass: 'exploration',
    promptText: 'Touch the dog.',
    reactionEvent: 'discover',
    item: visual.dog,
    spokenLabel: 'Dog'
  },
  {
    id: 'first-play.touch.bell',
    kind: 'touch_discover',
    stage: 'fp0_touch_discover',
    evidenceClass: 'exploration',
    promptText: 'Touch the bell.',
    reactionEvent: 'mischief',
    item: visual.bell,
    spokenLabel: 'Bell'
  },
  {
    id: 'first-play.listen.dog',
    kind: 'listen_find',
    stage: 'fp1_listen_find',
    evidenceClass: 'guided_practice',
    promptText: listenDog.prompt.text,
    reactionEvent: 'celebrate',
    question: listenDog
  },
  {
    id: 'first-play.listen.earth',
    kind: 'listen_find',
    stage: 'fp1_listen_find',
    evidenceClass: 'guided_practice',
    promptText: listenEarth.prompt.text,
    reactionEvent: 'celebrate',
    question: listenEarth
  },
  {
    id: 'first-play.place.dog',
    kind: 'place_match',
    stage: 'fp2_match_relation',
    evidenceClass: 'guided_practice',
    promptText: 'Put the dog with the dog.',
    reactionEvent: 'celebrate',
    dropSnapTolerancePx: 40,
    question: dragQuestion({
      id: 'first-play.place.dog.question',
      promptText: 'Put the dog with the dog.',
      item: { ...visual.dog, id: 'moving-dog' },
      targets: [
        { ...visual.dog, id: 'dog-target', label: 'Dog match' },
        { ...visual.cow, id: 'cow-target', label: 'Cow' }
      ],
      correctTargetId: 'dog-target'
    })
  },
  {
    id: 'first-play.place.apple',
    kind: 'place_match',
    stage: 'fp2_match_relation',
    evidenceClass: 'guided_practice',
    promptText: 'Put the apple with the apple.',
    reactionEvent: 'celebrate',
    dropSnapTolerancePx: 40,
    question: dragQuestion({
      id: 'first-play.place.apple.question',
      promptText: 'Put the apple with the apple.',
      item: { ...visual.apple, id: 'moving-apple' },
      targets: [
        { ...visual.orange, id: 'orange-target', label: 'Orange' },
        { ...visual.apple, id: 'apple-target', label: 'Apple match' }
      ],
      correctTargetId: 'apple-target'
    })
  },
  {
    id: 'first-play.contrast.full-empty',
    kind: 'semantic_contrast',
    stage: 'fp4_concrete_concept',
    evidenceClass: 'guided_practice',
    promptText: fullEmpty.prompt.text,
    reactionEvent: 'celebrate',
    question: fullEmpty,
    states: [
      { optionId: 'full', state: 'full' },
      { optionId: 'empty', state: 'empty' }
    ]
  },
  {
    id: 'first-play.letter-picture.a-apple',
    kind: 'letter_picture',
    stage: 'fp5_sound_letter_exposure',
    evidenceClass: 'guided_practice',
    promptText: letterApple.prompt.text,
    reactionEvent: 'celebrate',
    grapheme: 'A',
    question: letterApple
  },
  {
    id: 'first-play.cause-effect.fill-bucket',
    kind: 'cause_effect',
    stage: 'fp3_put_sort_build',
    evidenceClass: 'exploration',
    promptText: 'Touch the empty bucket.',
    reactionEvent: 'change',
    beforeState: 'empty',
    afterState: 'full'
  }
] as const;

interface RuntimeCandidate {
  item: PresentableItem;
  correct?: boolean;
}

function visualReasoningActivity(
  id: string,
  kind: VisualReasoningActivity['kind'],
  promptText: string,
  candidates: RuntimeCandidate[]
): VisualReasoningActivity {
  const correct = candidates.find((candidate) => candidate.correct);
  if (!correct) throw new Error(`${id}: missing runtime answer`);
  return {
    id,
    kind,
    promptText,
    question: choiceQuestion({
      id: `${id}.question`,
      promptText,
      options: candidates.map((candidate) => candidate.item),
      correctOptionId: correct.item.id,
      tier: 'preschool'
    })
  };
}

export const VISUAL_SCENE_CHOICE_ACTIVITIES: readonly VisualReasoningActivity[] = [
  visualReasoningActivity('visual-choice.animals.dog', 'visual_scene_choice', 'Find the dog.', [
    { item: visual.dog, correct: true }, { item: visual.cow }, { item: visual.rabbit }
  ]),
  visualReasoningActivity('visual-choice.transport.bus', 'visual_scene_choice', 'Find the bus.', [
    { item: visual.bus, correct: true }, { item: visual.train }, { item: visual.ship }, { item: visual.aeroplane }
  ]),
  visualReasoningActivity('visual-choice.body.eyes', 'visual_scene_choice', 'Find the eyes.', [
    { item: visual.eyes, correct: true }, { item: visual.ears }, { item: visual.nose }, { item: visual.tongue }
  ]),
  visualReasoningActivity('visual-choice.communication.telephone', 'visual_scene_choice', 'Find the telephone.', [
    { item: visual.telephone, correct: true }, { item: visual.radio }, { item: visual.newspaper }, { item: visual.television }
  ]),
  visualReasoningActivity('visual-choice.plants.lotus', 'visual_scene_choice', 'Find the lotus.', [
    { item: visual.pea }, { item: visual.pumpkin }, { item: visual.lotus, correct: true }
  ]),
  visualReasoningActivity('visual-choice.food-source.honeybee', 'visual_scene_choice', 'Find the honeybee.', [
    { item: visual.cow }, { item: visual.honeybee, correct: true }, { item: visual.wheat }
  ])
] as const;

export const ODD_ONE_OUT_ACTIVITIES: readonly VisualReasoningActivity[] = [
  visualReasoningActivity('odd-one-out.transport', 'odd_one_out', "Which one doesn't belong?", [
    { item: visual.bus }, { item: visual.train }, { item: visual.ship }, { item: visual.telephone, correct: true }
  ]),
  visualReasoningActivity('odd-one-out.communication', 'odd_one_out', "Which one doesn't belong?", [
    { item: visual.telephone }, { item: visual.radio }, { item: visual.newspaper }, { item: visual.bus, correct: true }
  ]),
  visualReasoningActivity('odd-one-out.senses', 'odd_one_out', "Which one doesn't belong?", [
    { item: visual.eyes }, { item: visual.ears }, { item: visual.nose }, { item: visual.teeth, correct: true }
  ]),
  visualReasoningActivity('odd-one-out.plants', 'odd_one_out', "Which one doesn't belong?", [
    { item: visual.pea }, { item: visual.pumpkin }, { item: visual.lotus }, { item: visual.bus, correct: true }
  ]),
  visualReasoningActivity('odd-one-out.food-sources', 'odd_one_out', "Which one doesn't belong?", [
    { item: visual.cow }, { item: visual.honeybee }, { item: visual.wheat }, { item: visual.telephone, correct: true }
  ]),
  visualReasoningActivity('odd-one-out.animal-features', 'odd_one_out', "Which one doesn't belong?", [
    { item: visual.fish }, { item: visual.bird }, { item: visual.duck }, { item: visual.bus, correct: true }
  ])
] as const;

export const VISUAL_REASONING_ACTIVITIES: readonly VisualReasoningActivity[] = [
  ...VISUAL_SCENE_CHOICE_ACTIVITIES,
  ...ODD_ONE_OUT_ACTIVITIES
];

export function evaluateFirstPlayQuestion(
  activity: ListenFindActivity | PlaceMatchActivity | LetterPictureActivity | ContrastActivity,
  response: unknown
): { result: EvaluationResult; feedback: FirstPlayFeedbackMode } {
  const result = applyFirstPlayEvidencePolicy(activity.evidenceClass, evaluate(activity.question, response));
  return { result, feedback: resolveFirstPlayFeedback(activity.evidenceClass, result) };
}
