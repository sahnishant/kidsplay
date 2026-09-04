import {
  validateRiddleProductionItem,
  type RiddleCandidatePresentation,
  type RiddleProductionItem
} from './riddleRuntime';

const dog = { optionId: 'dog', semanticRef: 'entity.animal.dog', label: 'Dog', visualRefs: ['entity.animal.dog'] } as const satisfies RiddleCandidatePresentation;
const rabbit = { optionId: 'rabbit', semanticRef: 'entity.animal.rabbit', label: 'Rabbit', visualRefs: ['entity.animal.rabbit'] } as const satisfies RiddleCandidatePresentation;
const cat = { optionId: 'cat', semanticRef: 'entity.animal.cat', label: 'Cat', visualRefs: ['entity.animal.cat'] } as const satisfies RiddleCandidatePresentation;
const cow = { optionId: 'cow', semanticRef: 'entity.animal.cow', label: 'Cow', visualRefs: ['entity.animal.cow'] } as const satisfies RiddleCandidatePresentation;
const earth = { optionId: 'earth', semanticRef: 'entity.universe.earth', label: 'Earth', visualRefs: ['entity.universe.earth'] } as const satisfies RiddleCandidatePresentation;
const sun = { optionId: 'sun', semanticRef: 'entity.nature.sun', label: 'Sun', visualRefs: ['entity.nature.sun'] } as const satisfies RiddleCandidatePresentation;

export const RIDDLE_DOG_KENNEL = validateRiddleProductionItem({
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
});

export const RIDDLE_COW_CALF_SHED = validateRiddleProductionItem({
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
});

export const RIDDLE_EARTH_PLANET_THIRD = validateRiddleProductionItem({
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
});

/** The bounded existing Riddle Time records consumed by Learn About V1. */
export const LEARN_ABOUT_SHARED_RIDDLES: readonly RiddleProductionItem[] = [
  RIDDLE_DOG_KENNEL,
  RIDDLE_COW_CALF_SHED,
  RIDDLE_EARTH_PLANET_THIRD
];
