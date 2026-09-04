import { expect, test, type Locator, type Page } from '@playwright/test';
import animalLifecycleKnowledge from '../content/knowledge/animal-lifecycles.json' with { type: 'json' };
import {
  answerCurrentQuestion,
  cssTimeToMilliseconds,
  openCleanApp,
  sessionFeedback
} from './helpers/childJourney';

const FOREST_CUE_FAMILIES = [
  ['guide_to_home', 'Guide each thing toward the place where it belongs.'],
  ['sort_or_match', 'Put the clues that belong together.'],
  ['observe_choose', 'Look closely at the clue before you choose.'],
  ['sequence_process', 'Put the stages from first to last, then see what changes.'],
  ['cause_effect_discovery', 'Try the clue, then notice what happens.']
] as const;

async function expectNoHorizontalOverflow(page: Page, label: string): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth
  }));
  expect(dimensions.content, `${label}: page content should fit the viewport without horizontal scrolling`)
    .toBeLessThanOrEqual(dimensions.viewport + 1);
}

async function expectNoDocumentVerticalOverflow(page: Page, label: string): Promise<void> {
  const dimensions = await page.evaluate(() => {
    const app = document.getElementById('app');
    return {
      viewport: document.documentElement.clientHeight,
      documentContent: document.documentElement.scrollHeight,
      bodyContent: document.body.scrollHeight,
      appClient: app?.clientHeight ?? 0,
      appContent: app?.scrollHeight ?? 0
    };
  });

  expect(dimensions.documentContent, `${label}: document element should not require vertical scrolling`)
    .toBeLessThanOrEqual(dimensions.viewport + 1);
  expect(dimensions.bodyContent, `${label}: body should not require vertical scrolling`)
    .toBeLessThanOrEqual(dimensions.viewport + 1);
  expect(dimensions.appContent, `${label}: app shell should contain overflow inside the active child screen`)
    .toBeLessThanOrEqual(dimensions.appClient + 1);
}

async function expectPrimarySurfaceFits(page: Page, label: string): Promise<void> {
  const state = page.locator('[data-session-state]').first();
  await expect(state, `${label}: session state should be visible`).toBeVisible();
  const dimensions = await state.locator('.session-card__scroll').evaluate((element) => ({
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight
  }));
  expect(dimensions.scrollHeight, `${label}: Forest Level-1 content should fit without an internal rescue scroll`)
    .toBeLessThanOrEqual(dimensions.clientHeight + 1);
}

async function expectChildTapTarget(locator: Locator, label: string): Promise<void> {
  await expect(locator, `${label}: control should be visible`).toBeVisible();
  const box = await locator.boundingBox();
  expect(box, `${label}: control should have a measurable box`).not.toBeNull();
  expect(box!.width, `${label}: width should be at least 44 CSS px`).toBeGreaterThanOrEqual(44);
  expect(box!.height, `${label}: height should be at least 44 CSS px`).toBeGreaterThanOrEqual(44);
}

async function expectVisibleInteractionTargets(page: Page, label: string): Promise<void> {
  const buttons = page.locator('.interaction-host button:visible');
  for (let index = 0; index < await buttons.count(); index += 1) {
    await expectChildTapTarget(buttons.nth(index), `${label} interaction control ${index + 1}`);
  }
}

async function answerCanonicalButterflySequence(page: Page): Promise<void> {
  const buttons = page.locator('.sequence-order__item');
  const desiredLabels = animalLifecycleKnowledge.stages.map((stage) => stage.label);
  expect(await buttons.count(), 'Forest butterfly sequence should render every canonical lifecycle stage')
    .toBe(desiredLabels.length);

  for (let targetIndex = 0; targetIndex < desiredLabels.length; targetIndex += 1) {
    const currentLabels = (await buttons.allInnerTexts()).map((label) => label.trim());
    if (currentLabels[targetIndex] === desiredLabels[targetIndex]) continue;

    const sourceIndex = currentLabels.indexOf(desiredLabels[targetIndex]);
    expect(sourceIndex, `canonical lifecycle stage ${desiredLabels[targetIndex]} should be present`).toBeGreaterThanOrEqual(0);
    await buttons.nth(targetIndex).click();
    await buttons.nth(sourceIndex).click();
    await expect(buttons.nth(targetIndex)).toHaveText(desiredLabels[targetIndex]);
  }

  await page.getByRole('button', { name: 'Check order' }).click();
}

async function advanceMissionStory(page: Page): Promise<void> {
  while (await page.getByRole('button', { name: 'Next story beat' }).count()) {
    await page.getByRole('button', { name: 'Next story beat' }).click();
  }
}

async function visibleRecipeFamily(page: Page): Promise<string> {
  const visibleFamily = page.locator('[data-experience-family]:visible').first();
  if (await visibleFamily.count() === 0) return '';
  return await visibleFamily.getAttribute('data-experience-family') ?? '';
}

