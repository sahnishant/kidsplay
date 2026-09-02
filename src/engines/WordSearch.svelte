<script lang="ts">
  import { untrack } from 'svelte';
  import type { WordSearchQuestion } from '../contracts/question';
  import type { GridPoint } from '../mechanics/grid';
  import { lineBetween, pointKey, samePoint } from '../mechanics/grid';
  import { generateWordSearch, normalizeSearchWord } from '../mechanics/wordSearch';
  import type { EngineProps } from './types';

  let {
    question,
    onSubmit,
    submissionMode = 'explicit'
  }: EngineProps<WordSearchQuestion> = $props();

  let generated = $derived.by(() => generateWordSearch({
    terms: question.interaction.terms,
    seed: question.interaction.seed,
    size: question.interaction.gridSize,
    directions: question.interaction.directions,
    alphabet: question.interaction.alphabet
  }));

  let foundTermIds = $state<string[]>([]);
  let foundCellKeys = $state<string[]>([]);
  let previewCellKeys = $state<string[]>([]);
  let tapStart = $state<GridPoint | null>(null);
  let dragStart: GridPoint | null = null;
  let dragEnd: GridPoint | null = null;
  let dragPointerId: number | null = null;
  let dragMoved = false;
  let locked = $state(false);
  let liveStatus = $state(untrack(() => `${question.interaction.terms.length} words to find.`));
  let gridElement: HTMLDivElement;

  function showPreview(points: readonly GridPoint[]): void {
    previewCellKeys = points.map(pointKey);
  }

  function pointFromElement(element: Element | null): GridPoint | null {
    const cell = element?.closest<HTMLElement>('.word-search__cell');
    if (!cell || !gridElement.contains(cell)) return null;
    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);
    return Number.isInteger(row) && Number.isInteger(col) ? { row, col } : null;
  }

  function selectedLetters(points: readonly GridPoint[]): string {
    return points.map((point) => generated.grid[point.row][point.col]).join('');
  }

  function commit(termIds = foundTermIds): void {
    if (locked) return;
    locked = true;
    onSubmit({ foundTermIds: [...termIds] });
  }

  function resolveSelection(start: GridPoint, end: GridPoint): void {
    const points = lineBetween(start, end);
    previewCellKeys = [];
    if (!points || points.length < 2) {
      liveStatus = 'Choose letters in a straight horizontal, vertical or diagonal line.';
      return;
    }

    const selected = selectedLetters(points);
    const reversed = Array.from(selected).reverse().join('');
    const term = question.interaction.terms.find((candidate) => {
      if (foundTermIds.includes(candidate.id)) return false;
      const word = normalizeSearchWord(candidate.word).join('');
      return word === selected || word === reversed;
    });

    if (!term) {
      liveStatus = 'That is not one of the words yet. Try another line.';
      return;
    }

    foundTermIds.push(term.id);
    for (const point of points) {
      const key = pointKey(point);
      if (!foundCellKeys.includes(key)) foundCellKeys.push(key);
    }
    const remaining = question.interaction.terms.length - foundTermIds.length;
    liveStatus = remaining
      ? `${term.label} found. ${remaining} word${remaining === 1 ? '' : 's'} left.`
      : 'You found every word.';

    if (!remaining && submissionMode === 'auto_when_complete') {
      const completedTerms = [...foundTermIds];
      window.setTimeout(() => commit(completedTerms), 250);
    }
  }

  function handleTap(point: GridPoint): void {
    if (locked) return;
    if (!tapStart) {
      tapStart = point;
      showPreview([point]);
      liveStatus = 'Now tap the last letter of the word.';
      return;
    }
    if (samePoint(tapStart, point)) {
      tapStart = null;
      previewCellKeys = [];
      liveStatus = 'Selection cleared.';
      return;
    }
    const start = tapStart;
    tapStart = null;
    resolveSelection(start, point);
  }

  function pointerDown(event: PointerEvent): void {
    if (locked) return;
    const point = pointFromElement(event.target as Element | null);
    if (!point) return;
    dragStart = point;
    dragEnd = point;
    dragMoved = false;
    dragPointerId = event.pointerId;
    gridElement.setPointerCapture(event.pointerId);
    showPreview([point]);
  }

  function pointerMove(event: PointerEvent): void {
    if (dragPointerId !== event.pointerId || !dragStart) return;
    const point = pointFromElement(document.elementFromPoint(event.clientX, event.clientY));
    if (!point) return;
    if (!dragEnd || !samePoint(point, dragEnd)) dragMoved = true;
    dragEnd = point;
    showPreview(lineBetween(dragStart, point) ?? [dragStart]);
  }

  function pointerUp(event: PointerEvent): void {
    if (dragPointerId !== event.pointerId || !dragStart || !dragEnd) return;
    if (gridElement.hasPointerCapture(event.pointerId)) gridElement.releasePointerCapture(event.pointerId);
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
  }

  function pointerCancel(event: PointerEvent): void {
    if (dragPointerId !== event.pointerId) return;
    dragStart = null;
    dragEnd = null;
    dragPointerId = null;
    dragMoved = false;
    tapStart = null;
    previewCellKeys = [];
  }

  function cellClass(point: GridPoint): string {
    const key = pointKey(point);
    return `word-search__cell${previewCellKeys.includes(key) ? ' word-search__cell--preview' : ''}${foundCellKeys.includes(key) ? ' word-search__cell--found' : ''}`;
  }
</script>

<div class="word-search">
  <p class="word-search__instructions">Drag across a word, or tap its first and last letters.</p>
  <div class="word-search__terms" aria-label="Words to find">
    {#each question.interaction.terms as term (term.id)}
      <span class={`word-search__term${foundTermIds.includes(term.id) ? ' word-search__term--found' : ''}`}>
        {term.label}
      </span>
    {/each}
  </div>

  <div
    class="word-search__grid"
    style={`--word-search-size: ${generated.grid.length}`}
    role="group"
    aria-label="Word search letter grid"
    bind:this={gridElement}
    onpointerdown={pointerDown}
    onpointermove={pointerMove}
    onpointerup={pointerUp}
    onpointercancel={pointerCancel}
  >
    {#each generated.grid as row, rowIndex}
      {#each row as letter, colIndex}
        {@const point = { row: rowIndex, col: colIndex }}
        <button
          type="button"
          class={cellClass(point)}
          data-row={rowIndex}
          data-col={colIndex}
          aria-label={`Row ${rowIndex + 1}, column ${colIndex + 1}, ${letter}`}
          disabled={locked}
          onclick={(event) => event.detail === 0 && handleTap(point)}
        >{letter}</button>
      {/each}
    {/each}
  </div>

  <div class="word-search__status" role="status" aria-live="polite">{liveStatus}</div>
  <button class="primary-button" type="button" disabled={locked} onclick={() => commit()}>
    {foundTermIds.length === question.interaction.terms.length ? 'All found — continue' : 'Finish word search'}
  </button>
</div>
