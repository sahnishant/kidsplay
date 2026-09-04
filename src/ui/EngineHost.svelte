<script lang="ts">
  import type { Question } from '../contracts/question';
  import type { EvaluationResult } from '../contracts/runtime';
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
  let submissionMode = $derived(feedbackMode === 'play' ? 'auto_when_complete' : 'explicit');

  function handleSubmit(response: unknown): void {
    const result = checkResponse(response);
    if (feedbackMode === 'play') {
      // Keep the child on the question they just answered. SessionViewport owns
      // the persistent in-place success/retry state; no transient full-screen
      // victory splash should hide the selected answer before the child has had
      // time to look at it again.
      playAnswerFeedback(result.correct, soundEnabled);
    }
    onSubmit(response);
  }
</script>

{#if feedbackMode === 'assessment'}
  <span class="assessment-save-status">Mock progress saves on this device</span>
{/if}
{#key question.id}
  <Engine {question} onSubmit={handleSubmit} {checkResponse} {submissionMode} {soundEnabled} />
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
