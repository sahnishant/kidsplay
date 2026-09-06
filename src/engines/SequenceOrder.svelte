<script lang="ts">
  import { untrack } from 'svelte';
  import type { SequenceOrderQuestion } from '../contracts/question';
  import { createShuffledOrder, moveItem, swapItems } from '../mechanics/reorder';
  import { restoreSequenceOrder } from '../mechanics/sequenceStudio';
  import SemanticVisualPresenter from '../presentation/SemanticVisualPresenter.svelte';
  import { resolveItemVisualPresentation } from '../presentation/semanticVisualPresentation';
  import type { EngineProps } from './types';

  let { question, onSubmit, initialState, onStateChange, mode = 'question' }: EngineProps<SequenceOrderQuestion> = $props();
  let order = $state(untrack(() => restoreSequenceOrder(question.interaction.items, initialState)
    ?? createShuffledOrder(question.interaction.items, question.interaction.seed, (item) => item.label)));
  let selectedId = $state<string | null>(null);
  let status = $state('');
  let locked = $state(false);
  let compactLetters = $derived(question.interaction.items.length >= 2 && question.interaction.items.every((item) => Array.from(item.label).length === 1 && /^[A-Z0-9]$/i.test(item.label)));
  let illustratedSequence = $derived(!compactLetters && question.evidencePolicy === 'practice_only' && question.interaction.items.every((item) => item.visualRefs?.some((ref) => ref.startsWith('visual.studio.'))));
  let compactSequence = $derived(!compactLetters && !illustratedSequence && question.interaction.items.length <= 4);

  $effect(() => { untrack(() => publish()); });
  function publish(): void { onStateChange?.({ orderedItemIds: order.map((item) => item.id) }); }
  function choose(itemId: string, index: number): void {
    if (locked) return;
    const noun = compactLetters ? 'letter' : 'card';
    if (!selectedId) { selectedId = itemId; status = `Now tap the ${noun} you want to swap with.`; return; }
    if (selectedId === itemId) { selectedId = null; status = 'Selection cleared.'; return; }
    order = swapItems(order, order.findIndex((candidate) => candidate.id === selectedId), index);
    selectedId = null;
    status = compactLetters ? 'Letters swapped.' : 'Cards swapped.';
    publish();
  }
  function move(index: number, targetIndex: number): void {
    if (locked) return;
    const item = order[index];
    order = moveItem(order, index, targetIndex);
    selectedId = null;
    status = `${item.label} moved ${targetIndex < index ? 'earlier' : 'later'}.`;
    publish();
  }
  function submit(): void {
    if (locked) return;
    locked = mode !== 'explore';
    onSubmit({ orderedItemIds: order.map((item) => item.id) });
  }
</script>

