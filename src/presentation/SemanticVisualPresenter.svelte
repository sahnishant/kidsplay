<script lang="ts">
  import SemanticAnimation from './SemanticAnimation.svelte';
  import VisualEntity from './VisualEntity.svelte';
  import VisualRecipe from './VisualRecipe.svelte';
  import VocabularySemanticScene from './VocabularySemanticScene.svelte';
  import type { SemanticVisualPresentation } from './semanticVisualPresentation';

  let {
    presentation,
    class: className = '',
    itemClass = '',
    compoundClass = ''
  }: {
    presentation: SemanticVisualPresentation;
    class?: string;
    itemClass?: string;
    compoundClass?: string;
  } = $props();

  let entityClass = $derived([
    className,
    presentation.kind === 'entities' && presentation.compound ? compoundClass : ''
  ].filter(Boolean).join(' '));
</script>

{#if presentation.kind === 'entities'}
  {#if presentation.hasVisuals}
    <span
      class={entityClass}
      data-semantic-visual-kind="entities"
      data-visual-count={presentation.visualRefs.length}
      role={presentation.decorative ? undefined : 'img'}
      aria-label={presentation.decorative ? undefined : presentation.label}
      aria-hidden={presentation.decorative ? 'true' : undefined}
    >
      {#each presentation.visualRefs as visualRef (visualRef)}
        <span class={itemClass}>
          <VisualEntity {visualRef} context={presentation.context} />
        </span>
      {/each}
    </span>
  {/if}
{:else if presentation.kind === 'recipe'}
  <VisualRecipe recipeId={presentation.recipeId} surface={presentation.surface} />
{:else if presentation.kind === 'animation'}
  <SemanticAnimation
    animationId={presentation.animationId}
    embedded={presentation.embedded}
    decorative={presentation.decorative}
  />
{:else}
  <VocabularySemanticScene senseKey={presentation.senseKey} compact={presentation.compact} />
{/if}

<style>
  /* V6 depth cues are explanatory UI, not part of the authored semantic artwork.
     Keep them in flow so they can never cover meaning-bearing SVG content. */
  :global(.vocabulary-semantic-scene[data-semantic-depth-mode] .semantic-depth-cue) {
    position: static !important;
    width: fit-content;
    max-width: calc(100% - 12px);
    margin: 4px 6px 0 auto;
  }

  /* Preserve the original scene footprint at narrow child viewports by giving
     the cue space that previously belonged to the SVG instead of growing the card. */
  :global(.vocabulary-semantic-scene[data-semantic-depth-mode] .semantic-svg) {
    height: 156px;
  }

  :global(.vocabulary-semantic-scene.compact[data-semantic-depth-mode] .semantic-svg) {
    height: 128px;
  }
</style>
