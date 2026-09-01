import { expect, type Locator, type Page } from '@playwright/test';

export type EngineKind =
  | 'single_choice'
  | 'word_bank_fill'
  | 'drag_to_target'
  | 'word_search'
  | 'memory_pairs'
  | 'sequence_order'
  | 'hotspot'
  | 'crossword'
  | 'maze_path';

export interface AnsweredQuestion {
  engine: EngineKind;
  prompt: string;
  visualSingleChoice: boolean;
}

export async function openCleanApp(page: Page): Promise<void> {
  await page.goto('/');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Forest Explorer Trail' })).toBeVisible();
}

export function sessionFeedback(page: Page): Locator {
  return page.getByRole('status').filter({ hasText: /Nice work!|Try this idea/ }).first();
}

async function detectEngine(page: Page): Promise<EngineKind> {
  const engineRoots: Array<[EngineKind, string]> = [
    ['memory_pairs', '.memory-pairs'],
    ['maze_path', '.maze-path'],
    ['crossword', '.crossword'],
    ['sequence_order', '.sequence-order'],
    ['word_search', '.word-search'],
    ['drag_to_target', '.drag-stage'],
    ['word_bank_fill', '.fill-sentence'],
    ['hotspot', '.hotspot'],
    ['single_choice', '.choice-grid']
  ];
  for (const [kind, selector] of engineRoots) {
    if (await page.locator(selector).count()) return kind;
  }
  throw new Error('Could not identify the current interaction engine');
}

async function solveMemoryPairs(page: Page): Promise<void> {
  const group = page.getByRole('group', { name: 'Memory cards' });
  const cards = group.getByRole('button');
  const feedback = sessionFeedback(page);
  const cardCount = await cards.count();

  for (let round = 0; round < cardCount && !(await feedback.isVisible()); round += 1) {
    const available: number[] = [];
    for (let index = 0; index < cardCount; index += 1) {
      if (await cards.nth(index).getAttribute('aria-disabled') !== 'true') available.push(index);
    }
    if (available.length < 2) break;

    let foundPair = false;
    for (let firstOffset = 0; firstOffset < available.length - 1 && !foundPair; firstOffset += 1) {
      for (let secondOffset = firstOffset + 1; secondOffset < available.length; secondOffset += 1) {
        const first = cards.nth(available[firstOffset]);
        const second = cards.nth(available[secondOffset]);
        if (await first.getAttribute('aria-disabled') === 'true') break;
        if (await second.getAttribute('aria-disabled') === 'true') continue;

        await first.click();
        await second.click();
        await page.waitForTimeout(1_100);
        if (await feedback.isVisible()) return;
        if (await first.getAttribute('aria-disabled') === 'true') {
          foundPair = true;
          break;
        }
      }
    }
    if (!foundPair) throw new Error('Memory-pairs solver could not find another matching pair');
  }
}

type MazeCell = {
  index: number;
  row: number;
  col: number;
  current: boolean;
  goal: boolean;
  top: boolean;
  right: boolean;
  bottom: boolean;
  left: boolean;
};