async function installRetryProbe(page: Page): Promise<void> {
  await page.evaluate(() => {
    (window as Window & { __forestRetry?: { wrong: boolean; scaffold: boolean } }).__forestRetry = { wrong: false, scaffold: false };
  });
}

async function observedRetryPath(page: Page): Promise<{ wrong: boolean; scaffold: boolean }> {
  return await page.evaluate(() =>
    (window as Window & { __forestRetry?: { wrong: boolean; scaffold: boolean } }).__forestRetry ?? { wrong: false, scaffold: false }
  );
}

async function exerciseHonestRetryScaffold(page: Page): Promise<void> {
  const items = page.locator('.drag-items .drag-item');
  const targets = page.locator('.target-grid .drop-target');
  const firstItemLabel = (await items.first().innerText()).trim();
  const targetTexts = (await targets.allInnerTexts()).map((text) => text.trim());
  const wrongIndex = targetTexts.findIndex((text) => !text.includes(firstItemLabel));
  expect(wrongIndex).toBeGreaterThanOrEqual(0);

  await items.first().click();
  await targets.nth(wrongIndex).click();
  await page.getByRole('button', { name: /Check matches/i }).click();
  await expect(sessionFeedback(page)).toContainText(/Give it another try|Here’s a clue|Try this idea/);
  await page.evaluate(() => {
    const state = (window as Window & { __forestRetry?: { wrong: boolean; scaffold: boolean } }).__forestRetry;
    if (state) state.wrong = true;
  });

  const retry = page.getByRole('button', { name: /Try again|Try with this clue/ }).first();
  await expect(retry).toBeVisible();
  await retry.click();
  await page.evaluate(() => {
    const state = (window as Window & { __forestRetry?: { wrong: boolean; scaffold: boolean } }).__forestRetry;
    if (state) state.scaffold = true;
  });
}

