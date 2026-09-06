<script lang="ts">
  import type { EqualPartsQuestion } from '../contracts/question';
  import { equalPartsTargetCounts, equalPartSector } from '../mechanics/equalParts.mjs';
  let { question, step = 0 }: { question: EqualPartsQuestion; step?: number } = $props();
  const palette = ['#f5ce75', '#88c9be', '#c4ace3', '#edb29a'];
  let counts = $derived(equalPartsTargetCounts(question));
  let categories = $derived(question.interaction.categories);
  let current = $derived(categories[Math.min(step, categories.length - 1)]);
  let example = $derived(categories.flatMap((category, index) => Array<number>(counts[category.id]).fill(index)));
  let columns = $derived(question.interaction.representation === 'bar' ? question.interaction.partCount : [4,3,2,1].find((n) => question.interaction.partCount % n === 0) ?? 1);
</script>

<div class="fraction-example" data-fraction-demonstration>
  <p><strong>{question.interaction.wholeLabel}</strong> · {question.interaction.partCount} equal parts</p>
  <p>Here is one way. Your arrangement can be different.</p>
  {#if question.interaction.representation === 'circle'}
    <svg viewBox="0 0 200 200" role="img" aria-label={`Worked example: ${current.label}, ${counts[current.id]} of ${question.interaction.partCount} equal parts`}>
      <title>One valid allocation, revealed one category at a time</title>
      {#each example as index, part}
        {@const sector = equalPartSector(part, example.length)}
        <path d={sector.path} fill={index <= step ? palette[index] : '#f6f4ed'} stroke="#304354" />
        <text x={sector.labelX} y={sector.labelY} text-anchor="middle" dominant-baseline="middle">{index <= step ? String.fromCharCode(65 + index) : '·'}</text>
      {/each}
    </svg>
  {:else}
    <div class="example-grid" style={`grid-template-columns:repeat(${columns},minmax(0,1fr))`} aria-label="Worked equal-area diagram">
      {#each example as index}<span style={`background:${index <= step ? palette[index] : '#f6f4ed'}`}>{index <= step ? String.fromCharCode(65 + index) : '·'}</span>{/each}
    </div>
  {/if}
  <div class="example-key">{#each categories as category, index}<span><b>{String.fromCharCode(65 + index)}</b> = {category.label}</span>{/each}</div>
  <p aria-live="polite"><strong>{current.label}</strong>: {counts[current.id]} of {question.interaction.partCount} equal parts. That is <strong>{question.solution.fractions[current.id].numerator}/{question.solution.fractions[current.id].denominator}</strong> of the whole.</p>
</div>

<style>
  .fraction-example{display:grid;gap:8px}.fraction-example p{margin:0;line-height:1.4}.fraction-example svg{width:180px;max-width:100%;margin:auto;color:#132a3b}.fraction-example text{font-size:12px;fill:#132a3b}.example-grid{display:grid;border:2px solid #304354;min-height:100px}.example-grid span{display:grid;place-items:center;border:1px solid #304354;min-height:34px;color:#132a3b;font-weight:800}.example-key{display:flex;gap:6px 12px;flex-wrap:wrap;font-size:.85rem}
</style>
