<script lang="ts">
  export type SceneIconId = 'dog-happy' | 'dog-worried' | 'bone' | 'heart' | 'wave' | 'whale';

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
</style>
