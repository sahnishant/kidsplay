<script lang="ts">
  import type { CatalogEntry, GoalReadinessSummary } from '../content';
  import Avatar from '../presentation/Avatar.svelte';
  import type {
    AvatarId,
    ChildSettings,
    ProgressSummary,
    TopicProgressStatus
  } from '../runtime/localProgress';
  import type { MockTrendSummary, StoredMockCheckpoint } from '../runtime/mockPersistence';
  import type { StoryProgressSnapshot } from '../story/storyProgress';
  import StoryWorldViewport from './StoryWorldViewport.svelte';

  type HomeView = 'world' | 'player' | 'progress' | 'goals' | 'practice';

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

  const defaultMapTopics = new Set(['animals', 'plants', 'human', 'food']);
  let view = $state<HomeView>('world');
  let visibleTopics = $derived(
    progress.topics.filter((topic) => topic.practicedKnowledge > 0 || defaultMapTopics.has(topic.id))
  );
  let displayName = $derived(child.name.trim() || 'Dheu');

  const topicStatusLabels: Record<TopicProgressStatus, string> = {
    not_started: 'Not started',
    needs_practice: 'Practise next',
    growing: 'Growing',
    strong: 'Strong so far'
  };

  const readinessStatusLabels = {
    getting_started: 'Getting started',
    building: 'Building toward a mock',
    mock_ready: 'Ready to try a mixed mock'
  } as const;

  function updateName(event: Event): void {
    const input = event.currentTarget as HTMLInputElement;
    onChildChange({ ...child, name: input.value });
  }

  function openView(next: HomeView): void {
    view = next;
  }
</script>

