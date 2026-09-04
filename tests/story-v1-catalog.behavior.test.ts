import { describe, expect, it } from 'vitest';
import { STORIES_V1, getStory, storyWordCount } from '../src/experience/storyCatalog';
import { validateStoryReadingState } from '../src/experience/storiesContract';

describe('Stories V1 production pack', () => {
  it('contains two calm bedtime stories plus Shaitanu humour and Scientu/Dheu friendship stories', () => {
    expect(STORIES_V1.filter((story) => story.durationBand === 'bedtime_story')).toHaveLength(2);
    expect(STORIES_V1.some((story) => story.storyId.includes('shaitanu'))).toBe(true);
    expect(STORIES_V1.some((story) => story.storyId.includes('scientu'))).toBe(true);
    expect(STORIES_V1.some((story) => story.beats.some((beat) => beat.characterIds.includes('dheu')))).toBe(true);
  });

  it('spans two explicit lexical profiles and two duration bands', () => {
    expect(new Set(STORIES_V1.map((story) => story.lexicalProfileRef))).toEqual(new Set([
      'lexical.story.preschool.simple',
      'lexical.story.early-reader.simple'
    ]));
    expect(new Set(STORIES_V1.map((story) => story.durationBand))).toEqual(new Set(['tiny_tale', 'bedtime_story']));
    expect(STORIES_V1.every((story) => storyWordCount(story) > 20)).toBe(true);
  });

  it('has no mid-story assessment/mastery surface', () => {
    for (const story of STORIES_V1) {
      expect(story.assessmentPolicy).toBe('none');
      expect(story.masteryWritesAllowed).toBe(false);
      const serialized = JSON.stringify(story);
      expect(serialized).not.toMatch(/correctOption|rewardCurrency|accuracy|streak|\"xp\"/i);
    }
  });

  it('restores exact beat and favourite state after a process-kill style JSON round trip', () => {
    const manifest = getStory('story.dheu.moonlit-leaf');
    expect(manifest).toBeDefined();
    if (!manifest) throw new Error('fixture missing');

    const saved = {
      schemaVersion: 1 as const,
      storyId: manifest.storyId,
      currentBeatId: 'moonlit-leaf.3',
      completed: false,
      favourite: true
    };
    const restored = validateStoryReadingState(JSON.parse(JSON.stringify(saved)), manifest);
    expect(restored).toEqual(saved);
  });

  it('does not allow a stale/unknown beat to resume', () => {
    const manifest = STORIES_V1[0];
    expect(() => validateStoryReadingState({
      schemaVersion: 1,
      storyId: manifest.storyId,
      currentBeatId: 'missing.beat',
      completed: false,
      favourite: false
    }, manifest)).toThrow(/Unknown story beat/);
  });
});
