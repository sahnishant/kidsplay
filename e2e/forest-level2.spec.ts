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

test('Forest Explorer Level 2 is a persistent creek-repair adventure at 360x640', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const requestUrls: string[] = [];
  page.on('request', (request) => requestUrls.push(request.url()));

  await openForestDepth(page, ['mission.forest-explorer-trail']);
  const appOrigin = new URL(page.url()).origin;

  await expect(page.getByLabel('Current adventure level 2')).toBeVisible();
  await expect(page.getByRole('button', { name: /Forest Explorer Trail, Level 1, Forest depth 2: play next/i })).toBeVisible();
  await expectForestSurfaceFits(page, 'Level 2 world entry');

  await page.getByRole('button', { name: 'Continue Adventure' }).click();
  await expect(page.getByRole('heading', { name: 'The Quiet Creek Rescue' })).toBeVisible();
  await expect(page.getByText(/creek is stuck and the crossing is broken/i)).toBeVisible();
  await advanceMissionStory(page);
  await page.getByRole('button', { name: 'Start Forest Level 2' }).click();

  const level = page.locator('[data-forest-level="2"]');
  await expect(level).toBeVisible();
  const openingRepair = level.locator('[data-world-object="forest.l2.step.bridge-repair"]');
  await expect(openingRepair).toBeVisible();
  await expect(openingRepair.locator('small')).toHaveText('broken-crossing');
  await expect(level.locator('[data-testid="forest-assembly"]')).toBeVisible();
  await expect(page.getByRole('button', { name: /Check Answer/i })).toHaveCount(0);
  await expectStaticReducedMotion(page);
  await expectAllForestButtonsTouchable(page, 'Level 2 opening action');
  await expectForestSurfaceFits(page, 'Level 2 opening action');

  await page.locator('[data-part="part.bridge-plank"]').click();
  await page.locator('[data-slot="slot.bridge-side"]').click();
  await expect(page.getByRole('status')).toContainText('Look for the shape');
  await expect(page.locator('[data-testid="forest-assembly"]')).toHaveAttribute('data-first-attempt', 'false');
  await expect(page.locator('[data-world-object="forest.l2.step.bridge-repair"] small')).toHaveText('broken-crossing');

  await page.locator('[data-part="part.bridge-plank"]').click();
  await page.locator('[data-slot="slot.bridge-deck"]').click();
  await page.locator('[data-part="part.bridge-rail"]').click();
  await page.locator('[data-slot="slot.bridge-side"]').click();
  await expect(page.getByRole('status')).toContainText('bridge stands firmly');
  await expect(page.locator('[data-world-object="forest.l2.step.bridge-repair"] small')).toHaveText('safe-crossing');
  await page.getByRole('button', { name: 'Next forest job' }).click();

  await expect(page.getByRole('heading', { name: /Reconnect the water path/ })).toBeVisible();
  await page.locator('[data-part="part.channel-left"]').click();
  await page.locator('[data-slot="slot.channel-upper"]').click();
  await page.locator('[data-part="part.channel-right"]').click();
  await page.locator('[data-slot="slot.channel-lower"]').click();
  await expect(page.getByRole('status')).toContainText('one clear path');
  await page.getByRole('button', { name: 'Next forest job' }).click();

  await expect(page.getByRole('heading', { name: /Water the creek-bank saplings/ })).toBeVisible();
  await page.getByRole('button', { name: 'Water it' }).click();
  await expect(page.getByRole('status')).toContainText('Water reaches the soil');
  await expect(page.locator('[data-world-object="forest.l2.step.water-saplings"] small')).toHaveText('watered-saplings');
  await page.getByRole('button', { name: 'Next forest job' }).click();

  await expect(page.getByRole('heading', { name: /Release the creek flow/ })).toBeVisible();
  await page.getByRole('button', { name: 'Make the change' }).click();
  await expect(page.getByText('Forest Level 3 unlocked')).toBeVisible();
  await expect(page.getByText(/crossing is safe, water is moving/i)).toBeVisible();
  await expect(page.getByText(/replaying the mission cannot farm another reward/i)).toBeVisible();
  await expectForestSurfaceFits(page, 'Level 2 completion');

  await level.getByRole('button', { name: "Back to Dheu's world" }).click();
  await expect(page.getByLabel('Current adventure level 3')).toBeVisible();
  await expect(page.getByRole('button', { name: /Forest Explorer Trail, Level 1, Forest depth 3: play next.*Creek crossing and water path restored/i })).toBeVisible();
  await expect(page.getByText('📖 2 Forest finds')).toBeVisible();

  await page.reload();
  await expect(page.getByLabel('Current adventure level 3')).toBeVisible();
  await expect(page.getByRole('button', { name: /Forest Explorer Trail.*Creek crossing and water path restored/i })).toBeVisible();
  await expect(page.getByText('📖 2 Forest finds')).toHaveCount(1);
  await expectForestSurfaceFits(page, 'Level 2 persisted world after relaunch');

  expect(remoteHttpRequests(requestUrls, appOrigin), 'Level 2 should require no remote API, audio or artwork origin').toEqual([]);
});
