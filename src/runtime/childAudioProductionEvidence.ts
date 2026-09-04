import candidatePackJson from '../../content/audio/kidsplay-v1-candidate-manifest.json';

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

interface CandidatePack {
  schemaVersion: 1;
  packId: string;
  codec: string;
  reviewStatus: 'candidate';
  humanApprovalRequired: true;
  summary: {
    utteranceCount: number;
    bundledBytes: number;
    measuredDurationMs: number;
    projectedPackageImpactBytes: number;
  };
  entries: ChildAudioProductionAsset[];
}

/**
 * Machine-measured spoken candidate recordings retained as review evidence.
 * This module is deliberately not imported by the child runtime: candidate
 * recordings never become playback-authoritative without explicit HUMAN
 * promotion into childAudioProduction's approved map.
 */
function loadCandidatePack(): CandidatePack {
  const pack = candidatePackJson as CandidatePack;
  if (
    pack.schemaVersion !== 1
    || pack.packId !== 'kidsplay.voice.candidates.v1'
    || pack.codec !== 'ogg_opus'
    || pack.reviewStatus !== 'candidate'
    || pack.humanApprovalRequired !== true
    || pack.entries.length !== 39
    || pack.summary.utteranceCount !== pack.entries.length
  ) {
    throw new Error('Kidsplay V1 candidate audio evidence manifest is invalid');
  }
  const ids = new Set<string>();
  let bytes = 0;
  let durationMs = 0;
  for (const asset of pack.entries) {
    if (ids.has(asset.id)) throw new Error(`Duplicate candidate audio id ${asset.id}`);
    ids.add(asset.id);
    if (asset.reviewStatus !== 'candidate') throw new Error(`${asset.id}: generated pack may contain candidate assets only`);
    if (!asset.bundledSrc.startsWith('/audio/kidsplay-v1/')) throw new Error(`${asset.id}: invalid bundled candidate path`);
    if (!(asset.durationMs > 0) || !(asset.bytes > 0) || !/^[a-f0-9]{64}$/.test(asset.sha256)) {
      throw new Error(`${asset.id}: invalid measured candidate evidence`);
    }
    bytes += asset.bytes;
    durationMs += asset.durationMs;
  }
  if (bytes !== pack.summary.bundledBytes || durationMs !== pack.summary.measuredDurationMs) {
    throw new Error('Candidate audio summary does not equal its measured entries');
  }
  return pack;
}

const PACK = loadCandidatePack();
const ASSETS: readonly ChildAudioProductionAsset[] = PACK.entries;
const assetById = new Map(ASSETS.map((asset) => [asset.id, asset]));

export function listChildAudioProductionAssets(): ChildAudioProductionAsset[] {
  return ASSETS.map((asset) => ({ ...asset }));
}

export function getChildAudioProductionAsset(id: string): ChildAudioProductionAsset | null {
  const asset = assetById.get(id);
  return asset ? { ...asset } : null;
}

export function summarizeChildAudioProduction(): ChildAudioProductionSummary {
  const approvedBytes = ASSETS
    .filter((asset) => asset.reviewStatus === 'approved')
    .reduce((sum, asset) => sum + asset.bytes, 0);
  return {
    utteranceCount: PACK.summary.utteranceCount,
    bundledClipCount: ASSETS.length,
    bundledBytes: PACK.summary.bundledBytes,
    candidateBytes: PACK.summary.bundledBytes - approvedBytes,
    approvedBytes,
    projectedPackageImpactBytes: PACK.summary.projectedPackageImpactBytes,
    measuredProductionTrialDurationMs: PACK.summary.measuredDurationMs
  };
}
