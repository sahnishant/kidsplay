import { expect, test, type Locator, type Page } from '@playwright/test';
import {
  answerCurrentQuestion,
  cssTimeToMilliseconds,
  openCleanApp,
  sessionFeedback
} from './helpers/childJourney';

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
  expect(dimensions.scrollHeight, `${label}: representative primary child state should fit without internal scrolling`)
    .toBeLessThanOrEqual(dimensions.clientHeight + 1);
}

async function expectChildTapTarget(locator: Locator, label: string): Promise<void> {
  await expect(locator, `${label}: target should be visible`).toBeVisible();
  const box = await locator.boundingBox();
  expect(box, `${label}: target should have a measurable box`).not.toBeNull();
  expect(box!.width, `${label}: target should be at least 44 CSS px wide`).toBeGreaterThanOrEqual(44);
  expect(box!.height, `${label}: target should be at least 44 CSS px high`).toBeGreaterThanOrEqual(44);
}

async function openPlayer(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Open player settings' }).click();
}

async function openPractice(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Open practice activities' }).click();
}

async function openGoals(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Open goal learning' }).click();
}

async function openProgress(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Open learning progress' }).click();
}

async function progressAttempts(page: Page): Promise<number> {
  const details = page.getByLabel('Learning progress numbers');
  if ((await details.getAttribute('open')) === null) await details.locator('summary').click();
  return Number.parseInt(await details.locator('strong').first().innerText(), 10);
}

async function advanceMissionStory(page: Page): Promise<void> {
  const nextBeat = page.getByRole('button', { name: 'Next story beat' });
  while (await nextBeat.count()) {
    await expect(nextBeat).toBeVisible();
    await nextBeat.click();
  }
}

