<script lang="ts">
  import type { CatalogEntry } from '../content';
  import type {
    AvatarId,
    ChildSettings,
    ProgressSummary,
    TopicProgressStatus
  } from '../runtime/localProgress';

  let {
    child,
    catalog,
    progress,
    onChildChange,
    onStart
  }: {
    child: ChildSettings;
    catalog: CatalogEntry[];
    progress: ProgressSummary;
    onChildChange: (settings: ChildSettings) => void;
    onStart: (entryId: string) => void;
  } = $props();

  const avatars: Array<{ id: AvatarId; symbol: string; label: string }> = [
    { id: 'fox', symbol: '🦊', label: 'Fox' },
    { id: 'owl', symbol: '🦉', label: 'Owl' },
    { id: 'panda', symbol: '🐼', label: 'Panda' },
    { id: 'tiger', symbol: '🐯', label: 'Tiger' }
  ];

  const topicStatusLabels: Record<TopicProgressStatus, string> = {
    not_started: 'Not started',
    needs_practice: 'Practise next',
    growing: 'Growing',
    strong: 'Strong'
  };

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
    <div class="home-hero__spark" aria-hidden="true">✦</div>
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
          <span aria-hidden="true">{avatar.symbol}</span>
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

  <section class="topic-progress-panel" aria-labelledby="topic-progress-heading">
    <div class="section-heading">
      <div>
        <span class="eyebrow">LEARNING MAP</span>
        <h2 id="topic-progress-heading">How each topic is going</h2>
      </div>
      <span class="saved-note">Based on practice on this device</span>
    </div>

    <div class="topic-progress-grid">
      {#each progress.topics as topic}
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
