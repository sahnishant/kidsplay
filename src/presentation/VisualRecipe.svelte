<script lang="ts">
  import VisualEntity from './VisualEntity.svelte';
  import { resolveVisualRecipeById } from './visualRecipeRegistry';
  import type { VisualContext } from './visualRegistry';
  import type { VisualRecipeSurface } from './visualRecipeTypes';

  let {
    recipeId,
    surface = 'feedback'
  }: {
    recipeId: string;
    surface?: VisualRecipeSurface;
  } = $props();

  let recipe = $derived(resolveVisualRecipeById(recipeId, surface));

  function entityContext(value: VisualRecipeSurface): VisualContext {
    if (value === 'feedback' || value === 'dashboard' || value === 'word-bank') return value;
    return 'option';
  }
</script>

{#if recipe}
  <figure
    class={`visual-recipe visual-recipe--${recipe.template.replaceAll('.', '-')}`}
    style="container-type:inline-size;display:grid;gap:5px;justify-items:center;margin:0;max-width:100%"
    aria-label={recipe.ariaLabel}
    data-recipe-id={recipe.id}
    data-recipe-template={recipe.template}
    data-recipe-exposure={recipe.exposure}
  >
    <div class="visual-recipe__row" style="display:flex;align-items:center;justify-content:center;gap:clamp(2px,1.5cqw,8px);width:100%" aria-hidden="true">
      {#each recipe.slots as slot, index (`${slot.role}:${slot.visualRef}`)}
        {#if index > 0}
          <span class="visual-recipe__connector" style="flex:0 0 auto;font-weight:800;line-height:1">
            {recipe.template === 'contrast.pair' || recipe.template === 'comparison' ? '↔' : recipe.template === 'orbit' || recipe.template === 'rotation' ? '↻' : '→'}
          </span>
        {/if}
        <span
          class="visual-recipe__slot"
          style="display:grid;justify-items:center;width:clamp(46px,24cqw,112px);height:clamp(42px,21cqw,96px);min-width:0"
          data-slot-role={slot.role}
          data-slot-exposure={slot.exposure}
        >
          <VisualEntity visualRef={slot.visualRef} context={entityContext(surface)} />
          {#if slot.label}
            <span class="visual-recipe__slot-label" style="font-size:clamp(.68rem,4cqw,.9rem);line-height:1.15;text-align:center">{slot.label}</span>
          {/if}
        </span>
      {/each}
    </div>
    {#if recipe.exposure === 'full_relation' && recipe.annotation}
      <figcaption style="font-size:clamp(.68rem,4cqw,.9rem);line-height:1.15;text-align:center">{recipe.annotation}</figcaption>
    {/if}
  </figure>
{/if}
