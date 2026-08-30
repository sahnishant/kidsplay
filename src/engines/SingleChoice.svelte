<script lang="ts">
  import type { ChoiceOption, SingleChoiceQuestion } from '../contracts/question';
  import VisualEntity from '../presentation/VisualEntity.svelte';
  import { resolveItemVisualRefs } from '../presentation/visualRegistry';
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

  function optionVisualRefs(option: ChoiceOption): string[] {
    return resolveItemVisualRefs(option, true);
  }

  function submit(): void {
    if (!selectedOptionId || locked) return;
    locked = true;
    onSubmit({ selectedOptionIds: [selectedOptionId] });
  }
</script>

<div class="choice-grid">
  {#each options as option (option.id)}
    {@const visualRefs = optionVisualRefs(option)}
    <button
      type="button"
      class={`choice-button${visualRefs.length ? ' choice-button--visual' : ''}${selectedOptionId === option.id ? ' choice-button--selected' : ''}`}
      aria-pressed={selectedOptionId === option.id}
      disabled={locked}
      onclick={() => (selectedOptionId = option.id)}
    >
      {#if visualRefs.length}
        <span class="choice-button__visuals" aria-hidden="true">
          {#each visualRefs as visualRef (visualRef)}
            <span class="choice-button__visual">
              <VisualEntity {visualRef} context="option" />
            </span>
          {/each}
        </span>
      {/if}
      <span class="choice-button__label">{option.label}</span>
    </button>
  {/each}
</div>
<button class="primary-button" type="button" disabled={locked || !selectedOptionId} onclick={submit}>
  Check answer
</button>

<style>
  .choice-button--visual {
    min-height: 132px;
    display: grid;
    align-content: center;
    justify-items: center;
    gap: 5px;
    padding: 9px 10px 11px;
  }

  .choice-button__visuals {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 72px;
    gap: 3px;
  }

  .choice-button__visual {
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

    .choice-button__visuals {
      min-height: 62px;
    }

    .choice-button__visual {
      height: 60px;
    }
  }
</style>
