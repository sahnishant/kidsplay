<script lang="ts">
  import type { SingleChoiceQuestion } from '../contracts/question';
  import SemanticVisualPresenter from '../presentation/SemanticVisualPresenter.svelte';
  import { resolveItemVisualPresentation } from '../presentation/semanticVisualPresentation';
  import type { EngineProps } from './types';

  let { question, onSubmit }: EngineProps<SingleChoiceQuestion> = $props();

  const shuffled = <T,>(values: T[]): T[] => {
    const copy = [...values];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swapWith = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[swapWith]] = [copy[swapWith], copy[index]];
    }
    return copy;
  };

  let options = $derived.by(() => question.interaction.shuffleOptions
    ? shuffled(question.interaction.options)
    : [...question.interaction.options]
  );
  let selectedOptionId = $state<string | null>(null);
  let locked = $state(false);

  function selectAndSubmit(optionId: string): void {
    if (locked) return;
    selectedOptionId = optionId;
    locked = true;
    onSubmit({ selectedOptionIds: [optionId] });
  }
</script>

<div class="choice-grid">
  {#each options as option (option.id)}
    {@const visual = resolveItemVisualPresentation(option)}
    <button
      type="button"
      class={`choice-button${visual.hasVisuals ? ' choice-button--visual' : ''}${selectedOptionId === option.id ? ' choice-button--selected' : ''}`}
      aria-pressed={selectedOptionId === option.id}
      disabled={locked}
      onclick={() => selectAndSubmit(option.id)}
    >
      <SemanticVisualPresenter
        presentation={visual}
        class="choice-button__visuals"
        itemClass="choice-button__visual"
      />
      <span class="choice-button__label">{option.label}</span>
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
