import type {
  DragToTargetQuestion,
  PresentableItem,
  SingleChoiceQuestion,
  SingleChoicePresentationTier
} from '../contracts/question';
import type { EvaluationResult } from '../contracts/runtime';
import { evaluate } from '../evaluation/evaluate';
import { createSeededRandom, shuffled } from '../mechanics/random';
import { getStoryCharacterPersona } from '../story/storyPersona';
import type { StoryCharacterId } from '../story/storyTypes';
import {
  applyFirstPlayEvidencePolicy,
  resolveFirstPlayFeedback,
  type FirstPlayFeedbackMode
} from './firstPlayRuntime';
import {
  validateFirstPlayRecipePolicy,
  type FirstPlayEvidenceClass,
  type FirstPlayStage
} from './firstPlayPolicy';
import {
  resolveOddOneOutPlan,
  validateSemanticChoicePlan,
  type OddOneOutPlan,
  type SemanticChoicePlan
} from './semanticChoiceSafety';
import { validateWorldActionDefinition, type WorldActionDefinition } from './worldActionContract';

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
  return {
    character: grammar.character,
    text: `${signature}${grammar.suffix ?? ''}`.trim(),
    mood: grammar.mood
  };
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
  semanticPlan: SemanticChoicePlan;
}

export interface PlaceMatchActivity extends FirstPlayActivityBase {
  kind: 'place_match';
  question: DragToTargetQuestion;
  dropSnapTolerancePx: number;
}

export type ContainerState = 'empty' | 'full';

export interface ContrastActivity extends FirstPlayActivityBase {
  kind: 'semantic_contrast';
  question: SingleChoiceQuestion;
  states: readonly Array<{ optionId: string; state: ContainerState }>;
  comparisonDimensionRef: string;
}

export interface CauseEffectActivity extends FirstPlayActivityBase {
  kind: 'cause_effect';
  action: WorldActionDefinition;
  beforeState: ContainerState;
  afterState: ContainerState;
}

export type FirstPlayActivity =
  | TouchDiscoverActivity
  | ListenFindActivity
  | PlaceMatchActivity
  | ContrastActivity
  | CauseEffectActivity;

export interface ProductionOddOneOutCandidate {
  semanticRef: string;
  satisfiesRule: boolean;
  /** Reviewed canonical row that establishes this candidate's relation to the declared dimension. */
  comparisonEvidenceRef: string;
}

export interface ProductionOddOneOutPlan extends Omit<OddOneOutPlan, 'candidates'> {
  candidates: readonly ProductionOddOneOutCandidate[];
}

export interface VisualReasoningActivity {
  id: string;
  kind: 'visual_scene_choice' | 'odd_one_out';
  semanticFamily: string;
  promptText: string;
  question: SingleChoiceQuestion;
  semanticPlan?: SemanticChoicePlan;
  oddOneOutPlan?: ProductionOddOneOutPlan;
}

const reviewedAuthoring = { status: 'reviewed' as const, source: 'kidsplay-first-play-visual-choice-production-v1' };

function visualOption(id: string, label: string, visualRef: string): PresentableItem {
  return { id, label, semanticRef: id, visualRefs: [visualRef] };
}

function choiceQuestion({
  id,
  promptText,
  options,
  correctOptionId,
  tier,
  labels = tier === 'first_play' ? 'hidden' : 'secondary',
  conceptIds = [],
  knowledgeRefs = []
}: {
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
    id,
    revision: 1,
    schemaVersion: 1,
    conceptIds,
    knowledgeRefs,
    difficulty: tier === 'first_play' ? 1 : 2,
    language: 'en-IN',
    prompt: { text: promptText },
    feedback: { correct: 'Yes!', incorrect: 'Try again.' },
    authoring: reviewedAuthoring,
    interaction: {
      type: 'single_choice',
      version: 1,
      shuffleOptions: true,
      presentation: { mode: 'visual_dominant', tier, labels },
      options
    },
    solution: { type: 'exact_option', correctOptionIds: [correctOptionId] }
  };
}

