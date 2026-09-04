import type { StoryManifest } from './storiesContract';
import {
  getChildAudioProductionAsset,
  KIDSPLAY_CHILD_AUDIO_MANIFEST,
  type ChildAudioAssetReviewStatus
} from '../runtime/childAudioProduction';
import { resolveChildAudioUtterance } from '../runtime/childAudioManifest';

export interface StoryNarrationMetrics {
  storyId: string;
  clipCount: number;
  totalDurationMs: number;
  totalBytes: number;
  durationEvidence: 'measured_bundled_audio';
  reviewStatuses: ChildAudioAssetReviewStatus[];
}

export function storyNarrationUtteranceId(manifest: StoryManifest, beatId: string): string {
  const index = manifest.beats.findIndex((beat) => beat.beatId === beatId);
  if (index < 0) throw new Error(`${manifest.storyId}: unknown beat ${beatId}`);
  return `${manifest.storyId}.beat-${String(index + 1).padStart(2, '0')}`;
}

export function measureStoryNarration(manifest: StoryManifest): StoryNarrationMetrics {
  let totalDurationMs = 0;
  let totalBytes = 0;
  const reviewStatuses = new Set<ChildAudioAssetReviewStatus>();

  for (const beat of manifest.beats) {
    const id = storyNarrationUtteranceId(manifest, beat.beatId);
    const utterance = resolveChildAudioUtterance(KIDSPLAY_CHILD_AUDIO_MANIFEST, id);
    const asset = getChildAudioProductionAsset(id);
    if (!utterance || utterance.usage !== 'story_beat' || !asset) {
      throw new Error(`${manifest.storyId}/${beat.beatId}: missing measured story narration ${id}`);
    }
    totalDurationMs += asset.durationMs;
    totalBytes += asset.bytes;
    reviewStatuses.add(asset.reviewStatus);
  }

  return {
    storyId: manifest.storyId,
    clipCount: manifest.beats.length,
    totalDurationMs,
    totalBytes,
    durationEvidence: 'measured_bundled_audio',
    reviewStatuses: [...reviewStatuses].sort()
  };
}
