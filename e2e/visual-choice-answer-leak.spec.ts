import { expect, test, type Page } from '@playwright/test';

test.use({ viewport: { width: 360, height: 640 } });

async function openPicturePlay(page: Page): Promise<void> {
  await page.goto('/');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await page.getByLabel('Open child navigation').click();
  await page.getByRole('button', { name: 'Open practice activities' }).click();
  await page.getByRole('button', { name: 'Start picture play puzzles' }).click();
}

async function next(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Next activity' }).click();
}

test('visual recognition choices never print the answer labels', async ({ page }) => {
  await openPicturePlay(page);

  const surface = page.locator('[data-first-play-mode="visual_reasoning"]');
  await expect(surface).toHaveAttribute('data-activity-id', 'visual-choice.animals.dog');
  await expect(page.locator('.choice-button__label--hidden')).toHaveCount(3);
  await expect(page.locator('.choice-button__label:visible')).toHaveCount(0);

  await page.getByRole('button', { name: 'Dog', exact: true }).click();
  await next(page);
  await expect(surface).toHaveAttribute('data-activity-id', 'visual-choice.transport.bus');
  await expect(page.locator('.choice-button__label--hidden')).toHaveCount(4);

  await page.getByRole('button', { name: 'Bus', exact: true }).click();
  await next(page);
  await expect(surface).toHaveAttribute('data-activity-id', 'visual-choice.body.eyes');
  await expect(page.getByText('Find the eyes.', { exact: true })).toBeVisible();
  await expect(page.locator('.choice-button__label--hidden')).toHaveCount(4);
  await expect(page.locator('.choice-button__label:visible')).toHaveCount(0);
  await expect(page.locator('.choice-button__label', { hasText: 'Eyes' })).not.toBeVisible();

  // The semantic name remains available to accessibility and input handling.
  await expect(page.getByRole('button', { name: 'Eyes', exact: true })).toBeVisible();
});
