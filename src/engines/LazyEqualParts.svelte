<script lang="ts">
  import type { EqualPartsQuestion } from '../contracts/question';
  import type { EngineProps } from './types';
  let props: EngineProps<EqualPartsQuestion> = $props();
</script>

{#await import('./EqualParts.svelte')}
  <p role="status">Opening equal parts…</p>
{:then module}
  {@const Engine = module.default}
  <Engine {...props} />
{:catch}
  <p role="alert">This activity could not be opened. Return to the topic and try again.</p>
{/await}
