<script lang="ts">
  import type { AvatarId } from '../runtime/localProgress';

  export type AvatarMood = 'happy' | 'thinking' | 'celebrate';
  export type AvatarMotion = 'idle' | 'think' | 'bounce';

  let {
    avatar,
    mood = 'happy',
    motion = 'idle',
    label
  }: {
    avatar: AvatarId;
    mood?: AvatarMood;
    motion?: AvatarMotion;
    label?: string;
  } = $props();
</script>

<svg
  class={`kid-avatar kid-avatar--${avatar} kid-avatar--${motion}`}
  viewBox="0 0 100 100"
  role={label ? 'img' : undefined}
  aria-label={label}
  aria-hidden={label ? undefined : 'true'}
>
  <g class="kid-avatar__character">
    {#if avatar === 'fox'}
      <path class="fur" d="M24 31 31 9 45 29Z" />
      <path class="fur" d="M55 29 69 9 76 31Z" />
      <path class="ear-inner" d="m30 25 3-10 7 12Z" />
      <path class="ear-inner" d="m60 27 7-12 3 10Z" />
    {:else if avatar === 'owl'}
      <path class="fur" d="M24 32 29 13 42 28Z" />
      <path class="fur" d="M58 28 71 13 76 32Z" />
    {:else}
      <circle class="ear" cx="29" cy="27" r="13" />
      <circle class="ear" cx="71" cy="27" r="13" />
    {/if}

    <ellipse class="body" cx="50" cy="70" rx="27" ry="24" />
    <circle class="fur" cx="50" cy="45" r="30" />

    {#if avatar === 'panda'}
      <ellipse class="mark" cx="39" cy="42" rx="9" ry="12" transform="rotate(22 39 42)" />
      <ellipse class="mark" cx="61" cy="42" rx="9" ry="12" transform="rotate(-22 61 42)" />
    {:else if avatar === 'tiger'}
      <path class="mark tiger-stripe" d="M37 20 42 33 34 31Z" />
      <path class="mark tiger-stripe" d="m50 15 4 16-8 0Z" />
      <path class="mark tiger-stripe" d="m63 20 3 11-8 2Z" />
    {/if}

    {#if avatar === 'owl'}
      <circle class="eye-ring" cx="39" cy="43" r="12" />
      <circle class="eye-ring" cx="61" cy="43" r="12" />
      <circle class="eye" cx="39" cy="43" r="4" />
      <circle class="eye" cx="61" cy="43" r="4" />
      <path class="beak" d="m50 47-6 7h12Z" />
      <path class="wing" d="M24 61c-14 4-17 15-9 22 8-4 13-9 16-17Z" />
      <path class="wing" d="M76 61c14 4 17 15 9 22-8-4-13-9-16-17Z" />
    {:else}
      <circle class="eye" cx="39" cy="43" r="3.6" />
      <circle class="eye" cx="61" cy="43" r="3.6" />
      <ellipse class="muzzle" cx="50" cy="55" rx="13" ry="10" />
      <path class="nose" d="M45 51h10l-5 5Z" />
    {/if}

    {#if avatar === 'fox'}
      <path class="cheek" d="M27 49c5 7 8 12 10 19l-14-8Z" />
      <path class="cheek" d="M73 49c-5 7-8 12-10 19l14-8Z" />
      <path class="tail" d="M71 72c18-14 28-3 18 10-6 8-16 8-22 4 10-1 14-5 13-9-1-4-5-5-9-5Z" />
    {/if}

    {#if mood === 'thinking'}
      <path class="mouth" d="M44 61q6-4 12 0" />
      <circle class="thought-dot" cx="78" cy="23" r="3" />
      <circle class="thought-dot" cx="86" cy="15" r="4" />
    {:else if mood === 'celebrate'}
      <path class="mouth" d="M42 59q8 10 16 0" />
      <path class="spark" d="m15 29 2 6 6 2-6 2-2 6-2-6-6-2 6-2Z" />
      <path class="spark" d="m84 48 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" />
    {:else if avatar !== 'owl'}
      <path class="mouth" d="M43 59q7 7 14 0" />
    {/if}
  </g>
</svg>

<style>
  .kid-avatar {
    width: 100%;
    height: 100%;
    overflow: visible;
    --fur: #f08a45;
    --accent: #fff0d5;
    --mark: #46382f;
    --body: #f7b96e;
  }

  .kid-avatar--owl {
    --fur: #98714f;
    --accent: #f5e8ca;
    --mark: #3d3027;
    --body: #b98d60;
  }

  .kid-avatar--panda {
    --fur: #f7f7f2;
    --accent: #fff;
    --mark: #34373a;
    --body: #e9e9e5;
  }

  .kid-avatar--tiger {
    --fur: #ef9b35;
    --accent: #ffe2aa;
    --mark: #523120;
    --body: #f4b45e;
  }

  .kid-avatar__character {
    transform-origin: 50% 78%;
  }

  .kid-avatar--idle .kid-avatar__character {
    animation: avatar-bob 2.8s ease-in-out infinite;
  }

  .kid-avatar--think .kid-avatar__character {
    animation: avatar-think 2.1s ease-in-out infinite;
  }

  .kid-avatar--bounce .kid-avatar__character {
    animation: avatar-bounce 1.1s ease-in-out infinite;
  }

  .fur,
  .ear {
    fill: var(--fur);
  }

  .body {
    fill: var(--body);
  }

  .ear-inner,
  .muzzle,
  .eye-ring {
    fill: var(--accent);
  }

  .mark,
  .eye,
  .nose {
    fill: var(--mark);
  }

  .beak {
    fill: #e6a52e;
  }

  .wing,
  .tail,
  .cheek {
    fill: var(--fur);
    stroke: var(--mark);
    stroke-width: 2;
    stroke-linejoin: round;
  }

  .mouth {
    fill: none;
    stroke: var(--mark);
    stroke-width: 2.6;
    stroke-linecap: round;
  }

  .tiger-stripe {
    stroke: none;
  }

  .thought-dot {
    fill: #8a82df;
    opacity: 0.8;
  }

  .spark {
    fill: #f5b623;
  }

  @keyframes avatar-bob {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    50% { transform: translateY(-2px) rotate(1deg); }
  }

  @keyframes avatar-think {
    0%, 100% { transform: rotate(0deg); }
    50% { transform: rotate(-3deg); }
  }

  @keyframes avatar-bounce {
    0%, 100% { transform: translateY(0) scale(1); }
    45% { transform: translateY(-7px) scale(1.02); }
  }

  @media (prefers-reduced-motion: reduce) {
    .kid-avatar__character {
      animation: none !important;
    }
  }
</style>
