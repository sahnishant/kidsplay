<script lang="ts">
  import { untrack } from 'svelte';
  import type { MazePathQuestion } from '../contracts/question';
  import { canTravel, WALL_BOTTOM, WALL_LEFT, WALL_RIGHT, WALL_TOP } from '../mechanics/maze';
  import type { EngineProps } from './types';

  let { question, onSubmit }: EngineProps<MazePathQuestion> = $props();
  let interaction = $derived(question.interaction);
  let path = $state(untrack(() => [question.interaction.startIndex]));
  let complete = $state(false);
  let status = $state('Choose the next open cell.');

  function cellClass(index: number): string {
    return `maze-path__cell${path.includes(index) ? ' maze-path__cell--path' : ''}${path[path.length - 1] === index ? ' maze-path__cell--current' : ''}${index === interaction.startIndex ? ' maze-path__cell--start' : ''}${index === interaction.goalIndex ? ' maze-path__cell--goal' : ''}`;
  }

  function wallStyle(mask: number): string {
    return `border-top-width: ${mask & WALL_TOP ? '3px' : '0'}; border-right-width: ${mask & WALL_RIGHT ? '3px' : '0'}; border-bottom-width: ${mask & WALL_BOTTOM ? '3px' : '0'}; border-left-width: ${mask & WALL_LEFT ? '3px' : '0'}`;
  }

  function choose(index: number): void {
    if (complete) return;
    const existingPathIndex = path.indexOf(index);
    if (existingPathIndex >= 0) {
      path = path.slice(0, existingPathIndex + 1);
      status = 'Moved back. Choose another open path.';
      return;
    }

    const current = path[path.length - 1];
    if (!canTravel(interaction.wallMasks, interaction.rows, interaction.cols, current, index)) {
      status = 'A wall blocks that move. Try an adjoining open cell.';
      return;
    }

    path.push(index);
    if (index !== interaction.goalIndex) {
      status = 'Good. Keep going.';
      return;
    }

    complete = true;
    status = `${interaction.goalLabel} found.`;
    window.setTimeout(() => onSubmit({ pathIndices: [...path] }), 300);
  }
</script>

<div class="maze-path">
  <p class="maze-path__instructions">
    Tap adjoining cells to guide {interaction.startLabel} to {interaction.goalLabel}. Tap an earlier path cell to go back.
  </p>
  <div
    class="maze-path__grid"
    style={`--maze-cols: ${interaction.cols}`}
    role="grid"
    aria-label={`${interaction.startLabel} maze to ${interaction.goalLabel}`}
  >
    {#each interaction.wallMasks as mask, index}
      {@const row = Math.floor(index / interaction.cols)}
      {@const col = index % interaction.cols}
      <button
        type="button"
        class={cellClass(index)}
        style={wallStyle(mask)}
        aria-label={`Maze row ${row + 1}, column ${col + 1}`}
        disabled={complete}
        onclick={() => choose(index)}
      >
        {index === interaction.startIndex ? interaction.startSymbol : index === interaction.goalIndex ? interaction.goalSymbol : ''}
      </button>
    {/each}
  </div>
  <div class="maze-path__status" role="status" aria-live="polite">{status}</div>
</div>
