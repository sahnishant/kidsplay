import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { EARTH_LEARN_ABOUT_TOPIC, getLearnAboutTopic } from '../src/experience/learnAboutCatalog';
import { projectLearnAboutActivities } from '../src/experience/learnAboutProjection';

function reviewedEarthRows(): Set<string> {
  const source = JSON.parse(readFileSync(resolve(process.cwd(), 'content', 'knowledge', 'class2-earth-universe.json'), 'utf8')) as Array<{
    entries: Array<{ rowId: string }>;
    authoring: { status: string };
  }>;
  return new Set(source.flatMap((set) => set.authoring.status === 'reviewed' ? set.entries.map((entry) => entry.rowId) : []));
}

describe('Earth Learn About production catalog', () => {
  it('contains only refs already admitted by reviewed canonical Earth knowledge', () => {
    const authority = reviewedEarthRows();
    const topicRefs = EARTH_LEARN_ABOUT_TOPIC.sections.flatMap((section) => section.knowledgeRefs);
    expect(topicRefs.length).toBeGreaterThanOrEqual(7);
    expect(topicRefs.every((ref) => authority.has(ref))).toBe(true);
  });

  it('has a zero-reading-depth exploration entry and progressively deeper sections without copying fact prose', () => {
    expect(EARTH_LEARN_ABOUT_TOPIC.sections.some((section) => section.depthBands.includes('d0_first_play'))).toBe(true);
    expect(EARTH_LEARN_ABOUT_TOPIC.sections.some((section) => section.depthBands.includes('d3_deeper_primary'))).toBe(true);
    expect(JSON.stringify(EARTH_LEARN_ABOUT_TOPIC)).not.toMatch(/factText|answerText|definitionText|mastery|score/i);
  });

  it('projects reviewed Did You Know activities while keeping Learn About non-evaluative', () => {
    const authority = [...reviewedEarthRows()];
    const activities = projectLearnAboutActivities(EARTH_LEARN_ABOUT_TOPIC, 'd2_early_primary', {
      admittedKnowledgeRefs: authority,
      supportedRelationshipRefs: ['kr.universe.earth.rotation.day-night']
    });
    expect(activities.some((activity) => activity.family === 'did_you_know')).toBe(true);
    expect(activities.every((activity) => activity.affectsMastery === false)).toBe(true);
  });

  it('is reachable from the generic Learn About catalog by stable topic id', () => {
    expect(getLearnAboutTopic('learn.earth')).toBe(EARTH_LEARN_ABOUT_TOPIC);
    expect(getLearnAboutTopic('learn.missing')).toBeUndefined();
  });
});
