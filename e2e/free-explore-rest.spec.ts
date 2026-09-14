import { expect, test, type Page } from '@playwright/test';
import { openCleanApp } from './helpers/childJourney';

async function seedRecentFreeExploreUse(page: Page): Promise<void> {
  await page.evaluate(() => {
    const sessionIds = [
      'session.free.animals-foundation.1',
      'session.free.english-vocabulary.foundation.1',
      'session.free.trace-playground.1'
    ];
    const attempts = sessionIds.map((sessionId, index) => ({
      sessionId,
      questionId: `seed.question.${index}`,
      submittedAt: new Date(Date.UTC(2026, 8, 14, 4, index)).toISOString(),
      durationMs: 1000,
      correct: true,
      score: 1,
      maxScore: 1,
      knowledgeRefs: [`seed.knowledge.${index}`],
      conceptIds: [`seed.concept.${index}`],
      attemptNumber: 1,
      attemptKind: 'independent',
      assistanceKinds: [],
      countsTowardAccuracy: true,
      masteryWeight: 1
    }));
    window.localStorage.setItem('kidsplay.progress.v1', JSON.stringify({
      version: 1,
      attempts,
      knowledge: {},
      concepts: {},
      updatedAt: '2026-09-14T04:03:00.000Z'
    }));
  });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Forest Explorer Trail' })).toBeVisible();
}

async function expectNoDocumentOverflow(page: Page): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    viewportWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    viewportHeight: document.documentElement.clientHeight,
    scrollHeight: document.documentElement.scrollHeight
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.viewportWidth + 1);
  expect(dimensions.scrollHeight).toBeLessThanOrEqual(dimensions.viewportHeight + 1);
}

test.describe('Free Explore replay and calm rest play', () => {
  test.use({ viewport: { width: 360, height: 640 } });

  test('reaches three real Play again choices in two child actions and keeps calm play non-evaluative', async ({ page }) => {
    await openCleanApp(page);
    await seedRecentFreeExploreUse(page);

    await expect(page.getByRole('button', { name: 'Continue Forest Explorer Trail' })).toBeVisible();
    const quickPlay = page.getByRole('button', { name: 'Open Play', exact: true });
    await expect(quickPlay).toBeVisible();

    // Action 1 from Home: enter the secondary child Play surface directly.
    await quickPlay.click();
    const shelf = page.getByRole('region', { name: 'Play again' });
    await expect(shelf).toBeVisible();
    const replayTiles = shelf.getByRole('button', { name: /^Play again / });
    await expect(replayTiles).toHaveCount(3);
    for (let index = 0; index < 3; index += 1) {
      const box = await replayTiles.nth(index).boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
    await expectNoDocumentOverflow(page);

    // Action 2 from Home: launch the canonical activity, not a copied replay bank.
    await replayTiles.first().click();
    await expect(page.locator('[data-session-state]')).toBeVisible();
    expect(await page.evaluate(() => window.localStorage.getItem('kidsplay.adaptive-interest.v1'))).toBeNull();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { name: 'Forest Explorer Trail' })).toBeVisible();
    await page.getByRole('button', { name: 'Open Play', exact: true }).click();

    const progressBeforeCalmPlay = await page.evaluate(() => window.localStorage.getItem('kidsplay.progress.v1'));
    await page.getByRole('button', { name: 'Open Sky Window' }).click();
    await expect(page.getByRole('heading', { name: 'Sky Window' })).toBeVisible();
    const night = page.getByRole('button', { name: 'Night' });
    await night.click();
    await expect(night).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText('No score. Pick any sky you like.')).toBeVisible();
    await expectNoDocumentOverflow(page);

    await page.getByRole('button', { name: 'Done' }).click();
    await expect(page.getByRole('button', { name: 'Open Sky Window' })).toBeVisible();
    const progressAfterCalmPlay = await page.evaluate(() => window.localStorage.getItem('kidsplay.progress.v1'));
    expect(progressAfterCalmPlay).toBe(progressBeforeCalmPlay);
  });
});
