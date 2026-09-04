import { describe, expect, it } from 'vitest';
import type { PhonemeGraphemeMapping } from '../src/experience/phonemeGraphemeContract';
import { buildPhonicsProgression, tracingMayStartAtStage } from '../src/experience/phonicsProgression';

function mapping(letter: string): PhonemeGraphemeMapping {
  return {
    schemaVersion: 1,
    mappingId: `phonics.en-in.${letter}.initial`,
    language: 'en',
    locale: 'en-IN',
    phonemeId: `phoneme.en.${letter}`,
    grapheme: letter,
    phonemeAudioUtteranceId: `phoneme.en.${letter}`,
    examples: [{
      knowledgeRef: `knowledge.test.${letter}.initial`,
      semanticRef: `semantic.test.${letter}.object`,
      position: 'initial'
    }],
    authority: 'kidsplay_authored_validated',
    reviewerRef: 'review.phonics.test',
    reviewedAt: '2026-09-04'
  };
}

const mappings = [mapping('b'), mapping('m'), mapping('s'), mapping('t'), mapping('f')];

describe('sound-first phonics progression', () => {
  it('runs hear -> discriminate -> object/word -> grapheme -> trace across three explicit sounds', () => {
    const progression = buildPhonicsProgression(
      mappings,
      ['phonics.en-in.m.initial', 'phonics.en-in.s.initial', 'phonics.en-in.b.initial'],
      'en-IN'
    );

    expect(progression.map((item) => item.phonemeId)).toEqual(['phoneme.en.m', 'phoneme.en.s', 'phoneme.en.b']);
    expect(progression.every((item) => item.stages.join('>') === 'hear>discriminate>connect_object_word>grapheme>trace_after_grapheme')).toBe(true);
  });

  it('preserves explicit authored order instead of inventing a spelling/alphabetic curriculum', () => {
    const progression = buildPhonicsProgression(
      mappings,
      ['phonics.en-in.t.initial', 'phonics.en-in.b.initial', 'phonics.en-in.f.initial'],
      'en-IN'
    );
    expect(progression.map((item) => item.grapheme)).toEqual(['t', 'b', 'f']);
  });

  it('permits tracing only after sound/object/grapheme introduction', () => {
    expect(tracingMayStartAtStage('hear')).toBe(false);
    expect(tracingMayStartAtStage('discriminate')).toBe(false);
    expect(tracingMayStartAtStage('connect_object_word')).toBe(false);
    expect(tracingMayStartAtStage('grapheme')).toBe(false);
    expect(tracingMayStartAtStage('trace_after_grapheme')).toBe(true);
  });

  it('fails closed on missing, duplicate, mixed-locale, or too-small mapping sets', () => {
    expect(() => buildPhonicsProgression(mappings, ['phonics.en-in.b.initial', 'phonics.en-in.m.initial'], 'en-IN')).toThrow(/3–5/);
    expect(() => buildPhonicsProgression(mappings, ['phonics.en-in.b.initial', 'phonics.en-in.b.initial', 'phonics.en-in.m.initial'], 'en-IN')).toThrow(/duplicate/);
    expect(() => buildPhonicsProgression([...mappings, { ...mapping('b') }], [
      'phonics.en-in.b.initial',
      'phonics.en-in.m.initial',
      'phonics.en-in.s.initial'
    ], 'en-IN')).toThrow(/authority contains duplicate mapping ids/);
    expect(() => buildPhonicsProgression(mappings, ['phonics.en-in.b.initial', 'phonics.en-in.m.initial', 'phonics.en-in.x.initial'], 'en-IN')).toThrow(/Missing validated/);
    expect(() => buildPhonicsProgression(
      [...mappings, { ...mapping('x'), mappingId: 'phonics.en-us.x.initial', locale: 'en-US' }],
      ['phonics.en-in.b.initial', 'phonics.en-in.m.initial', 'phonics.en-us.x.initial'],
      'en-IN'
    )).toThrow(/locale en-IN/);
  });
});
