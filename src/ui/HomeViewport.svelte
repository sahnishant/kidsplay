<script lang="ts">
  import { onDestroy } from 'svelte';
  import type { CatalogEntry, GoalReadinessSummary } from '../content';
  import Avatar from '../presentation/Avatar.svelte';
  import { pushAppBackLayer, requestAppBack } from '../runtime/appNavigation';
  import type { AvatarId, ChildSettings, ProgressSummary } from '../runtime/localProgress';
  import type { MockTrendSummary, StoredMockCheckpoint } from '../runtime/mockPersistence';
  import { getStoryLocations, getStoryMissions } from '../story/storyDirector';
  import { currentStoryLocation } from '../story/storyPresentation';
  import { storyStarTotal, type StoryProgressSnapshot } from '../story/storyProgress';
  import ChildHud from './home/ChildHud.svelte';
  import GoalsViewport from './home/GoalsViewport.svelte';
  import HomeBottomNav from './home/HomeBottomNav.svelte';
  import ProgressViewport from './home/ProgressViewport.svelte';
  import StoryWorldViewport from './StoryWorldViewport.svelte';

  type HomePrimaryView = 'world' | 'progress' | 'practice' | 'goals';
  type HomeView = HomePrimaryView | 'player';

  let {
    child,
    catalog,
    progress,
    goalReadiness,
    resumableMock,
    mockTrends,
    storyProgress,
    onChildChange,
    onStart,
    onStartMission,
    onExploreLocation,
    onResumeMock
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
  } = $props();

  const avatars: Array<{ id: AvatarId; label: string }> = [
    { id: 'fox', label: 'Fox' },
    { id: 'owl', label: 'Owl' },
    { id: 'panda', label: 'Panda' },
    { id: 'tiger', label: 'Tiger' }
  ];
  const storyLocations = getStoryLocations();
  const storyMissions = getStoryMissions();

  let view = $state<HomeView>('world');
  let releaseViewBack: (() => void) | null = null;
  let displayName = $derived(child.name.trim() || 'Dheu');
  let storyStars = $derived(storyStarTotal(storyProgress));
  let currentLevel = $derived(
    currentStoryLocation(storyLocations, storyMissions, storyProgress, progress.recommendedTopics)?.progression.level ?? null
  );

  function updateName(event: Event): void {
    const input = event.currentTarget as HTMLInputElement;
    onChildChange({ ...child, name: input.value });
  }

  function closeViewFromBack(): void {
    view = 'world';
    releaseViewBack = null;
  }

  function openView(next: HomeView): void {
    if (next === view) return;
    if (next === 'world') {
      requestAppBack(closeViewFromBack);
      return;
    }
    releaseViewBack?.();
    view = next;
    releaseViewBack = pushAppBackLayer(`home:${next}`, closeViewFromBack);
  }

  function requestWorld(): void {
    requestAppBack(closeViewFromBack);
  }

  onDestroy(() => releaseViewBack?.());
</script>

