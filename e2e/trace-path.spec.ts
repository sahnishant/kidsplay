import { expect, test, type Page } from '@playwright/test';
import { openCleanApp, sessionFeedback } from './helpers/childJourney';

test.use({ viewport: { width: 360, height: 640 } });

type Point = { x: number; y: number };
type TraceCase = {
  prompt: string;
  boardLabel: string;
  path: readonly Point[];
  successText?: string;
};

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

const traceCases: readonly TraceCase[] = [
  {
    prompt: "Trace the ball's path under the bridge.",
    boardLabel: 'A ball moving along a dotted path under a bridge',
    path: [
      { x: 0.1, y: 0.76 }, { x: 0.22, y: 0.76 }, { x: 0.34, y: 0.77 },
      { x: 0.46, y: 0.79 }, { x: 0.58, y: 0.78 }, { x: 0.72, y: 0.76 }, { x: 0.9, y: 0.76 }
    ],
    successText: 'The ball travelled under the bridge'
  },
  {
    prompt: "Trace the toy's path inside the box.",
    boardLabel: 'A toy moving from outside to inside a box',
    path: [
      { x: 0.12, y: 0.64 }, { x: 0.24, y: 0.63 }, { x: 0.36, y: 0.62 },
      { x: 0.48, y: 0.62 }, { x: 0.58, y: 0.62 }, { x: 0.67, y: 0.62 }, { x: 0.77, y: 0.62 }
    ]
  },
  {
    prompt: 'Trace the wagon moving toward the child who pulls it.',
    boardLabel: 'A wagon following a dotted path toward a child',
    path: [
      { x: 0.88, y: 0.68 }, { x: 0.76, y: 0.68 }, { x: 0.64, y: 0.67 },
      { x: 0.52, y: 0.66 }, { x: 0.4, y: 0.65 }, { x: 0.29, y: 0.63 }, { x: 0.18, y: 0.62 }
    ]
  }
];

async function waitForTraceCase(page: Page, seen = new Set<string>()): Promise<TraceCase> {
  const heading = page.getByRole('heading', { level: 1 });
  await expect(heading).toHaveText(/^Trace /, { timeout: 7_000 });
  const prompt = (await heading.innerText()).trim();
  const traceCase = traceCases.find((candidate) => candidate.prompt === prompt);
  if (!traceCase) throw new Error(`Unexpected Trace & Discover prompt: ${prompt}`);
  if (seen.has(prompt)) throw new Error(`Trace & Discover repeated a completed prompt: ${prompt}`);
  return traceCase;
}

function deliberatelyWrongPath(traceCase: TraceCase): Point[] {
  const first = traceCase.path[0];
  const last = traceCase.path[traceCase.path.length - 1];
  return [
    first,
    { x: first.x + (last.x - first.x) * 0.25, y: 0.18 },
    { x: first.x + (last.x - first.x) * 0.5, y: 0.14 },
    { x: first.x + (last.x - first.x) * 0.75, y: 0.18 },
    last
  ];
}

test('Trace & Discover gives honest retry and completes three pointer traces without a Check step', async ({ page }) => {
  test.setTimeout(60_000);
  await openCleanApp(page);

  await page.getByLabel('Open child navigation').click();
  await page.getByRole('button', { name: 'Open practice activities' }).click();
  await expect(page.getByRole('heading', { name: 'Trace & Discover' })).toBeVisible();
  await page.getByRole('button', { name: 'Trace paths' }).click();

  const completed = new Set<string>();
  const first = await waitForTraceCase(page);
  await expect(page.getByRole('button', { name: 'Check path' })).toHaveCount(0);
  await expectNoHorizontalOverflow(page);

  await drawTrace(page, first.boardLabel, deliberatelyWrongPath(first));
  await expect(sessionFeedback(page)).toContainText('Give it another try');
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();

  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(first.prompt);
  await expect(
    page.locator('[data-session-state="answer"] .question-meta .reasoning-cue').filter({ hasText: /^Try again$/ })
  ).toBeVisible();
  await drawTrace(page, first.boardLabel, first.path);
  await expect(sessionFeedback(page)).toContainText('Nice work!');
  if (first.successText) await expect(sessionFeedback(page)).toContainText(first.successText);
  completed.add(first.prompt);
  await page.getByRole('button', { name: 'Next' }).click();

  while (completed.size < traceCases.length) {
    const current = await waitForTraceCase(page, completed);
    await expect(page.getByRole('button', { name: 'Check path' })).toHaveCount(0);
    await drawTrace(page, current.boardLabel, current.path);
    await expect(sessionFeedback(page)).toContainText('Nice work!');
    if (current.successText) await expect(sessionFeedback(page)).toContainText(current.successText);
    completed.add(current.prompt);
    await page.getByRole('button', { name: completed.size === traceCases.length ? 'Finish' : 'Next' }).click();
  }

  expect(completed).toEqual(new Set(traceCases.map((traceCase) => traceCase.prompt)));
  await expect(page.locator('.completion-viewport').getByRole('heading', { name: /^Nice work,/ })).toBeVisible({ timeout: 7_000 });
  await expectNoHorizontalOverflow(page);
});
