import type { LearnAboutTopic } from './learnAboutContract';

/** Navigation/projection metadata only. Factual claims remain owned by reviewed canonical rows. */
export const EARTH_LEARN_ABOUT_TOPIC = {
  schemaVersion: 1,
  topicId: 'learn.earth',
  childTitle: 'Earth',
  archetype: 'celestial_system',
  rootConceptRefs: ['universe.earth.planet'],
  sections: [
    { sectionId: 'earth.meet-earth', childTitle: 'Meet Earth', knowledgeRefs: ['kr.universe.earth.type.planet'], depthBands: ['d0_first_play', 'd1_preschool'], recipeFamilies: ['explore', 'did_you_know', 'guess'] },
    { sectionId: 'earth.land-water', childTitle: 'Land & water', knowledgeRefs: [], depthBands: ['d0_first_play', 'd1_preschool'], recipeFamilies: ['explore'] },
    { sectionId: 'earth.day-and-night', childTitle: 'Day and Night', knowledgeRefs: ['kr.universe.earth.rotation.day-night'], depthBands: ['d2_early_primary'], recipeFamilies: ['explore', 'did_you_know', 'try_it'] },
    { sectionId: 'earth.water-changes', childTitle: 'Water can change', knowledgeRefs: [], depthBands: ['d2_early_primary', 'd3_deeper_primary'], recipeFamilies: ['explore'] },
    { sectionId: 'earth.space-neighbours', childTitle: 'Space Neighbours', knowledgeRefs: ['kr.universe.earth.type.planet', 'kr.universe.sun.type.star', 'kr.universe.moon.type.satellite', 'kr.universe.earth.position.third'], depthBands: ['d2_early_primary', 'd3_deeper_primary'], recipeFamilies: ['explore', 'did_you_know', 'compare', 'guess'] },
    { sectionId: 'earth.go-deeper', childTitle: 'Go Deeper', knowledgeRefs: ['kr.universe.sun.type.star', 'kr.universe.moonlight.source.sun', 'kr.universe.orbit.definition.planet-path'], depthBands: ['d3_deeper_primary'], recipeFamilies: ['explore', 'did_you_know', 'practice'] }
  ]
} as const satisfies LearnAboutTopic;

export const LION_LEARN_ABOUT_TOPIC = {
  schemaVersion: 1,
  topicId: 'learn.lion',
  childTitle: 'Lion',
  archetype: 'animal',
  rootConceptRefs: ['animals.lion'],
  sections: [
    { sectionId: 'lion.meet-lion', childTitle: 'Meet the lion', knowledgeRefs: [], depthBands: ['d0_first_play', 'd1_preschool'], recipeFamilies: ['explore'] },
    { sectionId: 'lion.body', childTitle: 'Look at its body', knowledgeRefs: [], depthBands: ['d0_first_play', 'd1_preschool', 'd2_early_primary'], recipeFamilies: ['explore'] },
    { sectionId: 'lion.sound', childTitle: 'Listen for its sound', knowledgeRefs: [], depthBands: ['d0_first_play', 'd1_preschool', 'd2_early_primary'], recipeFamilies: ['explore'] },
    { sectionId: 'lion.habitat', childTitle: 'Where lions rest', knowledgeRefs: ['kr.animals.lion.home.den'], depthBands: ['d0_first_play', 'd1_preschool', 'd2_early_primary', 'd3_deeper_primary'], recipeFamilies: ['explore', 'did_you_know'] },
    { sectionId: 'lion.food-behaviour', childTitle: 'Food & behaviour', knowledgeRefs: [], depthBands: ['d1_preschool', 'd2_early_primary', 'd3_deeper_primary'], recipeFamilies: ['explore'] },
    { sectionId: 'lion.family', childTitle: 'Lion family', knowledgeRefs: [], depthBands: ['d1_preschool', 'd2_early_primary', 'd3_deeper_primary'], recipeFamilies: ['explore'] },
    { sectionId: 'lion.animal-neighbours', childTitle: 'Animal homes & families', knowledgeRefs: ['kr.animals.lion.home.den', 'kr.animals.dog.home.kennel', 'kr.animals.cow.home.shed', 'kr.animals.cow.young.calf'], depthBands: ['d2_early_primary', 'd3_deeper_primary'], recipeFamilies: ['explore', 'did_you_know', 'compare', 'guess'] }
  ]
} as const satisfies LearnAboutTopic;

