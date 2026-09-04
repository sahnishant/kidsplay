<script lang="ts">
  export type ContainerVisualState = 'empty' | 'full';

  let {
    state,
    label,
    compact = false
  }: {
    state: ContainerVisualState;
    label?: string;
    compact?: boolean;
  } = $props();
</script>

<div
  class:container-state--compact={compact}
  class="container-state"
  data-container-state={state}
  role={label ? 'img' : undefined}
  aria-label={label}
  aria-hidden={label ? undefined : 'true'}
>
  <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
    <path class="bucket-handle" d="M30 42 C30 14 90 14 90 42" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" />
    <path class="bucket-shell" d="M22 39 H98 L88 105 H32 Z" />
    <clipPath id="bucket-fill-clip">
      <path d="M27 44 H93 L84 100 H36 Z" />
    </clipPath>
    <g clip-path="url(#bucket-fill-clip)">
      <rect class="bucket-inside" x="27" y="44" width="66" height="56" />
      {#if state === 'full'}
        <rect class="bucket-water" x="27" y="51" width="66" height="49" />
        <path class="bucket-water-line" d="M28 53 C40 48 50 57 61 52 C72 47 81 56 92 51" />
      {/if}
    </g>
    <path class="bucket-rim" d="M22 39 H98" />
    {#if state === 'empty'}
      <path class="empty-mark" d="M46 67 L74 88 M74 67 L46 88" />
    {/if}
  </svg>
  <span class="state-dot" aria-hidden="true">{state === 'full' ? '●' : '○'}</span>
</div>

<style>
  .container-state {
    width: min(190px, 70vw);
    aspect-ratio: 1;
    display: grid;
    place-items: center;
    position: relative;
    color: #4b6172;
  }

  .container-state--compact {
    width: min(88px, 24vw);
  }

  svg { width: 100%; height: 100%; }
  .bucket-shell { fill: #f1c56c; stroke: #8d6729; stroke-width: 4; }
  .bucket-inside { fill: #fff9e8; }
  .bucket-water { fill: #74cbed; }
  .bucket-water-line { fill: none; stroke: #2a91c4; stroke-width: 4; stroke-linecap: round; }
  .bucket-rim { fill: none; stroke: #8d6729; stroke-width: 6; stroke-linecap: round; }
  .empty-mark { fill: none; stroke: #bd7a63; stroke-width: 6; stroke-linecap: round; opacity: .7; }
  .state-dot {
    position: absolute;
    right: 9%;
    bottom: 9%;
    width: 32px;
    height: 32px;
    display: grid;
    place-items: center;
    border-radius: 999px;
    background: #fff;
    border: 2px solid currentColor;
    font-size: 1rem;
    font-weight: 900;
  }

  .container-state--compact .state-dot {
    width: 22px;
    height: 22px;
    font-size: .72rem;
  }
</style>
