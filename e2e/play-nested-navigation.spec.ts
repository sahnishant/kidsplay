import { expect, test, type Page } from '@playwright/test';
import { openCleanApp } from './helpers/childJourney';

async function openPlay(page: Page): Promise<void> {
  await page.getByLabel('Open child navigation').click();
  await page.getByRole('button', { name: 'Open practice activities' }).click();
  await expect(page.getByRole('heading', { name: 'Choose a play activity' })).toBeVisible();
}

async function openBicycleWorkshop(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Open chapter' }).click();
  await expect(page.getByRole('heading', { name: 'Bicycle Workshop', exact: true })).toBeVisible();
}

async function expectPlay(page: Page): Promise<void> {
  await expect(page.getByRole('heading', { name: 'Choose a play activity' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open chapter' })).toBeVisible();
}

test.describe('nested Play navigation', () => {
  test('Bicycle Workshop returns to Play for Escape, browser Back, and its Back control', async ({ page }) => {
    await openCleanApp(page);
    await openPlay(page);

    await openBicycleWorkshop(page);
    await page.keyboard.press('Escape');
    await expectPlay(page);

    await openBicycleWorkshop(page);
    await page.goBack();
    await expectPlay(page);

    await openBicycleWorkshop(page);
    await page.getByRole('button', { name: 'Back to play' }).click();
    await expectPlay(page);
  });
});
