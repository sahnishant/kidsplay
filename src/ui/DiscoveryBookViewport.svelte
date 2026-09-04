<script lang="ts">
  import {
    DISCOVERY_BOOK_COLLECTIONS,
    projectDheuDiscoveryBook,
    type DiscoveryBookCollectionId,
    type DiscoveryBookItem
  } from '../experience/discoveryBookProduction';
  import SemanticVisualPresenter from '../presentation/SemanticVisualPresenter.svelte';
  import { vocabularyVisualPresentation } from '../presentation/semanticVisualPresentation';
  import { resolveVisualMeaningPresentationForKnowledgeRefs } from '../presentation/vocabularyPresentation';
  import { loadChildAudioPreferences, playChildAudio } from '../runtime/childAudio';
  import type { ProgressSnapshot } from '../runtime/localProgress';
  import type { StoryProgressSnapshot } from '../story/storyProgress';

  let {
    progress,
    storyProgress,
    childName = '',
    onExit
  }: {
    progress: ProgressSnapshot;
    storyProgress: StoryProgressSnapshot;
    childName?: string;
    onExit: () => void;
  } = $props();

  let activeCollection = $state<DiscoveryBookCollectionId>('animals');
  let book = $derived(projectDheuDiscoveryBook(progress, storyProgress));
  let currentItems = $derived(book.collections[activeCollection]);
  let displayName = $derived(childName.trim() || 'Dheu');
  let audioEnabled = $derived(loadChildAudioPreferences().enabled);

  function visualFor(item: DiscoveryBookItem) {
    return resolveVisualMeaningPresentationForKnowledgeRefs(item.canonicalRefs, { phase: 'explanation' });
  }

  function speak(item: DiscoveryBookItem): void {
    if (!item.pronunciationText || !audioEnabled) return;
    void playChildAudio({
      channel: 'vocabulary',
      text: item.pronunciationText,
      language: 'en-IN',
      enabled: audioEnabled
    });
  }
</script>

