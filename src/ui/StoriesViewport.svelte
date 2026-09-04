<script lang="ts">
  import { onDestroy } from 'svelte';
  import { STORY_CANDIDATES_V1 } from '../experience/storyCatalog';
  import {
    createInitialStoryReadingState,
    loadStoryReadingStore,
    saveStoryReadingState
  } from '../experience/storyReadingPersistence';
  import { measureStoryNarration, storyNarrationUtteranceId } from '../experience/storyNarrationMetrics';
  import type { StoryManifest, StoryReadingState } from '../experience/storiesContract';
  import { loadChildAudioPreferences, saveChildAudioPreferences } from '../runtime/childAudio';
  import { cancelChildUtterance, playChildUtterance } from '../runtime/childAudioProduction';

  let { onExit }: { onExit: () => void } = $props();
  const catalog = STORY_CANDIDATES_V1;
  let store = $state(loadStoryReadingStore(catalog));
  let activeStoryId = $state<string | null>(store.currentStoryId);
  let audioEnabled = $state(loadChildAudioPreferences().enabled);
  let audioStatus = $state('');

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
    cancelChildUtterance();
    audioStatus = '';
    persist(story, store.states[story.storyId] ?? createInitialStoryReadingState(story));
  }
  function closeStory(): void {
    cancelChildUtterance();
    audioStatus = '';
    activeStoryId = null;
  }
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
  {#if activeStory() && readingState()}
    {@const story = activeStory()!}
    {@const state = readingState()!}
    {@const index = beatIndex()}
    {@const beat = story.beats[index]}
    <header class="topbar">
      <button type="button" class="icon" aria-label="Back to stories" onclick={closeStory}>←</button>
      <div class="title"><small>STORY TIME</small><h1>{story.childTitle}</h1></div>
      <button type="button" class="icon" aria-label={state.favourite ? 'Remove from favourites' : 'Add to favourites'} aria-pressed={state.favourite} onclick={toggleFavourite}>{state.favourite ? '♥' : '♡'}</button>
      <button type="button" class="icon" aria-label={audioEnabled ? 'Turn sound off' : 'Turn sound on'} aria-pressed={audioEnabled} onclick={toggleSound}>{audioEnabled ? '🔊' : '🔇'}</button>
    </header>

    <section class="reader" data-testid="story-reader" data-story-id={story.storyId} data-editorial-status={story.editorialStatus}>
      <p class="page-count">Page {index + 1} of {story.beats.length}</p>
      <article class="story-text" tabindex="0" data-testid="story-beat">{beat.text}</article>
      <p class="audio-status" aria-live="polite">{audioStatus}</p>
      {#if state.completed}
        <div class="finished" role="status">
          <strong>Story finished.</strong>
          <span>You can hear it again whenever you like.</span>
          <button type="button" onclick={replay}>↻ Replay</button>
        </div>
      {:else}
        <div class="listen-row">
          <button type="button" onclick={readCurrentBeat}>▶ Read to me</button>
          <button type="button" onclick={readCurrentBeat}>↻ Repeat page</button>
        </div>
      {/if}
    </section>

    <nav class="page-nav" aria-label="Story pages">
      <button type="button" disabled={index === 0} onclick={() => move(-1)}>← Back</button>
      <button type="button" onclick={() => move(1)}>{index === story.beats.length - 1 ? 'Done' : 'Next →'}</button>
    </nav>
  {:else}
    <header class="topbar library-topbar">
      <button type="button" class="icon" aria-label="Back to Kidsplay" onclick={onExit}>←</button>
      <div class="title"><small>QUIET TIME</small><h1>Stories</h1></div>
      <button type="button" class="icon" aria-label={audioEnabled ? 'Turn sound off' : 'Turn sound on'} aria-pressed={audioEnabled} onclick={toggleSound}>{audioEnabled ? '🔊' : '🔇'}</button>
    </header>
    <section class="library" aria-label="Story library">
      {#each catalog as story}
        {@const saved = store.states[story.storyId]}
        <button class="story-card" type="button" onclick={() => openStory(story)} data-story-id={story.storyId}>
          <span class="story-icon" aria-hidden="true">{story.durationBand === 'bedtime_story' ? '🌙' : '📖'}</span>
          <span class="story-copy"><strong>{story.childTitle}</strong><small>{story.durationBand === 'bedtime_story' ? 'Bedtime story' : 'Tiny tale'} · {durationLabel(story)}</small></span>
          {#if saved?.favourite}<span aria-label="Favourite">♥</span>{/if}
          {#if saved && !saved.completed}<span class="resume">Continue</span>{/if}
        </button>
      {/each}
    </section>
    <p class="calm-note">No scores. No questions. Just stories.</p>
  {/if}
</main>

<style>
  .stories{width:min(720px,100%);height:100dvh;margin:auto;padding:8px;display:flex;flex-direction:column;gap:8px;overflow:hidden;background:linear-gradient(180deg,#f5f1ff,#fffaf2);color:var(--ink)}
  .topbar{min-height:58px;display:flex;align-items:center;gap:7px;padding:5px 7px;border:1px solid #332c4a17;border-radius:18px;background:#fffffff0}.title{min-width:0;flex:1}.title small{color:#695b8d;font-size:.58rem;font-weight:900;letter-spacing:.08em}.title h1{margin:1px 0 0;font-size:clamp(1rem,4vw,1.3rem);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.icon{min-width:46px;min-height:46px;border:0;border-radius:14px;background:#eee9fa;font:inherit;font-size:1.05rem;cursor:pointer}
  .reader{min-height:0;flex:1;display:flex;flex-direction:column;gap:8px;padding:14px;border:1px solid #332c4a12;border-radius:22px;background:#fffdf9;overflow:hidden}.page-count{margin:0;color:#786f85;font-size:.7rem;font-weight:800}.story-text{min-height:0;flex:1;overflow:auto;padding:4px 3px;font-family:Georgia,'Times New Roman',serif;font-size:clamp(1.08rem,5vw,1.45rem);line-height:1.65;outline-offset:4px}.audio-status{min-height:1.2em;margin:0;color:#625b6a;font-size:.72rem}.listen-row,.page-nav{display:grid;grid-template-columns:1fr 1fr;gap:8px}.listen-row button,.page-nav button,.finished button{min-height:48px;border:0;border-radius:15px;background:#7762a8;color:#fff;font:inherit;font-weight:900;cursor:pointer}.listen-row button+button,.page-nav button:first-child{background:#eee9fa;color:#4c416a}.page-nav button:disabled{opacity:.42;cursor:default}.finished{display:grid;gap:5px;padding:10px;border-radius:15px;background:#f4f0fa}.finished span{font-size:.75rem;color:#625b6a}.finished button{margin-top:4px}
  .library{min-height:0;flex:1;display:grid;align-content:start;gap:9px;overflow:auto;padding:1px}.story-card{min-height:86px;display:flex;align-items:center;gap:11px;padding:11px 12px;border:1px solid #332c4a18;border-radius:20px;background:#fffdf9;color:inherit;text-align:left;cursor:pointer}.story-icon{font-size:1.7rem}.story-copy{min-width:0;flex:1;display:grid;gap:4px}.story-copy strong{font-size:.96rem}.story-copy small{color:#746b7f;font-size:.7rem}.resume{padding:4px 7px;border-radius:999px;background:#eee9fa;color:#5a477e;font-size:.62rem;font-weight:900}.calm-note{margin:0;text-align:center;color:#746b7f;font-size:.68rem}
  @media(max-width:420px){.stories{padding:6px}.reader{padding:11px}.listen-row button,.page-nav button{font-size:.82rem}.library{gap:7px}.story-card{min-height:78px}.icon{min-width:44px;min-height:44px}}
  @media(prefers-reduced-motion:reduce){.stories *{scroll-behavior:auto!important;transition:none!important;animation:none!important}}
</style>
