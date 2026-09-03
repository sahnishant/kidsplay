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
  <details style="position:fixed;right:10px;bottom:10px;z-index:30">
    <summary
      aria-label="Grown-up audio setup"
      title="Grown-up audio setup"
      style="display:grid;place-items:center;width:44px;height:44px;border-radius:50%;background:white;cursor:pointer"
    >🔈</summary>
    <div style="width:min(290px,calc(100vw - 24px));padding:12px;border-radius:14px;background:white;color:#183c31">
      <strong>Grown-up audio setup</strong>
      <p>Kids can keep playing. Add an Android offline voice for spoken clues without internet.</p>
      <button type="button" onclick={() => void openAndroidOfflineVoiceInstaller()} style="min-height:44px">Add offline voice</button>
      <button type="button" onclick={() => void refresh()} style="min-height:44px">Check again</button>
    </div>
  </details>
{/if}
