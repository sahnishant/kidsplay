import type { DragToTargetQuestion, PresentableItem, SingleChoiceQuestion, SingleChoicePresentationTier } from '../contracts/question';
import type { EvaluationResult } from '../contracts/runtime';
import { evaluate } from '../evaluation/evaluate';
import { createSeededRandom, shuffled } from '../mechanics/random';
import { getStoryCharacterPersona } from '../story/storyPersona';
import type { StoryCharacterId } from '../story/storyTypes';
import { applyFirstPlayEvidencePolicy, resolveFirstPlayFeedback, type FirstPlayFeedbackMode } from './firstPlayRuntime';
import { validateFirstPlayRecipePolicy, type FirstPlayEvidenceClass, type FirstPlayStage } from './firstPlayPolicy';
import { resolveOddOneOutPlan, validateSemanticChoicePlan, type OddOneOutPlan, type SemanticChoicePlan } from './semanticChoiceSafety';
import { validateWorldActionDefinition, type WorldActionDefinition } from './worldActionContract';

export type FirstPlaySurfaceMode = 'first_play' | 'visual_reasoning';
export type FirstPlayReactionEvent = 'discover' | 'mischief' | 'scaffold' | 'change' | 'celebrate';
export type FirstPlayReactionMood = 'happy' | 'thinking' | 'mischievous' | 'celebrate' | 'ready';
export interface FirstPlayMicroReaction { character: StoryCharacterId; text: string; mood: FirstPlayReactionMood; }

