import { validateLearnAboutTopic, type LearnAboutTopic } from './learnAboutContract';

/**
 * Navigation/projection metadata only. Every factual claim remains owned by the
 * reviewed canonical knowledge rows referenced below.
 */
export const EARTH_LEARN_ABOUT_TOPIC: LearnAboutTopic = validateLearnAboutTopic({
  schemaVersion: 1,
  topicId: 'learn.earth',
  childTitle: 'Earth',
  archetype: 'celestial_system',
  rootConceptRefs: ['universe.earth.planet'],
  sections: [
    {
      sectionId: 'earth.meet-earth',
      childTitle: 'Meet Earth',
      knowledgeRefs: [
        'kr.universe.earth.type.planet'
      ],
      depthBands: ['d0_first_play', 'd1_preschool'],
      recipeFamilies: ['explore', 'did_you_know', 'guess']
    },
    {
      sectionId: 'earth.day-and-night',
      childTitle: 'Day and Night',
      knowledgeRefs: [
        'kr.universe.earth.rotation.day-night'
      ],
      depthBands: ['d2_early_primary'],
      recipeFamilies: ['explore', 'did_you_know', 'try_it']
    },
    {
      sectionId: 'earth.space-neighbours',
      childTitle: 'Space Neighbours',
      knowledgeRefs: [
        // Deliberate cross-age reuse: the same reviewed row introduced in D0/D1
        // remains available when Earth is revisited in a deeper system context.
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
        'kr.universe.moonlight.source.sun',
        'kr.universe.orbit.definition.planet-path'
      ],
      depthBands: ['d3_deeper_primary'],
      recipeFamilies: ['explore', 'did_you_know', 'practice']
    }
  ]
});

export const LEARN_ABOUT_TOPICS: readonly LearnAboutTopic[] = [EARTH_LEARN_ABOUT_TOPIC];

export function getLearnAboutTopic(topicId: string): LearnAboutTopic | undefined {
  return LEARN_ABOUT_TOPICS.find((topic) => topic.topicId === topicId);
}
