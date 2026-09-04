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
</script>

<div
  class={`choice-grid${visualDominant ? ' choice-grid--visual-dominant' : ''}`}
  data-presentation={visualDominant ? 'visual_dominant' : 'standard'}
  data-presentation-tier={presentation?.tier}
  data-choice-count={choiceCount}
>
  {#each options as option (option.id)}
    {@const visual = resolveItemVisualPresentation(option)}
    <button
      type="button"
      class={`choice-button${visual.hasVisuals ? ' choice-button--visual' : ''}${visualDominant ? ' choice-button--visual-dominant' : ''}${selectedOptionId === option.id ? ' choice-button--selected' : ''}`}
      aria-label={option.label}
      aria-pressed={selectedOptionId === option.id}
      disabled={locked}
      onclick={() => selectAndSubmit(option.id)}
    >
      <SemanticVisualPresenter
        presentation={visual}
        class="choice-button__visuals"
        itemClass="choice-button__visual"
      />
      <span
        class={`choice-button__label${labelMode === 'hidden' ? ' choice-button__label--hidden' : ''}${labelMode === 'secondary' ? ' choice-button__label--secondary' : ''}`}
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

  .choice-button__label--secondary {
    opacity: .72;
    font-size: .82em;
  }

  .choice-button__label--hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .choice-grid--visual-dominant {
    width: 100%;
    min-height: min(56vh, 430px);
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-auto-rows: minmax(0, 1fr);
    gap: clamp(10px, 3vw, 18px);
  }

  .choice-grid--visual-dominant[data-choice-count='2'] {
    min-height: min(60vh, 440px);
  }

  .choice-button--visual-dominant {
    position: relative;
    min-width: 0;
    min-height: clamp(150px, 28vh, 230px);
    padding: clamp(12px, 3vw, 20px);
    border-radius: clamp(20px, 5vw, 30px);
    border-width: 3px;
  }

  .choice-grid--visual-dominant[data-choice-count='2'] .choice-button--visual-dominant {
    min-height: clamp(260px, 50vh, 410px);
  }

  .choice-button--visual-dominant :global(.choice-button__visuals) {
    min-height: 0;
    height: 100%;
  }

  .choice-button--visual-dominant :global(.choice-button__visual) {
    width: min(168px, 78%);
    height: min(168px, 22vh);
    flex: 1 1 150px;
  }

  .choice-grid--visual-dominant[data-choice-count='2'] .choice-button--visual-dominant :global(.choice-button__visual) {
    width: min(190px, 88%);
    height: min(210px, 30vh);
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

    .choice-grid--visual-dominant {
      min-height: min(54vh, 340px);
      gap: 10px;
    }

    .choice-grid--visual-dominant[data-choice-count='2'] {
      min-height: min(58vh, 365px);
    }

    .choice-button--visual-dominant {
      min-height: 145px;
      padding: 10px 6px;
      border-radius: 22px;
    }

    .choice-grid--visual-dominant[data-choice-count='2'] .choice-button--visual-dominant {
      min-height: 300px;
    }

    .choice-button--visual-dominant :global(.choice-button__visual) {
      width: min(126px, 82%);
      height: min(126px, 20vh);
    }

    .choice-grid--visual-dominant[data-choice-count='2'] .choice-button--visual-dominant :global(.choice-button__visual) {
      width: min(142px, 90%);
      height: min(164px, 25vh);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .choice-button--visual-dominant {
      transition: none !important;
    }
  }
</style>
