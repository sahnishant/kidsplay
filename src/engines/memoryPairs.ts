import type { MemoryPairsQuestion } from '../contracts/question';
import { createShuffledDeck } from '../mechanics/cards';
import type { InteractionEngine } from './types';

function asMemoryPairs(question: Parameters<InteractionEngine['mount']>[0]['question']): MemoryPairsQuestion {
  if (question.interaction.type !== 'memory_pairs') throw new Error('memoryPairsEngine received wrong question type');
  return question as MemoryPairsQuestion;
}

export const memoryPairsEngine: InteractionEngine = {
  key: 'memory_pairs@1',
  mount: ({ question: rawQuestion, host, onSubmit, checkResponse }) => {
    const question = asMemoryPairs(rawQuestion);
    const deck = createShuffledDeck(question.interaction.cards, question.interaction.seed);

    const wrapper = document.createElement('div');
    wrapper.className = 'memory-pairs';

    const instructions = document.createElement('p');
    instructions.className = 'memory-pairs__instructions';
    instructions.textContent = 'Turn over two cards. Find the cards that belong together.';

    const status = document.createElement('div');
    status.className = 'memory-pairs__status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.textContent = `${question.solution.pairs.length} pairs to find.`;

    const grid = document.createElement('div');
    grid.className = 'memory-pairs__grid';
    grid.setAttribute('role', 'group');
    grid.setAttribute('aria-label', 'Memory cards');

    const buttons = new Map<string, HTMLButtonElement>();
    const cardsById = new Map(question.interaction.cards.map((card) => [card.id, card]));
    const matchedCardIds = new Set<string>();
    const matchedPairs: Array<[string, string]> = [];
    let faceUp: string[] = [];
    let checking = false;

    const setFace = (cardId: string, faceIsUp: boolean): void => {
      const button = buttons.get(cardId);
      const card = cardsById.get(cardId);
      if (!button || !card) return;

      button.classList.toggle('memory-card--face-up', faceIsUp);
      if (faceIsUp || matchedCardIds.has(cardId)) {
        button.setAttribute('aria-label', card.label);
      } else {
        const position = deck.findIndex((candidate) => candidate.id === cardId) + 1;
        button.setAttribute('aria-label', `Hidden card ${position} of ${deck.length}`);
      }
    };

    const finishPair = (firstId: string, secondId: string): void => {
      const result = checkResponse({ matchedPairs: [[firstId, secondId]] });
      const isMatch = result.score > 0;
      const first = cardsById.get(firstId);
      const second = cardsById.get(secondId);

      if (isMatch) {
        matchedCardIds.add(firstId);
        matchedCardIds.add(secondId);
        matchedPairs.push([firstId, secondId]);
        buttons.get(firstId)?.classList.add('memory-card--matched');
        buttons.get(secondId)?.classList.add('memory-card--matched');
        buttons.get(firstId)?.setAttribute('aria-disabled', 'true');
        buttons.get(secondId)?.setAttribute('aria-disabled', 'true');

        const remaining = question.solution.pairs.length - matchedPairs.length;
        status.textContent = remaining
          ? `${first?.label ?? 'Card'} and ${second?.label ?? 'card'} belong together. ${remaining} pair${remaining === 1 ? '' : 's'} left.`
          : 'You found every pair.';

        faceUp = [];
        checking = false;

        if (!remaining) {
          window.setTimeout(() => onSubmit({ matchedPairs }), 350);
        }
        return;
      }

      status.textContent = 'Those cards do not belong together. Remember them and try again.';
      window.setTimeout(() => {
        setFace(firstId, false);
        setFace(secondId, false);
        faceUp = [];
        checking = false;
      }, 750);
    };

    const turnCard = (cardId: string): void => {
      if (checking || matchedCardIds.has(cardId) || faceUp.includes(cardId)) return;

      faceUp.push(cardId);
      setFace(cardId, true);

      if (faceUp.length < 2) {
        status.textContent = 'Choose one more card.';
        return;
      }

      checking = true;
      const [firstId, secondId] = faceUp;
      window.setTimeout(() => finishPair(firstId, secondId), 250);
    };

    deck.forEach((card, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'memory-card';
      button.dataset.cardId = card.id;
      button.setAttribute('aria-label', `Hidden card ${index + 1} of ${deck.length}`);

      const back = document.createElement('span');
      back.className = 'memory-card__back';
      back.setAttribute('aria-hidden', 'true');
      back.textContent = '★';

      const front = document.createElement('span');
      front.className = 'memory-card__front';
      front.setAttribute('aria-hidden', 'true');

      if (card.symbol) {
        const symbol = document.createElement('span');
        symbol.className = 'memory-card__symbol';
        symbol.textContent = card.symbol;
        front.append(symbol);
      }

      const label = document.createElement('span');
      label.className = 'memory-card__label';
      label.textContent = card.label;
      front.append(label);

      button.append(back, front);
      button.addEventListener('click', () => turnCard(card.id));
      buttons.set(card.id, button);
      grid.append(button);
    });

    wrapper.append(instructions, grid, status);
    host.append(wrapper);
  }
};