test.describe('Phase F3 Forest Explorer Level-1 child journey', () => {
  test.use({
    viewport: { width: 360, height: 640 },
    hasTouch: true,
    isMobile: true
  });

  test('completes the curated Forest mission with retry, persistence, accessibility, reduced motion and offline-safe runtime', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const requestUrls: string[] = [];
    page.on('request', (request) => requestUrls.push(request.url()));

    await openCleanApp(page);
    const appOrigin = new URL(page.url()).origin;
    expect(await page.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);

    await expect(page.getByLabel('Current adventure level 1')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Forest Explorer Trail' })).toBeVisible();
    await expectNoHorizontalOverflow(page, 'Forest world at 360px');
    await expectNoDocumentVerticalOverflow(page, 'Forest world at 360x640');

    const currentHero = page.locator('.expedition-shell--current .kid-avatar__character').first();
    await expect(currentHero).toBeVisible();
    const reducedMotionDuration = await currentHero.evaluate((element) => window.getComputedStyle(element).animationDuration);
    expect(await cssTimeToMilliseconds(reducedMotionDuration)).toBeLessThanOrEqual(1);

    const continueAdventure = page.getByRole('button', { name: 'Continue Adventure' });
    await expectChildTapTarget(continueAdventure, 'Continue Adventure');
    await continueAdventure.click();

    const missionDialog = page.getByRole('dialog');
    await expect(missionDialog).toBeVisible();
    await expect(page.getByRole('heading', { name: 'The Forest Trail Mix-Up' })).toBeVisible();
    await expect(page.getByLabel('Story beat 1 of 3')).toBeVisible();
    await expectNoDocumentVerticalOverflow(page, 'Forest opening story');

    const closeMission = page.getByRole('button', { name: 'Close mission' });
    await expectChildTapTarget(closeMission, 'Forest mission Close');
    await expect(closeMission).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Next story beat' })).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(missionDialog).toHaveCount(0);
    await expect(continueAdventure).toBeFocused();

    await continueAdventure.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await advanceMissionStory(page);
    const startInvestigation = page.getByRole('button', { name: 'Start investigation · 7 clues' });
    await expectChildTapTarget(startInvestigation, 'Start Forest investigation');
    await expect(page.getByLabel('Mission dialogue')).toContainText('put the growing stages back in order');
    await startInvestigation.click();

    await installRetryProbe(page);
    const recipeFamilies = new Set<string>();
    let sawCompactMatching = false;
    let sawCompactMemory = false;
    let exercisedRetryScaffold = false;
    let sawStoryReactionAudio = false;

    for (let index = 0; index < 7; index += 1) {
      await expect(page.locator('.progress-pill')).toHaveText(`${index + 1} / 7`);
      await expectNoHorizontalOverflow(page, `Forest clue ${index + 1} answer`);
      await expectNoDocumentVerticalOverflow(page, `Forest clue ${index + 1} answer`);
      await expectPrimarySurfaceFits(page, `Forest clue ${index + 1} answer`);
      const recipeFamily = await visibleRecipeFamily(page);
      if (recipeFamily) recipeFamilies.add(recipeFamily);

      if (index === 0) {
        await expectChildTapTarget(page.getByRole('button', { name: 'Back to Kidsplay home' }), 'session Home');
        await expectChildTapTarget(page.getByRole('button', { name: 'Turn sound off' }), 'session Sound');
        await expectChildTapTarget(page.getByRole('button', { name: 'Repeat question' }), 'session Repeat');
      }

      const matchingItems = page.locator('.drag-items .drag-item');
      if (await matchingItems.count()) {
        const targets = page.locator('.target-grid .drop-target');
        if (await matchingItems.count() === 3 && await targets.count() === 3) {
          sawCompactMatching = true;
          if (!exercisedRetryScaffold) {
            await exerciseHonestRetryScaffold(page);
            exercisedRetryScaffold = true;
          }
        }
      }

      const memoryCards = page.locator('.memory-pairs').getByRole('button');
      if (await memoryCards.count() === 6) sawCompactMemory = true;

      await expectVisibleInteractionTargets(page, `Forest clue ${index + 1}`);
      if (await page.locator('.sequence-order').count()) {
        await answerCanonicalButterflySequence(page);
      } else {
        await answerCurrentQuestion(page);
      }
      await expect(sessionFeedback(page)).toContainText('Nice work!');
      await expectNoHorizontalOverflow(page, `Forest clue ${index + 1} reaction`);
      await expectNoDocumentVerticalOverflow(page, `Forest clue ${index + 1} reaction`);
      await expectPrimarySurfaceFits(page, `Forest clue ${index + 1} reaction`);

      const storyReaction = page.getByRole('note', { name: /Story reaction from/ });
      if (await storyReaction.count()) {
        await expect(storyReaction).toBeVisible();
        await expectChildTapTarget(page.getByRole('button', { name: /^Hear / }), `Forest clue ${index + 1} story-audio control`);
        sawStoryReactionAudio = true;
      }

      const continuation = page.getByRole('button', { name: index === 6 ? 'See result' : 'Next' });
      await expectChildTapTarget(continuation, `Forest clue ${index + 1} continuation`);
      await continuation.click();
    }

    expect(exercisedRetryScaffold, 'Forest Level 1 should exercise a real reset-and-retry scaffold').toBe(true);
    expect(await observedRetryPath(page)).toEqual({ wrong: true, scaffold: true });
    expect(sawStoryReactionAudio, 'Forest Level 1 should expose at least one accessible character-reaction audio hook').toBe(true);
    expect([...recipeFamilies].sort()).toEqual(FOREST_CUE_FAMILIES.map(([family]) => family).sort());
    expect(sawCompactMatching, 'Forest Level 1 should render the three-item story matching variant').toBe(true);
    expect(sawCompactMemory, 'Forest Level 1 should render the three-pair story memory variant').toBe(true);

    const completion = page.getByLabel('Story mission complete');
    await expect(completion).toBeVisible();
    await expect(completion).toContainText('Forest Trail Keeper');
    await expect(completion).toContainText('⭐ 3');
    await expectNoDocumentVerticalOverflow(page, 'Forest mission completion');

    const backToWorld = page.getByRole('button', { name: 'Back to Dheu’s world' });
    await expectChildTapTarget(backToWorld, 'Back to Adventure world');
    await backToWorld.click();

    await expect(page.getByLabel('Learning has changed the world')).toBeVisible();
    const changedForest = page.getByRole('button', { name: /Forest Explorer Trail, Level 1.*Trail sign repaired/ });
    await expect(changedForest).toBeVisible();
    await expect(page.getByRole('button', { name: 'Open story world' })).toHaveAttribute('aria-current', 'page');
    await expectNoDocumentVerticalOverflow(page, 'Forest world after mission');

    await page.reload();
    await expect(page.getByLabel('Learning has changed the world')).toBeVisible();
    await expect(page.getByRole('button', { name: /Forest Explorer Trail, Level 1.*Trail sign repaired/ })).toBeVisible();
    await expect(page.getByLabel('Current adventure level 2')).toBeVisible();
    await expectNoHorizontalOverflow(page, 'reloaded Forest world at 360px');
    await expectNoDocumentVerticalOverflow(page, 'reloaded Forest world at 360x640');

    const remoteRequests = requestUrls.filter((value) => {
      const url = new URL(value);
      return (url.protocol === 'http:' || url.protocol === 'https:') && url.origin !== appOrigin;
    });
    expect(remoteRequests, 'Forest Level 1 should not require remote TTS, media, API or artwork origins').toEqual([]);
  });
});
