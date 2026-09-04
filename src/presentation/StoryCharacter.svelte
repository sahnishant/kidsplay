<script lang="ts">
  import { onMount } from 'svelte';
  import type {
    StoryCharacterAngle,
    StoryCharacterExpression,
    StoryCharacterId,
    StoryCharacterMotion as StoryCharacterMotionContract,
    StoryCharacterPose
  } from '../story/storyTypes';
  import { getStoryCharacterPersona } from '../story/storyPersona';

  export type StoryCharacterMood = 'happy' | 'thinking' | 'mischievous' | 'celebrate' | 'worried' | 'ready';
  export type StoryCharacterMotion = StoryCharacterMotionContract;

  const look = {
    dheu: { skin: '#eab17d', hair: '#4a3022', dark: '#513526', shoe: '#ef7853', pack: '#7c9b52' },
    scientu: { skin: '#e8b37f', hair: '#283d52', dark: '#354e5b', shoe: '#3f8898', pack: '#567c89' },
    shaitanu: { skin: '#d79a73', hair: '#452952', dark: '#38233f', shoe: '#3d2b40', pack: '#4b315f' }
  } as const;

  let {
    character,
    mood = 'happy',
    expression,
    pose,
    angle,
    motion,
    label,
    heroAvatar
  }: {
    character: StoryCharacterId;
    mood?: StoryCharacterMood;
    expression?: StoryCharacterExpression;
    pose?: StoryCharacterPose;
    angle?: StoryCharacterAngle;
    motion?: StoryCharacterMotion;
    label?: string;
    /** Legacy story-surface compatibility only. Dheu now has one canonical persona visual. */
    heroAvatar?: string;
  } = $props();

  let reducedMotion = $state(true);
  let persona = $derived(getStoryCharacterPersona(character));
  let palette = $derived(persona.visual.palette);
  let colours = $derived(look[character]);
  let resolvedMotion = $derived<StoryCharacterMotion>(motion ?? persona.visual.defaultMotion);

  onMount(() => {
    const query = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    reducedMotion = query?.matches ?? false;
    if (!query?.addEventListener) return;
    const update = (event: MediaQueryListEvent) => { reducedMotion = event.matches; };
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  });

  function expressionFromMood(value: StoryCharacterMood): StoryCharacterExpression {
    if (character === 'shaitanu' && resolvedMotion === 'chuckle') return 'wicked-laugh';
    if (character === 'shaitanu' && resolvedMotion === 'recoil') return 'admiring';
    if (character === 'shaitanu' && value === 'thinking') return 'fake-innocent';
    if (character === 'dheu' && value === 'worried' && resolvedMotion === 'head-tilt') return 'confused';
    if (character === 'dheu' && (resolvedMotion === 'jump' || resolvedMotion === 'clap')) return 'excited';
    if (character === 'scientu' && value === 'celebrate') return 'aha';
    if (value === 'thinking') return 'thinking';
    if (value === 'mischievous') return character === 'shaitanu' ? 'sly' : 'curious';
    if (value === 'celebrate') return 'excited';
    if (value === 'worried') return 'worried';
    if (value === 'ready') return character === 'dheu' ? 'determined' : 'curious';
    return character === 'shaitanu' ? 'sly' : 'curious';
  }

  let resolvedPose = $derived<StoryCharacterPose>(
    pose
      ?? (resolvedMotion === 'inspect' || resolvedMotion === 'point' || mood === 'thinking'
        ? 'inspect'
        : resolvedMotion === 'help'
          ? 'help'
          : character === 'shaitanu' && mood === 'mischievous'
            ? 'proud'
            : resolvedMotion === 'jump' || resolvedMotion === 'celebrate'
              ? 'action'
              : persona.visual.defaultPose)
  );
  let resolvedAngle = $derived<StoryCharacterAngle>(angle ?? persona.visual.defaultAngle);
  let resolvedExpression = $derived(expression ?? expressionFromMood(mood));
  let mirrored = $derived(resolvedAngle === 'three-quarter-right' || resolvedAngle === 'side-right');
  let sideView = $derived(resolvedAngle === 'side-left' || resolvedAngle === 'side-right');
  let threeQuarter = $derived(resolvedAngle === 'three-quarter-left' || resolvedAngle === 'three-quarter-right');
  let orientationTransform = $derived(mirrored ? 'translate(120 0) scale(-1 1)' : undefined);
  let laughExpression = $derived(resolvedExpression === 'happy-laugh' || resolvedExpression === 'wicked-laugh');
  let closedEyes = $derived(laughExpression || resolvedExpression === 'sulky');
  let surprisedExpression = $derived(resolvedExpression === 'surprised' || resolvedExpression === 'mock-shock' || resolvedExpression === 'aha');
  let worriedExpression = $derived(resolvedExpression === 'worried' || resolvedExpression === 'confused' || resolvedExpression === 'sulky');
  let poseTransform = $derived(
    resolvedPose === 'help' ? 'translate(0 7) rotate(-3 60 92) scale(.96)'
      : resolvedPose === 'action' ? 'rotate(-5 60 92) translate(-2 0)'
        : resolvedPose === 'inspect' || resolvedPose === 'thinking' ? 'rotate(-2 60 92)'
          : undefined
  );
