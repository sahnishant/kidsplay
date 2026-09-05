<script lang="ts">
  import type { StoryMission } from '../story/storyTypes';

  let { mission, childName = '', onComplete, onExit }: {
    mission: StoryMission;
    childName?: string;
    onComplete: (sessionId: string) => void;
    onExit: () => void;
  } = $props();

  let isTownMission = $derived(mission.worldActionRef?.startsWith('town.') ?? false);
</script>

{#if isTownMission}
  {#await import('./TownWorldDepthViewport.svelte') then module}
    {@const TownWorldDepthViewport = module.default}
    <TownWorldDepthViewport {mission} {childName} {onComplete} {onExit} />
  {/await}
{:else}
  {#await import('./ForestWorldDepthMissionViewport.svelte') then module}
    {@const ForestWorldDepthMissionViewport = module.default}
    <ForestWorldDepthMissionViewport {mission} {childName} {onComplete} {onExit} />
  {/await}
{/if}
