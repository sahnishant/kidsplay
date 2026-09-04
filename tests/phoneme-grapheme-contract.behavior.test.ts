import { describe, expect, it } from 'vitest';
import {
  resolveValidatedPhonemeMapping,
  validatePhonemeGraphemeMapping
} from '../src/experience/phonemeGraphemeContract';

const mapping = {
  schemaVersion: 1 as const,
  mappingId: 'phonics.en-in.b.initial',
  language: 'en',
  locale: 'en-IN',
  phonemeId: 'phoneme.en.b',
  grapheme: 'b',
  phonemeAudioUtteranceId: 'phoneme.en.b',
  examples: [
    {
      knowledgeRef: 'kr.vocabulary.ball.reviewed',
      semanticRef: 'semantic.ball',
      position: 'initial'
    }
  ],
  authority: 'kidsplay_authored_validated' as const,
  reviewerRef: 'review.phonics.en-in.batch-001',
  reviewedAt: '2026-09-04'
};

describe('explicit phoneme/grapheme authority', () => {
  it('accepts only explicitly authored/validated mappings with reviewed examples and audio id', () => {
    expect(validatePhonemeGraphemeMapping(mapping)).toMatchObject({
      mappingId: 'phonics.en-in.b.initial',
      phonemeId: 'phoneme.en.b',
      grapheme: 'b',
      authority: 'kidsplay_authored_validated'
    });
  });

  it('does not accept candidate/draft authority as runtime phonics truth', () => {
    expect(() => validatePhonemeGraphemeMapping({
      ...mapping,
      authority: 'ai_suggested'
    })).toThrow(/requires explicit authored\/validated authority/);
  });

  it('requires explicit language/locale and review metadata', () => {
    expect(() => validatePhonemeGraphemeMapping({ ...mapping, locale: 'xx invalid' })).toThrow(/language\/locale tag/);
    expect(() => validatePhonemeGraphemeMapping({ ...mapping, reviewedAt: 'today' })).toThrow(/YYYY-MM-DD/);
    expect(() => validatePhonemeGraphemeMapping({ ...mapping, reviewerRef: '' })).toThrow(/stable ref/);
  });

  it('requires canonical reviewed example refs instead of deriving examples from spelling', () => {
    expect(() => validatePhonemeGraphemeMapping({
      ...mapping,
      examples: []
    })).toThrow(/examples\[\] is required/);
  });

  it('uses exact mapping lookup and returns null for unregistered spellings or guessed ids', () => {
    expect(resolveValidatedPhonemeMapping([mapping], 'phonics.en-in.b.initial')?.phonemeId).toBe('phoneme.en.b');
    expect(resolveValidatedPhonemeMapping([mapping], 'phonics.en-in.ball.guessed')).toBeNull();
    expect(resolveValidatedPhonemeMapping([mapping], 'b')).toBeNull();
  });
});
