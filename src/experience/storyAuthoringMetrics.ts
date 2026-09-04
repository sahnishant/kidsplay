import type { StoryDurationBand, StoryManifest } from './storiesContract';
import {
  resolveStoryLexicalProfile,
  type StoryLexicalProfileId
} from './storyLexicalReport';

export interface StoryAuthoringMetrics {
  storyId: string;
  lexicalProfileRef: StoryLexicalProfileId;
  durationBand: StoryDurationBand;
  wordCount: number;
  uniqueWordCount: number;
  sentenceCount: number;
  averageWordsPerSentence: number;
  estimatedNarrationSeconds: number;
  /** Deliberately not presented as measured audio. Real clip timing belongs to #197. */
  durationEvidence: 'word_count_estimate';
}

const DURATION_SECONDS: Record<StoryDurationBand, readonly [number, number]> = {
  tiny_tale: [20, 180],
  bedtime_story: [240, 480],
  big_story: [480, 900]
};

/**
 * One conservative calm read-to-me estimate for manuscript sizing only.
 * Lexical-band measurement/authority lives in storyLexicalReport; this module
 * deliberately does not define a second lexical policy.
 */
const ESTIMATED_NARRATION_WORDS_PER_MINUTE = 80;

function words(text: string): string[] {
  return text
    .toLocaleLowerCase('en')
    .match(/[a-z]+(?:['’][a-z]+)?/giu)
    ?.map((word) => word.replace('’', "'")) ?? [];
}

function sentences(text: string): string[] {
  return text
    .split(/[.!?]+/u)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

export function analyzeStoryAuthoringMetrics(manifest: StoryManifest): StoryAuthoringMetrics {
  const lexicalProfile = resolveStoryLexicalProfile(manifest.lexicalProfileRef);
  if (!lexicalProfile) {
    throw new Error(`${manifest.storyId}: unknown story lexical profile ${manifest.lexicalProfileRef}`);
  }

  const text = manifest.beats.map((beat) => beat.text).join(' ');
  const tokens = words(text);
  const storySentences = sentences(text);
  if (!tokens.length || !storySentences.length) throw new Error(`${manifest.storyId}: story manuscript has no measurable prose`);

  return {
    storyId: manifest.storyId,
    lexicalProfileRef: lexicalProfile.profileId,
    durationBand: manifest.durationBand,
    wordCount: tokens.length,
    uniqueWordCount: new Set(tokens).size,
    sentenceCount: storySentences.length,
    averageWordsPerSentence: tokens.length / storySentences.length,
    estimatedNarrationSeconds: Math.round((tokens.length / ESTIMATED_NARRATION_WORDS_PER_MINUTE) * 60),
    durationEvidence: 'word_count_estimate'
  };
}

/**
 * Conservative duration-label authoring gate only. Story lexical measurement is
 * delegated to storyLexicalReport so the stack has one lexical authority.
 */
export function validateStoryAuthoringMetrics(manifest: StoryManifest): StoryAuthoringMetrics {
  const metrics = analyzeStoryAuthoringMetrics(manifest);
  const [minimumSeconds, maximumSeconds] = DURATION_SECONDS[metrics.durationBand];
  if (metrics.estimatedNarrationSeconds < minimumSeconds || metrics.estimatedNarrationSeconds > maximumSeconds) {
    throw new Error(
      `${manifest.storyId}: ${metrics.durationBand} estimate ${metrics.estimatedNarrationSeconds}s is outside ${minimumSeconds}-${maximumSeconds}s`
    );
  }
  return metrics;
}

export function storyDurationRangeSeconds(durationBand: StoryDurationBand): readonly [number, number] {
  return DURATION_SECONDS[durationBand];
}
