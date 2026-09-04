<script lang="ts">
  import type { Question } from '../contracts/question';
  import type { EvaluationResult } from '../contracts/runtime';
  import { playAnswerFeedback } from '../runtime/answerFeedbackAudio';
  import { showAnswerFeedbackSplash } from '../runtime/answerFeedbackVisual';
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
  let submissionMode = $derived(feedbackMode === 'play' ? 'auto_when_complete' : 'explicit');
  let soundFirstPhonics = $derived(question.authoring.source === 'kidsplay-phonics-v1');

  function handleSubmit(response: unknown): void {
    const result = checkResponse(response);
    if (feedbackMode === 'play') {
      showAnswerFeedbackSplash(result.correct);
      playAnswerFeedback(result.correct, soundEnabled);
    }
    onSubmit(response);
  }
</script>

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