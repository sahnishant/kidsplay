<script lang="ts">
  import { untrack } from 'svelte';
  import type { CollectionCountQuestion } from '../contracts/question';
  import type { EngineProps } from './types';

  let { question, onSubmit, submissionMode = 'explicit', initialState, onStateChange, mode = 'question' }: EngineProps<CollectionCountQuestion> = $props();
  function restore(value: unknown): Record<string,string> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    const raw = (value as { assignments?: unknown }).assignments;
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
    const items = new Set(question.interaction.items.map((item) => item.id));
    const targets = new Set(question.interaction.targets.map((target) => target.id));
    return Object.fromEntries(Object.entries(raw).filter(([itemId,targetId]) => items.has(itemId) && typeof targetId === 'string' && targets.has(targetId)));
  }
  let assignments = $state<Record<string,string>>(untrack(() => restore(initialState)));
  let selectedId = $state<string|null>(null);
  let locked = $state(false);
  let complete = $derived(question.interaction.items.every((item) => Boolean(assignments[item.id])));
  $effect(() => { const state = snapshot(); untrack(() => onStateChange?.(state)); });
  function snapshot(value = assignments) { return { assignments: { ...value } }; }
  function commit(value = assignments): void { if (locked) return; locked = mode !== 'explore'; onSubmit(snapshot(value)); }
  function assign(targetId: string): void {
    if (locked || !selectedId) return;
    const next = { ...assignments, [selectedId]: targetId };
    selectedId = null; assignments = next; onStateChange?.(snapshot(next));
    if (submissionMode === 'auto_when_complete' && question.interaction.items.every((item) => Boolean(next[item.id]))) commit(next);
  }
  function remove(itemId: string): void {
    if (locked) return;
    const next = { ...assignments }; delete next[itemId]; assignments = next; selectedId = itemId; onStateChange?.(snapshot(next));
  }
  function countFor(targetId: string): number { return Object.values(assignments).filter((id) => id === targetId).length; }
</script>

<div class="collection-count">
  <p class="collection-count__hint">{selectedId ? 'Now tap the group for this object.' : 'Tap an object, then tap a group.'}</p>
  <div class="collection-count__pool" aria-label="Objects to group">
    {#each question.interaction.items.filter((item) => !assignments[item.id]) as item (item.id)}
      <button type="button" class:selected={selectedId === item.id} aria-pressed={selectedId === item.id} disabled={locked} onclick={() => selectedId = selectedId === item.id ? null : item.id}>
        <span aria-hidden="true">{item.symbol ?? '●'}</span><span>{item.label}</span>
      </button>
    {/each}
    {#if complete}<span class="collection-count__done">All objects are in groups.</span>{/if}
  </div>
  <div class="collection-count__targets">
    {#each question.interaction.targets as target (target.id)}
      <section class="collection-count__target" aria-label={`${target.label}, ${countFor(target.id)} objects`}>
        <button type="button" class="collection-count__bin" disabled={locked || !selectedId} onclick={() => assign(target.id)}>
          <span aria-hidden="true">{target.symbol ?? '▣'}</span><strong>{target.label}</strong><small>{countFor(target.id)} here</small>
        </button>
        <div class="collection-count__placed">
          {#each question.interaction.items.filter((item) => assignments[item.id] === target.id) as item (item.id)}
            <button type="button" aria-label={`Move ${item.label} out of ${target.label}`} disabled={locked} onclick={() => remove(item.id)}><span aria-hidden="true">{item.symbol ?? '●'}</span></button>
          {/each}
        </div>
      </section>
    {/each}
  </div>
</div>
{#if submissionMode === 'explicit'}<button class="primary-button" type="button" disabled={locked || !complete} onclick={() => commit()}>{mode === 'explore' ? 'Look at my groups' : 'Check groups'}</button>{/if}

<style>
  .collection-count{display:grid;gap:10px;min-width:0}.collection-count__hint{margin:0;text-align:center;font-size:.84rem;font-weight:750}.collection-count__pool{display:flex;flex-wrap:wrap;justify-content:center;gap:7px;min-height:58px;padding:7px;border:1px dashed #aeb9ad;border-radius:14px}.collection-count__pool button,.collection-count__bin,.collection-count__placed button{font:inherit;min-width:48px;min-height:48px;border:2px solid #b9c6b7;border-radius:12px;background:#fffef9;color:inherit}.collection-count__pool button{display:grid;place-items:center;gap:2px;padding:5px 8px}.collection-count__pool button.selected{outline:3px solid currentColor;outline-offset:2px;transform:translateY(-2px)}.collection-count__pool button span:first-child{font-size:1.4rem}.collection-count__done{align-self:center;font-weight:700}.collection-count__targets{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px}.collection-count__target{display:grid;align-content:start;gap:6px;min-height:126px;padding:7px;border:1px solid #d2dacd;border-radius:16px;background:#f8faef}.collection-count__bin{display:grid;grid-template-columns:auto 1fr;grid-template-rows:auto auto;align-items:center;gap:2px 6px;width:100%;padding:6px;text-align:left}.collection-count__bin>span{grid-row:1/3;font-size:1.45rem}.collection-count__bin small{font-size:.72rem}.collection-count__placed{display:flex;flex-wrap:wrap;gap:5px}.collection-count__placed button{padding:4px;font-size:1.25rem}@media(max-width:420px){.collection-count__targets{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(forced-colors:active){.collection-count__target,.collection-count__pool button,.collection-count__bin,.collection-count__placed button{border-color:CanvasText}}
</style>
