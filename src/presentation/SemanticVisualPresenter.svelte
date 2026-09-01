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
