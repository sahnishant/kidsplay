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

test('Forest Explorer Level 2 is a visual persistent creek-repair adventure at 360x640', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const requestUrls: string[] = [];
  page.on('request', (request) => requestUrls.push(request.url()));

  await openForestDepth(page, ['mission.forest-explorer-trail']);
  const appOrigin = new URL(page.url()).origin;

  await expect(page.getByLabel('Current adventure level 2')).toBeVisible();
  await expect(page.getByRole('button', { name: /Forest Explorer Trail, Level 1, Forest depth 2: play next/i })).toBeVisible();
  await expectForestSurfaceFits(page, 'Level 2 world entry');

  await page.getByRole('button', { name: 'Continue Forest Explorer Trail' }).click();
  await expect(page.getByRole('heading', { name: 'The Quiet Creek Rescue' })).toBeVisible();
  await expect(page.getByText(/creek is stuck and the crossing is broken/i)).toBeVisible();
  await advanceMissionStory(page);
  await page.getByRole('button', { name: 'Start Forest Level 2' }).click();

  const level = page.locator('[data-forest-level="2"]');
  const scene = level.locator('[data-testid="quiet-creek-scene"]');
  await expect(level).toBeVisible();
  await expect(scene).toBeVisible();
  await expect(scene.locator('img[src="/assets/forest/quiet-creek-scene.svg"]')).toBeVisible();
  await expect(page.getByText('Can you help fix the bridge?')).toBeVisible();
  await expect(level.locator('[data-testid="forest-assembly"]')).toBeVisible();
  await expect(page.getByText('WORLD PROBLEM')).toHaveCount(0);
  await expect(page.getByText('broken-crossing')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Check Answer/i })).toHaveCount(0);
  await expectStaticReducedMotion(page);
  await expectAllForestButtonsTouchable(page, 'Level 2 opening action');
  await expectForestSurfaceFits(page, 'Level 2 opening action');

  await page.locator('[data-part="part.bridge-plank"]').click();
  await page.locator('[data-slot="slot.bridge-side"]').click();
  await expect(page.getByRole('status')).toBeVisible();
  await expect(page.locator('[data-testid="forest-assembly"]')).toHaveAttribute('data-first-attempt', 'false');
  await expect(scene.locator('[data-scene-state="bridge-plank-repaired"]')).toHaveCount(0);

  await page.locator('[data-part="part.bridge-plank"]').click();
  await page.locator('[data-slot="slot.bridge-deck"]').click();
  await expect(scene.locator('[data-scene-state="bridge-plank-repaired"]')).toBeVisible();
  await page.locator('[data-part="part.bridge-rail"]').click();
  await page.locator('[data-slot="slot.bridge-side"]').click();
  await expect(page.getByRole('status')).toContainText('bridge stands firmly');
  await expect(scene.locator('[data-scene-state="bridge-rail-repaired"]')).toBeVisible();
  await page.getByRole('button', { name: 'Next' }).click();

  await expect(page.getByRole('heading', { name: /Reconnect the water path/ })).toBeVisible();
  await expect(page.getByText('Can the water reach the plants?')).toBeVisible();
  await page.locator('[data-part="part.channel-left"]').click();
  await page.locator('[data-slot="slot.channel-upper"]').click();
  await expect(scene.locator('[data-scene-state="channel-left-connected"]')).toBeVisible();
  await page.locator('[data-part="part.channel-right"]').click();
  await page.locator('[data-slot="slot.channel-lower"]').click();
  await expect(page.getByRole('status')).toContainText('one clear path');
  await expect(scene.locator('[data-scene-state="channel-right-connected"]')).toBeVisible();
  await page.getByRole('button', { name: 'Next' }).click();

  await expect(page.getByRole('heading', { name: /Water the creek-bank saplings/ })).toBeVisible();
  await expect(page.getByText('Help the little plants drink.')).toBeVisible();
  await page.locator('.plant-action').click();
  await expect(page.getByRole('status')).toContainText('Water reaches the soil');
  await expect(scene.locator('[data-scene-state="saplings-watered"]')).toBeVisible();
  await page.getByRole('button', { name: 'Next' }).click();

  await expect(page.getByRole('heading', { name: /Release the creek flow/ })).toBeVisible();
  await expect(page.getByText('What is blocking the water?')).toBeVisible();
  await page.locator('.branch-action').click();
  await expect(scene.locator('[data-scene-state="creek-flowing"]')).toBeVisible();
  await expect(scene.getByText('Creek rescued!', { exact: true })).toBeVisible();
  const rescued = page.getByLabel('Creek rescued!');
  await expect(rescued).toBeVisible();
  await expect(rescued).toContainText(/Water is moving again, the crossing is safe/i);
  await expect(page.getByText('Forest Level 3 unlocked')).toBeVisible();
  await expect(page.getByText(/farm another reward/i)).toHaveCount(0);
  await expectForestSurfaceFits(page, 'Level 2 completion');

  await level.getByRole('button', { name: 'Back to the Forest' }).click();
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
