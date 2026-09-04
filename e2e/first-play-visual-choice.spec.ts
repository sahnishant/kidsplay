import { expect, test, type Locator, type Page } from '@playwright/test';

test.use({ viewport: { width: 360, height: 640 } });

async function resetAndOpenPlay(page: Page): Promise<void> {
  await page.goto('/');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await page.getByLabel('Open child navigation').click();
  await page.getByRole('button', { name: 'Open practice activities' }).click();
}

async function next(page: Page): Promise<void> {
  await page.getByRole('button', { name: /Next activity|Play sampler again/ }).click();
}

async function assertLarge(locator: Locator, minWidth = 88, minHeight = 88): Promise<void> {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  expect(box?.width ?? 0).toBeGreaterThan(minWidth);
  expect(box?.height ?? 0).toBeGreaterThan(minHeight);
}

test('First Play is a 360x640 zero-reading touch/listen/place/letter journey with gentle recovery', async ({ page }) => {
  await resetAndOpenPlay(page);
  await page.getByRole('button', { name: 'Start First Play sampler' }).click();

  const surface = page.locator('[data-first-play-mode="first_play"]');
  await expect(surface).toBeVisible();
  await expect(page.getByRole('button', { name: 'Repeat' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Turn sound off' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await expect(surface).toHaveAttribute('data-activity-id', 'first-play.touch.dog');
  const dogDiscover = page.getByRole('button', { name: 'Dog', exact: true });
  await assertLarge(dogDiscover, 200, 250);
  await dogDiscover.click();
  await expect(surface).toHaveAttribute('data-feedback', 'discovery');
  await next(page);

  await expect(surface).toHaveAttribute('data-activity-id', 'first-play.touch.bell');
  await assertLarge(page.getByRole('button', { name: 'Bell', exact: true }), 200, 250);
  await page.getByRole('button', { name: 'Bell', exact: true }).click();
  await next(page);

  await expect(surface).toHaveAttribute('data-activity-id', 'first-play.listen.dog');
  await page.getByRole('button', { name: 'Turn sound off' }).click();
  await expect(page.locator('.silent-clue')).toBeVisible();
  await expect(page.locator('.choice-button__label--hidden')).toHaveCount(2);
  const listenChoices = page.locator('.choice-button--visual-dominant');
  await expect(listenChoices).toHaveCount(2);
  await assertLarge(listenChoices.first(), 130, 250);

  await page.getByRole('button', { name: 'Cow', exact: true }).click();
  await expect(surface).toHaveAttribute('data-feedback', 'retry_in_place');
  await expect(page.locator('[role="dialog"]')).toHaveCount(0);
  await expect(page.getByText('Hmm... Look again.')).toBeVisible();
  await page.waitForTimeout(760);
  await expect(surface).not.toHaveAttribute('data-feedback', 'retry_in_place');
  await expect(page.getByRole('button', { name: 'Dog', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Dog', exact: true }).click();
  await expect(surface).toHaveAttribute('data-feedback', 'celebrate');
  await next(page);

  await expect(surface).toHaveAttribute('data-activity-id', 'first-play.listen.earth');
  await page.getByRole('button', { name: 'Earth', exact: true }).click();
  await next(page);

  await expect(surface).toHaveAttribute('data-activity-id', 'first-play.place.dog');
  const movingDog = page.getByRole('button', { name: 'Dog', exact: true });
  const dogTarget = page.getByRole('button', { name: 'Dog match', exact: true });
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

  await expect(surface).toHaveAttribute('data-activity-id', 'first-play.place.apple');
  await page.getByRole('button', { name: 'Apple', exact: true }).click();
  await page.getByRole('button', { name: 'Apple match', exact: true }).click();
  await expect(surface).toHaveAttribute('data-feedback', 'celebrate');
  await next(page);

  await expect(surface).toHaveAttribute('data-activity-id', 'first-play.contrast.full-empty');
  await expect(page.locator('[data-first-play-state-choice="true"] [data-container-state="full"]')).toHaveCount(1);
  await expect(page.locator('[data-first-play-state-choice="true"] [data-container-state="empty"]')).toHaveCount(1);
  await assertLarge(page.getByRole('button', { name: 'Full bucket', exact: true }), 130, 250);
  await page.getByRole('button', { name: 'Full bucket', exact: true }).click();
  await next(page);

  // Required FP5 bridge: the grapheme itself is the large learning object; choices remain picture-first.
  await expect(surface).toHaveAttribute('data-activity-id', 'first-play.letter-picture.a-apple');
  await expect(page.locator('[data-first-play-grapheme="A"]')).toBeVisible();
  const graphemeBox = await page.locator('[data-first-play-grapheme="A"]').boundingBox();
  expect(graphemeBox?.height ?? 0).toBeGreaterThan(50);
  await expect(page.locator('.choice-button__label--hidden')).toHaveCount(2);
  await expect(page.locator('.choice-grid--visual-dominant[data-choice-count="2"]')).toBeVisible();
  await page.getByRole('button', { name: 'Orange', exact: true }).click();
  await expect(surface).toHaveAttribute('data-feedback', 'retry_in_place');
  await expect(page.locator('[role="dialog"]')).toHaveCount(0);
  await page.waitForTimeout(760);
  await page.getByRole('button', { name: 'Apple', exact: true }).click();
  await expect(surface).toHaveAttribute('data-feedback', 'celebrate');
  await next(page);

  await expect(surface).toHaveAttribute('data-activity-id', 'first-play.cause-effect.fill-bucket');
  const emptyBucket = page.getByRole('button', { name: 'Empty bucket', exact: true });
  await assertLarge(emptyBucket, 200, 250);
  await emptyBucket.click();
  await expect(page.locator('.cause-effect-target [data-container-state="full"]')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Play sampler again' })).toBeVisible();

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

  await expect(surface).toHaveAttribute('data-activity-id', 'visual-choice.animals.dog');
  await expect(page.locator('.choice-grid--visual-dominant[data-choice-count="3"]')).toBeVisible();
  await assertLarge(page.locator('.choice-button--visual-dominant').first(), 95, 130);

  await page.getByRole('button', { name: 'Cow', exact: true }).click();
  await expect(surface).toHaveAttribute('data-feedback', 'retry_in_place');
  await expect(page.locator('[role="dialog"]')).toHaveCount(0);
  await page.waitForTimeout(760);
  await page.getByRole('button', { name: 'Dog', exact: true }).click();
  await next(page);

  await expect(surface).toHaveAttribute('data-activity-id', 'visual-choice.transport.bus');
  await expect(page.locator('.choice-grid--visual-dominant[data-choice-count="4"]')).toBeVisible();
  await page.getByRole('button', { name: 'Bus', exact: true }).click();
  await next(page);
  await page.getByRole('button', { name: 'Eyes', exact: true }).click();
  await next(page);
  await page.getByRole('button', { name: 'Telephone', exact: true }).click();
  await next(page);
  await page.getByRole('button', { name: 'Lotus', exact: true }).click();
  await next(page);
  await page.getByRole('button', { name: 'Honeybee', exact: true }).click();
  await next(page);

  await expect(surface).toHaveAttribute('data-activity-id', 'odd-one-out.transport');
  await expect(page.getByText("Which one doesn't belong?")).toBeVisible();
  await expect(page.locator('.choice-grid--visual-dominant[data-choice-count="4"]')).toBeVisible();
  await page.getByRole('button', { name: 'Telephone', exact: true }).click();
  await expect(surface).toHaveAttribute('data-feedback', 'celebrate');

  await expect(page.getByRole('button', { name: 'Next activity' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
