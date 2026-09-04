import {
  loadChildAudioPreferences,
  playChildAudio,
  stopChildAudio,
  type ChildAudioPlaybackResult
} from './childAudio';
import {
  resolveChildAudioUtterance,
  validateChildAudioUtteranceManifest,
  type ChildAudioUtteranceEntry
} from './childAudioManifest';

export type ChildAudioAssetReviewStatus = 'candidate' | 'approved';
export interface ChildAudioProductionAsset extends ChildAudioUtteranceEntry {
  bundledSrc: string;
  durationMs: number;
  bytes: number;
  sha256: string;
  reviewStatus: ChildAudioAssetReviewStatus;
}
export interface ChildAudioProductionSummary {
  clipCount: number;
  totalBytes: number;
  totalDurationMs: number;
  approvedBytes: number;
  candidateBytes: number;
  projectedPackageImpactBytes: number;
}
export type ChildAudioProductionPlaybackResult = ChildAudioPlaybackResult | { source: 'text_fallback' };

const ASSETS: readonly ChildAudioProductionAsset[] = [
  { id: 'character.dheu.success', usage: 'character_reaction', channel: 'character', language: 'en-IN', character: 'dheu', bundledSrc: '/audio/kidsplay-v1/characters/dheu/success.ogg', durationMs: 2732, bytes: 355, sha256: 'dfa6b3c39a8a4805e4c8d3dd1d2989bc3795e40fd1316661505f229fa4269921', reviewStatus: 'candidate' },
  { id: 'character.dheu.retry', usage: 'character_reaction', channel: 'character', language: 'en-IN', character: 'dheu', bundledSrc: '/audio/kidsplay-v1/characters/dheu/retry.ogg', durationMs: 3333, bytes: 412, sha256: 'e5d0c0d6c86e5d94aa4eeee5851b0499e7993b578a3b4ceb7dd04730b07d5aeb', reviewStatus: 'candidate' },
  { id: 'character.scientu.success', usage: 'character_reaction', channel: 'character', language: 'en-IN', character: 'scientu', bundledSrc: '/audio/kidsplay-v1/characters/scientu/success.ogg', durationMs: 3748, bytes: 433, sha256: 'f1ddcb75948697bcf0576b279993afdc5b1313433b9ac04303ff0d5bfb263083', reviewStatus: 'candidate' },
  { id: 'character.scientu.retry', usage: 'character_reaction', channel: 'character', language: 'en-IN', character: 'scientu', bundledSrc: '/audio/kidsplay-v1/characters/scientu/retry.ogg', durationMs: 3413, bytes: 415, sha256: '9f0b20da5d8ae771a4218d8b4fcc484a5bbf554d660293c684de4252e196cf50', reviewStatus: 'candidate' },
  { id: 'character.shaitanu.success', usage: 'character_reaction', channel: 'character', language: 'en-IN', character: 'shaitanu', bundledSrc: '/audio/kidsplay-v1/characters/shaitanu/success.ogg', durationMs: 2710, bytes: 355, sha256: '9f24cab6f41aeeaf5e6f7fe3fedda93ab3410e5e27fc005e349a65676e9c3f16', reviewStatus: 'candidate' },
  { id: 'character.shaitanu.retry', usage: 'character_reaction', channel: 'character', language: 'en-IN', character: 'shaitanu', bundledSrc: '/audio/kidsplay-v1/characters/shaitanu/retry.ogg', durationMs: 4232, bytes: 484, sha256: '246a9718b76bd8bdbbddbfa5703f9a860cee6b5b975e068adb5e5827c768c8f1', reviewStatus: 'candidate' },
  { id: 'common.success', usage: 'core_prompt', channel: 'prompt', language: 'en-IN', bundledSrc: '/audio/kidsplay-v1/common/success.ogg', durationMs: 1213, bytes: 253, sha256: 'fab9c96acbe8ee92896d103d7ce12a84bfb4a97ea2b502f8a6fa55c1e1f208a1', reviewStatus: 'candidate' },
  { id: 'common.retry', usage: 'core_prompt', channel: 'prompt', language: 'en-IN', bundledSrc: '/audio/kidsplay-v1/common/retry.ogg', durationMs: 1791, bytes: 280, sha256: '60f7c885d3c160b968a4564ce85b148365bfe4dd04c3de373dcf63d2bd088a8c', reviewStatus: 'candidate' },
  { id: 'forest.prompt.look', usage: 'core_prompt', channel: 'prompt', language: 'en-IN', bundledSrc: '/audio/kidsplay-v1/forest/look.ogg', durationMs: 4080, bytes: 448, sha256: 'e6749a12c74d80e5cf2ddbe83adf24b78c4466dae374841474a89acd2663895e', reviewStatus: 'candidate' },
  { id: 'forest.prompt.listen', usage: 'core_prompt', channel: 'prompt', language: 'en-IN', bundledSrc: '/audio/kidsplay-v1/forest/listen.ogg', durationMs: 4377, bytes: 490, sha256: '89675390734bdfcd3ed40e8b96695153c5ff05476c2bc9e2180d40fb87c83a50', reviewStatus: 'candidate' },
  { id: 'prereader.vocabulary.sun', usage: 'vocabulary', channel: 'vocabulary', language: 'en-IN', bundledSrc: '/audio/kidsplay-v1/prereader/word-sun.ogg', durationMs: 1344, bytes: 259, sha256: '47421c45fb94aa9e5eac5a74e32cf9282cbe1c32e7a77de445b5aadb803ff07b', reviewStatus: 'candidate' },
  { id: 'prereader.phoneme.m', usage: 'phoneme', channel: 'phoneme', language: 'en-IN', bundledSrc: '/audio/kidsplay-v1/prereader/phoneme-m.ogg', durationMs: 2046, bytes: 322, sha256: 'bc3146050cfac3cecc3f1b8a35f53d0e64cb589da1b83e3258ea46ffce65ae3e', reviewStatus: 'candidate' },
  { id: 'story.dheu.moonlit-leaf.beat-01', usage: 'story_beat', channel: 'character', language: 'en-IN', character: 'dheu', bundledSrc: '/audio/kidsplay-v1/stories/dheu-moonlit-leaf/beat-01.ogg', durationMs: 36022, bytes: 2911, sha256: '8a02f3a52ae8dd681ddebf80c32a22003821f23d2a9330056756050579b14737', reviewStatus: 'candidate' },
  { id: 'story.dheu.moonlit-leaf.beat-02', usage: 'story_beat', channel: 'character', language: 'en-IN', character: 'dheu', bundledSrc: '/audio/kidsplay-v1/stories/dheu-moonlit-leaf/beat-02.ogg', durationMs: 35668, bytes: 2866, sha256: 'ebf336fb244bdfd108b42a9ceeb57e1ce0f4cd9c002d518c6eff1b403fd90479', reviewStatus: 'candidate' },
  { id: 'story.dheu.moonlit-leaf.beat-03', usage: 'story_beat', channel: 'character', language: 'en-IN', character: 'dheu', bundledSrc: '/audio/kidsplay-v1/stories/dheu-moonlit-leaf/beat-03.ogg', durationMs: 39049, bytes: 3142, sha256: '787d4abf63dd2ed2d100025557d0a413381be024b7066e91d883d28382dc9dd8', reviewStatus: 'candidate' },
  { id: 'story.dheu.moonlit-leaf.beat-04', usage: 'story_beat', channel: 'character', language: 'en-IN', character: 'dheu', bundledSrc: '/audio/kidsplay-v1/stories/dheu-moonlit-leaf/beat-04.ogg', durationMs: 39254, bytes: 3154, sha256: '929a1dc4b9bb2735b2146b763816274773bbdd4815b9b1834a72846818645854', reviewStatus: 'candidate' },
  { id: 'story.dheu.moonlit-leaf.beat-05', usage: 'story_beat', channel: 'character', language: 'en-IN', character: 'dheu', bundledSrc: '/audio/kidsplay-v1/stories/dheu-moonlit-leaf/beat-05.ogg', durationMs: 38673, bytes: 3097, sha256: '5836b966296a0600b9b612e9b978d233e245f49377070db823a646c5a2b2aaf3', reviewStatus: 'candidate' },
  { id: 'story.dheu.moonlit-leaf.beat-06', usage: 'story_beat', channel: 'character', language: 'en-IN', character: 'dheu', bundledSrc: '/audio/kidsplay-v1/stories/dheu-moonlit-leaf/beat-06.ogg', durationMs: 39116, bytes: 3145, sha256: 'c6865dcfb67a4274d51cc12f3cbaa3ca6a382e4435c052fe4caec6ec59321351', reviewStatus: 'candidate' },
  { id: 'story.dheu.moonlit-leaf.beat-07', usage: 'story_beat', channel: 'character', language: 'en-IN', character: 'dheu', bundledSrc: '/audio/kidsplay-v1/stories/dheu-moonlit-leaf/beat-07.ogg', durationMs: 36243, bytes: 2923, sha256: '7a82e20bc9d8b60ee550164b3e9c298ab876d59f1b5ccb72d81d2b9ca9c3c05e', reviewStatus: 'candidate' },
  { id: 'story.dheu.moonlit-leaf.beat-08', usage: 'story_beat', channel: 'character', language: 'en-IN', character: 'dheu', bundledSrc: '/audio/kidsplay-v1/stories/dheu-moonlit-leaf/beat-08.ogg', durationMs: 44426, bytes: 3547, sha256: '2350c28058fa2aecda1c6904dfebbb17014f297d1b112897944018cf5b02e9f3', reviewStatus: 'candidate' },
  { id: 'story.dheu.moonlit-leaf.beat-09', usage: 'story_beat', channel: 'character', language: 'en-IN', character: 'dheu', bundledSrc: '/audio/kidsplay-v1/stories/dheu-moonlit-leaf/beat-09.ogg', durationMs: 34562, bytes: 2785, sha256: 'cf1545bb8478f1ed382d687ea8e8e918514235579203c2d4692b65068ac09fee', reviewStatus: 'candidate' },
  { id: 'story.friends.quiet-backpack.beat-01', usage: 'story_beat', channel: 'character', language: 'en-IN', character: 'dheu', bundledSrc: '/audio/kidsplay-v1/stories/friends-quiet-backpack/beat-01.ogg', durationMs: 39181, bytes: 3151, sha256: 'e191d95ea16aae9fb962ca2390d70a3cdaf5a10536a6fa905150defe4379866f', reviewStatus: 'candidate' },
  { id: 'story.friends.quiet-backpack.beat-02', usage: 'story_beat', channel: 'character', language: 'en-IN', character: 'dheu', bundledSrc: '/audio/kidsplay-v1/stories/friends-quiet-backpack/beat-02.ogg', durationMs: 42549, bytes: 3400, sha256: 'cfc41df40f0e158c4e7e0da08e644bb65ad3efa8ce5e77824fe11b69526c448d', reviewStatus: 'candidate' },
  { id: 'story.friends.quiet-backpack.beat-03', usage: 'story_beat', channel: 'character', language: 'en-IN', character: 'dheu', bundledSrc: '/audio/kidsplay-v1/stories/friends-quiet-backpack/beat-03.ogg', durationMs: 45318, bytes: 3619, sha256: 'c860f9fea015945dc2ccc4f46b4a51c2f8bab6d2b43e7516dd87d9663049518f', reviewStatus: 'candidate' },
  { id: 'story.friends.quiet-backpack.beat-04', usage: 'story_beat', channel: 'character', language: 'en-IN', character: 'dheu', bundledSrc: '/audio/kidsplay-v1/stories/friends-quiet-backpack/beat-04.ogg', durationMs: 42778, bytes: 3409, sha256: '6db71a283cfbb7900fca63d15ee5c87c31e165a759f57bf2527213defe725549', reviewStatus: 'candidate' },
  { id: 'story.friends.quiet-backpack.beat-05', usage: 'story_beat', channel: 'character', language: 'en-IN', character: 'dheu', bundledSrc: '/audio/kidsplay-v1/stories/friends-quiet-backpack/beat-05.ogg', durationMs: 41183, bytes: 3304, sha256: '97ff4ad7d37fdc63973198f6a80821b32db54956e3e75f0bdd1e8d01f2749b5c', reviewStatus: 'candidate' },
  { id: 'story.friends.quiet-backpack.beat-06', usage: 'story_beat', channel: 'character', language: 'en-IN', character: 'dheu', bundledSrc: '/audio/kidsplay-v1/stories/friends-quiet-backpack/beat-06.ogg', durationMs: 45847, bytes: 3646, sha256: '1e93615c960e58214910ed3fdb6c158e739265ca76576d8c852785c7a252ed5c', reviewStatus: 'candidate' },
  { id: 'story.friends.quiet-backpack.beat-07', usage: 'story_beat', channel: 'character', language: 'en-IN', character: 'dheu', bundledSrc: '/audio/kidsplay-v1/stories/friends-quiet-backpack/beat-07.ogg', durationMs: 36169, bytes: 2917, sha256: 'd365f2965dfe70c7a9b2d37d097ab7512b76e55c61694df64439cdd44ac367b6', reviewStatus: 'candidate' },
  { id: 'story.friends.quiet-backpack.beat-08', usage: 'story_beat', channel: 'character', language: 'en-IN', character: 'dheu', bundledSrc: '/audio/kidsplay-v1/stories/friends-quiet-backpack/beat-08.ogg', durationMs: 46455, bytes: 3703, sha256: '0e41389d39d462b80b6b5b8d2baf686ae4488dddae870c8ce2cc44c08839a8c3', reviewStatus: 'candidate' },
  { id: 'story.friends.quiet-backpack.beat-09', usage: 'story_beat', channel: 'character', language: 'en-IN', character: 'dheu', bundledSrc: '/audio/kidsplay-v1/stories/friends-quiet-backpack/beat-09.ogg', durationMs: 39924, bytes: 3214, sha256: '3a75ae3569a5c0c0ddf8cb94b0b6316dc390c7dffa51c4b83eecee83fb8c6c5e', reviewStatus: 'candidate' },
  { id: 'story.shaitanu.cape-trouble.beat-01', usage: 'story_beat', channel: 'character', language: 'en-IN', character: 'shaitanu', bundledSrc: '/audio/kidsplay-v1/stories/shaitanu-cape-trouble/beat-01.ogg', durationMs: 15813, bytes: 1360, sha256: 'a4593c3ca3897eafd5cccb769bf5d9f2af4f4ac95f55134914141448969880cd', reviewStatus: 'candidate' },
  { id: 'story.shaitanu.cape-trouble.beat-02', usage: 'story_beat', channel: 'character', language: 'en-IN', character: 'shaitanu', bundledSrc: '/audio/kidsplay-v1/stories/shaitanu-cape-trouble/beat-02.ogg', durationMs: 16558, bytes: 1423, sha256: '04cf3f170bb2d617431cac67cad97830ed5c23140e0cb0ec30aa60704c329d33', reviewStatus: 'candidate' },
  { id: 'story.shaitanu.cape-trouble.beat-03', usage: 'story_beat', channel: 'character', language: 'en-IN', character: 'shaitanu', bundledSrc: '/audio/kidsplay-v1/stories/shaitanu-cape-trouble/beat-03.ogg', durationMs: 18634, bytes: 1582, sha256: 'b27c1f8f2529ac5f7dd38c72ae3bf813f9354c69f6aeae112f8e6e964f6201bd', reviewStatus: 'candidate' },
  { id: 'story.shaitanu.cape-trouble.beat-04', usage: 'story_beat', channel: 'character', language: 'en-IN', character: 'shaitanu', bundledSrc: '/audio/kidsplay-v1/stories/shaitanu-cape-trouble/beat-04.ogg', durationMs: 15539, bytes: 1345, sha256: '0273954655943d7dfe0754ee380b82a674b0f7e3b7d9beee60a35c90ca7ed2fc', reviewStatus: 'candidate' },
  { id: 'story.scientu.tiny-question.beat-01', usage: 'story_beat', channel: 'character', language: 'en-IN', character: 'scientu', bundledSrc: '/audio/kidsplay-v1/stories/scientu-tiny-question/beat-01.ogg', durationMs: 14482, bytes: 1267, sha256: '3127a83ef78cdeebed72ea6462a27bc0aad33da544e7a172abf796dce8adb59c', reviewStatus: 'candidate' },
  { id: 'story.scientu.tiny-question.beat-02', usage: 'story_beat', channel: 'character', language: 'en-IN', character: 'scientu', bundledSrc: '/audio/kidsplay-v1/stories/scientu-tiny-question/beat-02.ogg', durationMs: 13246, bytes: 1150, sha256: 'a7c250832bc2f843c974fcc0697e9906505dc10a47234553bb19f6cd5d78e13e', reviewStatus: 'candidate' },
  { id: 'story.scientu.tiny-question.beat-03', usage: 'story_beat', channel: 'character', language: 'en-IN', character: 'scientu', bundledSrc: '/audio/kidsplay-v1/stories/scientu-tiny-question/beat-03.ogg', durationMs: 14099, bytes: 1219, sha256: 'f22eaf435619ded9489c0b398cdeef77f30416b26b4e9711dccfa4344c0a5f24', reviewStatus: 'candidate' },
  { id: 'story.scientu.tiny-question.beat-04', usage: 'story_beat', channel: 'character', language: 'en-IN', character: 'scientu', bundledSrc: '/audio/kidsplay-v1/stories/scientu-tiny-question/beat-04.ogg', durationMs: 14089, bytes: 1219, sha256: '8685fc86a76ff6860c0834417fb99c15367181d219681e540b0df29014669746', reviewStatus: 'candidate' },
  { id: 'story.scientu.tiny-question.beat-05', usage: 'story_beat', channel: 'character', language: 'en-IN', character: 'scientu', bundledSrc: '/audio/kidsplay-v1/stories/scientu-tiny-question/beat-05.ogg', durationMs: 20318, bytes: 1693, sha256: '044968cf70bf193ae8b911e94248fc6f49fa2f7902b48e7be166d803ad62c41a', reviewStatus: 'candidate' }
];

