<script lang="ts">
  import SemanticVisualPresenter from './SemanticVisualPresenter.svelte';
  import { animationVisualPresentation, vocabularyVisualPresentation } from './semanticVisualPresentation';
  import { resolveSceneDefinition } from './sceneRegistry';

  const vocabularyPrefix = 'vocabulary:';

  let { sceneId }: { sceneId: string } = $props();
  let vocabularySenseKey = $derived(sceneId.startsWith(vocabularyPrefix) ? sceneId.slice(vocabularyPrefix.length) : null);
  let scene = $derived(vocabularySenseKey ? null : resolveSceneDefinition(sceneId));
</script>

{#if vocabularySenseKey}
  <SemanticVisualPresenter presentation={vocabularyVisualPresentation(vocabularySenseKey)} />
{:else if scene}
  <div class={`scene scene--${scene.theme}`} role="img" aria-label={scene.ariaLabel} data-animation-ref={scene.animationRef}>
    <SemanticVisualPresenter
      presentation={animationVisualPresentation(scene.animationRef, { embedded: true, decorative: true })}
    />
  </div>
{:else}
  <div class="scene" role="img" aria-label={`Missing scene ${sceneId}`}></div>
{/if}

<style>
  .scene--paper {
    background:
      radial-gradient(circle at 18% 20%, rgba(90, 82, 213, 0.08), transparent 23%),
      linear-gradient(145deg, #fff 0%, #f6f7fb 100%);
  }
</style>
