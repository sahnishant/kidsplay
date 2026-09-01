<script lang="ts">
  import VocabularySemanticScene from './VocabularySemanticScene.svelte';
  import { resolveVisualMeaningPresentation } from './vocabularyPresentation';

  type VisualMeaningPresenterMode = 'glance' | 'learn' | 'explore';
  type VisualMeaningPresenterPhase = 'explanation' | 'assessment_pre_answer';

  let {
    senseKey,
    word,
    meaning = null,
    example = null,
    mode = 'learn',
    phase = 'explanation',
    onSpeak = null
  }: {
    senseKey: string;
    word: string;
    meaning?: string | null;
    example?: string | null;
    mode?: VisualMeaningPresenterMode;
    phase?: VisualMeaningPresenterPhase;
    onSpeak?: (() => void) | null;
  } = $props();

  let presentation = $derived(resolveVisualMeaningPresentation(senseKey, { phase }));
  let compactVisual = $derived(mode === 'glance');
  let accessibleLabel = $derived(
    mode !== 'glance' && meaning
      ? `Meaning of ${word}: ${meaning}`
      : `Meaning of ${word}`
  );
  let rootLayout = $derived(
    mode === 'glance'
      ? 'display:grid;grid-template-columns:minmax(5rem,8rem) minmax(0,1fr);align-items:center;gap:.7rem;width:min(100%,30rem);max-height:100%;padding:.8rem;border:1px solid rgba(44,72,91,.14);border-radius:1rem;background:rgba(255,255,255,.94)'
      : 'display:grid;grid-template-rows:minmax(0,1fr) auto;gap:.7rem;width:min(100%,30rem);max-height:100%;padding:.8rem;border:1px solid rgba(44,72,91,.14);border-radius:1rem;background:rgba(255,255,255,.94)'
  );
</script>

<article
  class:glance={mode === 'glance'}
  class:explore={mode === 'explore'}
  class="visual-meaning-presenter"
  style={rootLayout}
  data-presentation-key={presentation.presentationKey}
  data-presentation-mode={presentation.deliveryMode}
  data-presentation-phase={presentation.phase}
  data-derived-mode={presentation.derivedMode}
  data-visual-allowed={presentation.visualAllowed ? 'true' : 'false'}
  data-visual-fallback={presentation.fallbackReason ?? undefined}
  data-vocabulary-sense={presentation.senseKey || senseKey}
  data-copy-authority="caller"
  aria-label={accessibleLabel}
>
  {#if presentation.visualAllowed}
    <div
      class="visual-meaning-presenter__visual"
      style="min-height:0;overflow:hidden"
      data-visual-meaning-scene
      role="group"
      aria-label={`Visual explanation for ${word}`}
    >
      <VocabularySemanticScene senseKey={presentation.senseKey} compact={compactVisual} />
    </div>
  {/if}

  <div class="visual-meaning-presenter__copy" style="min-width:0">
    <div
      class="visual-meaning-presenter__word-row"
      style={`display:flex;align-items:center;justify-content:${mode === 'glance' ? 'flex-start' : 'center'};gap:.45rem`}
    >
      <h3 style="margin:0;font-size:clamp(1.2rem,5vw,1.75rem);line-height:1.05;letter-spacing:.02em">{word}</h3>
      {#if onSpeak}
        <button
          class="visual-meaning-presenter__speak"
          style="display:inline-grid;place-items:center;width:2.35rem;height:2.35rem;padding:0;border:0;border-radius:999px;background:rgba(92,132,160,.12);font:inherit;cursor:pointer"
          type="button"
          aria-label={`Hear ${word}`}
          onclick={() => onSpeak?.()}
        >
          <span aria-hidden="true">🔊</span>
        </button>
      {/if}
    </div>

    {#if mode !== 'glance' && meaning}
      <p class="visual-meaning-presenter__meaning" style="margin:.55rem 0 0;text-align:center;line-height:1.35;font-weight:700">{meaning}</p>
    {/if}

    {#if mode === 'explore' && example}
      <p class="visual-meaning-presenter__example" style="margin:.55rem 0 0;padding-top:.55rem;border-top:1px solid rgba(44,72,91,.12);font-size:.95rem;text-align:center;line-height:1.35">{example}</p>
    {/if}
  </div>
</article>
