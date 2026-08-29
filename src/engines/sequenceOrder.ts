import type { SequenceOrderQuestion } from '../contracts/question';
import { createShuffledOrder, moveItem, swapItems } from '../mechanics/reorder';
import type { InteractionEngine } from './types';

function asSequenceOrder(question: Parameters<InteractionEngine['mount']>[0]['question']): SequenceOrderQuestion {
  if (question.interaction.type !== 'sequence_order') {
    throw new Error('sequenceOrderEngine received wrong question type');
  }
  return question as SequenceOrderQuestion;
}

export const sequenceOrderEngine: InteractionEngine = {
  key: 'sequence_order@1',
  mount: ({ question: rawQuestion, host, onSubmit }) => {
    const question = asSequenceOrder(rawQuestion);
    let order = createShuffledOrder(question.interaction.items, question.interaction.seed);
    let selectedId: string | null = null;

    const wrapper = document.createElement('div');
    wrapper.className = 'sequence-order';

    const instructions = document.createElement('p');
    instructions.className = 'sequence-order__instructions';
    instructions.textContent = 'Put the cards in order. Tap two cards to swap them, or use the arrows.';

    const list = document.createElement('div');
    list.className = 'sequence-order__list';
    list.setAttribute('role', 'list');

    const status = document.createElement('div');
    status.className = 'sequence-order__status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');

    const submit = document.createElement('button');
    submit.type = 'button';
    submit.className = 'primary-button';
    submit.textContent = 'Check order';

    const render = (): void => {
      list.replaceChildren();

      order.forEach((item, index) => {
        const row = document.createElement('div');
        row.className = 'sequence-order__row';
        row.setAttribute('role', 'listitem');

        const position = document.createElement('span');
        position.className = 'sequence-order__position';
        position.textContent = String(index + 1);
        position.setAttribute('aria-hidden', 'true');

        const itemButton = document.createElement('button');
        itemButton.type = 'button';
        itemButton.className = 'sequence-order__item';
        itemButton.classList.toggle('sequence-order__item--selected', selectedId === item.id);
        itemButton.setAttribute('aria-pressed', String(selectedId === item.id));
        itemButton.textContent = `${item.symbol ?? ''} ${item.label}`.trim();
        itemButton.addEventListener('click', () => {
          if (!selectedId) {
            selectedId = item.id;
            status.textContent = 'Now tap the card you want to swap with.';
            render();
            return;
          }

          if (selectedId === item.id) {
            selectedId = null;
            status.textContent = 'Selection cleared.';
            render();
            return;
          }

          const firstIndex = order.findIndex((candidate) => candidate.id === selectedId);
          order = swapItems(order, firstIndex, index);
          selectedId = null;
          status.textContent = 'Cards swapped.';
          render();
        });

        const controls = document.createElement('span');
        controls.className = 'sequence-order__controls';

        const up = document.createElement('button');
        up.type = 'button';
        up.className = 'sequence-order__move';
        up.textContent = '↑';
        up.disabled = index === 0;
        up.setAttribute('aria-label', `Move ${item.label} earlier`);
        up.addEventListener('click', () => {
          order = moveItem(order, index, index - 1);
          selectedId = null;
          status.textContent = `${item.label} moved earlier.`;
          render();
        });

        const down = document.createElement('button');
        down.type = 'button';
        down.className = 'sequence-order__move';
        down.textContent = '↓';
        down.disabled = index === order.length - 1;
        down.setAttribute('aria-label', `Move ${item.label} later`);
        down.addEventListener('click', () => {
          order = moveItem(order, index, index + 1);
          selectedId = null;
          status.textContent = `${item.label} moved later.`;
          render();
        });

        controls.append(up, down);
        row.append(position, itemButton, controls);
        list.append(row);
      });
    };

    submit.addEventListener('click', () => {
      submit.disabled = true;
      onSubmit({ orderedItemIds: order.map((item) => item.id) });
    });

    wrapper.append(instructions, list, status, submit);
    host.append(wrapper);
    render();
  }
};
