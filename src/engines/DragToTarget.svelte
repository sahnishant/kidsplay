<script lang="ts">
  import type { DragToTargetQuestion } from '../contracts/question';
  import { createMatchingDisplayOrder, matchingClueLabel } from '../mechanics/matchingPresentation';
  import SemanticVisualPresenter from '../presentation/SemanticVisualPresenter.svelte';
  import { resolveItemVisualPresentation } from '../presentation/semanticVisualPresentation';
  import type { EngineProps } from './types';

  let {
    question,
    onSubmit,
    submissionMode = 'explicit'
  }: EngineProps<DragToTargetQuestion> = $props();

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
  let compactLayout = $derived(
    question.interaction.items.length <= 3 && question.interaction.targets.length <= 3
  );
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

  function commit(nextAssignments: Record<string, string>): void {
    if (locked) return;
    locked = true;
    onSubmit({ assignments: { ...nextAssignments } });
  }

  function assign(itemId: string, targetId: string): void {
    if (locked) return;
    const nextAssignments = { ...assignments, [itemId]: targetId };
    assignments = nextAssignments;
    selectedItemId = null;

    if (
      submissionMode === 'auto_when_complete'
      && question.interaction.items.every((item) => Boolean(nextAssignments[item.id]))
    ) {
      commit(nextAssignments);
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

<div class={`drag-stage${compactLayout ? ' drag-stage--compact' : ''}`}>
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

{#if submissionMode === 'explicit'}
  <button class="primary-button" type="button" disabled={locked || !complete} onclick={() => commit(assignments)}>
    Check answer
  </button>
{/if}

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

  @media (max-width: 480px) {
    .drag-stage--compact {
      gap: 8px;
    }

    .drag-stage--compact .drag-items {
      min-height: 0;
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 6px;
      padding: 6px;
      border-radius: 16px;
    }

    .drag-stage--compact .drag-item {
      min-width: 0;
      min-height: 54px;
      padding: 7px 5px;
      border-radius: 14px;
      font-size: 0.9rem;
      line-height: 1.05;
    }

    .drag-stage--compact .drag-item--visual {
      min-width: 0;
      min-height: 72px;
    }

    .drag-stage--compact :global(.drag-visual) {
      width: 44px;
      height: 38px;
    }

    .drag-stage--compact .drag-symbol {
      font-size: 1.6rem;
    }

    .drag-stage--compact .target-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 6px;
    }

    .drag-stage--compact .drop-target,
    .drag-stage--compact .drop-target--visual {
      min-height: 112px;
      gap: 4px;
      padding: 7px 5px;
      border-width: 2px;
      border-radius: 14px;
    }

    .drag-stage--compact .drop-target strong {
      font-size: 0.82rem;
      line-height: 1.08;
    }

    .drag-stage--compact .drop-target__slot {
      min-height: 0;
      font-size: 0.72rem;
      line-height: 1.05;
    }

    .drag-stage--compact :global(.target-visual) {
      width: 42px;
      height: 36px;
    }
  }
</style>