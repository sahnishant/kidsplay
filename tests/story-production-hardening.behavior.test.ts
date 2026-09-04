import { beforeEach, describe, expect, it } from 'vitest';
import {
  PUBLISHED_STORIES_V1,
  STORY_CANDIDATES_V1,
  getStoryCandidate
} from '../src/experience/storyCatalog';
import {
  analyzeStoryAuthoringMetrics,
  storyDurationRangeSeconds,
  validateStoryAuthoringMetrics
} from '../src/experience/storyAuthoringMetrics';
import { resolveStoryLexicalProfile } from '../src/experience/storyLexicalReport';
import {
  STORY_READING_STORAGE_KEY,
  clearStoryReadingState,
  loadStoryReadingStore,
  loadStoryResumeState,
  saveStoryReadingState
} from '../src/experience/storyReadingPersistence';
import { loadProgress } from '../src/runtime/localProgress';

beforeEach(() => {
  window.localStorage.clear();
});

describe('Stories V1 production hardening', () => {
  it('uses real bounded manuscripts for two bedtime story candidates instead of a duration label on a few sentences', () => {
    const bedtime = STORY_CANDIDATES_V1.filter((story) => story.durationBand === 'bedtime_story');
    expect(bedtime).toHaveLength(2);

    for (const story of bedtime) {
      const metrics = validateStoryAuthoringMetrics(story);
      const [minimumSeconds, maximumSeconds] = storyDurationRangeSeconds('bedtime_story');
      expect(metrics.wordCount).toBeGreaterThan(300);
      expect(metrics.estimatedNarrationSeconds).toBeGreaterThanOrEqual(minimumSeconds);
      expect(metrics.estimatedNarrationSeconds).toBeLessThanOrEqual(maximumSeconds);
      expect(metrics.durationEvidence).toBe('word_count_estimate');
    }
  });

  it('publishes only the four manuscripts covered by explicit HUMAN editorial approval', () => {
    expect(STORY_CANDIDATES_V1).toHaveLength(4);
    expect(STORY_CANDIDATES_V1.every((story) => story.editorialStatus === 'reviewed')).toBe(true);
    expect(PUBLISHED_STORIES_V1).toHaveLength(4);
    expect(new Set(PUBLISHED_STORIES_V1.map((story) => story.storyId))).toEqual(
      new Set(STORY_CANDIDATES_V1.map((story) => story.storyId))
    );
  });

  it('keeps Shaitanu humour, Scientu curiosity and Dheu/friends inside the bounded candidate pack', () => {
    const shaitanu = getStoryCandidate('story.shaitanu.cape-trouble');
    const scientu = getStoryCandidate('story.scientu.tiny-question');
    const friends = getStoryCandidate('story.friends.quiet-backpack');
    expect(shaitanu?.beats.some((beat) => beat.characterIds.includes('shaitanu'))).toBe(true);
    expect(scientu?.beats.some((beat) => beat.characterIds.includes('scientu'))).toBe(true);
    expect(friends?.beats.some((beat) => beat.characterIds.includes('dheu') && beat.characterIds.includes('scientu') && beat.characterIds.includes('shaitanu'))).toBe(true);
  });

  it('uses #227 lexical-profile authority and two manuscript-consistent duration bands without inventing grade authority', () => {
    const metrics = STORY_CANDIDATES_V1.map(validateStoryAuthoringMetrics);
    expect(new Set(metrics.map((item) => item.lexicalProfileRef))).toEqual(new Set([
      'lexical.story.frequency-band-1',
      'lexical.story.frequency-band-2'
    ]));
    expect(new Set(metrics.map((item) => item.durationBand))).toEqual(new Set(['tiny_tale', 'bedtime_story']));

    for (const story of STORY_CANDIDATES_V1) {
      const lexicalProfile = resolveStoryLexicalProfile(story.lexicalProfileRef);
      expect(lexicalProfile).not.toBeNull();
      expect(lexicalProfile?.profileId).toBe(story.lexicalProfileRef);
      expect(lexicalProfile?.corpusRef).toBe('lexicon.primary.english.grade-candidates.001');
    }

    const band1 = metrics.filter((item) => item.lexicalProfileRef === 'lexical.story.frequency-band-1');
    const band2 = metrics.filter((item) => item.lexicalProfileRef === 'lexical.story.frequency-band-2');
    expect(band1.length).toBeGreaterThanOrEqual(2);
    expect(band2.length).toBeGreaterThanOrEqual(2);
    expect(metrics.every((item) => item.wordCount > 0 && item.uniqueWordCount > 0 && item.sentenceCount > 0)).toBe(true);
  });

  it('persists exact story/beat/completed/favourite state across a process-kill style reload without touching learning mastery', () => {
    const story = getStoryCandidate('story.dheu.moonlit-leaf');
    expect(story).toBeDefined();
    if (!story) throw new Error('story fixture missing');

    const progressBefore = loadProgress();
    const saved = {
      schemaVersion: 1 as const,
      storyId: story.storyId,
      currentBeatId: 'moonlit-leaf.6',
      completed: false,
      favourite: true
    };
    saveStoryReadingState(STORY_CANDIDATES_V1, story, saved);

    const persistedJson = window.localStorage.getItem(STORY_READING_STORAGE_KEY);
    expect(persistedJson).toBeTruthy();
    expect(persistedJson).not.toMatch(/mastery|accuracy|score|streak|rewardCurrency|\"xp\"/i);

    // The persistence module owns no in-memory singleton state. Re-reading the
    // serialized store is therefore the same boundary used after a process kill.
    expect(loadStoryResumeState(STORY_CANDIDATES_V1)).toEqual(saved);
    expect(loadStoryReadingStore(STORY_CANDIDATES_V1).states[story.storyId]).toEqual(saved);
    expect(loadProgress()).toEqual(progressBefore);
  });

  it('refuses to save a resume record for a story outside the active catalog', () => {
    const story = STORY_CANDIDATES_V1[0];
    const state = {
      schemaVersion: 1 as const,
      storyId: story.storyId,
      currentBeatId: story.beats[0].beatId,
      completed: false,
      favourite: false
    };

    expect(() => saveStoryReadingState([], story, state)).toThrow(/outside the active catalog/);
    expect(window.localStorage.getItem(STORY_READING_STORAGE_KEY)).toBeNull();
  });

  it('clears one story without discarding another story resume record', () => {
    const first = STORY_CANDIDATES_V1[0];
    const second = STORY_CANDIDATES_V1[1];
    saveStoryReadingState(STORY_CANDIDATES_V1, first, {
      schemaVersion: 1,
      storyId: first.storyId,
      currentBeatId: first.beats[1].beatId,
      completed: false,
      favourite: true
    });
    saveStoryReadingState(STORY_CANDIDATES_V1, second, {
      schemaVersion: 1,
      storyId: second.storyId,
      currentBeatId: second.beats[2].beatId,
      completed: false,
      favourite: false
    });

    const cleared = clearStoryReadingState(STORY_CANDIDATES_V1, first.storyId);
    expect(cleared.states[first.storyId]).toBeUndefined();
    expect(cleared.states[second.storyId]?.currentBeatId).toBe(second.beats[2].beatId);
    expect(cleared.currentStoryId).toBe(second.storyId);
  });

  it('fails closed on a stale/invalid saved beat instead of resuming corrupted story state', () => {
    const story = STORY_CANDIDATES_V1[0];
    window.localStorage.setItem(STORY_READING_STORAGE_KEY, JSON.stringify({
      version: 1,
      currentStoryId: story.storyId,
      states: {
        [story.storyId]: {
          schemaVersion: 1,
          storyId: story.storyId,
          currentBeatId: 'missing.beat',
          completed: false,
          favourite: false,
          mastery: 'strong'
        }
      }
    }));

    expect(loadStoryReadingStore(STORY_CANDIDATES_V1)).toEqual({ version: 1, currentStoryId: null, states: {} });
    expect(loadStoryResumeState(STORY_CANDIDATES_V1)).toBeNull();
  });

  it('keeps authoring-duration estimates labeled as estimates even though production narration has measured clip timing', () => {
    for (const story of STORY_CANDIDATES_V1) {
      expect(analyzeStoryAuthoringMetrics(story).durationEvidence).toBe('word_count_estimate');
    }
  });
});