async function solveMaze(page: Page): Promise<void> {
  const grid = page.getByRole('grid', { name: /maze to/i });
  const buttons = grid.getByRole('button');
  const cells = await buttons.evaluateAll((elements): MazeCell[] => elements.map((element, index) => {
    const button = element as HTMLButtonElement;
    const match = button.getAttribute('aria-label')?.match(/row (\d+), column (\d+)/i);
    return {
      index,
      row: match ? Number(match[1]) - 1 : -1,
      col: match ? Number(match[2]) - 1 : -1,
      current: button.classList.contains('maze-path__cell--current'),
      goal: button.classList.contains('maze-path__cell--goal'),
      top: Number.parseFloat(button.style.borderTopWidth) > 0,
      right: Number.parseFloat(button.style.borderRightWidth) > 0,
      bottom: Number.parseFloat(button.style.borderBottomWidth) > 0,
      left: Number.parseFloat(button.style.borderLeftWidth) > 0
    };
  }));

  const start = cells.find((cell) => cell.current);
  const goal = cells.find((cell) => cell.goal);
  if (!start || !goal) throw new Error('Maze start or goal could not be identified');

  const byCoordinate = new Map(cells.map((cell) => [`${cell.row}:${cell.col}`, cell]));
  const queue: MazeCell[] = [start];
  const previous = new Map<number, number | null>([[start.index, null]]);
  const directions = [
    { dr: -1, dc: 0, wall: 'top', opposite: 'bottom' },
    { dr: 0, dc: 1, wall: 'right', opposite: 'left' },
    { dr: 1, dc: 0, wall: 'bottom', opposite: 'top' },
    { dr: 0, dc: -1, wall: 'left', opposite: 'right' }
  ] as const;

  while (queue.length && !previous.has(goal.index)) {
    const current = queue.shift()!;
    for (const direction of directions) {
      const next = byCoordinate.get(`${current.row + direction.dr}:${current.col + direction.dc}`);
      if (!next || current[direction.wall] || next[direction.opposite] || previous.has(next.index)) continue;
      previous.set(next.index, current.index);
      queue.push(next);
    }
  }

  if (!previous.has(goal.index)) throw new Error('Maze goal is not reachable from the rendered wall layout');
  const path: number[] = [];
  for (let index: number | null = goal.index; index !== null; index = previous.get(index) ?? null) {
    path.push(index);
  }
  path.reverse();
  for (const index of path.slice(1)) await buttons.nth(index).click();
}

async function answerByEngine(page: Page, engine: EngineKind): Promise<void> {
  if (engine === 'memory_pairs') {
    await solveMemoryPairs(page);
    return;
  }
  if (engine === 'maze_path') {
    await solveMaze(page);
    return;
  }
  if (engine === 'crossword') {
    await page.getByRole('button', { name: 'Check crossword' }).click();
    return;
  }
  if (engine === 'sequence_order') {
    await page.getByRole('button', { name: 'Check order' }).click();
    return;
  }
  if (engine === 'word_search') {
    await page.getByRole('button', { name: /Finish word search|All found — continue/ }).click();
    return;
  }
  if (engine === 'drag_to_target') {
    const items = page.locator('.drag-items .drag-item');
    const target = page.locator('.target-grid .drop-target').first();
    const itemCount = await items.count();
    expect(itemCount).toBeGreaterThan(0);
    for (let index = 0; index < itemCount; index += 1) {
      await items.nth(index).press('Enter');
      await target.press('Enter');
    }
    const checkAnswer = page.getByRole('button', { name: 'Check answer' });
    await expect(checkAnswer).toBeEnabled();
    await checkAnswer.click();
    return;
  }
  if (engine === 'word_bank_fill') {
    const blanks = page.getByRole('button', { name: 'Blank answer' });
    const words = page.locator('.word-bank').getByRole('button');
    for (let index = 0; index < await blanks.count(); index += 1) {
      await blanks.nth(index).click();
      await words.first().click();
    }
    await page.getByRole('button', { name: 'Check answer' }).click();
    return;
  }
  if (engine === 'hotspot') {
    await page.locator('.hotspot__region').first().click();
    await page.getByRole('button', { name: 'Check answer' }).click();
    return;
  }

  await page.locator('.choice-grid').getByRole('button').first().click();
  await page.getByRole('button', { name: 'Check answer' }).click();
}

export async function answerCurrentQuestion(page: Page): Promise<AnsweredQuestion> {
  await expect(page.locator('.interaction-host')).toBeVisible({ timeout: 10_000 });
  const prompt = await page.getByRole('heading', { level: 1 }).innerText();
  const engine = await detectEngine(page);
  const visualSingleChoice = engine === 'single_choice' && await page.locator('.choice-button--visual').count() > 0;
  await answerByEngine(page, engine);
  await expect(sessionFeedback(page)).toBeVisible({ timeout: 15_000 });
  return { engine, prompt, visualSingleChoice };
}

export async function cssTimeToMilliseconds(value: string): Promise<number> {
  const normalized = value.trim();
  if (normalized.endsWith('ms')) return Number.parseFloat(normalized);
  if (normalized.endsWith('s')) return Number.parseFloat(normalized) * 1_000;
  return Number.NaN;
}