function dragQuestion({
  id,
  promptText,
  item,
  targets,
  correctTargetId
}: {
  id: string;
  promptText: string;
  item: PresentableItem;
  targets: PresentableItem[];
  correctTargetId: string;
}): DragToTargetQuestion {
  return {
    id,
    revision: 1,
    schemaVersion: 1,
    conceptIds: [],
    knowledgeRefs: [],
    difficulty: 1,
    language: 'en-IN',
    prompt: { text: promptText },
    feedback: { correct: 'Yes!', incorrect: 'Try again.' },
    authoring: reviewedAuthoring,
    interaction: {
      type: 'drag_to_target',
      version: 1,
      items: [item],
      targets
    },
    solution: { type: 'target_assignment', assignments: { [item.id]: correctTargetId } }
  };
}

const dog = visualOption('dog', 'Dog', 'entity.animal.dog');
const cow = visualOption('cow', 'Cow', 'entity.animal.cow');
const rabbit = visualOption('rabbit', 'Rabbit', 'entity.animal.rabbit');
const bell = visualOption('bell', 'Bell', 'entity.school.bell');
const earth = visualOption('earth', 'Earth', 'entity.universe.earth');
const sun = visualOption('sun', 'Sun', 'entity.nature.sun');
const apple = visualOption('apple', 'Apple', 'entity.food.apple');
const orange = visualOption('orange', 'Orange', 'entity.food.orange');
const bus = visualOption('bus', 'Bus', 'entity.transport.bus');
const train = visualOption('train', 'Train', 'entity.transport.train');
const ship = visualOption('ship', 'Ship', 'entity.transport.ship');
const aeroplane = visualOption('aeroplane', 'Aeroplane', 'entity.transport.aeroplane');
const telephone = visualOption('telephone', 'Telephone', 'entity.communication.telephone');
const radio = visualOption('radio', 'Radio', 'entity.communication.radio');
const newspaper = visualOption('newspaper', 'Newspaper', 'entity.communication.newspaper');
const television = visualOption('television', 'Television', 'entity.communication.television');
const eyes = visualOption('eyes', 'Eyes', 'entity.body.eyes');
const ears = visualOption('ears', 'Ears', 'entity.body.ears');
const nose = visualOption('nose', 'Nose', 'entity.body.nose');
const tongue = visualOption('tongue', 'Tongue', 'entity.body.tongue');
const teeth = visualOption('teeth', 'Teeth', 'entity.body.teeth');
const pea = visualOption('pea', 'Pea plant', 'entity.plant.pea');
const pumpkin = visualOption('pumpkin', 'Pumpkin plant', 'entity.plant.pumpkin');
const lotus = visualOption('lotus', 'Lotus', 'entity.plant.lotus');
const bee = visualOption('honeybee', 'Honeybee', 'entity.animal.bee');
const wheat = visualOption('wheat', 'Wheat', 'entity.food.wheat');
const fish = visualOption('fish', 'Fish', 'entity.animal.fish');
const bird = visualOption('bird', 'Bird', 'entity.animal.bird');
const duck = visualOption('duck', 'Duck', 'entity.animal.duck');

