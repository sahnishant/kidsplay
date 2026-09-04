<script lang="ts">
  import type { SingleChoiceQuestion } from '../contracts/question';
  import { shuffled } from '../mechanics/random';
  import SemanticVisualPresenter from '../presentation/SemanticVisualPresenter.svelte';
  import { resolveItemVisualPresentation } from '../presentation/semanticVisualPresentation';
  import type { EngineProps } from './types';

  let { question, onSubmit }: EngineProps<SingleChoiceQuestion> = $props();
  let options = $derived.by(() => question.interaction.shuffleOptions ? shuffled(question.interaction.options, Math.random) : [...question.interaction.options]);
  let selectedOptionId = $state<string | null>(null);
  let locked = $state(false);
  let presentation = $derived(question.interaction.presentation);
  let visualDominant = $derived(presentation?.mode === 'visual_dominant');
  let labelMode = $derived(presentation?.labels ?? 'visible');

  function selectAndSubmit(optionId: string): void {
    if (locked) return;
    selectedOptionId = optionId;
    locked = true;
    onSubmit({ selectedOptionIds: [optionId] });
  }
</script>

<div
  class:choice-grid--visual-dominant={visualDominant}
  class="choice-grid"
  data-presentation={visualDominant ? 'visual_dominant' : 'standard'}
  data-presentation-tier={presentation?.tier}
  data-choice-count={question.interaction.options.length}
>
  {#each options as option (option.id)}
    {@const visual = resolveItemVisualPresentation(option)}
    <button
      type="button"
      class:choice-button--visual={visual.hasVisuals}
      class:choice-button--visual-dominant={visualDominant}
      class:choice-button--selected={selectedOptionId === option.id}
      class="choice-button"
      aria-label={option.label}
      aria-pressed={selectedOptionId === option.id}
      disabled={locked}
      onclick={() => selectAndSubmit(option.id)}
    >
      <SemanticVisualPresenter presentation={visual} class="choice-button__visuals" itemClass="choice-button__visual" />
      <span class:choice-button__label--hidden={labelMode === 'hidden'} class:choice-button__label--secondary={labelMode === 'secondary'} class="choice-button__label">{option.label}</span>
    </button>
  {/each}
</div>

<style>
  .choice-button--visual{min-height:120px;display:grid;place-content:center;gap:4px;padding:8px}
  :global(.choice-button__visuals){display:flex;align-items:center;justify-content:center;width:100%;min-height:62px}
  :global(.choice-button__visual){width:min(82px,72%);height:64px}
  .choice-button__label{line-height:1.15}.choice-button__label--secondary{opacity:.72;font-size:.82em}
  .choice-button__label--hidden{position:absolute;width:1px;height:1px;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap}
  .choice-grid--visual-dominant{min-height:54vh;grid-auto-rows:1fr}.choice-button--visual-dominant{position:relative;min-width:0;min-height:145px;padding:8px;border-radius:22px;border-width:3px}
  .choice-grid--visual-dominant[data-choice-count='2'] .choice-button--visual-dominant{min-height:300px}
  .choice-button--visual-dominant :global(.choice-button__visual){width:min(128px,82%);height:min(128px,21vh)}
  .choice-grid--visual-dominant[data-choice-count='2'] .choice-button--visual-dominant :global(.choice-button__visual){width:min(150px,90%);height:min(168px,27vh)}
</style>
