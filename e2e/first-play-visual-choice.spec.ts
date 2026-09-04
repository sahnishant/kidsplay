import { expect, test, type Page } from '@playwright/test';

test.use({ viewport: { width: 360, height: 640 } });

async function resetAndOpenPlay(page: Page): Promise<void> {
  await page.goto('/');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await page.getByRole('button', { name: 'Open practice activities' }).click();
}

async function next(page: Page): Promise<void> {
  await page.getByRole('button', { name: /Next activity|Replay sampler/ }).click();
}

async function assertLarge(locator: ReturnType<Page['locator']>, minWidth = 88, minHeight = 88): Promise<void> {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  expect(box?.width ?? 0).toBeGreaterThan(minWidth);
  expect(box?.height ?? 0).toBeGreaterThan(minHeight);
}

test('First Play is a 360x640 zero-reading touch/listen/place journey with gentle recovery', async ({ page }) => {
  await resetAndOpenPlay(page);
  await page.getByRole('button', { name: 'Start First Play sampler' }).click();

  const surface = page.locator('[data-first-play-mode="first_play"]');
  await expect(surface).toBeVisible();
  await expect(page.getByRole('button', { name: 'Repeat' })).toBeVisible();
  await assertLarge(page.getByRole('button', { name: 'Repeat' }), 60, 50);
  await page.getByRole('button', { name: 'Repeat' }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  // Touch & Discover #1: one huge semantic object, no answer/check layer.
  await expect(surface).toHaveAttribute('data-activity-id', 'first-play.touch.dog');
  const dogDiscover = page.getByRole('button', { name: 'Dog' });
  await assertLarge(dogDiscover, 200, 250);
  await dogDiscover.click();
  await expect(surface).toHaveAttribute('data-feedback', 'discovery');
  await next(page);

  // Touch & Discover #2.
  await expect(surface).toHaveAttribute('data-activity-id', 'first-play.touch.bell');
  await assertLarge(page.getByRole('button', { name: 'Bell' }), 200, 250);
  await page.getByRole('button', { name: 'Bell' }).click();
  await next(page);

  // Listen & Find #1: turn sound off to prove a visual clue preserves task meaning.
  await expect(surface).toHaveAttribute('data-activity-id', 'first-play.listen.dog');
  await page.getByRole('button', { name: 'Turn sound off' }).click();
  await expect(page.locator('.silent-clue')).toBeVisible();
  await expect(page.locator('.choice-button__label--hidden')).toHaveCount(2);
  const listenChoices = page.locator('.choice-button--visual-dominant');
  await expect(listenChoices).toHaveCount(2);
  await assertLarge(listenChoices.first(), 130, 250);

  // Deliberate safe wrong answer: no modal, no failure page; the same two choices return in place.
  await page.getByRole('button', { name: 'Cow' }).click();
  await expect(surface).toHaveAttribute('data-feedback', 'retry_in_place');
  await expect(page.locator('[role="dialog"]')).toHaveCount(0);
  await expect(page.getByText('Hmm... Look again.')).toBeVisible();
  await page.waitForTimeout(760);
  await expect(surface).not.toHaveAttribute('data-feedback', 'retry_in_place');
  await expect(page.getByRole('button', { name: 'Dog' })).toBeEnabled();
  await page.getByRole('button', { name: 'Dog' }).click();
  await expect(surface).toHaveAttribute('data-feedback', 'celebrate');
  await next(page);

  // Listen & Find #2, with the same reviewed Earth concept reused elsewhere in the product.
  await expect(surface).toHaveAttribute('data-activity-id', 'first-play.listen.earth');
  await page.getByRole('button', { name: 'Earth' }).click();
  await next(page);

  // Forgiving placement #1: release just above the correct target; the 40px snap tolerance accepts it.
  await expect(surface).toHaveAttribute('data-activity-id', 'first-play.place.dog');
  const movingDog = page.getByRole('button', { name: 'Dog' });
  const dogTarget = page.getByRole('button', { name: 'Dog match' });
  await assertLarge(movingDog, 180, 110);
  await assertLarge(dogTarget, 130, 130);
  const itemBox = await movingDog.boundingBox();
  const targetBox = await dogTarget.boundingBox();
  if (!itemBox || !targetBox) throw new Error('First Play drag geometry unavailable');
  await page.mouse.move(itemBox.x + itemBox.width / 2, itemBox.y + itemBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y - 18, { steps: 8 });
  await page.mouse.up();
  await expect(surface).toHaveAttribute('data-feedback', 'celebrate');
  await next(page);

  // Forgiving placement #2 also supports simple select-then-place for motor accessibility.
  await expect(surface).toHaveAttribute('data-activity-id', 'first-play.place.apple');
  await page.getByRole('button', { name: 'Apple' }).click();
  await page.getByRole('button', { name: 'Apple match' }).click();
  await expect(surface).toHaveAttribute('data-feedback', 'celebrate');
  await next(page);

  // Concrete full/empty concept is learned by seeing the two states.
  await expect(surface).toHaveAttribute('data-activity-id', 'first-play.contrast.full-empty');
  await expect(page.locator('[data-first-play-state-choice="true"] [data-container-state="full"]')).toHaveCount(1);
  await expect(page.locator('[data-first-play-state-choice="true"] [data-container-state="empty"]')).toHaveCount(1);
  await assertLarge(page.getByRole('button', { name: 'Full bucket' }), 130, 250);
  await page.getByRole('button', { name: 'Full bucket' }).click();
  await next(page);

  // Cause/effect visibly changes the semantic state without a quiz answer.
  await expect(surface).toHaveAttribute('data-activity-id', 'first-play.cause-effect.fill-bucket');
  const emptyBucket = page.getByRole('button', { name: 'Empty bucket' });
  await assertLarge(emptyBucket, 200, 250);
  await emptyBucket.click();
  await expect(page.locator('.cause-effect-target [data-container-state="full"]')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Replay sampler' })).toBeVisible();

  // The entire First Play sampler is exploration/guided practice: it must not write mastery/progress evidence.
  const progress = await page.evaluate(() => {
    const raw = window.localStorage.getItem('kidsplay.progress.v1');
    return raw ? JSON.parse(raw) : null;
  });
  expect(progress).toBeNull();
  await expect(page.getByText('Check answer')).toHaveCount(0);
});

test('Picture Play proves both 3-4 choice scene mode and explicit odd-one-out reasoning', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await resetAndOpenPlay(page);
  await page.getByRole('button', { name: 'Start picture play puzzles' }).click();

  const surface = page.locator('[data-first-play-mode="visual_reasoning"]');
  await expect(surface).toBeVisible();

  // Three-choice visual scene mode.
  await expect(surface).toHaveAttribute('data-activity-id', 'visual-choice.animals.dog');
  await expect(page.locator('.choice-grid--visual-dominant[data-choice-count="3"]')).toBeVisible();
  await assertLarge(page.locator('.choice-button--visual-dominant').first(), 95, 130);

  // Wrong -> honest retry/scaffold while staying on the same activity.
  await page.getByRole('button', { name: 'Cow' }).click();
  await expect(surface).toHaveAttribute('data-feedback', 'retry_in_place');
  await expect(page.locator('[role="dialog"]')).toHaveCount(0);
  await page.waitForTimeout(760);
  await page.getByRole('button', { name: 'Dog' }).click();
  await next(page);

  // Four-choice visual mode.
  await expect(surface).toHaveAttribute('data-activity-id', 'visual-choice.transport.bus');
  await expect(page.locator('.choice-grid--visual-dominant[data-choice-count="4"]')).toBeVisible();
  await page.getByRole('button', { name: 'Bus' }).click();
  await next(page);
  await page.getByRole('button', { name: 'Eyes' }).click();
  await next(page);
  await page.getByRole('button', { name: 'Telephone' }).click();
  await next(page);
  await page.getByRole('button', { name: 'Lotus' }).click();
  await next(page);
  await page.getByRole('button', { name: 'Honeybee' }).click();
  await next(page);

  // The first odd-one-out set is 3 reviewed transport examples + 1 reviewed communication example.
  await expect(surface).toHaveAttribute('data-activity-id', 'odd-one-out.transport');
  await expect(page.getByText("Which one doesn't belong?")).toBeVisible();
  await expect(page.locator('.choice-grid--visual-dominant[data-choice-count="4"]')).toBeVisible();
  await page.getByRole('button', { name: 'Telephone' }).click();
  await expect(surface).toHaveAttribute('data-feedback', 'celebrate');

  // Reduced motion does not remove semantic visuals or accessible option names.
  await expect(page.getByRole('button', { name: 'Next activity' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
