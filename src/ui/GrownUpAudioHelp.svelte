<script lang="ts">
  import { onMount } from 'svelte';
  import {
    getAndroidOfflineSpeechStatus,
    isAndroidOfflineSpeechRuntime,
    openAndroidOfflineVoiceInstaller
  } from '../runtime/androidOfflineSpeech';

  let { language = 'en-IN' }: { language?: string } = $props();
  let needsSetup = $state(false);
  let checking = $state(false);
  let message = $state('');

  async function refresh(): Promise<void> {
    if (!isAndroidOfflineSpeechRuntime()) {
      needsSetup = false;
      return;
    }
    checking = true;
    const status = await getAndroidOfflineSpeechStatus(language);
    checking = false;
    needsSetup = Boolean(status?.ready && (!status.available || !status.hasOfflineVoice));
    if (!needsSetup) message = '';
  }

  async function installVoice(): Promise<void> {
    const opened = await openAndroidOfflineVoiceInstaller();
    message = opened
      ? 'Finish Android voice setup, return to Kidsplay, then check again.'
      : 'Android could not open voice setup. Kids can keep playing without spoken clues.';
  }

  onMount(() => {
    void refresh();
    const onVisible = () => document.visibilityState === 'visible' && void refresh();
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  });
</script>

{#if needsSetup}
  <details class="audio-help">
    <summary aria-label="Grown-up audio setup" title="Grown-up audio setup">🔈</summary>
    <div class="audio-help-panel">
      <strong>Grown-up audio setup</strong>
      <p>Kids can keep playing. Add an Android offline voice for spoken clues without internet.</p>
      <button type="button" onclick={installVoice}>Add offline voice</button>
      <button type="button" onclick={refresh} disabled={checking}>{checking ? 'Checking…' : 'Check again'}</button>
      {#if message}<p aria-live="polite">{message}</p>{/if}
    </div>
  </details>
{/if}

<style>
  .audio-help{position:fixed;right:10px;bottom:10px;z-index:30}
  summary{display:grid;place-items:center;width:44px;height:44px;border-radius:50%;background:white;cursor:pointer;list-style:none}
  summary::-webkit-details-marker{display:none}
  .audio-help-panel{width:min(290px,calc(100vw - 24px));margin-top:6px;padding:12px;border-radius:14px;background:white;color:#183c31;box-shadow:0 6px 24px #16392d33}
  p{margin:6px 0 8px;font-size:.82rem;line-height:1.35}
  button{min-height:44px;margin:2px 6px 2px 0;padding:8px 10px;border:0;border-radius:10px;font:inherit;font-size:.78rem;font-weight:800}
</style>
