<script lang="ts">
  import type { CrosswordEntry, CrosswordQuestion } from '../contracts/question';
  import type { EngineProps } from './types';

  let { question, onSubmit }: EngineProps<CrosswordQuestion> = $props();

  const cellKey = (row: number, col: number): string => `${row}:${col}`;
  const entryCellKeys = (entry: CrosswordEntry): string[] => Array.from({ length: entry.length }, (_, index) =>
    cellKey(
      entry.startRow + (entry.direction === 'down' ? index : 0),
      entry.startCol + (entry.direction === 'across' ? index : 0)
    )
  );
  const entriesById = new Map(question.interaction.entries.map((entry) => [entry.id, entry]));
  const entryCells = new Map(question.interaction.entries.map((entry) => [entry.id, entryCellKeys(entry)]));
  const cellEntries = new Map<string, string[]>();
  const cellNumbers = new Map<string, number>();

  for (const entry of question.interaction.entries) {
    const keys = entryCells.get(entry.id) ?? [];
    for (const key of keys) cellEntries.set(key, [...(cellEntries.get(key) ?? []), entry.id]);
    if (keys[0]) cellNumbers.set(keys[0], entry.number);
  }

  const cells = Array.from({ length: question.interaction.rows * question.interaction.cols }, (_, index) => {
    const row = Math.floor(index / question.interaction.cols);
    const col = index % question.interaction.cols;
    const key = cellKey(row, col);
    return { row, col, key, entryIds: cellEntries.get(key) ?? [], number: cellNumbers.get(key) };
  });

  let values = $state<Record<string, string>>({});
  let activeEntryId = $state<string | null>(question.interaction.entries[0]?.id ?? null);
  let locked = $state(false);
  let gridElement: HTMLDivElement;

  function activeCell(key: string): boolean {
    return activeEntryId ? (entryCells.get(activeEntryId) ?? []).includes(key) : false;
  }

  function focusCell(key: string | undefined): void {
    if (!key) return;
    gridElement?.querySelector<HTMLInputElement>(`[data-cell-key="${key}"]`)?.focus();
  }

  function activateEntry(entryId: string, focus = true): void {
    activeEntryId = entryId;
    if (!focus) return;
    const keys = entryCells.get(entryId) ?? [];
    const firstEmpty = keys.find((key) => !values[key]) ?? keys[0];
    queueMicrotask(() => focusCell(firstEmpty));
  }

  function handleFocus(entryIds: string[]): void {
    if (activeEntryId && entryIds.includes(activeEntryId)) return;
    if (entryIds[0]) activateEntry(entryIds[0], false);
  }

  function handleInput(key: string, event: Event): void {
    const input = event.currentTarget as HTMLInputElement;
    const normalized = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(-1);
    input.value = normalized;
    values[key] = normalized;
    if (!normalized || !activeEntryId) return;
    const keys = entryCells.get(activeEntryId) ?? [];
    const index = keys.indexOf(key);
    if (index >= 0 && index < keys.length - 1) focusCell(keys[index + 1]);
  }

  function handleKeydown(key: string, event: KeyboardEvent): void {
    const input = event.currentTarget as HTMLInputElement;
    if (event.key !== 'Backspace' || input.value || !activeEntryId) return;
    const keys = entryCells.get(activeEntryId) ?? [];
    const index = keys.indexOf(key);
    if (index > 0) focusCell(keys[index - 1]);
  }

  function submit(): void {
    if (locked) return;
    const answers: Record<string, string> = {};
    for (const [entryId, entry] of entriesById) {
      answers[entryId] = (entryCells.get(entry.id) ?? []).map((key) => values[key] ?? '').join('');
    }
    locked = true;
    onSubmit({ answers });
  }
</script>

<div class="crossword">
  <p class="crossword__instructions">Choose a clue, then fill the crossing letters.</p>
  <div
    class="crossword__grid"
    style={`--crossword-cols: ${question.interaction.cols}`}
    role="grid"
    aria-label="Crossword grid"
    bind:this={gridElement}
  >
    {#each cells as cell (cell.key)}
      {#if !cell.entryIds.length}
        <span class="crossword__block" aria-hidden="true"></span>
      {:else}
        <label class={`crossword__cell${activeCell(cell.key) ? ' crossword__cell--active' : ''}`} role="gridcell">
          {#if cell.number}<span class="crossword__number" aria-hidden="true">{cell.number}</span>{/if}
          <input
            class="crossword__input"
            maxlength="1"
            autocomplete="off"
            autocapitalize="characters"
            spellcheck="false"
            inputmode="text"
            data-cell-key={cell.key}
            aria-label={`Crossword cell row ${cell.row + 1}, column ${cell.col + 1}`}
            value={values[cell.key] ?? ''}
            disabled={locked}
            onfocus={() => handleFocus(cell.entryIds)}
            oninput={(event) => handleInput(cell.key, event)}
            onkeydown={(event) => handleKeydown(cell.key, event)}
          />
        </label>
      {/if}
    {/each}
  </div>

  <div class="crossword__clues">
    {#each ['across', 'down'] as direction}
      <section class="crossword__clue-group">
        <h2>{direction === 'across' ? 'Across' : 'Down'}</h2>
        {#each question.interaction.entries.filter((entry) => entry.direction === direction) as entry (entry.id)}
          <button
            type="button"
            class={`crossword__clue${activeEntryId === entry.id ? ' crossword__clue--active' : ''}`}
            disabled={locked}
            onclick={() => activateEntry(entry.id)}
          >{entry.number}. {entry.clue}</button>
        {/each}
      </section>
    {/each}
  </div>

  <button class="primary-button" type="button" disabled={locked} onclick={submit}>Check crossword</button>
</div>
