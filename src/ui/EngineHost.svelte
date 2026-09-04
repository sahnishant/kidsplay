<script lang="ts">
  import type { Question } from '../contracts/question';
  import type { EvaluationResult } from '../contracts/runtime';
  import type { EngineSubmissionMode } from '../engines/types';
  import { playAnswerFeedback } from '../runtime/answerFeedbackAudio';
  import { getEngineComponent } from '../runtime/engineRegistry';

  export type AnswerFeedbackMode = 'play' | 'assessment';

  let {
    question,
    onSubmit,
    checkResponse,
    feedbackMode = 'play',
    soundEnabled = true
  }: {
    question: Question;
    onSubmit: (response: unknown) => void;
    checkResponse: (response: unknown) => EvaluationResult;
    feedbackMode?: AnswerFeedbackMode;
    soundEnabled?: boolean;
  } = $props();

  let Engine = $derived(getEngineComponent(question));
  let submissionMode = $derived<EngineSubmissionMode>(feedbackMode === 'play' ? 'auto_when_complete' : 'explicit');
  let soundFirstPhonics = $derived(question.authoring.source === 'kidsplay-phonics-v1');

  function handleSubmit(response: unknown): void {
    const result = checkResponse(response);
    if (feedbackMode === 'play') {
      // Keep the child on the answered question. Phonics may add its strict
      // listen-first gate, but it must not restore the transient answer splash.
      playAnswerFeedback(result.correct, soundEnabled);
    }
    onSubmit(response);
  }
</script>

{#if feedbackMode === 'assessment'}
  <span class="assessment-save-status">Mock progress saves on this device</span>
{/if}

{#key question.id}
  {#if soundFirstPhonics}
    {#await import('./PhonicsAudioGate.svelte') then module}
      {@const PhonicsAudioGate = module.default}
      <PhonicsAudioGate
        {question}
        {Engine}
        onSubmit={handleSubmit}
        {checkResponse}
        {submissionMode}
        {soundEnabled}
      />
    {/await}
  {:else}
    <Engine {question} onSubmit={handleSubmit} {checkResponse} {submissionMode} {soundEnabled} />
  {/if}
{/key}

<style>
  .assessment-save-status {
    display: block;
    margin: -3px 0 3px;
    color: var(--muted);
    font-size: .58rem;
    font-weight: 750;
    line-height: 1;
    text-align: center;
  }
</style>
