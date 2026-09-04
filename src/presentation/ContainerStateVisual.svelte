<script lang="ts">
  export type ContainerVisualState = 'empty' | 'full';
  let { state, label, compact = false }: { state: ContainerVisualState; label?: string; compact?: boolean } = $props();
</script>

<div class:compact class="bucket-state" data-container-state={state} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : 'true'}>
  <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
    <path d="M25 34Q25 9 50 9T75 34M18 32H82L74 89H26Z" fill="#f1c56c" stroke="#795827" stroke-width="5" stroke-linejoin="round" />
    {#if state === 'full'}
      <path d="M24 49H76L70 84H30Z" fill="#70c8ed" />
      <path d="M24 49Q36 44 48 49T76 49" fill="none" stroke="#278dc0" stroke-width="4" />
    {:else}
      <path d="m39 55 22 22m0-22L39 77" stroke="#b76e58" stroke-width="6" stroke-linecap="round" />
    {/if}
  </svg>
</div>

<style>
  .bucket-state{width:min(190px,70vw);aspect-ratio:1}.bucket-state svg{width:100%;height:100%}.compact{width:min(82px,24vw)}
</style>
