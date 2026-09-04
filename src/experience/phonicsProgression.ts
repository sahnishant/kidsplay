import {
  resolveValidatedPhonemeMapping,
  validatePhonemeGraphemeMapping,
  type PhonemeGraphemeMapping
} from './phonemeGraphemeContract';

export type PhonicsProgressionStage =
  | 'hear'
  | 'discriminate'
  | 'connect_object_word'
  | 'grapheme'
  | 'trace_after_grapheme';

export interface PhonicsProgressionItem {
  mappingId: string;
  phonemeId: string;
  grapheme: string;
  audioUtteranceId: string;
  semanticExampleRefs: readonly string[];
  stages: readonly PhonicsProgressionStage[];
}

const STAGES: readonly PhonicsProgressionStage[] = [
  'hear',
  'discriminate',
  'connect_object_word',
  'grapheme',
  'trace_after_grapheme'
];

/**
 * Builds a progression only from explicit authored/validated mapping IDs.
 * Pedagogical order is caller-authored; runtime never derives phonemes from spelling
 * or silently alphabetizes mappings into a curriculum.
 */
export function buildPhonicsProgression(
  mappings: readonly PhonemeGraphemeMapping[],
  orderedMappingIds: readonly string[],
  expectedLocale: string
): PhonicsProgressionItem[] {
  if (!Array.isArray(mappings)) throw new Error('Phonics progression mappings must be an array');
  if (!Array.isArray(orderedMappingIds)) throw new Error('Phonics progression mapping ids must be an array');
  if (orderedMappingIds.length < 3 || orderedMappingIds.length > 5) {
    throw new Error('Phonics progression proof requires 3–5 explicitly ordered sounds');
  }
  if (new Set(orderedMappingIds).size !== orderedMappingIds.length) {
    throw new Error('Phonics progression cannot contain duplicate mapping ids');
  }

  const validatedMappings = mappings.map((mapping) => validatePhonemeGraphemeMapping(mapping));
  const sourceMappingIds = validatedMappings.map((mapping) => mapping.mappingId);
  if (new Set(sourceMappingIds).size !== sourceMappingIds.length) {
    throw new Error('Phonics mapping authority contains duplicate mapping ids');
  }

  const selected = orderedMappingIds.map((mappingId) => {
    const mapping = resolveValidatedPhonemeMapping(validatedMappings, mappingId);
    if (!mapping) throw new Error(`Missing validated phoneme mapping ${mappingId}`);
    return mapping;
  });

  if (selected.some((mapping) => mapping.locale !== expectedLocale)) {
    throw new Error(`Phonics progression mappings must all use locale ${expectedLocale}`);
  }
  if (new Set(selected.map((mapping) => mapping.phonemeId)).size !== selected.length) {
    throw new Error('Phonics progression requires distinct phonemes');
  }

  return selected.map((mapping) => ({
    mappingId: mapping.mappingId,
    phonemeId: mapping.phonemeId,
    grapheme: mapping.grapheme,
    audioUtteranceId: mapping.phonemeAudioUtteranceId,
    semanticExampleRefs: mapping.examples.map((example) => example.semanticRef),
    stages: [...STAGES]
  }));
}

export function tracingMayStartAtStage(stage: PhonicsProgressionStage): boolean {
  return stage === 'trace_after_grapheme';
}
