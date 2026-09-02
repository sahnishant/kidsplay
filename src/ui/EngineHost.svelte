<script lang="ts">
  import type { Question } from '../contracts/question';
  import type { EvaluationResult } from '../contracts/runtime';
  import { playAnswerFeedback } from '../runtime/answerFeedbackAudio';
  import { getEngineComponent } from '../runtime/engineRegistry';

  let {
    question,
    onSubmit,
    checkResponse
  }: {
    question: Question;
    onSubmit: (response: unknown) => void;
    checkResponse: (response: unknown) => EvaluationResult;
  } = $props();

  let Engine = $derived(getEngineComponent(question));

  function handleSubmit(response: unknown): void {
    const result = checkResponse(response);
    playAnswerFeedback(result.correct);
    onSubmit(response);
  }
</script>

{#key question.id}
  <Engine {question} onSubmit={handleSubmit} {checkResponse} />
{/key}
