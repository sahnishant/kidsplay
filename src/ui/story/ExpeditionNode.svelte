<script lang="ts">
  import Avatar from '../../presentation/Avatar.svelte';
  import type { AvatarId } from '../../runtime/localProgress';
  import type { StoryLocationVisualState } from '../../story/storyPresentation';
  import type { StoryLocation } from '../../story/storyTypes';

  let {
    location,
    state,
    icon,
    childAvatar,
    actionLabel,
    ariaLabel,
    onActivate
  }: {
    location: StoryLocation;
    state: StoryLocationVisualState;
    icon: string;
    childAvatar: AvatarId;
    actionLabel: string;
    ariaLabel: string;
    onActivate: () => void;
  } = $props();
</script>

<div
  class:expedition-shell--current={state === 'current'}
  class="expedition-shell"
  style={`--world-x:${location.position.x}%;--world-y:${location.position.y}%`}
>
  {#if state === 'current'}
    <span class="hero-marker" aria-hidden="true"><Avatar avatar={childAvatar} mood="happy" motion="bounce" /></span>
  {/if}
  <button
    type="button"
    class="expedition-node"
    data-state={state}
    disabled={state === 'locked'}
    aria-label={ariaLabel}
    onclick={onActivate}
  >
    <span class="expedition-node__state" aria-hidden="true">
      {state === 'complete' ? '✓' : state === 'locked' ? '🔒' : state === 'current' ? '▶' : '•'}
    </span>
    <span class="expedition-node__icon" aria-hidden="true">{state === 'locked' ? '☁️' : icon}</span>
    <span class="expedition-node__level">LEVEL {location.progression.level}</span>
    <strong>{location.expeditionTitle}</strong>
    <small>{actionLabel}</small>
  </button>
</div>

<style>
  .expedition-shell {
    --world-x: 50%;
    --world-y: 50%;
    position: absolute;
    left: var(--world-x);
    top: var(--world-y);
    z-index: 3;
    width: clamp(88px, 16vw, 126px);
    transform: translate(-50%,-50%);
  }

  .expedition-shell--current { z-index: 6; width: clamp(112px, 19vw, 150px); }

  .hero-marker {
    position: absolute;
    width: 46px;
    height: 46px;
    left: 50%;
    top: -38px;
    z-index: 8;
    transform: translateX(-50%);
    filter: drop-shadow(0 4px 7px rgba(36,48,58,.18));
    pointer-events: none;
  }

  .expedition-node {
    position: relative;
    width: 100%;
    min-height: 78px;
    display: grid;
    justify-items: center;
    align-content: center;
    gap: 1px;
    padding: 8px 6px 7px;
    border: 2px solid rgba(36,48,58,.14);
    border-radius: 18px;
    background: rgba(255,255,255,.96);
    color: var(--ink);
    box-shadow: 0 6px 14px rgba(36,48,58,.11);
    cursor: pointer;
  }

  .expedition-node[data-state='current'] {
    min-height: 94px;
    border: 3px solid var(--accent);
    background: linear-gradient(160deg,#fff,#f2efff);
    box-shadow: 0 0 0 5px rgba(90,82,213,.12), 0 10px 22px rgba(54,47,133,.18);
  }
  .expedition-node[data-state='complete'] { border-color: rgba(51,145,81,.42); background: var(--good-soft); }
  .expedition-node[data-state='available'] { opacity: .9; }
  .expedition-node[data-state='locked'] { opacity: .46; filter: saturate(.5); cursor: default; }

  .expedition-node__state {
    position: absolute;
    top: 5px;
    right: 6px;
    min-width: 18px;
    min-height: 18px;
    display: grid;
    place-items: center;
    border-radius: 999px;
    background: rgba(255,255,255,.88);
    font-size: .6rem;
    font-weight: 950;
  }
  .expedition-node[data-state='complete'] .expedition-node__state { background: var(--good); color: #fff; }
  .expedition-node[data-state='current'] .expedition-node__state { background: var(--accent); color: #fff; }

  .expedition-node__icon { font-size: 1.35rem; line-height: 1; }
  .expedition-node__level { color: var(--accent); font-size: .55rem; font-weight: 950; letter-spacing: .06em; }
  .expedition-node strong { max-width: 100%; font-size: .66rem; line-height: 1.05; text-align: center; overflow-wrap: anywhere; }
  .expedition-node small { color: var(--muted); font-size: .52rem; font-weight: 850; }
  .expedition-node[data-state='current'] strong { font-size: .75rem; }
  .expedition-node[data-state='current'] small { color: var(--accent); font-size: .59rem; }

  @media (max-width: 520px) {
    .expedition-shell { width: clamp(76px, 24vw, 96px); }
    .expedition-shell--current { width: clamp(94px, 29vw, 116px); }
    .expedition-node { min-height: 68px; padding: 6px 4px; border-radius: 15px; }
    .expedition-node[data-state='current'] { min-height: 80px; }
    .hero-marker { width: 38px; height: 38px; top: -31px; }
    .expedition-node__icon { font-size: 1.12rem; }
    .expedition-node__level { font-size: .48rem; }
    .expedition-node strong { font-size: .57rem; }
    .expedition-node[data-state='current'] strong { font-size: .64rem; }
  }

  @media (prefers-reduced-motion: reduce) {
    .hero-marker :global(*) { animation: none !important; }
  }
</style>