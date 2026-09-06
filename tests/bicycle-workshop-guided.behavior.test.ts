import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function validate(): Record<string, unknown> {
  const output = execFileSync(process.execPath, ['scripts/learning-graph/validate-bicycle-workshop-guided.mjs', '--json'], { cwd: process.cwd(), encoding: 'utf8' });
  return JSON.parse(output.trim()) as Record<string, unknown>;
}

describe('Bicycle Workshop guided learning journey', () => {
  it('provides seven non-evaluative, graph-traced teaching sections in Home', () => {
    const result = validate();
    expect(result).toMatchObject({
      experienceId: 'experience.bicycle-workshop.guided.v1',
      sectionCount: 7,
      tracedBeatCount: 16,
      structuredBeatCount: 16,
      lookPromptCount: 7,
      memoryHookCount: 7,
      semanticPresenter: 'BicycleStoryStage',
      nonEvaluative: true,
      homeIntegrated: true
    });
    expect(Number(result.claimTraceCount)).toBeGreaterThanOrEqual(25);
    expect(Number(result.capabilityTraceCount)).toBeGreaterThanOrEqual(6);
  });

  it('paces each section as look, learn, remember, and try without mastery writes', () => {
    const viewport = readFileSync(resolve(process.cwd(), 'src/ui/BicycleWorkshopViewport.svelte'), 'utf8');
    const stage = readFileSync(resolve(process.cwd(), 'src/ui/BicycleStoryStage.svelte'), 'utf8');
    expect(viewport).toContain('bicycle-workshop-guided.json');
    expect(viewport).toContain('BicycleStoryStage');
    expect(viewport).toContain('data-visual-ref');
    expect(stage).toContain('bicycleStoryBike.svg?url');
    expect(viewport).not.toContain("from '../presentation/VisualEntity.svelte'");
    expect(viewport).not.toContain("from '../presentation/SemanticAnimation.svelte'");
    expect(viewport).toContain('Next idea');
    expect(viewport).toContain('Next part');
    expect(viewport).toContain('LOOK');
    expect(viewport).toContain('LEARN');
    expect(viewport).toContain('YOUR TURN');
    expect(viewport).toContain('REMEMBER');
    expect(viewport).toContain('No score here — just explore.');
    expect(viewport).toContain('aria-live="polite"');
    expect(`${viewport}\n${stage}`).not.toMatch(/My Bicycle|Mridang|bemr101|NCERT|CBSE/i);
    expect(`${viewport}\n${stage}`).not.toMatch(/recordAttempt|knowledgeEvidence|saveProgress|localProgress/);
  });
});
