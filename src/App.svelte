<script lang="ts">
  import { createSessionForCatalogEntry, getCatalogEntries, type SessionLaunch } from './content';
  import type { SessionAttempt } from './contracts/runtime';
  import {
    loadChildSettings,
    loadProgress,
    recordAttempt,
    saveChildSettings,
    summarizeProgress,
    type ChildSettings
  } from './runtime/localProgress';
  import Home from './ui/Home.svelte';
  import Session from './ui/Session.svelte';

  const catalog = getCatalogEntries();
  let child = $state(loadChildSettings());
  let progress = $state(loadProgress());
  let activeSession = $state<SessionLaunch | null>(null);
  let startError = $state<string | null>(null);
  let progressSummary = $derived(summarizeProgress(progress));

  function handleChildChange(settings: ChildSettings): void {
    child = saveChildSettings(settings);
  }

  function startSession(entryId: string): void {
    try {
      activeSession = createSessionForCatalogEntry(entryId, progress.knowledge);
      startError = null;
    } catch (error) {
      startError = error instanceof Error ? error.message : 'This learning session could not be started.';
    }
  }

  function handleAttempt(attempt: SessionAttempt): void {
    progress = recordAttempt(attempt);
  }

  function returnHome(): void {
    activeSession = null;
    startError = null;
  }
</script>

{#if activeSession}
  <Session
    title={activeSession.title}
    questions={activeSession.questions}
    childName={child.name}
    childAvatar={child.avatar}
    onAttempt={handleAttempt}
    onExit={returnHome}
  />
{:else}
  <Home
    {child}
    {catalog}
    progress={progressSummary}
    onChildChange={handleChildChange}
    onStart={startSession}
  />

  {#if startError}
    <div class="app-error" role="alert">{startError}</div>
  {/if}
{/if}
