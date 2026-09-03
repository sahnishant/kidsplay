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
              class="memory-card__visuals"
              itemClass="memory-card__visual"
              compoundClass="memory-card__visuals--compound"
            />
          {:else if card.symbol}
            <span class="memory-card__symbol">{card.symbol}</span>
          {/if}
          <span class="memory-card__label">{card.label}</span>
        </span>
        {#if matchedCardIds.includes(card.id)}
          <span class="memory-card__match-tick" aria-hidden="true">✓</span>
        {/if}
      </button>
    {/each}
  </div>
  <div class="memory-pairs__status" role="status" aria-live="polite">{status}</div>
</div>

<style>
  :global(.memory-card__visuals) {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 3px;
    width: min(72px, 100%);
    height: 54px;
    min-width: 0;
    min-height: 0;
    margin: 0 auto 2px;
    overflow: hidden;
  }

  :global(.memory-card__visuals--compound) {
    width: min(88px, 100%);
  }

  :global(.memory-card__visual) {
    width: 50px;
    height: 46px;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
  }

  :global(.memory-card__visuals--compound .memory-card__visual) {
    width: 39px;
    height: 39px;
  }

  .memory-card__front :global(.visual-recipe) {
    width: 100% !important;
    height: 54px !important;
    min-height: 0 !important;
    max-height: 54px !important;
    gap: 0 !important;
    margin: 0 !important;
    overflow: hidden !important;
  }

  .memory-card__front :global(.visual-recipe__row) {
    width: 100% !important;
    height: 100% !important;
    min-height: 0 !important;
    gap: 2px !important;
    overflow: hidden !important;
  }

  .memory-card__front :global(.visual-recipe__slot) {
    width: min(40px, 31%) !important;
    height: 42px !important;
    min-width: 0 !important;
    min-height: 0 !important;
    overflow: hidden !important;
  }

  .memory-card__front :global(.visual-recipe__connector) {
    font-size: .7rem !important;
  }

  .memory-card__front :global(.visual-recipe__slot-label),
  .memory-card__front :global(.visual-recipe figcaption) {
    display: none !important;
  }

  .memory-card__front :global(section[data-semantic-depth-mode]),
  .memory-card__front :global(section.compact[data-semantic-depth-mode]) {
    width: 100% !important;
    height: 54px !important;
    min-height: 0 !important;
    max-height: 54px !important;
    overflow: hidden !important;
  }

  .memory-card__front :global(svg),
  .memory-card__front :global(img),
  .memory-card__front :global(.direct-entity) {
    max-width: 100% !important;
    max-height: 100% !important;
  }

  .memory-card__match-tick {
    position: absolute;
    top: 6px;
    right: 6px;
    z-index: 3;
    width: 24px;
    height: 24px;
    display: grid;
    place-items: center;
    border: 2px solid rgba(255,255,255,.9);
    border-radius: 999px;
    background: var(--good);
    color: #fff;
    font-size: .82rem;
    font-weight: 950;
    line-height: 1;
    box-shadow: 0 3px 8px rgba(24, 135, 72, .2);
    pointer-events: none;
  }
</style>
