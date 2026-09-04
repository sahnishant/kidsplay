import type { StoryManifest } from './storiesContract';

export type StoryLexicalProfileId =
  | 'lexical.story.preschool.simple'
  | 'lexical.story.early-reader.simple';

export interface StoryLexicalProfile {
  profileId: StoryLexicalProfileId;
  language: 'en';
  /**
   * Conservative frequency-corpus ceiling used only for measurement. This is
   * not a developmental, curriculum, reading-age or editorial approval claim.
   */
  maximumCorpusGrade: 1 | 2;
  corpusRef: 'lexicon.primary.english.grade-candidates.001';
}

export interface StoryLexicalCorpusEntry {
  lemma: string;
  grade: number;
}

export interface StoryLexicalReport {
  storyId: string;
  lexicalProfileRef: StoryLexicalProfileId;
  corpusRef: StoryLexicalProfile['corpusRef'];
  maximumCorpusGrade: 1 | 2;
  measuredTokenCount: number;
  uniqueMeasuredTokenCount: number;
  inBandTokenCount: number;
  inBandRatio: number;
  outOfBandTokens: string[];
  excludedCharacterTokens: string[];
  /** Explicit reminder that this report cannot promote editorial/developmental authority. */
  authority: 'measurement_only';
}

const PROFILES: Readonly<Record<StoryLexicalProfileId, StoryLexicalProfile>> = {
  'lexical.story.preschool.simple': {
    profileId: 'lexical.story.preschool.simple',
    language: 'en',
    maximumCorpusGrade: 1,
    corpusRef: 'lexicon.primary.english.grade-candidates.001'
  },
  'lexical.story.early-reader.simple': {
    profileId: 'lexical.story.early-reader.simple',
    language: 'en',
    maximumCorpusGrade: 2,
    corpusRef: 'lexicon.primary.english.grade-candidates.001'
  }
};

function normalizeToken(value: string): string {
  return value.normalize('NFKC').toLocaleLowerCase('en-US').replace(/[’‘]/g, "'");
}

function tokenize(text: string): string[] {
  return normalizeToken(text).match(/[a-z]+(?:['-][a-z]+)?/g) ?? [];
}

export function resolveStoryLexicalProfile(profileRef: string): StoryLexicalProfile | null {
  if (!Object.hasOwn(PROFILES, profileRef)) return null;
  return { ...PROFILES[profileRef as StoryLexicalProfileId] };
}

function validateCorpusEntries(entries: readonly StoryLexicalCorpusEntry[]): Map<string, number> {
  if (!Array.isArray(entries)) throw new Error('Story lexical corpus entries must be an array');
  const grades = new Map<string, number>();
  for (const [index, entry] of entries.entries()) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new Error(`Story lexical corpus entry ${index} must be an object`);
    }
    if (typeof entry.lemma !== 'string') throw new Error(`Story lexical corpus entry ${index} lemma must be a string`);
    const lemma = normalizeToken(entry.lemma).trim();
    if (!/^[a-z]+(?:['-][a-z]+)?$/.test(lemma)) {
      throw new Error(`Story lexical corpus entry ${index} has malformed lemma ${lemma}`);
    }
    if (!Number.isInteger(entry.grade) || entry.grade < 1 || entry.grade > 6) {
      throw new Error(`${lemma}: story lexical corpus grade must be 1-6`);
    }
    if (grades.has(lemma)) throw new Error(`Story lexical corpus contains duplicate lemma ${lemma}`);
    grades.set(lemma, entry.grade);
  }
  return grades;
}

/**
 * Measures manuscript vocabulary against the existing isolated frequency corpus.
 * Character product names are excluded from the denominator. Unknown or later-
 * band words remain visible in outOfBandTokens; this function never rewrites the
 * manuscript or declares developmental/editorial suitability.
 */
export function buildStoryLexicalReport(
  manifest: StoryManifest,
  corpusEntries: readonly StoryLexicalCorpusEntry[]
): StoryLexicalReport {
  const profile = resolveStoryLexicalProfile(manifest.lexicalProfileRef);
  if (!profile) throw new Error(`${manifest.storyId}: unknown story lexical profile ${manifest.lexicalProfileRef}`);
  const corpusGrades = validateCorpusEntries(corpusEntries);
  const characterTokens = new Set(
    manifest.beats.flatMap((beat) => beat.characterIds).map(normalizeToken)
  );
  const excludedCharacterTokens = new Set<string>();
  const measuredTokens: string[] = [];

  for (const beat of manifest.beats) {
    for (const token of tokenize(beat.text)) {
      const baseToken = token.endsWith("'s") ? token.slice(0, -2) : token;
      if (characterTokens.has(baseToken)) {
        excludedCharacterTokens.add(baseToken);
        continue;
      }
      measuredTokens.push(token);
    }
  }

  if (measuredTokens.length === 0) throw new Error(`${manifest.storyId}: lexical report needs at least one measured token`);

  const inBand = measuredTokens.filter((token) => {
    const lookup = token.endsWith("'s") ? token.slice(0, -2) : token;
    const grade = corpusGrades.get(lookup);
    return grade !== undefined && grade <= profile.maximumCorpusGrade;
  });
  const outOfBandTokens = [...new Set(measuredTokens.filter((token) => {
    const lookup = token.endsWith("'s") ? token.slice(0, -2) : token;
    const grade = corpusGrades.get(lookup);
    return grade === undefined || grade > profile.maximumCorpusGrade;
  }))].sort();

  return {
    storyId: manifest.storyId,
    lexicalProfileRef: profile.profileId,
    corpusRef: profile.corpusRef,
    maximumCorpusGrade: profile.maximumCorpusGrade,
    measuredTokenCount: measuredTokens.length,
    uniqueMeasuredTokenCount: new Set(measuredTokens).size,
    inBandTokenCount: inBand.length,
    inBandRatio: inBand.length / measuredTokens.length,
    outOfBandTokens,
    excludedCharacterTokens: [...excludedCharacterTokens].sort(),
    authority: 'measurement_only'
  };
}
