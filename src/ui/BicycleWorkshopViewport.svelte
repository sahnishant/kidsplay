<script lang="ts">
  import guideJson from '../../content/experience/bicycle-workshop-guided.json';
  import SemanticVisualPresenter from '../presentation/SemanticVisualPresenter.svelte';
  import {
    animationVisualPresentation,
    resolveItemVisualPresentation,
    type SemanticVisualPresentation
  } from '../presentation/semanticVisualPresentation';

  interface GuideBeat {
    id: string;
    text: string;
    claimRefs?: string[];
    capabilityRefs?: string[];
  }

  interface GuideSection {
    id: string;
    order: number;
    eyebrow: string;
    title: string;
    animationRef?: string;
    visualRef?: string;
    visualLabel: string;
    beats: GuideBeat[];
    childPrompt: string;
  }

  interface GuidedExperience {
    childTitle: string;
    subtitle: string;
    sections: GuideSection[];
  }

  let {
    onExit,
    onPractice,
    onChapterCheck
  }: {
    onExit: () => void;
    onPractice: () => void;
    onChapterCheck: () => void;
  } = $props();

  const guide = guideJson as GuidedExperience;
  let activeIndex = $state(0);
  let section = $derived(guide.sections[activeIndex]);
  let isFirst = $derived(activeIndex === 0);
  let isLast = $derived(activeIndex === guide.sections.length - 1);
  let visualPresentation = $derived<SemanticVisualPresentation | null>(
    section.animationRef
      ? animationVisualPresentation(section.animationRef, { embedded: true, decorative: false })
      : section.visualRef
        ? resolveItemVisualPresentation(
            { label: section.visualLabel, visualRefs: [section.visualRef] },
            { allowLabelInference: false, context: 'dashboard', decorative: false }
          )
        : null
  );

  function previous(): void {
    activeIndex = Math.max(0, activeIndex - 1);
  }

  function next(): void {
    activeIndex = Math.min(guide.sections.length - 1, activeIndex + 1);
  }

  function chooseSection(index: number): void {
    activeIndex = Math.max(0, Math.min(guide.sections.length - 1, index));
  }
</script>

