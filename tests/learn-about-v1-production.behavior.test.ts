import { describe, expect, it } from 'vitest';
import animalHomes from '../content/knowledge/animal-homes.json';
import animalYoungOnes from '../content/knowledge/animal-young-ones.json';
import earthUniverse from '../content/knowledge/class2-earth-universe.json';
import { LEARN_ABOUT_TOPICS } from '../src/experience/learnAboutCatalog';
import { validateLearnAboutTopic, type LearnAboutDepthBand } from '../src/experience/learnAboutContract';
import { extractReviewedLearnAboutKnowledge } from '../src/experience/learnAboutKnowledge';
import { createLearnAboutRuntimeSession, LEARN_ABOUT_RUNTIME_ID } from '../src/experience/learnAboutRuntime';

const topicIds = ['learn.earth', 'learn.lion', 'learn.fire-station'] as const;
const knowledgeRows = extractReviewedLearnAboutKnowledge([earthUniverse, animalHomes, animalYoungOnes]);
const authoritativeRefs = new Set(knowledgeRows.map((row) => row.rowId));

function session(topicId: (typeof topicIds)[number], depth: LearnAboutDepthBand) {
  return createLearnAboutRuntimeSession(topicId, depth, knowledgeRows);
}

function families(topicId: (typeof topicIds)[number], depth: LearnAboutDepthBand) {
  return session(topicId, depth).sections.flatMap((section) => section.cards.map((card) => card.family));
}

describe('Learn About V1 production runtime', () => {
  it('runs Earth, Lion and Fire Station through the same reusable runtime', () => {
    expect(LEARN_ABOUT_TOPICS.map((topic) => topic.topicId)).toEqual(topicIds);
    for (const topicId of topicIds) {
      const runtime = session(topicId, 'd0_first_play');
      expect(runtime.runtimeId).toBe(LEARN_ABOUT_RUNTIME_ID);
      expect(runtime.topicId).toBe(topicId);
      expect(runtime.sections.length).toBeGreaterThan(0);
    }
  });

  it('keeps D0 opening/exploration non-evaluative and free of mastery evidence', () => {
    for (const topicId of topicIds) {
      const cards = session(topicId, 'd0_first_play').sections.flatMap((section) => section.cards);
      expect(cards.length).toBeGreaterThan(0);
      expect(cards.every((card) => card.evidenceMode === 'none')).toBe(true);
      expect(cards.every((card) => card.question === undefined)).toBe(true);
    }
  });

  it('only projects Did You Know from reviewed canonical source rows', () => {
    for (const topicId of topicIds) {
      for (const card of session(topicId, 'd2_early_primary').sections.flatMap((section) => section.cards)) {
        if (card.family !== 'did_you_know') continue;
        expect(card.knowledgeRows.length).toBeGreaterThan(0);
        expect(card.knowledgeRows.every((row) => authoritativeRefs.has(row.rowId))).toBe(true);
      }
    }
    expect(families('learn.fire-station', 'd2_early_primary')).toContain('explore');
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
        sectionId: 'invalid.fact', childTitle: 'Unsupported fact', knowledgeRefs: [],
        depthBands: ['d0_first_play'], recipeFamilies: ['did_you_know']
      }]
    })).toThrow(/authority-empty sections may only use Explore/);
  });

  it('reuses shared Riddle/Guess records and the existing single_choice evaluator contract', () => {
    const guesses = [...session('learn.earth', 'd2_early_primary').sections, ...session('learn.lion', 'd2_early_primary').sections]
      .flatMap((section) => section.cards)
      .filter((card) => card.family === 'guess');

    expect(guesses.map((card) => card.riddle?.clue.clueSetId)).toEqual(expect.arrayContaining([
      'riddle.r2.earth.planet-third', 'riddle.r0.dog.kennel', 'riddle.r2.cow.calf-shed'
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
    expect(families('learn.earth', 'd2_early_primary')).toEqual(expect.arrayContaining(['compare', 'try_it']));
    expect(families('learn.lion', 'd2_early_primary')).toContain('compare');
    for (const topicId of ['learn.earth', 'learn.lion'] as const) {
      for (const card of session(topicId, 'd2_early_primary').sections.flatMap((section) => section.cards)) {
        if (card.family !== 'compare' && card.family !== 'try_it') continue;
        expect(card.knowledgeRows.length).toBeGreaterThan(0);
        expect(card.knowledgeRows.every((row) => authoritativeRefs.has(row.rowId))).toBe(true);
        expect(card.evidenceMode).toBe('none');
      }
    }
  });

  it('reuses an existing reviewed quiz question for D3 practice', () => {
    const practice = session('learn.earth', 'd3_deeper_primary').sections.flatMap((section) => section.cards)
      .find((card) => card.family === 'practice');
    expect(practice?.question?.id).toBe('universe.hots.sun-moon-statements.001');
    expect(practice?.evidenceMode).toBe('evaluated_question');
    expect(practice?.knowledgeRows.map((row) => row.rowId)).toEqual([
      'kr.universe.sun.type.star', 'kr.universe.moonlight.source.sun'
    ]);
  });

  it('provides a deeper D3 path without cloning age-specific truths', () => {
    expect(session('learn.earth', 'd3_deeper_primary').sections.length)
      .toBeGreaterThan(session('learn.earth', 'd2_early_primary').sections.length);
    const refs = LEARN_ABOUT_TOPICS.flatMap((topic) => topic.sections.flatMap((section) => section.knowledgeRefs));
    expect(refs.every((rowId) => authoritativeRefs.has(rowId))).toBe(true);
  });
});
