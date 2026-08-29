import type { MazePathQuestion } from '../contracts/question';
import { canTravel, WALL_BOTTOM, WALL_LEFT, WALL_RIGHT, WALL_TOP } from '../mechanics/maze';
import type { InteractionEngine } from './types';

function asMazePath(question: Parameters<InteractionEngine['mount']>[0]['question']): MazePathQuestion {
  if (question.interaction.type !== 'maze_path') throw new Error('mazePathEngine received wrong question type');
  return question as MazePathQuestion;
}

export const mazePathEngine: InteractionEngine = {
  key: 'maze_path@1',
  mount: ({ question: rawQuestion, host, onSubmit }) => {
    const question = asMazePath(rawQuestion);
    const interaction = question.interaction;
    let path = [interaction.startIndex];
    let complete = false;

    const wrapper = document.createElement('div');
    wrapper.className = 'maze-path';

    const instructions = document.createElement('p');
    instructions.className = 'maze-path__instructions';
    instructions.textContent = `Tap adjoining cells to guide ${interaction.startLabel} to ${interaction.goalLabel}. Tap an earlier path cell to go back.`;

    const grid = document.createElement('div');
    grid.className = 'maze-path__grid';
    grid.style.setProperty('--maze-cols', String(interaction.cols));
    grid.setAttribute('role', 'grid');
    grid.setAttribute('aria-label', `${interaction.startLabel} maze to ${interaction.goalLabel}`);

    const status = document.createElement('div');
    status.className = 'maze-path__status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.textContent = 'Choose the next open cell.';

    const buttons: HTMLButtonElement[] = [];

    const render = (): void => {
      const pathSet = new Set(path);
      const current = path[path.length - 1];
      buttons.forEach((button, index) => {
        button.classList.toggle('maze-path__cell--path', pathSet.has(index));
        button.classList.toggle('maze-path__cell--current', current === index);
        button.classList.toggle('maze-path__cell--start', index === interaction.startIndex);
        button.classList.toggle('maze-path__cell--goal', index === interaction.goalIndex);
      });
    };

    interaction.wallMasks.forEach((mask, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'maze-path__cell';
      button.style.borderTopWidth = mask & WALL_TOP ? '3px' : '0';
      button.style.borderRightWidth = mask & WALL_RIGHT ? '3px' : '0';
      button.style.borderBottomWidth = mask & WALL_BOTTOM ? '3px' : '0';
      button.style.borderLeftWidth = mask & WALL_LEFT ? '3px' : '0';
      const row = Math.floor(index / interaction.cols);
      const col = index % interaction.cols;
      button.setAttribute('aria-label', `Maze row ${row + 1}, column ${col + 1}`);

      if (index === interaction.startIndex) button.textContent = interaction.startSymbol;
      if (index === interaction.goalIndex) button.textContent = interaction.goalSymbol;

      button.addEventListener('click', () => {
        if (complete) return;
        const existingPathIndex = path.indexOf(index);
        if (existingPathIndex >= 0) {
          path = path.slice(0, existingPathIndex + 1);
          status.textContent = 'Moved back. Choose another open path.';
          render();
          return;
        }

        const current = path[path.length - 1];
        if (!canTravel(interaction.wallMasks, interaction.rows, interaction.cols, current, index)) {
          status.textContent = 'A wall blocks that move. Try an adjoining open cell.';
          return;
        }

        path.push(index);
        render();
        if (index !== interaction.goalIndex) {
          status.textContent = 'Good. Keep going.';
          return;
        }

        complete = true;
        status.textContent = `${interaction.goalLabel} found.`;
        for (const cell of buttons) cell.disabled = true;
        window.setTimeout(() => onSubmit({ pathIndices: [...path] }), 300);
      });

      buttons.push(button);
      grid.append(button);
    });

    wrapper.append(instructions, grid, status);
    host.append(wrapper);
    render();
  }
};
