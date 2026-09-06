import { expect, test, type Page } from '@playwright/test';
import { openCleanApp } from './helpers/childJourney';

const activityId = 'studio.match.human-senses';
const workKey = `kidsplay.studioWork.v1:local-child:${activityId}`;

async function openLearnAbout(page: Page): Promise<void> {
  await page.getByLabel('Open child navigation').click();
  await page.getByRole('button', { name: 'Open practice activities' }).click();
  await page.getByRole('button', { name: 'Open Learn About' }).click();
}

async function openHumanSenses(page: Page) {
  await openLearnAbout(page);
  await page.getByRole('button', { name: 'Learn about Human Body' }).click();
  await page.getByRole('button', { name: /Match sense organs & jobs/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Match sense organs & jobs' });
  await expect(dialog).toBeVisible();
  return dialog;
}

async function savedWork(page: Page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), workKey);
}

async function evidence(page: Page) {
  return page.evaluate(() => Object.fromEntries(
    Object.keys(localStorage)
      .filter((name) => /progress|mastery|evidence|attempt/i.test(name))
      .sort()
      .map((name) => [name, localStorage.getItem(name)])
  ));
}

test.describe('matching studio reuse', () => {
  test.use({ viewport: { width: 360, height: 640 }, reducedMotion: 'reduce', hasTouch: true });

  test('partial keyboard matching, Show me and reload preserve work without mastery writes', async ({ page }, info) => {
    await openCleanApp(page);
    const beforeEvidence = await evidence(page);
    const dialog = await openHumanSenses(page);
    await expect(dialog.locator('.drag-stage')).toBeVisible();

    const firstItem = dialog.locator('.drag-item').first();
    const secondTarget = dialog.locator('.drop-target').nth(1);
    const itemLabel = (await firstItem.innerText()).trim();

    await firstItem.focus();
    await page.keyboard.press('Space');
    await secondTarget.focus();
    await page.keyboard.press('Enter');

    await expect.poll(async () => Object.keys((await savedWork(page))?.workspace?.state?.assignments ?? {}).length).toBe(1);
    await expect(secondTarget).toContainText(itemLabel);

    await dialog.getByRole('button', { name: 'Show me', exact: true }).click();
    await expect(dialog.getByText(/PAIR 1 OF/i)).toBeVisible();
    await dialog.getByRole('button', { name: 'Next pair', exact: true }).click();
    await expect(dialog.getByText(/PAIR 2 OF/i)).toBeVisible();
    expect((await savedWork(page)).workspace.learning.demonstrationSeen).toBe(true);
    expect((await savedWork(page)).workspace.learning.stepIndex).toBe(1);
    await page.screenshot({ path: info.outputPath('studio-matching-teaching.png') });

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.reload();

    const restored = await openHumanSenses(page);
    await expect(restored.getByRole('button', { name: 'Show me', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(restored.getByText(/PAIR 2 OF/i)).toBeVisible();
    await restored.getByRole('button', { name: 'Return to my matches', exact: true }).click();
    await expect(restored.locator('.drop-target').nth(1)).toContainText(itemLabel);

    expect(await evidence(page)).toEqual(beforeEvidence);
    const bounds = await restored.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.width).toBeLessThanOrEqual(360);
    expect(bounds!.height).toBeLessThanOrEqual(640);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(361);
  });
});
