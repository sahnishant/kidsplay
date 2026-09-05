<script lang="ts">
  import LearningStudio from './LearningStudio.svelte';
  import { getLearningStudioActivity, type StudioWorkspace } from '../experience/learningStudios';

  let { activityRefs }: { activityRefs: readonly string[] } = $props();
  let selected = $state<string | null>(null);
  let workspaces = $state<Record<string, StudioWorkspace>>({});
  $effect(() => { if (selected && !activityRefs.includes(selected)) selected = null; });
</script>

{#if activityRefs.length}
  <div class="studio-launcher">
    {#if selected}
      {#key selected}
        <LearningStudio activityId={selected} onClose={() => selected = null}
          initialWorkspace={$state.snapshot(workspaces[selected])}
          onWorkspaceChange={(workspace) => { workspaces[workspace.activityId] = workspace; }} />
      {/key}
    {:else}
      <div class="studio-launcher__choices" aria-label="Hands-on learning activities">
        {#each activityRefs as ref}
          {@const activity = getLearningStudioActivity(ref)}
          <button type="button" onclick={() => selected = ref}>
            <span aria-hidden="true">{activity.family === 'fraction_studio' ? '◒' : '↔'}</span>
            <span><strong>{activity.childTitle}</strong><small>Explore · show me · try it</small></span>
          </button>
        {/each}
      </div>
    {/if}
  </div>
{/if}

<style>
  .studio-launcher{min-width:0;width:100%;margin:8px 0}.studio-launcher__choices{display:grid;gap:6px}.studio-launcher__choices button{display:flex;align-items:center;gap:10px;text-align:left;min-height:52px;padding:8px 10px;border:1px solid var(--line,#ccd4db);border-radius:12px;background:var(--paper,#fff);color:var(--ink,#24303a);font:inherit}.studio-launcher__choices strong,.studio-launcher__choices small{display:block}.studio-launcher__choices small{font-size:.72rem}.studio-launcher button:focus-visible{outline:3px solid var(--accent,#5042a8);outline-offset:2px}
</style>
