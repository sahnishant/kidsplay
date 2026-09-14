<script lang="ts">
  import type { CatalogEntry } from '../content';
  import { loadProgress } from '../runtime/localProgress';

  let { entries, onStart }: { entries: CatalogEntry[]; onStart: (entryId: string) => void } = $props();
  const attempts = loadProgress().attempts;
  let replayEntries = $derived.by(() => entries
    .map((entry) => ({
      entry,
      lastUsed: attempts.reduce((latest, attempt) =>
        attempt.sessionId === `session.${entry.id}`
          ? Math.max(latest, Date.parse(attempt.submittedAt) || 0)
          : latest, 0)
    }))
    .filter((item) => item.lastUsed > 0)
    .sort((left, right) => right.lastUsed - left.lastUsed || left.entry.id.localeCompare(right.entry.id))
    .slice(0, 3)
    .map((item) => item.entry));
</script>

{#if replayEntries.length}
  <section class="play-again" aria-label="Play again">
    <strong>Play again</strong>
    <div>
      {#each replayEntries as entry}
        <button type="button" aria-label={`Play again ${entry.title}`} onclick={() => onStart(entry.id)}>↻ {entry.title}</button>
      {/each}
    </div>
  </section>
{/if}

<style>
  .play-again{margin-bottom:8px;padding:8px;border:1px solid #24303a17;border-radius:18px;background:#f7fbf7}.play-again>strong{font-size:.72rem}.play-again>div{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-top:6px}.play-again button{min-height:64px;padding:6px;border:2px solid #dbe9dc;border-radius:14px;background:#fff;color:var(--ink);font:inherit;font-size:.72rem;font-weight:900;cursor:pointer}
</style>
