<script lang="ts">
  import type { AvatarId } from '../runtime/localProgress';
  import type { StoryCharacterId } from '../story/storyTypes';
  import Avatar, { type AvatarMood, type AvatarMotion } from './Avatar.svelte';

  export type StoryCharacterMood = 'happy' | 'thinking' | 'mischievous' | 'celebrate' | 'worried' | 'ready';
  export type StoryCharacterMotion = 'idle' | 'think' | 'bounce' | 'wiggle' | 'float';

  let {
    character,
    heroAvatar = 'fox',
    mood = 'happy',
    motion = 'idle',
    label
  }: {
    character: StoryCharacterId;
    heroAvatar?: AvatarId;
    mood?: StoryCharacterMood;
    motion?: StoryCharacterMotion;
    label?: string;
  } = $props();

  let heroMood = $derived<AvatarMood>(
    mood === 'thinking' || mood === 'worried' ? 'thinking' : mood === 'celebrate' ? 'celebrate' : 'happy'
  );
  let heroMotion = $derived<AvatarMotion>(
    motion === 'bounce' ? 'bounce' : motion === 'think' || mood === 'thinking' || mood === 'worried' ? 'think' : 'idle'
  );
</script>

{#if character === 'dheu'}
  <Avatar avatar={heroAvatar} mood={heroMood} motion={heroMotion} {label} />
{:else}
  <svg
    class={`story-character story-character--${character} story-character--${mood} story-character--${motion}`}
    viewBox="0 0 100 100"
    role={label ? 'img' : undefined}
    aria-label={label}
    aria-hidden={label ? undefined : 'true'}
  >
    <g class="story-character__actor">
      {#if character === 'scientu'}
        <path class="scientu-coat" d="M25 96c1-25 10-38 25-38s24 13 25 38Z" />
        <path class="scientu-shirt" d="M40 62h20l-3 34H43Z" />
        <path class="scientu-collar" d="m40 62 10 10-9 8-7-15Z" />
        <path class="scientu-collar" d="m60 62-10 10 9 8 7-15Z" />
        <path class="scientu-arm" d="M28 71C17 73 13 82 17 88c7 1 13-3 18-10Z" />
        <path class="scientu-arm scientu-arm--right" d="M72 71c11 2 15 11 11 17-7 1-13-3-18-10Z" />
        <circle class="scientu-head" cx="50" cy="39" r="25" />
        <path class="scientu-hair" d="M28 37c0-17 10-27 24-27 11 0 20 6 23 16-9-6-19-8-29-5-6 2-12 7-18 16Z" />
        <path class="scientu-hair scientu-hair--tuft" d="M45 15c6-12 16-11 20-6-8 0-10 5-10 10Z" />
        <circle class="scientu-glass" cx="41" cy="39" r="10" />
        <circle class="scientu-glass" cx="61" cy="39" r="10" />
        <path class="scientu-glass-bridge" d="M51 39h1" />
        <circle class="scientu-eye" cx="41" cy="40" r="2.8" />
        <circle class="scientu-eye" cx="61" cy="40" r="2.8" />
        {#if mood === 'thinking' || mood === 'worried'}
          <path class="scientu-mouth" d="M44 52q6-4 12 0" />
          <circle class="thought-dot" cx="78" cy="21" r="2.5" />
          <circle class="thought-dot" cx="86" cy="14" r="3.6" />
        {:else if mood === 'celebrate'}
          <path class="scientu-mouth" d="M43 50q7 9 14 0" />
          <path class="spark" d="m17 25 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" />
          <path class="spark" d="m82 49 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" />
        {:else}
          <path class="scientu-mouth" d="M44 50q6 6 12 0" />
        {/if}
        <circle class="scientu-badge" cx="63" cy="77" r="6" />
        <path class="scientu-badge-mark" d="m63 72 1.5 3.5 3.5 1.5-3.5 1.5L63 82l-1.5-3.5L58 77l3.5-1.5Z" />
      {:else}
        <path class="shaitanu-tail" d="M69 75c19-3 23 9 14 17-7 6-17 3-19-3 8 3 13-1 13-5 0-5-4-7-8-9Z" />
        <path class="shaitanu-body" d="M20 59c0-24 13-42 31-42 19 0 31 18 31 42 0 25-12 37-31 37S20 84 20 59Z" />
        <path class="shaitanu-tuft" d="M32 25 25 8l14 9 7-13 5 15Z" />
        <path class="shaitanu-tuft" d="m66 22 9-12 1 17Z" />
        <path class="shaitanu-belly" d="M34 69c4-9 11-13 18-13 8 0 14 4 18 13-2 16-8 23-18 23S36 85 34 69Z" />
        <path class="shaitanu-brow" d="M33 39q7-5 13 0" />
        <path class="shaitanu-brow shaitanu-brow--right" d="M58 39q7-5 13 0" />
        <circle class="shaitanu-eye" cx="40" cy="46" r="3.7" />
        <circle class="shaitanu-eye" cx="64" cy="46" r="3.7" />
        {#if mood === 'thinking' || mood === 'worried'}
          <path class="shaitanu-mouth" d="M43 61q9-5 18 0" />
          <path class="shaitanu-swirl" d="M80 28c9-8 15 6 5 8-7 1-8-7-2-9" />
        {:else if mood === 'celebrate'}
          <path class="shaitanu-mouth" d="M40 58q12 15 24 0" />
          <path class="spark" d="m17 35 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" />
        {:else}
          <path class="shaitanu-mouth" d="M40 57q11 12 23 1" />
          <path class="shaitanu-tooth" d="m49 61 5 0-2 5Z" />
        {/if}
        <circle class="shaitanu-spot" cx="31" cy="62" r="3" />
        <circle class="shaitanu-spot" cx="72" cy="67" r="2.5" />
      {/if}
    </g>
  </svg>
{/if}

<style>
  .story-character {
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  .story-character__actor {
    transform-origin: 50% 82%;
  }

  .story-character--idle .story-character__actor {
    animation: story-bob 2.8s ease-in-out infinite;
  }

  .story-character--think .story-character__actor,
  .story-character--thinking .story-character__actor {
    animation: story-think 2.2s ease-in-out infinite;
  }

  .story-character--bounce .story-character__actor,
  .story-character--celebrate .story-character__actor {
    animation: story-bounce 1.15s ease-in-out infinite;
  }

  .story-character--wiggle .story-character__actor,
  .story-character--mischievous .story-character__actor {
    animation: story-wiggle 1.7s ease-in-out infinite;
  }

  .story-character--float .story-character__actor {
    animation: story-float 3.2s ease-in-out infinite;
  }

  .scientu-head {
    fill: #f3bd86;
  }

  .scientu-hair {
    fill: #35445b;
  }

  .scientu-hair--tuft {
    fill: #51657f;
  }

  .scientu-coat {
    fill: #f8fbff;
    stroke: #96b7c8;
    stroke-width: 2;
  }

  .scientu-shirt {
    fill: #58b6c7;
  }

  .scientu-collar {
    fill: #dff4f7;
    stroke: #5a8895;
    stroke-width: 1.5;
    stroke-linejoin: round;
  }

  .scientu-arm {
    fill: #f8fbff;
    stroke: #96b7c8;
    stroke-width: 2;
    stroke-linecap: round;
  }

  .story-character--scientu.story-character--thinking .scientu-arm--right,
  .story-character--scientu.story-character--think .scientu-arm--right {
    transform-origin: 72px 72px;
    transform: rotate(-22deg) translate(-5px, -3px);
  }

  .scientu-glass {
    fill: rgba(255, 255, 255, 0.45);
    stroke: #40566c;
    stroke-width: 2.5;
  }

  .scientu-glass-bridge,
  .scientu-mouth {
    fill: none;
    stroke: #40566c;
    stroke-width: 2.5;
    stroke-linecap: round;
  }

  .scientu-eye {
    fill: #27384a;
  }

  .scientu-badge {
    fill: #ffe16b;
    stroke: #d9a62f;
    stroke-width: 1.5;
  }

  .scientu-badge-mark {
    fill: #4aa7b7;
  }

  .shaitanu-body,
  .shaitanu-tail,
  .shaitanu-tuft {
    fill: #8065c8;
    stroke: #4d3d81;
    stroke-width: 2;
    stroke-linejoin: round;
  }

  .shaitanu-belly {
    fill: #aa92df;
  }

  .shaitanu-eye,
  .shaitanu-tooth {
    fill: #2f2950;
  }

  .shaitanu-tooth {
    fill: #fff8e8;
  }

  .shaitanu-brow,
  .shaitanu-mouth,
  .shaitanu-swirl {
    fill: none;
    stroke: #2f2950;
    stroke-width: 2.8;
    stroke-linecap: round;
  }

  .shaitanu-spot {
    fill: #6950ad;
    opacity: 0.75;
  }

  .thought-dot {
    fill: #67b8ca;
    opacity: 0.9;
  }

  .spark {
    fill: #f5b623;
  }

  @keyframes story-bob {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    50% { transform: translateY(-2px) rotate(1deg); }
  }

  @keyframes story-think {
    0%, 100% { transform: rotate(0deg); }
    50% { transform: rotate(-3deg); }
  }

  @keyframes story-bounce {
    0%, 100% { transform: translateY(0) scale(1); }
    45% { transform: translateY(-6px) scale(1.025); }
  }

  @keyframes story-wiggle {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(-3deg) translateY(-1px); }
    75% { transform: rotate(3deg) translateY(-1px); }
  }

  @keyframes story-float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-4px); }
  }

  @media (prefers-reduced-motion: reduce) {
    .story-character__actor {
      animation: none !important;
    }
  }
</style>