<main class="workshop" data-workshop-section={section.id}>
  <header class="workshop__topbar">
    <button class="workshop__back" type="button" onclick={onExit} aria-label="Back to play">←</button>
    <div class="workshop__heading">
      <small>CLASS 2 ENGLISH · CHAPTER COMPANION</small>
      <h1>{guide.childTitle}</h1>
      <p>{guide.subtitle}</p>
    </div>
    <span class="workshop__count" aria-label={`Step ${activeIndex + 1} of ${guide.sections.length}`}>
      {activeIndex + 1}/{guide.sections.length}
    </span>
  </header>

  <nav class="workshop__steps" aria-label="Bicycle Workshop learning sections">
    {#each guide.sections as item, index}
      <button
        class="workshop__step"
        type="button"
        class:workshop__step--active={index === activeIndex}
        aria-current={index === activeIndex ? 'step' : undefined}
        aria-label={`Open step ${index + 1}: ${item.title}`}
        onclick={() => chooseSection(index)}
      >
        <span>{index + 1}</span>
        <small>{item.id === 'movement' ? 'Move' : item.id === 'reading' ? 'Read' : item.id}</small>
      </button>
    {/each}
  </nav>

  <section class="workshop__body" aria-labelledby="workshop-section-title">
    <article class="workshop__lesson">
      <div class="workshop__lesson-heading">
        <small>{section.eyebrow}</small>
        <h2 id="workshop-section-title">{section.title}</h2>
      </div>

      <div class="workshop__visual">
        {#if visualPresentation}
          <SemanticVisualPresenter presentation={visualPresentation} class="workshop__visual-presentation" />
        {:else}
          <div class="workshop__visual-fallback" role="img" aria-label={section.visualLabel}>
            <span aria-hidden="true">🚲</span>
            <strong>{section.visualLabel}</strong>
          </div>
        {/if}
      </div>

      <div class="workshop__beats">
        {#each section.beats as beat, beatIndex}
          <div
            class="workshop__beat"
            data-claim-count={beat.claimRefs?.length ?? 0}
            data-capability-count={beat.capabilityRefs?.length ?? 0}
          >
            <span aria-hidden="true">{beatIndex + 1}</span>
            <p>{beat.text}</p>
          </div>
        {/each}
      </div>

      <aside class="workshop__try" aria-label="Try it without scoring">
        <strong>TRY IT</strong>
        <p>{section.childPrompt}</p>
        <small>Exploring this page does not change your score.</small>
      </aside>
    </article>
  </section>

  <footer class="workshop__footer">
    <button class="workshop__secondary" type="button" onclick={previous} disabled={isFirst}>Previous</button>
    {#if !isLast}
      <button class="workshop__primary" type="button" onclick={next}>Next part</button>
    {:else}
      <div class="workshop__finish-actions">
        <button class="workshop__secondary workshop__secondary--strong" type="button" onclick={onPractice}>Practice</button>
        <button class="workshop__primary" type="button" onclick={onChapterCheck}>Chapter check</button>
      </div>
    {/if}
  </footer>
</main>

<style>
  :global(.bicycle-workshop-host) {
    width: 100%;
    height: 100%;
    min-height: 0;
    display: grid;
    overflow: hidden;
  }

  .workshop {
    width: min(820px, 100%);
    height: 100%;
    min-height: 0;
    margin: auto;
    display: grid;
    grid-template-rows: auto auto minmax(0, 1fr) auto;
    gap: 7px;
    overflow: hidden;
    color: var(--ink);
  }

  .workshop__topbar {
    min-height: 58px;
    display: grid;
    grid-template-columns: 44px minmax(0, 1fr) auto;
    align-items: center;
    gap: 9px;
    padding: 5px 8px;
    border: 1px solid #24303a18;
    border-radius: 16px;
    background: #fffffff2;
  }

  .workshop__back {
    width: 40px;
    height: 40px;
    border: 0;
    border-radius: 12px;
    background: var(--accent-soft);
    color: var(--accent);
    font: inherit;
    font-size: 1.1rem;
    font-weight: 950;
    cursor: pointer;
  }

  .workshop__heading { min-width: 0; }
  .workshop__heading small,
  .workshop__lesson-heading small,
  .workshop__try strong {
    color: var(--accent);
    font-size: .57rem;
    font-weight: 950;
    letter-spacing: .08em;
  }

  .workshop__heading h1 {
    margin: 1px 0 0;
    font-size: clamp(1rem, 4vw, 1.3rem);
    line-height: 1;
  }

  .workshop__heading p {
    margin: 2px 0 0;
    overflow: hidden;
    color: var(--muted);
    font-size: .68rem;
    font-weight: 750;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .workshop__count {
    min-width: 42px;
    padding: 7px 8px;
    border-radius: 999px;
    background: #eef6ff;
    color: var(--accent);
    font-size: .72rem;
    font-weight: 950;
    text-align: center;
  }

  .workshop__steps {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 5px;
  }

  .workshop__step {
    min-width: 0;
    min-height: 44px;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    gap: 4px;
    padding: 4px 6px;
    border: 1px solid #24303a18;
    border-radius: 12px;
    background: #fff;
    color: var(--muted);
    font: inherit;
    cursor: pointer;
  }

  .workshop__step span {
    width: 22px;
    height: 22px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: #eef1f3;
    font-size: .65rem;
    font-weight: 950;
  }

  .workshop__step small {
    overflow: hidden;
    font-size: .55rem;
    font-weight: 900;
    text-overflow: ellipsis;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .workshop__step--active {
    border-color: var(--accent);
    background: var(--accent-soft);
    color: var(--accent);
  }

  .workshop__step--active span {
    background: var(--accent);
    color: #fff;
  }

  .workshop__body {
    min-height: 0;
    overflow: auto;
  }

  .workshop__lesson {
    min-height: 100%;
    display: grid;
    grid-template-columns: minmax(210px, .86fr) minmax(240px, 1.14fr);
    grid-template-rows: auto minmax(0, 1fr) auto;
    gap: 9px 12px;
    padding: 12px;
    border: 1px solid #24303a18;
    border-radius: 20px;
    background: #fffffff2;
  }

  .workshop__lesson-heading { grid-column: 1 / -1; }
  .workshop__lesson-heading h2 {
    margin: 2px 0 0;
    font-size: clamp(1.08rem, 4.5vw, 1.5rem);
    line-height: 1.05;
  }

  .workshop__visual {
    min-height: 190px;
    display: grid;
    place-items: center;
    overflow: hidden;
    border: 1px solid #24303a14;
    border-radius: 18px;
    background: linear-gradient(145deg, #f8fbff, #fffaf1);
  }

  .workshop__visual :global(.workshop__visual-presentation),
  .workshop__visual :global([data-semantic-visual-kind='entities']) {
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
  }

  .workshop__visual :global(.visual-entity),
  .workshop__visual :global(.visual-entity__art) {
    width: 100%;
    height: 100%;
  }

  .workshop__visual :global(svg) {
    width: 100%;
    height: 100%;
    max-height: 220px;
  }

  .workshop__visual-fallback {
    min-height: 180px;
    display: grid;
    place-items: center;
    align-content: center;
    gap: 8px;
    padding: 16px;
    text-align: center;
  }

  .workshop__visual-fallback span { font-size: 4rem; }
  .workshop__visual-fallback strong { font-size: .8rem; }

  .workshop__beats {
    display: grid;
    align-content: center;
    gap: 8px;
  }

  .workshop__beat {
    min-height: 58px;
    display: grid;
    grid-template-columns: 30px minmax(0, 1fr);
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border-radius: 14px;
    background: #f7f9fa;
  }

  .workshop__beat > span {
    width: 28px;
    height: 28px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: #fff;
    color: var(--accent);
    font-size: .7rem;
    font-weight: 950;
    box-shadow: 0 2px 8px #24303a12;
  }

  .workshop__beat p,
  .workshop__try p {
    margin: 0;
    font-size: clamp(.82rem, 2.6vw, .96rem);
    font-weight: 760;
    line-height: 1.32;
  }

  .workshop__try {
    grid-column: 1 / -1;
    padding: 9px 11px;
    border: 1px dashed #e2a93d;
    border-radius: 14px;
    background: #fff9e9;
  }

  .workshop__try p { margin-top: 3px; }
  .workshop__try small {
    display: block;
    margin-top: 4px;
    color: var(--muted);
    font-size: .62rem;
    font-weight: 750;
  }

  .workshop__footer {
    min-height: 52px;
    display: grid;
    grid-template-columns: minmax(96px, .45fr) minmax(160px, 1fr);
    gap: 8px;
  }

  .workshop__finish-actions {
    display: grid;
    grid-template-columns: 1fr 1.25fr;
    gap: 8px;
  }

  .workshop__primary,
  .workshop__secondary {
    min-height: 50px;
    border-radius: 14px;
    font: inherit;
    font-weight: 950;
    cursor: pointer;
  }

  .workshop__primary {
    border: 0;
    background: var(--accent);
    color: #fff;
  }

  .workshop__secondary {
    border: 2px solid var(--line);
    background: #fff;
    color: var(--ink);
  }

  .workshop__secondary--strong {
    border-color: var(--accent);
    color: var(--accent);
  }

  .workshop__secondary:disabled {
    cursor: default;
    opacity: .38;
  }

  button:focus-visible {
    outline: 3px solid var(--accent);
    outline-offset: 2px;
  }

  @media (max-width: 650px) {
    .workshop { gap: 5px; }
    .workshop__steps { overflow-x: auto; grid-template-columns: repeat(7, minmax(54px, 1fr)); }
    .workshop__step { grid-template-columns: 1fr; place-items: center; gap: 1px; }
    .workshop__lesson { grid-template-columns: 1fr; grid-template-rows: auto auto auto auto; padding: 9px; }
    .workshop__lesson-heading,
    .workshop__try { grid-column: 1; }
    .workshop__visual { min-height: 155px; max-height: 30dvh; }
    .workshop__beat { min-height: 52px; }
    .workshop__footer { grid-template-columns: 92px minmax(0, 1fr); }
  }

  @media (max-width: 430px) {
    .workshop__heading p { display: none; }
    .workshop__finish-actions { grid-template-columns: 1fr 1fr; }
    .workshop__primary,
    .workshop__secondary { min-height: 46px; font-size: .76rem; }
  }
</style>
