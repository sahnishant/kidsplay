<script lang="ts">
  import { onDestroy } from 'svelte';
  import type { CatalogEntry, GoalReadinessSummary } from '../content';
  import type { FirstPlaySurfaceMode } from '../experience/firstPlayProduction';
  import { projectForestDiscoveries } from '../forest/forestDiscoveries';
  import { mergeForestWorldDepthState } from '../forest/forestWorldProjection';
  import Avatar from '../presentation/Avatar.svelte';
  import { pushAppBackLayer, requestAppBack } from '../runtime/appNavigation';
  import { loadProgress, type AvatarId, type ChildSettings, type ProgressSummary } from '../runtime/localProgress';
  import type { MockTrendSummary, StoredMockCheckpoint } from '../runtime/mockPersistence';
  import { getStoryLocations, getStoryMissions } from '../story/storyDirector';
  import { buildStoryLocationPresentation } from '../story/storyPresentation';
  import type { StoryProgressSnapshot } from '../story/storyProgress';
  import { deriveWorldRewardState } from '../story/worldRewards';
  import ChildHud from './home/ChildHud.svelte';
  import HomeBottomNav from './home/HomeBottomNav.svelte';
  import StoryWorldViewport from './StoryWorldViewport.svelte';

  type ChildPrimaryView = 'world' | 'practice';
  type ChildNavView = ChildPrimaryView | 'stories';
  type GrownUpView = 'progress' | 'goals' | 'programmes';
  type HomeView = ChildPrimaryView | GrownUpView | 'player' | 'discovery' | 'phonics' | 'bicycle-workshop';

  let {
    child, catalog, progress, goalReadiness, resumableMock, mockTrends, storyProgress,
    onChildChange, onStart, onStartMission, onExploreLocation, onResumeMock,
    onOpenLearnAbout, onOpenStories, onStartFirstPlay
  }: {
    child: ChildSettings;
    catalog: CatalogEntry[];
    progress: ProgressSummary;
    goalReadiness: GoalReadinessSummary | null;
    resumableMock: StoredMockCheckpoint | null;
    mockTrends: MockTrendSummary[];
    storyProgress: StoryProgressSnapshot;
    onChildChange: (settings: ChildSettings) => void;
    onStart: (entryId: string) => void;
    onStartMission: (missionId: string) => void;
    onExploreLocation: (locationId: string) => void;
    onResumeMock: () => void;
    onOpenLearnAbout: () => void;
    onOpenStories: () => void;
    onStartFirstPlay?: (mode: FirstPlaySurfaceMode) => void;
  } = $props();

  const avatars: Array<{ id: AvatarId; label: string }> = [
    { id: 'fox', label: 'Fox' }, { id: 'owl', label: 'Owl' },
    { id: 'panda', label: 'Panda' }, { id: 'tiger', label: 'Tiger' }
  ];
  const storyLocations = getStoryLocations();
  const storyMissions = getStoryMissions();
  const discoveryProgress = loadProgress();

  let view = $state<HomeView>('world');
  let releaseViewBack: (() => void) | null = null;
  let displayName = $derived(child.name.trim() || 'Dheu');
  let worldState = $derived(mergeForestWorldDepthState(deriveWorldRewardState(progress), storyProgress));
  let forestDiscoveries = $derived(projectForestDiscoveries(storyProgress));
  let currentStoryPresentation = $derived(
    buildStoryLocationPresentation(storyLocations, storyMissions, storyProgress, progress.recommendedTopics)
      .find((item) => item.state === 'current') ?? null
  );
  let currentLevel = $derived(
    currentStoryPresentation?.mission?.worldDepthLevel
      ?? currentStoryPresentation?.location.progression.level
      ?? null
  );
  let patternMockEntryId = $derived(catalog.find((entry) => entry.actionLabel === 'Try 35-question mock')?.id ?? null);
  let freeExploreEntries = $derived(catalog.filter((entry) =>
    entry.kind === 'free_explore' && !entry.id.startsWith('free.english.bicycle-workshop.')
  ));
  let goalProgrammeEntries = $derived(catalog.filter((entry) => entry.kind === 'goal_learning'));
  let isGrownUpView = $derived(view === 'progress' || view === 'goals' || view === 'programmes');

  function updateName(event: Event): void {
    onChildChange({ ...child, name: (event.currentTarget as HTMLInputElement).value });
  }
  function closeViewFromBack(): void { view = 'world'; releaseViewBack = null; }
  function openView(next: HomeView): void {
    if (next === view) return;
    if (next === 'world') { requestAppBack(closeViewFromBack); return; }
    releaseViewBack?.();
    view = next;
    releaseViewBack = pushAppBackLayer(`home:${next}`, closeViewFromBack);
  }
  function openChildArea(next: ChildNavView): void {
    if (next === 'stories') {
      releaseViewBack?.();
      releaseViewBack = null;
      onOpenStories();
      return;
    }
    openView(next);
  }
  function requestWorld(): void { requestAppBack(closeViewFromBack); }
  function startPatternMock(): void { if (patternMockEntryId) onStart(patternMockEntryId); }
  function panelTitle(): string {
    if (view === 'player') return 'Who is playing?';
    if (view === 'progress') return 'Learning progress';
    if (view === 'goals') return 'Assessment & mocks';
    if (view === 'programmes') return 'Programmes & profiles';
    return 'Choose a play activity';
  }
  onDestroy(() => releaseViewBack?.());
