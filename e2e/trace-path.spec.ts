import { expect, test, type Page } from '@playwright/test';
import { openCleanApp, sessionFeedback } from './helpers/childJourney';

test.use({ viewport: { width: 360, height: 640 } });

type Point = { x: number; y: number };

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 1);
}

async function drawTrace(page: Page, boardLabel: string, points: readonly Point[]): Promise<void> {
  const board = page.getByRole('group', { name: boardLabel });
  await expect(board).toBeVisible();
  const box = await board.boundingBox();
  expect(box).not.toBeNull();

  const screenPoint = (point: Point) => ({
    x: box!.x + box!.width * point.x,
    y: box!.y + box!.height * point.y
  });

  const first = screenPoint(points[0]);
  await page.mouse.move(first.x, first.y);
  await page.mouse.down();
  for (const point of points.slice(1)) {
    const target = screenPoint(point);
    await page.mouse.move(target.x, target.y, { steps: 3 });
  }
  await page.mouse.up();
}

const underPath: Point[] = [
  { x: 0.1, y: 0.76 }, { x: 0.22, y: 0.76 }, { x: 0.34, y: 0.77 },
  { x: 0.46, y: 0.79 }, { x: 0.58, y: 0.78 }, { x: 0.72, y: 0.76 }, { x: 0.9, y: 0.76 }
];
const insidePath: Point[] = [
  { x: 0.12, y: 0.64 }, { x: 0.24, y: 0.63 }, { x: 0.36, y: 0.62 },
  { x: 0.48, y: 0.62 }, { x: 0.58, y: 0.62 }, { x: 0.67, y: 0.62 }, { x: 0.77, y: 0.62 }
];
const pullPath: Point[] = [
  { x: 0.88, y: 0.68 }, { x: 0.76, y: 0.68 }, { x: 0.64, y: 0.67 },
  { x: 0.52, y: 0.66 }, { x: 0.4, y: 0.65 }, { x: 0.29, y: 0.63 }, { x: 0.18, y: 0.62 }
];

test('Trace & Discover gives honest retry and completes three pointer traces without a Check step', async ({ page }) => {
  test.setTimeout(60_000);
  await openCleanApp(page);

  await page.getByRole('button', { name: 'Open practice activities' }).click();
  await expect(page.getByRole('heading', { name: 'Trace & Discover' })).toBeVisible();
  await page.getByRole('button', { name: 'Trace paths' }).click();

  await expect(page.getByRole('heading', { name: "Trace the ball's path under the bridge." })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Check path' })).toHaveCount(0);
  await expectNoHorizontalOverflow(page);

  await drawTrace(page, 'A ball moving along a dotted path under a bridge', [
    { x: 0.1, y: 0.76 }, { x: 0.24, y: 0.25 }, { x: 0.4, y: 0.18 },
    { x: 0.56, y: 0.18 }, { x: 0.72, y: 0.25 }, { x: 0.9, y: 0.76 }
  ]);
  await expect(sessionFeedback(page)).toContainText('Give it another try');
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();

  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('heading', { name: "Trace the ball's path under the bridge." })).toBeVisible();
  await expect(page.getByText('Try again', { exact: true })).toBeVisible();
  await drawTrace(page, 'A ball moving along a dotted path under a bridge', underPath);
  await expect(sessionFeedback(page)).toContainText('Nice work!');
  await expect(sessionFeedback(page)).toContainText('The ball travelled under the bridge');

  await expect(page.getByRole('heading', { name: "Trace the toy's path inside the box." })).toBeVisible({ timeout: 5_000 });
  await expect(page.getByRole('button', { name: 'Check path' })).toHaveCount(0);
  await drawTrace(page, 'A toy moving from outside to inside a box', insidePath);
  await expect(sessionFeedback(page)).toContainText('Nice work!');

  await expect(page.getByRole('heading', { name: 'Trace the wagon moving toward the child who pulls it.' })).toBeVisible({ timeout: 5_000 });
  await drawTrace(page, 'A wagon following a dotted path toward a child', pullPath);
  await expect(sessionFeedback(page)).toContainText('Nice work!');

  await expect(page.getByRole('heading', { name: /Nice work, Dheu/ })).toBeVisible({ timeout: 5_000 });
  await expectNoHorizontalOverflow(page);
});
