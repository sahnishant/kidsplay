<script lang="ts">
  import type { SingleChoiceQuestion } from '../contracts/question';
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

  function submit(): void {
    if (!selectedOptionId || locked) return;
    locked = true;
    onSubmit({ selectedOptionIds: [selectedOptionId] });
  }
</script>

<div class="choice-grid">
  {#each options as option (option.id)}
    <button
      type="button"
      class={`choice-button${selectedOptionId === option.id ? ' choice-button--selected' : ''}`}
      aria-pressed={selectedOptionId === option.id}
      disabled={locked}
      onclick={() => (selectedOptionId = option.id)}
    >
      {option.label}
    </button>
  {/each}
</div>
<button class="primary-button" type="button" disabled={locked || !selectedOptionId} onclick={submit}>
  Check answer
</button>
