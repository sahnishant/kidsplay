import { expect, test, type Page } from '@playwright/test';
import { openCleanApp } from './helpers/childJourney';

async function openWorkshop(page: Page): Promise<void> {
  await page.getByLabel('Open child navigation').click();
  await page.getByRole('button', { name: 'Open practice activities' }).click();
  await page.getByRole('button', { name: 'Open chapter' }).click();
  await expect(page.getByRole('heading', { name: 'Bicycle Workshop', exact: true })).toBeVisible();
}

async function revealLastIdea(page: Page): Promise<void> {
  const nextIdea = page.getByRole('button', { name: 'Next idea', exact: true });
  while (await nextIdea.isVisible().catch(() => false)) {
    await nextIdea.click();
  }
}

function workshopNav(page: Page) {
  return page.getByRole('navigation', { name: 'Bicycle Workshop learning sections' });
}

async function openFinalSection(page: Page): Promise<void> {
  await workshopNav(page).getByRole('button', { name: '7 Ready', exact: true }).click();
  await expect(page.getByText('7/7', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Get ready before you go' })).toBeVisible();
  await revealLastIdea(page);
  await expect(page.getByText('Helmet. Brakes. Tyres. Then ride.', { exact: true })).toBeVisible();
}

test.describe('Bicycle Workshop chapter vertical', () => {
  test('runs the story-led seven-section Learn journey at 360x640', async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 360, height: 640 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openCleanApp(page);
    await openWorkshop(page);

    const nav = workshopNav(page);
    await expect(page.getByText('1/7', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Meet the bicycle' })).toBeVisible();
    await expect(page.locator('p.look')).toContainText('Find both wheels. Then look for the bell near the handle.');
    await expect(page.getByRole('button', { name: 'Next idea', exact: true })).toBeVisible();
    await expect(nav.getByRole('button')).toHaveCount(7);
    await expect(page.getByText(/My Bicycle|Mridang|NCERT|CBSE/i)).toHaveCount(0);
    await expect(page.getByRole('button', { name: '🔔 Tap the bell', exact: true })).toBeVisible();

    await revealLastIdea(page);
    await expect(page.getByText('A rider powers the bicycle, and a bell can make a useful signal.', { exact: true })).toBeVisible();
    await expect(page.getByText('No score here — just explore.', { exact: true })).toBeVisible();

    await nav.getByRole('button', { name: '2 Parts', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Seven parts to find' })).toBeVisible();
    for (const part of ['Seat', 'Pedal', 'Wheel', 'Bell', 'Handle', 'Carrier', 'Brake']) {
      await expect(page.getByRole('button', { name: part, exact: true })).toBeVisible();
    }

    await nav.getByRole('button', { name: '3 Look inside', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'How does the pedal make it go?' })).toBeVisible();
    await expect(page.getByText('LOOK INSIDE', { exact: true })).toBeVisible();
    await expect(page.getByText('Kidsplay extra · no score', { exact: true })).toBeVisible();
    await expect(page.locator('p.look')).toContainText('pedal where the foot pushes');
    const movementTrace = page.getByLabel('Movement shown so far');
    const pushPedal = page.getByRole('button', { name: 'Push the pedal', exact: true });
    await expect(pushPedal).toBeVisible();
    await pushPedal.click();
    await expect(page.getByRole('button', { name: 'See what moves next', exact: true })).toBeVisible();
    await expect(movementTrace.getByText('CRANK', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Open idea 2: MAKE IT SLOW', exact: true }).click();
    const squeeze = page.getByRole('button', { name: 'Squeeze the lever', exact: true });
    await expect(squeeze).toBeVisible();
    await squeeze.click();
    await expect(page.getByRole('button', { name: 'Watch the wheel', exact: true })).toBeVisible();
    await expect(page.getByLabel('Movement shown so far').getByText('BRAKE', { exact: true })).toBeVisible();

    await nav.getByRole('button', { name: '4 Sounds', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Ring, listen, say' })).toBeVisible();
    await expect(page.getByRole('button', { name: '🔔 Tap the bell', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /Build BELL/ })).toBeVisible();

    await nav.getByRole('button', { name: '5 Magic ride', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Where could it take you?' })).toBeVisible();
    await page.getByRole('button', { name: 'Cloud garden', exact: true }).click();
    await expect(page.getByText('Your bicycle is heading to Cloud garden. What do you notice there?', { exact: true })).toBeVisible();

    await nav.getByRole('button', { name: '6 Read', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Follow a tiny ride story' })).toBeVisible();
    await expect(page.getByText('Ria fastens her helmet. She checks the brakes. Then she begins to pedal.', { exact: true })).toBeVisible();

    await nav.getByRole('button', { name: '7 Ready', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Get ready before you go' })).toBeVisible();
    for (const check of ['Helmet', 'Brakes', 'Tyres']) {
      await page.getByRole('button', { name: check, exact: true }).click();
    }
    await expect(page.getByText('Helmet, brakes and tyres checked. Ready.', { exact: true })).toBeVisible();
    await revealLastIdea(page);
    await expect(page.getByRole('button', { name: 'Practice', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Chapter check', exact: true })).toBeVisible();

    const dimensions = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      viewport: document.documentElement.clientWidth
    }));
    expect(dimensions.width).toBeLessThanOrEqual(dimensions.viewport + 1);
  });

  test('launches both assessed surfaces through the existing session engine', async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await openCleanApp(page);
    await openWorkshop(page);
    await openFinalSection(page);

    await page.getByRole('button', { name: 'Practice', exact: true }).click();
    await expect(page.getByText('Bicycle Workshop — Class 2 English', { exact: true })).toBeVisible();
    await expect(page.getByText(/1 \/ 8/)).toBeVisible();

    await openCleanApp(page);
    await openWorkshop(page);
    await openFinalSection(page);
    await page.getByRole('button', { name: 'Chapter check', exact: true }).click();
    await expect(page.getByText('Bicycle Workshop — Chapter Check', { exact: true })).toBeVisible();
    await expect(page.getByText(/1 \/ 8/)).toBeVisible();
  });
});
