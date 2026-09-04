import type { StoryManifest } from './storiesContract';
import { getMeasuredStoryNarration, KIDSPLAY_CHILD_AUDIO_MANIFEST } from '../runtime/childAudioProduction';
import { resolveChildAudioUtterance } from '../runtime/childAudioManifest';

export interface StoryNarrationMetrics {
  storyId: string;
  clipCount: number;
  totalDurationMs: number;
  projectedBytes: number;
  durationEvidence: 'measured_candidate_production_trial';
}

export function storyNarrationUtteranceId(manifest: StoryManifest, beatId: string): string {
  const index = manifest.beats.findIndex((beat) => beat.beatId === beatId);
  if (index < 0) throw new Error(`${manifest.storyId}: unknown beat ${beatId}`);
  return `${manifest.storyId}.beat-${String(index + 1).padStart(2, '0')}`;
}

export function measureStoryNarration(manifest: StoryManifest): StoryNarrationMetrics {
  for (const beat of manifest.beats) {
    const id = storyNarrationUtteranceId(manifest, beat.beatId);
    const utterance = resolveChildAudioUtterance(KIDSPLAY_CHILD_AUDIO_MANIFEST, id);
    if (!utterance || utterance.usage !== 'story_beat') {
      throw new Error(`${manifest.storyId}/${beat.beatId}: missing stable narration utterance ${id}`);
    }
  }
  const measured = getMeasuredStoryNarration(manifest.storyId);
  if (!measured || measured.clipCount !== manifest.beats.length) {
    throw new Error(`${manifest.storyId}: missing complete measured narration production trial`);
  }
  return {
    storyId: manifest.storyId,
    clipCount: measured.clipCount,
    totalDurationMs: measured.totalDurationMs,
    projectedBytes: measured.projectedBytes,
    durationEvidence: measured.evidence
  };
}
