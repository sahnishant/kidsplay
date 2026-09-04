import { describe, expect, it } from 'vitest';
import {
  resolveChildAudioUtterance,
  validateChildAudioUtteranceManifest
} from '../src/runtime/childAudioManifest';

const validManifest = {
  schemaVersion: 1 as const,
  manifestId: 'kidsplay.voice.v1',
  entries: [
    {
      id: 'prompt.repeat',
      usage: 'core_prompt',
      channel: 'prompt',
      language: 'en-IN',
      bundledSrc: '/audio/core/repeat.mp3',
      durationMs: 620
    },
    {
      id: 'character.dheu.discovery',
      usage: 'character_reaction',
      channel: 'character',
      language: 'en-IN',
      character: 'dheu',
      bundledSrc: '/audio/characters/dheu/discovery.mp3'
    },
    {
      id: 'story.forest-night.beat-001',
      usage: 'story_beat',
      channel: 'character',
      language: 'en-IN',
      character: 'scientu',
      bundledSrc: '/audio/stories/forest-night/beat-001.mp3',
      durationMs: 2100
    }
  ]
};

describe('child audio utterance manifest', () => {
  it('accepts stable semantic ids for core, character and segmented story audio', () => {
    const manifest = validateChildAudioUtteranceManifest(validManifest);
    expect(manifest.entries.map((entry) => entry.id)).toEqual([
      'prompt.repeat',
      'character.dheu.discovery',
      'story.forest-night.beat-001'
    ]);
    expect(resolveChildAudioUtterance(manifest, 'story.forest-night.beat-001')).toMatchObject({
      usage: 'story_beat',
      channel: 'character',
      character: 'scientu',
      durationMs: 2100
    });
  });

  it('rejects duplicate or unstable ids', () => {
    expect(() => validateChildAudioUtteranceManifest({
      ...validManifest,
      entries: [validManifest.entries[0], validManifest.entries[0]]
    })).toThrow(/Duplicate audio utterance id/);

    expect(() => validateChildAudioUtteranceManifest({
      ...validManifest,
      entries: [{ ...validManifest.entries[0], id: 'Prompt Repeat' }]
    })).toThrow(/lowercase stable id/);
  });

  it('rejects remote, traversal or query-based bundled audio paths', () => {
    for (const bundledSrc of [
      'https://example.com/repeat.mp3',
      '/audio/../secret.mp3',
      '/audio/repeat.mp3?remote=1',
      '/assets/repeat.mp3'
    ]) {
      expect(() => validateChildAudioUtteranceManifest({
        ...validManifest,
        entries: [{ ...validManifest.entries[0], bundledSrc }]
      })).toThrow(/app-local \/audio\//);
    }
  });

  it('requires character identity for character-channel reactions and story beats', () => {
    expect(() => validateChildAudioUtteranceManifest({
      ...validManifest,
      entries: [{
        id: 'story.forest-night.beat-002',
        usage: 'story_beat',
        channel: 'character',
        language: 'en-IN'
      }]
    })).toThrow(/requires a character id/);
  });

  it('keeps vocabulary and phoneme utterances on their existing #175 playback channels', () => {
    expect(() => validateChildAudioUtteranceManifest({
      schemaVersion: 1,
      manifestId: 'kidsplay.voice.v1',
      entries: [{
        id: 'vocabulary.dog',
        usage: 'vocabulary',
        channel: 'prompt',
        language: 'en-IN'
      }]
    })).toThrow(/vocabulary usage must use the vocabulary channel/);

    expect(() => validateChildAudioUtteranceManifest({
      schemaVersion: 1,
      manifestId: 'kidsplay.voice.v1',
      entries: [{
        id: 'phoneme.b',
        usage: 'phoneme',
        channel: 'character',
        language: 'en-IN',
        character: 'dheu'
      }]
    })).toThrow(/phoneme usage must use the phoneme channel/);
  });
});
