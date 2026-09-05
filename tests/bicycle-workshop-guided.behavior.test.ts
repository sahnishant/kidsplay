import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function validate(): Record<string, unknown> {
  const output = execFileSync(process.execPath, [
    'scripts/learning-graph/validate-bicycle-workshop-guided.mjs',
    '--json'
  ], { cwd: process.cwd(), encoding: 'utf8' });
  return JSON.parse(output.trim()) as Record<string, unknown>;
}

describe('Bicycle Workshop guided learning journey', () => {
  it('provides seven non-evaluative, graph-traced teaching sections in Home', () => {
    const result = validate();
    expect(result).toMatchObject({
      experienceId: 'experience.bicycle-workshop.guided.v1',
      sectionCount: 7,
      tracedBeatCount: 16,
      semanticPresenter: 'SemanticVisualPresenter',
      nonEvaluative: true,
      homeIntegrated: true
    });
    expect(Number(result.claimTraceCount)).toBeGreaterThanOrEqual(25);
    expect(Number(result.capabilityTraceCount)).toBeGreaterThanOrEqual(6);
  });

  it('keeps the child viewport independent of source text and mastery writes', () => {
    const viewport = readFileSync(resolve(process.cwd(), 'src/ui/BicycleWorkshopViewport.svelte'), 'utf8');
    expect(viewport).toContain("bicycle-workshop-guided.json");
    expect(viewport).toContain('SemanticVisualPresenter');
    expect(viewport).toContain('animationVisualPresentation');
    expect(viewport).toContain('resolveItemVisualPresentation');
    expect(viewport).not.toContain("from '../presentation/VisualEntity.svelte'");
    expect(viewport).not.toContain("from '../presentation/SemanticAnimation.svelte'");
    expect(viewport).toContain('Exploring this page does not change your score.');
    expect(viewport).not.toMatch(/My Bicycle|Mridang|bemr101|NCERT|CBSE/i);
    expect(viewport).not.toMatch(/recordAttempt|knowledgeEvidence|saveProgress|localProgress/);
  });
});
