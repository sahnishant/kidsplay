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
  let activeEntry = $state<ExperienceDiscoveryDescriptor | null>(null);
  let releaseBrowseBack: (() => void) | null = null;
  let releaseLaunchBack: (() => void) | null = null;
  let launchReturnFocusId: string | null = null;

  onMount(() => installAppBackNavigation());
  onMount(async () => {
    try {
      const { loadCurrentExperienceDiscovery } = await import('../../experienceDiscovery/current');
      entries = await loadCurrentExperienceDiscovery();
    } catch (cause) {
      error = cause instanceof Error ? cause.message : 'Catalogue unavailable.';
    } finally {
      loading = false;
    }
  });

  async function restoreFocus(selector: string): Promise<void> {
    await tick();
    document.querySelector<HTMLElement>(selector)?.focus();
  }

  function restoreLaunchFocus(): void {
    const id = launchReturnFocusId;
    launchReturnFocusId = null;
    if (id) void restoreFocus(`[data-canonical-id="${id}"]`);
  }

  function openBrowse(): void {
    if (view === 'browse') return;
    releaseBrowseBack?.();
    view = 'browse';
    releaseBrowseBack = pushAppBackLayer('nav100:browse', () => {
      view = 'home';
      releaseBrowseBack = null;
      void restoreFocus('.browse-all');
    });
  }

  function closeBrowse(): void {
    requestAppBack(() => {
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
    releaseLaunchBack = pushAppBackLayer(`nav100:launch:${entry.canonicalId}`, () => {
      activeEntry = null;
      releaseLaunchBack = null;
      restoreLaunchFocus();
    });
  }

  function closeLaunch(): void {
    requestAppBack(() => {
      activeEntry = null;
      releaseLaunchBack = null;
      restoreLaunchFocus();
    });
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
    onBack={closeBrowse}
    onSelect={select}
  />
{:else}
  <NavigationPrototypeHome
    childName={child.name}
    {entries}
    {loading}
    {error}
    onSelect={select}
    onBrowse={openBrowse}
  />
{/if}
