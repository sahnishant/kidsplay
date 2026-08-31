import type { Question } from '../contracts/question';

const DEFAULT_FEEDBACK = {
  correct: 'Correct. You connected the knowledge in the right way.',
  incorrect: 'Try again and use the relationship between the two ideas.'
} as const;

// Stable dictionary of verbose Question-contract keys. Production question JSON
// is transformed to these short keys by the Vite pre-plugin and inflated before
// the rest of the app sees it. Source/validation JSON remains unchanged.
const LONG_KEYS = [
  'id', 'revision', 'schemaVersion', 'conceptIds', 'knowledgeRefs', 'gradeBands',
  'difficulty', 'language', 'prompt', 'text', 'stimulus', 'sceneId', 'feedback',
  'correct', 'incorrect', 'authoring', 'status', 'source', 'compiledBy',
  'interaction', 'solution', 'type', 'version', 'shuffleOptions', 'options',
  'label', 'semanticRef', 'visualRefs', 'symbol', 'correctOptionIds', 'segments',
  'wordBank', 'answers', 'value', 'items', 'targets', 'assignments', 'seed',
  'gridSize', 'directions', 'alphabet', 'terms', 'word', 'requiredTermIds',
  'cards', 'pairs', 'orderedItemIds', 'selectionMode', 'board', 'ariaLabel',
  'theme', 'regions', 'shape', 'correctRegionIds', 'centerX', 'centerY', 'radius',
  'x', 'y', 'width', 'height', 'rows', 'cols', 'entries', 'clue', 'number',
  'direction', 'startRow', 'startCol', 'length', 'wallMasks', 'startIndex',
  'goalIndex', 'startLabel', 'startSymbol', 'goalLabel', 'goalSymbol'
] as const;

const SHORT_ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const shortKeyForIndex = (index: number) => index < SHORT_ALPHABET.length
  ? SHORT_ALPHABET[index]
  : `_${index - SHORT_ALPHABET.length}`;

const KEY_TO_SHORT = new Map<string, string>(
  LONG_KEYS.map((key, index) => [key, shortKeyForIndex(index)])
);
const SHORT_TO_KEY = new Map<string, string>(
  LONG_KEYS.map((key, index) => [shortKeyForIndex(index), key])
);

export interface CompactQuestionModule {
  dictionary: string[];
  data: unknown;
}

function cloneForCompact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(cloneForCompact);
  if (!value || typeof value !== 'object') return value;

  const source = value as Record<string, unknown>;
  const output: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(source)) {
    if ((key === 'revision' || key === 'schemaVersion' || key === 'version') && child === 1) continue;
    if (key === 'language' && child === 'en') continue;
    if (key === 'status' && child === 'reviewed') continue;
    output[key] = cloneForCompact(child);
  }
  return output;
}

function prepareQuestion(question: Question): Record<string, unknown> {
  const prepared = cloneForCompact(question) as Record<string, unknown>;
  prepared.prompt = question.prompt.text;
  if (question.stimulus?.type === 'scene') prepared.stimulus = question.stimulus.sceneId;
  if (
    question.feedback.correct === DEFAULT_FEEDBACK.correct
    && question.feedback.incorrect === DEFAULT_FEEDBACK.incorrect
  ) prepared.feedback = 0;
  return prepared;
}

function collectStrings(value: unknown, counts: Map<string, number>): void {
  if (typeof value === 'string') {
    counts.set(value, (counts.get(value) ?? 0) + 1);
    return;
  }
  if (Array.isArray(value)) {
    for (const child of value) collectStrings(child, counts);
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const child of Object.values(value as Record<string, unknown>)) collectStrings(child, counts);
}

function dictionaryBenefit(text: string, count: number, index: number): number {
  const refLength = String(index).length + 1; // ~12
  return count * (text.length + 2) - ((text.length + 2) + count * (refLength + 2));
}

function buildDictionary(prepared: unknown): string[] {
  const counts = new Map<string, number>();
  collectStrings(prepared, counts);

  const candidates = [...counts.entries()]
    .filter(([text, count]) => text.length >= 6 && count >= 2)
    .sort((left, right) => (right[1] * right[0].length) - (left[1] * left[0].length));

  const dictionary: string[] = [];
  for (const [text, count] of candidates) {
    if (dictionaryBenefit(text, count, dictionary.length) > 4) dictionary.push(text);
  }
  return dictionary;
}

function compactValue(value: unknown, dictionaryIndex: Map<string, number>): unknown {
  if (typeof value === 'string') {
    const index = dictionaryIndex.get(value);
    if (index !== undefined) return `~${index}`;
    return value.startsWith('~') ? `~${value}` : value;
  }
  if (Array.isArray(value)) return value.map((child) => compactValue(child, dictionaryIndex));
  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, child]) => [
      KEY_TO_SHORT.get(key) ?? key,
      compactValue(child, dictionaryIndex)
    ])
  );
}

/** Build-time helper used by vite.config.ts. It never changes source JSON. */
export function compactQuestionModule(questions: Question[]): CompactQuestionModule {
  const prepared = questions.map(prepareQuestion);
  const dictionary = buildDictionary(prepared);
  const dictionaryIndex = new Map(dictionary.map((value, index) => [value, index]));
  return { dictionary, data: compactValue(prepared, dictionaryIndex) };
}

function restoreString(value: string, dictionary: string[]): string {
  if (value.startsWith('~~')) return value.slice(1);
  if (/^~\d+$/.test(value)) {
    const index = Number(value.slice(1));
    const restored = dictionary[index];
    if (restored === undefined) throw new Error(`Invalid compact question string reference ${value}`);
    return restored;
  }
  return value;
}

function inflateValue(value: unknown, dictionary: string[]): unknown {
  if (typeof value === 'string') return restoreString(value, dictionary);
  if (Array.isArray(value)) return value.map((child) => inflateValue(child, dictionary));
  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, child]) => [
      SHORT_TO_KEY.get(key) ?? key,
      inflateValue(child, dictionary)
    ])
  );
}

function restoreQuestionDefaults(value: unknown): Question {
  const question = value as Record<string, any>;
  question.revision ??= 1;
  question.schemaVersion ??= 1;
  question.language ??= 'en';
  if (typeof question.prompt === 'string') question.prompt = { text: question.prompt };
  if (typeof question.stimulus === 'string') question.stimulus = { type: 'scene', sceneId: question.stimulus };
  if (question.feedback === 0) question.feedback = { ...DEFAULT_FEEDBACK };
  question.authoring ??= {};
  question.authoring.status ??= 'reviewed';
  if (question.interaction && typeof question.interaction === 'object') question.interaction.version ??= 1;
  return question as Question;
}

/** Runtime helper used only by transformed question JSON modules. */
export function inflateQuestionModule(data: unknown, dictionary: string[]): Question[] {
  const inflated = inflateValue(data, dictionary);
  if (!Array.isArray(inflated)) throw new Error('Compact question module must inflate to an array');
  return inflated.map(restoreQuestionDefaults);
}
