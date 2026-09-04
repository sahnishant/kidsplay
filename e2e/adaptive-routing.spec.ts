import { expect, test, type Page } from '@playwright/test';
import { answerCurrentQuestion, openCleanApp } from './helpers/childJourney';

async function openForestMissionSession(page: Page) {
  await page.getByRole('button', { name: 'Continue Adventure' }).click();
  const mission = page.getByRole('dialog');
  await expect(mission.getByRole('heading', { name: 'The Forest Trail Mix-Up' })).toBeVisible();

  const nextBeat = mission.getByRole('button', { name: 'Next story beat' });
  for (let index = 0; index < 4 && await nextBeat.isVisible(); index += 1) {
    await nextBeat.click();
  }
  await mission.getByRole('button', { name: /Start investigation/ }).click();

  const session = page.locator('.session-host');
  await expect(session).toBeVisible();
  await expect(session.getByText('The Forest Trail Mix-Up', { exact: true })).toBeVisible();
  await expect(session.getByText('1 / 7', { exact: true })).toBeVisible();
  return session;
}

async function ageLearningEvidence(page: Page): Promise<void> {
  await page.evaluate(() => {
    const key = 'kidsplay.progress.v1';
    const raw = window.localStorage.getItem(key);
    if (!raw) throw new Error('Expected persisted learning evidence');
    const snapshot = JSON.parse(raw) as { attempts?: Array<{ submittedAt: string }>; updatedAt?: string | null };
    if (!(snapshot.attempts?.length)) throw new Error('Expected at least one submitted evaluative attempt');
    const old = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    for (const attempt of snapshot.attempts) attempt.submittedAt = old;
    snapshot.updatedAt = old;
    window.localStorage.setItem(key, JSON.stringify(snapshot));
  });
}

test.describe('Adaptive Continue Adventure', () => {
  test('weaves due real evidence into the current story and survives process-kill/relaunch at 360x640', async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 360, height: 640 });
    await openCleanApp(page);

    // Establish one real evaluated concept through the actual current Forest mission.
    const initialMissionSession = await openForestMissionSession(page);
    const initialQuestion = await answerCurrentQuestion(page);
    expect(initialQuestion.prompt.trim().length).toBeGreaterThan(0);
    await initialMissionSession.getByRole('button', { name: 'Back to Kidsplay home' }).click();

    // Age only canonical response evidence. No adaptive store/timer is created.
    await ageLearningEvidence(page);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Forest Explorer Trail' })).toBeVisible();

    // Continue Adventure remains story-first: the adaptive beat is woven into the
    // same seven-clue Forest mission instead of opening a labelled review queue.
    const adaptiveMissionSession = await openForestMissionSession(page);
    const firstAdaptivePrompt = await adaptiveMissionSession.getByRole('heading', { level: 1 }).innerText();
    expect(firstAdaptivePrompt.trim().length).toBeGreaterThan(0);
    await expect(page.getByText(/weak topic|mastery percentage|overdue review|streak|\bXP\b/i)).toHaveCount(0);

    const dimensions = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      viewport: document.documentElement.clientWidth
    }));
    expect(dimensions.width).toBeLessThanOrEqual(dimensions.viewport + 1);

    // Simulate a hard process kill: active mission/router memory disappears while
    // persisted attempt evidence remains. The rebuilt decision must be identical.
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Forest Explorer Trail' })).toBeVisible();
    const relaunchedMissionSession = await openForestMissionSession(page);
    await expect(relaunchedMissionSession.getByRole('heading', { level: 1 })).toHaveText(firstAdaptivePrompt);
    await expect(relaunchedMissionSession.getByText('1 / 7', { exact: true })).toBeVisible();
  });
});
