import { expect, test, type Page } from '@playwright/test';
import { openCleanApp } from './helpers/childJourney';

const key = 'kidsplay.studioWork.v1:local-child:studio.words.bell';
async function openWords(page: Page): Promise<void> {
  await page.getByLabel('Open child navigation').click();
  await page.getByRole('button', { name: 'Open practice activities' }).click();
  await page.getByRole('button', { name: 'Open chapter' }).click();
  await page.getByRole('button', { name: 'Open part 4: One word can do two jobs' }).click();
  const next = page.getByRole('button', { name: 'Next idea', exact: true });
  while (await next.isVisible()) await next.click();
  await page.getByRole('button', { name: /Build BELL/ }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
}

test.describe('source-derived sequence studio workspace', () => {
  test.use({ viewport: { width: 360, height: 640 }, hasTouch: true, reducedMotion: 'reduce' });
  test('restores letter work and demonstration step without recording spelling mastery', async ({ page }, info) => {
    await openCleanApp(page);
    const progressBefore = await page.evaluate(() => localStorage.getItem('kidsplay.progress.v1'));
    await openWords(page);
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: /^Letter B,/ }).tap();
    await dialog.getByRole('button', { name: /^Letter E,/ }).tap();
    const arrangement = await dialog.locator('.letter-order__tile').allTextContents();
    await expect.poll(() => page.evaluate((name) => JSON.parse(localStorage.getItem(name) ?? 'null')?.workspace.state.orderedItemIds.length, key)).toBe(4);
    await dialog.getByRole('button', { name: 'Show me', exact: true }).click();
    await dialog.getByRole('button', { name: 'Next step', exact: true }).click();
    await expect(dialog.getByText('Step 2 of 4', { exact: true })).toBeVisible();
    await page.reload();
    await openWords(page);
    const restored = page.getByRole('dialog');
    await expect(restored.getByText('Step 2 of 4', { exact: true })).toBeVisible();
    await restored.getByRole('button', { name: 'Explore', exact: true }).click();
    await expect(restored.locator('.letter-order__tile')).toHaveText(arrangement);
    await restored.getByRole('button', { name: 'Try it', exact: true }).click();
    await expect(restored.getByText('Rebuild BELL with these letters.', { exact: true })).toBeVisible();
    const target = ['B','E','L','L'];
    const tiles = restored.locator('.letter-order__tile');
    for (let index = 0; index < target.length; index += 1) {
      const labels = await tiles.allTextContents();
      if (labels[index] === target[index]) continue;
      const other = labels.findIndex((label, position) => position > index && label === target[index]);
      expect(other).toBeGreaterThan(index);
      await tiles.nth(index).click(); await tiles.nth(other).click();
    }
    await restored.getByRole('button', { name: 'Check word', exact: true }).click();
    await expect(restored.getByText('The letters spell BELL.', { exact: true })).toBeVisible();
    await expect(restored.getByRole('group', { name: 'Your submitted work: B → E → L → L.', exact: true })).toBeVisible();
    await expect(tiles.first()).toHaveCSS('opacity', '1');
    const colours = await tiles.first().evaluate((tile) => ({ tile: getComputedStyle(tile).color, studio: getComputedStyle(tile.closest('.studio')!).color }));
    expect(colours.tile).toBe(colours.studio);
    const saved = await page.evaluate((name) => JSON.parse(localStorage.getItem(name)!), key);
    expect(saved.workspace.learning.checkCount).toBe(1);
    expect(saved.workspace.learning.demonstrationSeen).toBe(true);
    expect(await page.evaluate(() => localStorage.getItem('kidsplay.progress.v1'))).toBe(progressBefore);
    await page.screenshot({ path: info.outputPath('studio-bell-practice.png') });
    await restored.getByRole('button', { name: 'Change my answer', exact: true }).click();
    for (const tile of await tiles.all()) {
      const box = await tile.boundingBox();
      expect(box!.width).toBeGreaterThanOrEqual(48);
      expect(box!.height).toBeGreaterThanOrEqual(48);
    }
  });
});
