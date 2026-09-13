<script lang="ts">
  import type { ExperienceDiscoveryDescriptor } from '../../experienceDiscovery';

  let {
    entries,
    onBack,
    onSelect
  }: {
    entries: ExperienceDiscoveryDescriptor[];
    onBack: () => void;
    onSelect: (entry: ExperienceDiscoveryDescriptor) => void;
  } = $props();

  let query = $state('');
  const normalizedQuery = $derived(query.trim().toLocaleLowerCase('en'));
  const filtered = $derived(entries.filter((entry) => {
    if (entry.availability !== 'available') return false;
    if (!normalizedQuery) return true;
    return entry.childTitle.toLocaleLowerCase('en').includes(normalizedQuery)
      || entry.kind.replaceAll('_', ' ').includes(normalizedQuery);
  }));
  const visible = $derived(filtered.slice(0, 80));

  function kindLabel(kind: ExperienceDiscoveryDescriptor['kind']): string {
    if (kind === 'guided_workshop') return 'Big activity';
    if (kind === 'learn_about_topic') return 'Explore topic';
    if (kind === 'learning_studio') return 'Hands-on activity';
    if (kind === 'phonics_adventure') return 'Words & sounds';
    if (kind === 'story') return 'Story';
    if (kind === 'world_action') return 'World mission';
    return 'Play activity';
  }
</script>

<main class="browse" data-nav100-browse="true">
  <header class="browse__header">
    <button type="button" class="back" onclick={onBack} aria-label="Back to prototype home">←</button>
    <div>
      <span class="eyebrow">BROWSE ALL</span>
      <h1>Find something to play</h1>
    </div>
  </header>

  <label class="search-box">
    <span class="sr-only">Search activities by name</span>
    <span aria-hidden="true">🔎</span>
    <input bind:value={query} type="search" placeholder="Try Bicycle, Earth, story…" autocomplete="off" />
  </label>

  <div class="result-meta" aria-live="polite">
    {#if normalizedQuery}
      {filtered.length} {filtered.length === 1 ? 'match' : 'matches'}
    {:else}
      {entries.filter((entry) => entry.availability === 'available').length} activities
    {/if}
  </div>

  {#if filtered.length === 0}
    <section class="empty">
      <strong>Nothing with that name yet.</strong>
      <span>Try a shorter word.</span>
      <button type="button" onclick={() => query = ''}>Show everything</button>
    </section>
  {:else}
    <section class="results" aria-label="Available activities">
      {#each visible as entry (entry.canonicalId)}
        <button class="result-card" type="button" onclick={() => onSelect(entry)}>
          <span class="result-card__copy">
            <small>{kindLabel(entry.kind)}</small>
            <strong>{entry.childTitle}</strong>
          </span>
          <span class="result-card__arrow" aria-hidden="true">›</span>
        </button>
      {/each}
    </section>

    {#if filtered.length > visible.length}
      <p class="more-note">Showing the first {visible.length}. Search by name to narrow the list.</p>
    {/if}
  {/if}
</main>

<style>
  .browse{width:min(940px,100%);min-height:calc(100dvh - 42px);margin:auto;padding:clamp(12px,3vw,26px);box-sizing:border-box;background:#f6fbff;color:#17324d}.browse__header{display:flex;gap:12px;align-items:center;margin-bottom:16px}.back{width:48px;height:48px;border-radius:15px;border:2px solid #17324d;background:white;color:#17324d;font:inherit;font-size:1.5rem;font-weight:800;cursor:pointer}.eyebrow{font-size:.7rem;font-weight:900;letter-spacing:.08em}.browse h1{margin:.15rem 0 0;font-size:clamp(1.45rem,5vw,2rem)}.search-box{min-height:58px;padding:0 16px;border:2px solid #7a91a8;border-radius:18px;background:white;display:flex;gap:10px;align-items:center}.search-box input{width:100%;border:0;outline:0;background:transparent;color:inherit;font:inherit;font-size:1.05rem}.result-meta{padding:10px 4px 8px;color:#526b82;font-weight:700}.results{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.result-card{min-height:76px;padding:12px 14px;border:2px solid rgba(23,50,77,.14);border-radius:17px;background:white;color:inherit;display:flex;align-items:center;justify-content:space-between;gap:12px;text-align:left;cursor:pointer}.result-card__copy{display:flex;flex-direction:column;gap:4px}.result-card small{color:#61788d;font-weight:800}.result-card strong{font-size:1rem}.result-card__arrow{font-size:1.7rem}.empty{padding:24px;border-radius:18px;background:white;border:2px solid rgba(23,50,77,.14);display:flex;flex-direction:column;gap:9px;align-items:flex-start}.empty button{min-height:44px;padding:0 14px;border:0;border-radius:12px;background:#17324d;color:white;font:inherit;font-weight:800;cursor:pointer}.more-note{margin:12px 2px;color:#526b82}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}.back:focus-visible,.result-card:focus-visible,.empty button:focus-visible,.search-box:focus-within{outline:4px solid #ffb02e;outline-offset:3px}@media(max-width:560px){.results{grid-template-columns:1fr}.browse{padding:12px}.result-card{min-height:70px}}
</style>
