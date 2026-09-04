import { describe, expect, it } from 'vitest';
import type { LearnAboutTopic } from '../src/experience/learnAboutContract';
import { projectLearnAboutActivities } from '../src/experience/learnAboutProjection';

const earthTopic: LearnAboutTopic = {
  schemaVersion: 1,
  topicId: 'learn.earth',
  childTitle: 'Earth',
  archetype: 'celestial_system',
  rootConceptRefs: ['concept.earth'],
  sections: [
    {
      sectionId: 'earth.look',
      childTitle: 'Look',
      knowledgeRefs: ['knowledge.earth.shape'],
      depthBands: ['d0_first_play', 'd1_preschool'],
      recipeFamilies: ['explore', 'did_you_know']
    },
    {
      sectionId: 'earth.compare',
      childTitle: 'Compare',
      knowledgeRefs: ['relation.earth.moon'],
      depthBands: ['d2_early_primary'],
      recipeFamilies: ['compare', 'try_it']
    }
  ]
};

describe('Learn About projection', () => {
  it('always keeps Explore non-evaluative and does not manufacture mastery', () => {
    const activities = projectLearnAboutActivities(earthTopic, 'd0_first_play', { admittedKnowledgeRefs: [] });
    expect(activities).toEqual([
      {
        topicId: 'learn.earth',
        sectionId: 'earth.look',
        family: 'explore',
        depthBand: 'd0_first_play',
        rootConceptRefs: ['concept.earth'],
        knowledgeRefs: [],
        affectsMastery: false
      }
    ]);
  });

  it('projects Did You Know only from explicitly admitted canonical knowledge refs', () => {
    const blocked = projectLearnAboutActivities(earthTopic, 'd1_preschool', { admittedKnowledgeRefs: [] });
    expect(blocked.some((activity) => activity.family === 'did_you_know')).toBe(false);

    const admitted = projectLearnAboutActivities(earthTopic, 'd1_preschool', {
      admittedKnowledgeRefs: ['knowledge.earth.shape']
    });
    expect(admitted.find((activity) => activity.family === 'did_you_know')?.knowledgeRefs).toEqual(['knowledge.earth.shape']);
  });

  it('projects Compare/Try It only when a relationship is both admitted and supported', () => {
    const unsupported = projectLearnAboutActivities(earthTopic, 'd2_early_primary', {
      admittedKnowledgeRefs: ['knowledge.earth.shape', 'relation.earth.moon']
    });
    expect(unsupported.some((activity) => activity.family === 'compare')).toBe(false);

    const supportedButNotAdmitted = projectLearnAboutActivities(earthTopic, 'd2_early_primary', {
      admittedKnowledgeRefs: ['knowledge.earth.shape'],
      supportedRelationshipRefs: ['relation.earth.moon']
    });
    expect(supportedButNotAdmitted.some((activity) => activity.family === 'compare' || activity.family === 'try_it')).toBe(false);

    const supported = projectLearnAboutActivities(earthTopic, 'd2_early_primary', {
      admittedKnowledgeRefs: ['knowledge.earth.shape', 'relation.earth.moon'],
      supportedRelationshipRefs: ['relation.earth.moon']
    });
    expect(supported.filter((activity) => activity.sectionId === 'earth.compare').map((activity) => activity.family)).toEqual(['compare', 'try_it']);
  });

  it('rejects malformed or duplicate authority refs instead of normalizing them silently', () => {
    expect(() => projectLearnAboutActivities(earthTopic, 'd1_preschool', {
      admittedKnowledgeRefs: ['bad ref']
    })).toThrow(/stable ref/);
    expect(() => projectLearnAboutActivities(earthTopic, 'd1_preschool', {
      admittedKnowledgeRefs: ['knowledge.earth.shape', 'knowledge.earth.shape']
    })).toThrow(/duplicates/);
  });

  it('does not fork Guess or Practice evaluators into the projection layer', () => {
    const topic: LearnAboutTopic = {
      ...earthTopic,
      sections: [{
        ...earthTopic.sections[0],
        recipeFamilies: ['explore', 'guess', 'practice']
      }]
    };
    expect(projectLearnAboutActivities(topic, 'd1_preschool', {
      admittedKnowledgeRefs: ['knowledge.earth.shape']
    }).map((activity) => activity.family)).toEqual(['explore']);
  });
});
