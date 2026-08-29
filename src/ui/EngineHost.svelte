<script lang="ts">
  import type { Question } from '../contracts/question';
  import type { EvaluationResult } from '../contracts/runtime';
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
</script>

{#key question.id}
  <Engine {question} {onSubmit} {checkResponse} />
{/key}
