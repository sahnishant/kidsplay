import {
  validateRiddleProductionItem as productionRiddle,
  type RiddleCandidatePresentation,
  type RiddleProductionItem
} from './riddleRuntime';
import {
  RIDDLE_COW_CALF_SHED,
  RIDDLE_DOG_KENNEL,
  RIDDLE_EARTH_PLANET_THIRD
} from './sharedRiddleRecords';

export type {
  RiddleCandidatePresentation,
  RiddleProductionItem,
  RiddleSurfaceProjection
} from './riddleRuntime';
export {
  projectRiddleToSurface,
  riddleKnowledgeRefs,
  riddleToSingleChoiceQuestion
} from './riddleRuntime';

const bird = { optionId: 'bird', semanticRef: 'entity.animal.bird', label: 'Bird', visualRefs: ['entity.animal.bird'] } as const satisfies RiddleCandidatePresentation;
const fish = { optionId: 'fish', semanticRef: 'entity.animal.fish', label: 'Fish', visualRefs: ['entity.animal.fish'] } as const satisfies RiddleCandidatePresentation;
const duck = { optionId: 'duck', semanticRef: 'entity.animal.duck', label: 'Duck', visualRefs: ['entity.animal.duck'] } as const satisfies RiddleCandidatePresentation;
const dog = { optionId: 'dog', semanticRef: 'entity.animal.dog', label: 'Dog', visualRefs: ['entity.animal.dog'] } as const satisfies RiddleCandidatePresentation;
const rabbit = { optionId: 'rabbit', semanticRef: 'entity.animal.rabbit', label: 'Rabbit', visualRefs: ['entity.animal.rabbit'] } as const satisfies RiddleCandidatePresentation;
const cat = { optionId: 'cat', semanticRef: 'entity.animal.cat', label: 'Cat', visualRefs: ['entity.animal.cat'] } as const satisfies RiddleCandidatePresentation;

/**
 * Bounded production-candidate slice for #208 passes 081/085. Shared records
 * consumed by Learn About are imported from sharedRiddleRecords.ts so both
 * surfaces use the same clue objects rather than parallel copies.
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
  RIDDLE_DOG_KENNEL,
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
  RIDDLE_COW_CALF_SHED,
  RIDDLE_EARTH_PLANET_THIRD,
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
