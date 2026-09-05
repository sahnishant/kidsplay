import { expect, test, type Page } from '@playwright/test';
import { openCleanApp } from './helpers/childJourney';

const key = 'kidsplay.studioWork.v1:local-child:studio.fractions.equal-shares';
const prefix = 'kidsplay.studioWork.v1:';
async function openFractions(page: Page): Promise<void> {
  await page.getByLabel('Open child navigation').click();
  await page.getByRole('button', { name: 'Open practice activities' }).click();
  await page.getByRole('button', { name: 'Open Learn About' }).click();
  await page.getByRole('button', { name: 'Learn about Fractions' }).click();
}
async function openHalf(page: Page) {
  await page.getByRole('button', { name: /Make equal shares/ }).first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.locator('[data-engine="equal_parts"]')).toBeVisible();
  return dialog;
}
async function work(page: Page) { return page.evaluate((name) => JSON.parse(localStorage.getItem(name) ?? 'null'), key); }
async function evidence(page: Page) {
  return page.evaluate(() => Object.fromEntries(Object.keys(localStorage).filter((name) => /progress|mastery|evidence|attempt/i.test(name)).sort().map((name) => [name, localStorage.getItem(name)])));
}

test.describe('reusable studios: durable work and compact teaching', () => {
  test.use({ viewport: { width: 360, height: 640 }, reducedMotion: 'reduce', hasTouch: true });
  test.beforeEach(async ({ page }) => { await openCleanApp(page); });

  test('opening is non-writing; manipulation and visual teaching survive route destruction and reload', async ({ page }, info) => {
    await openFractions(page);
    const before = await evidence(page);
    const dialog = await openHalf(page);
    expect(await page.evaluate((start) => Object.keys(localStorage).filter((name) => name.startsWith(start)), prefix)).toEqual([]);
    const parts = dialog.getByRole('group', { name: 'Large controls for each equal part' });
    await parts.getByRole('button', { name: 'Part 1: empty', exact: true }).focus();
    await page.keyboard.press('Space');
    await dialog.getByRole('group', { name: 'Choose what to place' }).getByRole('button', { name: /Teal/ }).click();
    await parts.getByRole('button', { name: 'Part 4: empty', exact: true }).tap();
    await expect.poll(async () => (await work(page))?.workspace.state.assignments).toEqual(['gold', null, null, 'teal']);
    await dialog.getByRole('button', { name: 'Show me', exact: true }).click();
    await dialog.getByRole('button', { name: 'Next step', exact: true }).click();
    await expect(dialog.locator('[data-fraction-demonstration]')).toContainText('Your arrangement can be different');
    await page.screenshot({ path: info.outputPath('studio-fraction-teaching.png') });
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Make equal shares/ }).first()).toBeFocused();
    await page.reload();
    await openFractions(page);
    await page.getByRole('button', { name: /Make equal shares/ }).first().click();
    const restored = page.getByRole('dialog');
    await expect(restored.getByRole('button', { name: 'Show me', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(restored.getByRole('button', { name: 'Next step', exact: true })).toBeDisabled();
    await restored.getByRole('button', { name: 'Explore', exact: true }).click();
    await expect(restored.getByRole('button', { name: 'Part 1: Gold', exact: true })).toBeVisible();
    await expect(restored.getByRole('button', { name: 'Part 4: Teal', exact: true })).toBeVisible();
    expect((await work(page)).workspace.learning.demonstrationSeen).toBe(true);
    expect(await evidence(page)).toEqual(before);
    const bounds = await restored.boundingBox();
    expect(bounds!.width).toBeLessThanOrEqual(360);
    expect(bounds!.height).toBeLessThanOrEqual(640);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(361);
  });

  test('noncontiguous valid allocations pass; a restored check is not submitted again', async ({ page }) => {
    await openFractions(page);
    const before = await evidence(page);
    const dialog = await openHalf(page);
    await dialog.getByRole('button', { name: 'Try it', exact: true }).click();
    const parts = dialog.getByRole('group', { name: 'Large controls for each equal part' });
    for (const n of [1, 3]) await parts.getByRole('button', { name: `Part ${n}: empty`, exact: true }).click();
    await dialog.getByRole('group', { name: 'Choose what to place' }).getByRole('button', { name: /Teal/ }).click();
    for (const n of [2, 4]) await parts.getByRole('button', { name: `Part ${n}: empty`, exact: true }).click();
    await dialog.getByRole('button', { name: 'Check my whole', exact: true }).click();
    await expect(dialog.getByText('Your amounts match. A different arrangement can work too.', { exact: true })).toBeVisible();
    expect((await work(page)).workspace.learning.checkCount).toBe(1);
    await page.reload();
    await openFractions(page);
    await page.getByRole('button', { name: /Make equal shares/ }).first().click();
    const restored = page.getByRole('dialog');
    await expect(restored.getByRole('button', { name: 'Change my answer', exact: true })).toBeVisible();
    expect((await work(page)).workspace.learning.checkCount).toBe(1);
    await restored.getByRole('button', { name: 'Change my answer', exact: true }).click();
    await expect(restored.getByRole('button', { name: 'Part 3: Gold', exact: true })).toBeVisible();
    expect(await evidence(page)).toEqual(before);
  });

  test('start over requires confirmation and does not erase demonstration history', async ({ page }) => {
    await openFractions(page);
    const dialog = await openHalf(page);
    await dialog.getByRole('button', { name: 'Part 1: empty', exact: true }).click();
    await dialog.getByRole('button', { name: 'Show me', exact: true }).click();
    await dialog.getByRole('button', { name: 'Explore', exact: true }).click();
    await dialog.getByRole('button', { name: 'Start over', exact: true }).click();
    await dialog.getByRole('button', { name: 'Keep my work', exact: true }).click();
    await expect(dialog.getByRole('button', { name: 'Part 1: Gold', exact: true })).toBeVisible();
    await dialog.getByRole('button', { name: 'Start over', exact: true }).click();
    await dialog.getByRole('button', { name: 'Clear this activity', exact: true }).click();
    await expect(dialog.getByRole('button', { name: 'Part 1: empty', exact: true })).toBeVisible();
    expect((await work(page)).workspace.state).toBeNull();
    expect((await work(page)).workspace.learning.demonstrationSeen).toBe(true);
  });

  test('corrupt saved bytes remain intact and storage failure is visible', async ({ page }) => {
    await page.evaluate((name) => localStorage.setItem(name, '{broken'), key);
    await openFractions(page);
    const dialog = await openHalf(page);
    await expect(dialog.getByText(/saved copy could not be read/)).toBeVisible();
    await dialog.getByRole('button', { name: 'Part 1: empty', exact: true }).click();
    expect(await page.evaluate((name) => localStorage.getItem(name), key)).toBe('{broken');
    await expect(dialog.getByRole('button', { name: 'Part 1: Gold', exact: true })).toBeVisible();
  });

  test('a newer durable generation takes precedence over old launcher memory', async ({ page }) => {
    await openFractions(page);
    const dialog = await openHalf(page);
    await dialog.getByRole('button', { name: 'Part 1: empty', exact: true }).click();
    await dialog.getByRole('button', { name: 'Back to topic', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.evaluate((name) => {
      const value = JSON.parse(localStorage.getItem(name)!);
      value.generation += 1;
      value.workspace.state.assignments = ['teal', null, null, null];
      localStorage.setItem(name, JSON.stringify(value));
    }, key);
    const restored = await openHalf(page);
    await expect(restored.getByRole('button', { name: 'Part 1: Teal', exact: true })).toBeVisible();
    expect((await work(page)).workspace.state.assignments[0]).toBe('teal');
  });

  test('incompatible work is not silently overwritten before explicit restart', async ({ page }) => {
    await openFractions(page);
    const dialog = await openHalf(page);
    await dialog.getByRole('button', { name: 'Part 1: empty', exact: true }).click();
    await page.reload();
    const original = await page.evaluate((name) => {
      const value = JSON.parse(localStorage.getItem(name)!);
      value.workspace.signature = 'old-content';
      const raw = JSON.stringify(value); localStorage.setItem(name, raw); return raw;
    }, key);
    await openFractions(page);
    const restored = await openHalf(page);
    await expect(restored.getByText(/This activity has changed/)).toBeVisible();
    await restored.getByRole('button', { name: 'Part 2: empty', exact: true }).click();
    expect(await page.evaluate((name) => localStorage.getItem(name), key)).toBe(original);
    await restored.getByRole('button', { name: 'Start over', exact: true }).click();
    await restored.getByRole('button', { name: 'Clear this activity', exact: true }).click();
    expect((await work(page)).workspace.signature).not.toBe('old-content');
  });

  test('quota failure keeps the activity usable and does not claim a successful save', async ({ page }) => {
    await page.evaluate((start) => {
      const set = Storage.prototype.setItem;
      Storage.prototype.setItem = function(name, value) {
        if (name.startsWith(start)) throw new DOMException('full', 'QuotaExceededError');
        return set.call(this, name, value);
      };
    }, prefix);
    await openFractions(page);
    const dialog = await openHalf(page);
    await dialog.getByRole('button', { name: 'Part 1: empty', exact: true }).click();
    await expect(dialog.getByText(/device could not save/)).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Part 1: Gold', exact: true })).toBeVisible();
    expect(await work(page)).toBeNull();
  });

  test('a loaded studio remains usable and reopens with work while the browser is offline', async ({ page, context }) => {
    await openFractions(page);
    const dialog = await openHalf(page);
    await context.setOffline(true);
    await dialog.getByRole('button', { name: 'Part 2: empty', exact: true }).tap();
    await dialog.getByRole('button', { name: 'Back to topic', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    const restored = await openHalf(page);
    await expect(restored.getByRole('button', { name: 'Part 2: Gold', exact: true })).toBeVisible();
    await context.setOffline(false);
  });
});
