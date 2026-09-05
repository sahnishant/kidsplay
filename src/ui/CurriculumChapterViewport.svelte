<script lang="ts">
  import SemanticAnimation from '../presentation/SemanticAnimation.svelte';
  import VisualEntity from '../presentation/VisualEntity.svelte';
  import type { CurriculumChapterPresentation } from '../experience/curriculumChapterContract';

  let {
    chapter,
    onExit,
    onStartPractice,
    onStartCheck
  }: {
    chapter: CurriculumChapterPresentation;
    onExit: () => void;
    onStartPractice: (packRef: string) => void;
    onStartCheck: (packRef: string) => void;
  } = $props();

  let beatIndex = $state(0);
  let beat = $derived(chapter.beats[beatIndex]);
  let isFirst = $derived(beatIndex === 0);
  let isLast = $derived(beatIndex === chapter.beats.length - 1);

  function previous(): void {
    if (isFirst) return;
    beatIndex -= 1;
  }

  function next(): void {
    if (isLast) return;
    beatIndex += 1;
  }
</script>

<main class="chapter" data-curriculum-presentation={chapter.presentationId} data-beat-id={beat.id}>
  <header class="chapter__topbar">
    <button class="chapter__back" type="button" onclick={onExit} aria-label="Back to play">←</button>
    <div class="chapter__heading">
      <small>{chapter.badge}</small>
      <h1>{chapter.childTitle}</h1>
      <p>{chapter.subtitle}</p>
    </div>
    <span class="chapter__count" aria-label={`Part ${beatIndex + 1} of ${chapter.beats.length}`}>
      {beatIndex + 1}/{chapter.beats.length}
    </span>
  </header>

  <nav class="chapter__steps" aria-label="Workshop sections">
    {#each chapter.beats as item, index}
      <button
        type="button"
        class:chapter__step--active={index === beatIndex}
        aria-current={index === beatIndex ? 'step' : undefined}
        aria-label={`Open ${item.title}`}
        onclick={() => beatIndex = index}
      >
        <span>{index + 1}</span>
      </button>
    {/each}
  </nav>

  <section class="chapter__stage" aria-labelledby="chapter-beat-title">
    <div class="chapter__visual" role="group" aria-label={beat.visual.ariaLabel}>
      {#if beat.visual.kind === 'entity'}
        <VisualEntity visualRef={beat.visual.visualRef} context="dashboard" decorative={false} label={beat.visual.ariaLabel} />
      {:else if beat.visual.kind === 'animation'}
        <SemanticAnimation animationId={beat.visual.animationRef} embedded={true} />
      {:else if beat.visual.kind === 'grid'}
        <div class="chapter__visual-grid">
          {#each beat.visual.visualRefs as visualRef, index}
            <article>
              <span><VisualEntity {visualRef} context="dashboard" /></span>
              <strong>{beat.visual.labels[index]}</strong>
            </article>
          {/each}
        </div>
      {:else}
        <div class="chapter__tokens">
          {#each beat.visual.tokens as token}<strong>{token}</strong>{/each}
        </div>
      {/if}
    </div>

    <article class="chapter__lesson">
      <small>{beat.eyebrow}</small>
      <h2 id="chapter-beat-title">{beat.title}</h2>
      <p>{beat.body}</p>

      {#if beat.sequence}
        <ol class="chapter__sequence" aria-label="Movement sequence">
          {#each beat.sequence as step}<li>{step}</li>{/each}
        </ol>
      {/if}

      {#if isLast}
        <aside class="chapter__complete" aria-label="Workshop explored">
          <strong>{chapter.completion.title}</strong>
          <p>{chapter.completion.body}</p>
        </aside>
      {/if}
    </article>
  </section>

  <footer class="chapter__actions">
    <button type="button" class="chapter__secondary" onclick={previous} disabled={isFirst}>Previous</button>
    {#if !isLast}
      <button type="button" class="chapter__primary" onclick={next}>Next</button>
    {:else}
      <button type="button" class="chapter__secondary chapter__practice" onclick={() => onStartPractice(chapter.practicePackRef)}>Practice</button>
      <button type="button" class="chapter__primary" onclick={() => onStartCheck(chapter.chapterCheckPackRef)}>Chapter check</button>
    {/if}
  </footer>
</main>

<style>
  .chapter{width:min(860px,100%);height:calc(100dvh - 42px);margin:auto;display:grid;grid-template-rows:auto auto minmax(0,1fr) auto;gap:8px;overflow:hidden;color:var(--ink)}
  .chapter__topbar{display:grid;grid-template-columns:46px minmax(0,1fr) auto;align-items:center;gap:9px;padding:6px 8px;border:1px solid #24303a18;border-radius:16px;background:#fffffff2}
  .chapter__back{width:42px;height:42px;border:0;border-radius:12px;background:var(--accent-soft);color:var(--accent);font:inherit;font-weight:950;font-size:1.1rem;cursor:pointer}
  .chapter__heading{min-width:0}.chapter__heading small,.chapter__lesson>small{color:var(--accent);font-size:.62rem;font-weight:950;letter-spacing:.08em}.chapter__heading h1{margin:1px 0;font-size:clamp(1.05rem,4vw,1.45rem);line-height:1}.chapter__heading p{margin:2px 0 0;color:var(--muted);font-size:.74rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .chapter__count{min-width:44px;padding:7px 9px;border-radius:999px;background:#eef4f6;text-align:center;font-size:.72rem;font-weight:900}
  .chapter__steps{display:flex;justify-content:center;gap:8px}.chapter__step{width:34px;height:34px;min-height:34px;border:2px solid #d6e0e4;border-radius:999px;background:#fff;color:#60727b;font:inherit;font-weight:900;cursor:pointer}.chapter__step--active{border-color:var(--accent);background:var(--accent);color:#fff}
  .chapter__stage{min-height:0;display:grid;grid-template-columns:minmax(0,1.05fr) minmax(260px,.95fr);gap:10px;overflow:hidden}
  .chapter__visual,.chapter__lesson{min-height:0;border:1px solid #24303a17;border-radius:22px;background:#fffffff0;overflow:hidden}.chapter__visual{display:grid;place-items:center;padding:14px;background:linear-gradient(145deg,#f7fcff,#fff8ec)}.chapter__visual>:global(.visual-entity){width:min(90%,420px);height:min(90%,310px)}.chapter__visual>:global(.semantic-animation){width:100%;height:100%;min-height:260px}
  .chapter__visual-grid{width:100%;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.chapter__visual-grid article{min-height:125px;display:grid;grid-template-rows:minmax(0,1fr) auto;place-items:center;padding:8px;border:1px solid #24303a14;border-radius:18px;background:#fff}.chapter__visual-grid article>span{width:90px;height:75px}.chapter__visual-grid strong{font-size:.78rem}
  .chapter__tokens{display:flex;flex-wrap:wrap;justify-content:center;gap:12px}.chapter__tokens strong{padding:13px 18px;border:2px solid #dbe5e9;border-radius:16px;background:#fff;font-size:clamp(1rem,4vw,1.45rem)}
  .chapter__lesson{display:flex;flex-direction:column;justify-content:center;padding:clamp(18px,4vw,30px);overflow:auto}.chapter__lesson h2{margin:4px 0 10px;font-size:clamp(1.25rem,4.2vw,1.8rem);line-height:1.08}.chapter__lesson>p{margin:0;color:#3f5058;font-size:clamp(.96rem,2.8vw,1.12rem);line-height:1.55}
  .chapter__sequence{display:grid;gap:6px;margin:14px 0 0;padding:0;list-style:none;counter-reset:steps}.chapter__sequence li{counter-increment:steps;padding:8px 10px 8px 42px;position:relative;border-radius:12px;background:#f1f6f8;font-size:.82rem;font-weight:800}.chapter__sequence li::before{content:counter(steps);position:absolute;left:10px;top:50%;translate:0 -50%;width:24px;height:24px;display:grid;place-items:center;border-radius:50%;background:var(--accent);color:#fff;font-size:.7rem}
  .chapter__complete{margin-top:16px;padding:12px;border-radius:15px;background:#eff9ef}.chapter__complete p{margin:4px 0 0;color:#49604a;font-size:.82rem}
  .chapter__actions{display:flex;justify-content:flex-end;gap:8px}.chapter__actions button{min-height:46px;padding:9px 17px;border-radius:14px;font:inherit;font-weight:900;cursor:pointer}.chapter__secondary{border:2px solid #d8e2e6;background:#fff;color:var(--ink)}.chapter__secondary:disabled{opacity:.42;cursor:default}.chapter__primary{border:2px solid var(--accent);background:var(--accent);color:#fff}.chapter__practice{margin-left:auto}
  button:focus-visible{outline:3px solid #111;outline-offset:2px}
  @media(max-width:660px){.chapter__stage{grid-template-columns:1fr;grid-template-rows:minmax(180px,.8fr) minmax(0,1.2fr)}.chapter__visual{padding:8px}.chapter__visual>:global(.semantic-animation){min-height:170px}.chapter__visual-grid article{min-height:92px}.chapter__visual-grid article>span{width:70px;height:58px}.chapter__lesson{padding:15px}.chapter__heading p{display:none}.chapter__actions button{padding:8px 12px;font-size:.82rem}}
  @media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
</style>