export const FIRE_STATION_LEARN_ABOUT_TOPIC = {
  schemaVersion: 1,
  topicId: 'learn.fire-station',
  childTitle: 'Fire Station',
  archetype: 'community_place',
  rootConceptRefs: ['community.fire-station'],
  sections: [
    { sectionId: 'fire-station.place', childTitle: 'The fire station', knowledgeRefs: [], depthBands: ['d0_first_play', 'd1_preschool', 'd2_early_primary'], recipeFamilies: ['explore'] },
    { sectionId: 'fire-station.firefighter', childTitle: 'Firefighter', knowledgeRefs: [], depthBands: ['d0_first_play', 'd1_preschool', 'd2_early_primary'], recipeFamilies: ['explore'] },
    { sectionId: 'fire-station.engine', childTitle: 'Fire engine', knowledgeRefs: [], depthBands: ['d0_first_play', 'd1_preschool', 'd2_early_primary'], recipeFamilies: ['explore'] },
    { sectionId: 'fire-station.hose', childTitle: 'Hose', knowledgeRefs: [], depthBands: ['d0_first_play', 'd1_preschool', 'd2_early_primary'], recipeFamilies: ['explore'] },
    { sectionId: 'fire-station.equipment', childTitle: 'Helmet & equipment', knowledgeRefs: [], depthBands: ['d0_first_play', 'd1_preschool', 'd2_early_primary'], recipeFamilies: ['explore'] }
  ]
} as const satisfies LearnAboutTopic;

/** Mathematical manipulations are referenced by studio bindings, not represented as invented association claims. */
export const FRACTIONS_LEARN_ABOUT_TOPIC = {
  schemaVersion: 1,
  topicId: 'learn.fractions',
  childTitle: 'Fractions',
  archetype: 'how_it_works',
  rootConceptRefs: ['math.fractions.equal-part-allocation'],
  sections: [
    { sectionId: 'fractions.equal-shares', childTitle: 'Equal shares', knowledgeRefs: [], depthBands: ['d1_preschool'], recipeFamilies: ['explore'] },
    { sectionId: 'fractions.share-with-friends', childTitle: 'Share with friends', knowledgeRefs: [], depthBands: ['d2_early_primary', 'd3_deeper_primary'], recipeFamilies: ['explore'] },
    { sectionId: 'fractions.same-half', childTitle: 'Half, different pieces', knowledgeRefs: [], depthBands: ['d2_early_primary', 'd3_deeper_primary'], recipeFamilies: ['explore'] },
    { sectionId: 'fractions.make-and-share', childTitle: 'Make and share', knowledgeRefs: [], depthBands: ['d2_early_primary', 'd3_deeper_primary'], recipeFamilies: ['explore'] }
  ]
} as const satisfies LearnAboutTopic;

/** A topic home for reviewed plant sources and existing process activities, not another plant-fact bank. */
export const PLANTS_LEARN_ABOUT_TOPIC = {
  schemaVersion: 1,
  topicId: 'learn.plants',
  childTitle: 'Plants',
  archetype: 'nature_system',
  rootConceptRefs: ['sof3.plants.germination'],
  sections: [
    { sectionId: 'plants.seed-growth', childTitle: 'A seed begins to grow', knowledgeRefs: [], depthBands: ['d2_early_primary', 'd3_deeper_primary'], recipeFamilies: ['explore'] },
    { sectionId: 'plants.parts', childTitle: 'Plant parts & jobs', knowledgeRefs: [], depthBands: ['d1_preschool', 'd2_early_primary', 'd3_deeper_primary'], recipeFamilies: ['explore'] },
    { sectionId: 'plants.uses', childTitle: 'Useful plants', knowledgeRefs: [], depthBands: ['d2_early_primary', 'd3_deeper_primary'], recipeFamilies: ['explore'] }
  ]
} as const satisfies LearnAboutTopic;

