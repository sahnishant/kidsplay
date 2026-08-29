import type { InteractionEngine } from './types';

export const wordBankFillEngine: InteractionEngine = {
  key: 'word_bank_fill@1',
  mount: ({ question, host, onSubmit }) => {
    if (question.interaction.type !== 'word_bank_fill') {
      throw new Error('wordBankFillEngine received an incompatible question');
    }

    const interaction = question.interaction;
    const blankIds = interaction.segments
      .filter((segment): segment is { type: 'blank'; id: string } => segment.type === 'blank')
      .map((segment) => segment.id);

    const answers = new Map<string, string>();
    const blankButtons = new Map<string, HTMLButtonElement>();
    let activeBlankId = blankIds[0] ?? null;

    const sentence = document.createElement('div');
    sentence.className = 'fill-sentence';

    const submit = document.createElement('button');
    submit.type = 'button';
    submit.className = 'primary-button';
    submit.textContent = 'Check answer';
    submit.disabled = true;

    const refresh = () => {
      for (const [blankId, button] of blankButtons) {
        const wordId = answers.get(blankId);
        const word = interaction.wordBank.find((candidate) => candidate.id === wordId);
        button.textContent = word?.label ?? '___';
        button.classList.toggle('fill-blank--active', blankId === activeBlankId);
      }
      submit.disabled = blankIds.some((blankId) => !answers.has(blankId));
    };

    for (const segment of interaction.segments) {
      if (segment.type === 'text') {
        const text = document.createElement('span');
        text.textContent = segment.value;
        sentence.append(text);
      } else {
        const blank = document.createElement('button');
        blank.type = 'button';
        blank.className = 'fill-blank';
        blank.setAttribute('aria-label', 'Blank answer');
        blank.addEventListener('click', () => {
          activeBlankId = segment.id;
          refresh();
        });
        blankButtons.set(segment.id, blank);
        sentence.append(blank);
      }
    }

    const bank = document.createElement('div');
    bank.className = 'word-bank';

    for (const word of interaction.wordBank) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'word-chip';
      button.textContent = word.label;
      button.addEventListener('click', () => {
        if (!activeBlankId) return;
        answers.set(activeBlankId, word.id);
        activeBlankId = blankIds.find((blankId) => !answers.has(blankId)) ?? activeBlankId;
        refresh();
      });
      bank.append(button);
    }

    submit.addEventListener('click', () => {
      if (submit.disabled) return;
      submit.disabled = true;
      for (const button of bank.querySelectorAll('button')) button.setAttribute('disabled', 'true');
      for (const button of blankButtons.values()) button.disabled = true;
      onSubmit({ blankAnswers: Object.fromEntries(answers) });
    });

    refresh();
    host.append(sentence, bank, submit);
  }
};
