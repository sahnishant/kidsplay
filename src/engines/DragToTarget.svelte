<script lang="ts">
  import type { DragToTargetQuestion } from '../contracts/question';
  import type { EngineProps } from './types';

  let { question, onSubmit }: EngineProps<DragToTargetQuestion> = $props();

  let assignments = $state<Record<string, string>>({});
  let selectedItemId = $state<string | null>(null);
  let locked = $state(false);
  let suppressClickFor: string | null = null;
  let dragState: {
    itemId: string;
    pointerId: number;
    startX: number;
    startY: number;
    moved: boolean;
  } | null = null;
  let complete = $derived(question.interaction.items.every((item) => Boolean(assignments[item.id])));

  function targetLabel(targetId: string): string {
    return question.interaction.targets.find((target) => target.id === targetId)?.label ?? targetId;
  }

  function assignedLabel(targetId: string): string {
    const items = question.interaction.items.filter((item) => assignments[item.id] === targetId);
    return items.length
      ? items.map((item) => `${item.symbol ?? ''} ${item.label}`.trim()).join(', ')
      : 'Drop here';
  }

  function assign(itemId: string, targetId: string): void {
    if (locked) return;
    assignments[itemId] = targetId;
    selectedItemId = null;
  }

  function clickItem(itemId: string): void {
    if (locked) return;
    if (suppressClickFor === itemId) {
      suppressClickFor = null;
      return;
    }
    selectedItemId = selectedItemId === itemId ? null : itemId;
  }

  function pointerDown(itemId: string, event: PointerEvent): void {
    if (locked || (event.pointerType === 'mouse' && event.button !== 0)) return;
    dragState = {
      itemId,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      moved: false
    };
    selectedItemId = itemId;
    const button = event.currentTarget as HTMLButtonElement;
    button.setPointerCapture(event.pointerId);
    button.classList.add('drag-item--dragging');
  }

  function pointerMove(itemId: string, event: PointerEvent): void {
    if (!dragState || dragState.itemId !== itemId || dragState.pointerId !== event.pointerId) return;
    const dx = event.clientX - dragState.startX;
    const dy = event.clientY - dragState.startY;
    if (Math.hypot(dx, dy) > 6) dragState.moved = true;
    (event.currentTarget as HTMLButtonElement).style.transform = `translate(${dx}px, ${dy}px) scale(1.04)`;
  }

  function pointerEnd(itemId: string, event: PointerEvent): void {
    if (!dragState || dragState.itemId !== itemId || dragState.pointerId !== event.pointerId) return;
    const state = dragState;
    dragState = null;
    const button = event.currentTarget as HTMLButtonElement;
    button.classList.remove('drag-item--dragging');
    if (button.hasPointerCapture(event.pointerId)) button.releasePointerCapture(event.pointerId);
    button.style.pointerEvents = 'none';
    const elementBelow = document.elementFromPoint(event.clientX, event.clientY);
    button.style.pointerEvents = '';
    button.style.transform = '';

    const target = elementBelow?.closest<HTMLElement>('[data-drop-target="true"]');
    const targetId = target?.dataset.targetId;
    if (state.moved) suppressClickFor = itemId;
    if (state.moved && targetId) assign(itemId, targetId);
  }

  function submit(): void {
    if (!complete || locked) return;
    locked = true;
    onSubmit({ assignments: { ...assignments } });
  }
</script>

<div class="drag-stage">
  <div class="drag-items" aria-label="Things to move">
    {#each question.interaction.items as item (item.id)}
      <button
        type="button"
        class={`drag-item${selectedItemId === item.id ? ' drag-item--selected' : ''}${assignments[item.id] ? ' drag-item--assigned' : ''}`}
        aria-pressed={selectedItemId === item.id}
        disabled={locked}
        onclick={() => clickItem(item.id)}
        onpointerdown={(event) => pointerDown(item.id, event)}
        onpointermove={(event) => pointerMove(item.id, event)}
        onpointerup={(event) => pointerEnd(item.id, event)}
        onpointercancel={(event) => pointerEnd(item.id, event)}
      >
        {`${item.symbol ?? ''} ${item.label}${assignments[item.id] ? ` → ${targetLabel(assignments[item.id])}` : ''}`.trim()}
      </button>
    {/each}
  </div>

  <div class="target-grid">
    {#each question.interaction.targets as target (target.id)}
      <button
        type="button"
        class="drop-target"
        data-drop-target="true"
        data-target-id={target.id}
        disabled={locked}
        onclick={() => selectedItemId && assign(selectedItemId, target.id)}
      >
        <strong>{`${target.symbol ?? ''} ${target.label}`.trim()}</strong>
        <span class="drop-target__slot">{assignedLabel(target.id)}</span>
      </button>
    {/each}
  </div>
</div>

<button class="primary-button" type="button" disabled={locked || !complete} onclick={submit}>
  Check answer
</button>
