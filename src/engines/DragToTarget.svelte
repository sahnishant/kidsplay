<script lang="ts">
  import type { DragToTargetQuestion } from '../contracts/question';
  import { createMatchingDisplayOrder, matchingClueLabel } from '../mechanics/matchingPresentation';
  import SemanticVisualPresenter from '../presentation/SemanticVisualPresenter.svelte';
  import { resolveItemVisualPresentation } from '../presentation/semanticVisualPresentation';
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
  let displayOrder = $derived.by(() => createMatchingDisplayOrder(
    question.interaction.items,
    question.interaction.targets,
    question.solution.assignments
  ));

  function pairedItemLabel(targetId: string): string | undefined {
    return question.interaction.items.find(
      (item) => question.solution.assignments[item.id] === targetId
    )?.label;
  }

  function targetDisplayLabel(targetId: string, label: string): string {
    return matchingClueLabel(label, pairedItemLabel(targetId));
  }

  function assignedLabel(targetId: string): string {
    const items = question.interaction.items.filter((item) => assignments[item.id] === targetId);
    return items.length
      ? items.map((item) => `${item.symbol ?? ''} ${item.label}`.trim()).join(', ')
      : 'Drop here';
  }

  function assign(itemId: string, targetId: string): void {
    if (locked) return;
    const nextAssignments = { ...assignments, [itemId]: targetId };
    assignments = nextAssignments;
    selectedItemId = null;

    if (question.interaction.items.every((item) => Boolean(nextAssignments[item.id]))) {
      locked = true;
      onSubmit({ assignments: { ...nextAssignments } });
    }
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
</script>

<div class="drag-stage">
  <div class="drag-items" aria-label="Things to move">
    {#each displayOrder.items as item (item.id)}
      {@const visual = resolveItemVisualPresentation(item, { allowLabelInference: false, context: 'drag-item' })}
      <button
        type="button"
        class={`drag-item${visual.hasVisuals ? ' drag-item--visual' : ''}${selectedItemId === item.id ? ' drag-item--selected' : ''}${assignments[item.id] ? ' drag-item--assigned' : ''}`}
        aria-pressed={selectedItemId === item.id}
        disabled={locked}
        onclick={() => clickItem(item.id)}
        onpointerdown={(event) => pointerDown(item.id, event)}
        onpointermove={(event) => pointerMove(item.id, event)}
        onpointerup={(event) => pointerEnd(item.id, event)}
        onpointercancel={(event) => pointerEnd(item.id, event)}
      >
        {#if visual.hasVisuals}
          <SemanticVisualPresenter presentation={visual} class="drag-visuals" itemClass="drag-visual" />
        {:else if item.symbol}
          <span class="drag-symbol" aria-hidden="true">{item.symbol}</span>
        {/if}
        <span>{item.label}</span>
      </button>
    {/each}
  </div>

  <div class="target-grid">
    {#each displayOrder.targets as target (target.id)}
      {@const visual = resolveItemVisualPresentation(target, { allowLabelInference: false, context: 'drag-target' })}
      <button
        type="button"
        class={`drop-target${visual.hasVisuals ? ' drop-target--visual' : ''}`}
        data-drop-target="true"
        data-target-id={target.id}
        disabled={locked}
        onclick={() => selectedItemId && assign(selectedItemId, target.id)}
      >
        {#if visual.hasVisuals}
          <SemanticVisualPresenter presentation={visual} class="target-visuals" itemClass="target-visual" />
        {:else if target.symbol}
          <span class="drag-symbol" aria-hidden="true">{target.symbol}</span>
        {/if}
        <strong>{targetDisplayLabel(target.id, target.label)}</strong>
        <span class="drop-target__slot">{assignedLabel(target.id)}</span>
      </button>
    {/each}
  </div>
</div>

<style>
  .drag-item--visual {
    min-width: 142px;
    min-height: 110px;
    display: grid;
    place-items: center;
    gap: 3px;
  }

  :global(.drag-visuals),
  :global(.target-visuals) {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
  }

  :global(.drag-visual) {
    width: 68px;
    height: 58px;
  }

  :global(.target-visual) {
    width: 76px;
    height: 62px;
  }

  .drag-symbol {
    font-size: 2rem;
    line-height: 1;
  }

  .drop-target--visual {
    min-height: 150px;
  }
</style>
