import { existsSync, readFileSync } from 'node:fs';
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
  getChildAudioProductionAsset,
  summarizeChildAudioProduction
} from '../src/runtime/childAudioProductionEvidence';

const BUNDLED_CANDIDATE_IDS = [
  'character.dheu.success', 'character.dheu.retry',
  'character.scientu.success', 'character.scientu.retry',
  'character.shaitanu.success', 'character.shaitanu.retry',
  'common.success', 'common.retry',
  'forest.prompt.look', 'forest.prompt.listen',
  'prereader.vocabulary.sun', 'prereader.phoneme.m',
  'story.dheu.moonlit-leaf.beat-01',
  'story.friends.quiet-backpack.beat-01',
  'story.shaitanu.cape-trouble.beat-01',
  'story.scientu.tiny-question.beat-01'
] as const;

describe('bundled playful voice + Stories V1 production contract', () => {
  it('keeps every bounded candidate asset traceable through one stable semantic utterance manifest', () => {
    const summary = summarizeChildAudioProduction();
    expect(summary.utteranceCount).toBe(39);
    expect(summary.bundledClipCount).toBe(16);
    expect(summary.bundledBytes).toBe(13_195);
    expect(summary.projectedPackageImpactBytes).toBe(74_697);
    expect(summary.measuredProductionTrialDurationMs).toBe(900_214);
    expect(summary.approvedBytes).toBe(0);

    for (const id of BUNDLED_CANDIDATE_IDS) {
      const asset = getChildAudioProductionAsset(id);
      const utterance = resolveChildAudioUtterance(KIDSPLAY_CHILD_AUDIO_MANIFEST, id);
      expect(utterance?.id).toBe(id);
      expect(asset?.reviewStatus).toBe('candidate');
      expect(asset?.durationMs).toBeGreaterThan(0);
      expect(asset?.bytes).toBeGreaterThan(0);
      expect(asset?.sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(getApprovedBundledSrc(id)).toBeUndefined();
      expect(existsSync(join(process.cwd(), 'public', asset!.bundledSrc.replace(/^\/audio\//, 'audio/')))).toBe(true);
    }
  });

  it('gives every story page a stable semantic utterance id while duration uses measured production evidence', () => {
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
        expect(utterance?.usage).toBe('story_beat');
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
