import humanApprovalJson from '../../content/audio/kidsplay-v1-human-approval.json';
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

interface ChildAudioHumanApprovalV1 {
  schemaVersion: 1;
  approvalId: 'kidsplay.voice.human-approval.v1';
  packId: 'kidsplay.voice.candidates.v1';
  sourceManifestGitBlobSha: string;
  approvedAt: string;
  approvedBy: string;
  expected: {
    utteranceCount: 39;
    bundledBytes: 676114;
    measuredDurationMs: 669334;
  };
  approvalScope: {
    allUtterances: true;
    preschoolVoiceQuality: true;
    characterVoiceIdentities: true;
    promptAndPrereaderVoice: true;
    storyNarration: true;
    bedtimeCx: true;
    offlineDeviceAcceptance: true;
  };
}

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

function loadHumanApproval(): ChildAudioHumanApprovalV1 {
  const approval = humanApprovalJson as ChildAudioHumanApprovalV1;
  if (
    approval.schemaVersion !== 1
    || approval.approvalId !== 'kidsplay.voice.human-approval.v1'
    || approval.packId !== 'kidsplay.voice.candidates.v1'
    || !/^[a-f0-9]{40}$/.test(approval.sourceManifestGitBlobSha)
    || approval.expected?.utteranceCount !== 39
    || approval.expected?.bundledBytes !== 676114
    || approval.expected?.measuredDurationMs !== 669334
    || approval.approvalScope?.allUtterances !== true
    || approval.approvalScope?.preschoolVoiceQuality !== true
    || approval.approvalScope?.characterVoiceIdentities !== true
    || approval.approvalScope?.promptAndPrereaderVoice !== true
    || approval.approvalScope?.storyNarration !== true
    || approval.approvalScope?.bedtimeCx !== true
    || approval.approvalScope?.offlineDeviceAcceptance !== true
  ) {
    throw new Error('Kidsplay V1 HUMAN voice approval record is invalid');
  }
  return approval;
}

export const KIDSPLAY_V1_VOICE_HUMAN_APPROVAL = loadHumanApproval();

export const KIDSPLAY_CHILD_AUDIO_MANIFEST = validateChildAudioUtteranceManifest({
  schemaVersion: 1,
  manifestId: 'kidsplay.voice.production.v1',
  entries: UTTERANCES
});

const HUMAN_APPROVED_PACK_ACTIVE = UTTERANCES.length === KIDSPLAY_V1_VOICE_HUMAN_APPROVAL.expected.utteranceCount;

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
  if (storyMatch) {
    const storyDirectory = storyMatch[1].replace(/\./g, '-');
    return `/audio/kidsplay-v1/stories/${storyDirectory}/${storyMatch[2]}.ogg`;
  }
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
