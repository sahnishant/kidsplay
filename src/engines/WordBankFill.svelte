<script lang="ts">
  import { untrack } from 'svelte';
  import type { WordBankFillQuestion, WordBankItem } from '../contracts/question';
  import VisualEntity from '../presentation/VisualEntity.svelte';
  import { resolveItemVisualRefs } from '../presentation/visualRegistry';
  import type { EngineProps } from './types';

  let { question, onSubmit }: EngineProps<WordBankFillQuestion> = $props();

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

  function wordVisualRefs(word: WordBankItem): string[] {
    return resolveItemVisualRefs(word, true);
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
    {@const visualRefs = wordVisualRefs(word)}
    <button
      class={`word-chip${visualRefs.length ? ' word-chip--visual' : ''}`}
      type="button"
      disabled={locked}
      onclick={() => chooseWord(word.id)}
    >
      {#if visualRefs.length}
        <span class="word-chip__visuals" aria-hidden="true">
          {#each visualRefs as visualRef (visualRef)}
            <span class="word-chip__visual"><VisualEntity {visualRef} context="word-bank" /></span>
          {/each}
        </span>
      {/if}
      <span>{word.label}</span>
    </button>
  {/each}
</div>

<button class="primary-button" type="button" disabled={locked || !complete} onclick={submit}>
  Check answer
</button>

<style>
  .word-chip--visual {
    min-width: 128px;
    min-height: 102px;
    display: grid;
    place-items: center;
    gap: 3px;
    padding: 7px 12px 10px;
  }

  .word-chip__visuals {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 55px;
    width: 100%;
  }

  .word-chip__visual {
    width: 66px;
    height: 55px;
  }
</style>
