import {
  loadChildAudioPreferences,
  playChildAudio,
  stopChildAudio,
  type ChildAudioCharacter,
  type ChildAudioPlaybackResult
} from './childAudio';
import {
  resolveChildAudioUtterance,
  validateChildAudioUtteranceManifest,
  type ChildAudioUtteranceEntry
} from './childAudioManifest';

export type ChildAudioProductionPlaybackResult = ChildAudioPlaybackResult | { source: 'text_fallback' };

const storyEntries = (storyId: string, count: number, character: ChildAudioCharacter): ChildAudioUtteranceEntry[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `${storyId}.beat-${String(index + 1).padStart(2, '0')}`,
    usage: 'story_beat',
    channel: 'character',
    language: 'en-IN',
    character
  }));

const reactionEntries = (character: ChildAudioCharacter): ChildAudioUtteranceEntry[] =>
  ['success', 'retry'].map((reaction) => ({
    id: `character.${character}.${reaction}`,
    usage: 'character_reaction',
    channel: 'character',
    language: 'en-IN',
    character
  }));

const UTTERANCES: readonly ChildAudioUtteranceEntry[] = [
  ...reactionEntries('dheu'),
  ...reactionEntries('scientu'),
  ...reactionEntries('shaitanu'),
  { id: 'common.success', usage: 'core_prompt', channel: 'prompt', language: 'en-IN' },
  { id: 'common.retry', usage: 'core_prompt', channel: 'prompt', language: 'en-IN' },
  { id: 'forest.prompt.look', usage: 'core_prompt', channel: 'prompt', language: 'en-IN' },
  { id: 'forest.prompt.listen', usage: 'core_prompt', channel: 'prompt', language: 'en-IN' },
  { id: 'prereader.vocabulary.sun', usage: 'vocabulary', channel: 'vocabulary', language: 'en-IN' },
  { id: 'prereader.phoneme.m', usage: 'phoneme', channel: 'phoneme', language: 'en-IN' },
  ...storyEntries('story.dheu.moonlit-leaf', 9, 'dheu'),
  ...storyEntries('story.friends.quiet-backpack', 9, 'dheu'),
  ...storyEntries('story.shaitanu.cape-trouble', 4, 'shaitanu'),
  ...storyEntries('story.scientu.tiny-question', 5, 'scientu')
];

export const KIDSPLAY_CHILD_AUDIO_MANIFEST = validateChildAudioUtteranceManifest({
  schemaVersion: 1,
  manifestId: 'kidsplay.voice.production.v1',
  entries: UTTERANCES
});

// HUMAN approval is audited in content/audio/kidsplay-v1-human-approval.json
// and pinned to the exact measured candidate manifest by production tests.
// Keep the child runtime projection compact; a changed pack count fails closed.
const HUMAN_APPROVED_PACK_ACTIVE = UTTERANCES.length === 39;

function approvedBundledPath(id: string): string | undefined {
  const characterMatch = /^character\.(dheu|scientu|shaitanu)\.(success|retry)$/.exec(id);
  if (characterMatch) return `/audio/kidsplay-v1/characters/${characterMatch[1]}/${characterMatch[2]}.ogg`;
  const commonMatch = /^common\.(success|retry)$/.exec(id);
  if (commonMatch) return `/audio/kidsplay-v1/common/${commonMatch[1]}.ogg`;
  const forestMatch = /^forest\.prompt\.(look|listen)$/.exec(id);
  if (forestMatch) return `/audio/kidsplay-v1/forest/${forestMatch[1]}.ogg`;
  if (id === 'prereader.vocabulary.sun') return '/audio/kidsplay-v1/prereader/word-sun.ogg';
  if (id === 'prereader.phoneme.m') return '/audio/kidsplay-v1/prereader/phoneme-m.ogg';
  const storyMatch = /^story\.([a-z0-9.-]+)\.(beat-\d{2})$/.exec(id);
  if (storyMatch) return `/audio/kidsplay-v1/stories/${storyMatch[1].replace(/\./g, '-')}/${storyMatch[2]}.ogg`;
  return undefined;
}

let lastUtterance: { id: string; text: string; enabled: boolean } | null = null;

export function isChildAudioHumanApprovedPackActive(): boolean {
  return HUMAN_APPROVED_PACK_ACTIVE;
}

export function getApprovedBundledSrc(id: string): string | undefined {
  if (!HUMAN_APPROVED_PACK_ACTIVE || !resolveChildAudioUtterance(KIDSPLAY_CHILD_AUDIO_MANIFEST, id)) return undefined;
  return approvedBundledPath(id);
}

export function playChildUtterance(
  id: string,
  text: string,
  enabled = loadChildAudioPreferences().enabled
): ChildAudioProductionPlaybackResult {
  const entry = resolveChildAudioUtterance(KIDSPLAY_CHILD_AUDIO_MANIFEST, id);
  if (!entry || !text.trim()) return { source: 'text_fallback' };
  lastUtterance = { id, text, enabled };
  const result = playChildAudio({
    channel: entry.channel,
    text,
    language: entry.language,
    enabled,
    ...(entry.character ? { character: entry.character } : {}),
    bundledSrc: getApprovedBundledSrc(id)
  });
  return result.source === 'silent_fallback' || result.source === 'unavailable'
    ? { source: 'text_fallback' }
    : result;
}

export function repeatLastChildUtterance(): ChildAudioProductionPlaybackResult {
  return lastUtterance
    ? playChildUtterance(lastUtterance.id, lastUtterance.text, lastUtterance.enabled)
    : { source: 'text_fallback' };
}

export function cancelChildUtterance(): void {
  stopChildAudio();
}
