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

  function choosePrimary(items: ExperienceDiscoveryDescriptor[]): ExperienceDiscoveryDescriptor | undefined {
    return items.find((entry) => entry.canonicalId === 'experience.bicycle-workshop.guided.v1')
      ?? items.find((entry) => entry.kind === 'guided_workshop')
      ?? items.find((entry) => entry.kind === 'story')
      ?? items[0];
  }

  function chooseAlternatives(
    items: ExperienceDiscoveryDescriptor[],
    primary: ExperienceDiscoveryDescriptor | undefined
  ): ExperienceDiscoveryDescriptor[] {
    const preferredIds = [
      'learn.earth',
      'story.dheu.moonlit-leaf',
      'phonics.sound-trail.v1'
    ];
    const seen = new Set(primary ? [primary.canonicalId] : []);
    const chosen: ExperienceDiscoveryDescriptor[] = [];

    for (const canonicalId of preferredIds) {
      const entry = items.find((candidate) => candidate.canonicalId === canonicalId);
      if (!entry || seen.has(entry.canonicalId)) continue;
      seen.add(entry.canonicalId);
      chosen.push(entry);
    }

    for (const entry of items) {
      if (chosen.length >= 3) break;
      if (seen.has(entry.canonicalId)) continue;
      seen.add(entry.canonicalId);
      chosen.push(entry);
    }

    return chosen.slice(0, 3);
  }

  function choiceNote(entry: ExperienceDiscoveryDescriptor): string {
    switch (entry.kind) {
      case 'story': return 'Read or listen at your pace';
      case 'phonics_adventure': return 'Listen, notice and play with sounds';
      case 'learn_about_topic': return 'Look closely and discover a topic';
      case 'learning_studio': return 'Try a hands-on learning model';
      case 'guided_workshop': return 'A longer guided adventure';
      case 'story_mission':
      case 'world_action': return 'Do something inside the story world';
      default: return 'Open this activity';
    }
  }

  function choiceMarker(entry: ExperienceDiscoveryDescriptor): string {
    if (entry.canonicalId === 'experience.bicycle-workshop.guided.v1') return '🚲';
    if (entry.canonicalId === 'learn.earth') return '🌍';
    switch (entry.kind) {
      case 'guided_workshop': return '🎮';
      case 'story': return '📖';
      case 'phonics_adventure': return '🔊';
      case 'learn_about_topic': return '🔎';
      case 'learning_studio': return '🧪';
      case 'story_mission':
      case 'world_action': return '🗺️';
      default: return '▶';
    }
  }

  function primaryLabel(entry: ExperienceDiscoveryDescriptor): string {
    switch (entry.kind) {
      case 'guided_workshop': return 'BIG ADVENTURE';
      case 'story': return 'STORY';
      case 'phonics_adventure': return 'SOUND PLAY';
      case 'learn_about_topic': return 'DISCOVER';
      case 'learning_studio': return 'TRY IT';
      case 'story_mission':
      case 'world_action': return 'WORLD ADVENTURE';
      default: return 'START HERE';
    }
  }

  const primary = $derived(choosePrimary(visible));
  const alternatives = $derived(chooseAlternatives(visible, primary));
</script>

