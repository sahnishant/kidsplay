export type PhonemePosition = 'initial' | 'final' | 'medial';

export interface PhonemeExample {
  knowledgeRef: string;
  semanticRef: string;
  position: PhonemePosition;
}

export interface PhonemeGraphemeMapping {
  schemaVersion: 1;
  mappingId: string;
  language: string;
  locale: string;
  phonemeId: string;
  grapheme: string;
  phonemeAudioUtteranceId: string;
  examples: readonly PhonemeExample[];
  authority: 'kidsplay_authored_validated';
  reviewerRef: string;
  reviewedAt: string;
}

const STABLE_REF = /^[a-z0-9]+(?:[._:#-][a-z0-9]+)*$/i;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const VALID_POSITIONS = new Set<PhonemePosition>(['initial', 'final', 'medial']);

function assertStableRef(value: unknown, context: string): string {
  if (typeof value !== 'string' || !value.trim() || !STABLE_REF.test(value)) {
    throw new Error(`${context} must be a stable ref`);
  }
  return value;
}

function assertLocale(value: unknown, context: string): string {
  if (typeof value !== 'string' || !/^[a-z]{2,3}(?:-[A-Z]{2})?$/.test(value)) {
    throw new Error(`${context} must be an explicit language/locale tag`);
  }
  return value;
}

export function validatePhonemeGraphemeMapping(value: unknown): PhonemeGraphemeMapping {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Phoneme/grapheme mapping must be an object');
  }
  const raw = value as Record<string, unknown>;
  if (raw.schemaVersion !== 1) throw new Error('Phoneme/grapheme mapping must use schemaVersion 1');
  const mappingId = assertStableRef(raw.mappingId, 'mappingId');
  const language = assertLocale(raw.language, `${mappingId}.language`);
  const locale = assertLocale(raw.locale, `${mappingId}.locale`);
  if (!locale.startsWith(`${language}-`) && locale !== language) {
    throw new Error(`${mappingId}: locale must belong to the declared language`);
  }
  const phonemeId = assertStableRef(raw.phonemeId, `${mappingId}.phonemeId`);
  if (typeof raw.grapheme !== 'string' || !raw.grapheme.trim() || raw.grapheme.length > 4) {
    throw new Error(`${mappingId}: grapheme must be a short explicitly authored string`);
  }
  const grapheme = raw.grapheme.trim();
  const phonemeAudioUtteranceId = assertStableRef(raw.phonemeAudioUtteranceId, `${mappingId}.phonemeAudioUtteranceId`);

  if (!Array.isArray(raw.examples) || raw.examples.length === 0) {
    throw new Error(`${mappingId}: examples[] is required`);
  }
  const examples = raw.examples.map((example, index) => {
    if (!example || typeof example !== 'object' || Array.isArray(example)) {
      throw new Error(`${mappingId}.examples[${index}] must be an object`);
    }
    const item = example as Record<string, unknown>;
    if (typeof item.position !== 'string' || !VALID_POSITIONS.has(item.position as PhonemePosition)) {
      throw new Error(`${mappingId}.examples[${index}]: invalid phoneme position`);
    }
    return {
      knowledgeRef: assertStableRef(item.knowledgeRef, `${mappingId}.examples[${index}].knowledgeRef`),
      semanticRef: assertStableRef(item.semanticRef, `${mappingId}.examples[${index}].semanticRef`),
      position: item.position as PhonemePosition
    };
  });
  const exampleKeys = examples.map((example) => `${example.knowledgeRef}|${example.position}`);
  if (new Set(exampleKeys).size !== exampleKeys.length) throw new Error(`${mappingId}: duplicate example/position entries`);

  if (raw.authority !== 'kidsplay_authored_validated') {
    throw new Error(`${mappingId}: runtime phonics mapping requires explicit authored/validated authority`);
  }
  const reviewerRef = assertStableRef(raw.reviewerRef, `${mappingId}.reviewerRef`);
  if (typeof raw.reviewedAt !== 'string' || !ISO_DATE.test(raw.reviewedAt)) {
    throw new Error(`${mappingId}.reviewedAt must be YYYY-MM-DD`);
  }

  return {
    schemaVersion: 1,
    mappingId,
    language,
    locale,
    phonemeId,
    grapheme,
    phonemeAudioUtteranceId,
    examples,
    authority: 'kidsplay_authored_validated',
    reviewerRef,
    reviewedAt: raw.reviewedAt
  };
}

/**
 * Runtime lookup is exact only. There is intentionally no grapheme-to-phoneme
 * guessing from spelling: unregistered strings return null.
 */
export function resolveValidatedPhonemeMapping(
  mappings: readonly PhonemeGraphemeMapping[],
  mappingId: string
): PhonemeGraphemeMapping | null {
  const exact = mappings.find((mapping) => mapping.mappingId === mappingId);
  return exact ? validatePhonemeGraphemeMapping(exact) : null;
}