{#if compactLetters}
  <div class="letter-order">
    <p class="letter-order__instructions">Put the letters in the right order. Tap two letters to swap them.</p>
    <div class="letter-order__tiles" role="list" aria-label="Letters to unscramble">
      {#each order as item, index (item.id)}
        <span class="letter-order__slot" role="listitem">
          <button type="button" class={`letter-order__tile${selectedId === item.id ? ' letter-order__tile--selected' : ''}`}
            aria-label={`Letter ${item.label}, position ${index + 1}`} aria-pressed={selectedId === item.id}
            disabled={locked} onclick={() => choose(item.id, index)}>{item.label}</button>
        </span>
      {/each}
    </div>
    <div class="sequence-order__status" role="status" aria-live="polite">{status}</div>
    <button class="primary-button" type="button" disabled={locked} onclick={submit}>{mode === 'explore' ? 'Look at my word' : 'Check word'}</button>
  </div>
{:else}
  <div class="sequence-order" class:picture-sequence={illustratedSequence} style={compactSequence ? 'gap:2px' : undefined}>
    <p class="sequence-order__instructions" style={compactSequence ? 'font-size:.78rem;line-height:1.15' : undefined}>Put the cards in order. Tap two to swap, or use the arrows.</p>
    <div class="sequence-order__list" role="list" style={compactSequence ? 'gap:2px' : undefined}>
      {#each order as item, index (item.id)}
        {@const visual = resolveItemVisualPresentation(item, { recipeSurface: 'sequence-item' })}
        <div class="sequence-order__row" role="listitem" style={compactSequence ? 'grid-template-columns:24px minmax(0,1fr) 92px;gap:4px;padding:0 3px' : undefined}>
          <span class="sequence-order__position" aria-hidden="true" style={compactSequence ? 'width:24px;height:24px;font-size:.78rem' : undefined}>{index + 1}</span>
          <button type="button" class={`sequence-order__item${selectedId === item.id ? ' sequence-order__item--selected' : ''}`}
            aria-pressed={selectedId === item.id} disabled={locked}
            style={compactSequence ? 'min-height:44px;padding:5px 7px;gap:6px;border-radius:12px' : undefined} onclick={() => choose(item.id, index)}>
            {#if visual.hasVisuals}
              <SemanticVisualPresenter presentation={visual} class="sequence-order__visuals" itemClass="sequence-order__visual" compoundClass="sequence-order__visuals--compound" />
            {:else if item.symbol}<span class="sequence-order__symbol" aria-hidden="true">{item.symbol}</span>{/if}
            <span>{item.label}</span>
          </button>
          <span class="sequence-order__controls" style={compactSequence ? 'grid-template-columns:44px 44px;gap:4px' : undefined}>
            <button class="sequence-order__move" type="button" aria-label={`Move ${item.label} earlier`} disabled={locked || index === 0} onclick={() => move(index, index - 1)}>↑</button>
            <button class="sequence-order__move" type="button" aria-label={`Move ${item.label} later`} disabled={locked || index === order.length - 1} onclick={() => move(index, index + 1)}>↓</button>
          </span>
        </div>
      {/each}
    </div>
    <div class="sequence-order__status" role="status" aria-live="polite" style={compactSequence ? 'min-height:0;font-size:.75rem;line-height:1' : undefined}>{status}</div>
    <button class="primary-button" type="button" disabled={locked} onclick={submit}>{mode === 'explore' ? 'Look at my order' : 'Check order'}</button>
  </div>
{/if}

<style>
  .letter-order__instructions{margin:0 0 12px}.letter-order__tiles{display:flex;flex-wrap:wrap;justify-content:center;gap:9px;margin:12px 0}.letter-order__slot{display:inline-flex}.letter-order__tile{min-width:48px;min-height:52px;padding:7px 12px;border:2px solid currentColor;border-radius:12px;font:inherit;font-size:1.35rem;font-weight:800;line-height:1}.letter-order__tile--selected{transform:translateY(-3px);outline:3px solid currentColor;outline-offset:2px}.sequence-order__item{display:flex;align-items:center;gap:10px;text-align:left}:global(.sequence-order__visuals){display:flex;align-items:center;justify-content:center;flex:0 0 58px;width:58px;height:48px}:global(.sequence-order__visuals--compound){flex-basis:86px;width:86px}:global(.sequence-order__visual){width:48px;height:44px}:global(.sequence-order__visuals--compound .sequence-order__visual){width:39px;height:39px}.sequence-order__symbol{flex:0 0 auto;font-size:1.7rem}@media(max-width:480px){.letter-order__tiles{gap:7px}.letter-order__tile{min-width:48px;min-height:48px;padding:6px 10px;font-size:1.2rem}}
  .picture-sequence .sequence-order__list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;align-items:stretch}
  .picture-sequence .sequence-order__row{position:relative;display:grid;grid-template-columns:minmax(0,1fr);grid-template-rows:1fr auto;gap:6px;min-width:0;padding:7px;border:1px solid #d9dfd1;border-radius:17px;background:#fffef9;box-shadow:0 2px 0 #dfe5d6}
  .picture-sequence .sequence-order__position{position:absolute;z-index:1;top:8px;right:8px;width:24px;height:24px;font-size:.75rem;background:#fffef9;color:#36483c;border:1px solid #b5c3ae;pointer-events:none}
  .picture-sequence .sequence-order__item{display:flex;flex-direction:column;align-items:stretch;justify-content:flex-start;min-width:0;width:100%;min-height:108px;gap:7px;padding:0 0 3px;border:0;border-radius:12px;background:transparent;color:var(--ink,#24303a);box-shadow:none;line-height:1.3;font-size:.88rem;font-weight:650;overflow-wrap:anywhere}
  .picture-sequence .sequence-order__item--selected{outline:3px solid #426454;outline-offset:2px;background:#edf3e4}
  .picture-sequence .sequence-order__item:focus-visible{outline:3px solid #426454;outline-offset:2px}
  .picture-sequence :global(.sequence-order__visuals){display:block;flex:none;width:100%;height:auto;aspect-ratio:8/5}
  .picture-sequence :global(.sequence-order__visual){display:block;width:100%;height:100%}
  .picture-sequence :global(.visual-entity){display:block}
  .picture-sequence .sequence-order__controls{display:grid;grid-template-columns:repeat(2,minmax(48px,1fr));gap:5px;min-width:0}
  .picture-sequence .sequence-order__move{width:100%;min-width:48px;height:48px;min-height:48px;padding:0;border-radius:10px;border:1px solid #d3ddcc;background:#f0f4e9;color:#344c40;font-size:1.25rem}
  .picture-sequence .sequence-order__move:disabled{opacity:.5}
  @media(forced-colors:active){.picture-sequence .sequence-order__row{border-color:CanvasText}.picture-sequence .sequence-order__item--selected{outline-color:Highlight}}
</style>
