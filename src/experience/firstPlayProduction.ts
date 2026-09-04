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
  states: ReadonlyArray<{ optionId: string; state: ContainerState }>;
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
const v = (id: string, label: string, visualRef: string): PresentableItem => ({ id, label, semanticRef: id, visualRefs: [visualRef] });

const visual = {
  dog: v('dog', 'Dog', 'entity.animal.dog'),
  cow: v('cow', 'Cow', 'entity.animal.cow'),
  rabbit: v('rabbit', 'Rabbit', 'entity.animal.rabbit'),
  bell: v('bell', 'Bell', 'entity.school.bell'),
  earth: v('earth', 'Earth', 'entity.universe.earth'),
  sun: v('sun', 'Sun', 'entity.nature.sun'),
  apple: v('apple', 'Apple', 'entity.food.apple'),
  orange: v('orange', 'Orange', 'entity.food.orange'),
  bus: v('bus', 'Bus', 'entity.transport.bus'),
  train: v('train', 'Train', 'entity.transport.train'),
  ship: v('ship', 'Ship', 'entity.transport.ship'),
  aeroplane: v('aeroplane', 'Aeroplane', 'entity.transport.aeroplane'),
  telephone: v('telephone', 'Telephone', 'entity.communication.telephone'),
  radio: v('radio', 'Radio', 'entity.communication.radio'),
  newspaper: v('newspaper', 'Newspaper', 'entity.communication.newspaper'),
  television: v('television', 'Television', 'entity.communication.television'),
  eyes: v('eyes', 'Eyes', 'entity.body.eyes'),
  ears: v('ears', 'Ears', 'entity.body.ears'),
  nose: v('nose', 'Nose', 'entity.body.nose'),
  tongue: v('tongue', 'Tongue', 'entity.body.tongue'),
  teeth: v('teeth', 'Teeth', 'entity.body.teeth'),
  pea: v('pea', 'Pea plant', 'entity.plant.pea'),
  pumpkin: v('pumpkin', 'Pumpkin plant', 'entity.plant.pumpkin'),
  lotus: v('lotus', 'Lotus', 'entity.plant.lotus'),
  honeybee: v('honeybee', 'Honeybee', 'entity.animal.bee'),
  wheat: v('wheat', 'Wheat', 'entity.food.wheat'),
  fish: v('fish', 'Fish', 'entity.animal.fish'),
  bird: v('bird', 'Bird', 'entity.animal.bird'),
  duck: v('duck', 'Duck', 'entity.animal.duck')
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

const listenDogQuestion = choiceQuestion({
  id: 'first-play.listen-find.dog', promptText: 'Where is the dog?', options: [visual.dog, visual.cow],
  correctOptionId: 'dog', tier: 'first_play'
});
const listenEarthQuestion = choiceQuestion({
  id: 'first-play.listen-find.earth', promptText: 'Find Earth.', options: [visual.earth, visual.sun],
  correctOptionId: 'earth', tier: 'first_play', conceptIds: ['universe.earth.planet'],
  knowledgeRefs: ['kr.universe.earth.type.planet']
});
const fullEmptyQuestion = choiceQuestion({
  id: 'first-play.contrast.full-empty', promptText: 'Touch the full bucket.',
  options: [{ id: 'full', label: 'Full bucket', semanticRef: 'full' }, { id: 'empty', label: 'Empty bucket', semanticRef: 'empty' }],
  correctOptionId: 'full', tier: 'first_play',
  conceptIds: ['vocabulary.state.full', 'vocabulary.state.empty', 'vocabulary.container.amount'],
  knowledgeRefs: ['kr.vocab.state.full.contrasts-with-empty']
});

export const FIRST_PLAY_ACTIVITIES: readonly FirstPlayActivity[] = [
  { id: 'first-play.touch.dog', kind: 'touch_discover', stage: 'fp0_touch_discover', evidenceClass: 'exploration', promptText: 'Touch the dog.', reactionEvent: 'discover', item: visual.dog, spokenLabel: 'Dog' },
  { id: 'first-play.touch.bell', kind: 'touch_discover', stage: 'fp0_touch_discover', evidenceClass: 'exploration', promptText: 'Touch the bell.', reactionEvent: 'mischief', item: visual.bell, spokenLabel: 'Bell' },
  {
    id: 'first-play.listen.dog', kind: 'listen_find', stage: 'fp1_listen_find', evidenceClass: 'guided_practice',
    promptText: listenDogQuestion.prompt.text, reactionEvent: 'celebrate', question: listenDogQuestion,
    semanticPlan: { schemaVersion: 1, presentationTier: 'first_play', targetSemanticRef: 'dog', comparisonDimensionRef: 'dimension.animals.reviewed-home-subject', candidates: [
      { semanticRef: 'dog', contrastBasisRef: 'kr.animals.dog.home.kennel' },
      { semanticRef: 'cow', contrastBasisRef: 'kr.animals.cow.home.shed' }
    ] }
  },
  {
    id: 'first-play.listen.earth', kind: 'listen_find', stage: 'fp1_listen_find', evidenceClass: 'guided_practice',
    promptText: listenEarthQuestion.prompt.text, reactionEvent: 'celebrate', question: listenEarthQuestion,
    semanticPlan: { schemaVersion: 1, presentationTier: 'first_play', targetSemanticRef: 'earth', comparisonDimensionRef: 'dimension.universe.object-identity', candidates: [
      { semanticRef: 'earth', contrastBasisRef: 'kr.universe.earth.type.planet' },
      { semanticRef: 'sun', contrastBasisRef: 'kr.universe.sun.type.star' }
    ] }
  },
  {
    id: 'first-play.place.dog', kind: 'place_match', stage: 'fp2_match_relation', evidenceClass: 'guided_practice',
    promptText: 'Put the dog with the dog.', reactionEvent: 'celebrate', dropSnapTolerancePx: 40,
    question: dragQuestion({ id: 'first-play.place.dog.question', promptText: 'Put the dog with the dog.', item: { ...visual.dog, id: 'moving-dog' }, targets: [
      { ...visual.dog, id: 'dog-target', label: 'Dog match' }, { ...visual.cow, id: 'cow-target', label: 'Cow' }
    ], correctTargetId: 'dog-target' })
  },
  {
    id: 'first-play.place.apple', kind: 'place_match', stage: 'fp2_match_relation', evidenceClass: 'guided_practice',
    promptText: 'Put the apple with the apple.', reactionEvent: 'celebrate', dropSnapTolerancePx: 40,
    question: dragQuestion({ id: 'first-play.place.apple.question', promptText: 'Put the apple with the apple.', item: { ...visual.apple, id: 'moving-apple' }, targets: [
      { ...visual.orange, id: 'orange-target', label: 'Orange' }, { ...visual.apple, id: 'apple-target', label: 'Apple match' }
    ], correctTargetId: 'apple-target' })
  },
  {
    id: 'first-play.contrast.full-empty', kind: 'semantic_contrast', stage: 'fp4_concrete_concept', evidenceClass: 'guided_practice',
    promptText: fullEmptyQuestion.prompt.text, reactionEvent: 'celebrate', question: fullEmptyQuestion,
    states: [{ optionId: 'full', state: 'full' }, { optionId: 'empty', state: 'empty' }],
    comparisonDimensionRef: 'kr.vocab.state.full.contrasts-with-empty'
  },
  {
    id: 'first-play.cause-effect.fill-bucket', kind: 'cause_effect', stage: 'fp3_put_sort_build', evidenceClass: 'exploration',
    promptText: 'Touch the empty bucket.', reactionEvent: 'change', beforeState: 'empty', afterState: 'full',
    action: {
      schemaVersion: 1, actionId: 'first-play.fill-bucket', family: 'cause_effect', action: 'fill',
      canonicalGoalRefs: ['kr.vocab.state.full.contrasts-with-empty'], subjectSemanticRefs: ['bucket'], targetSemanticRefs: ['water'],
      stateTransition: { beforeStateRef: 'semantic.container.empty', afterStateRef: 'semantic.container.full', causalKnowledgeRef: 'kr.vocab.state.full.describes-container-content' },
      evidenceClass: 'exploration', retryPolicy: 'not_applicable'
    }
  }
] as const;

type Candidate = { item: PresentableItem; evidenceRef: string };
type OddCandidate = Candidate & { satisfiesRule: boolean };

function visualReasoningChoice(input: {
  id: string; semanticFamily: string; promptText: string; target: PresentableItem;
  candidates: Candidate[]; comparisonDimensionRef: string;
}): VisualReasoningActivity {
  const question = choiceQuestion({ id: `${input.id}.question`, promptText: input.promptText, options: input.candidates.map((c) => c.item), correctOptionId: input.target.id, tier: 'preschool' });
  return {
    id: input.id, kind: 'visual_scene_choice', semanticFamily: input.semanticFamily, promptText: input.promptText, question,
    semanticPlan: {
      schemaVersion: 1, presentationTier: 'preschool', targetSemanticRef: input.target.id,
      comparisonDimensionRef: input.comparisonDimensionRef,
      candidates: input.candidates.map((c) => ({ semanticRef: c.item.id, contrastBasisRef: c.evidenceRef }))
    }
  };
}

function oddOneOut(input: {
  id: string; semanticFamily: string; comparisonDimensionRef: string; candidates: OddCandidate[]; promptText?: string;
}): VisualReasoningActivity {
  const odd = input.candidates.filter((candidate) => !candidate.satisfiesRule);
  if (odd.length !== 1) throw new Error(`${input.id}: production odd-one-out requires exactly one odd item`);
  const promptText = input.promptText ?? "Which one doesn't belong?";
  return {
    id: input.id, kind: 'odd_one_out', semanticFamily: input.semanticFamily, promptText,
    question: choiceQuestion({ id: `${input.id}.question`, promptText, options: input.candidates.map((c) => c.item), correctOptionId: odd[0].item.id, tier: 'preschool' }),
    oddOneOutPlan: {
      schemaVersion: 1, comparisonDimensionRef: input.comparisonDimensionRef,
      candidates: input.candidates.map((c) => ({ semanticRef: c.item.id, satisfiesRule: c.satisfiesRule, comparisonEvidenceRef: c.evidenceRef }))
    }
  };
}

export const VISUAL_SCENE_CHOICE_ACTIVITIES: readonly VisualReasoningActivity[] = [
  visualReasoningChoice({ id: 'visual-choice.animals.dog', semanticFamily: 'animals', promptText: 'Find the dog.', target: visual.dog, comparisonDimensionRef: 'dimension.animals.reviewed-home-subject', candidates: [
    { item: visual.dog, evidenceRef: 'kr.animals.dog.home.kennel' }, { item: visual.cow, evidenceRef: 'kr.animals.cow.home.shed' }, { item: visual.rabbit, evidenceRef: 'kr.animals.rabbit.home.burrow' }
  ] }),
  visualReasoningChoice({ id: 'visual-choice.transport.bus', semanticFamily: 'transport', promptText: 'Find the bus.', target: visual.bus, comparisonDimensionRef: 'dimension.transport.mode', candidates: [
    { item: visual.bus, evidenceRef: 'kr.transport.bus.mode.road' }, { item: visual.train, evidenceRef: 'kr.transport.train.mode.rail' }, { item: visual.ship, evidenceRef: 'kr.transport.ship.mode.water' }, { item: visual.aeroplane, evidenceRef: 'kr.transport.aeroplane.mode.air' }
  ] }),
  visualReasoningChoice({ id: 'visual-choice.body.eyes', semanticFamily: 'human-senses', promptText: 'Find the eyes.', target: visual.eyes, comparisonDimensionRef: 'dimension.human.sense-organ', candidates: [
    { item: visual.eyes, evidenceRef: 'kr.human.eyes.sense.sight' }, { item: visual.ears, evidenceRef: 'kr.human.ears.sense.hearing' }, { item: visual.nose, evidenceRef: 'kr.human.nose.sense.smell' }, { item: visual.tongue, evidenceRef: 'kr.human.tongue.sense.taste' }
  ] }),
  visualReasoningChoice({ id: 'visual-choice.communication.telephone', semanticFamily: 'communication', promptText: 'Find the telephone.', target: visual.telephone, comparisonDimensionRef: 'dimension.communication.method', candidates: [
    { item: visual.telephone, evidenceRef: 'kr.communication.telephone.use.voice' }, { item: visual.radio, evidenceRef: 'kr.communication.radio.use.audio' }, { item: visual.newspaper, evidenceRef: 'kr.communication.newspaper.use.news' }, { item: visual.television, evidenceRef: 'kr.communication.television.use.av' }
  ] }),
  visualReasoningChoice({ id: 'visual-choice.plants.lotus', semanticFamily: 'plants', promptText: 'Find the lotus.', target: visual.lotus, comparisonDimensionRef: 'dimension.plants.type', candidates: [
    { item: visual.pea, evidenceRef: 'kr.plants.pea.type.climber' }, { item: visual.pumpkin, evidenceRef: 'kr.plants.pumpkin.type.creeper' }, { item: visual.lotus, evidenceRef: 'kr.plants.lotus.type.aquatic' }
  ] }),
  visualReasoningChoice({ id: 'visual-choice.food-source.honeybee', semanticFamily: 'food-sources', promptText: 'Find the honeybee.', target: visual.honeybee, comparisonDimensionRef: 'dimension.food.source-subject', candidates: [
    { item: visual.cow, evidenceRef: 'kr.food.cow.source.milk' }, { item: visual.honeybee, evidenceRef: 'kr.food.honeybee.source.honey' }, { item: visual.wheat, evidenceRef: 'kr.food.wheat.source.flour' }
  ] })
] as const;

export const ODD_ONE_OUT_ACTIVITIES: readonly VisualReasoningActivity[] = [
  oddOneOut({ id: 'odd-one-out.transport', semanticFamily: 'transport', comparisonDimensionRef: 'dimension.transport.role', candidates: [
    { item: visual.bus, satisfiesRule: true, evidenceRef: 'kr.transport.bus.mode.road' }, { item: visual.train, satisfiesRule: true, evidenceRef: 'kr.transport.train.mode.rail' }, { item: visual.ship, satisfiesRule: true, evidenceRef: 'kr.transport.ship.mode.water' }, { item: visual.telephone, satisfiesRule: false, evidenceRef: 'kr.communication.telephone.use.voice' }
  ] }),
  oddOneOut({ id: 'odd-one-out.communication', semanticFamily: 'communication', comparisonDimensionRef: 'dimension.communication.role', candidates: [
    { item: visual.telephone, satisfiesRule: true, evidenceRef: 'kr.communication.telephone.use.voice' }, { item: visual.radio, satisfiesRule: true, evidenceRef: 'kr.communication.radio.use.audio' }, { item: visual.newspaper, satisfiesRule: true, evidenceRef: 'kr.communication.newspaper.use.news' }, { item: visual.bus, satisfiesRule: false, evidenceRef: 'kr.transport.bus.mode.road' }
  ] }),
  oddOneOut({ id: 'odd-one-out.senses', semanticFamily: 'human-senses', comparisonDimensionRef: 'dimension.human.sense-function', candidates: [
    { item: visual.eyes, satisfiesRule: true, evidenceRef: 'kr.human.eyes.sense.sight' }, { item: visual.ears, satisfiesRule: true, evidenceRef: 'kr.human.ears.sense.hearing' }, { item: visual.nose, satisfiesRule: true, evidenceRef: 'kr.human.nose.sense.smell' }, { item: visual.teeth, satisfiesRule: false, evidenceRef: 'kr.human.teeth.action.chew' }
  ] }),
  oddOneOut({ id: 'odd-one-out.plants', semanticFamily: 'plants', comparisonDimensionRef: 'dimension.plants.is-a', candidates: [
    { item: visual.pea, satisfiesRule: true, evidenceRef: 'kr.plants.pea.type.climber' }, { item: visual.pumpkin, satisfiesRule: true, evidenceRef: 'kr.plants.pumpkin.type.creeper' }, { item: visual.lotus, satisfiesRule: true, evidenceRef: 'kr.plants.lotus.type.aquatic' }, { item: visual.bus, satisfiesRule: false, evidenceRef: 'kr.transport.bus.mode.road' }
  ] }),
  oddOneOut({ id: 'odd-one-out.food-sources', semanticFamily: 'food-sources', comparisonDimensionRef: 'dimension.food.source-relation', candidates: [
    { item: visual.cow, satisfiesRule: true, evidenceRef: 'kr.food.cow.source.milk' }, { item: visual.honeybee, satisfiesRule: true, evidenceRef: 'kr.food.honeybee.source.honey' }, { item: visual.wheat, satisfiesRule: true, evidenceRef: 'kr.food.wheat.source.flour' }, { item: visual.telephone, satisfiesRule: false, evidenceRef: 'kr.communication.telephone.use.voice' }
  ] }),
  oddOneOut({ id: 'odd-one-out.animal-features', semanticFamily: 'animal-features', comparisonDimensionRef: 'dimension.animals.reviewed-feature', candidates: [
    { item: visual.fish, satisfiesRule: true, evidenceRef: 'kr.animals.fish.covering.scales' }, { item: visual.bird, satisfiesRule: true, evidenceRef: 'kr.animals.bird.covering.feathers' }, { item: visual.duck, satisfiesRule: true, evidenceRef: 'kr.animals.duck.feature.webbed-feet' }, { item: visual.bus, satisfiesRule: false, evidenceRef: 'kr.transport.bus.mode.road' }
  ] })
] as const;

export const VISUAL_REASONING_ACTIVITIES: readonly VisualReasoningActivity[] = [
  ...VISUAL_SCENE_CHOICE_ACTIVITIES,
  ...ODD_ONE_OUT_ACTIVITIES
];

function assertStableEvidenceRef(value: string, context: string): void {
  if (!value.trim() || /\s/.test(value)) throw new Error(`${context} must be a stable evidence ref`);
}

export function validateFirstPlayProductionActivity(activity: FirstPlayActivity): void {
  const action = activity.kind === 'touch_discover' ? 'tap'
    : activity.kind === 'listen_find' ? 'find'
      : activity.kind === 'place_match' ? 'place'
        : activity.kind === 'semantic_contrast' ? 'find'
          : 'observe_change';
  const initialChoiceCount = activity.kind === 'listen_find' || activity.kind === 'semantic_contrast'
    ? activity.question.interaction.options.length
    : activity.kind === 'place_match' ? activity.question.interaction.targets.length : 0;

  validateFirstPlayRecipePolicy({
    stage: activity.stage, evidenceClass: activity.evidenceClass, readingRequired: false, instructionSteps: 1,
    initialChoiceCount, primaryTargetScale: 'oversized', wrongActionRecovery: 'in_place',
    requiresSeparateSubmitAfterCommittedAction: false, action
  });

  if (activity.kind === 'listen_find') {
    validateSemanticChoicePlan(activity.semanticPlan);
    if (activity.question.interaction.presentation?.tier !== 'first_play') throw new Error(`${activity.id}: Listen & Find must use first_play visual presentation`);
  }
  if (activity.kind === 'place_match' && activity.dropSnapTolerancePx < 32) throw new Error(`${activity.id}: First Play placement tolerance must be materially forgiving`);
  if (activity.kind === 'semantic_contrast') {
    assertStableEvidenceRef(activity.comparisonDimensionRef, `${activity.id}.comparisonDimensionRef`);
    if (activity.states.length !== 2 || new Set(activity.states.map((state) => state.state)).size !== 2) throw new Error(`${activity.id}: concrete contrast must show exactly two distinct semantic states`);
  }
  if (activity.kind === 'cause_effect') {
    validateWorldActionDefinition(activity.action);
    if (activity.beforeState === activity.afterState) throw new Error(`${activity.id}: cause/effect must visibly change semantic state`);
  }
}

export function validateVisualReasoningActivity(activity: VisualReasoningActivity): void {
  if (!activity.question.interaction.shuffleOptions) throw new Error(`${activity.id}: visible correct position must be shuffled`);
  if (activity.question.interaction.presentation?.mode !== 'visual_dominant') throw new Error(`${activity.id}: visual reasoning must use visual_dominant presentation`);
  if (activity.kind === 'visual_scene_choice') {
    if (!activity.semanticPlan) throw new Error(`${activity.id}: semantic choice plan is required`);
    validateSemanticChoicePlan(activity.semanticPlan);
    return;
  }
  if (!activity.oddOneOutPlan) throw new Error(`${activity.id}: odd-one-out plan is required`);
  const resolved = resolveOddOneOutPlan(activity.oddOneOutPlan);
  if (resolved.oddSemanticRef !== activity.question.solution.correctOptionIds[0]) throw new Error(`${activity.id}: odd-one-out answer must match the declared semantic outlier`);
  for (const candidate of activity.oddOneOutPlan.candidates) assertStableEvidenceRef(candidate.comparisonEvidenceRef, `${activity.id}.${candidate.semanticRef}.comparisonEvidenceRef`);
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
  return seeds.map((seed) => shuffled(activity.question.interaction.options, createSeededRandom(seed)).findIndex((option) => option.id === correctId));
}
