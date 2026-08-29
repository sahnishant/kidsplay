<script lang="ts">
  import type { SequenceOrderQuestion } from '../contracts/question';
  import { createShuffledOrder, moveItem, swapItems } from '../mechanics/reorder';
  import type { EngineProps } from './types';

  let { question, onSubmit }: EngineProps<SequenceOrderQuestion> = $props();

  let order = $state(createShuffledOrder(question.interaction.items, question.interaction.seed));
  let selectedId = $state<string | null>(null);
  let status = $state('');
  let locked = $state(false);

  function choose(itemId: string, index: number): void {
    if (locked) return;
    if (!selectedId) {
      selectedId = itemId;
      status = 'Now tap the card you want to swap with.';
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
    status = 'Cards swapped.';
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

<div class="sequence-order">
  <p class="sequence-order__instructions">Put the cards in order. Tap two cards to swap them, or use the arrows.</p>
  <div class="sequence-order__list" role="list">
    {#each order as item, index (item.id)}
      <div class="sequence-order__row" role="listitem">
        <span class="sequence-order__position" aria-hidden="true">{index + 1}</span>
        <button
          type="button"
          class={`sequence-order__item${selectedId === item.id ? ' sequence-order__item--selected' : ''}`}
          aria-pressed={selectedId === item.id}
          disabled={locked}
          onclick={() => choose(item.id, index)}
        >{`${item.symbol ?? ''} ${item.label}`.trim()}</button>
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
