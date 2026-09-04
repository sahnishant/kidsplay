import { expect, test, type Locator, type Page } from '@playwright/test';
import { openCleanApp } from './helpers/childJourney';

const COMPILED_POLICY_CLASSES = [
  'home-button',
  'choice-button',
  'fill-blank',
  'word-chip',
  'drag-item',
  'drop-target',
  'memory-card',
  'hotspot__region',
  'sequence-order__move'
] as const;

async function expectMinimumChildTarget(locator: Locator, label: string): Promise<void> {
  await expect(locator, `${label}: control should be visible`).toBeVisible();
  const box = await locator.boundingBox();
  expect(box, `${label}: control should have a measurable box`).not.toBeNull();
  expect(box!.width, `${label}: width should be at least 44 CSS px`).toBeGreaterThanOrEqual(44);
  expect(box!.height, `${label}: height should be at least 44 CSS px`).toBeGreaterThanOrEqual(44);
}

async function measureCompiledTouchPolicy(
  page: Page
): Promise<Record<string, { width: number; height: number }>> {
  return page.evaluate((classNames) => {
    const app = document.getElementById('app');
    if (!app) throw new Error('Missing #app root');

    const host = document.createElement('div');
    host.style.position = 'fixed';
    host.style.left = '0';
    host.style.top = '0';
    host.style.width = '280px';
    host.style.opacity = '0';
    host.style.pointerEvents = 'none';
    app.append(host);

    const result: Record<string, { width: number; height: number }> = {};
    for (const className of classNames) {
      const probe = document.createElement('button');
      probe.type = 'button';
      probe.className = className;
      probe.textContent = className === 'sequence-order__move' || className === 'home-button' ? '↑' : 'Probe';
      probe.setAttribute('aria-label', `${className} touch-target probe`);
      if (className === 'sequence-order__move') probe.disabled = true;
      host.append(probe);

      const rect = probe.getBoundingClientRect();
      result[className] = { width: rect.width, height: rect.height };
      probe.remove();
    }

    host.remove();
    return result;
  }, [...COMPILED_POLICY_CLASSES]);
}

function expectCompiledTouchFloor(
  compiledTargets: Record<string, { width: number; height: number }>,
  viewportLabel: string
): void {
  for (const className of COMPILED_POLICY_CLASSES) {
    expect(
      compiledTargets[className].width,
      `${viewportLabel} ${className}: compiled width should preserve the touch floor`
    ).toBeGreaterThanOrEqual(44);
    expect(
      compiledTargets[className].height,
      `${viewportLabel} ${className}: compiled height should preserve the touch floor`
    ).toBeGreaterThanOrEqual(44);
  }
}

test.describe('child touch-target ergonomics', () => {
  test.use({ viewport: { width: 360, height: 640 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });

  test('representative child controls keep the 44px floor at the small-phone viewport', async ({ page }) => {
    await openCleanApp(page);
    await page.getByLabel('Open child navigation').click();
    await page.getByRole('button', { name: 'Open practice activities' }).click();

    await expectMinimumChildTarget(
      page.getByRole('button', { name: "Back to Dheu's world" }),
      'dashboard panel Back control'
    );
    await expectMinimumChildTarget(
      page.getByRole('button', { name: 'Play free' }),
      'catalog action'
    );

    expectCompiledTouchFloor(await measureCompiledTouchPolicy(page), '360px viewport');

    await page.getByRole('button', { name: 'Play free' }).click();
    await expectMinimumChildTarget(
      page.getByRole('button', { name: 'Back to Kidsplay home' }),
      'session Home control'
    );
  });

  test('compiled child controls keep the same 44px floor outside narrow-phone overrides', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 800 });
    await openCleanApp(page);

    expectCompiledTouchFloor(await measureCompiledTouchPolicy(page), '800px viewport');
  });
});