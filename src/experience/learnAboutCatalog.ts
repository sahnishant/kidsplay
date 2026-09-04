import type { LearnAboutTopic } from './learnAboutContract';

/**
 * Navigation/projection metadata only. Every factual claim remains owned by the
 * reviewed canonical knowledge rows referenced below. Contract validation is
 * exercised by tests/content gates rather than shipped into the child route.
 */
export const EARTH_LEARN_ABOUT_TOPIC = {
  schemaVersion: 1,
  topicId: 'learn.earth',
  childTitle: 'Earth',
  archetype: 'celestial_system',
  rootConceptRefs: ['universe.earth.planet'],
  sections: [
    {
      sectionId: 'earth.meet-earth',
      childTitle: 'Meet Earth',
      knowledgeRefs: ['kr.universe.earth.type.planet'],
      depthBands: ['d0_first_play', 'd1_preschool'],
      recipeFamilies: ['explore', 'did_you_know', 'guess']
    },
    {
      sectionId: 'earth.land-water',
      childTitle: 'Land & water',
      knowledgeRefs: [],
      depthBands: ['d0_first_play', 'd1_preschool'],
      recipeFamilies: ['explore']
    },
    {
      sectionId: 'earth.day-and-night',
      childTitle: 'Day and Night',
      knowledgeRefs: ['kr.universe.earth.rotation.day-night'],
      depthBands: ['d2_early_primary'],
      recipeFamilies: ['explore', 'did_you_know', 'try_it']
    },
    {
      sectionId: 'earth.space-neighbours',
      childTitle: 'Space Neighbours',
      knowledgeRefs: [
        'kr.universe.earth.type.planet',
        'kr.universe.sun.type.star',
        'kr.universe.moon.type.satellite',
        'kr.universe.earth.position.third'
      ],
      depthBands: ['d2_early_primary', 'd3_deeper_primary'],
      recipeFamilies: ['explore', 'did_you_know', 'compare', 'guess']
    },
    {
      sectionId: 'earth.go-deeper',
      childTitle: 'Go Deeper',
      knowledgeRefs: [
        'kr.universe.sun.type.star',
        'kr.universe.moonlight.source.sun',
        'kr.universe.orbit.definition.planet-path'
      ],
      depthBands: ['d3_deeper_primary'],
      recipeFamilies: ['explore', 'did_you_know', 'practice']
    }
  ]
} as const satisfies LearnAboutTopic;

export const LION_LEARN_ABOUT_TOPIC = {
  schemaVersion: 1,
  topicId: 'learn.lion',
  childTitle: 'Lion',
  archetype: 'animal',
  rootConceptRefs: ['animals.lion'],
  sections: [
    {
      sectionId: 'lion.meet-lion',
      childTitle: 'Meet the lion',
      knowledgeRefs: [],
      depthBands: ['d0_first_play', 'd1_preschool'],
      recipeFamilies: ['explore']
    },
    {
      sectionId: 'lion.body',
      childTitle: 'Look at its body',
      knowledgeRefs: [],
      depthBands: ['d0_first_play', 'd1_preschool', 'd2_early_primary'],
      recipeFamilies: ['explore']
    },
    {
      sectionId: 'lion.sound',
      childTitle: 'Listen for its sound',
      knowledgeRefs: [],
      depthBands: ['d0_first_play', 'd1_preschool', 'd2_early_primary'],
      recipeFamilies: ['explore']
    },
    {
      sectionId: 'lion.habitat',
      childTitle: 'Where lions rest',
      knowledgeRefs: ['kr.animals.lion.home.den'],
      depthBands: ['d0_first_play', 'd1_preschool', 'd2_early_primary', 'd3_deeper_primary'],
      recipeFamilies: ['explore', 'did_you_know']
    },
    {
      sectionId: 'lion.food-behaviour',
      childTitle: 'Food & behaviour',
      knowledgeRefs: [],
      depthBands: ['d1_preschool', 'd2_early_primary', 'd3_deeper_primary'],
      recipeFamilies: ['explore']
    },
    {
      sectionId: 'lion.family',
      childTitle: 'Lion family',
      knowledgeRefs: [],
      depthBands: ['d1_preschool', 'd2_early_primary', 'd3_deeper_primary'],
      recipeFamilies: ['explore']
    },
    {
      sectionId: 'lion.animal-neighbours',
      childTitle: 'Animal homes & families',
      knowledgeRefs: [
        'kr.animals.lion.home.den',
        'kr.animals.dog.home.kennel',
        'kr.animals.cow.home.shed',
        'kr.animals.cow.young.calf'
      ],
      depthBands: ['d2_early_primary', 'd3_deeper_primary'],
      recipeFamilies: ['explore', 'did_you_know', 'compare', 'guess']
    }
  ]
} as const satisfies LearnAboutTopic;

export const FIRE_STATION_LEARN_ABOUT_TOPIC = {
  schemaVersion: 1,
  topicId: 'learn.fire-station',
  childTitle: 'Fire Station',
  archetype: 'community_place',
  rootConceptRefs: ['community.fire-station'],
  sections: [
    {
      sectionId: 'fire-station.place',
      childTitle: 'The fire station',
      knowledgeRefs: [],
      depthBands: ['d0_first_play', 'd1_preschool', 'd2_early_primary'],
      recipeFamilies: ['explore']
    },
    {
      sectionId: 'fire-station.firefighter',
      childTitle: 'Firefighter',
      knowledgeRefs: [],
      depthBands: ['d0_first_play', 'd1_preschool', 'd2_early_primary'],
      recipeFamilies: ['explore']
    },
    {
      sectionId: 'fire-station.engine',
      childTitle: 'Fire engine',
      knowledgeRefs: [],
      depthBands: ['d0_first_play', 'd1_preschool', 'd2_early_primary'],
      recipeFamilies: ['explore']
    },
    {
      sectionId: 'fire-station.hose',
      childTitle: 'Hose',
      knowledgeRefs: [],
      depthBands: ['d0_first_play', 'd1_preschool', 'd2_early_primary'],
      recipeFamilies: ['explore']
    },
    {
      sectionId: 'fire-station.equipment',
      childTitle: 'Helmet & equipment',
      knowledgeRefs: [],
      depthBands: ['d0_first_play', 'd1_preschool', 'd2_early_primary'],
      recipeFamilies: ['explore']
    }
  ]
} as const satisfies LearnAboutTopic;

export const LEARN_ABOUT_TOPICS: readonly LearnAboutTopic[] = [
  EARTH_LEARN_ABOUT_TOPIC,
  LION_LEARN_ABOUT_TOPIC,
  FIRE_STATION_LEARN_ABOUT_TOPIC
];

export function getLearnAboutTopic(topicId: string): LearnAboutTopic | undefined {
  return LEARN_ABOUT_TOPICS.find((topic) => topic.topicId === topicId);
}
