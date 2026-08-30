import { expect, test } from '@playwright/test';
import {
  answerCurrentQuestion,
  cssTimeToMilliseconds,
  openCleanApp,
  sessionFeedback
} from './helpers/childJourney';

test.describe('Kidsplay child journeys', () => {
  test('player setup, free explore, feedback and local persistence', async ({ page }) => {
    await openCleanApp(page);

    const childName = page.getByLabel('Child name');
    await childName.fill('Dheu E2E');
    await page.getByRole('button', { name: 'Panda' }).click();
    await expect(page.getByRole('button', { name: 'Panda' })).toHaveAttribute('aria-pressed', 'true');

    await page.getByRole('button', { name: 'Play free' }).click();
    await expect(page.getByText(/^1 \/ 8$/)).toBeVisible();

    let sawVisualSingleChoice = false;
    let sawAnotherFamily = false;
    let answered = 0;

    for (let index = 0; index < 8; index += 1) {
      const result = await answerCurrentQuestion(page);
      answered += 1;
      sawVisualSingleChoice ||= result.visualSingleChoice;
      sawAnotherFamily ||= result.engine !== 'single_choice';
      await expect(sessionFeedback(page)).toBeVisible();

      if (sawVisualSingleChoice && sawAnotherFamily) break;
      const next = page.getByRole('button', { name: index === 7 ? 'See result' : 'Next' });
      await next.click();
    }

    expect(sawVisualSingleChoice, 'Free Explore should exercise a visual single-choice question').toBe(true);
    expect(sawAnotherFamily, 'Free Explore should exercise a second interaction family').toBe(true);

    await page.getByRole('button', { name: 'Back to Kidsplay home' }).click();
    const progress = page.getByLabel('Learning progress');
    const attemptsBeforeReload = Number.parseInt(await progress.locator('strong').first().innerText(), 10);
    expect(attemptsBeforeReload).toBeGreaterThanOrEqual(answered);

    await page.reload();
    await expect(page.getByLabel('Child name')).toHaveValue('Dheu E2E');
    await expect(page.getByRole('button', { name: 'Panda' })).toHaveAttribute('aria-pressed', 'true');
    const attemptsAfterReload = Number.parseInt(
      await page.getByLabel('Learning progress').locator('strong').first().innerText(),
      10
    );
    expect(attemptsAfterReload).toBe(attemptsBeforeReload);
  });

  test('story mission unlocks the next location after completion', async ({ page }) => {
    test.setTimeout(120_000);
    await openCleanApp(page);

    await expect(page.getByRole('button', { name: 'Home & Garden: explore' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Farm: explore' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Forest: explore' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Road & School: explore' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'River & Pond: The Puppy by the Pond' })).toBeEnabled();

    const lockedLab = page.getByRole('button', {
      name: "Scientu's Lab: locked until The Puppy by the Pond"
    });
    await expect(lockedLab).toBeDisabled();

    await page.getByRole('button', { name: 'River & Pond: The Puppy by the Pond' }).click();
    await expect(page.getByRole('heading', { name: 'The Puppy by the Pond' })).toBeVisible();
    await page.getByRole('button', { name: 'Start investigation · 6 clues' }).click();

    for (let index = 0; index < 6; index += 1) {
      await answerCurrentQuestion(page);
      await page.getByRole('button', { name: index === 5 ? 'See result' : 'Next' }).click();
    }

    const completion = page.getByLabel('Story mission complete');
    await expect(completion).toBeVisible();
    await expect(completion).toContainText('Pond Helper');
    await expect(completion).toContainText('⭐ 3');

    await page.getByRole('button', { name: 'Back to Dheu’s world' }).click();
    await expect(page.getByLabel('3 story stars')).toBeVisible();
    await expect(page.getByText('6/9 places open')).toBeVisible();
    await expect(page.getByRole('button', { name: "Scientu's Lab: The Invisible Air Mystery" })).toBeEnabled();
  });

  test('35-question SOF pattern mock resumes exact submitted and unsubmitted boundaries', async ({ page }) => {
    await openCleanApp(page);
    await page.getByRole('button', { name: 'Try 35-question mock' }).click();

    await expect(page.getByText('Mock progress saves on this device')).toBeVisible();
    await expect(page.getByText(/^1 \/ 35$/)).toBeVisible();
    const firstPrompt = await page.getByRole('heading', { level: 1 }).innerText();
    await answerCurrentQuestion(page);

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Resume your saved mock' })).toBeVisible();
    await expect(page.getByText('1 of 35 answered · your exact question order is preserved.')).toBeVisible();
    await page.getByRole('button', { name: 'Resume saved mock' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(firstPrompt);
    await expect(page.getByRole('note')).toContainText('Your saved answer is restored.');
    await expect(sessionFeedback(page)).toBeVisible();

    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByText(/^2 \/ 35$/)).toBeVisible();
    const secondPrompt = await page.getByRole('heading', { level: 1 }).innerText();
    await expect(page.getByRole('note')).toHaveCount(0);

    await page.reload();
    await expect(page.getByText('1 of 35 answered · your exact question order is preserved.')).toBeVisible();
    await page.getByRole('button', { name: 'Resume saved mock' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(secondPrompt);
    await expect(page.getByRole('note')).toHaveCount(0);

    await answerCurrentQuestion(page);
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByText(/^3 \/ 35$/)).toBeVisible();
    const thirdPrompt = await page.getByRole('heading', { level: 1 }).innerText();
    await answerCurrentQuestion(page);

    await page.reload();
    await expect(page.getByText('3 of 35 answered · your exact question order is preserved.')).toBeVisible();
    await page.getByRole('button', { name: 'Resume saved mock' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(thirdPrompt);
    await expect(page.getByRole('note')).toContainText('Your saved answer is restored.');
    await expect(page.getByText(/^3 \/ 35$/)).toBeVisible();
  });

  test('reduced-motion mode keeps animated surfaces static and the learning flow usable', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openCleanApp(page);

    expect(await page.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
    const motion = page.locator('.motion--bounce').first();
    await expect(motion).toBeVisible();
    const style = await motion.evaluate((element) => {
      const computed = window.getComputedStyle(element);
      return {
        duration: computed.animationDuration,
        iterations: computed.animationIterationCount
      };
    });
    expect(await cssTimeToMilliseconds(style.duration)).toBeLessThanOrEqual(1);
    expect(style.iterations).toBe('1');

    await page.getByRole('button', { name: 'Play free' }).click();
    await answerCurrentQuestion(page);
    await expect(sessionFeedback(page)).toBeVisible();
    await expect(page.getByRole('button', { name: /Next|See result/ })).toBeEnabled();
  });
});
