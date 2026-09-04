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
  await page.getByRole('button', { name: 'Add to favourites' }).click();

  const persisted = await page.evaluate((key) => localStorage.getItem(key), STORY_KEY);
  expect(persisted).toContain('moonlit-leaf.3');
  expect(persisted).toContain('"favourite":true');

  // Reload destroys the mounted child surface and all component memory.
  // Reopening Stories must restore the serialized story directly, not ask the
  // child to locate the title and page again.
  await page.reload();
  await page.getByRole('button', { name: 'Open Stories' }).click();
  await expect(page.getByTestId('story-reader')).toHaveAttribute('data-story-id', 'story.dheu.moonlit-leaf');
  await expect(page.getByText('Page 3 of 9')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Remove from favourites' })).toBeVisible();

  await page.getByRole('button', { name: 'Read to me' }).click();
  await expect(page.getByText(/Reading this page|story text is ready to read|Sound is off/)).toBeVisible();
  await page.getByRole('button', { name: 'Repeat page' }).click();

  const afterLearningState = await page.evaluate(([storyKey, audioKey]) =>
    Object.fromEntries(Object.entries(localStorage).filter(([key]) => key !== storyKey && key !== audioKey)), [STORY_KEY, AUDIO_KEY]);
  expect(afterLearningState).toEqual(beforeLearningState);
});
