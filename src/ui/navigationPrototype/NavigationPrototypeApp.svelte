<script lang="ts">
  import { onMount } from 'svelte';
  import type { ExperienceDiscoveryDescriptor } from '../../experienceDiscovery';
  import { loadChildSettings } from '../../runtime/localProgress';
  import NavigationPrototypeHome from './NavigationPrototypeHome.svelte';

  const child = loadChildSettings();
  let entries = $state<ExperienceDiscoveryDescriptor[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let message = $state<string | null>(null);

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

  function select(entry: ExperienceDiscoveryDescriptor): void {
    message = `Selected: ${entry.childTitle}. Launch wiring follows in the next small PR.`;
  }

  function browse(): void {
    message = 'Browse all opens in the next small PR.';
  }
</script>

<NavigationPrototypeHome
  childName={child.name}
  {entries}
  {loading}
  {error}
  onSelect={select}
  onBrowse={browse}
/>

{#if message}
  <div class="prototype-message" role="status">
    {message}
    <button type="button" onclick={() => message = null}>Close</button>
  </div>
{/if}

<style>
  .prototype-message{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);width:min(520px,calc(100% - 24px));box-sizing:border-box;padding:12px 14px;border-radius:16px;background:#17324d;color:white;display:flex;gap:12px;align-items:center;justify-content:space-between;box-shadow:0 8px 28px rgba(0,0,0,.22);z-index:50}.prototype-message button{min-height:42px;padding:0 14px;border:0;border-radius:12px;background:white;color:#17324d;font:inherit;font-weight:800;cursor:pointer}.prototype-message button:focus-visible{outline:4px solid #ffb02e;outline-offset:2px}@media(max-width:560px){.prototype-message{align-items:stretch;flex-direction:column}.prototype-message button{width:100%}}
</style>
