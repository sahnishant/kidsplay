import type { LearnAboutDepthBand } from './learnAboutContract';

export interface LearnAboutGuessBinding {
  clueSetId: string;
  minDepth: LearnAboutDepthBand;
}

export interface LearnAboutSectionBinding {
  sectionId: string;
  /** Canonical relationship rows that may drive Compare/Try It. */
  relationshipRefs?: readonly string[];
  /** Existing shared clue records; Learn About never owns their wording or answer. */
  guesses?: readonly LearnAboutGuessBinding[];
  /** Existing question ids only. The existing Session/evaluator remains authoritative. */
  practiceQuestionIds?: readonly string[];
}

export interface LearnAboutTopicBinding {
  topicId: string;
  icon: string;
  sections: readonly LearnAboutSectionBinding[];
}

export const LEARN_ABOUT_TOPIC_BINDINGS: readonly LearnAboutTopicBinding[] = [
  {
    topicId: 'learn.earth',
    icon: '🌍',
    sections: [
      {
        sectionId: 'earth.in-space',
        relationshipRefs: [
          'kr.universe.earth.type.planet',
          'kr.universe.earth.position.third',
          'kr.universe.sun.type.star'
        ],
        guesses: [{ clueSetId: 'riddle.r2.earth.planet-third', minDepth: 'd2_early_primary' }]
      },
      {
        sectionId: 'earth.moon',
        relationshipRefs: [
          'kr.universe.moon.type.satellite',
          'kr.universe.moonlight.source.sun'
        ]
      },
      {
        sectionId: 'earth.day-night',
        relationshipRefs: ['kr.universe.earth.rotation.day-night']
      },
      {
        sectionId: 'earth.go-deeper',
        relationshipRefs: [
          'kr.universe.orbit.definition.planet-path',
          'kr.universe.mars.name.red-planet',
          'kr.universe.jupiter.property.largest',
          'kr.universe.saturn.feature.rings'
        ]
      }
    ]
  },
  {
    topicId: 'learn.lion',
    icon: '🦁',
    sections: [
      {
        sectionId: 'lion.animal-neighbours',
        relationshipRefs: [
          'kr.animals.lion.home.den',
          'kr.animals.dog.home.kennel',
          'kr.animals.cow.home.shed',
          'kr.animals.cow.young.calf'
        ],
        guesses: [
          { clueSetId: 'riddle.r0.dog.kennel', minDepth: 'd2_early_primary' },
          { clueSetId: 'riddle.r2.cow.calf-shed', minDepth: 'd2_early_primary' }
        ]
      }
    ]
  },
  {
    topicId: 'learn.fire-station',
    icon: '🚒',
    sections: []
  }
];

export function getLearnAboutTopicBinding(topicId: string): LearnAboutTopicBinding | undefined {
  return LEARN_ABOUT_TOPIC_BINDINGS.find((binding) => binding.topicId === topicId);
}
