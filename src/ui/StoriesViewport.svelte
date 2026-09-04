<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import storyCandidatesUrl from '../../content/stories/v1-candidates.json?url';
  import {
    createInitialStoryReadingState,
    loadStoryReadingStore,
    saveStoryReadingState,
    type StoryReadingStore
  } from '../experience/storyReadingPersistence';
  import { measureStoryNarration, storyNarrationUtteranceId } from '../experience/storyNarrationMetrics';
  import { validateStoryManifest, type StoryManifest, type StoryReadingState } from '../experience/storiesContract';
  import { loadChildAudioPreferences, saveChildAudioPreferences } from '../runtime/childAudio';
  import { cancelChildUtterance, playChildUtterance } from '../runtime/childAudioProduction';

  let { onExit }: { onExit: () => void } = $props();
  let catalog = $state<StoryManifest[]>([]);
  let store = $state<StoryReadingStore>({ version: 1, currentStoryId: null, states: {} });
  let activeStoryId = $state<string | null>(null);
  let audioEnabled = $state(loadChildAudioPreferences().enabled);
  let audioStatus = $state('');
  let loadError = $state('');

  onMount(() => {
    let alive = true;
    void fetch(storyCandidatesUrl)
      .then(async (response) => {
        if (!response.ok) throw new Error(`Story library asset returned ${response.status}`);
        const raw: unknown = await response.json();
        if (!Array.isArray(raw)) throw new Error('Story library asset must be an array');
        const loaded = raw.map(validateStoryManifest);
        if (!alive) return;
        catalog = loaded;
        store = loadStoryReadingStore(loaded);
        activeStoryId = store.currentStoryId;
      })
      .catch(() => {
        if (alive) loadError = 'Stories could not be opened from this installation.';
      });
    return () => { alive = false; };
  });

  function activeStory(): StoryManifest | null {
    return catalog.find((story) => story.storyId === activeStoryId) ?? null;
  }
  function readingState(): StoryReadingState | null {
    return activeStoryId ? store.states[activeStoryId] ?? null : null;
  }
  function beatIndex(): number {
    const story = activeStory();
    const state = readingState();
    return story && state ? Math.max(0, story.beats.findIndex((beat) => beat.beatId === state.currentBeatId)) : 0;
  }
  function durationLabel(story: StoryManifest): string {
    const seconds = Math.round(measureStoryNarration(story).totalDurationMs / 1000);
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  }
  function persist(story: StoryManifest, state: StoryReadingState): void {
    store = saveStoryReadingState(catalog, story, state);
    activeStoryId = story.storyId;
  }
  function openStory(story: StoryManifest): void {
    cancelChildUtterance(); audioStatus = '';
    persist(story, store.states[story.storyId] ?? createInitialStoryReadingState(story));
  }
  function closeStory(): void { cancelChildUtterance(); audioStatus = ''; activeStoryId = null; }
  function move(delta: -1 | 1): void {
    const story = activeStory(); const state = readingState();
    if (!story || !state) return;
    cancelChildUtterance(); audioStatus = '';
    const index = beatIndex();
    if (delta === 1 && index === story.beats.length - 1) {
      persist(story, { ...state, completed: true });
      return;
    }
    const nextIndex = Math.max(0, Math.min(story.beats.length - 1, index + delta));
    persist(story, { ...state, currentBeatId: story.beats[nextIndex].beatId, completed: false });
  }
  function toggleFavourite(): void {
    const story = activeStory(); const state = readingState();
    if (story && state) persist(story, { ...state, favourite: !state.favourite });
  }
  function replay(): void {
    const story = activeStory(); const state = readingState();
    if (!story || !state) return;
    cancelChildUtterance();
    persist(story, { ...state, currentBeatId: story.beats[0].beatId, completed: false });
    audioStatus = '';
  }
  function readCurrentBeat(): void {
    const story = activeStory(); const state = readingState();
    if (!story || !state) return;
    const beat = story.beats[beatIndex()];
    const result = playChildUtterance(storyNarrationUtteranceId(story, beat.beatId), beat.text, audioEnabled);
    audioStatus = result.source === 'text_fallback'
      ? 'Audio is not available offline on this device. The story text is ready to read.'
      : result.source === 'muted' ? 'Sound is off.' : 'Reading this page.';
  }
  function toggleSound(): void {
    audioEnabled = !audioEnabled;
    saveChildAudioPreferences(audioEnabled);
    if (!audioEnabled) cancelChildUtterance();
    audioStatus = audioEnabled ? 'Sound is on.' : 'Sound is off.';
  }

  onDestroy(cancelChildUtterance);
</script>

