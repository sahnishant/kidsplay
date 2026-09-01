<script lang="ts">
  import type { ProgressSummary, TopicProgressStatus } from '../../runtime/localProgress';

  let { progress }: { progress: ProgressSummary } = $props();

  const topicIcons: Record<string, string> = {
    animals: '🦁', plants: '🌱', human: '🫀', food: '🍎', housing: '🏠', clothing: '👕',
    habits: '✨', safety: '🛡️', transport: '🚌', communication: '💬', air: '💨', water: '💧',
    rocks: '🪨', universe: '🌍', family: '👨‍👩‍👧', festivals: '🎉', reasoning: '🧠'
  };
  const statusLabels: Record<TopicProgressStatus, string> = {
    not_started: 'Ready to discover', needs_practice: 'Practise next', growing: 'Growing', strong: 'Strong'
  };
  function starsFor(status: TopicProgressStatus): string {
    return status === 'strong' ? '★★★' : status === 'growing' ? '★★☆' : status === 'needs_practice' ? '★☆☆' : '☆☆☆';
  }
</script>

<section class="progress-view" aria-label="Learning progress">
  <section class="progress-hero" aria-label="Strong facts summary">
    <div class="progress-hero__star" aria-hidden="true">⭐</div>
    <div><span class="eyebrow">MY SCIENCE POWER</span><h2>{progress.masteredKnowledge} strong facts!</h2>
      <p><strong>{progress.practicedKnowledge}</strong> explored <span aria-hidden="true">·</span> <strong>{progress.accuracy === null ? '—' : `${Math.round(progress.accuracy * 100)}%`}</strong> right</p>
    </div>
  </section>

  {#if progress.recommendedTopics.length > 0}
    <section class="focus-card" aria-label="Recommended next topics">
      <b class="focus-card__guide" aria-hidden="true">🔬</b>
      <div><span class="eyebrow">SCIENTU SAYS</span><h2>Let's make these stronger!</h2>
        <div class="focus-topics">
          {#each progress.recommendedTopics.slice(0, 3) as topic}
            <span aria-label={`${topic.label}: ${statusLabels[topic.status]}`}><b aria-hidden="true">{topicIcons[topic.id] ?? '⭐'}</b>{topic.label}</span>
          {/each}
        </div>
      </div>
    </section>
  {/if}

  <section class="collection" aria-labelledby="collection-heading">
    <header><div><span class="eyebrow">YOUR COLLECTION</span><h2 id="collection-heading">Science worlds you've explored</h2></div><small>Swipe for more →</small></header>
    <div class="topic-rail" role="list" aria-label="Topic progress collection">
      {#each progress.topics as topic}
        <article class="topic-tile" data-status={topic.status} role="listitem"
          aria-label={`${topic.label}. ${statusLabels[topic.status]}. ${topic.strongKnowledge} strong of ${topic.practicedKnowledge} practised. ${topic.accuracy === null ? 'No accuracy yet' : `${Math.round(topic.accuracy * 100)} percent accuracy`}.`}>
          <span class="topic-tile__icon" aria-hidden="true">{topicIcons[topic.id] ?? '⭐'}</span>
          <div><strong>{topic.label}</strong><span class="topic-tile__stars" aria-hidden="true">{starsFor(topic.status)}</span><small>{topic.strongKnowledge} strong · {statusLabels[topic.status]}</small></div>
        </article>
      {/each}
    </div>
  </section>

  <details class="progress-details" aria-label="Learning progress numbers">
    <summary>Numbers for grown-ups</summary>
    <div>
      <span><strong>{progress.totalAttempts}</strong> attempts</span><span><strong>{progress.practicedKnowledge}</strong> facts practised</span>
      <span><strong>{progress.masteredKnowledge}</strong> facts strong</span><span><strong>{progress.accuracy === null ? '—' : `${Math.round(progress.accuracy * 100)}%`}</strong> accuracy</span>
    </div>
  </details>
</section>

<style>
  .progress-view{height:100%;min-height:0;display:grid;grid-template-rows:auto auto minmax(0,1fr) auto;gap:8px;overflow:hidden}
  .progress-hero,.focus-card,.collection,.progress-details{border:1px solid #24303a14;border-radius:18px;background:#fffffff2}
  .progress-hero{display:flex;align-items:center;gap:12px;padding:11px 14px;background:linear-gradient(135deg,#fff9d9,#f3f0ff)}
  .progress-hero__star{width:58px;height:58px;display:grid;place-items:center;flex:none;border-radius:50%;background:#ffffffc7;font-size:2rem}
  .eyebrow{color:var(--accent);font-size:.6rem;font-weight:950;letter-spacing:.08em}
  .progress-hero h2{margin:1px 0 3px;font-size:clamp(1.25rem,4vw,1.7rem);line-height:1}
  .progress-hero p{margin:0;color:var(--muted);font-size:.72rem;font-weight:750}.progress-hero p strong{color:var(--ink)}
  .focus-card{display:flex;align-items:center;gap:9px;padding:9px 12px;background:#f1f8ff}.focus-card__guide{font-size:1.8rem}.focus-card h2{margin:1px 0 5px;font-size:.95rem}
  .focus-topics{display:flex;flex-wrap:wrap;gap:5px}.focus-topics span{padding:4px 7px;border-radius:999px;background:#fff;font-size:.66rem;font-weight:850}
  .collection{min-height:0;display:grid;grid-template-rows:auto minmax(0,1fr);gap:6px;padding:9px;overflow:hidden}.collection header{display:flex;justify-content:space-between;align-items:end;gap:8px}.collection h2{margin:1px 0 0;font-size:.94rem}.collection header small{color:var(--muted);font-size:.58rem}
  .topic-rail{min-height:0;display:grid;grid-template-rows:repeat(2,minmax(66px,1fr));grid-auto-flow:column;grid-auto-columns:minmax(140px,24%);gap:7px;overflow-x:auto;overflow-y:hidden;scroll-snap-type:x proximity}
  .topic-tile{display:flex;align-items:center;gap:7px;padding:7px;border:1px solid #24303a12;border-radius:14px;background:#fafcfd;scroll-snap-align:start}.topic-tile[data-status='strong']{background:var(--good-soft)}.topic-tile[data-status='needs_practice']{background:var(--try-soft)}.topic-tile[data-status='growing']{background:#f2f7ff}
  .topic-tile__icon{font-size:1.35rem}.topic-tile>div{min-width:0;display:grid}.topic-tile strong{font-size:.76rem}.topic-tile__stars{color:#b78600;font-size:.68rem}.topic-tile small{color:var(--muted);font-size:.55rem;font-weight:750}
  .progress-details{padding:0 9px}.progress-details summary{min-height:32px;display:flex;align-items:center;color:var(--muted);font-size:.65rem;font-weight:850;cursor:pointer}.progress-details>div{display:grid;grid-template-columns:repeat(4,1fr);padding-bottom:7px}.progress-details span{display:grid;text-align:center;color:var(--muted);font-size:.55rem}.progress-details strong{color:var(--ink);font-size:.76rem}
  @media(max-width:520px){.progress-view{gap:6px}.progress-hero{padding:8px 10px}.progress-hero__star{width:46px;height:46px;font-size:1.6rem}.focus-card{padding:7px 9px}.topic-rail{grid-auto-columns:minmax(130px,44%)}.collection header small{display:none}.progress-details>div{grid-template-columns:repeat(2,1fr)}}
</style>