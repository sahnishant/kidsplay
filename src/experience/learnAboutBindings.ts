import type { LearnAboutDepthBand } from './learnAboutContract';

export interface LearnAboutGuessBinding { clueSetId: string; minDepth: LearnAboutDepthBand; }
export interface LearnAboutSectionBinding {
  sectionId: string;
  /** Canonical relationship rows that may drive Compare/Try It. */
  relationshipRefs?: readonly string[];
  /** Existing shared clue records; Learn About never owns their wording or answer. */
  guesses?: readonly LearnAboutGuessBinding[];
  /** Existing question ids only. The existing Session/evaluator remains authoritative. */
  practiceQuestionIds?: readonly string[];
}
export interface LearnAboutTopicBinding { topicId: string; icon: string; sections: readonly LearnAboutSectionBinding[]; }

export const LEARN_ABOUT_TOPIC_BINDINGS: readonly LearnAboutTopicBinding[] = [
  {
    topicId: 'learn.earth', icon: '🌍', sections: [
      { sectionId: 'earth.day-and-night', relationshipRefs: ['kr.universe.earth.rotation.day-night'] },
      { sectionId: 'earth.space-neighbours', relationshipRefs: ['kr.universe.earth.type.planet', 'kr.universe.sun.type.star', 'kr.universe.moon.type.satellite', 'kr.universe.earth.position.third'], guesses: [{ clueSetId: 'riddle.r2.earth.planet-third', minDepth: 'd2_early_primary' }] },
      { sectionId: 'earth.go-deeper', practiceQuestionIds: ['universe.hots.sun-moon-statements.001'] }
    ]
  },
  {
    topicId: 'learn.lion', icon: '🦁', sections: [
      { sectionId: 'lion.animal-neighbours', relationshipRefs: ['kr.animals.lion.home.den', 'kr.animals.dog.home.kennel', 'kr.animals.cow.home.shed', 'kr.animals.cow.young.calf'], guesses: [{ clueSetId: 'riddle.r0.dog.kennel', minDepth: 'd2_early_primary' }, { clueSetId: 'riddle.r2.cow.calf-shed', minDepth: 'd2_early_primary' }] }
    ]
  },
  { topicId: 'learn.fire-station', icon: '🚒', sections: [] },
  { topicId: 'learn.fractions', icon: '◒', sections: [] },
  { topicId: 'learn.plants', icon: '🌱', sections: [] }
];

export function getLearnAboutTopicBinding(topicId: string): LearnAboutTopicBinding | undefined {
  return LEARN_ABOUT_TOPIC_BINDINGS.find((binding) => binding.topicId === topicId);
}
