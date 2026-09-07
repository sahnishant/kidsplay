import { expect, test } from '@playwright/test';
import {
  advanceMissionStory,
  expectAllForestButtonsTouchable,
  expectForestSurfaceFits,
  expectStaticReducedMotion,
  openForestDepth,
  remoteHttpRequests
} from './helpers/forestWorldDepth';

test.use({
  viewport: { width: 360, height: 640 },
  hasTouch: true,
  isMobile: true
});

test('Forest Explorer Level 3 restores a habitat through real scene work and persists at 360x640', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const requestUrls: string[] = [];
  page.on('request', (request) => requestUrls.push(request.url()));

  await openForestDepth(page, ['mission.forest-explorer-trail', 'mission.forest-creek-rescue']);
  const appOrigin = new URL(page.url()).origin;

  await expect(page.getByLabel('Current adventure level 3')).toBeVisible();
  await expect(page.getByRole('button', { name: /Forest Explorer Trail, Level 1, Forest depth 3: play next/i })).toBeVisible();
  await expect(page.getByText('📖 2 Forest finds')).toBeVisible();

  await page.getByRole('button', { name: 'Continue Forest Explorer Trail' }).click();
  await expect(page.getByRole('heading', { name: 'Bring Back the Busy Grove' })).toBeVisible();
  await expect(page.getByText(/shiny decorations/i)).toBeVisible();
  await advanceMissionStory(page);
  await page.getByRole('button', { name: 'Start Forest Level 3' }).click();

  const level = page.locator('[data-forest-level="3"]');
  await expect(level).toBeVisible();
  await expect(level).toHaveAttribute('data-testid', 'busy-grove-practical');
  await expect(level.getByText('Work in the picture')).toBeVisible();
  await expect(page.getByRole('button', { name: /Place the food|Sort and clear it|Water and watch it grow/i })).toHaveCount(0);
  await expectStaticReducedMotion(page);
  await expectAllForestButtonsTouchable(page, 'Level 3 opening action');
  await expectForestSurfaceFits(page, 'Level 3 opening action');

  // 1. Repair the shelter in the scene. A wrong placement must not silently complete it.
  await page.locator('[data-part="part.shelter-roof"]').click();
  await page.locator('[data-grove-slot="slot.shelter-front"]').click();
  await expect(page.getByRole('status').last()).toContainText('roof covers');
  await expect(page.locator('[data-grove-state="roof-installed"]')).toHaveCount(0);

  await page.locator('[data-part="part.shelter-roof"]').click();
  await page.locator('[data-grove-slot="slot.shelter-top"]').click();
  await page.locator('[data-part="part.shelter-perch"]').click();
  await page.locator('[data-grove-slot="slot.shelter-front"]').click();
  await expect(page.locator('[data-grove-state="roof-installed"]')).toBeVisible();
  await expect(page.locator('[data-grove-state="perch-installed"]')).toBeVisible();
  await expect(page.getByRole('status').last()).toContainText('roof above and a perch');
  await page.getByRole('button', { name: /Next forest job/i }).click();

  // 2. Sort actual scattered objects into their real grove destinations.
  await expect(page.getByRole('heading', { name: /Sort the feeding place/ })).toBeVisible();
  await page.locator('[data-part="part.grove.seed-food"]').click();
  await page.locator('[data-grove-slot="slot.grove.feeder"]').click();
  await page.locator('[data-part="part.grove.leaf-litter"]').click();
  await page.locator('[data-grove-slot="slot.grove.compost"]').click();
  await page.locator('[data-part="part.grove.wrapper"]').click();
  await page.locator('[data-grove-slot="slot.grove.litter-bag"]').click();
  await expect(page.getByRole('status').last()).toContainText('feeding corner is clean');
  await page.getByRole('button', { name: /Next forest job/i }).click();

  // 3. Carry seed into the feeder; the feeder fills and a bird returns.
  await expect(page.getByRole('heading', { name: /Set out the animal food/ })).toBeVisible();
  await page.getByRole('button', { name: /Seed scoop/i }).click();
  await page.getByRole('button', { name: /Feeder\. Put the seed here/i }).click();
  await expect(page.locator('[data-grove-state="bird-returned"]')).toBeVisible();
  await expect(page.getByRole('status').last()).toContainText('feeder is ready');
  await page.getByRole('button', { name: /Next forest job/i }).click();

  // 4. Water all three patches individually; each watering is child work, not one completion button.
  await expect(page.getByRole('heading', { name: /Help the flowering patch grow/ })).toBeVisible();
  for (const patch of [1, 2, 3]) {
    await page.getByRole('button', { name: /Watering can/i }).click();
    await page.getByRole('button', { name: new RegExp(`Dry flower patch ${patch}`) }).click();
  }
  await expect(page.locator('[data-grove-state="butterflies-returned"]')).toBeVisible();
  await expect(page.getByRole('status').last()).toContainText('Flowers rise and butterflies return');
  await page.getByRole('button', { name: /See the restored grove/i }).click();

  await expect(page.getByText('Forest depth complete · next world available')).toBeVisible();
  await expect(page.getByText(/butterflies return to the restored grove/i)).toBeVisible();
  await expect(page.getByText(/replaying the mission cannot farm another reward/i)).toHaveCount(0);
  await expectForestSurfaceFits(page, 'Level 3 completion');

  await page.getByRole('button', { name: 'Back to the Forest' }).click();
  await expect(page.getByRole('button', { name: /Forest Explorer Trail.*complete, replay.*Busy grove restored/i })).toBeVisible();
  await expect(page.getByText('📖 3 Forest finds')).toHaveCount(1);
  await expect(page.getByLabel(/Forest discoveries: animal nature, field note, vocabulary semantic/i)).toBeVisible();
  await expect(page.getByLabel('Current adventure level 2')).toBeVisible();

  await page.reload();
  await expect(page.getByRole('button', { name: /Forest Explorer Trail.*Busy grove restored/i })).toBeVisible();
  await expect(page.getByText('📖 3 Forest finds')).toHaveCount(1);
  await expect(page.getByLabel(/Forest discoveries: animal nature, field note, vocabulary semantic/i)).toBeVisible();
  await expectForestSurfaceFits(page, 'Level 3 persisted world after relaunch');

  expect(remoteHttpRequests(requestUrls, appOrigin), 'Level 3 should require no remote API, audio or artwork origin').toEqual([]);
});