export const KIDSPLAY_CHILD_AUDIO_MANIFEST = validateChildAudioUtteranceManifest({
  schemaVersion: 1,
  manifestId: 'kidsplay.voice.production.v1',
  entries: ASSETS
});
const assetById = new Map(ASSETS.map((asset) => [asset.id, asset]));
let lastUtterance: { id: string; text: string; enabled: boolean } | null = null;

export function getChildAudioProductionAsset(id: string): ChildAudioProductionAsset | null {
  return assetById.get(id) ?? null;
}
export function getApprovedBundledSrc(id: string): string | undefined {
  const asset = assetById.get(id);
  return asset?.reviewStatus === 'approved' ? asset.bundledSrc : undefined;
}
export function summarizeChildAudioProduction(): ChildAudioProductionSummary {
  const totalBytes = ASSETS.reduce((sum, asset) => sum + asset.bytes, 0);
  const totalDurationMs = ASSETS.reduce((sum, asset) => sum + asset.durationMs, 0);
  const approvedBytes = ASSETS.filter((asset) => asset.reviewStatus === 'approved').reduce((sum, asset) => sum + asset.bytes, 0);
  return { clipCount: ASSETS.length, totalBytes, totalDurationMs, approvedBytes, candidateBytes: totalBytes - approvedBytes, projectedPackageImpactBytes: totalBytes };
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
