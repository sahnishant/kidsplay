import type { DragToTargetQuestion, PresentableItem, SingleChoiceQuestion, SingleChoicePresentationHint } from '../contracts/question';
import type { EvaluationResult } from '../contracts/runtime';
import { evaluate } from '../evaluation/evaluate';
import { getStoryCharacterPersona } from '../story/storyPersona';
import type { StoryCharacterId } from '../story/storyTypes';
import { applyFirstPlayEvidencePolicy, resolveFirstPlayFeedback, type FirstPlayFeedbackMode } from './firstPlayRuntime';

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

const authoring = { status: 'reviewed' as const, source: 'fp' };
const feedback = { correct: 'Yes!', incorrect: 'Again' };
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

const visualItem = (id: string, label: string, visualRef: string): PresentableItem => ({
  id,
  label,
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
  prompt: string;
  options: PresentableItem[];
  answer: string;
  firstPlay?: boolean;
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
    feedback,
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

function dragQuestion(
  id: string,
  prompt: string,
  item: PresentableItem,
  targets: PresentableItem[],
  targetId: string
): DragToTargetQuestion {
  return {
    id,
    revision: 1,
    schemaVersion: 1,
    conceptIds: [],
    difficulty: 1,
    language: 'en-IN',
    prompt: { text: prompt },
    feedback,
    authoring,
    interaction: { type: 'drag_to_target', version: 1, items: [item], targets },
    solution: { type: 'target_assignment', assignments: { [item.id]: targetId } }
  };
}

const listenDog = choiceQuestion({
  id: 'first-play.listen-find.dog',
  prompt: 'Where is the dog?',
  options: [visual.dog, visual.cow],
  answer: 'dog',
  firstPlay: true
});

const listenEarth = choiceQuestion({
  id: 'first-play.listen-find.earth',
  prompt: 'Find Earth.',
  options: [visual.earth, visual.sun],
  answer: 'earth',
  firstPlay: true,
  conceptIds: ['universe.earth.planet'],
  knowledgeRefs: ['kr.universe.earth.type.planet']
});

const letterApple = choiceQuestion({
  id: 'first-play.letter-picture.a-apple.question',
  prompt: 'A ... Apple',
  options: [visual.apple, visual.orange],
  answer: 'apple',
  firstPlay: true
});

const fullEmpty = choiceQuestion({
  id: 'first-play.contrast.full-empty',
  prompt: 'Touch the full bucket.',
  options: [
    { id: 'full', label: 'Full bucket' },
    { id: 'empty', label: 'Empty bucket' }
  ],
  answer: 'full',
  firstPlay: true,
  conceptIds: ['vocabulary.state.full', 'vocabulary.state.empty', 'vocabulary.container.amount'],
  knowledgeRefs: ['kr.vocab.state.full.contrasts-with-empty']
});

export const FIRST_PLAY_ACTIVITIES: readonly FirstPlayActivity[] = [
  {
    id: 'first-play.touch.dog',
    kind: 'touch_discover',
    promptText: 'Touch the dog.',
    reactionEvent: 'discover',
    item: visual.dog,
    spokenLabel: 'Dog'
  },
  {
    id: 'first-play.touch.bell',
    kind: 'touch_discover',
    promptText: 'Touch the bell.',
    reactionEvent: 'mischief',
    item: visual.bell,
    spokenLabel: 'Bell'
  },
  {
    id: 'first-play.listen.dog',
    kind: 'listen_find',
    question: listenDog
  },
  {
    id: 'first-play.listen.earth',
    kind: 'listen_find',
    question: listenEarth
  },
  {
    id: 'first-play.place.dog',
    kind: 'place_match',
    dropSnapTolerancePx: 40,
    question: dragQuestion(
      'first-play.place.dog.question',
      'Put the dog with the dog.',
      { ...visual.dog, id: 'moving-dog' },
      [
        { ...visual.dog, id: 'dog-target', label: 'Dog match' },
        { ...visual.cow, id: 'cow-target' }
      ],
      'dog-target'
    )
  },
  {
    id: 'first-play.place.apple',
    kind: 'place_match',
    dropSnapTolerancePx: 40,
    question: dragQuestion(
      'first-play.place.apple.question',
      'Put the apple with the apple.',
      { ...visual.apple, id: 'moving-apple' },
      [
        { ...visual.orange, id: 'orange-target' },
        { ...visual.apple, id: 'apple-target', label: 'Apple match' }
      ],
      'apple-target'
    )
  },
  {
    id: 'first-play.contrast.full-empty',
    kind: 'semantic_contrast',
    question: fullEmpty,
    states: [
      { optionId: 'full', state: 'full' },
      { optionId: 'empty', state: 'empty' }
    ]
  },
  {
    id: 'first-play.letter-picture.a-apple',
    kind: 'letter_picture',
    grapheme: 'A',
    question: letterApple
  },
  {
    id: 'first-play.cause-effect.fill-bucket',
    kind: 'cause_effect',
    promptText: 'Touch the empty bucket.',
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
  prompt: string,
  candidates: RuntimeCandidate[]
): VisualReasoningActivity {
  const correct = candidates.find((candidate) => candidate.correct);
  if (!correct) throw new Error(`${id}: missing answer`);
  return {
    id,
    kind,
    question: choiceQuestion({
      id: `${id}.question`,
      prompt,
      options: candidates.map((candidate) => candidate.item),
      answer: correct.item.id
    })
  };
}

export const VISUAL_SCENE_CHOICE_ACTIVITIES: readonly VisualReasoningActivity[] = [
  visualReasoningActivity('visual-choice.animals.dog', 'visual_scene_choice', 'Find the dog.', [
    { item: visual.dog, correct: true },
    { item: visual.cow },
    { item: visual.rabbit }
  ]),
  visualReasoningActivity('visual-choice.transport.bus', 'visual_scene_choice', 'Find the bus.', [
    { item: visual.bus, correct: true },
    { item: visual.train },
    { item: visual.ship },
    { item: visual.aeroplane }
  ]),
  visualReasoningActivity('visual-choice.body.eyes', 'visual_scene_choice', 'Find the eyes.', [
    { item: visual.eyes, correct: true },
    { item: visual.ears },
    { item: visual.nose },
    { item: visual.tongue }
  ]),
  visualReasoningActivity('visual-choice.communication.telephone', 'visual_scene_choice', 'Find the telephone.', [
    { item: visual.telephone, correct: true },
    { item: visual.radio },
    { item: visual.newspaper },
    { item: visual.television }
  ]),
  visualReasoningActivity('visual-choice.plants.lotus', 'visual_scene_choice', 'Find the lotus.', [
    { item: visual.pea },
    { item: visual.pumpkin },
    { item: visual.lotus, correct: true }
  ]),
  visualReasoningActivity('visual-choice.food-source.honeybee', 'visual_scene_choice', 'Find the honeybee.', [
    { item: visual.cow },
    { item: visual.honeybee, correct: true },
    { item: visual.wheat }
  ])
] as const;

export const ODD_ONE_OUT_ACTIVITIES: readonly VisualReasoningActivity[] = [
  visualReasoningActivity('odd-one-out.transport', 'odd_one_out', "Which one doesn't belong?", [
    { item: visual.bus },
    { item: visual.train },
    { item: visual.ship },
    { item: visual.telephone, correct: true }
  ]),
  visualReasoningActivity('odd-one-out.communication', 'odd_one_out', "Which one doesn't belong?", [
    { item: visual.telephone },
    { item: visual.radio },
    { item: visual.newspaper },
    { item: visual.bus, correct: true }
  ]),
  visualReasoningActivity('odd-one-out.senses', 'odd_one_out', "Which one doesn't belong?", [
    { item: visual.eyes },
    { item: visual.ears },
    { item: visual.nose },
    { item: visual.teeth, correct: true }
  ]),
  visualReasoningActivity('odd-one-out.plants', 'odd_one_out', "Which one doesn't belong?", [
    { item: visual.pea },
    { item: visual.pumpkin },
    { item: visual.lotus },
    { item: visual.bus, correct: true }
  ]),
  visualReasoningActivity('odd-one-out.food-sources', 'odd_one_out', "Which one doesn't belong?", [
    { item: visual.cow },
    { item: visual.honeybee },
    { item: visual.wheat },
    { item: visual.telephone, correct: true }
  ]),
  visualReasoningActivity('odd-one-out.animal-features', 'odd_one_out', "Which one doesn't belong?", [
    { item: visual.fish },
    { item: visual.bird },
    { item: visual.duck },
    { item: visual.bus, correct: true }
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
  const result = applyFirstPlayEvidencePolicy('guided_practice', evaluate(activity.question, response));
  return {
    result,
    feedback: resolveFirstPlayFeedback('guided_practice', result)
  };
}
