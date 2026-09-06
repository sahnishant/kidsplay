import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { openCleanApp } from './helpers/childJourney';
import type { SequenceOrderQuestion } from '../src/contracts/question';
import visuals from '../content/visuals/studio-scenes.json';

const read = (path: string) => JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf8'));
const questions = [...read('content/questions/__generated-from-knowledge.json'), ...read('content/questions/__generated-story-studios.json')] as SequenceOrderQuestion[];
const byId = new Map(questions.map((question) => [question.id, question]));
const glyphs = new Map(visuals.map((visual) => [visual.id, visual.glyph]));
const activities = [
  { topic: 'Earth', title: 'From sunrise to midnight', question: 'earth.studio.day-sequence.001' },
  { topic: 'Earth', title: 'When ice melts', question: 'earth.studio.ice-melting.001' },
  { topic: 'Earth', title: 'When water freezes', question: 'earth.studio.water-freezing.001' },
  { topic: 'Lion', title: 'A lion grows up', question: 'lion.studio.growth.001' },
  { topic: 'Fire Station', title: 'Dheu visits the fire station', question: 'fire-station.studio.visit-story.001' },
  { topic: 'Plants', title: 'From seed to young plant', question: 'plants.studio.seed-growth.001' }
];
async function openActivity(page: Page, activity: typeof activities[number]) {
  await page.getByLabel('Open child navigation').click();
  await page.getByRole('button', { name: 'Open practice activities' }).click();
  await page.getByRole('button', { name: 'Open Learn About' }).click();
  await page.getByRole('button', { name: `Learn about ${activity.topic}`, exact: true }).click();
  await page.getByRole('button', { name: /D2\s*Connect/ }).click();
  await page.getByRole('button', { name: new RegExp(`^${activity.title}`) }).click();
  const dialog = page.getByRole('dialog');
  // A compatible reopen may restore Show me, without an active ordering engine.
  await expect(dialog.locator('.studio h2')).toHaveText(activity.title);
  await expect(dialog.getByRole('button', { name: 'Explore', exact: true })).toBeVisible();
  return dialog;
}
async function evidence(page: Page) {
  return page.evaluate(() => Object.fromEntries(Object.keys(localStorage).filter((key) => /progress|mastery|evidence|attempt/i.test(key)).sort().map((key) => [key, localStorage.getItem(key)])));
}

// 6 tasks × 3 viewports × 2 motion policies = 36 real navigation journeys.
// Their 18 source stages per configuration make 108 stage rendering checks.
for (const viewport of [{ width: 320, height: 568 }, { width: 360, height: 640 }, { width: 640, height: 360 }]) {
  for (const reducedMotion of ['reduce', 'no-preference'] as const) {
    test.describe(`illustrated studios ${viewport.width}x${viewport.height} ${reducedMotion}`, () => {
      test.use({ viewport, reducedMotion, hasTouch: true });
      for (const activity of activities) {
        test(activity.title, async ({ page }, info) => {
          await openCleanApp(page);
          const before = await evidence(page);
          const dialog = await openActivity(page, activity);
          const source = byId.get(activity.question)!;
          await expect(dialog.locator('.picture-sequence')).toBeVisible();
          await expect(dialog.locator('.sequence-order__item [data-studio-scene]')).toHaveCount(source.interaction.items.length);
          await dialog.getByRole('button', { name: 'Show me', exact: true }).click();
          for (const [index, id] of source.solution.orderedItemIds.entries()) {
            const item = source.interaction.items.find((candidate) => candidate.id === id)!;
            const glyph = glyphs.get(item.visualRefs![0])!;
            const label = dialog.locator('.studio__step strong');
            await expect(label).toHaveText(item.label);
            const frame = dialog.locator('.studio__illustration');
            const scene = frame.locator(`[data-studio-scene="${glyph}"]`);
            await expect(scene).toBeVisible();
            await scene.scrollIntoViewIfNeeded();
            const box = (await frame.boundingBox())!;
            const text = (await label.boundingBox())!;
            expect(box.width).toBeGreaterThanOrEqual(180);
            expect(Math.abs(box.height / box.width - 5 / 8)).toBeLessThan(.015);
            expect(text.y).toBeGreaterThanOrEqual(box.y + box.height);
            for (const svg of await scene.locator('svg').all()) {
              const image = (await svg.boundingBox())!;
              expect(image.x).toBeGreaterThanOrEqual(box.x - 1);
              expect(image.y).toBeGreaterThanOrEqual(box.y - 1);
              expect(image.x + image.width).toBeLessThanOrEqual(box.x + box.width + 1);
              expect(image.y + image.height).toBeLessThanOrEqual(box.y + box.height + 1);
            }
            const motion = await scene.evaluate((root) => [...root.querySelectorAll('*')].map((element) => ({ name: getComputedStyle(element).animationName, count: getComputedStyle(element).animationIterationCount })));
            if (reducedMotion === 'reduce') expect(motion.every((item) => item.name === 'none')).toBe(true);
            else expect(motion.every((item) => !item.count.includes('infinite'))).toBe(true);
            expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width + 1);
            if (viewport.width === 360 && reducedMotion === 'reduce') {
              await scene.screenshot({ path: info.outputPath(`studio-art-${glyph}.png`) });
              await page.screenshot({ path: info.outputPath(`studio-page-${glyph}.png`) });
            }
            const next = dialog.getByRole('button', { name: 'Next step', exact: true });
            for (const control of await dialog.locator('.studio__controls button').all()) {
              const button = (await control.boundingBox())!;
              expect(button.width).toBeGreaterThanOrEqual(48);
              expect(button.height).toBeGreaterThanOrEqual(48);
            }
            if (index === source.solution.orderedItemIds.length - 1) await expect(next).toBeDisabled();
            else await next.click();
          }
          await dialog.getByRole('button', { name: 'Explore', exact: true }).click();
          const cards = dialog.locator('.sequence-order__item');
          const order = await cards.allTextContents();
          const firstVisual = await cards.first().locator('[data-studio-scene]').getAttribute('data-studio-scene');
          const secondVisual = await cards.nth(1).locator('[data-studio-scene]').getAttribute('data-studio-scene');
          await cards.first().focus(); await page.keyboard.press('Space'); await cards.nth(1).tap();
          await expect(cards.first().locator('[data-studio-scene]')).toHaveAttribute('data-studio-scene', secondVisual!);
          await expect(cards.nth(1).locator('[data-studio-scene]')).toHaveAttribute('data-studio-scene', firstVisual!);
          expect(await cards.allTextContents()).toEqual([order[1], order[0], ...order.slice(2)]);
          await dialog.getByRole('button', { name: 'Look at my order', exact: true }).click();
          await expect(dialog.locator('.studio__step [data-studio-scene]')).toHaveAttribute('data-studio-scene', secondVisual!);
          // Editing an already-open preview must update its picture AND source label.
          await cards.first().click(); await cards.nth(1).click();
          await expect(dialog.locator('.studio__step [data-studio-scene]')).toHaveAttribute('data-studio-scene', firstVisual!);
          await expect(dialog.locator('.studio__step strong')).toHaveText(order[0].trim());
          expect(await cards.allTextContents()).toEqual(order);
          expect(await evidence(page)).toEqual(before);
          if (viewport.width === 360 && reducedMotion === 'reduce') {
            await dialog.locator('.sequence-order__list').screenshot({ path: info.outputPath(`studio-cards-${activity.question}.png`) });
          }
        });
      }
    });
  }
}

