import { createSeededRandom, shuffled } from '../mechanics/random';
import {
  FIRST_PLAY_ACTIVITIES,
  type FirstPlayActivity,
  type VisualReasoningActivity
} from './firstPlayProduction';
import { validateFirstPlayRecipePolicy } from './firstPlayPolicy';
import {
  resolveOddOneOutPlan,
  validateSemanticChoicePlan,
  type OddOneOutPlan,
  type SemanticChoicePlan
} from './semanticChoiceSafety';
import { validateWorldActionDefinition, type WorldActionDefinition } from './worldActionContract';

export interface ProductionOddOneOutCandidate {
  semanticRef: string;
  satisfiesRule: boolean;
  comparisonEvidenceRef: string;
}

export interface ProductionOddOneOutPlan extends Omit<OddOneOutPlan, 'candidates'> {
  candidates: readonly ProductionOddOneOutCandidate[];
}

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

export const FIRST_PLAY_PROOFS: Readonly<Record<string, FirstPlayProductionProof>> = {
  'first-play.listen.dog': {
    kind: 'listen_find',
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
  'first-play.listen.earth': {
    kind: 'listen_find',
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
  'first-play.contrast.full-empty': {
    kind: 'semantic_contrast',
    comparisonDimensionRef: 'kr.vocab.state.full.contrasts-with-empty'
  },
  'first-play.letter-picture.a-apple': {
    kind: 'letter_picture',
    targetWord: 'Apple',
    associationKind: 'letter_name_to_word_initial'
  },
  'first-play.cause-effect.fill-bucket': {
    kind: 'cause_effect',
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
};

function sceneProof(
  semanticFamily: string,
  targetSemanticRef: string,
  comparisonDimensionRef: string,
  candidates: Array<[string, string]>
): VisualReasoningProof {
  return {
    semanticFamily,
    semanticPlan: {
      schemaVersion: 1,
      presentationTier: 'preschool',
      targetSemanticRef,
      comparisonDimensionRef,
      candidates: candidates.map(([semanticRef, contrastBasisRef]) => ({ semanticRef, contrastBasisRef }))
    }
  };
}

function oddProof(
  semanticFamily: string,
  comparisonDimensionRef: string,
  candidates: Array<[string, boolean, string]>
): VisualReasoningProof {
  return {
    semanticFamily,
    oddOneOutPlan: {
      schemaVersion: 1,
      comparisonDimensionRef,
      candidates: candidates.map(([semanticRef, satisfiesRule, comparisonEvidenceRef]) => ({
        semanticRef,
        satisfiesRule,
        comparisonEvidenceRef
      }))
    }
  };
}

export const VISUAL_REASONING_PROOFS: Readonly<Record<string, VisualReasoningProof>> = {
  'visual-choice.animals.dog': sceneProof(
    'animals',
    'dog',
    'dimension.animals.reviewed-home-subject',
    [
      ['dog', 'kr.animals.dog.home.kennel'],
      ['cow', 'kr.animals.cow.home.shed'],
      ['rabbit', 'kr.animals.rabbit.home.burrow']
    ]
  ),
  'visual-choice.transport.bus': sceneProof(
    'transport',
    'bus',
    'dimension.transport.mode',
    [
      ['bus', 'kr.transport.bus.mode.road'],
      ['train', 'kr.transport.train.mode.rail'],
      ['ship', 'kr.transport.ship.mode.water'],
      ['aeroplane', 'kr.transport.aeroplane.mode.air']
    ]
  ),
  'visual-choice.body.eyes': sceneProof(
    'human-senses',
    'eyes',
    'dimension.human.sense-organ',
    [
      ['eyes', 'kr.human.eyes.sense.sight'],
      ['ears', 'kr.human.ears.sense.hearing'],
      ['nose', 'kr.human.nose.sense.smell'],
      ['tongue', 'kr.human.tongue.sense.taste']
    ]
  ),
  'visual-choice.communication.telephone': sceneProof(
    'communication',
    'telephone',
    'dimension.communication.method',
    [
      ['telephone', 'kr.communication.telephone.use.voice'],
      ['radio', 'kr.communication.radio.use.audio'],
      ['newspaper', 'kr.communication.newspaper.use.news'],
      ['television', 'kr.communication.television.use.av']
    ]
  ),
  'visual-choice.plants.lotus': sceneProof(
    'plants',
    'lotus',
    'dimension.plants.type',
    [
      ['pea', 'kr.plants.pea.type.climber'],
      ['pumpkin', 'kr.plants.pumpkin.type.creeper'],
      ['lotus', 'kr.plants.lotus.type.aquatic']
    ]
  ),
  'visual-choice.food-source.honeybee': sceneProof(
    'food-sources',
    'honeybee',
    'dimension.food.source-subject',
    [
      ['cow', 'kr.food.cow.source.milk'],
      ['honeybee', 'kr.food.honeybee.source.honey'],
      ['wheat', 'kr.food.wheat.source.flour']
    ]
  ),
  'odd-one-out.transport': oddProof(
    'transport',
    'dimension.transport.role',
    [
      ['bus', true, 'kr.transport.bus.mode.road'],
      ['train', true, 'kr.transport.train.mode.rail'],
      ['ship', true, 'kr.transport.ship.mode.water'],
      ['telephone', false, 'kr.communication.telephone.use.voice']
    ]
  ),
  'odd-one-out.communication': oddProof(
    'communication',
    'dimension.communication.role',
    [
      ['telephone', true, 'kr.communication.telephone.use.voice'],
      ['radio', true, 'kr.communication.radio.use.audio'],
      ['newspaper', true, 'kr.communication.newspaper.use.news'],
      ['bus', false, 'kr.transport.bus.mode.road']
    ]
  ),
  'odd-one-out.senses': oddProof(
    'human-senses',
    'dimension.human.sense-function',
    [
      ['eyes', true, 'kr.human.eyes.sense.sight'],
      ['ears', true, 'kr.human.ears.sense.hearing'],
      ['nose', true, 'kr.human.nose.sense.smell'],
      ['teeth', false, 'kr.human.teeth.action.chew']
    ]
  ),
  'odd-one-out.plants': oddProof(
    'plants',
    'dimension.plants.is-a',
    [
      ['pea', true, 'kr.plants.pea.type.climber'],
      ['pumpkin', true, 'kr.plants.pumpkin.type.creeper'],
      ['lotus', true, 'kr.plants.lotus.type.aquatic'],
      ['bus', false, 'kr.transport.bus.mode.road']
    ]
  ),
  'odd-one-out.food-sources': oddProof(
    'food-sources',
    'dimension.food.source-relation',
    [
      ['cow', true, 'kr.food.cow.source.milk'],
      ['honeybee', true, 'kr.food.honeybee.source.honey'],
      ['wheat', true, 'kr.food.wheat.source.flour'],
      ['telephone', false, 'kr.communication.telephone.use.voice']
    ]
  ),
  'odd-one-out.animal-features': oddProof(
    'animal-features',
    'dimension.animals.reviewed-feature',
    [
      ['fish', true, 'kr.animals.fish.covering.scales'],
      ['bird', true, 'kr.animals.bird.covering.feathers'],
      ['duck', true, 'kr.animals.duck.feature.webbed-feet'],
      ['bus', false, 'kr.transport.bus.mode.road']
    ]
  )
};

function assertStableEvidenceRef(value: string, context: string): void {
  if (!value.trim() || /\s/.test(value)) throw new Error(`${context} must be a stable evidence ref`);
}

export function validateFirstPlayProductionActivity(activity: FirstPlayActivity): void {
  const action = activity.kind === 'touch_discover'
    ? 'tap'
    : activity.kind === 'place_match'
      ? 'place'
      : activity.kind === 'cause_effect'
        ? 'observe_change'
        : 'find';
  const initialChoiceCount = activity.kind === 'listen_find'
    || activity.kind === 'semantic_contrast'
    || activity.kind === 'letter_picture'
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

  const proof = FIRST_PLAY_PROOFS[activity.id];
  if (activity.kind === 'listen_find') {
    if (!proof || proof.kind !== 'listen_find') throw new Error(`${activity.id}: semantic proof missing`);
    validateSemanticChoicePlan(proof.semanticPlan);
    if (activity.question.interaction.presentation?.tier !== 'first_play') {
      throw new Error(`${activity.id}: Listen & Find must use first_play visual presentation`);
    }
  }

  if (activity.kind === 'letter_picture') {
    if (!proof || proof.kind !== 'letter_picture') throw new Error(`${activity.id}: letter proof missing`);
    if (!/^[A-Z]$/.test(activity.grapheme) || proof.associationKind !== 'letter_name_to_word_initial') {
      throw new Error(`${activity.id}: phoneme inference is not allowed in First Play`);
    }
    const options = activity.question.interaction.options;
    const correctId = activity.question.solution.correctOptionIds[0];
    const target = options.find((option) => option.id === correctId);
    const initial = activity.grapheme.toLowerCase();
    if (!proof.targetWord.toLowerCase().startsWith(initial) || !target || target.label !== proof.targetWord) {
      throw new Error(`${activity.id}: target word and grapheme must agree`);
    }
    if (
      options.length !== 2
      || activity.question.interaction.presentation?.tier !== 'first_play'
      || activity.question.interaction.presentation?.labels !== 'hidden'
    ) {
      throw new Error(`${activity.id}: letter-picture exposure must use two hidden-label First Play choices`);
    }
    if (options.filter((option) => option.id !== correctId).some((option) => option.label.toLowerCase().startsWith(initial))) {
      throw new Error(`${activity.id}: distractors must not share the target initial in V1`);
    }
  }

  if (activity.kind === 'place_match' && activity.dropSnapTolerancePx < 32) {
    throw new Error(`${activity.id}: First Play placement tolerance must be materially forgiving`);
  }

  if (activity.kind === 'semantic_contrast') {
    if (!proof || proof.kind !== 'semantic_contrast') throw new Error(`${activity.id}: contrast proof missing`);
    assertStableEvidenceRef(proof.comparisonDimensionRef, `${activity.id}.comparisonDimensionRef`);
    if (activity.states.length !== 2 || new Set(activity.states.map((state) => state.state)).size !== 2) {
      throw new Error(`${activity.id}: concrete contrast must show exactly two distinct semantic states`);
    }
  }

  if (activity.kind === 'cause_effect') {
    if (!proof || proof.kind !== 'cause_effect') throw new Error(`${activity.id}: cause/effect proof missing`);
    validateWorldActionDefinition(proof.action);
    if (activity.beforeState === activity.afterState) {
      throw new Error(`${activity.id}: cause/effect must visibly change semantic state`);
    }
  }
}

export function validateVisualReasoningActivity(activity: VisualReasoningActivity): void {
  if (!activity.question.interaction.shuffleOptions) {
    throw new Error(`${activity.id}: visible correct position must be shuffled`);
  }
  if (activity.question.interaction.presentation?.mode !== 'visual_dominant') {
    throw new Error(`${activity.id}: visual reasoning must use visual_dominant presentation`);
  }

  const proof = VISUAL_REASONING_PROOFS[activity.id];
  if (!proof) throw new Error(`${activity.id}: semantic proof is required`);

  if (activity.kind === 'visual_scene_choice') {
    if (!proof.semanticPlan) throw new Error(`${activity.id}: semantic choice plan is required`);
    validateSemanticChoicePlan(proof.semanticPlan);
    return;
  }

  if (!proof.oddOneOutPlan) throw new Error(`${activity.id}: odd-one-out plan is required`);
  const resolved = resolveOddOneOutPlan(proof.oddOneOutPlan);
  if (resolved.oddSemanticRef !== activity.question.solution.correctOptionIds[0]) {
    throw new Error(`${activity.id}: odd-one-out answer must match the declared semantic outlier`);
  }
  for (const candidate of proof.oddOneOutPlan.candidates) {
    assertStableEvidenceRef(
      candidate.comparisonEvidenceRef,
      `${activity.id}.${candidate.semanticRef}.comparisonEvidenceRef`
    );
  }
}

export function visualCorrectPositionsAcrossSeeds(
  activity: VisualReasoningActivity,
  seeds: readonly number[]
): number[] {
  const correctId = activity.question.solution.correctOptionIds[0];
  return seeds.map((seed) => shuffled(
    activity.question.interaction.options,
    createSeededRandom(seed)
  ).findIndex((option) => option.id === correctId));
}

export function validateWholeFirstPlayProduction(): void {
  for (const activity of FIRST_PLAY_ACTIVITIES) validateFirstPlayProductionActivity(activity);
}
