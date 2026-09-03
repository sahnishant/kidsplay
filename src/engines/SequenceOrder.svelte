<script lang="ts">
  import { untrack } from 'svelte';
  import type { SequenceOrderQuestion } from '../contracts/question';
  import { createShuffledOrder, moveItem, swapItems } from '../mechanics/reorder';
  import SemanticVisualPresenter from '../presentation/SemanticVisualPresenter.svelte';
  import { resolveItemVisualPresentation } from '../presentation/semanticVisualPresentation';
  import type { EngineProps } from './types';

  let { question, onSubmit }: EngineProps<SequenceOrderQuestion> = $props();

  let order = $state(untrack(() => createShuffledOrder(
    question.interaction.items,
    question.interaction.seed,
    (item) => item.label
  )));
  let selectedId = $state<string | null>(null);
  let status = $state('');
  let locked = $state(false);
  let compactLetters = $derived(
    question.interaction.items.length >= 2 &&
    question.interaction.items.every((item) => Array.from(item.label).length === 1 && /^[A-Z0-9]$/i.test(item.label))
  );
  let compactSequence = $derived(!compactLetters && question.interaction.items.length <= 4);

  function choose(itemId: string, index: number): void {
    if (locked) return;
    const noun = compactLetters ? 'letter' : 'card';
    if (!selectedId) {
      selectedId = itemId;
      status = `Now tap the ${noun} you want to swap with.`;
      return;
    }
    if (selectedId === itemId) {
      selectedId = null;
      status = 'Selection cleared.';
      return;
    }
    const firstIndex = order.findIndex((candidate) => candidate.id === selectedId);
    order = swapItems(order, firstIndex, index);
    selectedId = null;
    status = compactLetters ? 'Letters swapped.' : 'Cards swapped.';
  }

  function move(index: number, targetIndex: number): void {
    if (locked) return;
    const item = order[index];
    order = moveItem(order, index, targetIndex);
    selectedId = null;
    status = `${item.label} moved ${targetIndex < index ? 'earlier' : 'later'}.`;
  }

  function submit(): void {
    if (locked) return;
    locked = true;
    onSubmit({ orderedItemIds: order.map((item) => item.id) });
  }
</script>

{#if compactLetters}
  <div class="letter-order">
    <p class="letter-order__instructions">Put the letters in the right order. Tap two letters to swap them.</p>
    <div class="letter-order__tiles" role="list" aria-label="Letters to unscramble">
      {#each order as item, index (item.id)}
        <span class="letter-order__slot" role="listitem">
          <button
            type="button"
            class={`letter-order__tile${selectedId === item.id ? ' letter-order__tile--selected' : ''}`}
            aria-label={`Letter ${item.label}, position ${index + 1}`}
            aria-pressed={selectedId === item.id}
            disabled={locked}
            onclick={() => choose(item.id, index)}
          >{item.label}</button>
        </span>
      {/each}
    </div>
    <div class="sequence-order__status" role="status" aria-live="polite">{status}</div>
    <button class="primary-button" type="button" disabled={locked} onclick={submit}>Check word</button>
  </div>
{:else}
  <div class="sequence-order" style={compactSequence ? 'gap:6px' : undefined}>
    <p class="sequence-order__instructions" style={compactSequence ? 'font-size:.78rem;line-height:1.15' : undefined}>Put the cards in order. Tap two to swap, or use the arrows.</p>
    <div class="sequence-order__list" role="list" style={compactSequence ? 'gap:5px' : undefined}>
      {#each order as item, index (item.id)}
        {@const visual = resolveItemVisualPresentation(item, { recipeSurface: 'sequence-item' })}
        <div
          class="sequence-order__row"
          role="listitem"
          style={compactSequence ? 'grid-template-columns:24px minmax(0,1fr) 92px;gap:4px;padding:3px' : undefined}
        >
          <span
            class="sequence-order__position"
            aria-hidden="true"
            style={compactSequence ? 'width:24px;height:24px;font-size:.78rem' : undefined}
          >{index + 1}</span>
          <button
            type="button"
            class={`sequence-order__item${selectedId === item.id ? ' sequence-order__item--selected' : ''}`}
            aria-pressed={selectedId === item.id}
            disabled={locked}
            style={compactSequence ? 'min-height:44px;padding:5px 7px;gap:6px;border-radius:12px' : undefined}
            onclick={() => choose(item.id, index)}
          >
            {#if visual.hasVisuals}
              <SemanticVisualPresenter
                presentation={visual}
                class="sequence-order__visuals"
                itemClass="sequence-order__visual"
                compoundClass="sequence-order__visuals--compound"
              />
            {:else if item.symbol}
              <span class="sequence-order__symbol" aria-hidden="true">{item.symbol}</span>
            {/if}
            <span>{item.label}</span>
          </button>
          <span
            class="sequence-order__controls"
            style={compactSequence ? 'grid-template-columns:44px 44px;gap:4px' : undefined}
          >
            <button
              class="sequence-order__move"
              type="button"
              aria-label={`Move ${item.label} earlier`}
              disabled={locked || index === 0}
              onclick={() => move(index, index - 1)}
            >↑</button>
            <button
              class="sequence-order__move"
              type="button"
              aria-label={`Move ${item.label} later`}
              disabled={locked || index === order.length - 1}
              onclick={() => move(index, index + 1)}
            >↓</button>
          </span>
        </div>
      {/each}
    </div>
    <div class="sequence-order__status" role="status" aria-live="polite">{status}</div>
    <button class="primary-button" type="button" disabled={locked} onclick={submit}>Check order</button>
  </div>
{/if}

<style>
  .letter-order__instructions {
    margin: 0 0 12px;
  }

  .letter-order__tiles {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 9px;
    margin: 12px 0;
  }

  .letter-order__slot {
    display: inline-flex;
  }

  .letter-order__tile {
    min-width: 48px;
    min-height: 52px;
    padding: 7px 12px;
    border: 2px solid currentColor;
    border-radius: 12px;
    font: inherit;
    font-size: 1.35rem;
    font-weight: 800;
    line-height: 1;
  }

  .letter-order__tile--selected {
    transform: translateY(-3px);
    outline: 3px solid currentColor;
    outline-offset: 2px;
  }

  .sequence-order__item {
    display: flex;
    align-items: center;
    gap: 10px;
    text-align: left;
  }

  :global(.sequence-order__visuals) {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 58px;
    width: 58px;
    height: 48px;
  }

  :global(.sequence-order__visuals--compound) {
    flex-basis: 86px;
    width: 86px;
  }

  :global(.sequence-order__visual) {
    width: 48px;
    height: 44px;
  }

  :global(.sequence-order__visuals--compound .sequence-order__visual) {
    width: 39px;
    height: 39px;
  }

  .sequence-order__symbol {
    flex: 0 0 auto;
    font-size: 1.7rem;
  }

  @media (max-width: 480px) {
    .letter-order__tiles {
      gap: 7px;
    }

    .letter-order__tile {
      min-width: 43px;
      min-height: 48px;
      padding: 6px 10px;
      font-size: 1.2rem;
    }
  }
</style>