test.describe('illustration delivery failure and offline boundaries', () => {
  test.use({ viewport: { width: 360, height: 640 }, reducedMotion: 'reduce' });
  test('a missing artwork chunk leaves source labels and controls usable', async ({ page }) => {
    await page.route(/\/StudioScene-[^/]+\.js$/, (route) => route.abort());
    await openCleanApp(page);
    const dialog = await openActivity(page, activities[0]);
    await expect(dialog.locator('[data-studio-scene-loading="unavailable"]').first()).toBeVisible();
    await dialog.getByRole('button', { name: 'Show me', exact: true }).click();
    await expect(dialog.locator('.studio__step strong')).toHaveText('Sunrise');
    await dialog.getByRole('button', { name: 'Next step', exact: true }).click();
    await expect(dialog.locator('.studio__step strong')).toHaveText('Noon');
    await dialog.getByRole('button', { name: 'Back to topic', exact: true }).click();
    await page.unroute(/\/StudioScene-[^/]+\.js$/);
    await page.reload();
    const reopened = await openActivity(page, activities[0]);
    await expect(reopened.locator('.studio__step [data-studio-scene="day-noon"]')).toBeVisible();
  });
  test('a loaded illustration family survives warm offline editing and reopening', async ({ page, context }) => {
    const remote: string[] = [];
    page.on('request', (request) => { if (!['127.0.0.1','localhost'].includes(new URL(request.url()).hostname)) remote.push(request.url()); });
    await openCleanApp(page);
    const before = await evidence(page);
    const dialog = await openActivity(page, activities[5]);
    await expect(dialog.locator('[data-studio-scene="plant-seed"]')).toBeVisible();
    await context.setOffline(true);
    await dialog.getByRole('button', { name: 'Show me', exact: true }).click();
    await dialog.getByRole('button', { name: 'Next step', exact: true }).click();
    await expect(dialog.locator('[data-studio-scene="plant-sprout"]')).toBeVisible();
    await dialog.getByRole('button', { name: 'Back to topic', exact: true }).click();
    await page.getByRole('button', { name: /^From seed to young plant/ }).click();
    await expect(page.getByRole('dialog').locator('[data-studio-scene="plant-sprout"]')).toBeVisible();
    expect(await evidence(page)).toEqual(before);
    expect(remote).toEqual([]);
    await context.setOffline(false);
  });
});
