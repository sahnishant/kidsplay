import { expect, test, type Locator, type Page } from '@playwright/test';
import { openCleanApp } from './helpers/childJourney';

async function openPlay(page: Page): Promise<void> {
  await page.getByLabel('Open child navigation').click();
  await page.getByRole('button', { name: 'Open practice activities' }).click();
  await expectPlay(page);
}

async function expectPlay(page: Page): Promise<void> {
  await expect(page.getByRole('heading', { name: 'Choose a play activity' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open chapter' })).toBeVisible();
}

function playLaunchers(page: Page): Locator {
  return page.locator('.first-play-launch, [aria-label="Play activities"] .primary-action');
}

async function launcherLabels(page: Page): Promise<string[]> {
  return playLaunchers(page).evaluateAll((elements) => elements.map((element, index) =>
    element.getAttribute('aria-label')?.trim()
      || element.textContent?.trim()
      || `Play child ${index + 1}`
  ));
}

async function expectChildOpened(page: Page): Promise<void> {
  await expect(page.getByRole('heading', { name: 'Choose a play activity' })).toBeHidden();
}

async function revealLastWorkshopIdea(page: Page): Promise<void> {
  const nextIdea = page.getByRole('button', { name: 'Next idea', exact: true });
  while (await nextIdea.isVisible().catch(() => false)) await nextIdea.click();
}

test.describe('Play navigation tree', () => {
  test('every child launched from Play returns to Play with Escape', async ({ page }) => {
    test.setTimeout(120_000);
    await openCleanApp(page);
    await openPlay(page);

    const labels = await launcherLabels(page);
    expect(labels.length, 'Play should expose several independent child activities').toBeGreaterThan(5);

    for (let index = 0; index < labels.length; index += 1) {
      await test.step(`${labels[index]} -> Escape -> Play`, async () => {
        const launcher = playLaunchers(page).nth(index);
        await launcher.scrollIntoViewIfNeeded();
        await launcher.click();
        await expectChildOpened(page);
        await page.keyboard.press('Escape');
        await expectPlay(page);
      });
    }

    // The Play node itself must still be on the tree after all child visits.
    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { name: 'Forest Explorer Trail' })).toBeVisible();
  });

  test('browser Back follows the same parent tree for local and session children', async ({ page }) => {
    await openCleanApp(page);
    await openPlay(page);

    await page.getByRole('button', { name: 'Open chapter' }).click();
    await expectChildOpened(page);
    await page.goBack();
    await expectPlay(page);

    await page.getByRole('button', { name: 'Play free' }).click();
    await expectChildOpened(page);
    await page.goBack();
    await expectPlay(page);

    await page.goBack();
    await expect(page.getByRole('heading', { name: 'Forest Explorer Trail' })).toBeVisible();
  });

  test('browser Forward never consumes the still-live parent node', async ({ page }) => {
    await openCleanApp(page);
    await openPlay(page);

    await page.getByRole('button', { name: 'Open chapter' }).click();
    await expect(page.getByRole('heading', { name: 'Bicycle Workshop', exact: true })).toBeVisible();

    await page.goBack();
    await expectPlay(page);

    // Forward revisits the browser entry for an app node that was already
    // closed. It must not pop the live Play parent or reopen stale UI.
    await page.goForward();
    await expectPlay(page);

    // The stale child entry is skipped internally: one Escape still removes
    // exactly the live Play node and returns to Home.
    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { name: 'Forest Explorer Trail' })).toBeVisible();
  });

  test('deep Play descendants unwind exactly one tree node at a time', async ({ page }) => {
    test.setTimeout(120_000);
    await openCleanApp(page);
    await openPlay(page);

    await page.getByRole('button', { name: 'Open chapter' }).click();
    await expect(page.getByRole('heading', { name: 'Bicycle Workshop', exact: true })).toBeVisible();
    const workshopNav = page.getByRole('navigation', { name: 'Bicycle Workshop learning sections' });
    await workshopNav.getByRole('button', { name: '7 Ready', exact: true }).click();
    await revealLastWorkshopIdea(page);
    await expect(page.getByText('7/7', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Practice', exact: true }).click();
    await expect(page.getByText('Bicycle Workshop — Class 2 English', { exact: true })).toBeVisible();

    // Home -> Play -> Bicycle Workshop -> Practice
    // must unwind Practice -> Bicycle Workshop -> Play -> Home.
    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { name: 'Bicycle Workshop', exact: true })).toBeVisible();
    await expect(page.getByText('7/7', { exact: true })).toBeVisible();

    await page.keyboard.press('Escape');
    await expectPlay(page);

    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { name: 'Forest Explorer Trail' })).toBeVisible();
  });
});
