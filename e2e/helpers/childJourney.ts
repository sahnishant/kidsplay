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

type IndexedLabel = {
  index: number;
  label: string;
};

export async function openCleanApp(page: Page): Promise<void> {
  await page.goto('/');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Forest Explorer Trail' })).toBeVisible();
}

export function sessionFeedback(page: Page): Locator {
  return page.getByRole('status').filter({ hasText: /Nice work!|Give it another try|Here’s a clue|Try this idea/ }).first();
}

function retryButton(page: Page): Locator {
  return page.getByRole('button', { name: /Try again|Try with this clue/ }).first();
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

async function indexedLabels(buttons: Locator): Promise<IndexedLabel[]> {
  const entries: IndexedLabel[] = [];
  for (let index = 0; index < await buttons.count(); index += 1) {
    entries.push({ index, label: (await buttons.nth(index).innerText()).trim() });
  }
  return entries.sort((left, right) => left.label.localeCompare(right.label));
}

function factorial(value: number): number {
  let result = 1;
  for (let factor = 2; factor <= value; factor += 1) result *= factor;
  return result;
}

function permutationForAttempt<T>(values: readonly T[], attempt: number): T[] {
  const remaining = [...values];
  const result: T[] = [];
  let rank = attempt % factorial(remaining.length);

  while (remaining.length > 0) {
    const blockSize = factorial(remaining.length - 1);
    const index = Math.floor(rank / blockSize);
    rank %= blockSize;
    result.push(remaining.splice(index, 1)[0]);
  }
  return result;
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

async function submitCheckAnswerIfPresent(page: Page): Promise<void> {
  const checkAnswer = page.getByRole('button', { name: 'Check answer' });
  if (!(await checkAnswer.count())) return;
  await expect(checkAnswer).toBeEnabled();
  await checkAnswer.click();
}

async function answerSingleChoice(page: Page, attempt: number): Promise<void> {
  const buttons = page.locator('.choice-grid').getByRole('button');
  const options = await indexedLabels(buttons);
  if (options.length === 0) throw new Error('Single-choice question has no options');
  await buttons.nth(options[attempt % options.length].index).click();
}

async function answerDragToTarget(page: Page, attempt: number): Promise<void> {
  const itemButtons = page.locator('.drag-items .drag-item');
  const targetButtons = page.locator('.target-grid .drop-target');
  const items = await indexedLabels(itemButtons);
  const targets: IndexedLabel[] = [];

  for (let index = 0; index < await targetButtons.count(); index += 1) {
    targets.push({
      index,
      label: (await targetButtons.nth(index).locator('strong').innerText()).trim()
    });
  }
  targets.sort((left, right) => left.label.localeCompare(right.label));

  if (items.length === 0 || targets.length === 0) throw new Error('Matching question has no items or targets');

  const assignmentTargets = items.length === targets.length && targets.length <= 7
    ? permutationForAttempt(targets, attempt)
    : items.map((_, itemIndex) => {
        const divisor = Math.max(1, targets.length ** itemIndex);
        return targets[Math.floor(attempt / divisor) % targets.length];
      });

  for (let itemIndex = 0; itemIndex < items.length; itemIndex += 1) {
    await itemButtons.nth(items[itemIndex].index).press('Enter');
    await targetButtons.nth(assignmentTargets[itemIndex].index).press('Enter');
  }
  await submitCheckAnswerIfPresent(page);
}

async function answerWordBankFill(page: Page, attempt: number): Promise<void> {
  const blanks = page.getByRole('button', { name: 'Blank answer' });
  const wordButtons = page.locator('.word-bank').getByRole('button');
  const words = await indexedLabels(wordButtons);
  const blankCount = await blanks.count();

  if (blankCount === 0 || words.length === 0) throw new Error('Word-bank question has no blanks or words');

  for (let blankIndex = 0; blankIndex < blankCount; blankIndex += 1) {
    const divisor = Math.max(1, words.length ** blankIndex);
    const word = words[Math.floor(attempt / divisor) % words.length];
    await blanks.nth(blankIndex).click();
    await wordButtons.nth(word.index).click();
  }
  await submitCheckAnswerIfPresent(page);
}

async function answerByEngine(page: Page, engine: EngineKind, attempt = 0): Promise<void> {
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
    await answerDragToTarget(page, attempt);
    return;
  }
  if (engine === 'word_bank_fill') {
    await answerWordBankFill(page, attempt);
    return;
  }
  if (engine === 'hotspot') {
    await page.locator('.hotspot__region').first().click();
    await submitCheckAnswerIfPresent(page);
    return;
  }

  await answerSingleChoice(page, attempt);
}

export async function answerCurrentQuestion(page: Page): Promise<AnsweredQuestion> {
  await expect(page.locator('.interaction-host')).toBeVisible({ timeout: 10_000 });
  const prompt = await page.getByRole('heading', { level: 1 }).innerText();
  const engine = await detectEngine(page);
  const visualSingleChoice = engine === 'single_choice' && await page.locator('.choice-button--visual').count() > 0;

  for (let attempt = 0; attempt < 128; attempt += 1) {
    await answerByEngine(page, engine, attempt);
    await expect(sessionFeedback(page)).toBeVisible({ timeout: 15_000 });

    const retry = retryButton(page);
    if (!(await retry.isVisible())) return { engine, prompt, visualSingleChoice };

    await retry.click();
    await expect(page.locator('.interaction-host')).toBeVisible({ timeout: 10_000 });
  }

  throw new Error(`Child-journey solver exhausted retry attempts for ${engine}: ${prompt}`);
}

export async function cssTimeToMilliseconds(value: string): Promise<number> {
  const normalized = value.trim();
  if (normalized.endsWith('ms')) return Number.parseFloat(normalized);
  if (normalized.endsWith('s')) return Number.parseFloat(normalized) * 1_000;
  return Number.NaN;
}
