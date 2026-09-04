<script lang="ts">
  import { onDestroy } from 'svelte';
  import type { EvaluationResult } from '../contracts/runtime';
  import type { Question } from '../contracts/question';
  import type { EngineComponent, EngineSubmissionMode } from '../engines/types';
  import { resolveSoundTrailAudioCue } from '../experience/phonicsAdventureProduction';
  import { playPhonemeAudio, stopChildAudio } from '../runtime/childAudio';

  let {
    question,
    Engine,
    onSubmit,
    checkResponse,
    submissionMode,
    soundEnabled = true
  }: {
    question: Question;
    Engine: EngineComponent;
    onSubmit: (response: unknown) => void;
    checkResponse: (response: unknown) => EvaluationResult;
    submissionMode: EngineSubmissionMode;
    soundEnabled?: boolean;
  } = $props();

  let heard = $state(false);
  let notice = $state<string | null>(null);
  let cue = $derived(resolveSoundTrailAudioCue(question.id));

  function playTargetSound(): void {
    heard = false;
    notice = null;
    if (!soundEnabled || !cue) {
      notice = 'Turn sound on to hear this sound challenge.';
      return;
    }

    // The first production phonics slice requires the exact reviewed/candidate
    // bundled phoneme recording. A generic device TTS reading is not accepted as
    // evidence that the child actually heard the target phoneme.
    const result = playPhonemeAudio('sound', question.language, true, cue.bundledSrc);
    if (result.source === 'bundled') {
      heard = true;
      return;
    }
    notice = 'This sound is not ready on this device yet.';
  }

  $effect(() => {
    const currentId = question.id;
    const enabled = soundEnabled;
    if (!currentId || !enabled) {
      heard = false;
      return;
    }
    playTargetSound();
  });

  onDestroy(stopChildAudio);
</script>

<div
  class="phonics-audio-gate"
  data-phonics-audio-gate
  data-phonics-stage={cue?.stage}
  data-audio-review={cue?.audioReview}
>
  <button
    class="repeat-sound"
    type="button"
    disabled={!soundEnabled || !cue}
    aria-label="Repeat target sound"
    onclick={playTargetSound}
  >
    <span aria-hidden="true">↻</span>
    <span>Repeat sound</span>
  </button>

  {#if notice}
    <p class="audio-notice" role="status">{notice}</p>
  {/if}

  {#if heard}
    <div class="phonics-engine" data-target-sound-heard="true">
      <Engine {question} {onSubmit} {checkResponse} {submissionMode} {soundEnabled} />
    </div>
  {:else}
    <div class="listen-first" aria-live="polite">
      <strong>Listen first</strong>
      <span>The choices appear after the sound plays.</span>
    </div>
  {/if}
</div>

<style>
  .phonics-audio-gate{display:grid;gap:10px;justify-items:center}.repeat-sound{min-height:48px;padding:9px 16px;border:0;border-radius:999px;background:var(--accent);color:#fff;font:inherit;font-size:.82rem;font-weight:950;cursor:pointer}.repeat-sound:disabled{background:#dfe5e8;color:#68747c;cursor:default}.audio-notice{margin:0;color:var(--try);font-size:.78rem;font-weight:800;text-align:center}.phonics-engine{width:100%}.listen-first{width:min(100%,28rem);min-height:120px;display:grid;place-content:center;gap:5px;padding:16px;border:2px dashed #24303a20;border-radius:18px;text-align:center;color:var(--muted)}.listen-first strong{color:var(--ink);font-size:1.05rem}.listen-first span{font-size:.76rem}
  @media(prefers-reduced-motion:reduce){.repeat-sound{transition:none}}
</style>
