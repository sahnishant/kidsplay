export type ChildAudioAssetReviewStatus = 'candidate' | 'approved';

export interface ChildAudioProductionAsset {
  id: string;
  bundledSrc: string;
  durationMs: number;
  bytes: number;
  sha256: string;
  reviewStatus: ChildAudioAssetReviewStatus;
}

export interface ChildAudioProductionSummary {
  utteranceCount: number;
  bundledClipCount: number;
  bundledBytes: number;
  candidateBytes: number;
  approvedBytes: number;
  projectedPackageImpactBytes: number;
  measuredProductionTrialDurationMs: number;
}

/**
 * Machine-measured candidate recordings retained as production evidence.
 * This module is deliberately not imported by the child runtime: candidate
 * recordings are review material, not implicitly approved playback assets.
 */
const ASSETS: readonly ChildAudioProductionAsset[] = [
  { id: 'character.dheu.success', bundledSrc: '/audio/kidsplay-v1/characters/dheu/success.ogg', durationMs: 2732, bytes: 355, sha256: 'dfa6b3c39a8a4805e4c8d3dd1d2989bc3795e40fd1316661505f229fa4269921', reviewStatus: 'candidate' },
  { id: 'character.dheu.retry', bundledSrc: '/audio/kidsplay-v1/characters/dheu/retry.ogg', durationMs: 3333, bytes: 412, sha256: 'e5d0c0d6c86e5d94aa4eeee5851b0499e7993b578a3b4ceb7dd04730b07d5aeb', reviewStatus: 'candidate' },
  { id: 'character.scientu.success', bundledSrc: '/audio/kidsplay-v1/characters/scientu/success.ogg', durationMs: 3748, bytes: 433, sha256: 'f1ddcb75948697bcf0576b279993afdc5b1313433b9ac04303ff0d5bfb263083', reviewStatus: 'candidate' },
  { id: 'character.scientu.retry', bundledSrc: '/audio/kidsplay-v1/characters/scientu/retry.ogg', durationMs: 3413, bytes: 415, sha256: '9f0b20da5d8ae771a4218d8b4fcc484a5bbf554d660293c684de4252e196cf50', reviewStatus: 'candidate' },
  { id: 'character.shaitanu.success', bundledSrc: '/audio/kidsplay-v1/characters/shaitanu/success.ogg', durationMs: 2710, bytes: 355, sha256: '9f24cab6f41aeeaf5e6f7fe3fedda93ab3410e5e27fc005e349a65676e9c3f16', reviewStatus: 'candidate' },
  { id: 'character.shaitanu.retry', bundledSrc: '/audio/kidsplay-v1/characters/shaitanu/retry.ogg', durationMs: 4232, bytes: 484, sha256: '246a9718b76bd8bdbbddbfa5703f9a860cee6b5b975e068adb5e5827c768c8f1', reviewStatus: 'candidate' },
  { id: 'common.success', bundledSrc: '/audio/kidsplay-v1/common/success.ogg', durationMs: 1213, bytes: 253, sha256: 'fab9c96acbe8ee92896d103d7ce12a84bfb4a97ea2b502f8a6fa55c1e1f208a1', reviewStatus: 'candidate' },
  { id: 'common.retry', bundledSrc: '/audio/kidsplay-v1/common/retry.ogg', durationMs: 1791, bytes: 280, sha256: '60f7c885d3c160b968a4564ce85b148365bfe4dd04c3de373dcf63d2bd088a8c', reviewStatus: 'candidate' },
  { id: 'forest.prompt.look', bundledSrc: '/audio/kidsplay-v1/forest/look.ogg', durationMs: 4080, bytes: 448, sha256: 'e6749a12c74d80e5cf2ddbe83adf24b78c4466dae374841474a89acd2663895e', reviewStatus: 'candidate' },
  { id: 'forest.prompt.listen', bundledSrc: '/audio/kidsplay-v1/forest/listen.ogg', durationMs: 4377, bytes: 490, sha256: '89675390734bdfcd3ed40e8b96695153c5ff05476c2bc9e2180d40fb87c83a50', reviewStatus: 'candidate' },
  { id: 'prereader.vocabulary.sun', bundledSrc: '/audio/kidsplay-v1/prereader/word-sun.ogg', durationMs: 1344, bytes: 259, sha256: '47421c45fb94aa9e5eac5a74e32cf9282cbe1c32e7a77de445b5aadb803ff07b', reviewStatus: 'candidate' },
  { id: 'prereader.phoneme.m', bundledSrc: '/audio/kidsplay-v1/prereader/phoneme-m.ogg', durationMs: 2046, bytes: 322, sha256: 'bc3146050cfac3cecc3f1b8a35f53d0e64cb589da1b83e3258ea46ffce65ae3e', reviewStatus: 'candidate' },
  { id: 'story.dheu.moonlit-leaf.beat-01', bundledSrc: '/audio/kidsplay-v1/stories/dheu-moonlit-leaf/beat-01.ogg', durationMs: 36022, bytes: 2911, sha256: '8a02f3a52ae8dd681ddebf80c32a22003821f23d2a9330056756050579b14737', reviewStatus: 'candidate' },
  { id: 'story.friends.quiet-backpack.beat-01', bundledSrc: '/audio/kidsplay-v1/stories/friends-quiet-backpack/beat-01.ogg', durationMs: 39181, bytes: 3151, sha256: 'e191d95ea16aae9fb962ca2390d70a3cdaf5a10536a6fa905150defe4379866f', reviewStatus: 'candidate' },
  { id: 'story.shaitanu.cape-trouble.beat-01', bundledSrc: '/audio/kidsplay-v1/stories/shaitanu-cape-trouble/beat-01.ogg', durationMs: 15813, bytes: 1360, sha256: 'a4593c3ca3897eafd5cccb769bf5d9f2af4f4ac95f55134914141448969880cd', reviewStatus: 'candidate' },
  { id: 'story.scientu.tiny-question.beat-01', bundledSrc: '/audio/kidsplay-v1/stories/scientu-tiny-question/beat-01.ogg', durationMs: 14482, bytes: 1267, sha256: '3127a83ef78cdeebed72ea6462a27bc0aad33da544e7a172abf796dce8adb59c', reviewStatus: 'candidate' }
];

const assetById = new Map(ASSETS.map((asset) => [asset.id, asset]));

export function getChildAudioProductionAsset(id: string): ChildAudioProductionAsset | null {
  return assetById.get(id) ?? null;
}

export function summarizeChildAudioProduction(): ChildAudioProductionSummary {
  const bundledBytes = ASSETS.reduce((sum, asset) => sum + asset.bytes, 0);
  const approvedBytes = ASSETS
    .filter((asset) => asset.reviewStatus === 'approved')
    .reduce((sum, asset) => sum + asset.bytes, 0);
  return {
    utteranceCount: 39,
    bundledClipCount: ASSETS.length,
    bundledBytes,
    candidateBytes: bundledBytes - approvedBytes,
    approvedBytes,
    projectedPackageImpactBytes: 74_697,
    measuredProductionTrialDurationMs: 900_214
  };
}
