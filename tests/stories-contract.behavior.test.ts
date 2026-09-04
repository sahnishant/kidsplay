import { describe, expect, it } from 'vitest';
import { validateChildAudioUtteranceManifest } from '../src/runtime/childAudioManifest';
import {
  validateStoryManifest,
  validateStoryNarrationCoverage,
  validateStoryReadingState
} from '../src/experience/storiesContract';

const story = {
  schemaVersion: 1 as const,
  storyId: 'story.forest.goodnight',
  childTitle: 'Goodnight, Forest',
  seriesId: 'series.forest.tales',
  lexicalProfileRef: 'lexical.story.band-1',
  durationBand: 'bedtime_story',
  supportedModes: ['read_to_me', 'read_together'],
  beats: [
    {
      beatId: 'story.forest.goodnight.beat-001',
      text: 'Dheu looked up at the quiet trees.',
      narrationUtteranceId: 'story.forest.goodnight.beat-001',
      sceneRef: 'scene.forest.evening',
      characterIds: ['dheu'],
      tappableWords: [
        {
          tokenId: 'story.forest.goodnight.beat-001.trees',
          displayText: 'trees',
          pronunciationUtteranceId: 'vocabulary.tree',
          reviewedMeaning: {
            senseRef: 'sense.tree.plant',
            knowledgeRef: 'kr.plant.tree.is-plant'
          }
        },
        {
          tokenId: 'story.forest.goodnight.beat-001.quiet',
          displayText: 'quiet'
        }
      ]
    }
  ],
  assessmentPolicy: 'none',
  masteryWritesAllowed: false
};

const audio = validateChildAudioUtteranceManifest({
  schemaVersion: 1,
  manifestId: 'kidsplay.voice.v1',
  entries: [
    {
      id: 'story.forest.goodnight.beat-001',
      usage: 'story_beat',
      channel: 'character',
      language: 'en-IN',
      character: 'dheu',
      bundledSrc: '/audio/stories/forest-goodnight/beat-001.mp3'
    },
    {
      id: 'vocabulary.tree',
      usage: 'vocabulary',
      channel: 'vocabulary',
      language: 'en-IN',
      bundledSrc: '/audio/vocabulary/tree.mp3'
    }
  ]
});

describe('Stories V1 contract', () => {
  it('accepts an authored manuscript that supports Read to me and owns no assessment/mastery fields', () => {
    expect(validateStoryManifest(story)).toMatchObject({
      storyId: 'story.forest.goodnight',
      assessmentPolicy: 'none',
      masteryWritesAllowed: false,
      supportedModes: ['read_to_me', 'read_together']
    });
  });

  it('rejects assessment, score, accuracy or currency authority anywhere inside story metadata', () => {
    for (const injected of [
      { score: 10 },
      { accuracy: 1 },
      { questions: ['What happened?'] },
      { xp: 100 }
    ]) {
      expect(() => validateStoryManifest({ ...story, ...injected })).toThrow(/forbidden/);
    }
  });

  it('allows pronunciation-only taps and requires exact sense + knowledge refs before reviewed meaning expansion', () => {
    const manifest = validateStoryManifest(story);
    const words = manifest.beats[0].tappableWords ?? [];
    expect(words[0].reviewedMeaning).toEqual({
      senseRef: 'sense.tree.plant',
      knowledgeRef: 'kr.plant.tree.is-plant'
    });
    expect(words[1].reviewedMeaning).toBeUndefined();
  });

  it('keeps reading persistence to resume/completed/favourite state only', () => {
    const manifest = validateStoryManifest(story);
    expect(validateStoryReadingState({
      schemaVersion: 1,
      storyId: manifest.storyId,
      currentBeatId: manifest.beats[0].beatId,
      completed: false,
      favourite: true
    }, manifest)).toEqual({
      schemaVersion: 1,
      storyId: 'story.forest.goodnight',
      currentBeatId: 'story.forest.goodnight.beat-001',
      completed: false,
      favourite: true
    });

    expect(() => validateStoryReadingState({
      schemaVersion: 1,
      storyId: manifest.storyId,
      currentBeatId: manifest.beats[0].beatId,
      completed: false,
      favourite: false,
      mastery: 'strong'
    }, manifest)).toThrow(/may not own mastery/);
  });

  it('requires story narration and word pronunciation to resolve through the shared audio manifest usages', () => {
    const manifest = validateStoryManifest(story);
    expect(() => validateStoryNarrationCoverage(manifest, audio)).not.toThrow();

    const wrongUsageAudio = validateChildAudioUtteranceManifest({
      schemaVersion: 1,
      manifestId: 'kidsplay.voice.v1',
      entries: [
        {
          id: 'story.forest.goodnight.beat-001',
          usage: 'core_prompt',
          channel: 'prompt',
          language: 'en-IN',
          bundledSrc: '/audio/core/not-story.mp3'
        },
        {
          id: 'vocabulary.tree',
          usage: 'vocabulary',
          channel: 'vocabulary',
          language: 'en-IN',
          bundledSrc: '/audio/vocabulary/tree.mp3'
        }
      ]
    });

    expect(() => validateStoryNarrationCoverage(manifest, wrongUsageAudio)).toThrow(/must use story_beat usage/);
  });
});
