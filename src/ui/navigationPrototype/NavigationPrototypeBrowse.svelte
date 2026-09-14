<script lang="ts">
  import type { ExperienceDiscoveryDescriptor } from '../../experienceDiscovery';

  type BrowseFilter = 'all' | 'play' | 'discover' | 'hands_on' | 'stories' | 'sounds';

  let {
    entries,
    query,
    filter,
    onQueryChange,
    onFilterChange,
    onBack,
    onSelect
  }: {
    entries: ExperienceDiscoveryDescriptor[];
    query: string;
    filter: BrowseFilter;
    onQueryChange: (query: string) => void;
    onFilterChange: (filter: BrowseFilter) => void;
    onBack: () => void;
    onSelect: (entry: ExperienceDiscoveryDescriptor) => void;
  } = $props();

  const filters: Array<{ id: BrowseFilter; label: string; marker: string }> = [
    { id: 'all', label: 'All', marker: '✨' },
    { id: 'play', label: 'Games', marker: '🎮' },
    { id: 'discover', label: 'Discover', marker: '🔎' },
    { id: 'hands_on', label: 'Hands-on', marker: '🧪' },
    { id: 'stories', label: 'Stories', marker: '📖' },
    { id: 'sounds', label: 'Sounds', marker: '🔊' }
  ];

  const normalizedQuery = $derived(query.trim().toLocaleLowerCase('en'));
  const eligible = $derived(entries.filter((entry) => entry.availability !== 'unavailable'));
  const filtered = $derived(eligible.filter((entry) => {
    if (!matchesFilter(entry, filter)) return false;
    if (!normalizedQuery) return true;
    return entry.childTitle.toLocaleLowerCase('en').includes(normalizedQuery)
      || kindLabel(entry.kind).toLocaleLowerCase('en').includes(normalizedQuery);
  }));
  const visible = $derived(filtered.slice(0, 80));

  function matchesFilter(entry: ExperienceDiscoveryDescriptor, selected: BrowseFilter): boolean {
    if (selected === 'all') return true;
    if (selected === 'discover') return entry.kind === 'learn_about_topic';
    if (selected === 'hands_on') return entry.kind === 'learning_studio';
    if (selected === 'stories') return entry.kind === 'story';
    if (selected === 'sounds') return entry.kind === 'phonics_adventure';
    return entry.kind === 'catalog_entry'
      || entry.kind === 'guided_workshop'
      || entry.kind === 'story_mission'
      || entry.kind === 'world_action';
  }

  function kindLabel(kind: ExperienceDiscoveryDescriptor['kind']): string {
    if (kind === 'guided_workshop') return 'Big activity';
    if (kind === 'learn_about_topic') return 'Explore topic';
    if (kind === 'learning_studio') return 'Hands-on activity';
    if (kind === 'phonics_adventure') return 'Words & sounds';
    if (kind === 'story') return 'Story';
    if (kind === 'world_action' || kind === 'story_mission') return 'World mission';
    return 'Play activity';
  }

  function kindMarker(entry: ExperienceDiscoveryDescriptor): string {
    if (entry.canonicalId === 'experience.bicycle-workshop.guided.v1') return '🚲';
    if (entry.canonicalId === 'learn.earth') return '🌍';
    if (entry.kind === 'guided_workshop') return '🎮';
    if (entry.kind === 'learn_about_topic') return '🔎';
    if (entry.kind === 'learning_studio') return '🧪';
    if (entry.kind === 'phonics_adventure') return '🔊';
    if (entry.kind === 'story') return '📖';
    if (entry.kind === 'world_action' || entry.kind === 'story_mission') return '🗺️';
    return '▶';
  }

  function availabilityLabel(entry: ExperienceDiscoveryDescriptor): string {
    return entry.availability === 'partial' ? ' · Preview' : '';
  }

  function showEverything(): void {
    onQueryChange('');
    onFilterChange('all');
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

  <nav class="filter-strip" aria-label="Browse by activity type">
    {#each filters as option}
      <button
        type="button"
        class:active={filter === option.id}
        data-nav100-filter={option.id}
        aria-pressed={filter === option.id}
        onclick={() => onFilterChange(option.id)}
      >
        <span aria-hidden="true">{option.marker}</span>
        <strong>{option.label}</strong>
      </button>
    {/each}
  </nav>

  <label class="search-box">
    <span class="sr-only">Search activities by name</span>
    <span aria-hidden="true">🔎</span>
    <input
      value={query}
      oninput={(event) => onQueryChange(event.currentTarget.value)}
      type="search"
      placeholder="Try Bicycle, Earth, story…"
      autocomplete="off"
    />
  </label>

  <div class="result-meta" aria-live="polite">
    {filtered.length} {filtered.length === 1 ? 'activity' : 'activities'}
  </div>

  {#if filtered.length === 0}
    <section class="empty">
      <strong>{normalizedQuery ? 'Nothing with that name here yet.' : 'Nothing in this group yet.'}</strong>
      <span>{normalizedQuery ? 'Try a shorter word or another group.' : 'Choose another group or show everything.'}</span>
      <button type="button" onclick={showEverything}>Show everything</button>
    </section>
  {:else}
    <section class="results" aria-label="Available activities">
      {#each visible as entry (entry.canonicalId)}
        <button class="result-card" data-canonical-id={entry.canonicalId} type="button" onclick={() => onSelect(entry)}>
          <span class="result-card__marker" data-nav100-marker="true" aria-hidden="true">{kindMarker(entry)}</span>
          <span class="result-card__copy">
            <small>{kindLabel(entry.kind)}{availabilityLabel(entry)}</small>
            <strong>{entry.childTitle}</strong>
          </span>
          <span class="result-card__arrow" aria-hidden="true">›</span>
        </button>
      {/each}
    </section>

    {#if filtered.length > visible.length}
      <p class="more-note">Showing the first {visible.length}. Search by name or choose a group to narrow the list.</p>
    {/if}
  {/if}
</main>

<style>
  .browse{width:min(940px,100%);min-height:calc(100dvh - 42px);margin:auto;padding:clamp(12px,3vw,26px);box-sizing:border-box;background:#f6fbff;color:#17324d}.browse__header{display:flex;gap:12px;align-items:center;margin-bottom:12px}.back{width:48px;height:48px;border-radius:15px;border:2px solid #17324d;background:white;color:#17324d;font:inherit;font-size:1.5rem;font-weight:800;cursor:pointer}.eyebrow{font-size:.7rem;font-weight:900;letter-spacing:.08em}.browse h1{margin:.15rem 0 0;font-size:clamp(1.45rem,5vw,2rem)}.filter-strip{display:flex;gap:7px;overflow-x:auto;padding:2px 2px 9px;scrollbar-width:thin}.filter-strip button{flex:0 0 auto;min-height:48px;padding:7px 12px;border:2px solid rgba(23,50,77,.14);border-radius:15px;background:white;color:#17324d;font:inherit;display:flex;align-items:center;gap:7px;cursor:pointer}.filter-strip button.active{border-color:#17324d;background:#17324d;color:white}.filter-strip button span{font-size:1.2rem}.filter-strip button strong{font-size:.83rem}.search-box{min-height:58px;padding:0 16px;border:2px solid #7a91a8;border-radius:18px;background:white;display:flex;gap:10px;align-items:center}.search-box input{width:100%;border:0;outline:0;background:transparent;color:inherit;font:inherit;font-size:1.05rem}.result-meta{padding:9px 4px 7px;color:#526b82;font-weight:700}.results{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.result-card{min-height:76px;padding:10px 12px;border:2px solid rgba(23,50,77,.14);border-radius:17px;background:white;color:inherit;display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:11px;text-align:left;cursor:pointer}.result-card__marker{width:42px;height:42px;display:grid;place-items:center;border-radius:13px;background:#fff4d8;font-size:1.35rem}.result-card__copy{display:flex;flex-direction:column;gap:4px;min-width:0}.result-card small{color:#61788d;font-weight:800}.result-card strong{font-size:1rem}.result-card__arrow{font-size:1.7rem}.empty{padding:24px;border-radius:18px;background:white;border:2px solid rgba(23,50,77,.14);display:flex;flex-direction:column;gap:9px;align-items:flex-start}.empty button{min-height:44px;padding:0 14px;border:0;border-radius:12px;background:#17324d;color:white;font:inherit;font-weight:800;cursor:pointer}.more-note{margin:12px 2px;color:#526b82}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}.back:focus-visible,.filter-strip button:focus-visible,.result-card:focus-visible,.empty button:focus-visible,.search-box:focus-within{outline:4px solid #ffb02e;outline-offset:3px}@media(max-width:560px){.results{grid-template-columns:1fr}.browse{padding:12px}.browse__header{margin-bottom:10px}.filter-strip{margin-inline:-2px}.result-card{min-height:70px;padding:8px 10px}.result-card__marker{width:40px;height:40px}}
</style>
