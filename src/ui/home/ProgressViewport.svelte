<script lang="ts">
  import type { ProgressSummary, TopicProgressStatus } from '../../runtime/localProgress';

  let { progress }: { progress: ProgressSummary } = $props();

  const topicIcons: Record<string, string> = {
    animals: '🦁', plants: '🌱', human: '🫀', food: '🍎', housing: '🏠', clothing: '👕',
    habits: '✨', safety: '🛡️', transport: '🚌', communication: '💬', air: '💨', water: '💧',
    rocks: '🪨', universe: '🌍', family: '👨‍👩‍👧', festivals: '🎉', reasoning: '🧠'
  };

  const statusLabels: Record<TopicProgressStatus, string> = {
    not_started: 'Ready to discover',
    needs_practice: 'Practise next',
    growing: 'Growing',
    strong: 'Strong'
  };

  function starsFor(status: TopicProgressStatus): string {
    if (status === 'strong') return '★★★';
    if (status === 'growing') return '★★☆';
    if (status === 'needs_practice') return '★☆☆';
    return '☆☆☆';
  }
</script>

<section class="progress-view" aria-label="Learning progress">
  <section class="progress-hero" aria-label="Strong facts summary">
    <div class="progress-hero__star" aria-hidden="true">⭐</div>
    <div class="progress-hero__copy">
      <span>MY SCIENCE POWER</span>
      <h2>{progress.masteredKnowledge} strong facts!</h2>
      <p>
        <strong>{progress.practicedKnowledge}</strong> explored
        <span aria-hidden="true">·</span>
        <strong>{progress.accuracy === null ? '—' : `${Math.round(progress.accuracy * 100)}%`}</strong> right
      </p>
    </div>
  </section>

  {#if progress.recommendedTopics.length > 0}
    <section class="focus-card" aria-label="Recommended next topics">
      <div class="focus-card__guide" aria-hidden="true">🔬</div>
      <div class="focus-card__copy">
        <span>SCIENTU SAYS</span>
        <h2>Let's make these stronger!</h2>
        <div class="focus-topics">
          {#each progress.recommendedTopics.slice(0, 3) as topic}
            <span aria-label={`${topic.label}: ${statusLabels[topic.status]}`}>
              <b aria-hidden="true">{topicIcons[topic.id] ?? '⭐'}</b>{topic.label}
            </span>
          {/each}
        </div>
      </div>
    </section>
  {/if}

  <section class="collection" aria-labelledby="collection-heading">
    <header>
      <div>
        <span>YOUR COLLECTION</span>
        <h2 id="collection-heading">Science worlds you've explored</h2>
      </div>
      <small>Swipe for more →</small>
    </header>

    <div class="topic-rail" role="list" aria-label="Topic progress collection">
      {#each progress.topics as topic}
        <article
          class="topic-tile"
          data-status={topic.status}
          role="listitem"
          aria-label={`${topic.label}. ${statusLabels[topic.status]}. ${topic.strongKnowledge} strong of ${topic.practicedKnowledge} practised. ${topic.accuracy === null ? 'No accuracy yet' : `${Math.round(topic.accuracy * 100)} percent accuracy`}.`}
        >
          <span class="topic-tile__icon" aria-hidden="true">{topicIcons[topic.id] ?? '⭐'}</span>
          <div class="topic-tile__copy">
            <strong>{topic.label}</strong>
            <span class="topic-tile__stars" aria-hidden="true">{starsFor(topic.status)}</span>
            <small>{topic.strongKnowledge} strong · {statusLabels[topic.status]}</small>
          </div>
        </article>
      {/each}
    </div>
  </section>

  <details class="progress-details">
    <summary>Numbers for grown-ups</summary>
    <div>
      <span><strong>{progress.totalAttempts}</strong> attempts</span>
      <span><strong>{progress.practicedKnowledge}</strong> facts practised</span>
      <span><strong>{progress.masteredKnowledge}</strong> facts strong</span>
      <span><strong>{progress.accuracy === null ? '—' : `${Math.round(progress.accuracy * 100)}%`}</strong> accuracy</span>
    </div>
  </details>
</section>

<style>
  .progress-view {
    height: 100%;
    min-height: 0;
    display: grid;
    grid-template-rows: auto auto minmax(0, 1fr) auto;
    gap: 9px;
    overflow: hidden;
  }

  .progress-hero,
  .focus-card,
  .collection,
  .progress-details {
    border: 1px solid rgba(36,48,58,.08);
    border-radius: 20px;
    background: rgba(255,255,255,.95);
  }

  .progress-hero {
    min-height: 104px;
    display: flex;
    align-items: center;
    gap: 13px;
    padding: 12px 16px;
    background: linear-gradient(135deg, #fff9d9, #f3f0ff 70%);
  }

  .progress-hero__star {
    width: 68px;
    height: 68px;
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    border-radius: 50%;
    background: rgba(255,255,255,.82);
    font-size: 2.25rem;
    box-shadow: 0 6px 18px rgba(65,55,145,.12);
  }

  .progress-hero__copy > span,
  .focus-card__copy > span,
  .collection header span {
    color: var(--accent);
    font-size: .63rem;
    font-weight: 950;
    letter-spacing: .09em;
  }

  .progress-hero h2 { margin: 1px 0 4px; font-size: clamp(1.35rem, 4vw, 1.9rem); line-height: 1; }
  .progress-hero p { margin: 0; display: flex; flex-wrap: wrap; gap: 5px; color: var(--muted); font-size: .76rem; font-weight: 750; }
  .progress-hero p strong { color: var(--ink); }

  .focus-card {
    min-height: 82px;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 13px;
    background: linear-gradient(135deg, #eef9ff, #f8f4ff);
  }
  .focus-card__guide { font-size: 2rem; flex: 0 0 auto; }
  .focus-card__copy { min-width: 0; flex: 1; }
  .focus-card h2 { margin: 1px 0 6px; font-size: 1rem; }
  .focus-topics { display: flex; flex-wrap: wrap; gap: 6px; }
  .focus-topics span {
    min-height: 28px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border-radius: 999px;
    background: #fff;
    font-size: .7rem;
    font-weight: 850;
  }

  .collection {
    min-height: 0;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    gap: 7px;
    padding: 10px;
    overflow: hidden;
  }
  .collection header { display: flex; align-items: end; justify-content: space-between; gap: 10px; padding: 0 2px; }
  .collection h2 { margin: 1px 0 0; font-size: .98rem; }
  .collection header small { flex: 0 0 auto; color: var(--muted); font-size: .62rem; font-weight: 800; }

  .topic-rail {
    min-height: 0;
    display: grid;
    grid-template-rows: repeat(2, minmax(74px, 1fr));
    grid-auto-flow: column;
    grid-auto-columns: minmax(150px, 24%);
    gap: 8px;
    overflow-x: auto;
    overflow-y: hidden;
    overscroll-behavior-inline: contain;
    scroll-snap-type: x proximity;
    padding: 1px 2px 4px;
  }

  .topic-tile {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 9px;
    border: 1px solid rgba(36,48,58,.08);
    border-radius: 16px;
    background: #fafcfd;
    scroll-snap-align: start;
  }
  .topic-tile[data-status='strong'] { background: var(--good-soft); }
  .topic-tile[data-status='needs_practice'] { background: var(--try-soft); }
  .topic-tile[data-status='growing'] { background: #f2f7ff; }
  .topic-tile__icon { font-size: 1.55rem; flex: 0 0 auto; }
  .topic-tile__copy { min-width: 0; display: grid; gap: 1px; }
  .topic-tile__copy strong { font-size: .8rem; line-height: 1.05; }
  .topic-tile__stars { color: #d49f00; font-size: .72rem; letter-spacing: .04em; }
  .topic-tile small { color: var(--muted); font-size: .58rem; font-weight: 750; line-height: 1.15; }

  .progress-details { padding: 0 10px; }
  .progress-details summary { min-height: 34px; display: flex; align-items: center; cursor: pointer; color: var(--muted); font-size: .68rem; font-weight: 850; }
  .progress-details > div { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 5px; padding: 0 0 8px; }
  .progress-details span { display: grid; text-align: center; color: var(--muted); font-size: .58rem; font-weight: 750; }
  .progress-details strong { color: var(--ink); font-size: .8rem; }

  @media (max-width: 520px) {
    .progress-view { gap: 7px; }
    .progress-hero { min-height: 86px; padding: 9px 11px; }
    .progress-hero__star { width: 52px; height: 52px; font-size: 1.8rem; }
    .progress-hero h2 { font-size: 1.25rem; }
    .focus-card { min-height: 70px; padding: 8px 10px; }
    .focus-card__guide { font-size: 1.55rem; }
    .focus-card h2 { font-size: .86rem; }
    .focus-topics span { min-height: 24px; font-size: .62rem; padding: 3px 6px; }
    .collection { padding: 8px; }
    .collection header small { display: none; }
    .topic-rail { grid-auto-columns: minmax(138px, 43%); grid-template-rows: repeat(2, minmax(66px, 1fr)); }
    .topic-tile { padding: 7px; }
    .topic-tile__icon { font-size: 1.3rem; }
    .progress-details > div { grid-template-columns: repeat(2, minmax(0,1fr)); }
  }

  @media (prefers-reduced-motion: reduce) {
    .topic-rail { scroll-behavior: auto; }
  }
</style>