import { expect, test, type Locator, type Page } from '@playwright/test';

async function openClean(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
}

async function expectNoDocumentOverflow(page: Page): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth,
    height: document.documentElement.scrollHeight,
    viewportHeight: document.documentElement.clientHeight
  }));
  expect(dimensions.width).toBeLessThanOrEqual(dimensions.viewportWidth + 1);
  expect(dimensions.height).toBeLessThanOrEqual(dimensions.viewportHeight + 1);
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth
  }));
  expect(dimensions.width).toBeLessThanOrEqual(dimensions.viewport + 1);
}

async function expectTouchTarget(locator: Locator): Promise<void> {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeGreaterThanOrEqual(44);
  expect(box!.height).toBeGreaterThanOrEqual(44);
}

test.describe('NAV100 consolidated navigation prototype', () => {
  test('stays opt-in and exposes one dominant adventure plus bounded visual alternatives at phone size', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await page.emulateMedia({ reducedMotion: 'reduce' });

    await openClean(page, '/');
    await expect(page.getByRole('heading', { name: 'Forest Explorer Trail' })).toBeVisible();
    await expect(page.locator('[data-nav100-prototype="true"]')).toHaveCount(0);

    await page.goto('/?nav100=1');
    await expect(page.locator('[data-nav100-prototype="true"]')).toBeVisible();

    const primary = page.locator('[data-nav100-primary="true"]');
    await expect(primary).toHaveCount(1);
    await expect(primary).toHaveAttribute('data-canonical-id', 'experience.bicycle-workshop.guided.v1');
    await expect(primary).toContainText('Bicycle Workshop');
    await expect(primary.locator('[data-nav100-marker="true"]')).toHaveCount(1);
    await expectTouchTarget(primary);

    const alternatives = page.locator('[data-nav100-choice="true"]');
    await expect(alternatives).toHaveCount(3);
    await expect(page.locator('[data-nav100-choice="true"][data-canonical-id="learn.earth"]')).toBeVisible();
    await expect(page.locator('[data-nav100-choice="true"][data-canonical-id="story.dheu.moonlit-leaf"]')).toBeVisible();
    await expect(page.locator('[data-nav100-choice="true"][data-canonical-id="phonics.sound-trail.v1"]')).toBeVisible();
    for (let index = 0; index < 3; index += 1) {
      const choice = alternatives.nth(index);
      await expect(choice.locator('[data-nav100-marker="true"]')).toHaveCount(1);
      await expectTouchTarget(choice);
    }

    // Categories remain discovery metadata; they are not five equal child modes on Home.
    await expect(page.locator('[data-nav100-lane]')).toHaveCount(0);
    const browseAll = page.getByRole('button', { name: /Browse all/ });
    await expect(browseAll).toBeVisible();
    await expectTouchTarget(browseAll);
    await expectNoDocumentOverflow(page);
    await page.screenshot({ path: testInfo.outputPath('nav100-home-360x640.png'), fullPage: true });

    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Forest Explorer Trail' })).toBeVisible();
    await expect(page.locator('[data-nav100-prototype="true"]')).toHaveCount(0);
  });

  test('browse adds visual cues and preserves Bicycle search and focus when browser Back returns from launch', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openClean(page, '/?nav100=1');

    const browseAll = page.getByRole('button', { name: /Browse all/ });
    await browseAll.click();
    await expect(page.locator('[data-nav100-browse="true"]')).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('nav100-browse-390x844.png'), fullPage: true });
    const search = page.getByRole('searchbox');
    await search.fill('Bicycle');
    const bicycle = page.locator('[data-canonical-id="experience.bicycle-workshop.guided.v1"]');
    await expect(bicycle).toBeVisible();
    await expect(bicycle.locator('[data-nav100-marker="true"]')).toHaveCount(1);
    await expectTouchTarget(bicycle);
    await bicycle.click();
    await expect(page.getByRole('heading', { name: 'Bicycle Workshop' })).toBeVisible();

    await page.goBack();
    await expect(page.locator('[data-nav100-browse="true"]')).toBeVisible();
    await expect(search).toHaveValue('Bicycle');
    await expect(bicycle).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-nav100-prototype="true"]')).toBeVisible();
    await expect(browseAll).toBeFocused();
  });

  test('opens Earth and Moonlit story directly without turning navigation into mastery evidence', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await openClean(page, '/?nav100=1');
    const progressBefore = await page.evaluate(() => window.localStorage.getItem('kidsplay.progress.v1'));

    await page.locator('[data-nav100-choice="true"][data-canonical-id="learn.earth"]').click();
    await expect(page.locator('[data-learn-about-view="topic"]')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Earth', exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-nav100-prototype="true"]')).toBeVisible();

    await page.locator('[data-nav100-choice="true"][data-canonical-id="story.dheu.moonlit-leaf"]').click();
    await expect(page.locator('[data-testid="story-reader"][data-story-id="story.dheu.moonlit-leaf"]')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'The Moonlit Leaf' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-nav100-prototype="true"]')).toBeVisible();

    const progressAfter = await page.evaluate(() => window.localStorage.getItem('kidsplay.progress.v1'));
    expect(progressAfter).toBe(progressBefore);
  });

  test('keeps Lab discoverable without making it a permanent Home mode and reuses Sound Trail', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openClean(page, '/?nav100=1');

    await expect(page.getByText('Scientu’s Lab', { exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: /Browse all/ }).click();
    const search = page.getByRole('searchbox');
    await search.fill('equal shares');
    const equalShares = page.locator('[data-canonical-id="studio.fractions.equal-shares"]');
    await expect(equalShares).toBeVisible();
    await expect(equalShares.locator('[data-nav100-marker="true"]')).toHaveCount(1);
    await equalShares.click();
    await expect(page.getByRole('heading', { name: 'Make equal shares' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-nav100-browse="true"]')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-nav100-prototype="true"]')).toBeVisible();

    await page.locator('[data-nav100-choice="true"][data-canonical-id="phonics.sound-trail.v1"]').click();
    await expect(page.getByText('Scientu’s Sound Trail', { exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-nav100-prototype="true"]')).toBeVisible();
  });

  test('finds and launches the audited creek world action from Browse', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openClean(page, '/?nav100=1');

    await page.getByRole('button', { name: /Browse all/ }).click();
    const search = page.getByRole('searchbox');
    await search.fill('Creek');
    const creek = page.locator('[data-canonical-id="forest.world-depth.l2.creek-rescue"]');
    await expect(creek).toBeVisible();
    await expect(creek).toContainText('Preview');
    await expect(creek.locator('[data-nav100-marker="true"]')).toHaveCount(1);
    await creek.click();
    await expect(page.getByText(/Quiet Creek Rescue|creek/i).first()).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-nav100-browse="true"]')).toBeVisible();
    await expect(search).toHaveValue('Creek');
    await expect(creek).toBeFocused();
  });

  test('keeps the dominant action keyboard-first in phone landscape and desktop layouts', async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 360 });
    await openClean(page, '/?nav100=1');
    const primary = page.locator('[data-nav100-primary="true"]');
    await expect(primary).toBeVisible();
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.keyboard.press('Tab');
    await expect(primary).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { name: 'Bicycle Workshop' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-nav100-prototype="true"]')).toBeVisible();
    await expect(primary).toBeFocused();
    await expectNoDocumentOverflow(page);

    await page.setViewportSize({ width: 1024, height: 768 });
    await expect(page.locator('[data-nav100-prototype="true"]')).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
