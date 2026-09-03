<script lang="ts">
  import type { GoalReadinessSummary } from '../../content';
  import type { MockTrendSummary, StoredMockCheckpoint } from '../../runtime/mockPersistence';

  let { goalReadiness, resumableMock, mockTrends, onResumeMock, onStartMock }: {
    goalReadiness: GoalReadinessSummary | null;
    resumableMock: StoredMockCheckpoint | null;
    mockTrends: MockTrendSummary[];
    onResumeMock: () => void;
    onStartMock?: () => void;
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
      <div class="challenge-hero__copy"><span>CONTINUE YOUR CHALLENGE</span><h2>Pick up where you left off</h2><p>{resumableMock.title}</p>
        <div class="mock-progress" aria-label={`${answered} of ${mockTotal} questions answered`}><div><span style={`width:${mockPercent}%`}></span></div><strong>{answered} / {mockTotal}</strong></div>
        <button type="button" onclick={onResumeMock}>▶ Continue</button>
      </div>
    </section>
  {:else if goalReadiness}
    <section class="challenge-hero" aria-label="Olympiad practice readiness">
      <div class="challenge-hero__trophy" aria-hidden="true">🏆</div>
      <div class="challenge-hero__copy"><span>OLYMPIAD CHALLENGE</span><h2>{goalReadiness.score}% ready</h2><p>{readinessLabels[goalReadiness.status]}</p>
        <div class="journey" aria-label="Learn, practise, mock journey"><span>📚<small>Learn ✓</small></span><i></i><span>🎯<small>Practise ✓</small></span><i></i><span class:journey__ready={goalReadiness.status === 'mock_ready'}>🏆<small>Mock</small></span></div>
        {#if onStartMock}<button type="button" onclick={onStartMock}>Start mock ▶</button>{/if}
      </div>
    </section>
  {/if}

  {#if goalReadiness}
    <section class="readiness-strip" aria-label="Practice readiness details">
      <article><strong>{goalReadiness.practicedRows}</strong><span>facts tried</span></article><article><strong>{goalReadiness.readyRows}</strong><span>goal-ready</span></article>
      <article><strong>{goalReadiness.practicedGroups}/{goalReadiness.totalGroups}</strong><span>topic groups</span></article><article><strong>{goalReadiness.accuracy === null ? '—' : `${Math.round(goalReadiness.accuracy * 100)}%`}</strong><span>accuracy</span></article>
    </section>
  {/if}

  {#if mockTrends.length > 0}
    <section class="medal-shelf" aria-labelledby="medal-heading">
      <header><div><span>YOUR CHALLENGES</span><h2 id="medal-heading">Mock medals</h2></div><small>Latest and best</small></header>
      <div class="medal-rail">
        {#each mockTrends as trend, index}
          <article aria-label={`${trend.title}. Latest ${Math.round(trend.latestPercent * 100)} percent. Best ${Math.round(trend.bestPercent * 100)} percent.`}>
            <span class="medal" aria-hidden="true">{index === 0 ? '🥇' : index === 1 ? '🥈' : '🏅'}</span><strong>{Math.round(trend.latestPercent * 100)}%</strong><small>{trend.latestEarnedMarks}/{trend.latestMaxMarks} marks · best {Math.round(trend.bestPercent * 100)}%</small>
          </article>
        {/each}
      </div>
    </section>
  {/if}

  {#if goalReadiness}
    <details class="readiness-note"><summary>ⓘ About readiness</summary><p>This is a Kidsplay local practice-readiness signal, not an official SOF score or syllabus certification.</p></details>
  {/if}
</section>

<style>
  .goals-view{height:100%;min-height:0;display:grid;grid-template-rows:auto auto minmax(0,1fr) auto;gap:8px;overflow:hidden}
  .challenge-hero,.readiness-strip,.medal-shelf,.readiness-note{border:1px solid #24303a14;border-radius:18px;background:#fffffff2}
  .challenge-hero{display:flex;align-items:center;justify-content:center;gap:14px;padding:14px;background:linear-gradient(145deg,#fff5c9,#f2efff)}.challenge-hero--resume{background:linear-gradient(145deg,#fff0bd,#eaf5ff)}
  .challenge-hero__trophy{width:78px;height:78px;display:grid;place-items:center;flex:none;border-radius:50%;background:#ffffffc7;font-size:2.7rem}.challenge-hero__copy{min-width:0;width:min(520px,100%)}
  .challenge-hero__copy>span,.medal-shelf header span{color:var(--accent);font-size:.62rem;font-weight:950;letter-spacing:.08em}.challenge-hero h2{margin:2px 0 4px;font-size:clamp(1.3rem,4vw,1.8rem);line-height:1}.challenge-hero p{margin:0;color:var(--muted);font-size:.72rem;font-weight:750}
  .challenge-hero button{min-height:44px;margin-top:8px;padding:7px 16px;border:0;border-radius:13px;background:var(--accent);color:#fff;font:inherit;font-weight:950;cursor:pointer}
  .mock-progress{margin-top:9px;display:flex;align-items:center;gap:8px}.mock-progress>div{height:10px;flex:1;overflow:hidden;border-radius:999px;background:#24303a1f}.mock-progress>div span{display:block;height:100%;background:var(--accent)}.mock-progress strong{font-size:.78rem}
  .journey{display:grid;grid-template-columns:auto 1fr auto 1fr auto;align-items:center;gap:5px;margin-top:10px}.journey>span{display:grid;justify-items:center;padding:4px;border-radius:10px;background:#ffffffbf}.journey small{font-size:.54rem;font-weight:850;color:var(--muted)}.journey i{height:4px;background:#5a52d538}.journey__ready{background:var(--good-soft)!important}
  .readiness-strip{display:grid;grid-template-columns:repeat(4,1fr);padding:6px}.readiness-strip article{display:grid;text-align:center}.readiness-strip span{color:var(--muted);font-size:.56rem;font-weight:750}.readiness-strip strong{font-size:.92rem}
  .medal-shelf{min-height:0;display:grid;grid-template-rows:auto minmax(0,1fr);gap:6px;padding:9px;overflow:hidden}.medal-shelf header{display:flex;justify-content:space-between;align-items:end}.medal-shelf h2{margin:1px 0 0;font-size:.94rem}.medal-shelf header small{color:var(--muted);font-size:.56rem}
  .medal-rail{min-height:0;display:grid;grid-auto-flow:column;grid-auto-columns:minmax(140px,27%);gap:7px;overflow-x:auto}.medal-rail article{display:grid;place-items:center;align-content:center;padding:7px;border-radius:14px;background:#f8fafb;text-align:center}.medal{font-size:1.6rem}.medal-rail small{color:var(--muted);font-size:.54rem}
  .readiness-note{padding:0 9px}.readiness-note summary{min-height:32px;display:flex;align-items:center;color:var(--muted);font-size:.64rem;font-weight:850;cursor:pointer}.readiness-note p{margin:0 0 7px;color:var(--muted);font-size:.62rem}
  @media(max-width:520px){.goals-view{gap:6px}.challenge-hero{gap:9px;padding:9px}.challenge-hero__trophy{width:58px;height:58px;font-size:2rem}.journey{margin-top:6px}.medal-rail{grid-auto-columns:minmax(130px,46%)}}
</style>