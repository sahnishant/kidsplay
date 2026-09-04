import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { STORIES_V1, getStory, storyWordCount } from '../src/experience/storyCatalog';
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

describe('Stories V1 production pack', () => {
  it('contains two calm bedtime stories plus Shaitanu humour and Scientu/Dheu friendship stories', () => {
    expect(STORIES_V1.filter((story) => story.durationBand === 'bedtime_story')).toHaveLength(2);
    expect(STORIES_V1.some((story) => story.storyId.includes('shaitanu'))).toBe(true);
    expect(STORIES_V1.some((story) => story.storyId.includes('scientu'))).toBe(true);
    expect(STORIES_V1.some((story) => story.beats.some((beat) => beat.characterIds.includes('dheu')))).toBe(true);
  });

  it('spans two registered measurement-only lexical profiles and two duration bands', () => {
    expect(new Set(STORIES_V1.map((story) => story.lexicalProfileRef))).toEqual(new Set([
      'lexical.story.preschool.simple',
      'lexical.story.early-reader.simple'
    ]));
    expect(resolveStoryLexicalProfile('lexical.story.preschool.simple')).toMatchObject({
      maximumCorpusGrade: 1,
      corpusRef: 'lexicon.primary.english.grade-candidates.001'
    });
    expect(resolveStoryLexicalProfile('lexical.story.early-reader.simple')).toMatchObject({
      maximumCorpusGrade: 2,
      corpusRef: 'lexicon.primary.english.grade-candidates.001'
    });
    expect(resolveStoryLexicalProfile('lexical.story.missing')).toBeNull();
    expect(new Set(STORIES_V1.map((story) => story.durationBand))).toEqual(new Set(['tiny_tale', 'bedtime_story']));
    expect(STORIES_V1.every((story) => storyWordCount(story) > 20)).toBe(true);
  });

  it('produces conservative numeric lexical reports without claiming editorial or developmental approval', () => {
    const entries = primaryCorpusEntries();
    const reports = STORIES_V1.map((story) => buildStoryLexicalReport(story, entries));

    expect(reports).toHaveLength(STORIES_V1.length);
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
      ...STORIES_V1[0],
      lexicalProfileRef: 'lexical.story.missing'
    }, [{ lemma: 'the', grade: 1 }])).toThrow(/unknown story lexical profile/);

    expect(() => buildStoryLexicalReport(STORIES_V1[0], [
      { lemma: 'the', grade: 1 },
      { lemma: 'the', grade: 2 }
    ])).toThrow(/duplicate lemma/);
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
