import { expect, test } from '@playwright/test';
import { openCleanApp } from './helpers/childJourney';

for (const reducedMotion of ['reduce', 'no-preference'] as const) {
  test.describe(`studio character SVG timelines: ${reducedMotion}`, () => {
    test.use({ viewport: { width: 360, height: 640 }, reducedMotion });
    test('the canonical character stays still through every story page', async ({ page }) => {
      await openCleanApp(page);
      await page.getByLabel('Open child navigation').click();
      await page.getByRole('button', { name: 'Open practice activities' }).click();
      await page.getByRole('button', { name: 'Open Learn About' }).click();
      await page.getByRole('button', { name: 'Learn about Fire Station', exact: true }).click();
      await page.getByRole('button', { name: /D2\s*Connect/ }).click();
      await page.getByRole('button', { name: /^Dheu visits the fire station/ }).click();
      const dialog = page.getByRole('dialog');
      await dialog.getByRole('button', { name: 'Show me', exact: true }).click();
      for (const [index, glyph] of ['visit-arrive', 'visit-look', 'visit-draw', 'visit-leave'].entries()) {
        const scene = dialog.locator(`[data-studio-scene="${glyph}"]`);
        await expect(scene).toBeVisible();
        const character = scene.locator('svg[data-character="dheu"]');
        await expect(character).toHaveCount(1);
        await expect.poll(() => character.evaluate((svg) => (svg as SVGSVGElement).animationsPaused())).toBe(true);
        const before = await character.evaluate((svg) => (svg as SVGSVGElement).getCurrentTime());
        await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
        expect(await character.evaluate((svg) => (svg as SVGSVGElement).getCurrentTime())).toBe(before);
        if (index < 3) await dialog.getByRole('button', { name: 'Next step', exact: true }).click();
      }
    });
  });
}
