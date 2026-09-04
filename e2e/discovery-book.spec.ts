import { expect, test } from '@playwright/test';
import { openCleanApp } from './helpers/childJourney';

const l2 = 'mission.forest-creek-rescue';
const l3 = 'mission.forest-busy-grove';

async function seedDiscoveryProgress(page: import('@playwright/test').Page): Promise<void> {
  await page.evaluate(({ l2, l3 }) => {
    const when = '2026-09-04T08:00:00.000Z';
    window.localStorage.setItem('kidsplay.story-progress.v1', JSON.stringify({
      version: 1,
      completedMissions: {
        [l2]: { missionId: l2, completedAt: when, completions: 1, rewardId: 'reward.forest.l2', starsAwarded: 3 },
        [l3]: { missionId: l3, completedAt: '2026-09-04T09:00:00.000Z', completions: 1, rewardId: 'reward.forest.l3', starsAwarded: 3 }
      },
      completedLocations: {},
      completedSessionIds: ['session.forest.l2', 'session.forest.l3'],
      updatedAt: '2026-09-04T09:00:00.000Z'
    }));
    window.localStorage.setItem('kidsplay.audio.v1', JSON.stringify({ version: 1, enabled: false }));
  }, { l2, l3 });
}

test.describe('Dheu Discovery Book', () => {
  test('shows canonical Forest discoveries across all collections without replay currency at 360x640', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await openCleanApp(page);
    await seedDiscoveryProgress(page);
    await page.reload();

    await page.getByRole('button', { name: 'Discovery Book' }).click();
    await expect(page.getByRole('heading', { name: 'Dheu Discovery Book' })).toBeVisible();

    const expected = [
      ['Animals', 'Butterfly life cycle'],
      ['Plants', 'Roots'],
      ['Places', 'Forest'],
      ['Science', 'Food chain'],
      ['Words & Sounds', 'Habitat'],
      ['Adventure Mail', 'Busy Grove field note']
    ] as const;

    for (const [collection, discovery] of expected) {
      await page.getByRole('button', { name: collection }).click();
      await expect(page.getByRole('heading', { name: discovery })).toBeVisible();
    }

    await expect(page.getByText(/coin|ticket|currency|\bXP\b|streak/i)).toHaveCount(0);
    const dimensions = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      viewport: document.documentElement.clientWidth
    }));
    expect(dimensions.width).toBeLessThanOrEqual(dimensions.viewport + 1);

    await page.getByRole('button', { name: 'Plants' }).click();
    await expect(page.getByRole('button', { name: 'Sound is off for Roots' })).toBeDisabled();

    // Hard relaunch rebuilds the collection from canonical story progress. No
    // Discovery Book inventory is persisted or incremented by opening the book.
    await page.reload();
    await page.getByRole('button', { name: 'Discovery Book' }).click();
    await page.getByRole('button', { name: 'Plants' }).click();
    await expect(page.getByRole('heading', { name: 'Roots' })).toHaveCount(1);
    const keys = await page.evaluate(() => Object.keys(window.localStorage));
    expect(keys.some((key) => /discovery.*book|inventory|currency/i.test(key))).toBe(false);
  });
});