<main class="stories" data-testid="stories-surface">
  {#if loadError}
    <header class="topbar"><button class="icon" type="button" aria-label="Back to Kidsplay" onclick={onExit}>←</button><h1>Stories</h1></header>
    <p role="alert">{loadError}</p>
  {:else if catalog.length === 0}
    <p role="status">Opening stories…</p>
  {:else if activeStory() && readingState()}
    {@const story = activeStory()!}
    {@const state = readingState()!}
    {@const index = beatIndex()}
    {@const beat = story.beats[index]}
    <header class="topbar">
      <button class="icon" type="button" aria-label="Back to stories" onclick={closeStory}>←</button>
      <div class="title"><small>STORY TIME</small><h1>{story.childTitle}</h1></div>
      <button class="icon" type="button" aria-label={state.favourite ? 'Remove from favourites' : 'Add to favourites'} aria-pressed={state.favourite} onclick={toggleFavourite}>{state.favourite ? '♥' : '♡'}</button>
      <button class="icon" type="button" aria-label={audioEnabled ? 'Turn sound off' : 'Turn sound on'} aria-pressed={audioEnabled} onclick={toggleSound}>{audioEnabled ? '🔊' : '🔇'}</button>
    </header>

    <section class="reader" aria-label={`${story.childTitle}, page ${index + 1} of ${story.beats.length}`} data-testid="story-reader" data-story-id={story.storyId} data-editorial-status={story.editorialStatus}>
      <p class="meta">Page {index + 1} of {story.beats.length}</p>
      <article class="story-text" data-testid="story-beat">{beat.text}</article>
      <p class="meta" aria-live="polite">{audioStatus}</p>
      {#if state.completed}
        <div class="finished" role="status"><strong>Story finished.</strong><span>You can hear it again whenever you like.</span><button type="button" onclick={replay}>↻ Replay</button></div>
      {:else}
        <div class="actions"><button type="button" onclick={readCurrentBeat}>▶ Read to me</button><button class="soft" type="button" onclick={readCurrentBeat}>↻ Repeat page</button></div>
      {/if}
    </section>

    <nav class="actions" aria-label="Story pages"><button class="soft" type="button" disabled={index === 0} onclick={() => move(-1)}>← Back</button><button type="button" onclick={() => move(1)}>{index === story.beats.length - 1 ? 'Done' : 'Next →'}</button></nav>
  {:else}
    <header class="topbar">
      <button class="icon" type="button" aria-label="Back to Kidsplay" onclick={onExit}>←</button>
      <div class="title"><small>QUIET TIME</small><h1>Stories</h1></div>
      <button class="icon" type="button" aria-label={audioEnabled ? 'Turn sound off' : 'Turn sound on'} aria-pressed={audioEnabled} onclick={toggleSound}>{audioEnabled ? '🔊' : '🔇'}</button>
    </header>
    <section class="library" aria-label="Story library">
      {#each catalog as story}
        {@const saved = store.states[story.storyId]}
        <button class="story-card" type="button" aria-label={`Open ${story.childTitle}`} onclick={() => openStory(story)} data-story-id={story.storyId}>
          <span aria-hidden="true">{story.durationBand === 'bedtime_story' ? '🌙' : '📖'}</span>
          <span class="story-copy"><strong>{story.childTitle}</strong><small>{story.durationBand === 'bedtime_story' ? 'Bedtime story' : 'Tiny tale'} · {durationLabel(story)}</small></span>
          {#if saved?.favourite}<span aria-label="Favourite">♥</span>{/if}
          {#if saved && !saved.completed}<span>Continue</span>{/if}
        </button>
      {/each}
    </section>
    <p class="meta calm-note">No scores. No questions. Just stories.</p>
  {/if}
</main>

<style>
  .stories{width:min(720px,100%);height:100dvh;margin:auto;padding:6px;display:flex;flex-direction:column;gap:7px;overflow:hidden;background:#faf7ff;color:var(--ink)}
  .topbar{min-height:56px;display:flex;align-items:center;gap:6px;padding:5px;border:1px solid #332c4a17;border-radius:16px;background:#fff}.title{min-width:0;flex:1}.title h1{margin:0;font-size:1.15rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.icon{min-width:44px}
  button{min-height:44px;border:0;border-radius:13px;background:#7762a8;color:#fff;font:inherit;font-weight:900;cursor:pointer}.icon,.soft{background:#eee9fa;color:#4c416a}button:disabled{opacity:.42}
  .reader{min-height:0;flex:1;display:flex;flex-direction:column;gap:7px;padding:11px;border-radius:18px;background:#fff;overflow:hidden}.meta,.title small,.story-copy small{margin:0;color:#746b7f;font-size:.7rem}.story-text{min-height:0;flex:1;overflow:auto;font-family:Georgia,serif;font-size:clamp(1.08rem,5vw,1.4rem);line-height:1.62}.actions{display:grid;grid-template-columns:1fr 1fr;gap:7px}.finished{display:grid;gap:5px;padding:9px;border-radius:13px;background:#f2eef8}
  .library{min-height:0;flex:1;display:grid;align-content:start;gap:7px;overflow:auto}.story-card{min-height:76px;display:flex;align-items:center;gap:9px;padding:9px 10px;border:1px solid #332c4a18;background:#fff;color:inherit;text-align:left}.story-copy{min-width:0;flex:1}.calm-note{text-align:center}
  @media(prefers-reduced-motion:reduce){.stories *{transition:none!important;animation:none!important}}
</style>
