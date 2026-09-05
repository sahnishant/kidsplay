import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const modulePath = 'content/curriculum-modules/ncert/2026-27/class-2/english/mridang/chapters/my-bicycle.json';
const validatorPath = 'scripts/learning-graph/validate-assessment-semantics.mjs';

function run(root = process.cwd()): Record<string, unknown> {
  const output = execFileSync(process.execPath, [validatorPath, modulePath, '--json'], {
    cwd: root,
    encoding: 'utf8'
  });
  return JSON.parse(output.trim()) as Record<string, unknown>;
}

function copyPilot(): string {
  const root = mkdtempSync(join(tmpdir(), 'kidsplay-mridang-'));
  for (const path of [
    'content/curriculum-modules',
    'content/learning-graph',
    'content/media-bindings',
    'content/module-assessments',
    'scripts/learning-graph'
  ]) {
    cpSync(resolve(process.cwd(), path), resolve(root, path), { recursive: true });
  }
  return root;
}

describe('My Bicycle assessment semantic hardening', () => {
  it('validates typed candidate assertions and non-evaluative media purpose', () => {
    expect(run()).toMatchObject({
      semanticTargetCount: 2,
      falseJudgementCount: 1,
      nonEvaluativeMedia: ['media.binding.my-bicycle.creative-canvas']
    });
  });

  it('rejects an unsupported assertion qualifier instead of treating it as question prose', () => {
    const root = copyPilot();
    try {
      const path = resolve(root, 'content/module-assessments/mridang/my-bicycle.json');
      const blueprint = JSON.parse(readFileSync(path, 'utf8'));
      const target = blueprint.targets.find((item: { id: string }) => item.id === 'target.my-bicycle.comprehension.speed-verification');
      target.expectedSemantics.candidateAssertion.qualifiers.frequency = 'unsupported_quantifier';
      writeFileSync(path, `${JSON.stringify(blueprint, null, 2)}\n`, 'utf8');

      let stderr = '';
      try {
        run(root);
      } catch (error) {
        stderr = String((error as { stderr?: string | Buffer }).stderr ?? error);
      }
      expect(stderr).toContain('qualifier frequency has invalid value unsupported_quantifier');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
