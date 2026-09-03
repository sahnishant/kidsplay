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

  type ChildPrimaryView = 'world' | 'practice';
  type GrownUpView = 'progress' | 'goals' | 'programmes';
  type HomeView = ChildPrimaryView | GrownUpView | 'player';

  let {
    child, catalog, progress, goalReadiness, resumableMock, mockTrends, storyProgress,
    onChildChange, onStart, onStartMission, onExploreLocation, onResumeMock
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
    { id: 'fox', label: 'Fox' }, { id: 'owl', label: 'Owl' },
    { id: 'panda', label: 'Panda' }, { id: 'tiger', label: 'Tiger' }
  ];
  const storyLocations = getStoryLocations();
  const storyMissions = getStoryMissions();

  let view = $state<HomeView>('world');
  let releaseViewBack: (() => void) | null = null;
  let displayName = $derived(child.name.trim() || 'Dheu');
  let storyStars = $derived(storyStarTotal(storyProgress));
  let currentLevel = $derived(currentStoryLocation(storyLocations, storyMissions, storyProgress, progress.recommendedTopics)?.progression.level ?? null);
  let patternMockEntryId = $derived(catalog.find((entry) => entry.actionLabel === 'Try 35-question mock')?.id ?? null);
  let freeExploreEntries = $derived(catalog.filter((entry) => entry.kind === 'free_explore'));
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
    <ChildHud {child} {displayName} stars={storyStars} {currentLevel} onOpenPlayer={() => openView('player')} />
    <div class="home-viewport__stage">
      <StoryWorldViewport childName={child.name} childAvatar={child.avatar} {storyProgress}
        recommendedTopics={progress.recommendedTopics} topicProgress={progress.topics}
        {onStartMission} {onExploreLocation} />
    </div>
    <HomeBottomNav active="world" onOpen={(next: ChildPrimaryView) => openView(next)} />
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
        <nav class="grown-up-nav" aria-label="Grown-up sections">
          <button type="button" class:grown-up-nav__active={view === 'progress'} onclick={() => openView('progress')}>Progress</button>
          <button type="button" class:grown-up-nav__active={view === 'goals'} onclick={() => openView('goals')}>Assessment</button>
          <button type="button" class:grown-up-nav__active={view === 'programmes'} onclick={() => openView('programmes')}>Programmes</button>
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

            <aside class="grown-up-entry" aria-label="Grown-up area entry">
              <div><strong>For grown-ups</strong><span>Progress numbers, assessment mocks and curriculum/profile details live here.</span></div>
              <button type="button" onclick={() => openView('progress')} aria-label="Open grown-up area">Grown-up area</button>
            </aside>
          </section>
        {:else if view === 'progress'}
          <ProgressViewport {progress} />
        {:else if view === 'goals'}
          <GoalsViewport {goalReadiness} {resumableMock} {mockTrends} {onResumeMock} onStartMock={patternMockEntryId ? startPatternMock : undefined} />
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
          <section class="catalog-grid" aria-label="Play activities">
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
        <HomeBottomNav active="practice" onOpen={(next: ChildPrimaryView) => openView(next)} />
      {/if}
    </section>
  {/if}
</main>

<style>
  .home-viewport{width:min(960px,100%);height:calc(100dvh - 42px);margin:auto;display:grid;grid-template-rows:auto minmax(0,1fr) auto;gap:7px;overflow:hidden}
  .home-viewport__stage,.home-panel-screen,.home-panel-body{min-height:0}.home-viewport__stage,.home-panel-screen{overflow:hidden}.home-panel-screen{grid-row:1/-1;display:flex;flex-direction:column;gap:7px}
  .panel-topbar{min-height:50px;display:flex;align-items:center;gap:8px;padding:4px 8px;border:1px solid #24303a14;border-radius:15px;background:#fffffff2}.panel-back{width:40px;height:40px;flex:none;border:0;border-radius:12px;background:var(--accent-soft);color:var(--accent);font-size:1.1rem;font-weight:950;cursor:pointer}.eyebrow{color:var(--accent);font-size:.57rem;font-weight:950;letter-spacing:.08em}.panel-topbar h1{margin:1px 0 0;font-size:clamp(1rem,3.5vw,1.25rem);line-height:1}
  .grown-up-nav{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding:4px;border:1px solid #24303a14;border-radius:14px;background:#fffffff2}.grown-up-nav button{min-height:40px;border:0;border-radius:10px;background:transparent;color:var(--muted);font:inherit;font-size:.72rem;font-weight:900;cursor:pointer}.grown-up-nav__active{background:var(--accent-soft)!important;color:var(--accent)!important}
  .home-panel-body{min-height:0;flex:1;overflow:auto;padding:1px 2px 5px}.home-panel-body--fixed{overflow:hidden;padding:0}.panel-card,.catalog-card{border:1px solid #24303a17;border-radius:18px;background:#fffffff0}.panel-card{padding:16px}.panel-note,.catalog-card p,.profile-ref{color:var(--muted)}
  .name-field{display:grid;gap:6px}.name-field span{font-size:.76rem;font-weight:800}.name-field input{min-height:50px;padding:9px 12px;border:2px solid var(--line);border-radius:14px;font:inherit;font-weight:800}.avatar-picker{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin-top:12px}.avatar-button{min-height:100px;display:grid;place-items:center;padding:7px;border:2px solid #e3e8eb;border-radius:18px;background:#f8fafb;color:var(--ink);cursor:pointer}.avatar-button--selected{border-color:var(--accent);background:var(--accent-soft)}.avatar-art{width:58px;height:58px}
  .grown-up-entry{margin-top:12px;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 12px;border:1px dashed #24303a2b;border-radius:14px;background:#f8fafb}.grown-up-entry div{display:grid;gap:2px}.grown-up-entry strong{font-size:.78rem}.grown-up-entry span{color:var(--muted);font-size:.63rem;line-height:1.3}.grown-up-entry button{min-height:44px;flex:none;padding:7px 12px;border:0;border-radius:12px;background:#e9edf0;color:var(--ink);font:inherit;font-size:.7rem;font-weight:900;cursor:pointer}
  .catalog-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.catalog-card{display:flex;flex-direction:column;padding:14px}.catalog-card--goal{background:#f7f2ff}.catalog-card__topline{display:flex;justify-content:space-between}.access-badge,.prototype-badge{font-size:.6rem;font-weight:950}.access-badge{color:var(--good)}.prototype-badge{color:var(--try)}.catalog-card h2{margin:10px 0 6px;font-size:1rem}.catalog-card p{margin:0 0 8px;font-size:.8rem}.profile-ref{margin-top:auto;font-size:.64rem;font-weight:800}.primary-action{min-height:48px;margin-top:10px;border:0;border-radius:14px;background:var(--accent);color:#fff;font:inherit;font-weight:900;cursor:pointer}
  @media(max-width:650px){.home-viewport{gap:5px}.catalog-grid{grid-template-columns:1fr}.avatar-picker{grid-template-columns:repeat(2,1fr)}.grown-up-entry{align-items:stretch}.grown-up-entry button{align-self:center}}
  @media(max-width:420px){.grown-up-entry{display:grid}.grown-up-entry button{width:100%}.grown-up-nav button{font-size:.66rem}}
</style>