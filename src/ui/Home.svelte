<script lang="ts">
  import type { CatalogEntry, GoalReadinessSummary } from '../content';
  import Avatar from '../presentation/Avatar.svelte';
  import Scene from '../presentation/Scene.svelte';
  import { resolveDashboardSceneId } from '../presentation/questionScene';
  import type {
    AvatarId,
    ChildSettings,
    ProgressSummary,
    TopicProgressStatus
  } from '../runtime/localProgress';
  import type { MockTrendSummary, StoredMockCheckpoint } from '../runtime/mockPersistence';

  let {
    child,
    catalog,
    progress,
    goalReadiness,
    resumableMock,
    mockTrends,
    onChildChange,
    onStart,
    onResumeMock
  }: {
    child: ChildSettings;
    catalog: CatalogEntry[];
    progress: ProgressSummary;
    goalReadiness: GoalReadinessSummary | null;
    resumableMock: StoredMockCheckpoint | null;
    mockTrends: MockTrendSummary[];
    onChildChange: (settings: ChildSettings) => void;
    onStart: (entryId: string) => void;
    onResumeMock: () => void;
  } = $props();

  const avatars: Array<{ id: AvatarId; label: string }> = [
    { id: 'fox', label: 'Fox' },
    { id: 'owl', label: 'Owl' },
    { id: 'panda', label: 'Panda' },
    { id: 'tiger', label: 'Tiger' }
  ];

  const defaultMapTopics = new Set(['animals', 'plants', 'human', 'food']);
  let visibleTopics = $derived(
    progress.topics.filter((topic) => topic.practicedKnowledge > 0 || defaultMapTopics.has(topic.id))
  );
  let motionTopic = $derived(
    [...progress.recommendedTopics, ...visibleTopics].find((topic) => Boolean(resolveDashboardSceneId(topic.id)))
  );
  let dashboardSceneId = $derived(resolveDashboardSceneId(motionTopic?.id) ?? 'scene.dog.happy-bone');

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
</script>

