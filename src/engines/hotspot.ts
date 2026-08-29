import type { HotspotQuestion } from '../contracts/question';
import { asPercent, regionBox } from '../mechanics/hitRegions';
import type { InteractionEngine } from './types';

function asHotspot(question: Parameters<InteractionEngine['mount']>[0]['question']): HotspotQuestion {
  if (question.interaction.type !== 'hotspot') throw new Error('hotspotEngine received wrong question type');
  return question as HotspotQuestion;
}

export const hotspotEngine: InteractionEngine = {
  key: 'hotspot@1',
  mount: ({ question: rawQuestion, host, onSubmit }) => {
    const question = asHotspot(rawQuestion);
    const selectedRegionIds = new Set<string>();

    const wrapper = document.createElement('div');
    wrapper.className = 'hotspot';

    const instructions = document.createElement('p');
    instructions.className = 'hotspot__instructions';
    instructions.textContent = question.interaction.selectionMode === 'single'
      ? 'Tap the correct place.'
      : 'Tap every place that matches the question.';

    const board = document.createElement('div');
    board.className = `hotspot__board hotspot__board--${question.interaction.board.theme ?? 'plain'}`;
    board.setAttribute('role', 'group');
    board.setAttribute('aria-label', question.interaction.board.ariaLabel);

    const status = document.createElement('div');
    status.className = 'hotspot__status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');

    const submit = document.createElement('button');
    submit.type = 'button';
    submit.className = 'primary-button';
    submit.textContent = 'Check answer';
    submit.disabled = true;

    for (const region of question.interaction.board.regions) {
      const box = regionBox(region.shape);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'hotspot__region';
      if (box.circular) button.classList.add('hotspot__region--circle');
      button.style.left = asPercent(box.left);
      button.style.top = asPercent(box.top);
      button.style.width = asPercent(box.width);
      button.style.height = asPercent(box.height);
      button.setAttribute('aria-pressed', 'false');
      button.setAttribute('aria-label', region.label);

      if (region.symbol) {
        const symbol = document.createElement('span');
        symbol.className = 'hotspot__symbol';
        symbol.textContent = region.symbol;
        symbol.setAttribute('aria-hidden', 'true');
        button.append(symbol);
      }

      const label = document.createElement('span');
      label.className = 'hotspot__label';
      label.textContent = region.label;
      button.append(label);

      button.addEventListener('click', () => {
        if (question.interaction.selectionMode === 'single') {
          selectedRegionIds.clear();
          selectedRegionIds.add(region.id);
          for (const candidate of board.querySelectorAll<HTMLButtonElement>('.hotspot__region')) {
            const selected = candidate === button;
            candidate.classList.toggle('hotspot__region--selected', selected);
            candidate.setAttribute('aria-pressed', String(selected));
          }
        } else {
          const selected = !selectedRegionIds.has(region.id);
          if (selected) selectedRegionIds.add(region.id);
          else selectedRegionIds.delete(region.id);
          button.classList.toggle('hotspot__region--selected', selected);
          button.setAttribute('aria-pressed', String(selected));
        }

        submit.disabled = selectedRegionIds.size === 0;
        status.textContent = `${selectedRegionIds.size} place${selectedRegionIds.size === 1 ? '' : 's'} selected.`;
      });

      board.append(button);
    }

    submit.addEventListener('click', () => {
      if (!selectedRegionIds.size) return;
      submit.disabled = true;
      for (const button of board.querySelectorAll<HTMLButtonElement>('button')) button.disabled = true;
      onSubmit({ selectedRegionIds: [...selectedRegionIds] });
    });

    wrapper.append(instructions, board, status, submit);
    host.append(wrapper);
  }
};
