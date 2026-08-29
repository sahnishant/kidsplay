<script lang="ts">
  import type { MemoryPairsQuestion } from '../contracts/question';
  import { createShuffledDeck } from '../mechanics/cards';
  import type { EngineProps } from './types';

  let { question, onSubmit, checkResponse }: EngineProps<MemoryPairsQuestion> = $props();

  const deck = createShuffledDeck(question.interaction.cards, question.interaction.seed);
  const cardsById = new Map(question.interaction.cards.map((card) => [card.id, card]));
  const totalPairs = question.interaction.cards.length / 2;
  let faceUp = $state<string[]>([]);
  let matchedCardIds = $state<string[]>([]);
  let matchedPairs = $state<Array<[string, string]>>([]);
  let checking = $state(false);
  let locked = $state(false);
  let status = $state(`${totalPairs} pairs to find.`);

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
      }
      return;
    }

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
          {#if card.symbol}<span class="memory-card__symbol">{card.symbol}</span>{/if}
          <span class="memory-card__label">{card.label}</span>
        </span>
      </button>
    {/each}
  </div>
  <div class="memory-pairs__status" role="status" aria-live="polite">{status}</div>
</div>
