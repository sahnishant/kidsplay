<script lang="ts">
  import type { TracePathQuestion } from '../contracts/question';
  import type { EngineProps } from './types';

  let {
    question,
    onSubmit,
    checkResponse,
    submissionMode = 'explicit',
    soundEnabled = true
  }: EngineProps<TracePathQuestion> = $props();

  const tracePathModule = import('./TracePath.svelte');
</script>

{#await tracePathModule then module}
  {@const TracePath = module.default}
  <TracePath {question} {onSubmit} {checkResponse} {submissionMode} {soundEnabled} />
{/await}
