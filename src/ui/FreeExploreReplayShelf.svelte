<script lang="ts">
  import type { CatalogEntry } from '../content';
  import { projectFreeExploreReplayTiles } from '../experience/freeExploreProjection';
  import { loadProgress } from '../runtime/localProgress';

  let { entries, onStart }: { entries: CatalogEntry[]; onStart: (entryId: string) => void } = $props();
  const progress = loadProgress();

  let replayEntries = $derived(projectFreeExploreReplayTiles(entries.map((entry) => {
    const attempts = progress.attempts.filter((attempt) => attempt.sessionId === `session.${entry.id}`);
    const newest = attempts.reduce((value, attempt) => Math.max(value, Date.parse(attempt.submittedAt) || 0), 0);
    return {
      activityRef: entry.id,
      available: true,
      playCount: attempts.length ? 1 : 0,
      voluntaryReplayCount: 0,
      completionCount: 0,
      observedActivityCount: attempts.length ? 1 : 0,
      lastPlayedSequence: newest
    };
  })).flatMap((tile) => {
    const entry = entries.find((candidate) => candidate.id === tile.activityRef);
    return entry ? [entry] : [];
  }));
</script>

{#if replayEntries.length}
  <section class="play-again" aria-label="Play again">
    <div class="play-again__heading"><span>PLAY AGAIN</span><h2>Back to something you know</h2></div>
    <div class="play-again__tiles">
      {#each replayEntries as entry}
        <button type="button" aria-label={`Play again ${entry.title}`} onclick={() => onStart(entry.id)}>
          <span aria-hidden="true">↻</span><strong>{entry.title}</strong>
        </button>
      {/each}
    </div>
  </section>
{/if}

<style>
  .play-again{margin-bottom:8px;padding:9px;border:1px solid #24303a17;border-radius:18px;background:#f7fbf7}.play-again__heading{display:flex;align-items:baseline;gap:8px;margin-bottom:7px}.play-again__heading span{color:var(--good);font-size:.58rem;font-weight:950;letter-spacing:.07em}.play-again__heading h2{margin:0;font-size:.92rem}.play-again__tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.play-again__tiles button{min-height:88px;display:grid;place-items:center;align-content:center;gap:4px;padding:8px;border:2px solid #dbe9dc;border-radius:16px;background:#fff;color:var(--ink);font:inherit;cursor:pointer}.play-again__tiles button span{font-size:1.35rem;color:var(--good)}.play-again__tiles strong{font-size:.77rem;line-height:1.15;text-align:center}@media(max-width:650px){.play-again__tiles{grid-template-columns:repeat(3,minmax(0,1fr))}.play-again__tiles button{min-height:82px;padding:6px}.play-again__tiles strong{font-size:.7rem}}@media(max-width:380px){.play-again__heading{display:block}.play-again__heading h2{margin-top:2px}}
</style>
