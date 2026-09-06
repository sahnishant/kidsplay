<script module lang="ts">
  let pending: Promise<typeof import('./StudioScene.svelte')> | undefined;
  function loadScene() {
    return pending ??= import('./StudioScene.svelte').catch((error) => { pending = undefined; throw error; });
  }
</script>
<script lang="ts">
  import { onMount, tick } from 'svelte';
  let { icon }: { icon: string } = $props();
  let Renderer = $state<typeof import('./StudioScene.svelte')['default'] | null>(null);
  let failed = $state(false);
  onMount(() => {
    let live = true;
    void loadScene().then((module) => { if (live) Renderer = module.default; }).catch(() => { if (live) failed = true; });
    return () => { live = false; };
  });
  // CSS motion policy does not stop the canonical character's SVG timeline.
  // Pause only this host's SVG fragments, including after child onMount work.
  function stillIllustration(node: HTMLElement, _icon: string) {
    let live = true;
    function pause() {
      if (!live) return;
      for (const svg of node.querySelectorAll('svg')) svg.pauseAnimations?.();
    }
    function settle() { pause(); void tick().then(pause); }
    settle();
    return { update: settle, destroy() { live = false; } };
  }
</script>
{#if Renderer}
  <span class="scene-shell" use:stillIllustration={icon}><Renderer {icon} /></span>
{:else}
  <span class="scene-placeholder" data-studio-scene-loading={failed ? 'unavailable' : 'loading'} aria-hidden="true"></span>
{/if}
<style>
  .scene-shell,.scene-placeholder{display:block;width:100%;height:100%;min-width:0;min-height:0}
  .scene-placeholder{border-radius:14px;background:#f2f4ef}
</style>