test.describe('Kidsplay child journeys', () => {
  test('player setup, free explore, feedback and local persistence', async ({ page }) => {
    await openCleanApp(page);
    await expect(page.getByLabel('Current adventure level 1')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Forest Explorer Trail' })).toBeVisible();
    await expectNoDocumentVerticalOverflow(page, 'home world');

    await openPlayer(page);
    const childName = page.getByLabel('Child name');
    await childName.fill('Dheu E2E');
    await page.getByRole('button', { name: 'Panda' }).click();
    await expect(page.getByRole('button', { name: 'Panda' })).toHaveAttribute('aria-pressed', 'true');
    await expectNoDocumentVerticalOverflow(page, 'player screen');

    await page.getByRole('button', { name: "Back to Dheu's world" }).click();
    await openPractice(page);
    await page.getByRole('button', { name: 'Play free' }).click();
    await expect(page.getByText(/^1 \/ 8$/)).toBeVisible();
    await expectNoDocumentVerticalOverflow(page, 'free-practice answer state');

    let sawVisualSingleChoice = false;
    let sawAnotherFamily = false;
    let answered = 0;

    for (let index = 0; index < 8; index += 1) {
      const result = await answerCurrentQuestion(page);
      answered += 1;
      sawVisualSingleChoice ||= result.visualSingleChoice;
      sawAnotherFamily ||= result.engine !== 'single_choice';
      await expect(sessionFeedback(page)).toBeVisible();
      await expectNoDocumentVerticalOverflow(page, 'free-practice reaction state');

      if (sawVisualSingleChoice && sawAnotherFamily) break;
      await page.getByRole('button', { name: index === 7 ? 'See result' : 'Next' }).click();
    }

    expect(sawVisualSingleChoice, 'Free Explore should exercise a visual single-choice question').toBe(true);
    expect(sawAnotherFamily, 'Free Explore should exercise a second interaction family').toBe(true);

    await page.getByRole('button', { name: 'Back to Kidsplay home' }).click();
    await openProgress(page);
    await expect(page.getByRole('heading', { name: /strong facts!/ })).toBeVisible();
    const attemptsBeforeReload = await progressAttempts(page);
    expect(attemptsBeforeReload).toBeGreaterThanOrEqual(answered);

    await page.reload();
    await openPlayer(page);
    await expect(page.getByLabel('Child name')).toHaveValue('Dheu E2E');
    await expect(page.getByRole('button', { name: 'Panda' })).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: "Back to Dheu's world" }).click();
    await openProgress(page);
    expect(await progressAttempts(page)).toBe(attemptsBeforeReload);
  });

  test('Escape and browser Back share the overlay-first dashboard navigation contract', async ({ page }) => {
    await openCleanApp(page);

    await openProgress(page);
    await expect(page.getByRole('heading', { name: 'Learning progress' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { name: 'Forest Explorer Trail' })).toBeVisible();

    await openGoals(page);
    await expect(page.getByRole('heading', { name: 'Goal learning' })).toBeVisible();
    await page.goBack();
    await expect(page.getByRole('heading', { name: 'Forest Explorer Trail' })).toBeVisible();

    await page.getByRole('button', { name: 'River & Pond Quest, Level 4: The Puppy by the Pond' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Forest Explorer Trail' })).toBeVisible();
  });

  test('story mission unlocks the next location after completion', async ({ page }) => {
    test.setTimeout(120_000);
    await openCleanApp(page);

    await expect(page.getByRole('button', { name: 'Forest Explorer Trail, Level 1: play next' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Farmyard Discovery, Level 2: explore' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Home & Garden Helpers, Level 3: The Garden Food Clue Mix-Up' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'River & Pond Quest, Level 4: The Puppy by the Pond' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'School Road Adventure, Level 5: explore' })).toBeEnabled();

    const lockedLab = page.getByRole('button', {
      name: "Scientu's Lab Investigation, Level 6: locked until The Puppy by the Pond"
    });
    await expect(lockedLab).toBeDisabled();

    await page.getByRole('button', { name: 'River & Pond Quest, Level 4: The Puppy by the Pond' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'The Puppy by the Pond' })).toBeVisible();
    await expectNoDocumentVerticalOverflow(page, 'story mission overlay');
    await expect(page.getByLabel(/Story beat 1 of/)).toBeVisible();
    await advanceMissionStory(page);
    await page.getByRole('button', { name: 'Start investigation · 6 clues' }).click();

    for (let index = 0; index < 6; index += 1) {
      await answerCurrentQuestion(page);
      await expectNoDocumentVerticalOverflow(page, `story question ${index + 1} reaction`);
      await page.getByRole('button', { name: index === 5 ? 'See result' : 'Next' }).click();
    }

    const completion = page.getByLabel('Story mission complete');
    await expect(completion).toBeVisible();
    await expect(completion).toContainText('Pond Helper');
    await expect(completion).toContainText('⭐ 3');

    await page.getByRole('button', { name: 'Back to Dheu’s world' }).click();
    await expect(page.getByLabel('3 story stars')).toBeVisible();
    await expect(page.getByLabel('6 of 9 places open; 1 complete')).toBeVisible();
    await expect(page.getByRole('button', { name: "Scientu's Lab Investigation, Level 6: The Invisible Air Mystery" })).toBeEnabled();
  });

  test('35-question SOF pattern mock resumes exact submitted and unsubmitted boundaries', async ({ page }) => {
    await openCleanApp(page);
    await openPractice(page);
    await page.getByRole('button', { name: 'Try 35-question mock' }).click();

    await expect(page.getByText('Mock progress saves on this device')).toBeVisible();
    await expect(page.getByText(/^1 \/ 35$/)).toBeVisible();
    const firstPrompt = await page.getByRole('heading', { level: 1 }).innerText();
    await answerCurrentQuestion(page);

    await page.reload();
    await openGoals(page);
    await expect(page.getByRole('heading', { name: 'Pick up where you left off' })).toBeVisible();
    await expect(page.getByText('1 / 35')).toBeVisible();
    await page.getByRole('button', { name: /Continue/ }).click();
    await expect(page.getByRole('note')).toContainText('Your saved answer is restored.');
    await expect(sessionFeedback(page)).toBeVisible();

    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByText(/^2 \/ 35$/)).toBeVisible();
    const secondPrompt = await page.getByRole('heading', { level: 1 }).innerText();
    expect(secondPrompt).not.toBe(firstPrompt);
    await expect(page.getByRole('note')).toHaveCount(0);

    await page.reload();
    await openGoals(page);
    await expect(page.getByText('1 / 35')).toBeVisible();
    await page.getByRole('button', { name: /Continue/ }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(secondPrompt);
    await expect(page.getByRole('note')).toHaveCount(0);

    await answerCurrentQuestion(page);
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByText(/^3 \/ 35$/)).toBeVisible();
    const thirdPrompt = await page.getByRole('heading', { level: 1 }).innerText();
    await answerCurrentQuestion(page);

    await page.reload();
    await openGoals(page);
    await expect(page.getByText('3 / 35')).toBeVisible();
    await page.getByRole('button', { name: /Continue/ }).click();
    await expect(page.getByRole('note')).toContainText('Your saved answer is restored.');
    await expect(page.getByText(/^3 \/ 35$/)).toBeVisible();
    await expect(sessionFeedback(page)).toBeVisible();
    expect(thirdPrompt.length).toBeGreaterThan(0);
  });

  test('reduced-motion mode keeps animated surfaces static and the learning flow usable', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openCleanApp(page);

    expect(await page.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
    await openPlayer(page);
    const motion = page.locator('.kid-avatar--bounce .kid-avatar__character').first();
    await expect(motion).toBeVisible();
    const style = await motion.evaluate((element) => {
      const computed = window.getComputedStyle(element);
      return { duration: computed.animationDuration, iterations: computed.animationIterationCount };
    });
    expect(await cssTimeToMilliseconds(style.duration)).toBeLessThanOrEqual(1);
    expect(style.iterations).toBe('1');

    await page.getByRole('button', { name: "Back to Dheu's world" }).click();
    await openPractice(page);
    await page.getByRole('button', { name: 'Play free' }).click();
    await answerCurrentQuestion(page);
    await expect(sessionFeedback(page)).toBeVisible();
    await expect(page.getByRole('button', { name: /Next|See result/ })).toBeEnabled();
  });

  test('core practice does not depend on a remote runtime origin', async ({ page }) => {
    const requestUrls: string[] = [];
    page.on('request', (request) => requestUrls.push(request.url()));

    await openCleanApp(page);
    const appOrigin = new URL(page.url()).origin;
    await openPractice(page);
    await page.getByRole('button', { name: 'Play free' }).click();
    await answerCurrentQuestion(page);
    await expect(sessionFeedback(page)).toBeVisible();

    const remoteRequests = requestUrls.filter((value) => {
      const url = new URL(value);
      return (url.protocol === 'http:' || url.protocol === 'https:') && url.origin !== appOrigin;
    });
    expect(remoteRequests, 'Packaged learning should not require an API/CDN/remote artwork request').toEqual([]);
  });
});