</script>

<svg
  class={`story-character story-character--${character} story-character--pose-${resolvedPose} story-character--expression-${resolvedExpression} story-character--motion-${resolvedMotion} story-character--angle-${resolvedAngle}`}
  style="width:100%;height:100%;overflow:visible"
  data-character={character}
  data-expression={resolvedExpression}
  data-pose={resolvedPose}
  data-angle={resolvedAngle}
  data-motion={resolvedMotion}
  data-legacy-hero-avatar={character === 'dheu' && heroAvatar ? 'provided' : undefined}
  viewBox="0 0 120 120"
  role={label ? 'img' : undefined}
  aria-label={label}
  aria-hidden={label ? undefined : 'true'}
>
  <g transform={orientationTransform}>
    <g transform={poseTransform}>
      <g>
        {#if !reducedMotion && (resolvedMotion === 'bob' || resolvedMotion === 'idle')}
          <animateTransform attributeName="transform" type="translate" values="0 0;0 -2;0 0" dur="2.8s" repeatCount="indefinite" />
        {:else if !reducedMotion && resolvedMotion === 'float'}
          <animateTransform attributeName="transform" type="translate" values="0 0;0 -4;0 0" dur="3.2s" repeatCount="indefinite" />
        {:else if !reducedMotion && (resolvedMotion === 'bounce' || resolvedMotion === 'jump' || resolvedMotion === 'celebrate' || resolvedMotion === 'clap')}
          <animateTransform attributeName="transform" type="translate" values="0 0;0 -7;0 0" dur="1.05s" repeatCount="indefinite" />
        {:else if !reducedMotion && (resolvedMotion === 'head-tilt' || resolvedMotion === 'think')}
          <animateTransform attributeName="transform" type="rotate" values="0 60 92;-4 60 92;0 60 92" dur="2.1s" repeatCount="indefinite" />
        {:else if !reducedMotion && (resolvedMotion === 'lean-in' || resolvedMotion === 'inspect' || resolvedMotion === 'point' || resolvedMotion === 'help')}
          <animateTransform attributeName="transform" type="rotate" values="0 60 92;-3 60 92;0 60 92" dur="1.9s" repeatCount="indefinite" />
        {:else if !reducedMotion && (resolvedMotion === 'wiggle' || resolvedMotion === 'chuckle')}
          <animateTransform attributeName="transform" type="rotate" values="0 60 92;-3 60 92;3 60 92;0 60 92" dur=".72s" repeatCount="indefinite" />
        {:else if !reducedMotion && resolvedMotion === 'sneak'}
          <animateTransform attributeName="transform" type="translate" values="0 0;-4 -2;3 0;0 0" dur="2.25s" repeatCount="indefinite" />
        {:else if !reducedMotion && resolvedMotion === 'pop-in'}
          <animateTransform attributeName="transform" type="translate" values="0 8;0 0;0 0" keyTimes="0;.22;1" dur="1.8s" repeatCount="indefinite" />
        {:else if !reducedMotion && resolvedMotion === 'recoil'}
          <animateTransform attributeName="transform" type="translate" values="0 0;4 0;-1 0;0 0" dur="1.65s" repeatCount="indefinite" />
        {/if}

        {#if character === 'dheu'}
          <path class="dheu-backpack" fill={colours.pack} stroke="#526b37" stroke-width="2" d="M26 61c-7 4-9 14-7 28l16 4 4-30Z" />
          <rect fill="#a9703d" stroke="#684829" stroke-width="1.5" x="18" y="62" width="9" height="24" rx="4.5" />
          <path fill={colours.skin} d="M47 91 43 111h12l4-20ZM66 91l2 20h12l-5-22Z" />
          <path fill={colours.shoe} stroke="#a94d38" stroke-width="1.5" d="M40 108h18v7H38c-2-2-1-5 2-7ZM67 108h17c4 2 4 5 2 7H68Z" />
          <path fill={palette.primary} stroke="#b98122" stroke-width="2" d="M35 58c7-7 15-10 25-10 11 0 21 4 28 12l-8 34H42Z" />
          <path fill={palette.secondary} d="M43 88h37l-3 12H65l-4-8-3 8H43Z" />
          <path fill={palette.accent} d="m43 57 16 8 17-9-6-9H49Z" />

          {#if resolvedPose === 'inspect' || resolvedPose === 'thinking'}
            <path fill={colours.skin} d="M38 65c-10 3-15 11-12 17 7 1 14-3 20-10ZM82 64c7 2 11 8 9 14-6 2-11-1-16-7Z" />
            <circle fill="#d9f4f6aa" stroke="#446f73" stroke-width="2" cx="92" cy="59" r="8" />
            <path fill="none" stroke="#446f73" stroke-width="3" stroke-linecap="round" d="m86 65-8 8" />
          {:else if resolvedPose === 'help'}
            <path fill={colours.skin} d="M39 67c-11 8-13 17-7 22 7-1 13-7 17-15ZM80 69c12 8 17 16 12 22-8 0-15-6-21-14Z" />
            <circle fill="#f3b932" cx="96" cy="91" r="3" />
          {:else if resolvedPose === 'action'}
            <path fill={colours.skin} d="M38 66c-12-3-18-1-20 4 5 5 13 6 22 4ZM82 64c9-9 16-10 20-6-1 7-7 12-16 16Z" />
          {:else if resolvedPose === 'proud'}
            <path fill={colours.skin} d="M39 66c-10 4-11 13-5 17l14-8ZM81 66c10 4 11 13 5 17l-14-8Z" />
          {:else}
            <path fill={colours.skin} d="M38 65c-9 3-12 10-8 16l15-7ZM82 65c9 3 12 10 8 16l-15-7Z" />
            <path fill="none" stroke="#526b37" stroke-width="2" stroke-linecap="round" d="M43 61q4 12 2 25M76 61q-4 12-2 25" />
          {/if}

          <circle fill={colours.skin} cx="33" cy="40" r="6" />
          <circle fill={colours.skin} cx="58" cy="38" r="27" />
          <path fill={colours.hair} d="M31 39c-1-18 12-31 29-31 15 0 26 9 29 23-9-8-18-11-29-8-9 2-18 8-29 16ZM39 19c3-11 13-14 20-10-6 4-8 9-7 14Z" />
          <path class="dheu-leaf" fill="#739a42" stroke="#4d6d2c" d="M39 18c-8-8-12-3-11 4 4 4 8 3 11-4Zm1 0c8-8 13-5 12 2-4 5-8 4-12-2Z" />

          {#if closedEyes}
            <path fill="none" stroke={colours.dark} stroke-width="2.4" stroke-linecap="round" d="M43 39q5 4 10 0" />
            {#if !sideView}<path fill="none" stroke={colours.dark} stroke-width="2.4" stroke-linecap="round" d="M63 39q5 4 10 0" />{/if}
          {:else}
            <ellipse fill="#fffdf8" cx={threeQuarter ? 49 : 47} cy="40" rx={surprisedExpression ? 5.2 : 4.4} ry={surprisedExpression ? 6 : 5.2} />
            <circle fill={colours.dark} cx={threeQuarter ? 50 : 48} cy="41" r="2.3" />
            {#if !sideView}
              <ellipse fill="#fffdf8" cx={threeQuarter ? 68 : 69} cy="40" rx={threeQuarter ? 3.7 : 4.4} ry={surprisedExpression ? 6 : 5.2} />
              <circle fill={colours.dark} cx={threeQuarter ? 68 : 69} cy="41" r="2.3" />
            {/if}
          {/if}
          <path fill="none" stroke={colours.dark} stroke-width="2.4" stroke-linecap="round" d={worriedExpression ? 'M41 31q6-3 11 1' : 'M41 31q6-4 11 0'} />
          {#if !sideView}<path fill="none" stroke={colours.dark} stroke-width="2.4" stroke-linecap="round" d={worriedExpression ? 'M64 32q5-4 11-1' : 'M64 31q6-4 11 0'} />{/if}
          <path fill="none" stroke={colours.dark} stroke-width="2.4" stroke-linecap="round" d={sideView ? 'M55 43q-8 3 0 6' : 'M58 42q-2 4 1 6'} />

          {#if laughExpression}
            <path fill="#7b382f" stroke={colours.dark} stroke-width="1.5" d="M45 51q13 17 27 0-4 19-14 19S48 63 45 51Z" />
          {:else if surprisedExpression}
            <ellipse fill="#7b382f" stroke={colours.dark} stroke-width="1.5" cx="59" cy="57" rx="5" ry="7" />
          {:else}
            <path fill="none" stroke={colours.dark} stroke-width="2.4" stroke-linecap="round" d={worriedExpression ? 'M50 60q9-6 18 0' : resolvedExpression === 'proud' || resolvedExpression === 'determined' || resolvedExpression === 'retry-confident' ? 'M49 56q10 8 20 0' : 'M49 55q10 10 20 0'} />
          {/if}

          {#if resolvedExpression === 'confused'}
            <path fill="none" stroke="#7650b8" stroke-width="3" stroke-linecap="round" d="M91 26c0-8 13-9 13 0 0 6-7 5-7 11M97 44v1" />
          {:else if resolvedExpression === 'wonder'}
            <path fill="#f3b932" d="m94 24 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" />
          {:else if resolvedExpression === 'helping'}
            <path fill="#ef7d72" d="M96 30c-5-7-13 0 0 10 13-10 5-17 0-10Z" />
          {/if}

        {:else if character === 'scientu'}
          <path fill={colours.pack} stroke="#355560" stroke-width="2" d="M25 64c-7 7-6 22 0 30l12-3-2-28Z" />
          <circle fill="#f2b84b" stroke="#7d652c" stroke-width="1.5" cx="24" cy="70" r="5" />
          <path fill="none" stroke={colours.pack} stroke-width="2.5" stroke-linecap="round" d="M24 65V55m0 0 6-5" />
          <path fill={colours.skin} d="M46 91 43 111h12l4-20ZM67 91l2 20h12l-5-21Z" />
          <path fill={colours.shoe} stroke="#2f6370" stroke-width="1.5" d="M40 108h18v7H38c-2-2-1-5 2-7ZM68 108h17c4 2 4 5 2 7H69Z" />
          <path fill={palette.secondary} stroke="#83b6c1" stroke-width="2" d="M32 58c6-7 16-10 27-10 12 0 22 4 30 12l-8 35H40Z" />
          <path fill={palette.primary} d="M50 59h18l-2 34H51Z" />
          <path fill="#d7f1f4" stroke="#5e8e99" stroke-width="1.5" d="m49 58 10 10-9 8-8-15Zm20 0-10 10 9 8 8-15Z" />

          {#if resolvedPose === 'inspect' || resolvedPose === 'thinking'}
            <path fill={colours.skin} d="M35 65c-12 4-15 13-9 18 7 0 13-4 18-11ZM84 64c8 0 13 6 13 12-5 4-12 2-19-4Z" />
            <circle fill="#cff7faaa" stroke="#3d6671" stroke-width="2" cx="99" cy="57" r="8" />
            <path fill="none" stroke="#3d6671" stroke-width="3" stroke-linecap="round" d="m93 63-8 8" />
          {:else if resolvedPose === 'help'}
            <path fill={colours.skin} d="M35 67c-9 9-10 18-3 22 7-2 12-7 15-15ZM84 68c11 7 16 15 12 21-8 1-15-5-20-13Z" />
            <path fill="none" stroke={colours.pack} stroke-width="2.5" stroke-linecap="round" d="m94 87 8 8" />
          {:else if resolvedPose === 'action'}
            <path fill={colours.skin} d="M36 66c-11-4-18-2-20 3 5 6 13 6 22 4ZM83 64c10-8 17-8 21-4-2 7-8 12-17 15Z" />
          {:else if resolvedPose === 'proud'}
            <path fill={colours.skin} d="M36 66c-9 4-10 12-4 17l14-8ZM84 66c9 4 10 12 4 17l-14-8Z" />
          {:else}
            <path fill={colours.skin} d="M36 65c-10 4-12 11-7 16l15-7ZM84 65c10 4 12 11 7 16l-15-7Z" />
          {/if}

          <circle fill={colours.skin} cx="34" cy="39" r="6" />
          <circle fill={colours.skin} cx="59" cy="38" r="27" />
          <path fill={colours.hair} d="M31 36c0-18 12-29 29-29 14 0 24 8 28 21-9-7-20-9-30-6-9 2-17 7-27 14ZM52 13c6-12 17-11 21-5-8 0-11 5-11 10Z" />
          <circle class="scientu-goggle" fill="#bceff4aa" stroke="#8b6326" stroke-width="2" cx="50" cy="17" r="7" />
          <circle class="scientu-goggle" fill="#bceff4aa" stroke="#8b6326" stroke-width="2" cx="67" cy="15" r="7" />
          <path fill="none" stroke="#73542a" stroke-width="2" d="M43 16q17-10 32-2" />
          <circle fill="#d9fbff66" stroke="#3d6671" stroke-width="2.4" cx={threeQuarter ? 50 : 49} cy="40" r="10" />
          {#if !sideView}<circle fill="#d9fbff66" stroke="#3d6671" stroke-width="2.4" cx={threeQuarter ? 69 : 70} cy="40" r={threeQuarter ? 8.5 : 10} />{/if}
          <path fill="none" stroke={colours.dark} stroke-width="2.3" stroke-linecap="round" d="M59 40h2" />

          {#if closedEyes}
            <path fill="none" stroke={colours.dark} stroke-width="2.3" stroke-linecap="round" d="M45 40q5 4 10 0" />
            {#if !sideView}<path fill="none" stroke={colours.dark} stroke-width="2.3" stroke-linecap="round" d="M65 40q5 4 10 0" />{/if}
          {:else}
            <circle fill={colours.dark} cx={threeQuarter ? 51 : 50} cy="41" r={surprisedExpression ? 3 : 2.5} />
            {#if !sideView}<circle fill={colours.dark} cx="70" cy="41" r={surprisedExpression ? 3 : 2.5} />{/if}
          {/if}
          <path fill="none" stroke={colours.dark} stroke-width="2.3" stroke-linecap="round" d={worriedExpression ? 'M43 30q6-2 11 2' : 'M43 30q6-4 11 0'} />
          {#if !sideView}<path fill="none" stroke={colours.dark} stroke-width="2.3" stroke-linecap="round" d={worriedExpression ? 'M65 32q5-4 11-1' : 'M65 30q6-4 11 0'} />{/if}
          <path fill="none" stroke={colours.dark} stroke-width="2.3" stroke-linecap="round" d={sideView ? 'M57 43q-8 3 0 6' : 'M59 42q-2 4 1 6'} />

          {#if laughExpression || resolvedExpression === 'aha'}
            <path fill="#74413a" stroke={colours.dark} stroke-width="1.5" d="M47 52q12 15 25 0-4 17-13 17S50 63 47 52Z" />
          {:else if surprisedExpression}
            <ellipse fill="#74413a" stroke={colours.dark} stroke-width="1.5" cx="60" cy="57" rx="5" ry="7" />
          {:else}
            <path fill="none" stroke={colours.dark} stroke-width="2.3" stroke-linecap="round" d={worriedExpression ? 'M51 60q8-5 17 0' : 'M50 55q10 9 20 0'} />
          {/if}

          {#if resolvedExpression === 'thinking' || resolvedExpression === 'confused'}
            <circle fill="#52aabd" cx="91" cy="25" r="2.5" /><circle fill="#52aabd" cx="99" cy="17" r="3.8" />
          {:else if resolvedExpression === 'aha'}
            <path fill="#f3b932" d="m96 21 2 6 6 2-6 2-2 6-2-6-6-2 6-2Z" />
          {:else if resolvedExpression === 'helping'}
            <path fill="#ef7d72" d="M97 29c-5-7-13 0 0 10 13-10 5-17 0-10Z" />
          {/if}
          <circle fill="#f6cf59" stroke="#c29327" stroke-width="1.5" cx="72" cy="79" r="6" />
          <path fill={palette.primary} d="m72 74 1.5 3.5 3.5 1.5-3.5 1.5L72 84l-1.5-3.5L67 79l3.5-1.5Z" />

        {:else}
          <g>
            {#if !reducedMotion && resolvedMotion === 'cape-swish'}
              <animateTransform attributeName="transform" type="rotate" values="0 61 65;6 61 65;0 61 65" dur="1.25s" repeatCount="indefinite" />
            {/if}
            <path class="shaitanu-cape" fill={colours.pack} stroke="#35213f" stroke-width="2" d="M30 57c-10 9-15 25-10 42l22-8 14-28ZM87 56c12 10 17 26 10 42l-22-9-12-26Z" />
          </g>
          <path fill={colours.skin} d="M46 91 42 111h12l5-20ZM68 91l2 20h12l-5-22Z" />
          <path fill={colours.shoe} stroke="#271b2a" stroke-width="1.5" d="M39 108h18v7H36c-3-3 0-6 3-7ZM69 108h17c4 2 4 5 2 7H70Z" />
          <path fill={palette.primary} stroke="#4c3377" stroke-width="2" d="M33 58c7-8 17-11 28-11 12 0 22 4 30 13l-10 35H41Z" />
          <path fill="#5c3a8f" d="M48 61h26l-4 31H50Z" />
          <path fill="#3d2b40" d="M43 83h39v7H43Z" />
          <circle fill={palette.accent} cx="63" cy="86" r="4" />

          {#if resolvedPose === 'help'}
            <path fill={colours.skin} d="M37 66c-8 8-9 17-3 21 7-1 12-7 15-14ZM86 67c11 6 16 14 12 20-7 2-15-3-21-11Z" />
            <path fill="#f3b932" d="m101 88 2 4 4 2-4 2-2 4-2-4-4-2 4-2Z" />
          {:else if resolvedPose === 'action'}
            <path fill={colours.skin} d="M37 66c-12-4-18-1-20 4 5 6 14 6 23 3ZM85 64c10-9 17-9 21-5-2 7-8 12-17 16Z" />
          {:else if resolvedPose === 'thinking' || resolvedPose === 'inspect'}
            <path fill={colours.skin} d="M37 66c-9 4-11 12-5 17l14-8ZM85 66c5-6 8-13 5-18-6 0-10 5-13 14Z" />
          {:else if resolvedPose === 'proud'}
            <path fill={colours.skin} d="M38 68c11 1 20 6 28 13l-5 7c-12-5-21-8-30-9ZM86 68c-11 1-20 6-28 13l5 7c12-5 21-8 30-9Z" />
          {:else}
            <path fill={colours.skin} d="M37 66c-10 4-12 11-7 16l15-7ZM86 66c10 4 12 11 7 16l-15-7Z" />
          {/if}

          <path fill={colours.skin} stroke="#8f624b" stroke-width="1.5" d="M37 38 20 33l13 14ZM82 38l17-5-13 14Z" />
          <circle fill={colours.skin} cx="61" cy="39" r="27" />
          <path fill={colours.hair} d="M34 36c0-18 11-30 28-30 15 0 26 9 29 23-10-7-20-9-30-6-9 2-18 7-27 13ZM45 17 39 4l13 8 8-10 3 14Z" />
          <path class="shaitanu-orange-streak" fill={palette.accent} d="M58 9c8-10 18-7 20-1-8 1-11 5-12 11Z" />

          {#if closedEyes}
            <path fill="none" stroke={colours.dark} stroke-width="2.5" stroke-linecap="round" d="M45 41q6 4 11-1" />
            {#if !sideView}<path fill="none" stroke={colours.dark} stroke-width="2.5" stroke-linecap="round" d="M67 40q6 4 11-1" />{/if}
          {:else}
            <ellipse fill="#fffdf8" cx={threeQuarter ? 51 : 49} cy="41" rx={surprisedExpression ? 5 : 4.3} ry={surprisedExpression ? 6 : 5} />
            <circle fill="#4a275c" cx={threeQuarter ? 52 : 50} cy="42" r="2.4" />
            {#if !sideView}
              <ellipse fill="#fffdf8" cx={threeQuarter ? 72 : 73} cy="41" rx={threeQuarter ? 3.7 : 4.3} ry={surprisedExpression ? 6 : 5} />
              <circle fill="#4a275c" cx={threeQuarter ? 72 : 73} cy="42" r="2.4" />
            {/if}
          {/if}
          <path fill="none" stroke={colours.dark} stroke-width="2.5" stroke-linecap="round" d={resolvedExpression === 'fake-innocent' ? 'M42 30q7 4 13 0' : worriedExpression ? 'M42 32q6-4 12-1' : 'M42 30q7-6 13-1'} />
          {#if !sideView}<path fill="none" stroke={colours.dark} stroke-width="2.5" stroke-linecap="round" d={resolvedExpression === 'fake-innocent' ? 'M67 30q7 4 13 0' : worriedExpression ? 'M67 31q6-3 12 1' : 'M67 29q7-3 13 2'} />{/if}
          <path fill="none" stroke={colours.dark} stroke-width="2.5" stroke-linecap="round" d={sideView ? 'M60 43q-9 3 0 6' : 'M61 43q-2 4 1 6'} />

          {#if laughExpression}
            <path fill="#6e303e" stroke={colours.dark} stroke-width="1.5" d="M47 51q14 19 29 0-4 21-15 21S51 64 47 51Z" />
            <path fill="#fff9ed" d="m56 55 6 0-3 7Z" />
          {:else if surprisedExpression}
            <ellipse fill="#6e303e" stroke={colours.dark} stroke-width="1.5" cx="62" cy="58" rx="5.5" ry="7.5" />
          {:else}
            <path fill="none" stroke={colours.dark} stroke-width="2.5" stroke-linecap="round" d={resolvedExpression === 'sulky' ? 'M52 62q10-7 20 0' : resolvedExpression === 'admiring' || resolvedExpression === 'helping' ? 'M51 57q10 7 20 0' : resolvedExpression === 'fake-innocent' ? 'M54 57q8 3 15 0' : 'M49 55q12 12 25 1'} />
            {#if resolvedExpression !== 'sulky' && resolvedExpression !== 'admiring' && resolvedExpression !== 'helping' && resolvedExpression !== 'fake-innocent'}<path fill="#fff9ed" d="m58 58 6 0-3 7Z" />{/if}
          {/if}

          {#if resolvedExpression === 'confused' || resolvedExpression === 'fake-innocent'}
            <path fill="none" stroke={palette.primary} stroke-width="3" stroke-linecap="round" d="M99 24c0-8 13-9 13 0 0 6-7 5-7 11M105 42v1" />
          {:else if resolvedExpression === 'wicked-laugh' || resolvedExpression === 'sly'}
            <path fill="none" stroke={colours.dark} stroke-width="2.5" stroke-linecap="round" d="M98 28c9-8 15 6 5 8-7 1-8-7-2-9" />
          {:else if resolvedExpression === 'admiring'}
            <path fill="#f3b932" d="m101 25 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" />
          {/if}
        {/if}
      </g>
    </g>
  </g>
</svg>
