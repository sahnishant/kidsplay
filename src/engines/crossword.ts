import type { CrosswordEntry, CrosswordQuestion } from '../contracts/question';
import type { InteractionEngine } from './types';

const cellKey = (row: number, col: number): string => `${row}:${col}`;

function asCrossword(question: Parameters<InteractionEngine['mount']>[0]['question']): CrosswordQuestion {
  if (question.interaction.type !== 'crossword') throw new Error('crosswordEngine received wrong question type');
  return question as CrosswordQuestion;
}

function entryCellKeys(entry: CrosswordEntry): string[] {
  return Array.from({ length: entry.length }, (_, index) =>
    cellKey(
      entry.startRow + (entry.direction === 'down' ? index : 0),
      entry.startCol + (entry.direction === 'across' ? index : 0)
    )
  );
}

export const crosswordEngine: InteractionEngine = {
  key: 'crossword@1',
  mount: ({ question: rawQuestion, host, onSubmit }) => {
    const question = asCrossword(rawQuestion);
    const entriesById = new Map(question.interaction.entries.map((entry) => [entry.id, entry]));
    const entryCells = new Map(question.interaction.entries.map((entry) => [entry.id, entryCellKeys(entry)]));
    const cellEntries = new Map<string, string[]>();
    const cellNumbers = new Map<string, number>();

    for (const entry of question.interaction.entries) {
      const keys = entryCells.get(entry.id) ?? [];
      keys.forEach((key) => cellEntries.set(key, [...(cellEntries.get(key) ?? []), entry.id]));
      const startKey = keys[0];
      if (startKey) cellNumbers.set(startKey, entry.number);
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'crossword';

    const instructions = document.createElement('p');
    instructions.className = 'crossword__instructions';
    instructions.textContent = 'Choose a clue, then fill the crossing letters.';

    const grid = document.createElement('div');
    grid.className = 'crossword__grid';
    grid.style.setProperty('--crossword-cols', String(question.interaction.cols));
    grid.setAttribute('role', 'grid');
    grid.setAttribute('aria-label', 'Crossword grid');

    const inputs = new Map<string, HTMLInputElement>();
    let activeEntryId: string | null = null;

    const refreshActiveCells = (): void => {
      const active = new Set(activeEntryId ? entryCells.get(activeEntryId) ?? [] : []);
      for (const [key, input] of inputs) {
        input.parentElement?.classList.toggle('crossword__cell--active', active.has(key));
      }
      for (const button of wrapper.querySelectorAll<HTMLButtonElement>('.crossword__clue')) {
        button.classList.toggle('crossword__clue--active', button.dataset.entryId === activeEntryId);
      }
    };

    const activateEntry = (entryId: string, focus = true): void => {
      activeEntryId = entryId;
      refreshActiveCells();
      if (!focus) return;
      const keys = entryCells.get(entryId) ?? [];
      const firstEmpty = keys.find((key) => !inputs.get(key)?.value) ?? keys[0];
      inputs.get(firstEmpty)?.focus();
    };

    for (let row = 0; row < question.interaction.rows; row += 1) {
      for (let col = 0; col < question.interaction.cols; col += 1) {
        const key = cellKey(row, col);
        const belongingEntries = cellEntries.get(key);

        if (!belongingEntries?.length) {
          const block = document.createElement('span');
          block.className = 'crossword__block';
          block.setAttribute('aria-hidden', 'true');
          grid.append(block);
          continue;
        }

        const cell = document.createElement('label');
        cell.className = 'crossword__cell';
        cell.setAttribute('role', 'gridcell');

        const number = cellNumbers.get(key);
        if (number) {
          const numberLabel = document.createElement('span');
          numberLabel.className = 'crossword__number';
          numberLabel.textContent = String(number);
          numberLabel.setAttribute('aria-hidden', 'true');
          cell.append(numberLabel);
        }

        const input = document.createElement('input');
        input.className = 'crossword__input';
        input.maxLength = 1;
        input.autocomplete = 'off';
        input.autocapitalize = 'characters';
        input.spellcheck = false;
        input.inputMode = 'text';
        input.setAttribute('aria-label', `Crossword cell row ${row + 1}, column ${col + 1}`);

        input.addEventListener('focus', () => {
          if (activeEntryId && belongingEntries.includes(activeEntryId)) return;
          activateEntry(belongingEntries[0], false);
        });

        input.addEventListener('input', () => {
          input.value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(-1);
          if (!input.value || !activeEntryId) return;
          const keys = entryCells.get(activeEntryId) ?? [];
          const index = keys.indexOf(key);
          if (index >= 0 && index < keys.length - 1) inputs.get(keys[index + 1])?.focus();
        });

        input.addEventListener('keydown', (event) => {
          if (event.key !== 'Backspace' || input.value || !activeEntryId) return;
          const keys = entryCells.get(activeEntryId) ?? [];
          const index = keys.indexOf(key);
          if (index > 0) inputs.get(keys[index - 1])?.focus();
        });

        cell.append(input);
        inputs.set(key, input);
        grid.append(cell);
      }
    }

    const clues = document.createElement('div');
    clues.className = 'crossword__clues';

    for (const direction of ['across', 'down'] as const) {
      const group = document.createElement('section');
      group.className = 'crossword__clue-group';
      const heading = document.createElement('h2');
      heading.textContent = direction === 'across' ? 'Across' : 'Down';
      group.append(heading);

      const entries = question.interaction.entries.filter((entry) => entry.direction === direction);
      for (const entry of entries) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'crossword__clue';
        button.dataset.entryId = entry.id;
        button.textContent = `${entry.number}. ${entry.clue}`;
        button.addEventListener('click', () => activateEntry(entry.id));
        group.append(button);
      }
      clues.append(group);
    }

    const submit = document.createElement('button');
    submit.type = 'button';
    submit.className = 'primary-button';
    submit.textContent = 'Check crossword';
    submit.addEventListener('click', () => {
      const answers: Record<string, string> = {};
      for (const [entryId, entry] of entriesById) {
        answers[entryId] = (entryCells.get(entry.id) ?? []).map((key) => inputs.get(key)?.value ?? '').join('');
      }
      submit.disabled = true;
      onSubmit({ answers });
    });

    wrapper.append(instructions, grid, clues, submit);
    host.append(wrapper);
    const firstEntry = question.interaction.entries[0];
    if (firstEntry) activateEntry(firstEntry.id, false);
  }
};