/** These navigation homes contain no new truth: each guided match reuses a reviewed source question. */
export const HUMAN_BODY_LEARN_ABOUT_TOPIC = {
  schemaVersion: 1,
  topicId: 'learn.human-body',
  childTitle: 'Human Body',
  archetype: 'body_system',
  rootConceptRefs: ['human.senses.eyes'],
  sections: [
    { sectionId: 'human.senses', childTitle: 'Sense organs', knowledgeRefs: [], depthBands: ['d1_preschool', 'd2_early_primary', 'd3_deeper_primary'], recipeFamilies: ['explore'] },
    { sectionId: 'human.organs', childTitle: 'Body parts & jobs', knowledgeRefs: [], depthBands: ['d2_early_primary', 'd3_deeper_primary'], recipeFamilies: ['explore'] }
  ]
} as const satisfies LearnAboutTopic;

export const FOOD_LEARN_ABOUT_TOPIC = {
  schemaVersion: 1,
  topicId: 'learn.food',
  childTitle: 'Food',
  archetype: 'how_it_works',
  rootConceptRefs: ['food.sources.milk'],
  sections: [
    { sectionId: 'food.sources', childTitle: 'Where food comes from', knowledgeRefs: [], depthBands: ['d1_preschool', 'd2_early_primary', 'd3_deeper_primary'], recipeFamilies: ['explore'] },
    { sectionId: 'food.habits', childTitle: 'Food habits', knowledgeRefs: [], depthBands: ['d2_early_primary', 'd3_deeper_primary'], recipeFamilies: ['explore'] }
  ]
} as const satisfies LearnAboutTopic;

export const HOMES_CLOTHES_LEARN_ABOUT_TOPIC = {
  schemaVersion: 1,
  topicId: 'learn.homes-clothes',
  childTitle: 'Homes & Clothes',
  archetype: 'how_it_works',
  rootConceptRefs: ['housing.types.igloo'],
  sections: [
    { sectionId: 'housing.types', childTitle: 'Different homes', knowledgeRefs: [], depthBands: ['d2_early_primary', 'd3_deeper_primary'], recipeFamilies: ['explore'] },
    { sectionId: 'clothing.weather', childTitle: 'Clothes for weather', knowledgeRefs: [], depthBands: ['d2_early_primary', 'd3_deeper_primary'], recipeFamilies: ['explore'] }
  ]
} as const satisfies LearnAboutTopic;

export const HEALTHY_SAFE_LEARN_ABOUT_TOPIC = {
  schemaVersion: 1,
  topicId: 'learn.healthy-safe',
  childTitle: 'Healthy & Safe',
  archetype: 'how_it_works',
  rootConceptRefs: ['habits.daily.brush-teeth'],
  sections: [
    { sectionId: 'habits.daily', childTitle: 'Healthy habits', knowledgeRefs: [], depthBands: ['d2_early_primary', 'd3_deeper_primary'], recipeFamilies: ['explore'] },
    { sectionId: 'safety.rules', childTitle: 'Everyday safety', knowledgeRefs: [], depthBands: ['d2_early_primary', 'd3_deeper_primary'], recipeFamilies: ['explore'] }
  ]
} as const satisfies LearnAboutTopic;

export const LEARN_ABOUT_TOPICS: readonly LearnAboutTopic[] = [
  EARTH_LEARN_ABOUT_TOPIC,
  LION_LEARN_ABOUT_TOPIC,
  FIRE_STATION_LEARN_ABOUT_TOPIC,
  FRACTIONS_LEARN_ABOUT_TOPIC,
  PLANTS_LEARN_ABOUT_TOPIC,
  HUMAN_BODY_LEARN_ABOUT_TOPIC,
  FOOD_LEARN_ABOUT_TOPIC,
  HOMES_CLOTHES_LEARN_ABOUT_TOPIC,
  HEALTHY_SAFE_LEARN_ABOUT_TOPIC
];

export function getLearnAboutTopic(topicId: string): LearnAboutTopic | undefined {
  return LEARN_ABOUT_TOPICS.find((topic) => topic.topicId === topicId);
}