<main class="prototype-home" data-nav100-prototype="true">
  <header class="prototype-home__topbar">
    <span class="prototype-tag">NAVIGATION PROTOTYPE</span>
    <h1>What should we do, {displayName}?</h1>
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
    {#if primary}
      <section class="hero-zone" aria-label="Start with an activity">
        <button
          type="button"
          class="hero-card"
          data-nav100-primary="true"
          data-canonical-id={primary.canonicalId}
          onclick={() => onSelect(primary)}
        >
          <span class="hero-card__marker" data-nav100-marker="true" aria-hidden="true">{choiceMarker(primary)}</span>
          <span class="hero-card__copy">
            <small>{primaryLabel(primary)}</small>
            <strong>{primary.childTitle}</strong>
            <span>{choiceNote(primary)}</span>
          </span>
          <span class="hero-card__go" aria-hidden="true">Go ›</span>
        </button>
      </section>
    {/if}

    {#if alternatives.length > 0}
      <section class="choice-zone" aria-labelledby="more-choices-heading">
        <h2 id="more-choices-heading">Or pick something different</h2>
        <div class="choice-grid">
          {#each alternatives as entry}
            <button
              type="button"
              class="choice-card"
              data-nav100-choice="true"
              data-canonical-id={entry.canonicalId}
              onclick={() => onSelect(entry)}
            >
              <span class="choice-card__marker" data-nav100-marker="true" aria-hidden="true">{choiceMarker(entry)}</span>
              <span class="choice-card__copy">
                <strong>{entry.childTitle}</strong>
                <small>{choiceNote(entry)}</small>
              </span>
              <span class="choice-card__arrow" aria-hidden="true">›</span>
            </button>
          {/each}
        </div>
      </section>
    {/if}

    <button class="browse-all" type="button" onclick={onBrowse}>
      <span>Looking for something else?</span>
      <strong>Browse all</strong>
    </button>
  {/if}
</main>

<style>
  .prototype-home{width:min(940px,100%);min-height:100dvh;margin:auto;padding:clamp(12px,3vw,26px);display:flex;flex-direction:column;gap:14px;box-sizing:border-box;background:linear-gradient(180deg,#fff8ea 0%,#f5fbff 100%);color:#17324d}.prototype-home__topbar{display:flex;flex-direction:column;align-items:flex-start;gap:8px}.prototype-tag{font-size:.68rem;font-weight:800;letter-spacing:.08em;display:inline-block;padding:4px 8px;border-radius:999px;background:#fff;border:2px solid #17324d}.prototype-home h1{font-size:clamp(1.45rem,5vw,2.25rem);line-height:1.05;margin:0;max-width:20ch}.prototype-card button,.hero-card,.choice-card,.browse-all{font:inherit;color:#17324d;cursor:pointer}.hero-card{width:100%;min-height:150px;padding:18px;border:0;border-radius:26px;background:#17324d;color:white;text-align:left;display:grid;grid-template-columns:auto 1fr auto;gap:15px;align-items:center;box-shadow:0 7px 0 rgba(23,50,77,.16)}.hero-card__marker{width:62px;height:62px;display:grid;place-items:center;border-radius:20px;background:#fff7dc;font-size:2.25rem}.hero-card__copy{display:flex;flex-direction:column;gap:5px;min-width:0}.hero-card__copy small{font-size:.68rem;font-weight:900;letter-spacing:.1em;color:#ffe29a}.hero-card__copy strong{font-size:clamp(1.3rem,4.5vw,1.85rem);line-height:1.05}.hero-card__copy span{font-size:.86rem;color:#dcecff}.hero-card__go{font-weight:900;white-space:nowrap}.choice-zone{display:flex;flex-direction:column;gap:9px}.choice-zone h2{margin:0;font-size:1rem}.choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.choice-card{min-height:88px;padding:12px;border:2px solid rgba(23,50,77,.16);border-radius:19px;background:white;text-align:left;display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:10px;align-items:center;box-shadow:0 4px 0 rgba(23,50,77,.07)}.choice-card__marker{width:40px;height:40px;display:grid;place-items:center;border-radius:13px;background:#fff4d8;font-size:1.35rem}.choice-card__copy{display:flex;flex-direction:column;gap:4px;min-width:0}.choice-card strong{font-size:.98rem;line-height:1.1}.choice-card small{font-size:.78rem;line-height:1.2;color:#4b6782}.choice-card__arrow{font-size:1.4rem;color:#61788d}.browse-all{width:100%;min-height:56px;padding:10px 16px;border:2px dashed #5b7690;border-radius:17px;background:rgba(255,255,255,.72);display:flex;justify-content:space-between;align-items:center;gap:12px}.browse-all span{font-size:.86rem;color:#46627d}.prototype-card--status{padding:22px;border-radius:20px;background:white;border:2px solid rgba(23,50,77,.14);display:flex;flex-direction:column;gap:10px}.prototype-card button{min-height:48px;padding:0 18px;border:0;border-radius:16px;background:white;font-weight:800}.hero-card:focus-visible,.choice-card:focus-visible,.browse-all:focus-visible,.prototype-card button:focus-visible{outline:4px solid #ffb02e;outline-offset:3px}@media(max-width:560px){.prototype-home{gap:11px;padding:11px}.hero-card{min-height:132px;padding:14px;border-radius:22px}.hero-card__marker{width:52px;height:52px;border-radius:17px;font-size:1.9rem}.choice-grid{grid-template-columns:1fr;gap:7px}.choice-card{min-height:64px;padding:8px 10px}.choice-card__marker{width:38px;height:38px}.choice-card small{font-size:.74rem}.browse-all{min-height:52px}}@media(max-height:620px) and (orientation:landscape){.prototype-home{min-height:auto}.prototype-tag{display:none}.prototype-home h1{font-size:1.25rem}.hero-card{min-height:86px;padding:10px 14px}.hero-card__marker{width:44px;height:44px;font-size:1.55rem}.choice-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.choice-card{min-height:64px}.browse-all{min-height:48px}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}
</style>
