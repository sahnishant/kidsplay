import { describe, expect, it } from 'vitest';
import { LEARN_ABOUT_TOPICS } from '../src/experience/learnAboutCatalog';
import { validateLearnAboutTopic } from '../src/experience/learnAboutContract';
import { isAuthoritativeLearnAboutKnowledgeRef } from '../src/experience/learnAboutKnowledge';
import {
  createLearnAboutRuntimeSession,
  LEARN_ABOUT_RUNTIME_ID
} from '../src/experience/learnAboutRuntime';

const topicIds = ['learn.earth', 'learn.lion', 'learn.fire-station'] as const;

function families(topicId: (typeof topicIds)[number], depth: 'd0_first_play' | 'd2_early_primary' | 'd3_deeper_primary') {
  return createLearnAboutRuntimeSession(topicId, depth).sections.flatMap((section) => section.cards.map((card) => card.family));
}

describe('Learn About V1 production runtime', () => {
  it('runs Earth, Lion and Fire Station through the same reusable runtime', () => {
    expect(LEARN_ABOUT_TOPICS.map((topic) => topic.topicId)).toEqual(topicIds);

    for (const topicId of topicIds) {
      const session = createLearnAboutRuntimeSession(topicId, 'd0_first_play');
      expect(session.runtimeId).toBe(LEARN_ABOUT_RUNTIME_ID);
      expect(session.topicId).toBe(topicId);
      expect(session.sections.length).toBeGreaterThan(0);
    }
  });

  it('keeps D0 opening/exploration non-evaluative and free of mastery evidence', () => {
    for (const topicId of topicIds) {
      const session = createLearnAboutRuntimeSession(topicId, 'd0_first_play');
      const cards = session.sections.flatMap((section) => section.cards);
      expect(cards.length).toBeGreaterThan(0);
      expect(cards.every((card) => card.evidenceMode === 'none')).toBe(true);
      expect(cards.every((card) => card.question === undefined)).toBe(true);
    }
  });

  it('only projects Did You Know from reviewed canonical rows', () => {
    for (const topicId of topicIds) {
      const session = createLearnAboutRuntimeSession(topicId, 'd2_early_primary');
      for (const card of session.sections.flatMap((section) => section.cards)) {
        if (card.family !== 'did_you_know') continue;
        expect(card.knowledgeRows.length).toBeGreaterThan(0);
        expect(card.knowledgeRows.every((row) => isAuthoritativeLearnAboutKnowledgeRef(row.rowId))).toBe(true);
      }
    }

    expect(families('learn.fire-station', 'd2_early_primary')).toEqual(
      expect.arrayContaining(['explore'])
    );
    expect(families('learn.fire-station', 'd2_early_primary')).not.toContain('did_you_know');
  });

  it('fails closed when an authority-empty section tries to own a factual/evaluative recipe', () => {
    expect(() => validateLearnAboutTopic({
      schemaVersion: 1,
      topicId: 'learn.invalid',
      childTitle: 'Invalid',
      archetype: 'community_place',
      rootConceptRefs: ['invalid.topic'],
      sections: [{
        sectionId: 'invalid.fact',
        childTitle: 'Unsupported fact',
        knowledgeRefs: [],
        depthBands: ['d0_first_play'],
        recipeFamilies: ['did_you_know']
      }]
    })).toThrow(/authority-empty sections may only use Explore/);
  });

  it('reuses shared Riddle/Guess records and the existing single_choice evaluator contract', () => {
    const earth = createLearnAboutRuntimeSession('learn.earth', 'd2_early_primary');
    const lion = createLearnAboutRuntimeSession('learn.lion', 'd2_early_primary');
    const guesses = [...earth.sections, ...lion.sections]
      .flatMap((section) => section.cards)
      .filter((card) => card.family === 'guess');

    expect(guesses.map((card) => card.riddle?.clue.clueSetId)).toEqual(expect.arrayContaining([
      'riddle.r2.earth.planet-third',
      'riddle.r0.dog.kennel',
      'riddle.r2.cow.calf-shed'
    ]));
    expect(guesses.length).toBeGreaterThanOrEqual(3);
    for (const card of guesses) {
      expect(card.evidenceMode).toBe('evaluated_question');
      expect(card.question?.interaction.type).toBe('single_choice');
      expect(card.riddle?.placement.evaluatorKey).toBe('single_choice@1');
      expect(card.riddle?.surface).toBe('learn_about');
    }
  });

  it('projects Compare/Try It only from admitted semantic relationships', () => {
    const earthFamilies = families('learn.earth', 'd2_early_primary');
    const lionFamilies = families('learn.lion', 'd2_early_primary');
    expect(earthFamilies).toContain('compare');
    expect(earthFamilies).toContain('try_it');
    expect(lionFamilies).toContain('compare');

    for (const topicId of ['learn.earth', 'learn.lion'] as const) {
      const session = createLearnAboutRuntimeSession(topicId, 'd2_early_primary');
      for (const card of session.sections.flatMap((section) => section.cards)) {
        if (card.family !== 'compare' && card.family !== 'try_it') continue;
        expect(card.knowledgeRows.length).toBeGreaterThan(0);
        expect(card.knowledgeRows.every((row) => isAuthoritativeLearnAboutKnowledgeRef(row.rowId))).toBe(true);
        expect(card.evidenceMode).toBe('none');
      }
    }
  });

  it('provides a deeper D3 path without cloning age-specific truths', () => {
    const earthD2 = createLearnAboutRuntimeSession('learn.earth', 'd2_early_primary');
    const earthD3 = createLearnAboutRuntimeSession('learn.earth', 'd3_deeper_primary');
    expect(earthD3.sections.length).toBeGreaterThan(earthD2.sections.length);

    const allCatalogKnowledgeRefs = LEARN_ABOUT_TOPICS.flatMap((topic) =>
      topic.sections.flatMap((section) => section.knowledgeRefs)
    );
    expect(allCatalogKnowledgeRefs.every((rowId) => isAuthoritativeLearnAboutKnowledgeRef(rowId))).toBe(true);
  });
});
