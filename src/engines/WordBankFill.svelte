<script lang="ts">
  import type { WordBankFillQuestion } from '../contracts/question';
  import type { EngineProps } from './types';

  let { question, onSubmit }: EngineProps<WordBankFillQuestion> = $props();

  const blankIds = question.interaction.segments
    .filter((segment): segment is { type: 'blank'; id: string } => segment.type === 'blank')
    .map((segment) => segment.id);
  let answers = $state<Record<string, string>>({});
  let activeBlankId = $state<string | null>(blankIds[0] ?? null);
  let locked = $state(false);
  let complete = $derived(blankIds.every((blankId) => Boolean(answers[blankId])));

  function answerLabel(blankId: string): string {
    const wordId = answers[blankId];
    return question.interaction.wordBank.find((candidate) => candidate.id === wordId)?.label ?? '___';
  }

  function chooseWord(wordId: string): void {
    if (!activeBlankId || locked) return;
    answers[activeBlankId] = wordId;
    activeBlankId = blankIds.find((blankId) => !answers[blankId]) ?? activeBlankId;
  }

  function submit(): void {
    if (!complete || locked) return;
    locked = true;
    onSubmit({ blankAnswers: { ...answers } });
  }
</script>

<div class="fill-sentence">
  {#each question.interaction.segments as segment}
    {#if segment.type === 'text'}
      <span>{segment.value}</span>
    {:else}
      <button
        type="button"
        class={`fill-blank${activeBlankId === segment.id ? ' fill-blank--active' : ''}`}
        aria-label="Blank answer"
        disabled={locked}
        onclick={() => (activeBlankId = segment.id)}
      >{answerLabel(segment.id)}</button>
    {/if}
  {/each}
</div>

<div class="word-bank">
  {#each question.interaction.wordBank as word (word.id)}
    <button class="word-chip" type="button" disabled={locked} onclick={() => chooseWord(word.id)}>
      {word.label}
    </button>
  {/each}
</div>

<button class="primary-button" type="button" disabled={locked || !complete} onclick={submit}>
  Check answer
</button>
