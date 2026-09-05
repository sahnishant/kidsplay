<script lang="ts">
  import { untrack } from 'svelte';
  import type { EqualPartsQuestion } from '../contracts/question';
  import { createEqualPartsState, equalPartSector } from '../mechanics/equalParts.mjs';
  import type { EngineProps } from './types';

  let { question, onSubmit, initialState, onStateChange, mode = 'question' }: EngineProps<EqualPartsQuestion> = $props();
  let assignments = $state<Array<string | null>>(untrack(() => createEqualPartsState(question, initialState).assignments));
  let selectedCategory = $state<string | null>(untrack(() => question.interaction.categories[0].id));
  let history = $state<Array<Array<string | null>>>([]);
  let locked = $state(false);
  const palette = ['#f5ce75', '#88c9be', '#c4ace3', '#edb29a'];
  let complete = $derived(assignments.every((id) => id !== null));
  let counts = $derived(Object.fromEntries(question.interaction.categories.map(({ id }) => [id, assignments.filter((item) => item === id).length])));
  let gridColumns = $derived(question.interaction.representation === 'bar'
    ? question.interaction.partCount
    : [4, 3, 2, 1].find((n) => question.interaction.partCount % n === 0) ?? 1);

  $effect(() => {
    const snapshot = { assignments: [...assignments] };
    untrack(() => onStateChange?.(snapshot));
  });

  function assign(index: number): void {
    if (locked || assignments[index] === selectedCategory) return;
    history = [...history.slice(-29), [...assignments]];
    assignments = assignments.map((id, i) => i === index ? selectedCategory : id);
  }
  function undo(): void {
    if (locked || !history.length) return;
    assignments = history[history.length - 1];
    history = history.slice(0, -1);
  }
  function submit(): void {
    if (locked || (mode === 'question' && !complete)) return;
    if (mode === 'question') locked = true;
    onSubmit({ assignments: [...assignments] });
  }
  function categoryIndex(id: string | null): number {
    return question.interaction.categories.findIndex((category) => category.id === id);
  }
  function partLabel(index: number): string {
    const category = question.interaction.categories.find(({ id }) => id === assignments[index]);
    return `Part ${index + 1}: ${category?.label ?? 'empty'}`;
  }
</script>

<div class="equal-parts" data-engine="equal_parts" data-mode={mode}>
  <p class="whole"><strong>{question.interaction.wholeLabel}</strong> · {question.interaction.partCount} equal parts</p>
  <div class="categories" role="group" aria-label="Choose what to place">
    {#each question.interaction.categories as category, index}
      <button type="button" class:chosen={selectedCategory === category.id} aria-pressed={selectedCategory === category.id} disabled={locked} onclick={() => selectedCategory = category.id}>
        <span class="swatch" style={`background:${palette[index]}`} aria-hidden="true">{category.symbol ?? String.fromCharCode(65 + index)}</span>
        <span>{category.label}<small>{#if mode === 'explore'}{counts[category.id]}/{question.interaction.partCount}{:else}{question.solution.fractions[category.id].numerator}/{question.solution.fractions[category.id].denominator}{/if}</small></span>
      </button>
    {/each}
    <button type="button" class:chosen={selectedCategory === null} aria-pressed={selectedCategory === null} disabled={locked} onclick={() => selectedCategory = null}>Erase</button>
  </div>
  <p class="instruction">Choose above, then tap a part below.</p>
  {#if question.interaction.representation === 'circle'}
    <svg viewBox="0 0 200 200" class="circle" role="group" aria-label={question.interaction.wholeLabel}>
      <title>{question.interaction.wholeLabel}, divided into {question.interaction.partCount} equal parts</title>
      {#each assignments as id, index}
        {@const sector = equalPartSector(index, assignments.length)}
        <path d={sector.path} fill={palette[categoryIndex(id)] ?? '#f6f4ed'} stroke="#304354" stroke-width="1.5" role="button" tabindex={locked ? -1 : 0} aria-label={partLabel(index)} aria-disabled={locked} onclick={() => assign(index)} onkeydown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); assign(index); } }} />
        <text x={sector.labelX} y={sector.labelY} text-anchor="middle" dominant-baseline="middle" aria-hidden="true" fill="#132a3b" pointer-events="none">{index + 1}</text>
      {/each}
    </svg>
  {:else}
    <div class="diagram" style={`grid-template-columns:repeat(${gridColumns},minmax(0,1fr))`} aria-hidden="true">
      {#each assignments as id, index}
        <span style={`background:${palette[categoryIndex(id)] ?? '#f6f4ed'}`}>{index + 1}</span>
      {/each}
    </div>
  {/if}
  <div class="parts" role="group" aria-label="Large controls for each equal part">
    {#each assignments as id, index}
      <button type="button" disabled={locked} aria-label={partLabel(index)} style={`--part-fill:${palette[categoryIndex(id)] ?? '#f6f4ed'}`} onclick={() => assign(index)}>
        <b>{index + 1}</b><span aria-hidden="true">{id ? question.interaction.categories[categoryIndex(id)].symbol ?? String.fromCharCode(65 + categoryIndex(id)) : '·'}</span>
      </button>
    {/each}
  </div>
  <div class="actions">
    <button type="button" disabled={locked || !history.length} onclick={undo}>Undo</button>
    <button type="button" class="primary-button" disabled={locked || (mode === 'question' && !complete)} onclick={submit}>{mode === 'explore' ? 'Look at my whole' : 'Check my whole'}</button>
  </div>
  <p role="status" class="instruction">{mode === 'explore' ? 'Try different arrangements. There is no right arrangement to find here.' : complete ? 'Ready to check.' : `${assignments.filter((id) => id === null).length} parts still empty.`}</p>
</div>

<style>
  .equal-parts{max-width:640px;margin:auto;display:grid;gap:6px}.whole,.instruction{margin:0;line-height:1.3}.instruction{font-size:.85rem}.categories{display:flex;flex-wrap:wrap;gap:5px}.categories button{display:flex;align-items:center;gap:5px;min-height:48px;flex:1;padding:5px;border:1px solid currentColor;border-radius:10px;background:transparent;color:inherit}.categories small{display:block;font-size:1rem;font-weight:800}.chosen{outline:2px solid currentColor;outline-offset:1px}.swatch{display:grid;place-items:center;min-width:28px;min-height:28px;border-radius:7px;color:#132a3b}.circle{display:block;width:min(200px,100%);margin:0 auto}.circle path{cursor:pointer}.circle path:focus-visible{stroke-width:4}.diagram{display:grid;min-height:110px;border:2px solid #304354;border-radius:5px;overflow:hidden}.diagram span{display:grid;place-items:center;border:1px solid #304354;color:#132a3b;font-weight:800;min-height:36px;min-width:0}.parts{display:grid;grid-template-columns:repeat(auto-fit,minmax(48px,1fr));gap:5px}.parts button{display:flex;align-items:center;justify-content:center;gap:4px;background:var(--part-fill);color:#132a3b;border:1px solid #304354;border-radius:9px;min-height:48px;padding:4px}.actions{display:flex;gap:6px}.actions button{min-height:46px}.actions button:last-child{flex:1}button:focus-visible{outline:3px solid;outline-offset:2px}button:disabled{cursor:default;opacity:.65}@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
</style>
