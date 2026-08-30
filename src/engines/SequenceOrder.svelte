<script lang="ts">
  import { untrack } from 'svelte';
  import type { SequenceItem, SequenceOrderQuestion } from '../contracts/question';
  import { createShuffledOrder, moveItem, swapItems } from '../mechanics/reorder';
  import VisualEntity from '../presentation/VisualEntity.svelte';
  import { resolveItemVisualRefs } from '../presentation/visualRegistry';
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

  function visualRefs(item: SequenceItem): string[] {
    return resolveItemVisualRefs(item);
  }

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
  <div class="sequence-order">
    <p class="sequence-order__instructions">Put the cards in order. Tap two cards to swap them, or use the arrows.</p>
    <div class="sequence-order__list" role="list">
      {#each order as item, index (item.id)}
        {@const refs = visualRefs(item)}
        <div class="sequence-order__row" role="listitem">
          <span class="sequence-order__position" aria-hidden="true">{index + 1}</span>
          <button
            type="button"
            class={`sequence-order__item${selectedId === item.id ? ' sequence-order__item--selected' : ''}`}
            aria-pressed={selectedId === item.id}
            disabled={locked}
            onclick={() => choose(item.id, index)}
          >
            {#if refs.length}
              <span class={`sequence-order__visuals${refs.length > 1 ? ' sequence-order__visuals--compound' : ''}`} aria-hidden="true">
                {#each refs as visualRef (visualRef)}
                  <span class="sequence-order__visual">
                    <VisualEntity {visualRef} context="option" />
                  </span>
                {/each}
              </span>
            {:else if item.symbol}
              <span class="sequence-order__symbol" aria-hidden="true">{item.symbol}</span>
            {/if}
            <span>{item.label}</span>
          </button>
          <span class="sequence-order__controls">
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

  .sequence-order__visuals {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 58px;
    width: 58px;
    height: 48px;
  }

  .sequence-order__visuals--compound {
    flex-basis: 86px;
    width: 86px;
  }

  .sequence-order__visual {
    width: 48px;
    height: 44px;
  }

  .sequence-order__visuals--compound .sequence-order__visual {
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
