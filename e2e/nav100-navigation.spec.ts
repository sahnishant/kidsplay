import { expect, test, type Page } from '@playwright/test';

async function openClean(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth
  }));
  expect(dimensions.width).toBeLessThanOrEqual(dimensions.viewport + 1);
}

test.describe('NAV100 consolidated navigation prototype', () => {
  test('stays opt-in and exposes five simple child lanes at phone size', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await page.emulateMedia({ reducedMotion: 'reduce' });

    await openClean(page, '/');
    await expect(page.getByRole('heading', { name: 'Forest Explorer Trail' })).toBeVisible();
    await expect(page.locator('[data-nav100-prototype="true"]')).toHaveCount(0);

    await page.goto('/?nav100=1');
    await expect(page.locator('[data-nav100-prototype="true"]')).toBeVisible();
    await expect(page.locator('[data-nav100-lane="games"]')).toContainText('Big games');
    await expect(page.locator('[data-nav100-lane="discover"]')).toContainText('Discover');
    await expect(page.locator('[data-nav100-lane="lab"]')).toContainText('Scientu’s Lab');
    await expect(page.locator('[data-nav100-lane="words"]')).toContainText('Words & sounds');
    await expect(page.locator('[data-nav100-lane="stories"]')).toContainText('Stories');
    await expect(page.getByRole('button', { name: /Browse all/ })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await page.screenshot({ path: testInfo.outputPath('nav100-home-360x640.png'), fullPage: true });

    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Forest Explorer Trail' })).toBeVisible();
    await expect(page.locator('[data-nav100-prototype="true"]')).toHaveCount(0);
  });

  test('browse finds Bicycle and browser Back returns launch to browse', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openClean(page, '/?nav100=1');

    await page.getByRole('button', { name: /Browse all/ }).click();
    await expect(page.locator('[data-nav100-browse="true"]')).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('nav100-browse-390x844.png'), fullPage: true });
    await page.getByRole('searchbox').fill('Bicycle');
    const bicycle = page.locator('[data-canonical-id="experience.bicycle-workshop.guided.v1"]');
    await expect(bicycle).toBeVisible();
    await bicycle.click();
    await expect(page.getByRole('heading', { name: 'Bicycle Workshop' })).toBeVisible();

    await page.goBack();
    await expect(page.locator('[data-nav100-browse="true"]')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-nav100-prototype="true"]')).toBeVisible();
  });

  test('opens the audited Earth topic and Moonlit story directly', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await openClean(page, '/?nav100=1');

    await page.locator('[data-nav100-lane="discover"]').click();
    await expect(page.locator('[data-learn-about-view="topic"]')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Earth', exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-nav100-prototype="true"]')).toBeVisible();

    await page.locator('[data-nav100-lane="stories"]').click();
    await expect(page.locator('[data-testid="story-reader"][data-story-id="story.dheu.moonlit-leaf"]')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'The Moonlit Leaf' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-nav100-prototype="true"]')).toBeVisible();
  });

  test('keeps Lab and Sound Trail as their existing runtimes', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openClean(page, '/?nav100=1');

    await page.locator('[data-nav100-lane="lab"]').click();
    await expect(page.getByRole('heading', { name: 'Make equal shares' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Make equal shares/ })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-nav100-prototype="true"]')).toBeVisible();

    await page.locator('[data-nav100-lane="words"]').click();
    await expect(page.getByText('Scientu’s Sound Trail', { exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-nav100-prototype="true"]')).toBeVisible();
  });

  test('finds and launches the audited creek world action from Browse', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openClean(page, '/?nav100=1');

    await page.getByRole('button', { name: /Browse all/ }).click();
    await page.getByRole('searchbox').fill('Creek');
    const creek = page.locator('[data-canonical-id="forest.world-depth.l2.creek-rescue"]');
    await expect(creek).toBeVisible();
    await creek.click();
    await expect(page.getByText(/Quiet Creek Rescue|creek/i).first()).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-nav100-browse="true"]')).toBeVisible();
  });
});