<main class="home-viewport" data-home-view={view}>
  {#if view === 'world'}
    <header class="home-topbar">
      <div class="home-topbar__identity">
        <span class="home-avatar" aria-hidden="true">
          <Avatar avatar={child.avatar} mood="happy" motion="idle" />
        </span>
        <div>
          <div class="brand">Kidsplay</div>
          <h1>{displayName}'s science world</h1>
        </div>
      </div>
      <div class="home-topbar__stats" aria-label="Current learning summary">
        <span><strong>{progress.masteredKnowledge}</strong> strong</span>
        <span><strong>{progress.totalAttempts}</strong> tries</span>
      </div>
    </header>

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

    <nav class="home-nav" aria-label="Kidsplay areas">
      <button type="button" onclick={() => openView('player')} aria-label="Open player settings">
        <span aria-hidden="true">🦊</span><small>Player</small>
      </button>
      <button type="button" onclick={() => openView('progress')} aria-label="Open learning progress">
        <span aria-hidden="true">⭐</span><small>Progress</small>
      </button>
      <button type="button" onclick={() => openView('practice')} aria-label="Open practice activities">
        <span aria-hidden="true">🎯</span><small>Practice</small>
      </button>
      <button type="button" onclick={() => openView('goals')} aria-label="Open goal learning">
        <span aria-hidden="true">🏆</span><small>Goals</small>
      </button>
    </nav>
  {:else}
    <section class="home-panel-screen" aria-label={`${view} screen`}>
      <header class="panel-topbar">
        <button class="panel-back" type="button" onclick={() => openView('world')} aria-label="Back to Dheu's world">←</button>
        <div>
          <span class="eyebrow">{view.toUpperCase()}</span>
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

      <div class="home-panel-scroll">
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
          <section class="summary-grid" aria-label="Learning progress summary">
            <article><strong>{progress.totalAttempts}</strong><span>attempts</span></article>
            <article><strong>{progress.practicedKnowledge}</strong><span>facts practised</span></article>
            <article><strong>{progress.masteredKnowledge}</strong><span>facts strong</span></article>
            <article><strong>{progress.accuracy === null ? '—' : `${Math.round(progress.accuracy * 100)}%`}</strong><span>accuracy</span></article>
          </section>

          {#if progress.recommendedTopics.length > 0}
            <section class="panel-card next-focus">
              <span class="eyebrow">NEXT FOCUS</span>
              <h2>{progress.recommendedTopics.map((topic) => topic.label).join(' · ')}</h2>
              <p>Weak first, then new topics.</p>
            </section>
          {/if}

          <section class="topic-grid" aria-label="Topic progress">
            {#each visibleTopics as topic}
              <article class="topic-card" data-status={topic.status}>
                <div><h2>{topic.label}</h2><span>{topicStatusLabels[topic.status]}</span></div>
                <strong>{topic.accuracy === null ? '—' : `${Math.round(topic.accuracy * 100)}%`}</strong>
                <small>{topic.practicedKnowledge} practised · {topic.strongKnowledge} strong</small>
              </article>
            {/each}
          </section>
        {:else if view === 'goals'}
          {#if goalReadiness}
            <section class="panel-card readiness-card">
              <div class="panel-card__headline">
                <div><span class="eyebrow">OLYMPIAD PRACTICE SIGNAL</span><h2>{goalReadiness.score}% ready</h2></div>
                <span>{readinessStatusLabels[goalReadiness.status]}</span>
              </div>
              <div class="summary-grid summary-grid--inside">
                <article><strong>{goalReadiness.practicedRows}</strong><span>facts tried</span></article>
                <article><strong>{goalReadiness.readyRows}</strong><span>goal-ready facts</span></article>
                <article><strong>{goalReadiness.practicedGroups}/{goalReadiness.totalGroups}</strong><span>topic groups</span></article>
                <article><strong>{goalReadiness.accuracy === null ? '—' : `${Math.round(goalReadiness.accuracy * 100)}%`}</strong><span>accuracy</span></article>
              </div>
              <p class="panel-note">This is a local practice signal, not an official SOF score or syllabus certification.</p>
            </section>
          {/if}

          {#if resumableMock}
            <section class="panel-card">
              <span class="eyebrow">CONTINUE MOCK</span>
              <h2>Resume your saved mock</h2>
              <p>{resumableMock.title}</p>
              <p class="panel-note">{resumableMock.state.responses.length} of {resumableMock.questionIds.length} answered · your exact question order is preserved.</p>
              <button class="primary-action" type="button" onclick={onResumeMock}>Resume saved mock</button>
            </section>
          {/if}

          {#if mockTrends.length > 0}
            <section class="panel-card">
              <span class="eyebrow">MOCK HISTORY</span>
              <h2>How mock practice is moving</h2>
              <div class="history-list">
                {#each mockTrends as trend}
                  <article>
                    <div><strong>{trend.title}</strong><span>{trend.attempts} {trend.attempts === 1 ? 'attempt' : 'attempts'}</span></div>
                    <b>{trend.latestEarnedMarks} / {trend.latestMaxMarks}</b>
                    <small>Latest {Math.round(trend.latestPercent * 100)}% · best {Math.round(trend.bestPercent * 100)}%</small>
                    {#if trend.latestSections.length > 0}
                      <small>{trend.latestSections.map((section) => `${section.title} ${section.earnedMarks}/${section.maxMarks}`).join(' · ')}</small>
                    {/if}
                  </article>
                {/each}
              </div>
            </section>
          {/if}
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
    width: min(960px, 100%);
    height: calc(100dvh - 42px);
    max-height: calc(100dvh - 42px);
    margin: 0 auto;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto;
    gap: 10px;
    overflow: hidden;
  }

  .home-topbar,
  .panel-topbar {
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 14px;
    border: 1px solid rgba(36, 48, 58, 0.08);
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.9);
  }

  .home-topbar__identity {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .home-avatar {
    flex: 0 0 auto;
    width: 48px;
    height: 48px;
  }

  .home-topbar h1,
  .panel-topbar h1 {
    margin: 1px 0 0;
    font-size: clamp(1.1rem, 4vw, 1.55rem);
    line-height: 1.05;
  }

  .home-topbar__stats {
    flex: 0 0 auto;
    display: flex;
    gap: 8px;
    color: var(--muted);
    font-size: .72rem;
    font-weight: 750;
  }

  .home-topbar__stats span {
    display: grid;
    justify-items: center;
  }

  .home-topbar__stats strong {
    color: var(--ink);
    font-size: 1rem;
  }

  .home-viewport__stage {
    min-width: 0;
    min-height: 0;
    overflow: hidden;
  }

  .home-nav {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px;
  }

  .home-nav button {
    min-width: 0;
    min-height: 54px;
    display: grid;
    grid-template-columns: auto auto;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 7px 8px;
    border: 1px solid rgba(36, 48, 58, .1);
    border-radius: 16px;
    background: rgba(255, 255, 255, .94);
    color: var(--ink);
    cursor: pointer;
  }

  .home-nav button > span { font-size: 1.05rem; }
  .home-nav small { font-weight: 850; }

  .home-panel-screen {
    grid-row: 1 / -1;
    min-height: 0;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    gap: 10px;
  }

  .panel-topbar { justify-content: flex-start; }

  .panel-back {
    flex: 0 0 auto;
    width: 46px;
    height: 46px;
    border: 0;
    border-radius: 14px;
    background: var(--accent-soft);
    color: var(--accent);
    font-size: 1.25rem;
    font-weight: 950;
    cursor: pointer;
  }

  .eyebrow {
    color: var(--accent);
    font-size: .68rem;
    font-weight: 950;
    letter-spacing: .09em;
  }

  .home-panel-scroll {
    min-height: 0;
    overflow: auto;
    overscroll-behavior: contain;
    padding: 2px 2px 8px;
    scrollbar-gutter: stable;
  }

  .panel-card,
  .catalog-card,
  .topic-card,
  .summary-grid > article {
    border: 1px solid rgba(36, 48, 58, .09);
    border-radius: 20px;
    background: rgba(255,255,255,.94);
  }

  .panel-card { padding: 18px; }
  .panel-card + .panel-card { margin-top: 12px; }
  .panel-card h2 { margin: 5px 0 8px; }
  .panel-card p { color: var(--muted); font-weight: 650; }
  .panel-note { font-size: .78rem; line-height: 1.4; }

  .name-field { display: grid; gap: 7px; }
  .name-field > span { color: var(--muted); font-size: .8rem; font-weight: 800; }
  .name-field input {
    width: 100%;
    min-height: 52px;
    padding: 10px 14px;
    border: 2px solid var(--line);
    border-radius: 16px;
    background: #fff;
    color: var(--ink);
    font: inherit;
    font-size: 1.05rem;
    font-weight: 800;
  }

  .avatar-picker {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
    margin-top: 14px;
  }

  .avatar-button {
    min-height: 108px;
    display: grid;
    place-items: center;
    gap: 2px;
    padding: 8px;
    border: 2px solid #e3e8eb;
    border-radius: 20px;
    background: #f8fafb;
    color: var(--ink);
    cursor: pointer;
  }

  .avatar-button--selected { border-color: var(--accent); background: var(--accent-soft); }
  .avatar-art { width: 62px; height: 62px; }
  .avatar-button small { font-weight: 850; }

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
    margin-bottom: 12px;
  }

  .summary-grid > article {
    min-width: 0;
    display: grid;
    gap: 3px;
    padding: 15px 10px;
    text-align: center;
  }

  .summary-grid strong { font-size: 1.35rem; }
  .summary-grid span { color: var(--muted); font-size: .72rem; font-weight: 750; }
  .summary-grid--inside { margin: 14px 0 4px; }

  .next-focus { margin-bottom: 12px; }
  .next-focus p { margin: 0; }

  .topic-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .topic-card { min-width: 0; display: grid; gap: 8px; padding: 14px; }
  .topic-card > div { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
  .topic-card h2 { margin: 0; font-size: .95rem; }
  .topic-card > div span, .topic-card small { color: var(--muted); font-size: .68rem; font-weight: 750; }
  .topic-card > strong { font-size: 1.35rem; }
  .topic-card[data-status='strong'] { background: var(--good-soft); }
  .topic-card[data-status='needs_practice'] { background: var(--try-soft); }

  .panel-card__headline { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; }
  .panel-card__headline > span { color: var(--muted); font-size: .75rem; font-weight: 800; }

  .history-list { display: grid; gap: 8px; }
  .history-list article { display: grid; gap: 4px; padding: 12px; border-radius: 15px; background: #f7f9fa; }
  .history-list article > div { display: flex; justify-content: space-between; gap: 8px; }
  .history-list span, .history-list small { color: var(--muted); font-size: .72rem; font-weight: 700; }

  .catalog-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  .catalog-card { min-width: 0; display: flex; flex-direction: column; padding: 16px; }
  .catalog-card--goal { background: linear-gradient(160deg, #f6f2ff, #fff7e8); }
  .catalog-card__topline { display: flex; justify-content: space-between; gap: 8px; }
  .access-badge, .prototype-badge { font-size: .64rem; font-weight: 950; }
  .access-badge { color: var(--good); }
  .prototype-badge { color: var(--try); }
  .catalog-card h2 { margin: 12px 0 7px; font-size: 1.05rem; }
  .catalog-card p { margin: 0 0 10px; color: var(--muted); font-size: .84rem; font-weight: 650; line-height: 1.4; }
  .profile-ref { margin-top: auto; color: var(--muted); font-size: .68rem; font-weight: 800; overflow-wrap: anywhere; }

  .primary-action {
    width: 100%;
    min-height: 50px;
    margin-top: 12px;
    padding: 11px 14px;
    border: 0;
    border-radius: 15px;
    background: var(--accent);
    color: #fff;
    font: inherit;
    font-weight: 900;
    cursor: pointer;
  }

  @media (max-width: 650px) {
    .home-topbar { padding: 7px 10px; border-radius: 17px; }
    .home-avatar { width: 40px; height: 40px; }
    .home-topbar__stats { gap: 5px; font-size: .62rem; }
    .home-topbar__stats strong { font-size: .85rem; }
    .home-nav button { grid-template-columns: 1fr; gap: 0; min-height: 50px; padding: 5px 4px; }
    .home-nav button > span { font-size: .95rem; }
    .home-nav small { font-size: .66rem; }
    .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .catalog-grid { grid-template-columns: 1fr; }
  }

  @media (max-width: 430px) {
    .home-viewport { height: calc(100dvh - 42px); max-height: calc(100dvh - 42px); gap: 7px; }
    .home-topbar h1 { font-size: 1.02rem; }
    .home-topbar__stats span:last-child { display: none; }
    .panel-topbar { padding: 7px 9px; }
    .panel-back { width: 42px; height: 42px; }
    .avatar-picker { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .topic-grid { grid-template-columns: 1fr; }
  }
</style>