const listenDogQuestion = choiceQuestion({
  id: 'first-play.listen-find.dog',
  promptText: 'Where is the dog?',
  options: [dog, cow],
  correctOptionId: 'dog',
  tier: 'first_play'
});
const listenEarthQuestion = choiceQuestion({
  id: 'first-play.listen-find.earth',
  promptText: 'Find Earth.',
  options: [earth, sun],
  correctOptionId: 'earth',
  tier: 'first_play',
  conceptIds: ['universe.earth.planet'],
  knowledgeRefs: ['kr.universe.earth.type.planet']
});
const fullEmptyQuestion = choiceQuestion({
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
    item: dog,
    spokenLabel: 'Dog'
  },
  {
    id: 'first-play.touch.bell',
    kind: 'touch_discover',
    stage: 'fp0_touch_discover',
    evidenceClass: 'exploration',
    promptText: 'Touch the bell.',
    reactionEvent: 'mischief',
    item: bell,
    spokenLabel: 'Bell'
  },
  {
    id: 'first-play.listen.dog',
    kind: 'listen_find',
    stage: 'fp1_listen_find',
    evidenceClass: 'guided_practice',
    promptText: listenDogQuestion.prompt.text,
    reactionEvent: 'celebrate',
    question: listenDogQuestion,
    semanticPlan: {
      schemaVersion: 1,
      presentationTier: 'first_play',
      targetSemanticRef: 'dog',
      comparisonDimensionRef: 'dimension.animals.reviewed-home-subject',
      candidates: [
        { semanticRef: 'dog', contrastBasisRef: 'kr.animals.dog.home.kennel' },
        { semanticRef: 'cow', contrastBasisRef: 'kr.animals.cow.home.shed' }
      ]
    }
  },
  {
    id: 'first-play.listen.earth',
    kind: 'listen_find',
    stage: 'fp1_listen_find',
    evidenceClass: 'guided_practice',
    promptText: listenEarthQuestion.prompt.text,
    reactionEvent: 'celebrate',
    question: listenEarthQuestion,
    semanticPlan: {
      schemaVersion: 1,
      presentationTier: 'first_play',
      targetSemanticRef: 'earth',
      comparisonDimensionRef: 'dimension.universe.object-identity',
      candidates: [
        { semanticRef: 'earth', contrastBasisRef: 'kr.universe.earth.type.planet' },
        { semanticRef: 'sun', contrastBasisRef: 'kr.universe.sun.type.star' }
      ]
    }
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
      item: { ...dog, id: 'moving-dog' },
      targets: [
        { ...dog, id: 'dog-target', label: 'Dog match' },
        { ...cow, id: 'cow-target', label: 'Cow' }
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
      item: { ...apple, id: 'moving-apple' },
      targets: [
        { ...orange, id: 'orange-target', label: 'Orange' },
        { ...apple, id: 'apple-target', label: 'Apple match' }
      ],
      correctTargetId: 'apple-target'
    })
  },
  {
    id: 'first-play.contrast.full-empty',
    kind: 'semantic_contrast',
    stage: 'fp4_concrete_concept',
    evidenceClass: 'guided_practice',
    promptText: fullEmptyQuestion.prompt.text,
    reactionEvent: 'celebrate',
    question: fullEmptyQuestion,
    states: [
      { optionId: 'full', state: 'full' },
      { optionId: 'empty', state: 'empty' }
    ],
    comparisonDimensionRef: 'kr.vocab.state.full.contrasts-with-empty'
  },
  {
    id: 'first-play.cause-effect.fill-bucket',
    kind: 'cause_effect',
    stage: 'fp3_put_sort_build',
    evidenceClass: 'exploration',
    promptText: 'Touch the empty bucket.',
    reactionEvent: 'change',
    beforeState: 'empty',
    afterState: 'full',
    action: {
      schemaVersion: 1,
      actionId: 'first-play.fill-bucket',
      family: 'cause_effect',
      action: 'fill',
      canonicalGoalRefs: ['kr.vocab.state.full.contrasts-with-empty'],
      subjectSemanticRefs: ['bucket'],
      targetSemanticRefs: ['water'],
      stateTransition: {
        beforeStateRef: 'semantic.container.empty',
        afterStateRef: 'semantic.container.full',
        causalKnowledgeRef: 'kr.vocab.state.full.describes-container-content'
      },
      evidenceClass: 'exploration',
      retryPolicy: 'not_applicable'
    }
  }
] as const;

function visualReasoningChoice({
  id,
  semanticFamily,
  promptText,
  target,
  candidates,
  comparisonDimensionRef
}: {
  id: string;
  semanticFamily: string;
  promptText: string;
  target: PresentableItem;
  candidates: Array<{ item: PresentableItem; evidenceRef: string }>;
  comparisonDimensionRef: string;
}): VisualReasoningActivity {
  const question = choiceQuestion({
    id: `${id}.question`,
    promptText,
    options: candidates.map((candidate) => candidate.item),
    correctOptionId: target.id,
    tier: 'preschool',
    labels: 'secondary'
  });
  return {
    id,
    kind: 'visual_scene_choice',
    semanticFamily,
    promptText,
    question,
    semanticPlan: {
      schemaVersion: 1,
      presentationTier: 'preschool',
      targetSemanticRef: target.id,
      comparisonDimensionRef,
      candidates: candidates.map((candidate) => ({
        semanticRef: candidate.item.id,
        contrastBasisRef: candidate.evidenceRef
      }))
    }
  };
}

