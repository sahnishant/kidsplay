<script lang="ts">
  import { untrack } from 'svelte';
  import LearningStudio from './LearningStudio.svelte';
  import { getLearningStudioActivity, type StudioWorkspace } from '../experience/learningStudios';
  import { createStudioWorkStore, type StudioWorkStore, type StudioWorkStatus } from '../runtime/studioWorkStore.mjs';
  import { pushAppBackLayer, requestAppBack } from '../runtime/appNavigation';

  // The current app has one local child profile. Future profile hosts must pass
  // their stable ID explicitly; display names/avatars are never identity keys.
  let { activityRefs, ownerId = 'local-child' }: { activityRefs: readonly string[]; ownerId?: string } = $props();
  interface Selection { id: string; owner: string; token: string | null; workspace: unknown; store: StudioWorkStore; }
  let selected = $state<Selection | null>(null);
  let dialog = $state<HTMLDialogElement>();
  let notice = $state('');
  const memory = new Map<string, { workspace: StudioWorkspace; token: string | null }>();
  $effect(() => { if (selected && (selected.owner !== ownerId || !activityRefs.includes(selected.id))) selected = null; });
  $effect(() => {
    const active = selected;
    if (!active) return;
    return pushAppBackLayer(`studio:${active.owner}:${active.id}`, () => selected = null);
  });
  $effect(() => {
    const target = dialog;
    if (!target || !selected) return;
    const previous = document.activeElement;
    if (typeof target.showModal === 'function') target.showModal();
    else target.setAttribute('open', '');
    return () => {
      if (typeof target.close === 'function') target.close();
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  });
  function storageNotice(status: StudioWorkStatus): string {
    if (status === 'conflict') return 'A newer saved copy exists. Your work here has not replaced it.';
    if (status === 'corrupt') return 'The saved copy could not be read. It has been kept unchanged; new work is only kept on this page.';
    if (status === 'full') return 'There is no room to save this work. Keep this page open to continue.';
    if (status === 'unavailable' || status === 'invalid') return 'This device could not save this work. Keep this page open to continue.';
    return '';
  }
  function open(id: string): void {
    const store = createStudioWorkStore(ownerId);
    const loaded = store.load(id);
    notice = storageNotice(loaded.status);
    const cached = memory.get(`${ownerId}:${id}`);
    // Memory may be newer after a failed save, but never let stale memory replace
    // a newer durable generation after another launcher/tab has saved.
    const cachedIsCurrent = cached && (cached.token === loaded.token || loaded.status === 'unavailable');
    selected = { id, owner: ownerId, token: loaded.token, workspace: cachedIsCurrent ? cached.workspace : loaded.workspace, store };
  }
  function remember(active: Selection, workspace: StudioWorkspace): void {
    if (active !== untrack(() => selected) || active.owner !== ownerId || workspace.activityId !== active.id) return;
    const result = active.store.save(active.id, workspace, active.token);
    if (result.status === 'saved' || result.status === 'unchanged') active.token = result.token;
    memory.set(`${active.owner}:${active.id}`, { workspace: structuredClone(workspace), token: active.token });
    notice = storageNotice(result.status);
  }
  function close(): void { requestAppBack(() => selected = null); }
</script>

{#if activityRefs.length}
  <div class="studio-launcher">
    <div class="studio-launcher__choices" aria-label="Hands-on learning activities">
      {#each activityRefs as ref}
        {@const activity = getLearningStudioActivity(ref)}
        <button type="button" onclick={() => open(ref)}>
          <span aria-hidden="true">{activity.family === 'fraction_studio' ? '◒' : '↔'}</span>
          <span><strong>{activity.childTitle}</strong><small>Explore · show me · try it</small></span>
        </button>
      {/each}
    </div>
    {#if selected}
      {@const active = selected}
      <dialog bind:this={dialog} class="studio-window" aria-label={getLearningStudioActivity(active.id).childTitle} oncancel={(event) => { event.preventDefault(); close(); }}>
        {#if notice}<p class="studio-save-notice" role="status">{notice}</p>{/if}
        <div class="studio-window__content">
          {#key `${active.owner}:${active.id}`}
            <LearningStudio activityId={active.id} onClose={close}
              initialWorkspace={$state.snapshot(active.workspace)} onWorkspaceChange={(workspace) => remember(active, workspace)} />
          {/key}
        </div>
      </dialog>
    {/if}
  </div>
{/if}

<style>
  .studio-launcher{min-width:0;width:100%;margin:8px 0}.studio-launcher__choices{display:grid;gap:6px}.studio-launcher__choices button{display:flex;align-items:center;gap:10px;text-align:left;min-height:52px;padding:8px 10px;border:1px solid var(--line,#ccd4db);border-radius:12px;background:var(--paper,#fff);color:var(--ink,#24303a);font:inherit}.studio-launcher__choices strong,.studio-launcher__choices small{display:block}.studio-launcher__choices small{font-size:.72rem}.studio-launcher button:focus-visible{outline:3px solid var(--accent,#5042a8);outline-offset:2px}.studio-window{box-sizing:border-box;width:min(760px,100vw);max-width:100vw;height:100dvh;max-height:100dvh;margin:auto;padding:8px;border:0;background:var(--paper,#fff);color:var(--ink,#24303a);overflow:hidden}.studio-window[open]{display:flex;flex-direction:column;gap:4px}.studio-window::backdrop{background:rgb(0 0 0 / .45)}.studio-window__content{flex:1;min-height:0;min-width:0}.studio-save-notice{font-size:.85rem;line-height:1.35;margin:0;padding:6px;border:1px solid currentColor;max-height:22vh;overflow:auto}
</style>