</script>

<main class="home-viewport" data-home-view={view}>
  {#if view === 'world'}
    <ChildHud {child} {displayName} worldChanged={worldState.totalChanges > 0} {currentLevel} onOpenPlayer={() => openView('player')} />
    <div class="home-viewport__stage">
      <StoryWorldViewport childName={child.name} childAvatar={child.avatar} {storyProgress} {worldState} {forestDiscoveries}
        recommendedTopics={progress.recommendedTopics} topicProgress={progress.topics}
        {onStartMission} {onExploreLocation} />
      <button class="discovery-book-launch" type="button" onclick={() => openView('discovery')}>Discovery Book</button>
    </div>
    <HomeBottomNav active="world" onOpen={openChildArea} />
  {:else if view === 'discovery'}
    <div class="discovery-host">
      {#await import('./DiscoveryBookViewport.svelte') then module}
        {@const DiscoveryBookViewport = module.default}
        <DiscoveryBookViewport progress={discoveryProgress} {storyProgress} childName={child.name} onExit={requestWorld} />
      {/await}
    </div>
  {:else if view === 'phonics'}
    <div class="phonics-host">
      {#await import('./PhonicsAdventureViewport.svelte') then module}
        {@const PhonicsAdventureViewport = module.default}
        <PhonicsAdventureViewport childName={child.name} childAvatar={child.avatar} onExit={requestWorld} />
      {/await}
    </div>
  {:else if view === 'bicycle-workshop'}
    <div class="bicycle-workshop-host">
      {#await import('./BicycleWorkshopViewport.svelte') then module}
        {@const BicycleWorkshopViewport = module.default}
        <BicycleWorkshopViewport
          onExit={() => openView('practice')}
          onPractice={() => onStart('free.english.bicycle-workshop.1')}
          onChapterCheck={() => onStart('free.english.bicycle-workshop.chapter-check.1')}
        />
      {/await}
    </div>
  {:else}
    <section class="home-panel-screen" aria-label={`${view} screen`}>
      <header class="panel-topbar">
        <button class="panel-back" type="button" onclick={requestWorld} aria-label="Back to Dheu's world">←</button>
        <div>
          <span class="eyebrow">{isGrownUpView ? 'GROWN-UP AREA' : view === 'player' ? 'PLAYER' : 'PLAY'}</span>
          <h1>{panelTitle()}</h1>
        </div>
      </header>

      {#if isGrownUpView}
        <nav class="catalog-grid" aria-label="Grown-up sections">
          <button class="primary-action" type="button" aria-current={view === 'progress' ? 'page' : undefined} onclick={() => openView('progress')}>Progress</button>
          <button class="primary-action" type="button" aria-current={view === 'goals' ? 'page' : undefined} onclick={() => openView('goals')}>Assessment</button>
          <button class="primary-action" type="button" aria-current={view === 'programmes' ? 'page' : undefined} onclick={() => openView('programmes')}>Programmes</button>
        </nav>
      {/if}

      <div class:home-panel-body--fixed={view === 'progress' || view === 'goals'} class="home-panel-body">
        {#if view === 'player'}
          <section class="panel-card player-panel">
            <label class="name-field"><span>Child name</span><input type="text" maxlength="24" value={child.name} placeholder="e.g. Dheu" oninput={updateName} autocomplete="off" /></label>
            <div class="avatar-picker" role="group" aria-label="Choose an avatar">
              {#each avatars as avatar}
                <button type="button" class:avatar-button--selected={child.avatar === avatar.id} class="avatar-button"
                  aria-pressed={child.avatar === avatar.id} onclick={() => onChildChange({ ...child, avatar: avatar.id })}>
                  <span class="avatar-art" aria-hidden="true"><Avatar avatar={avatar.id} motion={child.avatar === avatar.id ? 'bounce' : 'idle'} /></span><small>{avatar.label}</small>
                </button>
              {/each}
            </div>
            <p class="panel-note">Player choices are saved on this device.</p>

            <aside class="catalog-card" aria-label="Grown-up area entry">
              <strong>For grown-ups</strong>
              <p>Progress numbers, assessment mocks and curriculum/profile details live here.</p>
              <button class="primary-action" type="button" onclick={() => openView('progress')} aria-label="Open grown-up area">Grown-up area</button>
            </aside>
          </section>
        {:else if view === 'progress'}
          {#await import('./home/ProgressViewport.svelte') then module}
            {@const ProgressViewport = module.default}
            <ProgressViewport {progress} />
          {/await}
        {:else if view === 'goals'}
          {#await import('./home/GoalsViewport.svelte') then module}
            {@const GoalsViewport = module.default}
            <GoalsViewport {goalReadiness} {resumableMock} {mockTrends} {onResumeMock} onStartMock={patternMockEntryId ? startPatternMock : undefined} />
          {/await}
        {:else if view === 'programmes'}
          <section class="catalog-grid" aria-label="Assessment programmes and curriculum profiles">
            {#each goalProgrammeEntries as entry}
              <article class="catalog-card catalog-card--goal">
                <div class="catalog-card__topline"><span class="access-badge">GOAL PROGRAMME</span>{#if entry.status === 'prototype'}<span class="prototype-badge">Prototype</span>{/if}</div>
                <h2>{entry.title}</h2><p>{entry.description}</p>
                {#if entry.profileRef}<small class="profile-ref">Curriculum profile: {entry.profileRef}</small>{/if}
                <button class="primary-action" type="button" onclick={() => onStart(entry.id)}>{entry.actionLabel}</button>
              </article>
            {/each}
          </section>
        {:else if view === 'practice'}
          {#if onStartFirstPlay}
            <section class="first-play-launches" aria-label="Picture-first play">
              <button class="first-play-launch" type="button" aria-label="Start First Play sampler" onclick={() => onStartFirstPlay?.('first_play')}>
                <span aria-hidden="true">🐾</span><strong>First Play</strong>
              </button>
              <button class="first-play-launch" type="button" aria-label="Start picture play puzzles" onclick={() => onStartFirstPlay?.('visual_reasoning')}>
                <span aria-hidden="true">🧩</span><strong>Picture Play</strong>
              </button>
            </section>
          {/if}

          <section class="catalog-grid" aria-label="Play activities">
            <article class="catalog-card catalog-card--chapter">
              <div class="catalog-card__topline"><span class="access-badge">CLASS 2 ENGLISH</span></div>
              <h2>Bicycle Workshop</h2>
              <p>Learn through seven graph-traced sections, then practise or take an eight-mark chapter check.</p>
              <button class="primary-action" type="button" onclick={() => openView('bicycle-workshop')}>Open chapter</button>
            </article>
            <article class="catalog-card catalog-card--phonics">
              <div class="catalog-card__topline"><span class="access-badge">SOUND PLAY</span></div>
              <h2>Scientu’s Sound Trail</h2>
              <p>Listen, sort pictures, connect sounds to letters, then find the matching word.</p>
              <button class="primary-action" type="button" onclick={() => openView('phonics')}>Start Sound Trail</button>
            </article>
            <article class="catalog-card catalog-card--learn-about">
              <div class="catalog-card__topline"><span class="access-badge">LEARN ABOUT</span></div>
              <h2>Explore a topic</h2>
              <p>Earth, Lion and Fire Station through one look · discover · guess path.</p>
              <button class="primary-action" type="button" onclick={onOpenLearnAbout}>Open Learn About</button>
            </article>
            {#each freeExploreEntries as entry}
              <article class="catalog-card">
                <div class="catalog-card__topline"><span class="access-badge">PLAY</span>{#if entry.status === 'prototype'}<span class="prototype-badge">Prototype</span>{/if}</div>
                <h2>{entry.title}</h2><p>{entry.description}</p>
                <button class="primary-action" type="button" onclick={() => onStart(entry.id)}>{entry.actionLabel}</button>
              </article>
            {/each}
          </section>
        {/if}
      </div>

      {#if view === 'practice'}
        <HomeBottomNav active="practice" onOpen={openChildArea} />
      {/if}
    </section>
  {/if}
</main>

<style>
  .home-viewport{width:min(960px,100%);height:calc(100dvh - 42px);margin:auto;display:grid;grid-template-rows:auto minmax(0,1fr) auto;gap:7px;overflow:hidden}
  .home-viewport__stage,.home-panel-screen,.home-panel-body{min-height:0}.home-viewport__stage,.home-panel-screen{overflow:hidden}.home-viewport__stage{position:relative}.home-panel-screen{grid-row:1/-1;display:flex;flex-direction:column;gap:7px}.discovery-host,.phonics-host,.bicycle-workshop-host{grid-row:1/-1;min-height:0;overflow:hidden}
  .discovery-book-launch{position:absolute;right:10px;bottom:10px;min-height:44px;padding:8px 14px;border:2px solid #fff;border-radius:999px;background:var(--accent);color:#fff;font:inherit;font-size:.76rem;font-weight:950;box-shadow:0 4px 14px #24303a2a;cursor:pointer}
  .panel-topbar{min-height:50px;display:flex;align-items:center;gap:8px;padding:4px 8px;border:1px solid #24303a14;border-radius:15px;background:#fffffff2}.panel-back{width:40px;height:40px;flex:none;border:0;border-radius:12px;background:var(--accent-soft);color:var(--accent);font-size:1.1rem;font-weight:950;cursor:pointer}.eyebrow{color:var(--accent);font-size:.57rem;font-weight:950;letter-spacing:.08em}.panel-topbar h1{margin:1px 0 0;font-size:clamp(1rem,3.5vw,1.25rem);line-height:1}
  .home-panel-body{min-height:0;flex:1;overflow:auto;padding:1px 2px 5px}.home-panel-body--fixed{overflow:hidden;padding:0}.panel-card,.catalog-card{border:1px solid #24303a17;border-radius:18px;background:#fffffff0}.panel-card{padding:16px}.panel-note,.catalog-card p,.profile-ref{color:var(--muted)}
  .name-field{display:grid;gap:6px}.name-field span{font-size:.76rem;font-weight:800}.name-field input{min-height:50px;padding:9px 12px;border:2px solid var(--line);border-radius:14px;font:inherit;font-weight:800}.avatar-picker{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin-top:12px}.avatar-button{min-height:100px;display:grid;place-items:center;padding:7px;border:2px solid #e3e8eb;border-radius:18px;background:#f8fafb;color:var(--ink);cursor:pointer}.avatar-button--selected{border-color:var(--accent);background:var(--accent-soft)}.avatar-art{width:58px;height:58px}
  .first-play-launches{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:8px}.first-play-launch{min-height:96px;border:2px solid var(--line);border-radius:18px;background:#fff;color:var(--ink);font:inherit;font-weight:900}.first-play-launch span{display:block;font-size:2rem}
  .catalog-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.catalog-card{display:flex;flex-direction:column;padding:14px}.catalog-card--goal{background:#f7f2ff}.catalog-card--chapter{background:#eef9f4}.catalog-card--learn-about{background:#fff8e9}.catalog-card--phonics{background:#eefaff}.catalog-card__topline{display:flex;justify-content:space-between}.access-badge,.prototype-badge{font-size:.6rem;font-weight:950}.access-badge{color:var(--good)}.prototype-badge{color:var(--try)}.catalog-card h2{margin:10px 0 6px;font-size:1rem}.catalog-card p{margin:0 0 8px;font-size:.8rem}.profile-ref{margin-top:auto;font-size:.64rem;font-weight:800}.primary-action{min-height:48px;margin-top:10px;border:0;border-radius:14px;background:var(--accent);color:#fff;font:inherit;font-weight:900;cursor:pointer}
  @media(max-width:650px){.home-viewport{gap:5px}.catalog-grid{grid-template-columns:1fr}.avatar-picker{grid-template-columns:repeat(2,1fr)}.discovery-book-launch{right:7px;bottom:7px}}
</style>
