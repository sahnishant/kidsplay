import { expect, test, type Locator, type Page } from '@playwright/test';
import { answerCurrentQuestion, openCleanApp } from './helpers/childJourney';

async function openLearnAbout(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Open practice activities' }).click();
  await page.getByRole('button', { name: 'Open Learn About' }).click();
  await expect(page.getByRole('heading', { name: 'Choose something to explore' })).toBeVisible();
}

async function expectTapTarget(locator: Locator): Promise<void> {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeGreaterThanOrEqual(44);
  expect(box!.height).toBeGreaterThanOrEqual(44);
}

async function expectViewportContained(page: Page): Promise<void> {
  const size = await page.evaluate(() => ({
    viewportWidth: document.documentElement.clientWidth,
    documentWidth: document.documentElement.scrollWidth,
    viewportHeight: document.documentElement.clientHeight,
    documentHeight: document.documentElement.scrollHeight
  }));
  expect(size.documentWidth).toBeLessThanOrEqual(size.viewportWidth + 1);
  expect(size.documentHeight).toBeLessThanOrEqual(size.viewportHeight + 1);
}

async function storageSnapshot(page: Page): Promise<Record<string, string>> {
  return page.evaluate(() => Object.fromEntries(
    Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index))
      .filter((key): key is string => Boolean(key))
      .sort()
      .map((key) => [key, localStorage.getItem(key) ?? ''])
  ));
}

test.describe('Learn About V1 production journey', () => {
  test.use({ viewport: { width: 360, height: 640 } });

  test('Earth discovery stays non-mastering until shared Guess enters the existing Session', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openCleanApp(page);
    const beforeDiscovery = await storageSnapshot(page);

    await openLearnAbout(page);
    const earth = page.getByRole('button', { name: 'Learn about Earth' });
    await expectTapTarget(earth);
    await earth.click();

    await expect(page.getByRole('heading', { name: 'Earth', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Meet Earth' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Land & water' })).toBeVisible();
    await expectTapTarget(page.getByRole('button', { name: 'Back to Learn About topics' }));
    await expectViewportContained(page);

    await page.getByRole('button', { name: 'Explore Earth' }).first().click();
    await expect(page.getByText(/Earth is a planet/i)).toBeVisible();
    expect(await storageSnapshot(page)).toEqual(beforeDiscovery);

    await page.getByRole('button', { name: /D2\s*Connect/ }).click();
    await expect(page.getByText('DID YOU KNOW?').first()).toBeVisible();
    await expect(page.getByText('COMPARE').first()).toBeVisible();
    await expect(page.getByText('TRY IT').first()).toBeVisible();
    await expect(page.getByText('GUESS').first()).toBeVisible();
    expect(await storageSnapshot(page)).toEqual(beforeDiscovery);

    const answerButton = page.getByRole('button', { name: 'Choose an answer' }).first();
    await expectTapTarget(answerButton);
    await answerButton.click();
    await expect(page.getByText(/1 \/ 1/)).toBeVisible();
    await answerCurrentQuestion(page);
    expect(await storageSnapshot(page)).not.toEqual(beforeDiscovery);

    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { name: 'Earth', exact: true })).toBeVisible();

    await page.getByRole('button', { name: /D3\+\s*Go deeper/ }).click();
    await expect(page.getByText('PRACTICE')).toBeVisible();
    const practiceButton = page.getByRole('button', { name: 'Try this question' });
    await expectTapTarget(practiceButton);
    await practiceButton.click();
    await expect(page.getByText(/1 \/ 1/)).toBeVisible();
    await expect(page.getByText(/The Sun is a star/i)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { name: 'Earth', exact: true })).toBeVisible();
  });

  test('the same surface runs Lion and fails closed for unsupported Fire Station facts', async ({ page }) => {
    await openCleanApp(page);
    await openLearnAbout(page);

    await page.getByRole('button', { name: 'Learn about Lion' }).click();
    await page.getByRole('button', { name: /D2\s*Connect/ }).click();
    await expect(page.getByRole('heading', { name: 'Where lions rest' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Animal homes & families' })).toBeVisible();
    await expect(page.getByText('COMPARE').first()).toBeVisible();
    await expect(page.getByText('GUESS')).toHaveCount(2);
    await expectViewportContained(page);

    await page.getByRole('button', { name: 'Back to Learn About topics' }).click();
    await page.getByRole('button', { name: 'Learn about Fire Station' }).click();
    await page.getByRole('button', { name: /D2\s*Connect/ }).click();
    await expect(page.getByRole('heading', { name: 'The fire station' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Firefighter' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Fire engine' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Hose' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Helmet & equipment' })).toBeVisible();
    await expect(page.getByText('DID YOU KNOW?')).toHaveCount(0);
    await expect(page.getByText('GUESS')).toHaveCount(0);
    await expect(page.getByText('COMPARE')).toHaveCount(0);
    await expect(page.getByText('TRY IT')).toHaveCount(0);
    await expectViewportContained(page);
  });

  test('does not depend on remote assets or audio to expose meaning', async ({ page }) => {
    const remoteRequests: string[] = [];
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (url.hostname !== '127.0.0.1' && url.hostname !== 'localhost') remoteRequests.push(request.url());
    });

    await openCleanApp(page);
    await openLearnAbout(page);
    await page.getByRole('button', { name: 'Learn about Earth' }).click();
    await page.getByRole('button', { name: /D2\s*Connect/ }).click();
    await expect(page.getByText(/Earth/).first()).toBeVisible();
    await expect(page.getByText('DID YOU KNOW?').first()).toBeVisible();
    expect(remoteRequests).toEqual([]);
  });
});