const reactionGrammar: Record<FirstPlayReactionEvent, { character: StoryCharacterId; signatureIndex: number; suffix?: string; mood: FirstPlayReactionMood }> = {
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

interface FirstPlayActivityBase { id: string; stage: FirstPlayStage; evidenceClass: FirstPlayEvidenceClass; promptText: string; reactionEvent: FirstPlayReactionEvent; }
export interface TouchDiscoverActivity extends FirstPlayActivityBase { kind: 'touch_discover'; item: PresentableItem; spokenLabel: string; }
export interface ListenFindActivity extends FirstPlayActivityBase { kind: 'listen_find'; question: SingleChoiceQuestion; }
export interface PlaceMatchActivity extends FirstPlayActivityBase { kind: 'place_match'; question: DragToTargetQuestion; dropSnapTolerancePx: number; }
export interface LetterPictureActivity extends FirstPlayActivityBase { kind: 'letter_picture'; grapheme: string; question: SingleChoiceQuestion; }
export type ContainerState = 'empty' | 'full';
export interface ContrastActivity extends FirstPlayActivityBase { kind: 'semantic_contrast'; question: SingleChoiceQuestion; states: ReadonlyArray<{ optionId: string; state: ContainerState }>; }
export interface CauseEffectActivity extends FirstPlayActivityBase { kind: 'cause_effect'; beforeState: ContainerState; afterState: ContainerState; }
export type FirstPlayActivity = TouchDiscoverActivity | ListenFindActivity | PlaceMatchActivity | LetterPictureActivity | ContrastActivity | CauseEffectActivity;

export interface ProductionOddOneOutCandidate { semanticRef: string; satisfiesRule: boolean; comparisonEvidenceRef: string; }
export interface ProductionOddOneOutPlan extends Omit<OddOneOutPlan, 'candidates'> { candidates: readonly ProductionOddOneOutCandidate[]; }
export interface VisualReasoningActivity { id: string; kind: 'visual_scene_choice' | 'odd_one_out'; promptText: string; question: SingleChoiceQuestion; }
export interface VisualReasoningProof {
  semanticFamily: string;
  semanticPlan?: SemanticChoicePlan;
  oddOneOutPlan?: ProductionOddOneOutPlan;
}
export type FirstPlayProductionProof =
  | { kind: 'listen_find'; semanticPlan: SemanticChoicePlan }
  | { kind: 'letter_picture'; targetWord: string; associationKind: 'letter_name_to_word_initial' }
  | { kind: 'semantic_contrast'; comparisonDimensionRef: string }
  | { kind: 'cause_effect'; action: WorldActionDefinition };

const reviewedAuthoring = { status: 'reviewed' as const, source: 'kidsplay-first-play-visual-choice-production-v1' };
const v = (id: string, label: string, visualRef: string): PresentableItem => ({ id, label, semanticRef: id, visualRefs: [visualRef] });
const visual = {
  dog: v('dog', 'Dog', 'entity.animal.dog'), cow: v('cow', 'Cow', 'entity.animal.cow'), rabbit: v('rabbit', 'Rabbit', 'entity.animal.rabbit'), bell: v('bell', 'Bell', 'entity.school.bell'),
  earth: v('earth', 'Earth', 'entity.universe.earth'), sun: v('sun', 'Sun', 'entity.nature.sun'), apple: v('apple', 'Apple', 'entity.food.apple'), orange: v('orange', 'Orange', 'entity.food.orange'),
  bus: v('bus', 'Bus', 'entity.transport.bus'), train: v('train', 'Train', 'entity.transport.train'), ship: v('ship', 'Ship', 'entity.transport.ship'), aeroplane: v('aeroplane', 'Aeroplane', 'entity.transport.aeroplane'),
  telephone: v('telephone', 'Telephone', 'entity.communication.telephone'), radio: v('radio', 'Radio', 'entity.communication.radio'), newspaper: v('newspaper', 'Newspaper', 'entity.communication.newspaper'), television: v('television', 'Television', 'entity.communication.television'),
  eyes: v('eyes', 'Eyes', 'entity.body.eyes'), ears: v('ears', 'Ears', 'entity.body.ears'), nose: v('nose', 'Nose', 'entity.body.nose'), tongue: v('tongue', 'Tongue', 'entity.body.tongue'), teeth: v('teeth', 'Teeth', 'entity.body.teeth'),
  pea: v('pea', 'Pea plant', 'entity.plant.pea'), pumpkin: v('pumpkin', 'Pumpkin plant', 'entity.plant.pumpkin'), lotus: v('lotus', 'Lotus', 'entity.plant.lotus'), honeybee: v('honeybee', 'Honeybee', 'entity.animal.bee'),
  wheat: v('wheat', 'Wheat', 'entity.food.wheat'), fish: v('fish', 'Fish', 'entity.animal.fish'), bird: v('bird', 'Bird', 'entity.animal.bird'), duck: v('duck', 'Duck', 'entity.animal.duck')
} as const;

function choiceQuestion(input: { id: string; promptText: string; options: PresentableItem[]; correctOptionId: string; tier: SingleChoicePresentationTier; labels?: 'visible' | 'secondary' | 'hidden'; conceptIds?: string[]; knowledgeRefs?: string[] }): SingleChoiceQuestion {
  return {
    id: input.id, revision: 1, schemaVersion: 1, conceptIds: input.conceptIds ?? [], knowledgeRefs: input.knowledgeRefs ?? [], difficulty: input.tier === 'first_play' ? 1 : 2, language: 'en-IN',
    prompt: { text: input.promptText }, feedback: { correct: 'Yes!', incorrect: 'Try again.' }, authoring: reviewedAuthoring,
    interaction: { type: 'single_choice', version: 1, shuffleOptions: true, presentation: { mode: 'visual_dominant', tier: input.tier, labels: input.labels ?? (input.tier === 'first_play' ? 'hidden' : 'secondary') }, options: input.options },
    solution: { type: 'exact_option', correctOptionIds: [input.correctOptionId] }
  };
}
function dragQuestion(input: { id: string; promptText: string; item: PresentableItem; targets: PresentableItem[]; correctTargetId: string }): DragToTargetQuestion {
  return {
    id: input.id, revision: 1, schemaVersion: 1, conceptIds: [], knowledgeRefs: [], difficulty: 1, language: 'en-IN', prompt: { text: input.promptText },
    feedback: { correct: 'Yes!', incorrect: 'Try again.' }, authoring: reviewedAuthoring,
    interaction: { type: 'drag_to_target', version: 1, items: [input.item], targets: input.targets }, solution: { type: 'target_assignment', assignments: { [input.item.id]: input.correctTargetId } }
  };
}

const listenDog = choiceQuestion({ id: 'first-play.listen-find.dog', promptText: 'Where is the dog?', options: [visual.dog, visual.cow], correctOptionId: 'dog', tier: 'first_play' });
const listenEarth = choiceQuestion({ id: 'first-play.listen-find.earth', promptText: 'Find Earth.', options: [visual.earth, visual.sun], correctOptionId: 'earth', tier: 'first_play', conceptIds: ['universe.earth.planet'], knowledgeRefs: ['kr.universe.earth.type.planet'] });
const letterApple = choiceQuestion({ id: 'first-play.letter-picture.a-apple.question', promptText: 'A ... Apple', options: [visual.apple, visual.orange], correctOptionId: 'apple', tier: 'first_play' });
const fullEmpty = choiceQuestion({ id: 'first-play.contrast.full-empty', promptText: 'Touch the full bucket.', options: [{ id: 'full', label: 'Full bucket', semanticRef: 'full' }, { id: 'empty', label: 'Empty bucket', semanticRef: 'empty' }], correctOptionId: 'full', tier: 'first_play', conceptIds: ['vocabulary.state.full', 'vocabulary.state.empty', 'vocabulary.container.amount'], knowledgeRefs: ['kr.vocab.state.full.contrasts-with-empty'] });

export const FIRST_PLAY_ACTIVITIES: readonly FirstPlayActivity[] = [
  { id: 'first-play.touch.dog', kind: 'touch_discover', stage: 'fp0_touch_discover', evidenceClass: 'exploration', promptText: 'Touch the dog.', reactionEvent: 'discover', item: visual.dog, spokenLabel: 'Dog' },
  { id: 'first-play.touch.bell', kind: 'touch_discover', stage: 'fp0_touch_discover', evidenceClass: 'exploration', promptText: 'Touch the bell.', reactionEvent: 'mischief', item: visual.bell, spokenLabel: 'Bell' },
  { id: 'first-play.listen.dog', kind: 'listen_find', stage: 'fp1_listen_find', evidenceClass: 'guided_practice', promptText: listenDog.prompt.text, reactionEvent: 'celebrate', question: listenDog },
  { id: 'first-play.listen.earth', kind: 'listen_find', stage: 'fp1_listen_find', evidenceClass: 'guided_practice', promptText: listenEarth.prompt.text, reactionEvent: 'celebrate', question: listenEarth },
  { id: 'first-play.place.dog', kind: 'place_match', stage: 'fp2_match_relation', evidenceClass: 'guided_practice', promptText: 'Put the dog with the dog.', reactionEvent: 'celebrate', dropSnapTolerancePx: 40, question: dragQuestion({ id: 'first-play.place.dog.question', promptText: 'Put the dog with the dog.', item: { ...visual.dog, id: 'moving-dog' }, targets: [{ ...visual.dog, id: 'dog-target', label: 'Dog match' }, { ...visual.cow, id: 'cow-target', label: 'Cow' }], correctTargetId: 'dog-target' }) },
  { id: 'first-play.place.apple', kind: 'place_match', stage: 'fp2_match_relation', evidenceClass: 'guided_practice', promptText: 'Put the apple with the apple.', reactionEvent: 'celebrate', dropSnapTolerancePx: 40, question: dragQuestion({ id: 'first-play.place.apple.question', promptText: 'Put the apple with the apple.', item: { ...visual.apple, id: 'moving-apple' }, targets: [{ ...visual.orange, id: 'orange-target', label: 'Orange' }, { ...visual.apple, id: 'apple-target', label: 'Apple match' }], correctTargetId: 'apple-target' }) },
  { id: 'first-play.contrast.full-empty', kind: 'semantic_contrast', stage: 'fp4_concrete_concept', evidenceClass: 'guided_practice', promptText: fullEmpty.prompt.text, reactionEvent: 'celebrate', question: fullEmpty, states: [{ optionId: 'full', state: 'full' }, { optionId: 'empty', state: 'empty' }] },
  { id: 'first-play.letter-picture.a-apple', kind: 'letter_picture', stage: 'fp5_sound_letter_exposure', evidenceClass: 'guided_practice', promptText: letterApple.prompt.text, reactionEvent: 'celebrate', grapheme: 'A', question: letterApple },
  { id: 'first-play.cause-effect.fill-bucket', kind: 'cause_effect', stage: 'fp3_put_sort_build', evidenceClass: 'exploration', promptText: 'Touch the empty bucket.', reactionEvent: 'change', beforeState: 'empty', afterState: 'full' }
] as const;

export const FIRST_PLAY_PROOFS: Readonly<Record<string, FirstPlayProductionProof>> = {
  'first-play.listen.dog': { kind: 'listen_find', semanticPlan: { schemaVersion: 1, presentationTier: 'first_play', targetSemanticRef: 'dog', comparisonDimensionRef: 'dimension.animals.reviewed-home-subject', candidates: [{ semanticRef: 'dog', contrastBasisRef: 'kr.animals.dog.home.kennel' }, { semanticRef: 'cow', contrastBasisRef: 'kr.animals.cow.home.shed' }] } },
  'first-play.listen.earth': { kind: 'listen_find', semanticPlan: { schemaVersion: 1, presentationTier: 'first_play', targetSemanticRef: 'earth', comparisonDimensionRef: 'dimension.universe.object-identity', candidates: [{ semanticRef: 'earth', contrastBasisRef: 'kr.universe.earth.type.planet' }, { semanticRef: 'sun', contrastBasisRef: 'kr.universe.sun.type.star' }] } },
  'first-play.contrast.full-empty': { kind: 'semantic_contrast', comparisonDimensionRef: 'kr.vocab.state.full.contrasts-with-empty' },
  'first-play.letter-picture.a-apple': { kind: 'letter_picture', targetWord: 'Apple', associationKind: 'letter_name_to_word_initial' },
  'first-play.cause-effect.fill-bucket': { kind: 'cause_effect', action: { schemaVersion: 1, actionId: 'first-play.fill-bucket', family: 'cause_effect', action: 'fill', canonicalGoalRefs: ['kr.vocab.state.full.contrasts-with-empty'], subjectSemanticRefs: ['bucket'], targetSemanticRefs: ['water'], stateTransition: { beforeStateRef: 'semantic.container.empty', afterStateRef: 'semantic.container.full', causalKnowledgeRef: 'kr.vocab.state.full.describes-container-content' }, evidenceClass: 'exploration', retryPolicy: 'not_applicable' } }
};

type RuntimeCandidate = { item: PresentableItem; correct?: boolean };
function vr(id: string, kind: VisualReasoningActivity['kind'], promptText: string, candidates: RuntimeCandidate[]): VisualReasoningActivity {
  const correct = candidates.find((candidate) => candidate.correct);
  if (!correct) throw new Error(`${id}: missing runtime answer`);
  return { id, kind, promptText, question: choiceQuestion({ id: `${id}.question`, promptText, options: candidates.map((candidate) => candidate.item), correctOptionId: correct.item.id, tier: 'preschool' }) };
}

export const VISUAL_SCENE_CHOICE_ACTIVITIES: readonly VisualReasoningActivity[] = [
  vr('visual-choice.animals.dog', 'visual_scene_choice', 'Find the dog.', [{ item: visual.dog, correct: true }, { item: visual.cow }, { item: visual.rabbit }]),
  vr('visual-choice.transport.bus', 'visual_scene_choice', 'Find the bus.', [{ item: visual.bus, correct: true }, { item: visual.train }, { item: visual.ship }, { item: visual.aeroplane }]),
  vr('visual-choice.body.eyes', 'visual_scene_choice', 'Find the eyes.', [{ item: visual.eyes, correct: true }, { item: visual.ears }, { item: visual.nose }, { item: visual.tongue }]),
  vr('visual-choice.communication.telephone', 'visual_scene_choice', 'Find the telephone.', [{ item: visual.telephone, correct: true }, { item: visual.radio }, { item: visual.newspaper }, { item: visual.television }]),
  vr('visual-choice.plants.lotus', 'visual_scene_choice', 'Find the lotus.', [{ item: visual.pea }, { item: visual.pumpkin }, { item: visual.lotus, correct: true }]),
  vr('visual-choice.food-source.honeybee', 'visual_scene_choice', 'Find the honeybee.', [{ item: visual.cow }, { item: visual.honeybee, correct: true }, { item: visual.wheat }])
] as const;
export const ODD_ONE_OUT_ACTIVITIES: readonly VisualReasoningActivity[] = [
  vr('odd-one-out.transport', 'odd_one_out', "Which one doesn't belong?", [{ item: visual.bus }, { item: visual.train }, { item: visual.ship }, { item: visual.telephone, correct: true }]),
  vr('odd-one-out.communication', 'odd_one_out', "Which one doesn't belong?", [{ item: visual.telephone }, { item: visual.radio }, { item: visual.newspaper }, { item: visual.bus, correct: true }]),
  vr('odd-one-out.senses', 'odd_one_out', "Which one doesn't belong?", [{ item: visual.eyes }, { item: visual.ears }, { item: visual.nose }, { item: visual.teeth, correct: true }]),
  vr('odd-one-out.plants', 'odd_one_out', "Which one doesn't belong?", [{ item: visual.pea }, { item: visual.pumpkin }, { item: visual.lotus }, { item: visual.bus, correct: true }]),
  vr('odd-one-out.food-sources', 'odd_one_out', "Which one doesn't belong?", [{ item: visual.cow }, { item: visual.honeybee }, { item: visual.wheat }, { item: visual.telephone, correct: true }]),
  vr('odd-one-out.animal-features', 'odd_one_out', "Which one doesn't belong?", [{ item: visual.fish }, { item: visual.bird }, { item: visual.duck }, { item: visual.bus, correct: true }])
] as const;
export const VISUAL_REASONING_ACTIVITIES: readonly VisualReasoningActivity[] = [...VISUAL_SCENE_CHOICE_ACTIVITIES, ...ODD_ONE_OUT_ACTIVITIES];

const sceneProof = (semanticFamily: string, targetSemanticRef: string, comparisonDimensionRef: string, candidates: Array<[string, string]>): VisualReasoningProof => ({ semanticFamily, semanticPlan: { schemaVersion: 1, presentationTier: 'preschool', targetSemanticRef, comparisonDimensionRef, candidates: candidates.map(([semanticRef, contrastBasisRef]) => ({ semanticRef, contrastBasisRef })) } });
const oddProof = (semanticFamily: string, comparisonDimensionRef: string, candidates: Array<[string, boolean, string]>): VisualReasoningProof => ({ semanticFamily, oddOneOutPlan: { schemaVersion: 1, comparisonDimensionRef, candidates: candidates.map(([semanticRef, satisfiesRule, comparisonEvidenceRef]) => ({ semanticRef, satisfiesRule, comparisonEvidenceRef })) } });
export const VISUAL_REASONING_PROOFS: Readonly<Record<string, VisualReasoningProof>> = {
  'visual-choice.animals.dog': sceneProof('animals', 'dog', 'dimension.animals.reviewed-home-subject', [['dog', 'kr.animals.dog.home.kennel'], ['cow', 'kr.animals.cow.home.shed'], ['rabbit', 'kr.animals.rabbit.home.burrow']]),
  'visual-choice.transport.bus': sceneProof('transport', 'bus', 'dimension.transport.mode', [['bus', 'kr.transport.bus.mode.road'], ['train', 'kr.transport.train.mode.rail'], ['ship', 'kr.transport.ship.mode.water'], ['aeroplane', 'kr.transport.aeroplane.mode.air']]),
  'visual-choice.body.eyes': sceneProof('human-senses', 'eyes', 'dimension.human.sense-organ', [['eyes', 'kr.human.eyes.sense.sight'], ['ears', 'kr.human.ears.sense.hearing'], ['nose', 'kr.human.nose.sense.smell'], ['tongue', 'kr.human.tongue.sense.taste']]),
  'visual-choice.communication.telephone': sceneProof('communication', 'telephone', 'dimension.communication.method', [['telephone', 'kr.communication.telephone.use.voice'], ['radio', 'kr.communication.radio.use.audio'], ['newspaper', 'kr.communication.newspaper.use.news'], ['television', 'kr.communication.television.use.av']]),
  'visual-choice.plants.lotus': sceneProof('plants', 'lotus', 'dimension.plants.type', [['pea', 'kr.plants.pea.type.climber'], ['pumpkin', 'kr.plants.pumpkin.type.creeper'], ['lotus', 'kr.plants.lotus.type.aquatic']]),
  'visual-choice.food-source.honeybee': sceneProof('food-sources', 'honeybee', 'dimension.food.source-subject', [['cow', 'kr.food.cow.source.milk'], ['honeybee', 'kr.food.honeybee.source.honey'], ['wheat', 'kr.food.wheat.source.flour']]),
  'odd-one-out.transport': oddProof('transport', 'dimension.transport.role', [['bus', true, 'kr.transport.bus.mode.road'], ['train', true, 'kr.transport.train.mode.rail'], ['ship', true, 'kr.transport.ship.mode.water'], ['telephone', false, 'kr.communication.telephone.use.voice']]),
  'odd-one-out.communication': oddProof('communication', 'dimension.communication.role', [['telephone', true, 'kr.communication.telephone.use.voice'], ['radio', true, 'kr.communication.radio.use.audio'], ['newspaper', true, 'kr.communication.newspaper.use.news'], ['bus', false, 'kr.transport.bus.mode.road']]),
  'odd-one-out.senses': oddProof('human-senses', 'dimension.human.sense-function', [['eyes', true, 'kr.human.eyes.sense.sight'], ['ears', true, 'kr.human.ears.sense.hearing'], ['nose', true, 'kr.human.nose.sense.smell'], ['teeth', false, 'kr.human.teeth.action.chew']]),
  'odd-one-out.plants': oddProof('plants', 'dimension.plants.is-a', [['pea', true, 'kr.plants.pea.type.climber'], ['pumpkin', true, 'kr.plants.pumpkin.type.creeper'], ['lotus', true, 'kr.plants.lotus.type.aquatic'], ['bus', false, 'kr.transport.bus.mode.road']]),
  'odd-one-out.food-sources': oddProof('food-sources', 'dimension.food.source-relation', [['cow', true, 'kr.food.cow.source.milk'], ['honeybee', true, 'kr.food.honeybee.source.honey'], ['wheat', true, 'kr.food.wheat.source.flour'], ['telephone', false, 'kr.communication.telephone.use.voice']]),
  'odd-one-out.animal-features': oddProof('animal-features', 'dimension.animals.reviewed-feature', [['fish', true, 'kr.animals.fish.covering.scales'], ['bird', true, 'kr.animals.bird.covering.feathers'], ['duck', true, 'kr.animals.duck.feature.webbed-feet'], ['bus', false, 'kr.transport.bus.mode.road']])
};

function assertStableEvidenceRef(value: string, context: string): void { if (!value.trim() || /\s/.test(value)) throw new Error(`${context} must be a stable evidence ref`); }
export function validateFirstPlayProductionActivity(activity: FirstPlayActivity): void {
  const action = activity.kind === 'touch_discover' ? 'tap' : activity.kind === 'place_match' ? 'place' : activity.kind === 'cause_effect' ? 'observe_change' : 'find';
  const initialChoiceCount = activity.kind === 'listen_find' || activity.kind === 'semantic_contrast' || activity.kind === 'letter_picture' ? activity.question.interaction.options.length : activity.kind === 'place_match' ? activity.question.interaction.targets.length : 0;
  validateFirstPlayRecipePolicy({ stage: activity.stage, evidenceClass: activity.evidenceClass, readingRequired: false, instructionSteps: 1, initialChoiceCount, primaryTargetScale: 'oversized', wrongActionRecovery: 'in_place', requiresSeparateSubmitAfterCommittedAction: false, action });
  const proof = FIRST_PLAY_PROOFS[activity.id];
  if (activity.kind === 'listen_find') {
    if (!proof || proof.kind !== 'listen_find') throw new Error(`${activity.id}: semantic proof missing`);
    validateSemanticChoicePlan(proof.semanticPlan);
    if (activity.question.interaction.presentation?.tier !== 'first_play') throw new Error(`${activity.id}: Listen & Find must use first_play visual presentation`);
  }
  if (activity.kind === 'letter_picture') {
    if (!proof || proof.kind !== 'letter_picture') throw new Error(`${activity.id}: letter proof missing`);
    if (!/^[A-Z]$/.test(activity.grapheme) || proof.associationKind !== 'letter_name_to_word_initial') throw new Error(`${activity.id}: phoneme inference is not allowed in First Play`);
    const options = activity.question.interaction.options;
    const correctId = activity.question.solution.correctOptionIds[0];
    const target = options.find((option) => option.id === correctId);
    const initial = activity.grapheme.toLowerCase();
    if (!proof.targetWord.toLowerCase().startsWith(initial) || !target || target.label !== proof.targetWord) throw new Error(`${activity.id}: target word and grapheme must agree`);
    if (options.length !== 2 || activity.question.interaction.presentation?.tier !== 'first_play' || activity.question.interaction.presentation?.labels !== 'hidden') throw new Error(`${activity.id}: letter-picture exposure must use two hidden-label First Play choices`);
    if (options.filter((option) => option.id !== correctId).some((option) => option.label.toLowerCase().startsWith(initial))) throw new Error(`${activity.id}: distractors must not share the target initial in V1`);
  }
  if (activity.kind === 'place_match' && activity.dropSnapTolerancePx < 32) throw new Error(`${activity.id}: First Play placement tolerance must be materially forgiving`);
  if (activity.kind === 'semantic_contrast') {
    if (!proof || proof.kind !== 'semantic_contrast') throw new Error(`${activity.id}: contrast proof missing`);
    assertStableEvidenceRef(proof.comparisonDimensionRef, `${activity.id}.comparisonDimensionRef`);
    if (activity.states.length !== 2 || new Set(activity.states.map((state) => state.state)).size !== 2) throw new Error(`${activity.id}: concrete contrast must show exactly two distinct semantic states`);
  }
  if (activity.kind === 'cause_effect') {
    if (!proof || proof.kind !== 'cause_effect') throw new Error(`${activity.id}: cause/effect proof missing`);
    validateWorldActionDefinition(proof.action);
    if (activity.beforeState === activity.afterState) throw new Error(`${activity.id}: cause/effect must visibly change semantic state`);
  }
}

export function validateVisualReasoningActivity(activity: VisualReasoningActivity): void {
  if (!activity.question.interaction.shuffleOptions || activity.question.interaction.presentation?.mode !== 'visual_dominant') throw new Error(`${activity.id}: visual reasoning presentation is invalid`);
  const proof = VISUAL_REASONING_PROOFS[activity.id];
  if (!proof) throw new Error(`${activity.id}: semantic proof is required`);
  if (activity.kind === 'visual_scene_choice') {
    if (!proof.semanticPlan) throw new Error(`${activity.id}: semantic choice plan is required`);
    validateSemanticChoicePlan(proof.semanticPlan);
    return;
  }
  if (!proof.oddOneOutPlan) throw new Error(`${activity.id}: odd-one-out plan is required`);
  const resolved = resolveOddOneOutPlan(proof.oddOneOutPlan);
  if (resolved.oddSemanticRef !== activity.question.solution.correctOptionIds[0]) throw new Error(`${activity.id}: odd-one-out answer must match the declared semantic outlier`);
  for (const candidate of proof.oddOneOutPlan.candidates) assertStableEvidenceRef(candidate.comparisonEvidenceRef, `${activity.id}.${candidate.semanticRef}.comparisonEvidenceRef`);
}

export function evaluateFirstPlayQuestion(activity: ListenFindActivity | PlaceMatchActivity | LetterPictureActivity | ContrastActivity, response: unknown): { result: EvaluationResult; feedback: FirstPlayFeedbackMode } {
  const result = applyFirstPlayEvidencePolicy(activity.evidenceClass, evaluate(activity.question, response));
  return { result, feedback: resolveFirstPlayFeedback(activity.evidenceClass, result) };
}
export function visualCorrectPositionsAcrossSeeds(activity: VisualReasoningActivity, seeds: readonly number[]): number[] {
  const correctId = activity.question.solution.correctOptionIds[0];
  return seeds.map((seed) => shuffled(activity.question.interaction.options, createSeededRandom(seed)).findIndex((option) => option.id === correctId));
}