<main class="discovery-book" aria-label="Dheu Discovery Book">
  <header class="book-topbar">
    <button class="back" type="button" aria-label="Back to Dheu's world" onclick={onExit}>←</button>
    <div>
      <span class="eyebrow">{displayName}'s finds</span>
      <h1>Dheu Discovery Book</h1>
    </div>
  </header>

  <nav class="collections" aria-label="Discovery collections">
    {#each DISCOVERY_BOOK_COLLECTIONS as collection}
      <button
        type="button"
        class:active={activeCollection === collection.id}
        aria-current={activeCollection === collection.id ? 'page' : undefined}
        onclick={() => activeCollection = collection.id}
      >
        {collection.label}
      </button>
    {/each}
  </nav>

  <section class="book-page" aria-live="polite">
    <header class="page-heading">
      <h2>{DISCOVERY_BOOK_COLLECTIONS.find((item) => item.id === activeCollection)?.label}</h2>
      <p>{currentItems.length ? 'Things you really discovered on your adventures.' : 'Nothing here yet. Keep exploring.'}</p>
    </header>

    {#if currentItems.length}
      <div class="discoveries">
        {#each currentItems as item (item.id)}
          {@const visual = visualFor(item)}
          <article class:mail-card={item.collection === 'mail'} class="discovery-card" data-discovery-id={item.id}>
            {#if visual.visualAllowed}
              <div class="semantic-visual" aria-label={`Reviewed visual for ${item.title}`}>
                <SemanticVisualPresenter presentation={vocabularyVisualPresentation(visual.senseKey, true)} />
              </div>
            {/if}

            <div class="card-copy">
              <h3>{item.title}</h3>
              {#if item.fieldNote}
                <p>{item.fieldNote}</p>
              {:else}
                <p class="provenance">
                  {item.discoveredFrom.source === 'story_mission' ? 'Found on an adventure' : 'Found while playing'}
                </p>
              {/if}

              {#if item.pronunciationText}
                <button
                  class="hear"
                  type="button"
                  disabled={!audioEnabled}
                  aria-label={audioEnabled ? `Hear ${item.title}` : `Sound is off for ${item.title}`}
                  onclick={() => speak(item)}
                >
                  {audioEnabled ? `Hear ${item.title}` : 'Sound off'}
                </button>
              {/if}
            </div>
          </article>
        {/each}
      </div>
    {:else}
      <div class="empty-page" role="status">
        <strong>Your next discovery will appear here.</strong>
        <span>Replay does not make extra copies. New finds come from real learning and adventures.</span>
      </div>
    {/if}
  </section>
</main>

<style>
  .discovery-book{width:min(900px,100%);height:100%;margin:auto;display:grid;grid-template-rows:auto auto minmax(0,1fr);gap:8px;overflow:hidden;color:var(--ink)}
  .book-topbar{min-height:58px;display:flex;align-items:center;gap:10px;padding:6px 10px;border:1px solid #24303a17;border-radius:18px;background:#fffffff2}.back{width:44px;height:44px;flex:none;border:0;border-radius:14px;background:var(--accent-soft);color:var(--accent);font:inherit;font-size:1.2rem;font-weight:950;cursor:pointer}.eyebrow{display:block;color:var(--accent);font-size:.62rem;font-weight:950;letter-spacing:.08em;text-transform:uppercase}.book-topbar h1{margin:2px 0 0;font-size:clamp(1.05rem,4vw,1.4rem);line-height:1}
  .collections{display:flex;gap:6px;overflow-x:auto;padding:1px 2px 4px;scrollbar-width:thin}.collections button{min-height:42px;flex:0 0 auto;padding:7px 12px;border:1px solid #24303a20;border-radius:999px;background:#fff;color:var(--ink);font:inherit;font-size:.75rem;font-weight:900;cursor:pointer}.collections button.active{border-color:var(--accent);background:var(--accent-soft);color:var(--accent)}
  .book-page{min-height:0;overflow:auto;padding:12px;border:1px solid #24303a16;border-radius:20px;background:#fffdf8}.page-heading h2{margin:0;font-size:1.15rem}.page-heading p{margin:4px 0 12px;color:var(--muted);font-size:.8rem}.discoveries{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.discovery-card{min-height:155px;display:grid;grid-template-columns:minmax(0,112px) minmax(0,1fr);gap:10px;align-items:center;padding:10px;border:1px solid #24303a16;border-radius:18px;background:#fff}.discovery-card.mail-card{grid-template-columns:1fr;background:#fff8e9}.semantic-visual{min-height:100px;max-height:120px;overflow:hidden;border-radius:14px;background:#f7fafb}.card-copy{min-width:0}.card-copy h3{margin:0;font-size:1rem;line-height:1.1}.card-copy p{margin:7px 0 0;color:var(--muted);font-size:.76rem;line-height:1.35}.provenance{font-weight:750}.hear{min-height:42px;margin-top:10px;padding:7px 11px;border:0;border-radius:12px;background:var(--accent);color:#fff;font:inherit;font-size:.75rem;font-weight:900;cursor:pointer}.hear:disabled{background:#e5e8ea;color:#69757e;cursor:default}.empty-page{min-height:180px;display:grid;place-content:center;gap:7px;padding:18px;text-align:center;border:2px dashed #24303a20;border-radius:18px;color:var(--muted)}.empty-page strong{color:var(--ink)}.empty-page span{max-width:30rem;font-size:.78rem;line-height:1.4}
  @media(max-width:650px){.discovery-book{gap:6px}.book-page{padding:9px}.discoveries{grid-template-columns:1fr}.discovery-card{min-height:140px}.collections button{min-height:44px}.page-heading p{margin-bottom:9px}}
  @media(prefers-reduced-motion:reduce){.collections{scroll-behavior:auto}}
</style>