<main class="home-viewport" data-home-view={view}>
  {#if view === 'world'}
    <ChildHud
      {child}
      {displayName}
      stars={storyStars}
      {currentLevel}
      onOpenPlayer={() => openView('player')}
    />

    <div class="home-viewport__stage">
      <StoryWorldViewport
        childName={child.name}
        childAvatar={child.avatar}
        {storyProgress}
        recommendedTopics={progress.recommendedTopics}
        topicProgress={progress.topics}
        {onStartMission}
        {onExploreLocation}
      />
    </div>

    <HomeBottomNav active="world" onOpen={(next: HomePrimaryView) => openView(next)} />
  {:else}
    <section class="home-panel-screen" aria-label={`${view} screen`}>
      <header class="panel-topbar">
        <button class="panel-back" type="button" onclick={requestWorld} aria-label="Back to Dheu's world">←</button>
        <div class="panel-topbar__copy">
          <span class="eyebrow">{view === 'progress' ? 'MY PROGRESS' : view === 'goals' ? 'MY GOAL' : view.toUpperCase()}</span>
          <h1>
            {view === 'player'
              ? 'Who is playing?'
              : view === 'progress'
                ? 'Learning progress'
                : view === 'goals'
                  ? 'Goal learning'
                  : 'Choose a practice adventure'}
          </h1>
        </div>
      </header>

      <div class:home-panel-body--fixed={view === 'progress' || view === 'goals'} class="home-panel-body">
        {#if view === 'player'}
          <section class="panel-card player-panel">
            <label class="name-field">
              <span>Child name</span>
              <input
                type="text"
                maxlength="24"
                value={child.name}
                placeholder="e.g. Dheu"
                oninput={updateName}
                autocomplete="off"
              />
            </label>

            <div class="avatar-picker" role="group" aria-label="Choose an avatar">
              {#each avatars as avatar}
                <button
                  type="button"
                  class:avatar-button--selected={child.avatar === avatar.id}
                  class="avatar-button"
                  aria-pressed={child.avatar === avatar.id}
                  onclick={() => onChildChange({ ...child, avatar: avatar.id })}
                >
                  <span class="avatar-art" aria-hidden="true">
                    <Avatar avatar={avatar.id} motion={child.avatar === avatar.id ? 'bounce' : 'idle'} />
                  </span>
                  <small>{avatar.label}</small>
                </button>
              {/each}
            </div>
            <p class="panel-note">Player choices are saved on this device.</p>
          </section>
        {:else if view === 'progress'}
          <ProgressViewport {progress} />
        {:else if view === 'goals'}
          <GoalsViewport {goalReadiness} {resumableMock} {mockTrends} {onResumeMock} />
        {:else if view === 'practice'}
          <section class="catalog-grid" aria-label="Practice and goal programmes">
            {#each catalog as entry}
              <article class:catalog-card--goal={entry.kind === 'goal_learning'} class="catalog-card">
                <div class="catalog-card__topline">
                  <span class="access-badge">{entry.kind === 'free_explore' ? 'FREE EXPLORE' : 'GOAL PROGRAM'}</span>
                  {#if entry.status === 'prototype'}<span class="prototype-badge">Prototype</span>{/if}
                </div>
                <h2>{entry.title}</h2>
                <p>{entry.description}</p>
                {#if entry.profileRef}<small class="profile-ref">Profile: {entry.profileRef}</small>{/if}
                <button class="primary-action" type="button" onclick={() => onStart(entry.id)}>{entry.actionLabel}</button>
              </article>
            {/each}
          </section>
        {/if}
      </div>
    </section>
  {/if}
</main>

<style>
  .home-viewport {
    width: min(960px,100%);
    height: calc(100dvh - 42px);
    max-height: calc(100dvh - 42px);
    margin: 0 auto;
    display: grid;
    grid-template-rows: auto minmax(0,1fr) auto;
    gap: 8px;
    overflow: hidden;
  }

  .home-viewport__stage { min-width:0; min-height:0; overflow:hidden; }

  .home-panel-screen {
    grid-row: 1 / -1;
    min-height:0;
    display:grid;
    grid-template-rows:auto minmax(0,1fr);
    gap:8px;
    overflow:hidden;
  }

  .panel-topbar {
    min-width:0;
    min-height:52px;
    display:flex;
    align-items:center;
    gap:9px;
    padding:5px 9px;
    border:1px solid rgba(36,48,58,.08);
    border-radius:16px;
    background:rgba(255,255,255,.92);
  }
  .panel-back { width:42px; height:42px; flex:0 0 auto; border:0; border-radius:13px; background:var(--accent-soft); color:var(--accent); font-size:1.15rem; font-weight:950; cursor:pointer; }
  .panel-topbar__copy { min-width:0; }
  .eyebrow { color:var(--accent); font-size:.58rem; font-weight:950; letter-spacing:.09em; }
  .panel-topbar h1 { margin:1px 0 0; font-size:clamp(1rem,3.5vw,1.3rem); line-height:1; }

  .home-panel-body { min-height:0; overflow:auto; overscroll-behavior:contain; padding:1px 2px 6px; scrollbar-gutter:stable; }
  .home-panel-body--fixed { overflow:hidden; padding:0; }

  .panel-card,.catalog-card { border:1px solid rgba(36,48,58,.09); border-radius:20px; background:rgba(255,255,255,.94); }
  .panel-card { padding:18px; }
  .panel-note { color:var(--muted); font-size:.78rem; line-height:1.4; font-weight:650; }

  .name-field { display:grid; gap:7px; }
  .name-field > span { color:var(--muted); font-size:.8rem; font-weight:800; }
  .name-field input { width:100%; min-height:52px; padding:10px 14px; border:2px solid var(--line); border-radius:16px; background:#fff; color:var(--ink); font:inherit; font-size:1.05rem; font-weight:800; }
  .avatar-picker { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:10px; margin-top:14px; }
  .avatar-button { min-height:108px; display:grid; place-items:center; gap:2px; padding:8px; border:2px solid #e3e8eb; border-radius:20px; background:#f8fafb; color:var(--ink); cursor:pointer; }
  .avatar-button--selected { border-color:var(--accent); background:var(--accent-soft); }
  .avatar-art { width:62px; height:62px; }
  .avatar-button small { font-weight:850; }

  .catalog-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }
  .catalog-card { min-width:0; display:flex; flex-direction:column; padding:16px; }
  .catalog-card--goal { background:linear-gradient(160deg,#f6f2ff,#fff7e8); }
  .catalog-card__topline { display:flex; justify-content:space-between; gap:8px; }
  .access-badge,.prototype-badge { font-size:.64rem; font-weight:950; }
  .access-badge { color:var(--good); }
  .prototype-badge { color:var(--try); }
  .catalog-card h2 { margin:12px 0 7px; font-size:1.05rem; }
  .catalog-card p { margin:0 0 10px; color:var(--muted); font-size:.84rem; font-weight:650; line-height:1.4; }
  .profile-ref { margin-top:auto; color:var(--muted); font-size:.68rem; font-weight:800; overflow-wrap:anywhere; }
  .primary-action { width:100%; min-height:50px; margin-top:12px; padding:11px 14px; border:0; border-radius:15px; background:var(--accent); color:#fff; font:inherit; font-weight:900; cursor:pointer; }

  @media (max-width:650px) {
    .home-viewport { gap:6px; }
    .catalog-grid { grid-template-columns:1fr; }
    .avatar-picker { grid-template-columns:repeat(2,minmax(0,1fr)); }
  }

  @media (max-width:430px) {
    .home-viewport { height:calc(100dvh - 42px); max-height:calc(100dvh - 42px); gap:5px; }
    .panel-topbar { min-height:46px; padding:3px 6px; }
    .panel-back { width:38px; height:38px; }
  }
</style>