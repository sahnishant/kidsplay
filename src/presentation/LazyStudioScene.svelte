<script module lang="ts">
  let pending: Promise<typeof import('./StudioScene.svelte')> | undefined;
  function loadScene() {
    return pending ??= import('./StudioScene.svelte').catch((error) => { pending = undefined; throw error; });
  }
</script>
<script lang="ts">
  import { onMount } from 'svelte';
  let { icon }: { icon: string } = $props();
  let Renderer = $state<typeof import('./StudioScene.svelte')['default'] | null>(null);
  let failed = $state(false);
  onMount(() => {
    let live = true;
    void loadScene().then((module) => { if (live) Renderer = module.default; }).catch(() => { if (live) failed = true; });
    return () => { live = false; };
  });
</script>
{#if Renderer}
  <Renderer {icon} />
{:else}
  <span class="scene-placeholder" data-studio-scene-loading={failed ? 'unavailable' : 'loading'} aria-hidden="true"></span>
{/if}
<style>
  .scene-placeholder{display:block;width:100%;height:100%;border-radius:14px;background:#f2f4ef}
</style>
