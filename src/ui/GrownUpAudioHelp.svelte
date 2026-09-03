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
    needsSetup = Boolean(status && (!status.available || !status.hasOfflineVoice));
    if (!needsSetup) message = '';
  }

  async function installVoice(): Promise<void> {
    const opened = await openAndroidOfflineVoiceInstaller();
    message = opened
      ? 'Finish the Android voice setup, come back to Kidsplay, then check again.'
      : 'Android could not open its voice installer. You can keep playing without spoken clues.';
  }

  onMount(() => {
    void refresh();
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  });
</script>

{#if needsSetup}
  <details class="grown-up-audio-help">
    <summary aria-label="Grown-up audio setup" title="Grown-up audio setup">🔈</summary>
    <div class="grown-up-audio-help__panel">
      <strong>Grown-up audio setup</strong>
      <p>Kids can keep playing. Add an Android offline voice to hear spoken clues without internet.</p>
      <div class="grown-up-audio-help__actions">
        <button type="button" onclick={installVoice}>Add offline voice</button>
        <button type="button" onclick={refresh} disabled={checking}>{checking ? 'Checking…' : 'Check again'}</button>
      </div>
      {#if message}<p class="grown-up-audio-help__message" aria-live="polite">{message}</p>{/if}
    </div>
  </details>
{/if}

<style>
  .grown-up-audio-help {
    position: fixed;
    right: max(10px, env(safe-area-inset-right));
    bottom: max(10px, env(safe-area-inset-bottom));
    z-index: 30;
    font: inherit;
  }

  summary {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 1px solid rgba(23, 76, 60, 0.18);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.96);
    box-shadow: 0 4px 16px rgba(22, 57, 45, 0.16);
    cursor: pointer;
    list-style: none;
  }

  summary::-webkit-details-marker { display: none; }

  .grown-up-audio-help__panel {
    width: min(300px, calc(100vw - 24px));
    margin-top: 8px;
    padding: 14px;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.98);
    box-shadow: 0 8px 28px rgba(22, 57, 45, 0.2);
    color: #183c31;
  }

  p {
    margin: 6px 0 10px;
    font-size: 0.82rem;
    line-height: 1.35;
  }

  .grown-up-audio-help__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  button {
    min-height: 44px;
    padding: 8px 12px;
    border: 0;
    border-radius: 12px;
    background: var(--accent-soft, #e7f4ee);
    color: var(--accent, #166147);
    font: inherit;
    font-size: 0.78rem;
    font-weight: 800;
    cursor: pointer;
  }

  button:disabled { cursor: default; opacity: 0.65; }
  .grown-up-audio-help__message { margin-bottom: 0; }
</style>
