import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  PUBLISHED_STORIES_V1,
  STORY_CANDIDATES_V1,
  getPublishedStory,
  getStoryCandidate,
  storyWordCount
} from '../src/experience/storyCatalog';
import {
  buildStoryLexicalReport,
  resolveStoryLexicalProfile,
  type StoryLexicalCorpusEntry
} from '../src/experience/storyLexicalReport';
import { validateStoryReadingState } from '../src/experience/storiesContract';

function primaryCorpusEntries(): StoryLexicalCorpusEntry[] {
  const corpus = JSON.parse(readFileSync(
    resolve(process.cwd(), 'content', 'lexicon', 'open', 'primary-grade-corpus.json'),
    'utf8'
  )) as {
    id: string;
    entries: Array<{ lemma: string; grade: number }>;
  };
  expect(corpus.id).toBe('lexicon.primary.english.grade-candidates.001');
  return corpus.entries;
}

describe('Stories V1 candidate pack', () => {
  it('contains two calm bedtime candidates plus Shaitanu humour and Scientu/Dheu friendship candidates', () => {
    expect(STORY_CANDIDATES_V1.filter((story) => story.durationBand === 'bedtime_story')).toHaveLength(2);
    expect(STORY_CANDIDATES_V1.some((story) => story.storyId.includes('shaitanu'))).toBe(true);
    expect(STORY_CANDIDATES_V1.some((story) => story.storyId.includes('scientu'))).toBe(true);
    expect(STORY_CANDIDATES_V1.some((story) => story.beats.some((beat) => beat.characterIds.includes('dheu')))).toBe(true);
  });

  it('keeps every machine-authored candidate draft-only until explicit editorial review', () => {
    expect(STORY_CANDIDATES_V1.every((story) => story.editorialStatus === 'draft')).toBe(true);
    expect(PUBLISHED_STORIES_V1).toEqual([]);
    expect(getPublishedStory('story.dheu.moonlit-leaf')).toBeUndefined();
    expect(getStoryCandidate('story.dheu.moonlit-leaf')?.editorialStatus).toBe('draft');
  });

  it('spans two neutral measurement-only lexical frequency bands and two duration bands', () => {
    expect(new Set(STORY_CANDIDATES_V1.map((story) => story.lexicalProfileRef))).toEqual(new Set([
      'lexical.story.frequency-band-1',
      'lexical.story.frequency-band-2'
    ]));
    expect(resolveStoryLexicalProfile('lexical.story.frequency-band-1')).toMatchObject({
      maximumCorpusGrade: 1,
      corpusRef: 'lexicon.primary.english.grade-candidates.001'
    });
    expect(resolveStoryLexicalProfile('lexical.story.frequency-band-2')).toMatchObject({
      maximumCorpusGrade: 2,
      corpusRef: 'lexicon.primary.english.grade-candidates.001'
    });
    expect(resolveStoryLexicalProfile('lexical.story.missing')).toBeNull();
    expect(new Set(STORY_CANDIDATES_V1.map((story) => story.durationBand))).toEqual(new Set(['tiny_tale', 'bedtime_story']));
    expect(STORY_CANDIDATES_V1.every((story) => storyWordCount(story) > 20)).toBe(true);
  });

  it('produces conservative numeric lexical reports without claiming editorial or developmental approval', () => {
    const entries = primaryCorpusEntries();
    const reports = STORY_CANDIDATES_V1.map((story) => buildStoryLexicalReport(story, entries));

    expect(reports).toHaveLength(STORY_CANDIDATES_V1.length);
    for (const report of reports) {
      expect(report.authority).toBe('measurement_only');
      expect(report.measuredTokenCount).toBeGreaterThan(0);
      expect(report.uniqueMeasuredTokenCount).toBeGreaterThan(0);
      expect(report.inBandTokenCount).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(report.inBandRatio)).toBe(true);
      expect(report.inBandRatio).toBeGreaterThanOrEqual(0);
      expect(report.inBandRatio).toBeLessThanOrEqual(1);
      expect(report.outOfBandTokens).toEqual([...report.outOfBandTokens].sort());
    }
    expect(reports.some((report) => report.excludedCharacterTokens.includes('dheu'))).toBe(true);
  });

  it('fails closed on a dangling lexical profile or malformed lexical corpus', () => {
    expect(() => buildStoryLexicalReport({
      ...STORY_CANDIDATES_V1[0],
      lexicalProfileRef: 'lexical.story.missing'
    }, [{ lemma: 'the', grade: 1 }])).toThrow(/unknown story lexical profile/);

    expect(() => buildStoryLexicalReport(STORY_CANDIDATES_V1[0], [
      { lemma: 'the', grade: 1 },
      { lemma: 'the', grade: 2 }
    ])).toThrow(/duplicate lemma/);
  });

  it('has no mid-story assessment/mastery surface', () => {
    for (const story of STORY_CANDIDATES_V1) {
      expect(story.assessmentPolicy).toBe('none');
      expect(story.masteryWritesAllowed).toBe(false);
      const serialized = JSON.stringify(story);
      expect(serialized).not.toMatch(/correctOption|rewardCurrency|accuracy|streak|\"xp\"/i);
    }
  });

  it('restores exact beat and favourite state after a process-kill style JSON round trip', () => {
    const manifest = getStoryCandidate('story.dheu.moonlit-leaf');
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
    const manifest = STORY_CANDIDATES_V1[0];
    expect(() => validateStoryReadingState({
      schemaVersion: 1,
      storyId: manifest.storyId,
      currentBeatId: 'missing.beat',
      completed: false,
      favourite: false
    }, manifest)).toThrow(/Unknown story beat/);
  });
});
