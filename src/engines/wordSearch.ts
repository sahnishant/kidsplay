import type { WordSearchQuestion } from '../contracts/question';
import type { GridPoint } from '../mechanics/grid';
import { lineBetween, pointKey, samePoint } from '../mechanics/grid';
import { generateWordSearch, normalizeSearchWord } from '../mechanics/wordSearch';
import type { InteractionEngine } from './types';

function asWordSearch(question: Parameters<InteractionEngine['mount']>[0]['question']): WordSearchQuestion {
  if (question.interaction.type !== 'word_search') throw new Error('wordSearchEngine received wrong question type');
  return question;
}

export const wordSearchEngine: InteractionEngine = {
  key: 'word_search@1',
  mount: ({ question: rawQuestion, host, onSubmit }) => {
    const question = asWordSearch(rawQuestion);
    const generated = generateWordSearch({
      terms: question.interaction.terms,
      seed: question.interaction.seed,
      size: question.interaction.gridSize,
      directions: question.interaction.directions,
      alphabet: question.interaction.alphabet
    });

    const wrapper = document.createElement('div');
    wrapper.className = 'word-search';

    const instructions = document.createElement('p');
    instructions.className = 'word-search__instructions';
    instructions.textContent = 'Drag across a word, or tap its first and last letters.';

    const termList = document.createElement('div');
    termList.className = 'word-search__terms';
    termList.setAttribute('aria-label', 'Words to find');

    const termElements = new Map<string, HTMLElement>();
    for (const term of question.interaction.terms) {
      const chip = document.createElement('span');
      chip.className = 'word-search__term';
      chip.textContent = term.label;
      termElements.set(term.id, chip);
      termList.append(chip);
    }

    const grid = document.createElement('div');
    grid.className = 'word-search__grid';
    grid.style.setProperty('--word-search-size', String(generated.grid.length));
    grid.setAttribute('role', 'grid');
    grid.setAttribute('aria-label', 'Word search letter grid');

    const cellButtons = new Map<string, HTMLButtonElement>();
    generated.grid.forEach((row, rowIndex) => {
      row.forEach((letter, colIndex) => {
        const point = { row: rowIndex, col: colIndex };
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'word-search__cell';
        cell.textContent = letter;
        cell.dataset.row = String(rowIndex);
        cell.dataset.col = String(colIndex);
        cell.setAttribute('role', 'gridcell');
        cell.setAttribute('aria-label', `Row ${rowIndex + 1}, column ${colIndex + 1}, ${letter}`);
        cellButtons.set(pointKey(point), cell);
        grid.append(cell);
      });
    });

    const liveStatus = document.createElement('div');
    liveStatus.className = 'word-search__status';
    liveStatus.setAttribute('role', 'status');
    liveStatus.setAttribute('aria-live', 'polite');
    liveStatus.textContent = `${question.interaction.terms.length} words to find.`;

    const finish = document.createElement('button');
    finish.type = 'button';
    finish.className = 'primary-button';
    finish.textContent = 'Finish word search';

    const foundTermIds = new Set<string>();
    const foundCellKeys = new Set<string>();
    let tapStart: GridPoint | null = null;
    let dragStart: GridPoint | null = null;
    let dragEnd: GridPoint | null = null;
    let dragPointerId: number | null = null;
    let dragMoved = false;

    const clearPreview = (): void => {
      for (const button of cellButtons.values()) button.classList.remove('word-search__cell--preview');
    };

    const showPreview = (points: readonly GridPoint[]): void => {
      clearPreview();
      for (const point of points) cellButtons.get(pointKey(point))?.classList.add('word-search__cell--preview');
    };

    const pointFromElement = (element: Element | null): GridPoint | null => {
      const cell = element?.closest<HTMLElement>('.word-search__cell');
      if (!cell || !grid.contains(cell)) return null;
      const row = Number(cell.dataset.row);
      const col = Number(cell.dataset.col);
      return Number.isInteger(row) && Number.isInteger(col) ? { row, col } : null;
    };

    const selectedLetters = (points: readonly GridPoint[]): string =>
      points.map((point) => generated.grid[point.row][point.col]).join('');

    const resolveSelection = (start: GridPoint, end: GridPoint): void => {
      const points = lineBetween(start, end);
      clearPreview();

      if (!points || points.length < 2) {
        liveStatus.textContent = 'Choose letters in a straight horizontal, vertical or diagonal line.';
        return;
      }

      const selected = selectedLetters(points);
      const reversed = Array.from(selected).reverse().join('');
      const term = question.interaction.terms.find((candidate) => {
        if (foundTermIds.has(candidate.id)) return false;
        const word = normalizeSearchWord(candidate.word).join('');
        return word === selected || word === reversed;
      });

      if (!term) {
        liveStatus.textContent = 'That is not one of the words yet. Try another line.';
        return;
      }

      foundTermIds.add(term.id);
      points.forEach((point) => foundCellKeys.add(pointKey(point)));
      foundCellKeys.forEach((key) => cellButtons.get(key)?.classList.add('word-search__cell--found'));
      termElements.get(term.id)?.classList.add('word-search__term--found');

      const remaining = question.interaction.terms.length - foundTermIds.size;
      liveStatus.textContent = remaining
        ? `${term.label} found. ${remaining} word${remaining === 1 ? '' : 's'} left.`
        : 'You found every word.';
      if (!remaining) finish.textContent = 'All found — continue';
    };

    const handleTap = (point: GridPoint): void => {
      if (!tapStart) {
        tapStart = point;
        showPreview([point]);
        liveStatus.textContent = 'Now tap the last letter of the word.';
        return;
      }

      if (samePoint(tapStart, point)) {
        tapStart = null;
        clearPreview();
        liveStatus.textContent = 'Selection cleared.';
        return;
      }

      const start = tapStart;
      tapStart = null;
      resolveSelection(start, point);
    };

    grid.addEventListener('pointerdown', (event) => {
      const point = pointFromElement(event.target as Element | null);
      if (!point) return;
      dragStart = point;
      dragEnd = point;
      dragMoved = false;
      dragPointerId = event.pointerId;
      grid.setPointerCapture(event.pointerId);
      showPreview([point]);
    });

    grid.addEventListener('pointermove', (event) => {
      if (dragPointerId !== event.pointerId || !dragStart) return;
      const point = pointFromElement(document.elementFromPoint(event.clientX, event.clientY));
      if (!point) return;
      if (!dragEnd || !samePoint(point, dragEnd)) dragMoved = true;
      dragEnd = point;
      const path = lineBetween(dragStart, point);
      showPreview(path ?? [dragStart]);
    });

    grid.addEventListener('pointerup', (event) => {
      if (dragPointerId !== event.pointerId || !dragStart || !dragEnd) return;
      if (grid.hasPointerCapture(event.pointerId)) grid.releasePointerCapture(event.pointerId);

      const start = dragStart;
      const end = dragEnd;
      const moved = dragMoved;
      dragStart = null;
      dragEnd = null;
      dragPointerId = null;
      dragMoved = false;

      if (moved) {
        tapStart = null;
        resolveSelection(start, end);
      } else {
        handleTap(end);
      }
    });

    grid.addEventListener('pointercancel', (event) => {
      if (dragPointerId !== event.pointerId) return;
      dragStart = null;
      dragEnd = null;
      dragPointerId = null;
      dragMoved = false;
      tapStart = null;
      clearPreview();
    });

    for (const [key, button] of cellButtons) {
      button.addEventListener('click', (event) => {
        if (event.detail !== 0) return;
        const [row, col] = key.split(':').map(Number);
        handleTap({ row, col });
      });
    }

    finish.addEventListener('click', () => {
      finish.disabled = true;
      onSubmit({ foundTermIds: [...foundTermIds] });
    });

    wrapper.append(instructions, termList, grid, liveStatus, finish);
    host.append(wrapper);
  }
};
