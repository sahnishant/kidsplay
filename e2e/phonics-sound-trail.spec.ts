import { expect, test, type Page } from '@playwright/test';
import { answerCurrentQuestion, openCleanApp } from './helpers/childJourney';

async function ensureTargetSoundStarted(page: Page): Promise<void> {
  const heard = page.locator('[data-target-sound-heard="true"]');
  if (!await heard.isVisible()) {
    await page.getByRole('button', { name: 'Repeat target sound' }).click();
  }
  await expect(heard).toBeVisible();
}

async function openPractice(page: Page): Promise<void> {
  await page.getByLabel('Open child navigation').click();
  await page.getByRole('button', { name: 'Open practice activities' }).click();
}

test.describe('Scientu sound-first phonics trail', () => {
  test('requires bundled sound, keeps Repeat available, and reuses choice + drag at 360x640', async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 360, height: 640 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openCleanApp(page);

    await openPractice(page);
    await page.getByRole('button', { name: 'Start Sound Trail' }).click();

    await expect(page.getByText('Scientu’s Sound Trail', { exact: true })).toBeVisible();
    await expect(page.getByText('1 / 12', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Repeat target sound' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Repeat question' })).toBeHidden();

    // Browser autoplay policy is allowed to block the first attempt. A child tap
    // on Repeat is the canonical recovery path and only real bundled playback
    // unlocks the question.
    await ensureTargetSoundStarted(page);
    await expect(page.locator('[data-phonics-stage="discriminate"] [data-target-sound-heard="true"]')).toBeVisible();
    await expect(page.locator('.choice-grid')).toBeVisible();

    // Sound-off is fail-closed for an audio objective: the choices disappear and
    // no silent/visual-only answer can create phonics evidence.
    await page.getByRole('button', { name: 'Turn sound off' }).click();
    await expect(page.getByRole('button', { name: 'Repeat target sound' })).toBeDisabled();
    await expect(page.getByText('Listen first', { exact: true })).toBeVisible();
    await expect(page.locator('.choice-grid')).toHaveCount(0);

    await page.getByRole('button', { name: 'Turn sound on' }).click();
    await ensureTargetSoundStarted(page);
    await expect(page.locator('.choice-grid')).toBeVisible();

    const first = await answerCurrentQuestion(page);
    expect(first.engine).toBe('single_choice');
    await expect(page.getByRole('button', { name: 'Next' })).toBeVisible();
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByText('2 / 12', { exact: true })).toBeVisible({ timeout: 8_000 });
    await expect(page.getByRole('button', { name: 'Repeat target sound' })).toBeVisible();
    await ensureTargetSoundStarted(page);
    await expect(page.locator('.drag-stage')).toBeVisible();

    const dimensions = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      viewport: document.documentElement.clientWidth
    }));
    expect(dimensions.width).toBeLessThanOrEqual(dimensions.viewport + 1);
    await expect(page.getByText(/mastery percentage|weak topic|streak|\bXP\b|coins?/i)).toHaveCount(0);
  });
});
