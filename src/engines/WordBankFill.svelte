<script lang="ts">
  import { untrack } from 'svelte';
  import type { WordBankFillQuestion } from '../contracts/question';
  import SemanticVisualPresenter from '../presentation/SemanticVisualPresenter.svelte';
  import { resolveItemVisualPresentation } from '../presentation/semanticVisualPresentation';
  import type { EngineProps } from './types';

  let {
    question,
    onSubmit,
    submissionMode = 'explicit'
  }: EngineProps<WordBankFillQuestion> = $props();

  const getBlankIds = (): string[] => question.interaction.segments
    .filter((segment): segment is { type: 'blank'; id: string } => segment.type === 'blank')
    .map((segment) => segment.id);

  let blankIds = $derived(getBlankIds());
  let answers = $state<Record<string, string>>({});
  let activeBlankId = $state<string | null>(untrack(() => getBlankIds()[0] ?? null));
  let locked = $state(false);
  let complete = $derived(blankIds.every((blankId) => Boolean(answers[blankId])));

  function answerLabel(blankId: string): string {
    const wordId = answers[blankId];
    return question.interaction.wordBank.find((candidate) => candidate.id === wordId)?.label ?? '___';
  }

  function commit(nextAnswers: Record<string, string>): void {
    if (locked) return;
    locked = true;
    onSubmit({ blankAnswers: { ...nextAnswers } });
  }

  function chooseWord(wordId: string): void {
    if (!activeBlankId || locked) return;
    const answeredBlankId = activeBlankId;
    const nextAnswers = { ...answers, [answeredBlankId]: wordId };
    answers = nextAnswers;
    activeBlankId = blankIds.find((blankId) => !nextAnswers[blankId]) ?? answeredBlankId;

    if (
      submissionMode === 'auto_when_complete'
      && blankIds.every((blankId) => Boolean(nextAnswers[blankId]))
    ) {
      commit(nextAnswers);
    }
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
    {@const visual = resolveItemVisualPresentation(word, { context: 'word-bank' })}
    <button
      class={`word-chip${visual.hasVisuals ? ' word-chip--visual' : ''}`}
      type="button"
      disabled={locked}
      onclick={() => chooseWord(word.id)}
    >
      <SemanticVisualPresenter
        presentation={visual}
        class="word-chip__visuals"
        itemClass="word-chip__visual"
      />
      <span>{word.label}</span>
    </button>
  {/each}
</div>

{#if submissionMode === 'explicit'}
  <button class="primary-button" type="button" disabled={locked || !complete} onclick={() => commit(answers)}>
    Check answer
  </button>
{/if}

<style>
  .word-chip--visual {
    min-width: 128px;
    min-height: 102px;
    display: grid;
    place-items: center;
    gap: 3px;
    padding: 7px 12px 10px;
  }

  :global(.word-chip__visuals) {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 55px;
    width: 100%;
  }

  :global(.word-chip__visual) {
    width: 66px;
    height: 55px;
  }
</style>
