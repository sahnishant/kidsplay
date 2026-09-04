import { validateLearnAboutTopic, type LearnAboutTopic } from './learnAboutContract';

export const EARTH_LEARN_ABOUT_TOPIC = validateLearnAboutTopic({
  schemaVersion: 1,
  topicId: 'learn.earth',
  childTitle: 'Earth',
  archetype: 'celestial_system',
  rootConceptRefs: ['universe.earth'],
  sections: [
    {
      sectionId: 'earth.meet-earth',
      childTitle: 'Meet Earth',
      knowledgeRefs: ['kr.universe.earth.type.planet'],
      depthBands: ['d0_first_play', 'd1_preschool', 'd2_early_primary', 'd3_deeper_primary'],
      recipeFamilies: ['explore', 'did_you_know']
    },
    {
      sectionId: 'earth.land-water',
      childTitle: 'Land & water',
      knowledgeRefs: [],
      depthBands: ['d0_first_play', 'd1_preschool'],
      recipeFamilies: ['explore']
    },
    {
      sectionId: 'earth.in-space',
      childTitle: 'Earth in space',
      knowledgeRefs: [
        'kr.universe.earth.type.planet',
        'kr.universe.earth.position.third',
        'kr.universe.sun.type.star'
      ],
      depthBands: ['d1_preschool', 'd2_early_primary', 'd3_deeper_primary'],
      recipeFamilies: ['explore', 'did_you_know', 'compare', 'guess']
    },
    {
      sectionId: 'earth.moon',
      childTitle: 'Earth & Moon',
      knowledgeRefs: [
        'kr.universe.moon.type.satellite',
        'kr.universe.moonlight.source.sun'
      ],
      depthBands: ['d1_preschool', 'd2_early_primary', 'd3_deeper_primary'],
      recipeFamilies: ['explore', 'did_you_know', 'compare']
    },
    {
      sectionId: 'earth.day-night',
      childTitle: 'Day & night',
      knowledgeRefs: ['kr.universe.earth.rotation.day-night'],
      depthBands: ['d2_early_primary', 'd3_deeper_primary'],
      recipeFamilies: ['explore', 'did_you_know', 'try_it']
    },
    {
      sectionId: 'earth.go-deeper',
      childTitle: 'More space clues',
      knowledgeRefs: [
        'kr.universe.orbit.definition.planet-path',
        'kr.universe.mars.name.red-planet',
        'kr.universe.jupiter.property.largest',
        'kr.universe.saturn.feature.rings'
      ],
      depthBands: ['d3_deeper_primary'],
      recipeFamilies: ['explore', 'did_you_know', 'compare', 'practice']
    }
  ]
});

export const LION_LEARN_ABOUT_TOPIC = validateLearnAboutTopic({
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
});

export const FIRE_STATION_LEARN_ABOUT_TOPIC = validateLearnAboutTopic({
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
});

export const LEARN_ABOUT_TOPICS: readonly LearnAboutTopic[] = [
  EARTH_LEARN_ABOUT_TOPIC,
  LION_LEARN_ABOUT_TOPIC,
  FIRE_STATION_LEARN_ABOUT_TOPIC
];

export function getLearnAboutTopic(topicId: string): LearnAboutTopic | undefined {
  return LEARN_ABOUT_TOPICS.find((topic) => topic.topicId === topicId);
}