function oddOneOut({
  id,
  semanticFamily,
  promptText = "Which one doesn't belong?",
  comparisonDimensionRef,
  candidates
}: {
  id: string;
  semanticFamily: string;
  promptText?: string;
  comparisonDimensionRef: string;
  candidates: Array<{ item: PresentableItem; satisfiesRule: boolean; evidenceRef: string }>;
}): VisualReasoningActivity {
  const odd = candidates.filter((candidate) => !candidate.satisfiesRule);
  if (odd.length !== 1) throw new Error(`${id}: production odd-one-out requires exactly one odd item`);
  const plan: ProductionOddOneOutPlan = {
    schemaVersion: 1,
    comparisonDimensionRef,
    candidates: candidates.map((candidate) => ({
      semanticRef: candidate.item.id,
      satisfiesRule: candidate.satisfiesRule,
      comparisonEvidenceRef: candidate.evidenceRef
    }))
  };
  return {
    id,
    kind: 'odd_one_out',
    semanticFamily,
    promptText,
    question: choiceQuestion({
      id: `${id}.question`,
      promptText,
      options: candidates.map((candidate) => candidate.item),
      correctOptionId: odd[0].item.id,
      tier: 'preschool',
      labels: 'secondary'
    }),
    oddOneOutPlan: plan
  };
}

export const VISUAL_SCENE_CHOICE_ACTIVITIES: readonly VisualReasoningActivity[] = [
  visualReasoningChoice({
    id: 'visual-choice.animals.dog',
    semanticFamily: 'animals',
    promptText: 'Find the dog.',
    target: dog,
    comparisonDimensionRef: 'dimension.animals.reviewed-home-subject',
    candidates: [
      { item: dog, evidenceRef: 'kr.animals.dog.home.kennel' },
      { item: cow, evidenceRef: 'kr.animals.cow.home.shed' },
      { item: rabbit, evidenceRef: 'kr.animals.rabbit.home.burrow' }
    ]
  }),
  visualReasoningChoice({
    id: 'visual-choice.transport.bus',
    semanticFamily: 'transport',
    promptText: 'Find the bus.',
    target: bus,
    comparisonDimensionRef: 'dimension.transport.mode',
    candidates: [
      { item: bus, evidenceRef: 'kr.transport.bus.mode.road' },
      { item: train, evidenceRef: 'kr.transport.train.mode.rail' },
      { item: ship, evidenceRef: 'kr.transport.ship.mode.water' },
      { item: aeroplane, evidenceRef: 'kr.transport.aeroplane.mode.air' }
    ]
  }),
  visualReasoningChoice({
    id: 'visual-choice.body.eyes',
    semanticFamily: 'human-senses',
    promptText: 'Find the eyes.',
    target: eyes,
    comparisonDimensionRef: 'dimension.human.sense-organ',
    candidates: [
      { item: eyes, evidenceRef: 'kr.human.eyes.sense.sight' },
      { item: ears, evidenceRef: 'kr.human.ears.sense.hearing' },
      { item: nose, evidenceRef: 'kr.human.nose.sense.smell' },
      { item: tongue, evidenceRef: 'kr.human.tongue.sense.taste' }
    ]
  }),
  visualReasoningChoice({
    id: 'visual-choice.communication.telephone',
    semanticFamily: 'communication',
    promptText: 'Find the telephone.',
    target: telephone,
    comparisonDimensionRef: 'dimension.communication.method',
    candidates: [
      { item: telephone, evidenceRef: 'kr.communication.telephone.use.voice' },
      { item: radio, evidenceRef: 'kr.communication.radio.use.audio' },
      { item: newspaper, evidenceRef: 'kr.communication.newspaper.use.news' },
      { item: television, evidenceRef: 'kr.communication.television.use.av' }
    ]
  }),
  visualReasoningChoice({
    id: 'visual-choice.plants.lotus',
    semanticFamily: 'plants',
    promptText: 'Find the lotus.',
    target: lotus,
    comparisonDimensionRef: 'dimension.plants.type',
    candidates: [
      { item: pea, evidenceRef: 'kr.plants.pea.type.climber' },
      { item: pumpkin, evidenceRef: 'kr.plants.pumpkin.type.creeper' },
      { item: lotus, evidenceRef: 'kr.plants.lotus.type.aquatic' }
    ]
  }),
  visualReasoningChoice({
    id: 'visual-choice.food-source.honeybee',
    semanticFamily: 'food-sources',
    promptText: 'Find the honeybee.',
    target: bee,
    comparisonDimensionRef: 'dimension.food.source-subject',
    candidates: [
      { item: cow, evidenceRef: 'kr.food.cow.source.milk' },
      { item: bee, evidenceRef: 'kr.food.honeybee.source.honey' },
      { item: wheat, evidenceRef: 'kr.food.wheat.source.flour' }
    ]
  })
] as const;

