import { expect, test } from '@playwright/test';
import { answerCurrentQuestion, openCleanApp } from './helpers/childJourney';

const FOREST_TOPICS = new Set(['animals', 'plants']);

async function hasForestEvidence(page: import('@playwright/test').Page): Promise<boolean> {
  return page.evaluate((topics) => {
    const raw = window.localStorage.getItem('kidsplay.progress.v1');
    if (!raw) return false;
    const snapshot = JSON.parse(raw) as { attempts?: Array<{ knowledgeRefs?: string[]; conceptIds?: string[] }> };
    return (snapshot.attempts ?? []).some((attempt) => {
      const refParts = (attempt.knowledgeRefs ?? []).flatMap((ref) => ref.split('.'));
      const conceptParts = (attempt.conceptIds ?? []).flatMap((ref) => ref.split('.'));
      return [...refParts, ...conceptParts].some((part) => topics.includes(part));
    });
  }, [...FOREST_TOPICS]);
}

async function ageLearningEvidence(page: import('@playwright/test').Page): Promise<void> {
  await page.evaluate(() => {
    const key = 'kidsplay.progress.v1';
    const raw = window.localStorage.getItem(key);
    if (!raw) throw new Error('Expected persisted learning evidence');
    const snapshot = JSON.parse(raw) as { attempts?: Array<{ submittedAt: string }>; updatedAt?: string | null };
    const old = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    for (const attempt of snapshot.attempts ?? []) attempt.submittedAt = old;
    snapshot.updatedAt = old;
    window.localStorage.setItem(key, JSON.stringify(snapshot));
  });
}

test.describe('Adaptive Continue Adventure', () => {
  test('silently routes due real evidence and survives process-kill/relaunch at 360x640', async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 360, height: 640 });
    await openCleanApp(page);

    await page.getByRole('button', { name: 'Open practice activities' }).click();
    await page.getByRole('button', { name: 'Play free' }).click();

    let forestEvidence = false;
    for (let index = 0; index < 8; index += 1) {
      await answerCurrentQuestion(page);
      forestEvidence = await hasForestEvidence(page);
      if (forestEvidence) break;
      await page.getByRole('button', { name: index === 7 ? 'See result' : 'Next' }).click();
    }
    expect(forestEvidence, 'the real free-play pack should yield at least one forest-compatible evaluated concept').toBe(true);

    await page.getByRole('button', { name: 'Back to Kidsplay home' }).click();
    await ageLearningEvidence(page);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Forest Explorer Trail' })).toBeVisible();

    await page.getByRole('button', { name: 'Continue Adventure' }).click();
    const adaptiveSession = page.locator('.session-host');
    await expect(adaptiveSession).toBeVisible();
    const firstPrompt = await adaptiveSession.getByRole('heading', { level: 1 }).innerText();
    expect(firstPrompt.trim().length).toBeGreaterThan(0);

    await expect(page.getByText(/weak topic|mastery percentage|overdue review|streak|\bXP\b/i)).toHaveCount(0);
    const dimensions = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      viewport: document.documentElement.clientWidth
    }));
    expect(dimensions.width).toBeLessThanOrEqual(dimensions.viewport + 1);

    // Simulate a hard process kill: active route/session memory disappears, local evidence remains.
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Forest Explorer Trail' })).toBeVisible();
    await page.getByRole('button', { name: 'Continue Adventure' }).click();
    await expect(page.locator('.session-host')).toBeVisible();
    await expect(page.locator('.session-host').getByRole('heading', { level: 1 })).toHaveText(firstPrompt);
  });
});
