<script lang="ts">
  import type { DragToTargetQuestion } from '../contracts/question';
  import { resolveForgivingDropTarget, type DropSnapTarget } from '../mechanics/dragSnap';
  import { createMatchingDisplayOrder, matchingClueLabel } from '../mechanics/matchingPresentation';
  import SemanticVisualPresenter from '../presentation/SemanticVisualPresenter.svelte';
  import { resolveItemVisualPresentation } from '../presentation/semanticVisualPresentation';
  import type { EngineProps } from './types';

  type DragToTargetEngineProps = EngineProps<DragToTargetQuestion> & {
    dropSnapTolerancePx?: number;
    showLabels?: boolean;
    oversized?: boolean;
  };

  let { question, onSubmit, submissionMode = 'explicit', dropSnapTolerancePx = 0, showLabels = true, oversized = false }: DragToTargetEngineProps = $props();
  let assignments = $state<Record<string, string>>({});
  let selectedItemId = $state<string | null>(null);
  let locked = $state(false);
  let suppressClickFor: string | null = null;
  let dragStageElement = $state<HTMLDivElement | null>(null);
  let dragState: { itemId: string; pointerId: number; startX: number; startY: number; moved: boolean } | null = null;
  let complete = $derived(question.interaction.items.every((item) => Boolean(assignments[item.id])));
  let compactLayout = $derived(!oversized && question.interaction.items.length <= 3 && question.interaction.targets.length <= 3);
  let displayOrder = $derived.by(() => createMatchingDisplayOrder(question.interaction.items, question.interaction.targets, question.solution.assignments));

  const pairedItemLabel = (targetId: string) => question.interaction.items.find((item) => question.solution.assignments[item.id] === targetId)?.label;
  const targetDisplayLabel = (targetId: string, label: string) => matchingClueLabel(label, pairedItemLabel(targetId));
  function assignedLabel(targetId: string): string {
    const items = question.interaction.items.filter((item) => assignments[item.id] === targetId);
    return items.length ? items.map((item) => `${item.symbol ?? ''} ${item.label}`.trim()).join(', ') : 'Drop here';
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
    if (submissionMode === 'auto_when_complete' && question.interaction.items.every((item) => Boolean(nextAssignments[item.id]))) commit(nextAssignments);
  }
  function clickItem(itemId: string): void {
    if (locked) return;
    if (suppressClickFor === itemId) { suppressClickFor = null; return; }
    selectedItemId = selectedItemId === itemId ? null : itemId;
  }
  function pointerDown(itemId: string, event: PointerEvent): void {
    if (locked || (event.pointerType === 'mouse' && event.button !== 0)) return;
    dragState = { itemId, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, moved: false };
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
  function validatedDropSnapTolerance(): number {
    if (!Number.isFinite(dropSnapTolerancePx) || dropSnapTolerancePx < 0) throw new Error('Drop snap tolerance must be a finite non-negative number');
    return dropSnapTolerancePx;
  }
  function dropSnapTargets(): DropSnapTarget[] {
    if (!dragStageElement) return [];
    return Array.from(dragStageElement.querySelectorAll<HTMLElement>('[data-drop-target="true"]')).flatMap((element) => {
      const targetId = element.dataset.targetId;
      if (!targetId) return [];
      const rect = element.getBoundingClientRect();
      return [{ targetId, left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom }];
    });
  }
  function pointerEnd(itemId: string, event: PointerEvent): void {
    if (!dragState || dragState.itemId !== itemId || dragState.pointerId !== event.pointerId) return;
    const state = dragState;
    dragState = null;
    const button = event.currentTarget as HTMLButtonElement;
    button.classList.remove('drag-item--dragging');
    if (button.hasPointerCapture(event.pointerId)) button.releasePointerCapture(event.pointerId);
    button.style.transform = '';
    if (state.moved) suppressClickFor = itemId;
    if (!state.moved || event.type === 'pointercancel') return;
    button.style.pointerEvents = 'none';
    const elementBelow = document.elementFromPoint(event.clientX, event.clientY);
    button.style.pointerEvents = '';
    const directTarget = elementBelow?.closest<HTMLElement>('[data-drop-target="true"]');
    const directTargetId = directTarget && dragStageElement?.contains(directTarget) ? directTarget.dataset.targetId : undefined;
    const tolerancePx = validatedDropSnapTolerance();
    const targetId = directTargetId ?? (tolerancePx > 0 ? resolveForgivingDropTarget({ x: event.clientX, y: event.clientY }, undefined, dropSnapTargets(), tolerancePx) : undefined);
    if (targetId) assign(itemId, targetId);
  }
</script>

<div class:drag-stage--oversized={oversized} class="drag-stage" bind:this={dragStageElement} style={compactLayout ? 'gap:8px' : undefined} data-oversized={oversized ? 'true' : undefined}>
  <div class="drag-items" aria-label="Things to move" style={compactLayout ? 'min-height:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;padding:6px' : undefined}>
    {#each displayOrder.items as item (item.id)}
      {@const visual = resolveItemVisualPresentation(item, { allowLabelInference: false, context: 'drag-item' })}
      <button
        type="button"
        class:drag-item--visual={visual.hasVisuals}
        class:drag-item--selected={selectedItemId === item.id}
        class:drag-item--assigned={Boolean(assignments[item.id])}
        class="drag-item"
        aria-label={item.label}
        aria-pressed={selectedItemId === item.id}
        disabled={locked}
        style={compactLayout ? `min-width:0;min-height:${visual.hasVisuals ? '72px' : '54px'};padding:7px 5px;font-size:.9rem;line-height:1.05` : undefined}
        onclick={() => clickItem(item.id)}
        onpointerdown={(event) => pointerDown(item.id, event)}
        onpointermove={(event) => pointerMove(item.id, event)}
        onpointerup={(event) => pointerEnd(item.id, event)}
        onpointercancel={(event) => pointerEnd(item.id, event)}
      >
        {#if visual.hasVisuals}<SemanticVisualPresenter presentation={visual} class="drag-visuals" itemClass="drag-visual" />{:else if item.symbol}<span class="drag-symbol" aria-hidden="true">{item.symbol}</span>{/if}
        {#if showLabels}<span>{item.label}</span>{/if}
      </button>
    {/each}
  </div>

  <div class="target-grid" style={compactLayout ? 'grid-template-columns:repeat(3,minmax(0,1fr));gap:6px' : undefined}>
    {#each displayOrder.targets as target (target.id)}
      {@const visual = resolveItemVisualPresentation(target, { allowLabelInference: false, context: 'drag-target' })}
      <button
        type="button"
        class:drop-target--visual={visual.hasVisuals}
        class="drop-target"
        data-drop-target="true"
        data-target-id={target.id}
        aria-label={targetDisplayLabel(target.id, target.label)}
        disabled={locked}
        style={compactLayout ? 'min-height:112px;gap:4px;padding:7px 5px;border-width:2px' : undefined}
        onclick={() => selectedItemId && assign(selectedItemId, target.id)}
      >
        {#if visual.hasVisuals}<SemanticVisualPresenter presentation={visual} class="target-visuals" itemClass="target-visual" />{:else if target.symbol}<span class="drag-symbol" aria-hidden="true">{target.symbol}</span>{/if}
        {#if showLabels}<strong>{targetDisplayLabel(target.id, target.label)}</strong><span class="drop-target__slot">{assignedLabel(target.id)}</span>{/if}
      </button>
    {/each}
  </div>
</div>

{#if submissionMode === 'explicit'}
  <button class="primary-button" type="button" disabled={locked || !complete} onclick={() => commit(assignments)}>Check answer</button>
{/if}

<style>
  .drag-item--visual{min-width:142px;min-height:105px;display:grid;place-items:center;gap:3px}
  :global(.drag-visuals),:global(.target-visuals){display:flex;align-items:center;justify-content:center;width:100%}
  :global(.drag-visual){width:68px;height:58px}:global(.target-visual){width:76px;height:62px}.drag-symbol{font-size:2rem}.drop-target--visual{min-height:145px}
  .drag-stage--oversized .drag-items{min-height:0;display:grid;place-items:center;padding:4px}.drag-stage--oversized .drag-item{width:min(230px,70vw);min-width:0;min-height:132px;padding:8px;border-radius:24px}
  .drag-stage--oversized :global(.drag-visual){width:min(120px,36vw);height:104px}.drag-stage--oversized .target-grid{gap:9px}.drag-stage--oversized .drop-target{min-width:0;min-height:150px;padding:8px;border-radius:22px}
  .drag-stage--oversized :global(.target-visual){width:min(112px,34vw);height:96px}
</style>
