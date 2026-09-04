import { expect, test, type Page } from '@playwright/test';

const STORY_KEY = 'kidsplay.stories.reading.v1';
const AUDIO_KEY = 'kidsplay.audio.v1';

async function openStories(page: Page): Promise<void> {
  await page.getByLabel('Open child navigation').click();
  await page.getByRole('button', { name: 'Open Stories' }).click();
}

test.use({ viewport: { width: 360, height: 640 } });

test('Stories resumes the exact child-facing page after a process-style reload without learning writes', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  const beforeLearningState = await page.evaluate(([storyKey, audioKey]) =>
    Object.fromEntries(Object.entries(localStorage).filter(([key]) => key !== storyKey && key !== audioKey)), [STORY_KEY, AUDIO_KEY]);

  await openStories(page);
  const surface = page.getByTestId('stories-surface');
  await expect(surface).toBeVisible();

  const compactProof = await surface.evaluate((root) => {
    const buttons = [...root.querySelectorAll('button')].filter((button) => {
      const rect = button.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    const rootRect = root.getBoundingClientRect();
    return {
      fitsViewport: rootRect.left >= 0 && rootRect.right <= innerWidth + 1 && rootRect.top >= 0 && rootRect.bottom <= innerHeight + 1,
      minButtonHeight: Math.min(...buttons.map((button) => button.getBoundingClientRect().height)),
      documentFitsWidth: document.documentElement.scrollWidth <= innerWidth
    };
  });
  expect(compactProof.fitsViewport).toBe(true);
  expect(compactProof.documentFitsWidth).toBe(true);
  expect(compactProof.minButtonHeight).toBeGreaterThanOrEqual(44);

  const firstStoryCard = page.getByRole('button', { name: 'Open The Moonlit Leaf' });
  await expect(firstStoryCard).toBeVisible();
  const motion = await firstStoryCard.evaluate((element) => {
    const style = getComputedStyle(element);
    return { animationName: style.animationName, transitionDuration: style.transitionDuration };
  });
  expect(motion.animationName).toBe('none');
  expect(motion.transitionDuration).toBe('0s');

  await firstStoryCard.click();
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
  await openStories(page);
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
