<script lang="ts">
  import { onMount } from 'svelte';
  import {
    getAndroidOfflineSpeechStatus,
    isAndroidOfflineSpeechRuntime,
    openAndroidOfflineVoiceInstaller
  } from '../runtime/androidOfflineSpeech';

  let { language = 'en-IN' }: { language?: string } = $props();
  let needsSetup = $state(false);

  async function refresh(): Promise<void> {
    if (!isAndroidOfflineSpeechRuntime()) return;
    const status = await getAndroidOfflineSpeechStatus(language);
    needsSetup = Boolean(status?.ready && (!status.available || !status.hasOfflineVoice));
  }

  onMount(() => {
    void refresh();
    const onVisible = () => document.visibilityState === 'visible' && void refresh();
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  });
</script>

{#if needsSetup}
  <button
    type="button"
    aria-label="Grown-up: add Android offline voice"
    title="Grown-up audio setup"
    onclick={() => void openAndroidOfflineVoiceInstaller()}
    style="position:fixed;right:10px;bottom:10px;z-index:30;width:44px;height:44px;border:0;border-radius:50%;background:white"
  >🔈</button>
{/if}
