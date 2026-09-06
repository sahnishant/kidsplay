<script lang="ts">
  import type { CollectionCountQuestion } from '../contracts/question';
  import type { EngineProps } from './types';
  let props: EngineProps<CollectionCountQuestion> = $props();
</script>

{#await import('./CollectionCount.svelte')}
  <p role="status">Opening groups…</p>
{:then module}
  {@const Engine = module.default}
  <Engine {...props} />
{:catch}
  <p role="alert">This activity could not be opened. Return to the topic and try again.</p>
{/await}
