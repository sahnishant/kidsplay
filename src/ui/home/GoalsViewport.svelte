<script lang="ts">
  import type { GoalReadinessSummary } from '../../content';
  import type { MockTrendSummary, StoredMockCheckpoint } from '../../runtime/mockPersistence';

  let {
    goalReadiness,
    resumableMock,
    mockTrends,
    onResumeMock
  }: {
    goalReadiness: GoalReadinessSummary | null;
    resumableMock: StoredMockCheckpoint | null;
    mockTrends: MockTrendSummary[];
    onResumeMock: () => void;
  } = $props();

  const readinessLabels = {
    getting_started: 'Keep exploring',
    building: 'Building toward the challenge',
    mock_ready: 'Ready for a mixed mock!'
  } as const;

  let answered = $derived(resumableMock?.state.responses.length ?? 0);
  let mockTotal = $derived(resumableMock?.questionIds.length ?? 0);
  let mockPercent = $derived(mockTotal > 0 ? Math.round((answered / mockTotal) * 100) : 0);
</script>

<section class="goals-view" aria-label="Goal learning">
  {#if resumableMock}
    <section class="challenge-hero challenge-hero--resume" aria-label="Saved Olympiad challenge">
      <div class="challenge-hero__trophy" aria-hidden="true">🏆</div>
      <div class="challenge-hero__copy">
        <span>CONTINUE YOUR CHALLENGE</span>
        <h2>Pick up where you left off</h2>
        <p>{resumableMock.title}</p>
        <div class="mock-progress" aria-label={`${answered} of ${mockTotal} questions answered`}>
          <div class="mock-progress__track"><span style={`width:${mockPercent}%`}></span></div>
          <strong>{answered} / {mockTotal}</strong>
        </div>
        <button type="button" onclick={onResumeMock}>▶ Continue</button>
      </div>
    </section>
  {:else if goalReadiness}
    <section class="challenge-hero" aria-label="Olympiad practice readiness">
      <div class="challenge-hero__trophy" aria-hidden="true">🏆</div>
      <div class="challenge-hero__copy">
        <span>OLYMPIAD CHALLENGE</span>
        <h2>{goalReadiness.score}% ready</h2>
        <p>{readinessLabels[goalReadiness.status]}</p>
        <div class="journey" aria-label="Learn, practise, mock journey">
          <span class="journey__done">📚<small>Learn</small></span>
          <i></i>
          <span class="journey__done">🎯<small>Practise</small></span>
          <i></i>
          <span class:journey__ready={goalReadiness.status === 'mock_ready'}>🏆<small>Mock</small></span>
        </div>
      </div>
    </section>
  {/if}

  {#if goalReadiness}
    <section class="readiness-strip" aria-label="Practice readiness details">
      <article><strong>{goalReadiness.practicedRows}</strong><span>facts tried</span></article>
      <article><strong>{goalReadiness.readyRows}</strong><span>goal-ready</span></article>
      <article><strong>{goalReadiness.practicedGroups}/{goalReadiness.totalGroups}</strong><span>topic groups</span></article>
      <article><strong>{goalReadiness.accuracy === null ? '—' : `${Math.round(goalReadiness.accuracy * 100)}%`}</strong><span>accuracy</span></article>
    </section>
  {/if}

  {#if mockTrends.length > 0}
    <section class="medal-shelf" aria-labelledby="medal-heading">
      <header>
        <div><span>YOUR CHALLENGES</span><h2 id="medal-heading">Mock medals</h2></div>
        <small>Latest and best results</small>
      </header>
      <div class="medal-rail">
        {#each mockTrends as trend, index}
          <article aria-label={`${trend.title}. Latest ${Math.round(trend.latestPercent * 100)} percent. Best ${Math.round(trend.bestPercent * 100)} percent.`}>
            <span class="medal" aria-hidden="true">{index === 0 ? '🥇' : index === 1 ? '🥈' : '🏅'}</span>
            <strong>{Math.round(trend.latestPercent * 100)}%</strong>
            <small>{trend.latestEarnedMarks}/{trend.latestMaxMarks} marks · best {Math.round(trend.bestPercent * 100)}%</small>
          </article>
        {/each}
      </div>
    </section>
  {/if}

  {#if goalReadiness}
    <details class="readiness-note">
      <summary>ⓘ About readiness</summary>
      <p>This is a Kidsplay local practice-readiness signal, not an official SOF score or syllabus certification.</p>
    </details>
  {/if}
</section>

<style>
  .goals-view { height: 100%; min-height: 0; display: grid; grid-template-rows: auto auto minmax(0,1fr) auto; gap: 9px; overflow: hidden; }
  .challenge-hero, .readiness-strip, .medal-shelf, .readiness-note { border: 1px solid rgba(36,48,58,.08); border-radius: 20px; background: rgba(255,255,255,.95); }
  .challenge-hero { min-height: 190px; display: flex; align-items: center; justify-content: center; gap: 18px; padding: 18px; text-align: left; background: linear-gradient(145deg,#fff5c9,#f2efff 75%); }
  .challenge-hero--resume { background: linear-gradient(145deg,#fff0bd,#eaf5ff 75%); }
  .challenge-hero__trophy { width: 100px; height: 100px; display: grid; place-items: center; flex: 0 0 auto; border-radius: 50%; background: rgba(255,255,255,.78); font-size: 3.4rem; box-shadow: 0 8px 22px rgba(96,77,25,.12); }
  .challenge-hero__copy { min-width: 0; width: min(520px,100%); }
  .challenge-hero__copy > span, .medal-shelf header span { color: var(--accent); font-size: .65rem; font-weight: 950; letter-spacing: .09em; }
  .challenge-hero h2 { margin: 3px 0 5px; font-size: clamp(1.45rem,4vw,2rem); line-height: 1; }
  .challenge-hero p { margin: 0; color: var(--muted); font-size: .8rem; font-weight: 750; }
  .challenge-hero button { min-height: 44px; margin-top: 10px; padding: 8px 20px; border: 0; border-radius: 14px; background: var(--accent); color: #fff; font: inherit; font-weight: 950; cursor: pointer; }
  .mock-progress { margin-top: 11px; display: flex; align-items: center; gap: 9px; }
  .mock-progress__track { height: 11px; flex: 1; overflow: hidden; border-radius: 999px; background: rgba(36,48,58,.12); }
  .mock-progress__track span { display: block; height: 100%; border-radius: inherit; background: var(--accent); }
  .mock-progress strong { min-width: 48px; font-size: .82rem; }
  .journey { display: grid; grid-template-columns: auto 1fr auto 1fr auto; align-items: center; gap: 6px; margin-top: 14px; }
  .journey > span { min-width: 52px; display: grid; justify-items: center; gap: 1px; padding: 5px; border-radius: 12px; background: rgba(255,255,255,.75); font-size: 1.2rem; }
  .journey small { font-size: .57rem; font-weight: 850; color: var(--muted); }
  .journey i { height: 4px; border-radius: 999px; background: rgba(90,82,213,.22); }
  .journey__done i, .journey__ready { background: var(--good-soft); }
  .readiness-strip { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 4px; padding: 7px; }
  .readiness-strip article { min-width: 0; display: grid; justify-items: center; padding: 5px; }
  .readiness-strip strong { font-size: 1rem; }
  .readiness-strip span { color: var(--muted); font-size: .58rem; font-weight: 750; text-align: center; }
  .medal-shelf { min-height: 0; display: grid; grid-template-rows: auto minmax(0,1fr); gap: 7px; padding: 10px; overflow: hidden; }
  .medal-shelf header { display: flex; justify-content: space-between; gap: 8px; align-items: end; }
  .medal-shelf h2 { margin: 1px 0 0; font-size: .98rem; }
  .medal-shelf header small { color: var(--muted); font-size: .6rem; font-weight: 750; }
  .medal-rail { min-height: 0; display: grid; grid-auto-flow: column; grid-auto-columns: minmax(150px,27%); gap: 8px; overflow-x: auto; overflow-y: hidden; }
  .medal-rail article { min-width: 0; display: grid; place-items: center; align-content: center; gap: 2px; padding: 8px; border-radius: 16px; background: #f8fafb; text-align: center; }
  .medal { font-size: 1.8rem; }
  .medal-rail strong { font-size: 1rem; }
  .medal-rail small { color: var(--muted); font-size: .57rem; font-weight: 750; }
  .readiness-note { padding: 0 10px; }
  .readiness-note summary { min-height: 34px; display: flex; align-items: center; color: var(--muted); font-size: .68rem; font-weight: 850; cursor: pointer; }
  .readiness-note p { margin: 0 0 8px; color: var(--muted); font-size: .65rem; line-height: 1.35; }
  @media (max-width:520px) {
    .goals-view { gap: 7px; }
    .challenge-hero { min-height: 145px; gap: 10px; padding: 11px; }
    .challenge-hero__trophy { width: 66px; height: 66px; font-size: 2.35rem; }
    .challenge-hero h2 { font-size: 1.25rem; }
    .challenge-hero p { font-size: .67rem; }
    .journey { margin-top: 8px; }
    .journey > span { min-width: 42px; font-size: 1rem; padding: 3px; }
    .challenge-hero button { min-height: 40px; margin-top: 7px; }
    .medal-shelf { padding: 8px; }
    .medal-rail { grid-auto-columns: minmax(135px,46%); }
  }
</style>