<main class="home-shell">
  <header class="home-hero">
    <div>
      <div class="brand">Kidsplay</div>
      <h1>Learn as you play</h1>
      <p>Pick a child, then explore freely or follow a learning goal.</p>
    </div>
    <div class="home-hero__spark" aria-hidden="true">
      <Avatar avatar={child.avatar} mood="celebrate" motion="bounce" />
    </div>
  </header>

  <section class="child-panel" aria-labelledby="child-heading">
    <div class="section-heading">
      <div>
        <span class="eyebrow">PLAYER</span>
        <h2 id="child-heading">Who is playing?</h2>
      </div>
      <span class="saved-note">Saved on this device</span>
    </div>

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
  </section>

  <section class="progress-strip" aria-label="Learning progress">
    <div>
      <strong>{progress.totalAttempts}</strong>
      <span>attempts</span>
    </div>
    <div>
      <strong>{progress.practicedKnowledge}</strong>
      <span>facts practised</span>
    </div>
    <div>
      <strong>{progress.masteredKnowledge}</strong>
      <span>facts strong</span>
    </div>
    <div>
      <strong>{progress.accuracy === null ? '—' : `${Math.round(progress.accuracy * 100)}%`}</strong>
      <span>accuracy</span>
    </div>
  </section>

  <section class="motion-preview" aria-labelledby="motion-preview-heading">
    <div class="motion-preview__copy">
      <span class="eyebrow">MOTION MOMENT</span>
      <h2 id="motion-preview-heading">See an idea move</h2>
      <p>
        {motionTopic
          ? `A tiny animated cue for ${motionTopic.label}. The same lightweight scene can be reused inside matching questions.`
          : 'A tiny animated science cue. These reusable scenes also appear inside matching questions.'}
      </p>
    </div>
    <div class="motion-preview__scene">
      <Scene sceneId={dashboardSceneId} />
    </div>
  </section>

  <section class="topic-progress-panel" aria-labelledby="topic-progress-heading">
    <div class="section-heading">
      <div>
        <span class="eyebrow">LEARNING MAP</span>
        <h2 id="topic-progress-heading">How each topic is going</h2>
      </div>
      <span class="saved-note">Based on practice on this device</span>
    </div>

    {#if progress.recommendedTopics.length > 0}
      <div class="section-heading" aria-label="Recommended next topics">
        <div>
          <span class="eyebrow">NEXT FOCUS</span>
          <h3>{progress.recommendedTopics.map((topic) => topic.label).join(' · ')}</h3>
        </div>
        <span class="saved-note">Weak first, then new topics</span>
      </div>
    {/if}

    <div class="topic-progress-grid">
      {#each visibleTopics as topic}
        <article class="topic-progress-card" data-status={topic.status}>
          <div class="topic-progress-card__topline">
            <h3>{topic.label}</h3>
            <span class="topic-status">{topicStatusLabels[topic.status]}</span>
          </div>
          <strong class="topic-score">
            {topic.accuracy === null ? '—' : `${Math.round(topic.accuracy * 100)}%`}
          </strong>
          <span class="topic-meta">
            {topic.practicedKnowledge} practised · {topic.strongKnowledge} strong
          </span>
        </article>
      {/each}
    </div>
  </section>

  {#if goalReadiness}
    <section class="child-panel" aria-labelledby="readiness-heading">
      <div class="section-heading">
        <div>
          <span class="eyebrow">GOAL READINESS</span>
          <h2 id="readiness-heading">Olympiad practice signal</h2>
        </div>
        <span class="saved-note">{readinessStatusLabels[goalReadiness.status]}</span>
      </div>

      <div class="progress-strip" aria-label="Olympiad practice readiness">
        <div>
          <strong>{goalReadiness.score}%</strong>
          <span>practice readiness</span>
        </div>
        <div>
          <strong>{goalReadiness.practicedRows}</strong>
          <span>facts across {goalReadiness.practicedGroups}/{goalReadiness.totalGroups} topic groups</span>
        </div>
        <div>
          <strong>{goalReadiness.readyRows}</strong>
          <span>facts meeting goal policy</span>
        </div>
        <div>
          <strong>{goalReadiness.accuracy === null ? '—' : `${Math.round(goalReadiness.accuracy * 100)}%`}</strong>
          <span>profile-practice accuracy</span>
        </div>
      </div>
      <p class="saved-note">
        This local practice signal rewards breadth, repeated evidence and accuracy. It is not an official SOF score or syllabus certification, and row placement is still prototype-unverified.
      </p>
    </section>
  {/if}

  {#if resumableMock}
    <section class="child-panel" aria-labelledby="resume-mock-heading">
      <div class="section-heading">
        <div>
          <span class="eyebrow">CONTINUE MOCK</span>
          <h2 id="resume-mock-heading">Resume your saved mock</h2>
        </div>
        <span class="saved-note">Saved on this device</span>
      </div>
      <h3>{resumableMock.title}</h3>
      <p class="saved-note">
        {resumableMock.state.responses.length} of {resumableMock.questionIds.length} answered · your exact question order is preserved.
      </p>
      <button class="catalog-action" type="button" onclick={onResumeMock}>Resume saved mock</button>
    </section>
  {/if}

  {#if mockTrends.length > 0}
    <section class="topic-progress-panel" aria-labelledby="mock-history-heading">
      <div class="section-heading">
        <div>
          <span class="eyebrow">MOCK HISTORY</span>
          <h2 id="mock-history-heading">How mock practice is moving</h2>
        </div>
        <span class="saved-note">Last {Math.min(20, mockTrends.reduce((sum, trend) => sum + trend.attempts, 0))} saved results</span>
      </div>

      <div class="topic-progress-grid">
        {#each mockTrends as trend}
          <article class="topic-progress-card">
            <div class="topic-progress-card__topline">
              <h3>{trend.title}</h3>
              <span class="topic-status">{trend.attempts} {trend.attempts === 1 ? 'attempt' : 'attempts'}</span>
            </div>
            <strong class="topic-score">{trend.latestEarnedMarks} / {trend.latestMaxMarks}</strong>
            <span class="topic-meta">
              Latest {Math.round(trend.latestPercent * 100)}% · best {Math.round(trend.bestPercent * 100)}%
            </span>
            <span class="topic-meta">
              {trend.deltaPoints === null
                ? 'First saved result'
                : `${trend.deltaPoints >= 0 ? '+' : ''}${trend.deltaPoints} points vs previous`}
            </span>
            {#if trend.latestSections.length > 0}
              <small class="saved-note">
                {trend.latestSections.map((section) => `${section.title} ${section.earnedMarks}/${section.maxMarks}`).join(' · ')}
              </small>
            {/if}
          </article>
        {/each}
      </div>
    </section>
  {/if}

  <section class="catalog-section" aria-labelledby="catalog-heading">
    <div class="section-heading">
      <div>
        <span class="eyebrow">PLAY & LEARN</span>
        <h2 id="catalog-heading">Choose what to do</h2>
      </div>
    </div>

    <div class="catalog-grid">
      {#each catalog as entry}
        <article class:catalog-card--goal={entry.kind === 'goal_learning'} class="catalog-card">
          <div class="catalog-card__topline">
            <span class:access-badge--goal={entry.kind === 'goal_learning'} class="access-badge">
              {entry.kind === 'free_explore' ? 'FREE EXPLORE' : 'GOAL PROGRAM'}
            </span>
            {#if entry.status === 'prototype'}
              <span class="prototype-badge">Prototype</span>
            {/if}
          </div>

          <h3>{entry.title}</h3>
          <p>{entry.description}</p>

          {#if entry.profileRef}
            <div class="profile-ref">Profile: {entry.profileRef}</div>
          {/if}

          <button class="catalog-action" type="button" onclick={() => onStart(entry.id)}>
            {entry.actionLabel}
          </button>
        </article>
      {/each}
    </div>
  </section>
</main>