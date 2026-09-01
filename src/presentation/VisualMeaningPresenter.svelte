<script lang="ts">
  import VocabularySemanticScene from './VocabularySemanticScene.svelte';
  import { resolveVisualMeaningPresentation } from './vocabularyPresentation';

  export type VisualMeaningPresenterMode = 'glance' | 'learn' | 'explore';

  let {
    senseKey,
    word,
    meaning = null,
    example = null,
    mode = 'learn',
    onSpeak = null
  }: {
    senseKey: string;
    word: string;
    meaning?: string | null;
    example?: string | null;
    mode?: VisualMeaningPresenterMode;
    onSpeak?: (() => void) | null;
  } = $props();

  let presentation = $derived(resolveVisualMeaningPresentation(senseKey));
  let compactVisual = $derived(mode === 'glance');
</script>

<article
  class:glance={mode === 'glance'}
  class:explore={mode === 'explore'}
  class="visual-meaning-presenter"
  data-presentation-key={presentation.presentationKey}
  data-presentation-mode={presentation.deliveryMode}
  data-derived-mode={presentation.derivedMode}
  data-visual-allowed={presentation.visualAllowed ? 'true' : 'false'}
  data-visual-fallback={presentation.fallbackReason ?? undefined}
  data-vocabulary-sense={presentation.senseKey || senseKey}
  aria-label={`Meaning of ${word}`}
>
  {#if presentation.visualAllowed}
    <div class="visual-meaning-presenter__visual" data-visual-meaning-scene>
      <VocabularySemanticScene senseKey={presentation.senseKey} compact={compactVisual} />
    </div>
  {/if}

  <div class="visual-meaning-presenter__copy">
    <div class="visual-meaning-presenter__word-row">
      <h3>{word}</h3>
      {#if onSpeak}
        <button
          class="visual-meaning-presenter__speak"
          type="button"
          aria-label={`Hear ${word}`}
          onclick={() => onSpeak?.()}
        >
          <span aria-hidden="true">🔊</span>
        </button>
      {/if}
    </div>

    {#if mode !== 'glance' && meaning}
      <p class="visual-meaning-presenter__meaning">{meaning}</p>
    {/if}

    {#if mode === 'explore' && example}
      <p class="visual-meaning-presenter__example">{example}</p>
    {/if}
  </div>
</article>

<style>
  .visual-meaning-presenter {
    display: grid;
    grid-template-rows: minmax(0, 1fr) auto;
    gap: 0.7rem;
    width: min(100%, 30rem);
    max-height: 100%;
    padding: 0.8rem;
    border: 1px solid rgba(44, 72, 91, 0.14);
    border-radius: 1rem;
    background: rgba(255, 255, 255, 0.94);
  }

  .visual-meaning-presenter.glance {
    grid-template-columns: minmax(5rem, 8rem) minmax(0, 1fr);
    grid-template-rows: auto;
    align-items: center;
  }

  .visual-meaning-presenter__visual {
    min-height: 0;
    overflow: hidden;
  }

  .visual-meaning-presenter__copy {
    min-width: 0;
  }

  .visual-meaning-presenter__word-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
  }

  .glance .visual-meaning-presenter__word-row {
    justify-content: flex-start;
  }

  h3 {
    margin: 0;
    font-size: clamp(1.2rem, 5vw, 1.75rem);
    line-height: 1.05;
    letter-spacing: 0.02em;
  }

  .visual-meaning-presenter__speak {
    display: inline-grid;
    place-items: center;
    width: 2.35rem;
    height: 2.35rem;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: rgba(92, 132, 160, 0.12);
    font: inherit;
    cursor: pointer;
  }

  .visual-meaning-presenter__speak:focus-visible {
    outline: 3px solid currentColor;
    outline-offset: 2px;
  }

  .visual-meaning-presenter__meaning,
  .visual-meaning-presenter__example {
    margin: 0.55rem 0 0;
    text-align: center;
    line-height: 1.35;
  }

  .visual-meaning-presenter__meaning {
    font-weight: 700;
  }

  .visual-meaning-presenter__example {
    padding-top: 0.55rem;
    border-top: 1px solid rgba(44, 72, 91, 0.12);
    font-size: 0.95rem;
  }

  .glance .visual-meaning-presenter__meaning,
  .glance .visual-meaning-presenter__example {
    display: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .visual-meaning-presenter *,
    .visual-meaning-presenter *::before,
    .visual-meaning-presenter *::after {
      scroll-behavior: auto !important;
      transition-duration: 0.001ms !important;
      animation-duration: 0.001ms !important;
      animation-iteration-count: 1 !important;
    }
  }
</style>
