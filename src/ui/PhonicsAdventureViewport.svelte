<script lang="ts">
  import type { SessionAttempt } from '../contracts/runtime';
  import {
    getSoundTrailQuestions,
    projectSoundTrailDiscovery,
    SOUND_TRAIL_TITLE,
    soundTrailAudioReviewPending
  } from '../experience/phonicsAdventureProduction';
  import type { AvatarId } from '../runtime/localProgress';
  import { loadProgress, recordAttempt } from '../runtime/localProgress';
  import { stopChildAudio } from '../runtime/childAudio';
  import type { SessionState } from '../runtime/session';
  import SessionViewport from './SessionViewport.svelte';

  let {
    childName = '',
    childAvatar = 'fox',
    onExit,
    onDiscovery
  }: {
    childName?: string;
    childAvatar?: AvatarId;
    onExit: () => void;
    onDiscovery?: () => void;
  } = $props();

  const questions = getSoundTrailQuestions();
  const pendingAudio = soundTrailAudioReviewPending();
  let finished = $state(false);
  let discoveryFound = $state(false);

  function handleAttempt(attempt: SessionAttempt): void {
    recordAttempt(attempt);
  }

  function handleComplete(_state: SessionState): void {
    discoveryFound = projectSoundTrailDiscovery(loadProgress()).length === 1;
    finished = true;
    if (discoveryFound) onDiscovery?.();
  }

  function exit(): void {
    stopChildAudio();
    onExit();
  }
</script>

<main
  class="phonics-adventure"
  aria-label={SOUND_TRAIL_TITLE}
  data-human-audio-review-pending={pendingAudio.length ? 'true' : 'false'}
>
  {#if !finished}
    <SessionViewport
      title={SOUND_TRAIL_TITLE}
      mode="free_explore"
      {questions}
      {childName}
      {childAvatar}
      onAttempt={handleAttempt}
      onComplete={handleComplete}
      onExit={exit}
    />
  {:else}
    <section class="sound-trail-ending" aria-live="polite">
      <div class="sound-orb" aria-hidden="true">👂</div>
      {#if discoveryFound}
        <span class="eyebrow">DISCOVERY FOUND</span>
        <h1>Scientu’s Sound Trail is glowing</h1>
        <p>You connected the three sounds to pictures, letters and words. The Sound Trail discovery now comes from your real learning progress.</p>
        <strong>Sound Trail · Words & Sounds</strong>
      {:else}
        <span class="eyebrow">TRAIL EXPLORED</span>
        <h1>Some sounds still need another listen</h1>
        <p>Nothing was taken away. Play the trail again and use Repeat whenever you need it.</p>
      {/if}
      <button class="back-world" type="button" onclick={exit}>Back to Dheu’s world</button>
    </section>
  {/if}
</main>

<style>
  .phonics-adventure{width:min(760px,100%);height:100%;min-height:0;margin:auto;overflow:hidden}.sound-trail-ending{height:100%;display:grid;place-content:center;justify-items:center;gap:10px;padding:22px;text-align:center;border:1px solid #24303a17;border-radius:24px;background:linear-gradient(180deg,#fff,#f4fbff);box-shadow:var(--shadow)}.sound-orb{width:92px;height:92px;display:grid;place-items:center;border-radius:999px;background:var(--accent-soft);font-size:2.5rem}.eyebrow{color:var(--accent);font-size:.66rem;font-weight:950;letter-spacing:.09em}.sound-trail-ending h1{max-width:28rem;margin:0;font-size:clamp(1.4rem,6vw,2rem);line-height:1.08}.sound-trail-ending p{max-width:32rem;margin:0;color:var(--muted);font-size:.88rem;line-height:1.45}.sound-trail-ending strong{padding:8px 12px;border-radius:999px;background:#fff8e9}.back-world{min-height:48px;margin-top:5px;padding:9px 16px;border:0;border-radius:14px;background:var(--accent);color:#fff;font:inherit;font-weight:900;cursor:pointer}@media(prefers-reduced-motion:reduce){.sound-orb{animation:none}}
</style>
