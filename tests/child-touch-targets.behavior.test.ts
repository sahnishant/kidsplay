import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const main = readFileSync(resolve('src/main.ts'), 'utf8').replace(/\r\n?/g, '\n');
const policy = readFileSync(resolve('src/touchTargets.css'), 'utf8').replace(/\r\n?/g, '\n');
const styles = readFileSync(resolve('src/styles.css'), 'utf8').replace(/\r\n?/g, '\n');

const representativeSelectors = [
  '.child-hud__player',
  '.home-nav__button',
  '.avatar-button',
  '.primary-action',
  '.choice-button',
  '.fill-blank',
  '.word-chip',
  '.drag-item',
  '.drop-target',
  '.primary-button',
  '.next-button',
  '.memory-card',
  '.hotspot__region',
  '.sequence-order__move'
];

describe('child touch-target product invariant', () => {
  it('loads the minimum-target policy after the ordinary component and engine styles', () => {
    const interactionStyles = main.indexOf("import './interactionStyles.css';");
    const viewportStyles = main.indexOf("import './viewport.css';");
    const touchTargets = main.indexOf("import './touchTargets.css';");

    expect(interactionStyles).toBeGreaterThanOrEqual(0);
    expect(viewportStyles).toBeGreaterThanOrEqual(0);
    expect(touchTargets).toBeGreaterThan(interactionStyles);
    expect(touchTargets).toBeGreaterThan(viewportStyles);
  });

  it('keeps compact navigation and representative child interaction families at the 44px floor', () => {
    expect(policy).toContain('--child-touch-target-min: 44px;');
    expect(policy).toMatch(/#app \.home-button,[\s\S]*?#app \.panel-back \{[\s\S]*?width: var\(--child-touch-target-min\);[\s\S]*?min-width: var\(--child-touch-target-min\);[\s\S]*?height: var\(--child-touch-target-min\);[\s\S]*?min-height: var\(--child-touch-target-min\);[\s\S]*?\}/);

    for (const selector of representativeSelectors) {
      expect(policy, `${selector} should be covered by the child touch-target policy`).toContain(`#app ${selector}`);
    }
    expect(policy).toMatch(/#app \.child-hud__player,[\s\S]*?#app \.sequence-order__move \{[\s\S]*?min-width: var\(--child-touch-target-min\);[\s\S]*?min-height: var\(--child-touch-target-min\);[\s\S]*?\}/);
  });

  it('retains a visible keyboard focus treatment while enforcing the touch floor', () => {
    expect(styles).toMatch(/button:focus-visible \{[\s\S]*?outline: 4px solid [^;]+;[\s\S]*?outline-offset: 3px;[\s\S]*?\}/);
  });
});