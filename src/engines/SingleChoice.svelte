<script lang="ts">
  import type { SingleChoiceQuestion } from '../contracts/question';
  import { shuffled } from '../mechanics/random';
  import SemanticVisualPresenter from '../presentation/SemanticVisualPresenter.svelte';
  import { resolveItemVisualPresentation } from '../presentation/semanticVisualPresentation';
  import type { EngineProps } from './types';

  let { question, onSubmit }: EngineProps<SingleChoiceQuestion> = $props();

  let options = $derived.by(() => question.interaction.shuffleOptions
    ? shuffled(question.interaction.options, Math.random)
    : [...question.interaction.options]
  );
  let selectedOptionId = $state<string | null>(null);
  let locked = $state(false);
  let presentation = $derived(question.interaction.presentation);
  let visualDominant = $derived(presentation?.mode === 'visual_dominant');
  let labelMode = $derived(presentation?.labels ?? 'visible');
  let choiceCount = $derived(question.interaction.options.length);

  function selectAndSubmit(optionId: string): void {
    if (locked) return;
    selectedOptionId = optionId;
    locked = true;
    onSubmit({ selectedOptionIds: [optionId] });
  }

  function gridStyle(): string | undefined {
    return visualDominant ? 'min-height:54vh;grid-auto-rows:1fr' : undefined;
  }

  function buttonStyle(): string | undefined {
    if (!visualDominant) return undefined;
    return `position:relative;min-width:0;min-height:${choiceCount === 2 ? '300px' : '145px'};padding:8px;border-radius:22px;border-width:3px`;
  }

  function visualStyle(): string {
    if (!visualDominant) return '';
    return choiceCount === 2
      ? 'width:min(150px,90%);height:min(168px,27vh)'
      : 'width:min(128px,82%);height:min(128px,21vh)';
  }

  function labelStyle(): string | undefined {
    if (labelMode === 'hidden') {
      return 'position:absolute;width:1px;height:1px;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap';
    }
    return labelMode === 'secondary' ? 'opacity:.72;font-size:.82em' : undefined;
  }
</script>

<div
  class:choice-grid--visual-dominant={visualDominant}
  class="choice-grid"
  style={gridStyle()}
  data-presentation={visualDominant ? 'visual_dominant' : 'standard'}
  data-presentation-tier={presentation?.tier}
  data-choice-count={choiceCount}
>
  {#each options as option (option.id)}
    {@const visual = resolveItemVisualPresentation(option)}
    <button
      type="button"
      class:choice-button--visual={visual.hasVisuals}
      class:choice-button--visual-dominant={visualDominant}
      class:choice-button--selected={selectedOptionId === option.id}
      class="choice-button"
      style={buttonStyle()}
      aria-label={option.label}
      aria-pressed={selectedOptionId === option.id}
      disabled={locked}
      onclick={() => selectAndSubmit(option.id)}
    >
      <SemanticVisualPresenter
        presentation={visual}
        class="choice-button__visuals"
        itemClass="choice-button__visual"
        itemStyle={visualStyle()}
      />
      <span
        class:choice-button__label--hidden={labelMode === 'hidden'}
        class:choice-button__label--secondary={labelMode === 'secondary'}
        class="choice-button__label"
        style={labelStyle()}
      >{option.label}</span>
    </button>
  {/each}
</div>

<style>
  .choice-button--visual {
    min-height: 132px;
    display: grid;
    align-content: center;
    justify-items: center;
    gap: 5px;
    padding: 9px 10px 11px;
  }

  :global(.choice-button__visuals) {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 72px;
    gap: 3px;
  }

  :global(.choice-button__visual) {
    width: min(82px, 30%);
    height: 70px;
    flex: 0 1 82px;
  }

  .choice-button__label {
    display: block;
    line-height: 1.2;
  }

  @media (max-width: 480px) {
    .choice-button--visual {
      min-height: 120px;
      padding: 8px 7px 10px;
    }

    :global(.choice-button__visuals) {
      min-height: 62px;
    }

    :global(.choice-button__visual) {
      height: 60px;
    }
  }
</style>