export const ODD_ONE_OUT_ACTIVITIES: readonly VisualReasoningActivity[] = [
  oddOneOut({
    id: 'odd-one-out.transport',
    semanticFamily: 'transport',
    comparisonDimensionRef: 'dimension.transport.role',
    candidates: [
      { item: bus, satisfiesRule: true, evidenceRef: 'kr.transport.bus.mode.road' },
      { item: train, satisfiesRule: true, evidenceRef: 'kr.transport.train.mode.rail' },
      { item: ship, satisfiesRule: true, evidenceRef: 'kr.transport.ship.mode.water' },
      { item: telephone, satisfiesRule: false, evidenceRef: 'kr.communication.telephone.use.voice' }
    ]
  }),
  oddOneOut({
    id: 'odd-one-out.communication',
    semanticFamily: 'communication',
    comparisonDimensionRef: 'dimension.communication.role',
    candidates: [
      { item: telephone, satisfiesRule: true, evidenceRef: 'kr.communication.telephone.use.voice' },
      { item: radio, satisfiesRule: true, evidenceRef: 'kr.communication.radio.use.audio' },
      { item: newspaper, satisfiesRule: true, evidenceRef: 'kr.communication.newspaper.use.news' },
      { item: bus, satisfiesRule: false, evidenceRef: 'kr.transport.bus.mode.road' }
    ]
  }),
  oddOneOut({
    id: 'odd-one-out.senses',
    semanticFamily: 'human-senses',
    comparisonDimensionRef: 'dimension.human.sense-function',
    candidates: [
      { item: eyes, satisfiesRule: true, evidenceRef: 'kr.human.eyes.sense.sight' },
      { item: ears, satisfiesRule: true, evidenceRef: 'kr.human.ears.sense.hearing' },
      { item: nose, satisfiesRule: true, evidenceRef: 'kr.human.nose.sense.smell' },
      { item: teeth, satisfiesRule: false, evidenceRef: 'kr.human.teeth.action.chew' }
    ]
  }),
  oddOneOut({
    id: 'odd-one-out.plants',
    semanticFamily: 'plants',
    comparisonDimensionRef: 'dimension.plants.is-a',
    candidates: [
      { item: pea, satisfiesRule: true, evidenceRef: 'kr.plants.pea.type.climber' },
      { item: pumpkin, satisfiesRule: true, evidenceRef: 'kr.plants.pumpkin.type.creeper' },
      { item: lotus, satisfiesRule: true, evidenceRef: 'kr.plants.lotus.type.aquatic' },
      { item: bus, satisfiesRule: false, evidenceRef: 'kr.transport.bus.mode.road' }
    ]
  }),
  oddOneOut({
    id: 'odd-one-out.food-sources',
    semanticFamily: 'food-sources',
    comparisonDimensionRef: 'dimension.food.source-relation',
    candidates: [
      { item: cow, satisfiesRule: true, evidenceRef: 'kr.food.cow.source.milk' },
      { item: bee, satisfiesRule: true, evidenceRef: 'kr.food.honeybee.source.honey' },
      { item: wheat, satisfiesRule: true, evidenceRef: 'kr.food.wheat.source.flour' },
      { item: telephone, satisfiesRule: false, evidenceRef: 'kr.communication.telephone.use.voice' }
    ]
  }),
  oddOneOut({
    id: 'odd-one-out.animal-features',
    semanticFamily: 'animal-features',
    comparisonDimensionRef: 'dimension.animals.reviewed-feature',
    candidates: [
      { item: fish, satisfiesRule: true, evidenceRef: 'kr.animals.fish.covering.scales' },
      { item: bird, satisfiesRule: true, evidenceRef: 'kr.animals.bird.covering.feathers' },
      { item: duck, satisfiesRule: true, evidenceRef: 'kr.animals.duck.feature.webbed-feet' },
      { item: bus, satisfiesRule: false, evidenceRef: 'kr.transport.bus.mode.road' }
    ]
  })
] as const;

export const VISUAL_REASONING_ACTIVITIES: readonly VisualReasoningActivity[] = [
  ...VISUAL_SCENE_CHOICE_ACTIVITIES,
  ...ODD_ONE_OUT_ACTIVITIES
];

function assertStableEvidenceRef(value: string, context: string): void {
  if (!value.trim() || /\s/.test(value)) throw new Error(`${context} must be a stable evidence ref`);
}

