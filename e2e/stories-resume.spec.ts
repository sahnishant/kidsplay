import { expect, test } from '@playwright/test';

const STORY_KEY = 'kidsplay.stories.reading.v1';
const AUDIO_KEY = 'kidsplay.audio.v1';

test.use({ viewport: { width: 360, height: 640 } });

test('Stories resumes the exact child-facing page after a process-style reload without learning writes', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  const beforeLearningState = await page.evaluate(([storyKey, audioKey]) =>
    Object.fromEntries(Object.entries(localStorage).filter(([key]) => key !== storyKey && key !== audioKey)), [STORY_KEY, AUDIO_KEY]);

  await page.getByRole('button', { name: 'Open Stories' }).click();
  await expect(page.getByTestId('stories-surface')).toBeVisible();
  await page.locator('[data-story-id="story.dheu.moonlit-leaf"]').click();
  await expect(page.getByText('Page 1 of 9')).toBeVisible();

  await page.getByRole('button', { name: 'Next →' }).click();
  await page.getByRole('button', { name: 'Next →' }).click();
  await expect(page.getByText('Page 3 of 9')).toBeVisible();

  const persisted = await page.evaluate((key) => localStorage.getItem(key), STORY_KEY);
  expect(persisted).toContain('moonlit-leaf.3');

  // Browser reload stands in for the process-kill/relaunch boundary: component memory is gone.
  await page.reload();
  await page.getByRole('button', { name: 'Open Stories' }).click();
  await expect(page.locator('[data-story-id="story.dheu.moonlit-leaf"]')).toContainText('Continue');
  await page.locator('[data-story-id="story.dheu.moonlit-leaf"]').click();
  await expect(page.getByText('Page 3 of 9')).toBeVisible();

  await page.getByRole('button', { name: 'Add to favourites' }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Open Stories' }).click();
  await page.locator('[data-story-id="story.dheu.moonlit-leaf"]').click();
  await expect(page.getByRole('button', { name: 'Remove from favourites' })).toBeVisible();
  await expect(page.getByText('Page 3 of 9')).toBeVisible();

  const afterLearningState = await page.evaluate(([storyKey, audioKey]) =>
    Object.fromEntries(Object.entries(localStorage).filter(([key]) => key !== storyKey && key !== audioKey)), [STORY_KEY, AUDIO_KEY]);
  expect(afterLearningState).toEqual(beforeLearningState);
});
