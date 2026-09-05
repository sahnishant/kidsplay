<script lang="ts">
  import { onDestroy } from 'svelte';
  import type { EvaluationResult } from '../contracts/runtime';
  import type { Question } from '../contracts/question';
  import type { EngineComponent, EngineSubmissionMode } from '../engines/types';
  import { playRequiredBundledAudio, stopChildAudio } from '../runtime/childAudio';

  interface AudioCue {
    stage: string;
    grapheme: 'm' | 'f' | 's';
    bundledSrc: string;
    maxPlaybackMs?: number;
    audioReview: 'approved_existing_pack' | 'candidate_pending_human';
  }

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
  let playbackRequest = 0;
  let cue = $derived(resolveAudioCue(question.id));

  function resolveAudioCue(questionId: string): AudioCue | null {
    const match = /^phonics\.sound-trail\.([mfs])\.(discriminate|connect_object_word|grapheme|recognition)\.001$/.exec(questionId);
    if (!match) return null;
    const grapheme = match[1] as AudioCue['grapheme'];
    return {
      stage: match[2],
      grapheme,
      bundledSrc: `/audio/kidsplay-v1/prereader/phoneme-${grapheme}.ogg`,
      // /m/ is a continuous sound, but the legacy clip holds it for far too long.
      // Play one short, natural "mmm" once rather than a repeated/extended hum.
      maxPlaybackMs: grapheme === 'm' ? 500 : undefined,
      audioReview: grapheme === 'm' ? 'approved_existing_pack' : 'candidate_pending_human'
    };
  }

  async function playTargetSound(): Promise<void> {
    const requestId = ++playbackRequest;
    heard = false;
    notice = null;
    if (!soundEnabled || !cue) {
      stopChildAudio();
      notice = 'Turn sound on to hear this sound challenge.';
      return;
    }

    // This promise resolves true only after the exact local file actually starts;
    // TTS/local-voice fallback is intentionally forbidden for phonics evidence.
    const started = await playRequiredBundledAudio(cue.bundledSrc, true);
    if (requestId !== playbackRequest) return;
    if (started && soundEnabled) {
      heard = true;
      if (cue.maxPlaybackMs) {
        const maxPlaybackMs = cue.maxPlaybackMs;
        window.setTimeout(() => {
          if (requestId === playbackRequest && soundEnabled) stopChildAudio();
        }, maxPlaybackMs);
      }
      return;
    }
    notice = 'Tap Repeat to hear the sound before choosing.';
  }

  $effect(() => {
    const currentId = question.id;
    const enabled = soundEnabled;
    if (!currentId || !enabled) {
      playbackRequest += 1;
      stopChildAudio();
      heard = false;
      return;
    }
    void playTargetSound();
  });

  onDestroy(() => {
    playbackRequest += 1;
    stopChildAudio();
  });
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
    onclick={() => void playTargetSound()}
  >
    <span aria-hidden="true">↻</span>
    <span>Repeat</span>
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
  :global(.session-viewport:has([data-phonics-audio-gate]) button[aria-label="Repeat question"]){display:none}
  .phonics-audio-gate{display:grid;gap:10px;justify-items:center}.repeat-sound{min-height:48px;padding:9px 16px;border:0;border-radius:999px;background:var(--accent);color:#fff;font:inherit;font-size:.82rem;font-weight:950;cursor:pointer}.repeat-sound:disabled{background:#dfe5e8;color:#68747c;cursor:default}.audio-notice{margin:0;color:var(--try);font-size:.78rem;font-weight:800;text-align:center}.phonics-engine{width:100%}.listen-first{width:min(100%,28rem);min-height:120px;display:grid;place-content:center;gap:5px;padding:16px;border:2px dashed #24303a20;border-radius:18px;text-align:center;color:var(--muted)}.listen-first strong{color:var(--ink);font-size:1.05rem}.listen-first span{font-size:.76rem}
  @media(prefers-reduced-motion:reduce){.repeat-sound{transition:none}}
</style>
