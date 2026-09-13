<script lang="ts">
  import type { ExperienceDiscoveryDescriptor } from '../../experienceDiscovery';

  let {
    childName,
    entries,
    loading = false,
    error = null,
    onSelect,
    onBrowse
  }: {
    childName: string;
    entries: ExperienceDiscoveryDescriptor[];
    loading?: boolean;
    error?: string | null;
    onSelect: (entry: ExperienceDiscoveryDescriptor) => void;
    onBrowse: () => void;
  } = $props();

  const displayName = $derived(childName.trim() || 'Dheu');
  const visible = $derived(entries.filter((entry) => entry.availability === 'available'));
  const story = $derived(visible.find((entry) => entry.canonicalId === 'story.dheu.moonlit-leaf') ?? visible.find((entry) => entry.kind === 'story'));
  const topic = $derived(visible.find((entry) => entry.canonicalId === 'learn.earth') ?? visible.find((entry) => entry.kind === 'learn_about_topic'));
  const workshop = $derived(visible.find((entry) => entry.canonicalId === 'experience.bicycle-workshop.guided.v1') ?? visible.find((entry) => entry.kind === 'guided_workshop'));
  const phonics = $derived(visible.find((entry) => entry.canonicalId === 'phonics.sound-trail.v1') ?? visible.find((entry) => entry.kind === 'phonics_adventure'));
  const studio = $derived(visible.find((entry) => entry.canonicalId === 'studio.fractions.equal-shares') ?? visible.find((entry) => entry.kind === 'learning_studio'));

  const lanes = $derived([
    {
      id: 'games',
      label: 'Big games',
      note: 'Longer adventures and workshops',
      emoji: '🎮',
      entry: workshop
    },
    {
      id: 'discover',
      label: 'Discover',
      note: 'Explore Earth and other topics',
      emoji: '🔎',
      entry: topic
    },
    {
      id: 'lab',
      label: 'Scientu’s Lab',
      note: 'Hands-on models and experiments',
      emoji: '🧪',
      entry: studio
    },
    {
      id: 'words',
      label: 'Words & sounds',
      note: 'Sound, spelling and word play',
      emoji: '🔤',
      entry: phonics
    },
    {
      id: 'stories',
      label: 'Stories',
      note: 'Read and listen at your pace',
      emoji: '📚',
      entry: story
    }
  ]);
</script>

<main class="prototype-home" data-nav100-prototype="true">
  <header class="prototype-home__topbar">
    <div>
      <span class="prototype-tag">NAVIGATION PROTOTYPE</span>
      <h1>What do you want to do, {displayName}?</h1>
    </div>
  </header>

  {#if loading}
    <section class="prototype-card prototype-card--status" role="status">Finding your activities…</section>
  {:else if error}
    <section class="prototype-card prototype-card--status" role="alert">
      <strong>Could not load the prototype catalogue.</strong>
      <span>{error}</span>
    </section>
  {:else if visible.length === 0}
    <section class="prototype-card prototype-card--status">
      <strong>No activities are available here yet.</strong>
      <button type="button" onclick={onBrowse}>Browse all</button>
    </section>
  {:else}
    <section class="lane-grid" aria-label="Choose a kind of play">
      {#each lanes as lane}
        <button
          type="button"
          class="lane-card"
          data-nav100-lane={lane.id}
          data-canonical-id={lane.entry?.canonicalId}
          disabled={!lane.entry}
          onclick={() => lane.entry && onSelect(lane.entry)}
        >
          <span class="lane-card__emoji" aria-hidden="true">{lane.emoji}</span>
          <span class="lane-card__copy">
            <strong>{lane.label}</strong>
            <small>{lane.note}</small>
          </span>
          <span class="lane-card__arrow" aria-hidden="true">›</span>
        </button>
      {/each}
    </section>

    <button class="browse-all" type="button" onclick={onBrowse}>
      <span>Find another activity</span>
      <strong>Browse all</strong>
    </button>
  {/if}
</main>

<style>
  .prototype-home{width:min(940px,100%);min-height:calc(100dvh - 42px);margin:auto;padding:clamp(14px,3vw,28px);display:flex;flex-direction:column;gap:16px;box-sizing:border-box;background:linear-gradient(180deg,#fff8ea 0%,#f5fbff 100%);color:#17324d}.prototype-home__topbar{display:flex;justify-content:space-between;align-items:flex-start}.prototype-tag{font-size:.72rem;font-weight:800;letter-spacing:.08em;display:inline-block;padding:5px 8px;border-radius:999px;background:#fff;border:2px solid #17324d}.prototype-home h1{font-size:clamp(1.55rem,5vw,2.4rem);line-height:1.05;margin:.5rem 0 0;max-width:16ch}.prototype-card button{min-height:48px;padding:0 18px;border:0;border-radius:16px;font:inherit;font-weight:800;background:white;color:#17324d;cursor:pointer}.lane-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.lane-card{min-height:118px;padding:16px;border:2px solid rgba(23,50,77,.16);border-radius:22px;background:white;color:inherit;text-align:left;display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:center;cursor:pointer;box-shadow:0 5px 0 rgba(23,50,77,.08)}.lane-card:disabled{opacity:.45;cursor:not-allowed}.lane-card__emoji{font-size:2rem}.lane-card__copy{display:flex;flex-direction:column;gap:5px}.lane-card__copy strong{font-size:1.05rem}.lane-card__copy small{font-size:.86rem;line-height:1.25;color:#46627d}.lane-card__arrow{font-size:2rem}.browse-all{width:100%;min-height:64px;padding:12px 18px;border:2px dashed #5b7690;border-radius:18px;background:rgba(255,255,255,.72);color:#17324d;display:flex;justify-content:space-between;align-items:center;font:inherit;cursor:pointer}.prototype-card--status{padding:22px;border-radius:20px;background:white;border:2px solid rgba(23,50,77,.14);display:flex;flex-direction:column;gap:10px}.lane-card:focus-visible,.browse-all:focus-visible,.prototype-card button:focus-visible{outline:4px solid #ffb02e;outline-offset:3px}@media(min-width:561px){.lane-card:last-child{grid-column:1/-1}}@media(max-width:560px){.prototype-home{gap:12px;padding:12px}.lane-grid{grid-template-columns:1fr}.lane-card{min-height:82px}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}
</style>