export function validateFirstPlayProductionActivity(activity: FirstPlayActivity): void {
  const action = activity.kind === 'touch_discover'
    ? 'tap'
    : activity.kind === 'listen_find'
      ? 'find'
      : activity.kind === 'place_match'
        ? 'place'
        : activity.kind === 'semantic_contrast'
          ? 'find'
          : 'observe_change';
  const initialChoiceCount = activity.kind === 'listen_find'
    ? activity.question.interaction.options.length
    : activity.kind === 'semantic_contrast'
      ? activity.question.interaction.options.length
      : activity.kind === 'place_match'
        ? activity.question.interaction.targets.length
        : 0;

  validateFirstPlayRecipePolicy({
    stage: activity.stage,
    evidenceClass: activity.evidenceClass,
    readingRequired: false,
    instructionSteps: 1,
    initialChoiceCount,
    primaryTargetScale: 'oversized',
    wrongActionRecovery: 'in_place',
    requiresSeparateSubmitAfterCommittedAction: false,
    action
  });

  if (activity.kind === 'listen_find') {
    validateSemanticChoicePlan(activity.semanticPlan);
    if (activity.question.interaction.presentation?.tier !== 'first_play') {
      throw new Error(`${activity.id}: Listen & Find must use first_play visual presentation`);
    }
  }
  if (activity.kind === 'place_match' && activity.dropSnapTolerancePx < 32) {
    throw new Error(`${activity.id}: First Play placement tolerance must be materially forgiving`);
  }
  if (activity.kind === 'semantic_contrast') {
    assertStableEvidenceRef(activity.comparisonDimensionRef, `${activity.id}.comparisonDimensionRef`);
    if (activity.states.length !== 2 || new Set(activity.states.map((state) => state.state)).size !== 2) {
      throw new Error(`${activity.id}: concrete contrast must show exactly two distinct semantic states`);
    }
  }
  if (activity.kind === 'cause_effect') {
    validateWorldActionDefinition(activity.action);
    if (activity.beforeState === activity.afterState) {
      throw new Error(`${activity.id}: cause/effect must visibly change semantic state`);
    }
  }
}

export function validateVisualReasoningActivity(activity: VisualReasoningActivity): void {
  if (activity.question.interaction.type !== 'single_choice') {
    throw new Error(`${activity.id}: visual reasoning must reuse single_choice`);
  }
  if (!activity.question.interaction.shuffleOptions) {
    throw new Error(`${activity.id}: visible correct position must be shuffled`);
  }
  if (activity.question.interaction.presentation?.mode !== 'visual_dominant') {
    throw new Error(`${activity.id}: visual reasoning must use visual_dominant presentation`);
  }
  if (activity.kind === 'visual_scene_choice') {
    if (!activity.semanticPlan) throw new Error(`${activity.id}: semantic choice plan is required`);
    validateSemanticChoicePlan(activity.semanticPlan);
  } else {
    if (!activity.oddOneOutPlan) throw new Error(`${activity.id}: odd-one-out plan is required`);
    const resolved = resolveOddOneOutPlan(activity.oddOneOutPlan);
    const correctId = activity.question.solution.correctOptionIds[0];
    if (resolved.oddSemanticRef !== correctId) {
      throw new Error(`${activity.id}: odd-one-out answer must match the declared semantic outlier`);
    }
    for (const candidate of activity.oddOneOutPlan.candidates) {
      assertStableEvidenceRef(candidate.comparisonEvidenceRef, `${activity.id}.${candidate.semanticRef}.comparisonEvidenceRef`);
    }
  }
}

export function evaluateFirstPlayQuestion(
  activity: ListenFindActivity | PlaceMatchActivity | ContrastActivity,
  response: unknown
): { result: EvaluationResult; feedback: FirstPlayFeedbackMode } {
  const result = applyFirstPlayEvidencePolicy(activity.evidenceClass, evaluate(activity.question, response));
  return { result, feedback: resolveFirstPlayFeedback(activity.evidenceClass, result) };
}

export function visualCorrectPositionsAcrossSeeds(activity: VisualReasoningActivity, seeds: readonly number[]): number[] {
  const correctId = activity.question.solution.correctOptionIds[0];
  return seeds.map((seed) => shuffled(
    activity.question.interaction.options,
    createSeededRandom(seed)
  ).findIndex((option) => option.id === correctId));
}
