import { expect, test, type Page } from '@playwright/test';
import { openCleanApp } from './helpers/childJourney';

async function openWorkshop(page: Page): Promise<void> {
  await page.getByLabel('Open child navigation').click();
  await page.getByRole('button', { name: 'Open practice activities' }).click();
  await page.getByRole('button', { name: 'Open chapter' }).click();
  await expect(page.getByRole('heading', { name: 'Bicycle Workshop', exact: true })).toBeVisible();
}

async function revealLastIdea(page: Page): Promise<void> {
  const nextIdea = page.getByRole('button', { name: 'Next idea', exact: true });
  while (await nextIdea.isVisible().catch(() => false)) {
    await nextIdea.click();
  }
}

async function openFinalSection(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Open part 7: Three checks before you ride' }).click();
  await expect(page.getByText('7/7', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Three checks before you ride' })).toBeVisible();
  await revealLastIdea(page);
  await expect(page.getByText('Helmet. Brakes. Tyres. Then ride.', { exact: true })).toBeVisible();
}

test.describe('Bicycle Workshop chapter vertical', () => {
  test('runs the paced seven-section graph-driven Learn journey at 360x640', async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 360, height: 640 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openCleanApp(page);
    await openWorkshop(page);

    await expect(page.getByText('1/7', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Meet the bicycle' })).toBeVisible();
    await expect(page.getByText('Can you spot the wheels and the pedals?', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Next idea', exact: true })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Bicycle Workshop learning sections' }).getByRole('button')).toHaveCount(7);
    await expect(page.getByText(/My Bicycle|Mridang|NCERT|CBSE/i)).toHaveCount(0);

    await revealLastIdea(page);
    await expect(page.getByText('The rider gives the bicycle its power.', { exact: true })).toBeVisible();
    await expect(page.getByText('No score here — just explore.', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Next part', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Each part has a job' })).toBeVisible();

    await revealLastIdea(page);
    await page.getByRole('button', { name: 'Next part', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Follow what happens next' })).toBeVisible();
    await expect(page.getByText('Push pedals', { exact: true })).toBeVisible();

    await revealLastIdea(page);
    await page.getByRole('button', { name: 'Next part', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'One word can do two jobs' })).toBeVisible();

    await revealLastIdea(page);
    await page.getByRole('button', { name: 'Next part', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Hear the sound pattern' })).toBeVisible();

    await revealLastIdea(page);
    await page.getByRole('button', { name: 'Next part', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Put the clues in order' })).toBeVisible();

    await revealLastIdea(page);
    await page.getByRole('button', { name: 'Next part', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Three checks before you ride' })).toBeVisible();
    await revealLastIdea(page);
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
