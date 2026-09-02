import { expect, test, type Locator, type Page } from '@playwright/test';
import { openCleanApp } from './helpers/childJourney';

async function expectMinimumChildTarget(locator: Locator, label: string): Promise<void> {
  await expect(locator, `${label}: control should be visible`).toBeVisible();
  const box = await locator.boundingBox();
  expect(box, `${label}: control should have a measurable box`).not.toBeNull();
  expect(box!.width, `${label}: width should be at least 44 CSS px`).toBeGreaterThanOrEqual(44);
  expect(box!.height, `${label}: height should be at least 44 CSS px`).toBeGreaterThanOrEqual(44);
}

async function measureDisabledSequenceMovePolicy(page: Page): Promise<{ width: number; height: number }> {
  return page.evaluate(() => {
    const app = document.getElementById('app');
    if (!app) throw new Error('Missing #app root');

    const probe = document.createElement('button');
    probe.type = 'button';
    probe.disabled = true;
    probe.className = 'sequence-order__move';
    probe.textContent = '↑';
    probe.setAttribute('aria-label', 'Disabled sequence move size probe');
    probe.style.position = 'fixed';
    probe.style.left = '0';
    probe.style.top = '0';
    app.append(probe);

    const rect = probe.getBoundingClientRect();
    const result = { width: rect.width, height: rect.height };
    probe.remove();
    return result;
  });
}

test.describe('child touch-target ergonomics', () => {
  test.use({ viewport: { width: 360, height: 640 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });

  test('Home and sequence movement keep the 44px floor at the small-phone viewport', async ({ page }) => {
    await openCleanApp(page);
    await page.getByRole('button', { name: 'Open practice activities' }).click();
    await page.getByRole('button', { name: 'Play free' }).click();

    await expectMinimumChildTarget(
      page.getByRole('button', { name: 'Back to Kidsplay home' }),
      'session Home control'
    );

    const disabledSequenceMove = await measureDisabledSequenceMovePolicy(page);
    expect(disabledSequenceMove.width, 'disabled sequence move should still preserve the touch floor')
      .toBeGreaterThanOrEqual(44);
    expect(disabledSequenceMove.height, 'disabled sequence move should still preserve the touch floor')
      .toBeGreaterThanOrEqual(44);
  });
});
