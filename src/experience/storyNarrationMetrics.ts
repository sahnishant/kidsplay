import type { StoryManifest } from './storiesContract';
import { KIDSPLAY_CHILD_AUDIO_MANIFEST } from '../runtime/childAudioProduction';
import { resolveChildAudioUtterance } from '../runtime/childAudioManifest';

export interface StoryNarrationMetrics {
  storyId: string;
  clipCount: number;
  totalDurationMs: number;
  projectedBytes: number;
  durationEvidence: 'measured_candidate_production_trial';
}

const MEASURED_STORIES: Readonly<Record<string, Omit<StoryNarrationMetrics, 'storyId'>>> = {
  'story.dheu.moonlit-leaf': { clipCount: 9, totalDurationMs: 252_539, projectedBytes: 256_946, durationEvidence: 'measured_candidate_production_trial' },
  'story.friends.quiet-backpack': { clipCount: 9, totalDurationMs: 278_382, projectedBytes: 279_397, durationEvidence: 'measured_candidate_production_trial' },
  'story.shaitanu.cape-trouble': { clipCount: 4, totalDurationMs: 45_939, projectedBytes: 45_935, durationEvidence: 'measured_candidate_production_trial' },
  'story.scientu.tiny-question': { clipCount: 5, totalDurationMs: 57_674, projectedBytes: 58_505, durationEvidence: 'measured_candidate_production_trial' }
};

export function storyNarrationUtteranceId(manifest: StoryManifest, beatId: string): string {
  const index = manifest.beats.findIndex((beat) => beat.beatId === beatId);
  if (index < 0) throw new Error(`${manifest.storyId}: unknown beat ${beatId}`);
  return `${manifest.storyId}.beat-${String(index + 1).padStart(2, '0')}`;
}

export function measureStoryNarration(manifest: StoryManifest): StoryNarrationMetrics {
  const measured = MEASURED_STORIES[manifest.storyId];
  if (!measured || measured.clipCount !== manifest.beats.length) {
    throw new Error(`${manifest.storyId}: measured narration does not match the current manuscript`);
  }
  for (const beat of manifest.beats) {
    const id = storyNarrationUtteranceId(manifest, beat.beatId);
    const utterance = resolveChildAudioUtterance(KIDSPLAY_CHILD_AUDIO_MANIFEST, id);
    if (!utterance || utterance.usage !== 'story_beat') {
      throw new Error(`${manifest.storyId}/${beat.beatId}: missing stable story narration utterance ${id}`);
    }
  }
  return { storyId: manifest.storyId, ...measured };
}
