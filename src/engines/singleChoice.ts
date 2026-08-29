import type { InteractionEngine } from './types';

const shuffled = <T>(values: T[]): T[] => {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapWith = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapWith]] = [copy[swapWith], copy[index]];
  }
  return copy;
};

export const singleChoiceEngine: InteractionEngine = {
  key: 'single_choice@1',
  mount: ({ question, host, onSubmit }) => {
    if (question.interaction.type !== 'single_choice') {
      throw new Error('singleChoiceEngine received an incompatible question');
    }

    const interaction = question.interaction;
    const options = interaction.shuffleOptions ? shuffled(interaction.options) : [...interaction.options];
    let selectedOptionId: string | null = null;

    const choices = document.createElement('div');
    choices.className = 'choice-grid';

    const submit = document.createElement('button');
    submit.type = 'button';
    submit.className = 'primary-button';
    submit.textContent = 'Check answer';
    submit.disabled = true;

    const buttons = new Map<string, HTMLButtonElement>();

    const refresh = () => {
      for (const [optionId, button] of buttons) {
        const selected = optionId === selectedOptionId;
        button.classList.toggle('choice-button--selected', selected);
        button.setAttribute('aria-pressed', String(selected));
      }
      submit.disabled = selectedOptionId === null;
    };

    for (const option of options) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'choice-button';
      button.textContent = option.label;
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', () => {
        selectedOptionId = option.id;
        refresh();
      });
      buttons.set(option.id, button);
      choices.append(button);
    }

    submit.addEventListener('click', () => {
      if (!selectedOptionId) return;
      submit.disabled = true;
      for (const button of buttons.values()) button.disabled = true;
      onSubmit({ selectedOptionIds: [selectedOptionId] });
    });

    host.append(choices, submit);
  }
};
