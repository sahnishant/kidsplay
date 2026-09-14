<script lang="ts">
  import { onMount, tick } from 'svelte';
  import type { ExperienceDiscoveryDescriptor } from '../../experienceDiscovery';
  import { installAppBackNavigation, pushAppBackLayer, requestAppBack } from '../../runtime/appNavigation';
  import { loadChildSettings } from '../../runtime/localProgress';
  import NavigationPrototypeBrowse from './NavigationPrototypeBrowse.svelte';
  import NavigationPrototypeHome from './NavigationPrototypeHome.svelte';
  import NavigationPrototypeLaunch from './NavigationPrototypeLaunch.svelte';

  const child = loadChildSettings();
  let entries = $state<ExperienceDiscoveryDescriptor[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let view = $state<'home' | 'browse'>('home');
  let browseQuery = $state('');
  let activeEntry = $state<ExperienceDiscoveryDescriptor | null>(null);
  let resumeEntry = $state<ExperienceDiscoveryDescriptor | null>(null);
  let releaseBrowseBack: (() => void) | null = null;
  let releaseLaunchBack: (() => void) | null = null;
  let launchReturnFocusId: string | null = null;

  onMount(() => installAppBackNavigation());
  onMount(async () => {
    try {
      const { loadCurrentExperienceDiscovery } = await import('../../experienceDiscovery/current');
      const loaded = await loadCurrentExperienceDiscovery();
      entries = loaded;
      await refreshSupportedResume(loaded);
    } catch (cause) {
      error = cause instanceof Error ? cause.message : 'Catalogue unavailable.';
    } finally {
      loading = false;
    }
  });

  async function refreshSupportedResume(source: ExperienceDiscoveryDescriptor[] = entries): Promise<void> {
    try {
      const [{ PUBLISHED_STORIES_V1 }, { loadStoryResumeState }] = await Promise.all([
        import('../../experience/storyCatalog'),
        import('../../experience/storyReadingPersistence')
      ]);
      const state = loadStoryResumeState(PUBLISHED_STORIES_V1);
      if (!state || state.completed) {
        resumeEntry = null;
        return;
      }
      resumeEntry = source.find((entry) =>
        entry.canonicalId === state.storyId
        && entry.availability === 'available'
        && entry.progress.owner === 'story_reading'
        && entry.progress.resume === 'exact'
      ) ?? null;
    } catch {
      // Resume is optional navigation affordance. Corrupt/unavailable storage fails soft.
      resumeEntry = null;
    }
  }

  async function restoreFocus(selector: string): Promise<void> {
    await tick();
    document.querySelector<HTMLElement>(selector)?.focus();
  }

  function restoreLaunchFocus(): void {
    const id = launchReturnFocusId;
    launchReturnFocusId = null;
    if (id) void restoreFocus(`[data-canonical-id="${id}"]`);
  }

  function settleLaunchReturn(): void {
    activeEntry = null;
    releaseLaunchBack = null;
    void refreshSupportedResume().finally(restoreLaunchFocus);
  }

  function openBrowse(): void {
    if (view === 'browse') return;
    releaseBrowseBack?.();
    browseQuery = '';
    view = 'browse';
    releaseBrowseBack = pushAppBackLayer('nav100:browse', () => {
      browseQuery = '';
      view = 'home';
      releaseBrowseBack = null;
      void restoreFocus('.browse-all');
    });
  }

  function closeBrowse(): void {
    requestAppBack(() => {
      browseQuery = '';
      view = 'home';
      releaseBrowseBack = null;
      void restoreFocus('.browse-all');
    });
  }

  function select(entry: ExperienceDiscoveryDescriptor): void {
    if (activeEntry) return;
    releaseLaunchBack?.();
    launchReturnFocusId = entry.canonicalId;
    activeEntry = entry;
    releaseLaunchBack = pushAppBackLayer(`nav100:launch:${entry.canonicalId}`, settleLaunchReturn);
  }

  function closeLaunch(): void {
    requestAppBack(settleLaunchReturn);
  }
</script>

{#if activeEntry}
  <NavigationPrototypeLaunch
    entry={activeEntry}
    childName={child.name}
    childAvatar={child.avatar}
    onExit={closeLaunch}
  />
{:else if view === 'browse'}
  <NavigationPrototypeBrowse
    {entries}
    query={browseQuery}
    onQueryChange={(query) => browseQuery = query}
    onBack={closeBrowse}
    onSelect={select}
  />
{:else}
  <NavigationPrototypeHome
    childName={child.name}
    {entries}
    {resumeEntry}
    {loading}
    {error}
    onSelect={select}
    onBrowse={openBrowse}
  />
{/if}
