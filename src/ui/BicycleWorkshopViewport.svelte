<script lang="ts">
  import guideJson from '../../content/experience/bicycle-workshop-guided.json';
  import SemanticVisualPresenter from '../presentation/SemanticVisualPresenter.svelte';
  import { animationVisualPresentation, resolveItemVisualPresentation, type SemanticVisualPresentation } from '../presentation/semanticVisualPresentation';
  import { getWorkshopStudioActivityRefs } from '../experience/learningStudios';
  import StudioLauncher from './StudioLauncher.svelte';

  interface GuideBeat { id: string; label: string; text: string; examples?: string[]; sequence?: string[]; claimRefs?: string[]; capabilityRefs?: string[]; }
  interface GuideSection { id: string; order: number; eyebrow: string; title: string; animationRef?: string; visualRef?: string; visualLabel: string; lookPrompt: string; beats: GuideBeat[]; remember: string; childPrompt: string; }
  interface GuidedExperience { childTitle: string; subtitle: string; sections: GuideSection[]; }

  let { onExit, onPractice, onChapterCheck }: { onExit: () => void; onPractice: () => void; onChapterCheck: () => void; } = $props();
  const guide = guideJson as GuidedExperience;
  let activeIndex = $state(0);
  let activeBeatIndex = $state(0);
  let section = $derived(guide.sections[activeIndex]);
  let beat = $derived(section.beats[activeBeatIndex]);
  let isFirstMoment = $derived(activeIndex === 0 && activeBeatIndex === 0);
  let isLastBeat = $derived(activeBeatIndex === section.beats.length - 1);
  let isLastSection = $derived(activeIndex === guide.sections.length - 1);
  let isFinished = $derived(isLastSection && isLastBeat);
  let visualPresentation = $derived<SemanticVisualPresentation | null>(
    section.animationRef ? animationVisualPresentation(section.animationRef, { embedded: true, decorative: false })
      : section.visualRef ? resolveItemVisualPresentation({ label: section.visualLabel, visualRefs: [section.visualRef] }, { allowLabelInference: false, context: 'dashboard', decorative: false }) : null
  );
  function previous(): void {
    if (activeBeatIndex > 0) { activeBeatIndex -= 1; return; }
    if (activeIndex > 0) { const previousIndex = activeIndex - 1; activeIndex = previousIndex; activeBeatIndex = guide.sections[previousIndex].beats.length - 1; }
  }
  function next(): void {
    if (activeBeatIndex < section.beats.length - 1) { activeBeatIndex += 1; return; }
    if (activeIndex < guide.sections.length - 1) { activeIndex += 1; activeBeatIndex = 0; }
  }
  function chooseSection(index: number): void { activeIndex = Math.max(0, Math.min(guide.sections.length - 1, index)); activeBeatIndex = 0; }
  function chooseIdea(index: number): void { activeBeatIndex = Math.max(0, Math.min(section.beats.length - 1, index)); }
</script>

