<script lang="ts">
  import type { SceneIconId } from './sceneTypes';

  let { icon }: { icon: SceneIconId } = $props();
</script>

<svg class={`scene-icon scene-icon--${icon}`} viewBox="0 0 120 100" aria-hidden="true">
  {#if icon === 'dog-happy' || icon === 'dog-worried'}
    <g class="dog">
      <path class="dog-ear" d="M31 35 17 14c-7 20-4 34 8 40Z" />
      <path class="dog-ear" d="m89 35 14-21c7 20 4 34-8 40Z" />
      <ellipse class="dog-body" cx="60" cy="77" rx="34" ry="21" />
      <circle class="dog-head" cx="60" cy="45" r="32" />
      <circle class="dog-eye" cx="48" cy="42" r="4" />
      <circle class="dog-eye" cx="72" cy="42" r="4" />
      <ellipse class="dog-muzzle" cx="60" cy="57" rx="15" ry="11" />
      <path class="dog-nose" d="M54 52h12l-6 6Z" />
      {#if icon === 'dog-happy'}
        <path class="dog-mouth" d="M51 62q9 9 18 0" />
        <path class="dog-tail" d="M90 76q22-13 19 8" />
      {:else}
        <path class="dog-mouth" d="M51 66q9-8 18 0" />
        <path class="dog-brow" d="m42 34 10 3m16 0 10-3" />
        <path class="dog-tail" d="M91 82q18 10 17-8" />
      {/if}
    </g>
  {:else if icon === 'bone'}
    <g class="bone">
      <circle cx="25" cy="40" r="15" />
      <circle cx="25" cy="60" r="15" />
      <circle cx="95" cy="40" r="15" />
      <circle cx="95" cy="60" r="15" />
      <rect x="24" y="38" width="72" height="24" rx="12" />
    </g>
  {:else if icon === 'heart'}
    <path class="heart" d="M60 87 18 47C-1 27 11 8 31 8c12 0 22 7 29 18C67 15 77 8 89 8c20 0 32 19 13 39Z" />
  {:else if icon === 'lungs'}
    <g class="lungs">
      <path class="lungs-trachea" d="M60 9v27M60 30 49 42M60 30l11 12" />
      <path class="lung lung--left" d="M48 38c-13 2-22 14-24 31-2 17 8 24 20 20 9-3 11-12 11-23V43c0-4-3-6-7-5Z" />
      <path class="lung lung--right" d="M72 38c13 2 22 14 24 31 2 17-8 24-20 20-9-3-11-12-11-23V43c0-4 3-6 7-5Z" />
      <path class="lungs-branch" d="M50 44 39 53m31-9 11 9M50 52 40 66m30-14 10 14" />
    </g>
  {:else if icon === 'earth'}
    <g class="earth">
      <circle class="earth-ocean" cx="60" cy="50" r="39" />
      <path class="earth-land" d="M31 31c7-9 16-14 26-17l8 10-7 8-9-2-7 8-10-1Zm33 8 13-8 14 7 5 13-12 5-6 12-11-3-5-11Zm-17 22 10 3 7 11-6 13-16-4-7-11Z" />
      <path class="earth-grid" d="M22 50h76M60 11c-12 11-18 24-18 39s6 28 18 39m0-78c12 11 18 24 18 39s-6 28-18 39" />
    </g>
  {:else if icon === 'wave'}
    <g class="wave">
      <path d="M4 62c15 0 15-18 30-18s15 18 30 18 15-18 30-18 15 18 22 18v30H4Z" />
      <path class="wave-foam" d="M2 56c14 0 17-18 31-18 15 0 17 18 31 18s17-18 31-18c11 0 16 10 23 15v10c-10 0-15-13-24-13-13 0-16 18-30 18S47 50 34 50 18 68 2 68Z" />
    </g>
  {:else if icon === 'whale'}
    <g class="whale">
      <ellipse class="whale-body" cx="58" cy="58" rx="42" ry="27" />
      <path class="whale-tail" d="M96 55c11-16 21-18 22-5-5 4-9 8-13 13 6 2 10 6 13 11-4 12-15 8-24-7Z" />
      <path class="whale-belly" d="M22 65q35 22 70 0-8 19-35 20-27-1-35-20Z" />
      <circle class="whale-eye" cx="40" cy="51" r="3.5" />
      <path class="whale-smile" d="M36 65q8 6 16 0" />
      <path class="whale-spout" d="M54 30c-7-9-4-17 1-23m4 22c6-10 5-17 2-23" />
    </g>
  {:else if icon === 'balloon'}
    <g class="balloon">
      <ellipse cx="60" cy="42" rx="31" ry="36" />
      <path class="balloon-knot" d="m53 76 7-9 7 9Z" />
      <path class="balloon-string" d="M60 76q-12 11 0 22" />
      <ellipse class="balloon-shine" cx="48" cy="29" rx="7" ry="11" />
    </g>
  {:else if icon === 'candle'}
    <g class="candle">
      <rect class="candle-body" x="44" y="42" width="32" height="51" rx="5" />
      <path class="candle-wax" d="M45 52q8-10 16 0 8-10 15 0v12H45Z" />
      <path class="candle-flame" d="M60 43c-16-13 2-27 4-39 15 17 15 30-4 39Z" />
      <path class="candle-wick" d="M60 43V34" />
    </g>
  {:else if icon === 'pumice'}
    <g class="pumice">
      <path class="pumice-rock" d="M21 67 29 32 54 15 87 25 104 53 88 83 49 90Z" />
      <circle class="pumice-hole" cx="47" cy="40" r="7" />
      <circle class="pumice-hole" cx="76" cy="43" r="5" />
      <circle class="pumice-hole" cx="61" cy="67" r="8" />
      <circle class="pumice-hole" cx="88" cy="61" r="4" />
      <circle class="pumice-hole" cx="37" cy="68" r="4" />
    </g>
  {:else if icon === 'wind'}
    <g class="wind">
      <path d="M8 31h56c14 0 18-17 7-22-8-4-15 1-15 8" />
      <path d="M8 51h88c18 0 20 22 5 28-12 5-21-2-21-12" />
      <path d="M8 70h46c13 0 15 17 5 22-8 4-15-1-15-8" />
    </g>
  {:else if icon === 'windmill'}
    <g class="windmill">
      <path class="windmill-tower" d="M51 45h18l11 51H40Z" />
      <circle class="windmill-hub" cx="60" cy="39" r="7" />
      <g class="windmill-blades">
        <path d="M60 36 48 6 57 3 65 34Z" />
        <path d="M63 39 94 27 97 36 66 44Z" />
        <path d="M60 42 72 73 63 76 55 45Z" />
        <path d="M57 39 26 51 23 42 54 34Z" />
      </g>
    </g>
  {:else if icon === 'kite'}
    <g class="kite">
      <path class="kite-body" d="m60 7 30 34-30 31-30-31Z" />
      <path class="kite-frame" d="M60 7v65M30 41h60" />
      <path class="kite-string" d="M60 72c-4 9 8 8 3 16-3 5-9 5-11 10" />
      <path class="kite-bow" d="m59 84-10-6-1 11Zm4 6 10-5-1 11Z" />
    </g>
  {:else if icon === 'sailboat'}
    <g class="sailboat">
      <path class="sailboat-hull" d="M19 69h82L89 88H34Z" />
      <path class="sailboat-mast" d="M59 15v55" />
      <path class="sailboat-sail sailboat-sail--left" d="M56 20 25 63h31Z" />
      <path class="sailboat-sail sailboat-sail--right" d="m63 20 29 43H63Z" />
    </g>
  {:else if icon === 'plant'}
    <g class="plant">
      <path class="plant-stem" d="M60 91V35" />
      <path class="plant-leaf" d="M59 61C42 58 30 48 29 35c17 0 29 8 31 22Z" />
      <path class="plant-leaf" d="M61 50c15-3 26-12 28-25-16 0-27 8-29 21Z" />
      <path class="plant-leaf" d="M60 75c14-2 25-10 29-21-15-2-27 5-29 17Z" />
      <path class="plant-pot" d="M39 78h42l-6 18H45Z" />
    </g>
  {:else if icon === 'sun'}
    <g class="sun">
      <circle cx="60" cy="50" r="23" />
      <path d="M60 5v14M60 81v14M15 50h14M91 50h14M28 18l10 10m44 44 10 10M92 18 82 28M38 72 28 82" />
    </g>
  {/if}
</svg>

<style>
  .scene-icon {
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  .dog-head,
  .dog-body,
  .dog-ear {
    fill: #c98b56;
    stroke: #5c4230;
    stroke-width: 2.5;
    stroke-linejoin: round;
  }

  .dog-muzzle {
    fill: #f6dfbd;
  }

  .dog-eye,
  .dog-nose {
    fill: #342a25;
  }

  .dog-mouth,
  .dog-brow,
  .dog-tail {
    fill: none;
    stroke: #342a25;
    stroke-width: 3;
    stroke-linecap: round;
  }

  .bone {
    fill: #fff4d9;
    stroke: #d7c29a;
    stroke-width: 3;
  }

  .heart {
    fill: #e6536f;
    stroke: #b83a54;
    stroke-width: 3;
  }

  .lung {
    fill: #ef879b;
    stroke: #a94d62;
    stroke-width: 2.5;
    stroke-linejoin: round;
  }

  .lungs-trachea,
  .lungs-branch {
    fill: none;
    stroke: #8d5962;
    stroke-width: 3;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .earth-ocean {
    fill: #4ba7d8;
    stroke: #246b96;
    stroke-width: 3;
  }

  .earth-land {
    fill: #72be62;
    stroke: #367a3e;
    stroke-width: 1.5;
    stroke-linejoin: round;
  }

  .earth-grid {
    fill: none;
    stroke: rgba(255, 255, 255, 0.55);
    stroke-width: 1.8;
  }

  .wave path:first-child {
    fill: #2389c9;
  }

  .wave-foam {
    fill: #dff7ff;
  }

  .whale-body,
  .whale-tail {
    fill: #4b9cca;
    stroke: #246b96;
    stroke-width: 2.5;
    stroke-linejoin: round;
  }

  .whale-belly {
    fill: #a9ddf1;
  }

  .whale-eye {
    fill: #17394d;
  }

  .whale-smile,
  .whale-spout {
    fill: none;
    stroke: #17394d;
    stroke-width: 2.5;
    stroke-linecap: round;
  }

  .balloon ellipse:first-child {
    fill: #ec6681;
    stroke: #b9405a;
    stroke-width: 3;
  }

  .balloon-knot {
    fill: #b9405a;
  }

  .balloon-string {
    fill: none;
    stroke: #725d55;
    stroke-width: 2;
  }

  .balloon-shine {
    fill: rgba(255, 255, 255, 0.6);
  }

  .candle-body {
    fill: #f7e7b2;
    stroke: #c8ae67;
    stroke-width: 2.5;
  }

  .candle-wax {
    fill: #fff7d7;
  }

  .candle-flame {
    fill: #f5a623;
    stroke: #d67917;
    stroke-width: 2;
  }

  .candle-wick {
    stroke: #5a4638;
    stroke-width: 2.5;
    stroke-linecap: round;
  }

  .pumice-rock {
    fill: #b9ada1;
    stroke: #766b62;
    stroke-width: 3;
    stroke-linejoin: round;
  }

  .pumice-hole {
    fill: #786f68;
    opacity: 0.78;
  }

  .wind path {
    fill: none;
    stroke: #dff7ff;
    stroke-width: 7;
    stroke-linecap: round;
  }

  .windmill-tower {
    fill: #f1e1c2;
    stroke: #8c6b4d;
    stroke-width: 2.5;
  }

  .windmill-hub {
    fill: #d88943;
    stroke: #825229;
    stroke-width: 2.5;
  }

  .windmill-blades {
    transform-box: fill-box;
    transform-origin: center;
    animation: spin-scene-icon 3.2s linear infinite;
  }

  .windmill-blades path {
    fill: #fff8e9;
    stroke: #8c6b4d;
    stroke-width: 2;
    stroke-linejoin: round;
  }

  .kite-body {
    fill: #f25f76;
    stroke: #8e3850;
    stroke-width: 2.5;
  }

  .kite-frame,
  .kite-string {
    fill: none;
    stroke: #5d4b49;
    stroke-width: 2;
    stroke-linecap: round;
  }

  .kite-bow {
    fill: #f4bf4f;
    stroke: #a9791c;
    stroke-width: 1.5;
  }

  .sailboat-hull {
    fill: #c66d41;
    stroke: #754229;
    stroke-width: 2.5;
  }

  .sailboat-mast {
    fill: none;
    stroke: #654b38;
    stroke-width: 4;
    stroke-linecap: round;
  }

  .sailboat-sail {
    stroke: #4f6c78;
    stroke-width: 2;
    stroke-linejoin: round;
  }

  .sailboat-sail--left {
    fill: #fff3c9;
  }

  .sailboat-sail--right {
    fill: #e5f4ff;
  }

  .plant-stem {
    fill: none;
    stroke: #397d45;
    stroke-width: 5;
    stroke-linecap: round;
  }

  .plant-leaf {
    fill: #5bbf62;
    stroke: #2f7b3a;
    stroke-width: 2;
    stroke-linejoin: round;
  }

  .plant-pot {
    fill: #d98255;
    stroke: #8c5133;
    stroke-width: 2.5;
  }

  .sun circle {
    fill: #ffd35c;
    stroke: #dd9b25;
    stroke-width: 3;
  }

  .sun path {
    fill: none;
    stroke: #f4b42f;
    stroke-width: 5;
    stroke-linecap: round;
  }

  @keyframes spin-scene-icon {
    to { transform: rotate(360deg); }
  }

  @media (prefers-reduced-motion: reduce) {
    .windmill-blades {
      animation: none;
    }
  }
</style>