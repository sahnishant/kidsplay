<script lang="ts">
  import { untrack } from 'svelte';
  import type { MemoryPairsQuestion } from '../contracts/question';
  import { createShuffledDeck } from '../mechanics/cards';
  import SemanticVisualPresenter from '../presentation/SemanticVisualPresenter.svelte';
  import { resolveItemVisualPresentation } from '../presentation/semanticVisualPresentation';
  import { playAnswerCue } from '../runtime/childAudio';
  import type { EngineProps } from './types';

  let { question, onSubmit, checkResponse, soundEnabled = true }: EngineProps<MemoryPairsQuestion> = $props();

  let deck = $derived(createShuffledDeck(question.interaction.cards, question.interaction.seed));
  let cardsById = $derived(new Map(question.interaction.cards.map((card) => [card.id, card])));
  let totalPairs = $derived(question.interaction.cards.length / 2);
  let faceUp = $state<string[]>([]);
  let matchedCardIds = $state<string[]>([]);
  let matchedPairs = $state<Array<[string, string]>>([]);
  let checking = $state(false);
  let locked = $state(false);
  let status = $state(untrack(() => `${question.interaction.cards.length / 2} pairs to find.`));

  function isFaceUp(cardId: string): boolean {
    return faceUp.includes(cardId) || matchedCardIds.includes(cardId);
  }

  function finishPair(firstId: string, secondId: string): void {
    const result = checkResponse({ matchedPairs: [[firstId, secondId]] });
    const isMatch = result.score > 0;
    const first = cardsById.get(firstId);
    const second = cardsById.get(secondId);

    if (isMatch) {
      matchedCardIds.push(firstId, secondId);
      matchedPairs.push([firstId, secondId]);
      faceUp = [];
      checking = false;
      const remaining = totalPairs - matchedPairs.length;
      status = remaining
        ? `${first?.label ?? 'Card'} and ${second?.label ?? 'card'} belong together. ${remaining} pair${remaining === 1 ? '' : 's'} left.`
        : 'You found every pair.';
      if (!remaining) {
        locked = true;
        window.setTimeout(() => onSubmit({ matchedPairs: [...matchedPairs] }), 350);
      } else {
        playAnswerCue(true, soundEnabled);
      }
      return;
    }

    playAnswerCue(false, soundEnabled);
    status = 'Those cards do not belong together. Remember them and try again.';
    window.setTimeout(() => {
      faceUp = [];
      checking = false;
    }, 750);
  }

  function turnCard(cardId: string): void {
    if (locked || checking || matchedCardIds.includes(cardId) || faceUp.includes(cardId)) return;
    faceUp.push(cardId);
    if (faceUp.length < 2) {
      status = 'Choose one more card.';
      return;
    }
    checking = true;
    const [firstId, secondId] = faceUp;
    window.setTimeout(() => finishPair(firstId, secondId), 250);
  }
</script>

<div class="memory-pairs">
  <p class="memory-pairs__instructions">Turn over two cards. Find the cards that belong together.</p>
  <div class="memory-pairs__grid" role="group" aria-label="Memory cards">
    {#each deck as card, index (card.id)}
      {@const visual = resolveItemVisualPresentation(card, { recipeSurface: 'memory-card' })}
      <button
        type="button"
        class={`memory-card${isFaceUp(card.id) ? ' memory-card--face-up' : ''}${matchedCardIds.includes(card.id) ? ' memory-card--matched' : ''}`}
        aria-label={isFaceUp(card.id) ? card.label : `Hidden card ${index + 1} of ${deck.length}`}
        aria-disabled={matchedCardIds.includes(card.id)}
        disabled={locked}
        onclick={() => turnCard(card.id)}
      >
        <span class="memory-card__back" aria-hidden="true">★</span>
        <span class="memory-card__front" aria-hidden="true">
          {#if visual.hasVisuals}
            <SemanticVisualPresenter
              presentation={visual}
              style="display:flex;align-items:center;justify-content:center;gap:3px;width:min(72px,100%);height:50px;min-width:0;overflow:hidden;margin:auto"
              itemStyle="display:block;width:48px;height:46px;min-width:0;min-height:0;overflow:hidden"
            />
          {:else if card.symbol}
            <span class="memory-card__symbol">{card.symbol}</span>
          {/if}
          <span
            class="memory-card__label"
            style="display:-webkit-box;max-width:100%;overflow:hidden;-webkit-box-orient:vertical;-webkit-line-clamp:2;line-clamp:2;overflow-wrap:anywhere"
          >{card.label}</span>
        </span>
        {#if matchedCardIds.includes(card.id)}
          <span
            aria-hidden="true"
            style="position:absolute;top:5px;right:5px;z-index:3;width:24px;height:24px;display:grid;place-items:center;border-radius:50%;background:var(--good);color:#fff;font-size:.82rem;font-weight:950;pointer-events:none"
          >✓</span>
        {/if}
      </button>
    {/each}
  </div>
  <div class="memory-pairs__status" role="status" aria-live="polite">{status}</div>
</div>
