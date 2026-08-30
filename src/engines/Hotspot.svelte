<script lang="ts">
  import type { HotspotQuestion, HotspotRegion } from '../contracts/question';
  import { asPercent, regionBox } from '../mechanics/hitRegions';
  import VisualEntity from '../presentation/VisualEntity.svelte';
  import { resolveItemVisualRefs } from '../presentation/visualRegistry';
  import type { EngineProps } from './types';

  let { question, onSubmit }: EngineProps<HotspotQuestion> = $props();

  let selectedRegionIds = $state<string[]>([]);
  let locked = $state(false);
  let status = $state('');

  function selected(regionId: string): boolean {
    return selectedRegionIds.includes(regionId);
  }

  function visualRefs(region: HotspotRegion): string[] {
    return resolveItemVisualRefs(region);
  }

  function toggle(regionId: string): void {
    if (locked) return;
    if (question.interaction.selectionMode === 'single') {
      selectedRegionIds = [regionId];
    } else if (selected(regionId)) {
      selectedRegionIds = selectedRegionIds.filter((id) => id !== regionId);
    } else {
      selectedRegionIds = [...selectedRegionIds, regionId];
    }
    status = `${selectedRegionIds.length} place${selectedRegionIds.length === 1 ? '' : 's'} selected.`;
  }

  function submit(): void {
    if (!selectedRegionIds.length || locked) return;
    locked = true;
    onSubmit({ selectedRegionIds: [...selectedRegionIds] });
  }
</script>

<div class="hotspot">
  <p class="hotspot__instructions">
    {question.interaction.selectionMode === 'single' ? 'Tap the correct place.' : 'Tap every place that matches the question.'}
  </p>
  <div
    class={`hotspot__board hotspot__board--${question.interaction.board.theme ?? 'plain'}`}
    role="group"
    aria-label={question.interaction.board.ariaLabel}
  >
    {#each question.interaction.board.regions as region (region.id)}
      {@const box = regionBox(region.shape)}
      {@const refs = visualRefs(region)}
      <button
        type="button"
        class={`hotspot__region${box.circular ? ' hotspot__region--circle' : ''}${selected(region.id) ? ' hotspot__region--selected' : ''}`}
        style={`left: ${asPercent(box.left)}; top: ${asPercent(box.top)}; width: ${asPercent(box.width)}; height: ${asPercent(box.height)}`}
        aria-pressed={selected(region.id)}
        aria-label={region.label}
        disabled={locked}
        onclick={() => toggle(region.id)}
      >
        {#if refs.length}
          <span class={`hotspot__visuals${refs.length > 1 ? ' hotspot__visuals--compound' : ''}`} aria-hidden="true">
            {#each refs as visualRef (visualRef)}
              <span class="hotspot__visual"><VisualEntity {visualRef} context="option" /></span>
            {/each}
          </span>
        {:else if region.symbol}
          <span class="hotspot__symbol" aria-hidden="true">{region.symbol}</span>
        {/if}
        <span class="hotspot__label">{region.label}</span>
      </button>
    {/each}
  </div>
  <div class="hotspot__status" role="status" aria-live="polite">{status}</div>
  <button class="primary-button" type="button" disabled={locked || !selectedRegionIds.length} onclick={submit}>
    Check answer
  </button>
</div>

<style>
  .hotspot__visuals {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2px;
    width: min(88%, 88px);
    height: min(58%, 70px);
    margin: 0 auto 2px;
  }

  .hotspot__visual {
    width: 100%;
    height: 100%;
    min-width: 0;
  }

  .hotspot__visuals--compound .hotspot__visual {
    width: 48%;
  }
</style>
