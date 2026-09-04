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

test('Forest Explorer Level 3 restores a habitat and persists its discoveries at 360x640', async ({ page }) => {
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
  const openingRepair = level.locator('[data-world-object="forest.l3.step.shelter-repair"]');
  await expect(openingRepair).toBeVisible();
  await expect(openingRepair.locator('small')).toHaveText('broken-grove-shelter');
  await expect(level.locator('[data-testid="forest-assembly"]')).toBeVisible();
  await expect(page.getByRole('button', { name: /Check Answer/i })).toHaveCount(0);
  await expectStaticReducedMotion(page);
  await expectAllForestButtonsTouchable(page, 'Level 3 opening action');
  await expectForestSurfaceFits(page, 'Level 3 opening action');

  await page.locator('[data-part="part.shelter-roof"]').click();
  await page.locator('[data-slot="slot.shelter-front"]').click();
  await expect(page.getByRole('status')).toContainText('Think about what each piece does');
  await expect(page.locator('[data-testid="forest-assembly"]')).toHaveAttribute('data-first-attempt', 'false');
  await expect(page.locator('[data-world-object="forest.l3.step.shelter-repair"] small')).toHaveText('broken-grove-shelter');

  await page.locator('[data-part="part.shelter-roof"]').click();
  await page.locator('[data-slot="slot.shelter-top"]').click();
  await page.locator('[data-part="part.shelter-perch"]').click();
  await page.locator('[data-slot="slot.shelter-front"]').click();
  await expect(page.getByRole('status')).toContainText('roof above and a perch');
  await expect(page.locator('[data-world-object="forest.l3.step.shelter-repair"] small')).toHaveText('repaired-grove-shelter');
  await page.getByRole('button', { name: 'Next forest job' }).click();

  await expect(page.getByRole('heading', { name: /Sort the feeding place/ })).toBeVisible();
  await page.getByRole('button', { name: 'Sort and clear it' }).click();
  await expect(page.getByRole('status')).toContainText('feeding corner is clean');
  await page.getByRole('button', { name: 'Next forest job' }).click();

  await expect(page.getByRole('heading', { name: /Set out the animal food/ })).toBeVisible();
  await page.getByRole('button', { name: 'Place the food' }).click();
  await expect(page.getByRole('status')).toContainText('feeder is ready');
  await page.getByRole('button', { name: 'Next forest job' }).click();

  await expect(page.getByRole('heading', { name: /Help the flowering patch grow/ })).toBeVisible();
  await page.getByRole('button', { name: 'Water and watch it grow' }).click();
  await expect(page.getByText('Forest depth complete · next world available')).toBeVisible();
  await expect(page.getByText(/butterflies return to the restored grove/i)).toBeVisible();
  await expect(page.getByText(/replaying the mission cannot farm another reward/i)).toBeVisible();
  await expectForestSurfaceFits(page, 'Level 3 completion');

  await level.getByRole('button', { name: "Back to Dheu's world" }).last().click();
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
