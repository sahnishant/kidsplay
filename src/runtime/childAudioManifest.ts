import type { ChildAudioChannel, ChildAudioCharacter } from './childAudio';
import { isBundledChildAudioPath } from './childAudio';

export type ChildAudioUtteranceUsage =
  | 'core_prompt'
  | 'character_reaction'
  | 'vocabulary'
  | 'phoneme'
  | 'story_beat';

export interface ChildAudioUtteranceEntry {
  /** Stable semantic/prompt id; callers must not depend on component-local file paths. */
  id: string;
  usage: ChildAudioUtteranceUsage;
  channel: ChildAudioChannel;
  language: string;
  character?: ChildAudioCharacter;
  /** Optional approved bundled recording below public/audio. */
  bundledSrc?: string;
  /** Optional measured duration once approved audio exists. */
  durationMs?: number;
}

export interface ChildAudioUtteranceManifest {
  schemaVersion: 1;
  manifestId: string;
  entries: readonly ChildAudioUtteranceEntry[];
}

const VALID_USAGES = new Set<ChildAudioUtteranceUsage>([
  'core_prompt',
  'character_reaction',
  'vocabulary',
  'phoneme',
  'story_beat'
]);
const VALID_CHANNELS = new Set<ChildAudioChannel>(['prompt', 'character', 'vocabulary', 'phoneme']);
const VALID_CHARACTERS = new Set<ChildAudioCharacter>(['dheu', 'scientu', 'shaitanu']);
const STABLE_ID = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;

function assertStableId(value: unknown, context: string): string {
  if (typeof value !== 'string' || !STABLE_ID.test(value)) {
    throw new Error(`${context} must be a lowercase stable id`);
  }
  return value;
}

function assertLanguage(value: unknown, context: string): string {
  if (typeof value !== 'string' || !/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(value)) {
    throw new Error(`${context} must be a BCP-47-like language tag`);
  }
  return value;
}

function validateEntry(value: unknown, index: number): ChildAudioUtteranceEntry {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Audio manifest entry ${index} must be an object`);
  }
  const raw = value as Record<string, unknown>;
  const id = assertStableId(raw.id, `entries[${index}].id`);
  if (typeof raw.usage !== 'string' || !VALID_USAGES.has(raw.usage as ChildAudioUtteranceUsage)) {
    throw new Error(`${id}: invalid usage`);
  }
  if (typeof raw.channel !== 'string' || !VALID_CHANNELS.has(raw.channel as ChildAudioChannel)) {
    throw new Error(`${id}: invalid playback channel`);
  }
  const language = assertLanguage(raw.language, `${id}.language`);

  let character: ChildAudioCharacter | undefined;
  if (raw.character !== undefined) {
    if (typeof raw.character !== 'string' || !VALID_CHARACTERS.has(raw.character as ChildAudioCharacter)) {
      throw new Error(`${id}: invalid character`);
    }
    character = raw.character as ChildAudioCharacter;
  }

  const usage = raw.usage as ChildAudioUtteranceUsage;
  const channel = raw.channel as ChildAudioChannel;
  if ((usage === 'character_reaction' || usage === 'story_beat') && channel === 'character' && !character) {
    throw new Error(`${id}: character channel ${usage} requires a character id`);
  }
  if (character && channel !== 'character') {
    throw new Error(`${id}: character id is only valid on the character playback channel`);
  }
  if (usage === 'vocabulary' && channel !== 'vocabulary') {
    throw new Error(`${id}: vocabulary usage must use the vocabulary channel`);
  }
  if (usage === 'phoneme' && channel !== 'phoneme') {
    throw new Error(`${id}: phoneme usage must use the phoneme channel`);
  }

  let bundledSrc: string | undefined;
  if (raw.bundledSrc !== undefined) {
    if (typeof raw.bundledSrc !== 'string' || !isBundledChildAudioPath(raw.bundledSrc)) {
      throw new Error(`${id}: bundledSrc must be an app-local /audio/ path`);
    }
    bundledSrc = raw.bundledSrc;
  }

  let durationMs: number | undefined;
  if (raw.durationMs !== undefined) {
    if (typeof raw.durationMs !== 'number' || !Number.isFinite(raw.durationMs) || raw.durationMs <= 0) {
      throw new Error(`${id}: durationMs must be a positive measured number`);
    }
    durationMs = raw.durationMs;
  }

  return {
    id,
    usage,
    channel,
    language,
    ...(character ? { character } : {}),
    ...(bundledSrc ? { bundledSrc } : {}),
    ...(durationMs !== undefined ? { durationMs } : {})
  };
}

export function validateChildAudioUtteranceManifest(value: unknown): ChildAudioUtteranceManifest {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Audio utterance manifest must be an object');
  }
  const raw = value as Record<string, unknown>;
  if (raw.schemaVersion !== 1) throw new Error('Audio utterance manifest must use schemaVersion 1');
  const manifestId = assertStableId(raw.manifestId, 'manifestId');
  if (!Array.isArray(raw.entries)) throw new Error('Audio utterance manifest requires entries[]');

  const entries = raw.entries.map(validateEntry);
  const seen = new Set<string>();
  for (const entry of entries) {
    if (seen.has(entry.id)) throw new Error(`Duplicate audio utterance id ${entry.id}`);
    seen.add(entry.id);
  }

  return { schemaVersion: 1, manifestId, entries };
}

export function resolveChildAudioUtterance(
  manifest: ChildAudioUtteranceManifest,
  id: string
): ChildAudioUtteranceEntry | null {
  const entry = manifest.entries.find((candidate) => candidate.id === id);
  return entry ? { ...entry } : null;
}
