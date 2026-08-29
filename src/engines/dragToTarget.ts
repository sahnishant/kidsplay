import type { DragItem, DragTarget } from '../contracts/question';
import type { InteractionEngine } from './types';

export const dragToTargetEngine: InteractionEngine = {
  key: 'drag_to_target@1',
  mount: ({ question, host, onSubmit }) => {
    if (question.interaction.type !== 'drag_to_target') {
      throw new Error('dragToTargetEngine received an incompatible question');
    }

    const interaction = question.interaction;
    const assignments: Record<string, string> = {};
    const itemButtons = new Map<string, HTMLButtonElement>();
    const targetSlots = new Map<string, HTMLElement>();
    let selectedItemId: string | null = null;

    const stage = document.createElement('div');
    stage.className = 'drag-stage';

    const itemShelf = document.createElement('div');
    itemShelf.className = 'drag-items';
    itemShelf.setAttribute('aria-label', 'Things to move');

    const targetGrid = document.createElement('div');
    targetGrid.className = 'target-grid';

    const submit = document.createElement('button');
    submit.type = 'button';
    submit.className = 'primary-button';
    submit.textContent = 'Check answer';
    submit.disabled = true;

    const findItem = (itemId: string): DragItem | undefined => interaction.items.find((item) => item.id === itemId);
    const findTarget = (targetId: string): DragTarget | undefined => interaction.targets.find((target) => target.id === targetId);

    const refresh = () => {
      for (const [itemId, button] of itemButtons) {
        const targetId = assignments[itemId];
        const target = targetId ? findTarget(targetId) : undefined;
        button.classList.toggle('drag-item--selected', itemId === selectedItemId);
        button.classList.toggle('drag-item--assigned', Boolean(targetId));
        const item = findItem(itemId);
        button.textContent = `${item?.symbol ?? ''} ${item?.label ?? itemId}${target ? ` → ${target.label}` : ''}`.trim();
        button.setAttribute('aria-pressed', String(itemId === selectedItemId));
      }

      for (const [targetId, slot] of targetSlots) {
        const assignedItems = Object.entries(assignments)
          .filter(([, assignedTargetId]) => assignedTargetId === targetId)
          .map(([itemId]) => findItem(itemId))
          .filter((item): item is DragItem => Boolean(item));
        slot.textContent = assignedItems.map((item) => `${item.symbol ?? ''} ${item.label}`.trim()).join(', ');
      }

      submit.disabled = interaction.items.some((item) => !assignments[item.id]);
    };

    const assign = (itemId: string, targetId: string) => {
      assignments[itemId] = targetId;
      selectedItemId = null;
      refresh();
    };

    for (const item of interaction.items) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'drag-item';
      button.textContent = `${item.symbol ?? ''} ${item.label}`.trim();
      button.setAttribute('aria-pressed', 'false');

      let activePointerId: number | null = null;
      let startX = 0;
      let startY = 0;
      let moved = false;

      button.addEventListener('click', () => {
        if (moved) {
          moved = false;
          return;
        }
        selectedItemId = selectedItemId === item.id ? null : item.id;
        refresh();
      });

      button.addEventListener('pointerdown', (event) => {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        activePointerId = event.pointerId;
        startX = event.clientX;
        startY = event.clientY;
        moved = false;
        selectedItemId = item.id;
        button.setPointerCapture(event.pointerId);
        button.classList.add('drag-item--dragging');
        refresh();
      });

      button.addEventListener('pointermove', (event) => {
        if (event.pointerId !== activePointerId) return;
        const dx = event.clientX - startX;
        const dy = event.clientY - startY;
        if (Math.hypot(dx, dy) > 6) moved = true;
        button.style.transform = `translate(${dx}px, ${dy}px) scale(1.04)`;
      });

      const endPointer = (event: PointerEvent) => {
        if (event.pointerId !== activePointerId) return;
        activePointerId = null;
        button.classList.remove('drag-item--dragging');
        button.style.pointerEvents = 'none';
        const elementBelow = document.elementFromPoint(event.clientX, event.clientY);
        button.style.pointerEvents = '';
        button.style.transform = '';

        const target = elementBelow?.closest<HTMLElement>('[data-drop-target="true"]');
        const targetId = target?.dataset.targetId;
        if (moved && targetId) assign(item.id, targetId);
      };

      button.addEventListener('pointerup', endPointer);
      button.addEventListener('pointercancel', endPointer);
      itemButtons.set(item.id, button);
      itemShelf.append(button);
    }

    for (const target of interaction.targets) {
      const targetButton = document.createElement('button');
      targetButton.type = 'button';
      targetButton.className = 'drop-target';
      targetButton.dataset.dropTarget = 'true';
      targetButton.dataset.targetId = target.id;

      const title = document.createElement('strong');
      title.textContent = `${target.symbol ?? ''} ${target.label}`.trim();
      const slot = document.createElement('span');
      slot.className = 'drop-target__slot';
      slot.textContent = 'Drop here';

      targetButton.append(title, slot);
      targetButton.addEventListener('click', () => {
        if (selectedItemId) assign(selectedItemId, target.id);
      });
      targetSlots.set(target.id, slot);
      targetGrid.append(targetButton);
    }

    submit.addEventListener('click', () => {
      if (submit.disabled) return;
      submit.disabled = true;
      for (const button of itemButtons.values()) button.disabled = true;
      for (const target of targetGrid.querySelectorAll('button')) target.setAttribute('disabled', 'true');
      onSubmit({ assignments: { ...assignments } });
    });

    stage.append(itemShelf, targetGrid);
    host.append(stage, submit);
    refresh();
  }
};
