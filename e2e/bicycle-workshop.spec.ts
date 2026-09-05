import { expect, test, type Page } from '@playwright/test';
import { openCleanApp } from './helpers/childJourney';

async function openWorkshop(page: Page): Promise<void> {
  await page.getByLabel('Open child navigation').click();
  await page.getByRole('button', { name: 'Open practice activities' }).click();
  await page.getByRole('button', { name: 'Open chapter' }).click();
  await expect(page.getByRole('heading', { name: 'Bicycle Workshop', exact: true })).toBeVisible();
}

async function openFinalSection(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Open step 7: Check the rider and the bicycle' }).click();
  await expect(page.getByText('7/7', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Check the rider and the bicycle' })).toBeVisible();
}

test.describe('Bicycle Workshop chapter vertical', () => {
  test('runs the seven-section graph-driven Learn journey at 360x640', async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 360, height: 640 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openCleanApp(page);
    await openWorkshop(page);

    await expect(page.getByText('1/7', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'A rider-powered machine' })).toBeVisible();
    await expect(page.getByText('Exploring this page does not change your score.')).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Bicycle Workshop learning sections' }).getByRole('button')).toHaveCount(7);
    await expect(page.getByText(/My Bicycle|Mridang|NCERT|CBSE/i)).toHaveCount(0);

    await page.getByRole('button', { name: 'Next part' }).click();
    await expect(page.getByRole('heading', { name: 'Every part helps in a different way' })).toBeVisible();
    await page.getByRole('button', { name: 'Next part' }).click();
    await expect(page.getByRole('heading', { name: 'One action starts a chain' })).toBeVisible();
    await page.getByRole('button', { name: 'Next part' }).click();
    await expect(page.getByRole('heading', { name: 'The same word can do two jobs' })).toBeVisible();
    await page.getByRole('button', { name: 'Next part' }).click();
    await expect(page.getByRole('heading', { name: 'Listen to the beginning and middle sounds' })).toBeVisible();
    await page.getByRole('button', { name: 'Next part' }).click();
    await expect(page.getByRole('heading', { name: 'Use small clues from a sentence' })).toBeVisible();
    await page.getByRole('button', { name: 'Next part' }).click();
    await expect(page.getByRole('heading', { name: 'Check the rider and the bicycle' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Practice', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Chapter check', exact: true })).toBeVisible();

    const dimensions = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      viewport: document.documentElement.clientWidth
    }));
    expect(dimensions.width).toBeLessThanOrEqual(dimensions.viewport + 1);
  });

  test('launches both assessed surfaces through the existing session engine', async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await openCleanApp(page);
    await openWorkshop(page);
    await openFinalSection(page);

    await page.getByRole('button', { name: 'Practice', exact: true }).click();
    await expect(page.getByText('Bicycle Workshop — Class 2 English', { exact: true })).toBeVisible();
    await expect(page.getByText(/1 \/ 8/)).toBeVisible();

    await openCleanApp(page);
    await openWorkshop(page);
    await openFinalSection(page);
    await page.getByRole('button', { name: 'Chapter check', exact: true }).click();
    await expect(page.getByText('Bicycle Workshop — Chapter Check', { exact: true })).toBeVisible();
    await expect(page.getByText(/1 \/ 8/)).toBeVisible();
  });
});
