import { expect, type Locator, type Page } from '@playwright/test';

type ForestSeedMission = 'mission.forest-explorer-trail' | 'mission.forest-creek-rescue' | 'mission.forest-busy-grove';

const rewards: Record<ForestSeedMission, string> = {
  'mission.forest-explorer-trail': 'badge.forest-trail-keeper',
  'mission.forest-creek-rescue': 'badge.forest-creek-restorer',
  'mission.forest-busy-grove': 'badge.forest-habitat-helper'
};

export async function openForestDepth(page: Page, completed: ForestSeedMission[]): Promise<void> {
  await page.goto('/');
  await page.evaluate(({ completed, rewards }) => {
    window.localStorage.clear();
    const completedAt = '2026-09-04T07:30:00.000Z';
    window.localStorage.setItem('kidsplay.story-progress.v1', JSON.stringify({
      version: 1,
      completedMissions: Object.fromEntries(completed.map((missionId) => [missionId, {
        missionId,
        completedAt,
        completions: 1,
        rewardId: rewards[missionId],
        starsAwarded: 3
      }])),
      completedLocations: {},
      completedSessionIds: completed.map((missionId) => `seed.${missionId}`),
      updatedAt: completedAt
    }));
  }, { completed, rewards });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Forest Explorer Trail' })).toBeVisible();

  // A previously opened story overlay can survive a seeded reload in the SPA shell.
  // Close it explicitly so the seeded journey always starts from the world map.
  const dialog = page.getByRole('dialog');
  if (await dialog.count()) {
    await page.getByRole('button', { name: 'Close mission' }).click();
    await expect(dialog).toHaveCount(0);
  }
}

export async function advanceMissionStory(page: Page): Promise<void> {
  while (await page.getByRole('button', { name: 'Next story beat' }).count()) {
    await page.getByRole('button', { name: 'Next story beat' }).click();
  }
}

export async function expectChildTapTarget(locator: Locator, label: string): Promise<void> {
  await expect(locator, `${label}: control should be visible`).toBeVisible();
  const box = await locator.boundingBox();
  expect(box, `${label}: control should have a measurable box`).not.toBeNull();
  expect(box!.width, `${label}: width should be at least 44 CSS px`).toBeGreaterThanOrEqual(44);
  expect(box!.height, `${label}: height should be at least 44 CSS px`).toBeGreaterThanOrEqual(44);
}

export async function expectForestSurfaceFits(page: Page, label: string): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    viewportWidth: document.documentElement.clientWidth,
    viewportHeight: document.documentElement.clientHeight,
    pageWidth: document.documentElement.scrollWidth,
    pageHeight: document.documentElement.scrollHeight,
    bodyHeight: document.body.scrollHeight
  }));
  expect(dimensions.pageWidth, `${label}: no horizontal document overflow`).toBeLessThanOrEqual(dimensions.viewportWidth + 1);
  expect(dimensions.pageHeight, `${label}: no document vertical overflow`).toBeLessThanOrEqual(dimensions.viewportHeight + 1);
  expect(dimensions.bodyHeight, `${label}: body stays inside viewport`).toBeLessThanOrEqual(dimensions.viewportHeight + 1);
}

export async function expectAllForestButtonsTouchable(page: Page, label: string): Promise<void> {
  const buttons = page.locator('.forest-depth button:visible');
  for (let index = 0; index < await buttons.count(); index += 1) {
    await expectChildTapTarget(buttons.nth(index), `${label} button ${index + 1}`);
  }
}

export async function expectStaticReducedMotion(page: Page): Promise<void> {
  expect(await page.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  const durations = await page.locator('.forest-depth *').evaluateAll((elements) =>
    elements.map((element) => getComputedStyle(element).animationDuration)
  );
  expect(durations.every((duration) => duration === '0s' || duration === '0ms')).toBe(true);
}

export function remoteHttpRequests(requestUrls: string[], appOrigin: string): string[] {
  return requestUrls.filter((value) => {
    const url = new URL(value);
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.origin !== appOrigin;
  });
}