<main class="workshop" data-workshop-section={section.id} data-workshop-idea={beat.id}>
  <header class="workshop__topbar">
    <button class="workshop__back" type="button" onclick={onExit} aria-label="Back to play">←</button>
    <div class="workshop__heading"><small>CLASS 2 ENGLISH · GUIDED WORKSHOP</small><h1>{guide.childTitle}</h1><p>{guide.subtitle}</p></div>
    <span class="workshop__count" aria-label={`Part ${activeIndex + 1} of ${guide.sections.length}, idea ${activeBeatIndex + 1} of ${section.beats.length}`}><b>{activeIndex + 1}/{guide.sections.length}</b><small>idea {activeBeatIndex + 1}/{section.beats.length}</small></span>
  </header>
  <nav class="workshop__steps" aria-label="Bicycle Workshop learning sections">
    {#each guide.sections as item, index}
      <button class="workshop__step" type="button" class:workshop__step--active={index === activeIndex} aria-current={index === activeIndex ? 'step' : undefined} aria-label={`Open part ${index + 1}: ${item.title}`} onclick={() => chooseSection(index)}><span>{index + 1}</span><small>{item.id === 'movement' ? 'Move' : item.id === 'reading' ? 'Read' : item.id}</small></button>
    {/each}
  </nav>
  <section class="workshop__body" aria-labelledby="workshop-section-title">
    <article class="workshop__lesson">
      <div class="workshop__lesson-heading"><small>{section.eyebrow}</small><h2 id="workshop-section-title">{section.title}</h2></div>
      <div class="workshop__look"><span aria-hidden="true">1</span><div><strong>LOOK</strong><p>{section.lookPrompt}</p></div></div>
      <div class="workshop__visual">
        {#if visualPresentation}<SemanticVisualPresenter presentation={visualPresentation} class="workshop__visual-presentation" />
        {:else}<div class="workshop__visual-fallback" role="img" aria-label={section.visualLabel}>🚲 {section.visualLabel}</div>{/if}
      </div>
      <div class="workshop__learn">
        <div class="workshop__idea-tabs" aria-label={`Ideas in ${section.title}`}>
          {#each section.beats as item, index}
            <button type="button" class:workshop__idea-tab--active={index === activeBeatIndex} aria-current={index === activeBeatIndex ? 'step' : undefined} aria-label={`Open idea ${index + 1}: ${item.label}`} onclick={() => chooseIdea(index)}>{index + 1}</button>
          {/each}
        </div>
        <section class="workshop__beat" data-claim-count={beat.claimRefs?.length ?? 0} data-capability-count={beat.capabilityRefs?.length ?? 0} aria-live="polite">
          <header class="workshop__beat-heading"><span aria-hidden="true">2</span><div><small>LEARN · IDEA {activeBeatIndex + 1}</small><strong>{beat.label}</strong></div></header>
          <p>{beat.text}</p>
          {#if beat.sequence?.length}
            <div class="workshop__sequence" aria-label={`${beat.label} sequence`}>
              {#each beat.sequence as step, stepIndex}<span class="workshop__sequence-step">{step}</span>{#if stepIndex < beat.sequence.length - 1}<b aria-hidden="true">→</b>{/if}{/each}
            </div>
          {/if}
          {#if beat.examples?.length}<div class="workshop__examples" aria-label={`${beat.label} examples`}>{#each beat.examples as example}<span>{example}</span>{/each}</div>{/if}
        </section>
        {#if isLastBeat}<aside class="workshop__remember" aria-label="Remember this"><strong>REMEMBER</strong><p>{section.remember}</p></aside>
        {:else}<p>One idea at a time. Tap <b>Next idea</b> when you are ready.</p>{/if}
        {#key section.id}
          <StudioLauncher activityRefs={getWorkshopStudioActivityRefs('bicycle-workshop', section.id)} />
        {/key}
      </div>
      {#if isLastBeat}<aside class="workshop__try" aria-label="Your turn without scoring"><span aria-hidden="true">3</span><div><strong>YOUR TURN</strong><p>{section.childPrompt}</p><small>No score here — just explore.</small></div></aside>{/if}
    </article>
  </section>
  <footer class="workshop__footer">
    <button class="workshop__secondary" type="button" onclick={previous} disabled={isFirstMoment}>Previous</button>
    {#if !isFinished}<button class="workshop__primary" type="button" onclick={next}>{isLastBeat ? 'Next part' : 'Next idea'}</button>
    {:else}<div class="workshop__finish-actions"><button class="workshop__secondary" type="button" onclick={onPractice}>Practice</button><button class="workshop__primary" type="button" onclick={onChapterCheck}>Chapter check</button></div>{/if}
  </footer>
</main>

<style>
  :global(.bicycle-workshop-host){width:100%;height:100%;min-height:0;display:grid;overflow:hidden}
  .workshop{width:min(920px,100%);height:100%;min-height:0;margin:auto;display:grid;grid-template-rows:auto auto minmax(0,1fr) auto;gap:7px;overflow:hidden;color:var(--ink)}.workshop button{font:inherit;font-weight:850;cursor:pointer}.workshop small{font-size:.58rem;font-weight:850;letter-spacing:.04em}
  .workshop__topbar{min-height:54px;display:grid;grid-template-columns:40px minmax(0,1fr) auto;align-items:center;gap:8px;padding:5px 8px;border:1px solid #24303a18;border-radius:14px;background:#fff}.workshop__back{width:36px;height:36px;border:0;border-radius:10px;background:var(--accent-soft);color:var(--accent);font-size:1rem}.workshop__heading h1,.workshop__lesson-heading h2{margin:1px 0 0;line-height:1.05}.workshop__heading h1{font-size:1.18rem}.workshop__heading p{margin:2px 0 0;overflow:hidden;color:var(--muted);font-size:.68rem;font-weight:700;text-overflow:ellipsis;white-space:nowrap}.workshop__count{min-width:52px;display:grid;padding:5px 7px;border-radius:10px;background:#eef6ff;color:var(--accent);text-align:center;font-size:.7rem;font-weight:900}
  .workshop__steps{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:5px}.workshop__step{min-width:0;min-height:40px;display:grid;grid-template-columns:auto minmax(0,1fr);place-items:center;gap:4px;padding:4px 6px;border:1px solid #24303a18;border-radius:11px;background:#fff;color:var(--muted)}.workshop__step span{width:22px;height:22px;display:grid;place-items:center;border-radius:50%;background:#eef1f3;font-size:.65rem}.workshop__step--active{border-color:var(--accent);background:var(--accent-soft);color:var(--accent)}
  .workshop__body{min-height:0;overflow:auto}.workshop__lesson{min-height:100%;display:grid;grid-template-columns:minmax(210px,.9fr) minmax(260px,1.1fr);grid-template-rows:auto auto minmax(0,1fr) auto;gap:9px 12px;padding:10px;border:1px solid #24303a18;border-radius:18px;background:#fff}.workshop__lesson-heading,.workshop__look,.workshop__try{grid-column:1/-1}.workshop__lesson-heading h2{font-size:1.4rem}.workshop__look,.workshop__try{min-height:46px;display:grid;grid-template-columns:30px minmax(0,1fr);align-items:center;gap:8px;padding:7px 9px;border-radius:13px}.workshop__look{background:#f3f0ff}.workshop__look>span,.workshop__try>span,.workshop__beat-heading>span{width:30px;height:30px;display:grid;place-items:center;border-radius:50%;background:var(--accent);color:#fff;font-size:.72rem;font-weight:900}
  .workshop__visual{min-height:220px;display:grid;place-items:center;overflow:hidden;border:1px solid #24303a14;border-radius:17px;background:#fbfcfd}.workshop__visual-fallback{padding:20px;text-align:center;font-weight:800}.workshop__learn{min-width:0;display:grid;align-content:center;gap:8px}.workshop__idea-tabs,.workshop__examples,.workshop__sequence{display:flex;flex-wrap:wrap;align-items:center;gap:6px}.workshop__idea-tabs button{width:34px;height:30px;border:1px solid #24303a20;border-radius:999px;background:#fff;color:var(--muted)}.workshop__idea-tabs .workshop__idea-tab--active{border-color:var(--accent);background:var(--accent);color:#fff}.workshop__beat{min-height:140px;display:grid;align-content:center;gap:9px;padding:11px;border-radius:15px;background:#f7f9fa}.workshop__beat-heading{display:grid;grid-template-columns:30px minmax(0,1fr);align-items:center;gap:8px}.workshop__look p,.workshop__try p,.workshop__remember p,.workshop__beat p{margin:0;font-size:.9rem;font-weight:740;line-height:1.3}.workshop__examples span,.workshop__sequence-step{padding:6px 8px;border-radius:9px;background:#fff;font-size:.7rem;font-weight:800}.workshop__sequence-step{border:1px solid #6358dc22;background:#f3f0ff;color:#3f36a8}.workshop__remember{padding:8px 9px;border-left:4px solid var(--accent);border-radius:9px;background:#f3f0ff}.workshop__try{border:1px dashed #e2a93d;background:#fff9e9}
  .workshop__footer,.workshop__finish-actions{display:grid;gap:8px}.workshop__footer{min-height:48px;grid-template-columns:88px minmax(0,1fr)}.workshop__finish-actions{grid-template-columns:1fr 1.25fr}.workshop__primary,.workshop__secondary{min-height:46px;border-radius:13px}.workshop__primary{border:0;background:var(--accent);color:#fff}.workshop__secondary{border:2px solid var(--line);background:#fff;color:var(--ink)}
  @media(max-width:650px){.workshop__steps{overflow-x:auto;grid-template-columns:repeat(7,minmax(52px,1fr))}.workshop__step{grid-template-columns:1fr;gap:1px}.workshop__lesson{grid-template-columns:1fr;grid-template-rows:auto auto auto auto auto;padding:8px}.workshop__lesson-heading,.workshop__look,.workshop__try{grid-column:1}.workshop__visual{min-height:155px;max-height:27dvh}}
</style>
