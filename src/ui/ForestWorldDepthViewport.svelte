<script lang="ts">
  import type { StoryMission } from '../story/storyTypes';

  let { mission, childName = '', onComplete, onExit }: {
    mission: StoryMission;
    childName?: string;
    onComplete: (sessionId: string) => void;
    onExit: () => void;
  } = $props();

  let isTownMission = $derived(mission.worldActionRef?.startsWith('town.') ?? false);
  let isBusyGrove = $derived(mission.worldActionRef === 'forest.world-depth.l3.grove-return');
</script>

{#if isTownMission}
  {#await import('./TownWorldDepthViewport-Practical.svelte') then module}
    {@const TownWorldDepthViewport = module.default}
    <TownWorldDepthViewport {mission} {childName} {onComplete} {onExit} />
  {/await}
{:else if isBusyGrove}
  {#await import('./ForestGroveMissionViewport.svelte') then module}
    {@const ForestGroveMissionViewport = module.default}
    <ForestGroveMissionViewport {mission} {childName} {onComplete} {onExit} />
  {/await}
{:else}
  {#await import('./ForestWorldDepthMissionViewport-Practical.svelte') then module}
    {@const ForestWorldDepthMissionViewport = module.default}
    <ForestWorldDepthMissionViewport {mission} {childName} {onComplete} {onExit} />
  {/await}
{/if}
