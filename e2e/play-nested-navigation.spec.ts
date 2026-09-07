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
});
