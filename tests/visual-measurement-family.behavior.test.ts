import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  resolveItemVisualRefs,
  resolveLabelVisualRefs,
  resolveSemanticVisualRefs,
  resolveVisualDefinition
} from '../src/presentation/visualRegistry';
import { resolveVisualRecipeForSemantic } from '../src/presentation/visualRecipeRegistry';

const measurements = [
  ['temperature', 'entity.measurement.thermometer'],
  ['length', 'entity.measurement.ruler'],
  ['mass', 'entity.measurement.balance-scale'],
  ['capacity', 'entity.measurement.measuring-vessel']
] as const;

describe('measurement visual recipe family', () => {
  it('resolves four measurement concepts through recipes instead of direct semantic primitive aliases', () => {
    for (const [semanticRef, visualRef] of measurements) {
      expect(resolveSemanticVisualRefs(semanticRef)).toEqual([]);
      expect(resolveItemVisualRefs({ label: semanticRef, semanticRef }, true, 'option')).toEqual([visualRef]);
      expect(resolveVisualRecipeForSemantic(semanticRef, 'option')?.template).toBe('measurement');
      expect(resolveVisualRecipeForSemantic(semanticRef, 'option')?.exposure).toBe('identity_only');
      expect(resolveVisualDefinition(visualRef)?.renderer).toBe('measurement-icon');
    }
  });

  it('keeps explanatory meaning on feedback surfaces while answer surfaces remain identity-only', () => {
    const option = resolveVisualRecipeForSemantic('temperature', 'option');
    const feedback = resolveVisualRecipeForSemantic('temperature', 'feedback');
    expect(option?.slots.map((slot) => slot.visualRef)).toEqual(['entity.measurement.thermometer']);
    expect(option?.annotation).toBe('measures how hot or cold something is');
    expect(feedback?.exposure).toBe('full_relation');
    expect(feedback?.annotation).toBe('measures how hot or cold something is');
  });

  it('does not turn unit strings or longer measurement sentences into inferred visuals', () => {
    for (const label of ['kg', 'cm', 'mL', 'metres (m)', 'Which tool measures length?']) {
      expect(resolveLabelVisualRefs(label)).toEqual([]);
    }
  });

  it('keeps one generic renderer family rather than concept-specific components', () => {
    const source = readFileSync('src/presentation/MeasurementIcon.svelte', 'utf8');
    expect(source).toContain("icon === 'thermometer'");
    expect(source).toContain("icon === 'ruler'");
    expect(source).toContain("icon === 'balance-scale'");
    expect(source).toContain("icon === 'measuring-vessel'");
    expect(source).not.toContain("semanticRef === 'temperature'");
    expect(source).not.toContain("semanticRef === 'length'");
  });

  it('removes the covered measurement identities from the production ROI queue', () => {
    const output = execFileSync(process.execPath, ['scripts/report-visual-recipe-roi.mjs', '--json', '--limit=50'], {
      cwd: process.cwd(),
      encoding: 'utf8'
    });
    const report = JSON.parse(output) as {
      queue: Array<{ semanticRef: string | null }>;
    };
    const refs = new Set(report.queue.map((entry) => entry.semanticRef));
    for (const [semanticRef] of measurements) expect(refs.has(semanticRef)).toBe(false);
    expect(refs.has('si-length')).toBe(true);
  });
});