test.describe('Android-like viewport acceptance', () => {
  test.use({ viewport: { width: 360, height: 640 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });

  test('360x640 home and revealed surfaces remain tappable without document scrolling', async ({ page }) => {
    await openCleanApp(page);
    await expectNoHorizontalOverflow(page, 'home at 360px');
    await expectNoDocumentVerticalOverflow(page, 'home at 360x640');

    await expectChildTapTarget(
      page.getByRole('button', { name: 'River & Pond Quest, Level 4: The Puppy by the Pond' }),
      'story location'
    );

    await expectChildTapTarget(page.getByRole('button', { name: 'Open player settings' }), 'player navigation');
    await openPlayer(page);
    const childName = page.getByLabel('Child name');
    await expectChildTapTarget(childName, 'child-name field');
    await childName.fill('Dheu Small Phone');
    await childName.focus();
    await expectNoDocumentVerticalOverflow(page, 'player screen at 360x640');

    await page.setViewportSize({ width: 360, height: 520 });
    await expect(childName).toBeInViewport();
    await expectNoHorizontalOverflow(page, 'name entry with reduced viewport height');
    await expectNoDocumentVerticalOverflow(page, 'name entry with reduced viewport height');
    await page.setViewportSize({ width: 360, height: 640 });

    await expectChildTapTarget(page.getByRole('button', { name: 'Panda' }), 'avatar choice');
    await page.getByRole('button', { name: "Back to Dheu's world" }).click();
    await expectNoDocumentVerticalOverflow(page, 'world after player edit');

    await openPractice(page);
    await expectChildTapTarget(page.getByRole('button', { name: 'Play free' }), 'free-play entry');
    await expectNoDocumentVerticalOverflow(page, 'practice chooser');

    await page.getByRole('button', { name: 'Play free' }).click();
    await expect(page.getByText(/^1 \/ 8$/)).toBeVisible();
    await expectNoHorizontalOverflow(page, 'practice question at 360px');
    await expectNoDocumentVerticalOverflow(page, 'practice answer at 360x640');
    await expectPrimarySurfaceFits(page, 'practice answer at 360x640');
    await answerCurrentQuestion(page);
    const next = page.getByRole('button', { name: /Next|See result/ });
    await expectChildTapTarget(next, 'practice continue');
    await expectNoHorizontalOverflow(page, 'practice feedback at 360px');
    await expectNoDocumentVerticalOverflow(page, 'practice reaction at 360x640');
    await expectPrimarySurfaceFits(page, 'practice reaction at 360x640');
  });

  test('35-question mock remains viewport-contained after a landscape rotation', async ({ page }) => {
    await openCleanApp(page);
    await openPractice(page);
    await expectChildTapTarget(page.getByRole('button', { name: 'Try 35-question mock' }), 'mock entry');
    await page.getByRole('button', { name: 'Try 35-question mock' }).click();

    await expect(page.getByText(/^1 \/ 35$/)).toBeVisible();
    await expect(page.getByText('Mock progress saves on this device')).toBeVisible();
    await expectNoHorizontalOverflow(page, 'mock portrait at 360px');
    await expectNoDocumentVerticalOverflow(page, 'mock portrait at 360x640');
    await expect(page.getByRole('heading', { level: 1 })).toBeInViewport();

    await page.setViewportSize({ width: 800, height: 360 });
    await expectNoHorizontalOverflow(page, 'mock after landscape rotation');
    await expectNoDocumentVerticalOverflow(page, 'mock after landscape rotation');
    await expect(page.getByText(/^1 \/ 35$/)).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});