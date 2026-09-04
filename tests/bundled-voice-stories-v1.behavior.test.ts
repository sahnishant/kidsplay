import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { STORY_CANDIDATES_V1 } from '../src/experience/storyCatalog';
import { measureStoryNarration, storyNarrationUtteranceId } from '../src/experience/storyNarrationMetrics';
import { resolveChildAudioUtterance } from '../src/runtime/childAudioManifest';
import {
  getApprovedBundledSrc,
  KIDSPLAY_CHILD_AUDIO_MANIFEST
} from '../src/runtime/childAudioProduction';
import {
  listChildAudioProductionAssets,
  summarizeChildAudioProduction
} from '../src/runtime/childAudioProductionEvidence';

describe('bundled playful voice + Stories V1 production contract', () => {
  it('keeps all 39 physically bundled spoken candidates traceable and byte/hash exact', () => {
    const summary = summarizeChildAudioProduction();
    const assets = listChildAudioProductionAssets();
    expect(summary.utteranceCount).toBe(39);
    expect(summary.bundledClipCount).toBe(39);
    expect(summary.bundledBytes).toBe(676_114);
    expect(summary.candidateBytes).toBe(676_114);
    expect(summary.projectedPackageImpactBytes).toBe(676_114);
    expect(summary.measuredProductionTrialDurationMs).toBe(669_334);
    expect(summary.approvedBytes).toBe(0);
    expect(new Set(assets.map((asset) => asset.id)).size).toBe(39);

    for (const asset of assets) {
      const utterance = resolveChildAudioUtterance(KIDSPLAY_CHILD_AUDIO_MANIFEST, asset.id);
      expect(utterance?.id).toBe(asset.id);
      expect(asset.reviewStatus).toBe('candidate');
      expect(asset.durationMs).toBeGreaterThan(0);
      expect(asset.bytes).toBeGreaterThan(0);
      expect(asset.sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(getApprovedBundledSrc(asset.id)).toBeUndefined();

      const filePath = join(process.cwd(), 'public', asset.bundledSrc.replace(/^\/+/, ''));
      expect(existsSync(filePath)).toBe(true);
      expect(statSync(filePath).size).toBe(asset.bytes);
      const actualSha = createHash('sha256').update(readFileSync(filePath)).digest('hex');
      expect(actualSha).toBe(asset.sha256);
    }
  });

  it('physically bundles every V1 story beat and uses measured narration rather than word-count estimates', () => {
    for (const story of STORY_CANDIDATES_V1) {
      const metrics = measureStoryNarration(story);
      expect(metrics.durationEvidence).toBe('measured_candidate_production_trial');
      expect(metrics.clipCount).toBe(story.beats.length);
      expect(metrics.totalDurationMs).toBeGreaterThan(0);
      expect(metrics.projectedBytes).toBeGreaterThan(0);
      expect(story.assessmentPolicy).toBe('none');
      expect(story.masteryWritesAllowed).toBe(false);

      for (const beat of story.beats) {
        const id = storyNarrationUtteranceId(story, beat.beatId);
        const utterance = resolveChildAudioUtterance(KIDSPLAY_CHILD_AUDIO_MANIFEST, id);
        const asset = listChildAudioProductionAssets().find((candidate) => candidate.id === id);
        expect(utterance?.usage).toBe('story_beat');
        expect(asset?.reviewStatus).toBe('candidate');
        expect(asset?.durationMs).toBeGreaterThan(0);
      }
    }
  });

  it('reuses the existing childAudio runtime instead of creating a second media or speech engine', () => {
    const productionRuntime = readFileSync(join(process.cwd(), 'src/runtime/childAudioProduction.ts'), 'utf8');
    const storiesSurface = readFileSync(join(process.cwd(), 'src/ui/StoriesViewport.svelte'), 'utf8');

    expect(productionRuntime).toContain("from './childAudio'");
    expect(productionRuntime).toContain('playChildAudio(');
    expect(productionRuntime).toContain('stopChildAudio()');
    expect(productionRuntime).not.toMatch(/new\s+Audio\s*\(/);
    expect(productionRuntime).not.toContain('SpeechSynthesisUtterance');
    expect(productionRuntime).not.toContain('speechSynthesis');
    expect(storiesSurface).toContain("from '../runtime/childAudioProduction'");
    expect(storiesSurface).not.toMatch(/new\s+Audio\s*\(/);
    expect(storiesSurface).not.toContain('SpeechSynthesisUtterance');
    expect(storiesSurface).not.toContain('speechSynthesis');
  });
});
