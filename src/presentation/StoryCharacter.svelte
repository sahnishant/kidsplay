<script lang="ts">
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

  let persona = $derived(getStoryCharacterPersona(character));
  let resolvedMotion = $derived<StoryCharacterMotion>(motion ?? persona.visual.defaultMotion);

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
  let laughExpression = $derived(
    resolvedExpression === 'happy-laugh' || resolvedExpression === 'wicked-laugh'
  );
  let closedEyes = $derived(laughExpression || resolvedExpression === 'sulky');
  let surprisedExpression = $derived(
    resolvedExpression === 'surprised' || resolvedExpression === 'mock-shock' || resolvedExpression === 'aha'
  );
  let worriedExpression = $derived(
    resolvedExpression === 'worried' || resolvedExpression === 'confused' || resolvedExpression === 'sulky'
  );
</script>

<svg
  class={`story-character story-character--${character} story-character--pose-${resolvedPose} story-character--expression-${resolvedExpression} story-character--motion-${resolvedMotion} story-character--angle-${resolvedAngle}`}
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
  <g class="story-character__orientation" transform={orientationTransform}>
    <g class="story-character__pose">
      <g class="story-character__actor">
        {#if character === 'dheu'}
          <path class="dheu-backpack" d="M26 61c-7 4-9 14-7 28l16 4 4-30Z" />
          <rect class="dheu-pack-roll" x="18" y="62" width="9" height="24" rx="4.5" />
          <path class="dheu-leg" d="M47 91 43 111h12l4-20Z" />
          <path class="dheu-leg" d="m66 91 2 20h12l-5-22Z" />
          <path class="dheu-shoe" d="M40 108h18v7H38c-2-2-1-5 2-7Z" />
          <path class="dheu-shoe" d="M67 108h17c4 2 4 5 2 7H68Z" />
          <path class="dheu-body" d="M35 58c7-7 15-10 25-10 11 0 21 4 28 12l-8 34H42Z" />
          <path class="dheu-shorts" d="M43 88h37l-3 12H65l-4-8-3 8H43Z" />
          <path class="dheu-scarf" d="m43 57 16 8 17-9-6-9H49Z" />

          {#if resolvedPose === 'inspect' || resolvedPose === 'thinking'}
            <path class="dheu-arm" d="M38 65c-10 3-15 11-12 17 7 1 14-3 20-10Z" />
            <path class="dheu-arm dheu-arm--inspect" d="M82 64c7 2 11 8 9 14-6 2-11-1-16-7Z" />
            <circle class="dheu-magnifier" cx="92" cy="59" r="8" />
            <path class="dheu-magnifier-handle" d="m86 65-8 8" />
          {:else if resolvedPose === 'help'}
            <path class="dheu-arm" d="M39 67c-11 8-13 17-7 22 7-1 13-7 17-15Z" />
            <path class="dheu-arm dheu-arm--help" d="M80 69c12 8 17 16 12 22-8 0-15-6-21-14Z" />
            <circle class="help-spark" cx="96" cy="91" r="3" />
          {:else if resolvedPose === 'action'}
            <path class="dheu-arm" d="M38 66c-12-3-18-1-20 4 5 5 13 6 22 4Z" />
            <path class="dheu-arm" d="M82 64c9-9 16-10 20-6-1 7-7 12-16 16Z" />
          {:else if resolvedPose === 'proud'}
            <path class="dheu-arm" d="M39 66c-10 4-11 13-5 17l14-8Z" />
            <path class="dheu-arm" d="M81 66c10 4 11 13 5 17l-14-8Z" />
          {:else}
            <path class="dheu-arm" d="M38 65c-9 3-12 10-8 16l15-7Z" />
            <path class="dheu-arm" d="M82 65c9 3 12 10 8 16l-15-7Z" />
            <path class="dheu-strap" d="M43 61q4 12 2 25M76 61q-4 12-2 25" />
          {/if}

          <circle class="dheu-ear" cx="33" cy="40" r="6" />
          <circle class="dheu-head" cx="58" cy="38" r="27" />
          <path class="dheu-hair" d="M31 39c-1-18 12-31 29-31 15 0 26 9 29 23-9-8-18-11-29-8-9 2-18 8-29 16Z" />
          <path class="dheu-hair" d="M39 19c3-11 13-14 20-10-6 4-8 9-7 14Z" />
          <path class="dheu-leaf" d="M39 18c-8-8-12-3-11 4 4 4 8 3 11-4Zm1 0c8-8 13-5 12 2-4 5-8 4-12-2Z" />

          {#if closedEyes}
            <path class="dheu-eye-line" d="M43 39q5 4 10 0" />
            {#if !sideView}<path class="dheu-eye-line" d="M63 39q5 4 10 0" />{/if}
          {:else}
            <ellipse class="dheu-eye-white" cx={threeQuarter ? 49 : 47} cy="40" rx={surprisedExpression ? 5.2 : 4.4} ry={surprisedExpression ? 6 : 5.2} />
            <circle class="dheu-eye" cx={threeQuarter ? 50 : 48} cy="41" r="2.3" />
            {#if !sideView}
              <ellipse class="dheu-eye-white" cx={threeQuarter ? 68 : 69} cy="40" rx={threeQuarter ? 3.7 : 4.4} ry={surprisedExpression ? 6 : 5.2} />
              <circle class="dheu-eye" cx={threeQuarter ? 68 : 69} cy="41" r="2.3" />
            {/if}
          {/if}
          <path class="dheu-brow" d={worriedExpression ? 'M41 31q6-3 11 1' : 'M41 31q6-4 11 0'} />
          {#if !sideView}<path class="dheu-brow" d={worriedExpression ? 'M64 32q5-4 11-1' : 'M64 31q6-4 11 0'} />{/if}
          <path class="dheu-nose" d={sideView ? 'M55 43q-8 3 0 6' : 'M58 42q-2 4 1 6'} />

          {#if laughExpression}
            <path class="dheu-mouth-open" d="M45 51q13 17 27 0-4 19-14 19S48 63 45 51Z" />
          {:else if surprisedExpression}
            <ellipse class="dheu-mouth-open" cx="59" cy="57" rx="5" ry="7" />
          {:else if worriedExpression}
            <path class="dheu-mouth" d="M50 60q9-6 18 0" />
          {:else if resolvedExpression === 'proud' || resolvedExpression === 'determined' || resolvedExpression === 'retry-confident'}
            <path class="dheu-mouth" d="M49 56q10 8 20 0" />
          {:else}
            <path class="dheu-mouth" d="M49 55q10 10 20 0" />
          {/if}

          {#if resolvedExpression === 'confused'}
            <path class="question-mark" d="M91 26c0-8 13-9 13 0 0 6-7 5-7 11M97 44v1" />
          {:else if resolvedExpression === 'wonder'}
            <path class="spark" d="m94 24 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" />
          {:else if resolvedExpression === 'helping'}
            <path class="heart" d="M96 30c-5-7-13 0 0 10 13-10 5-17 0-10Z" />
          {/if}

        {:else if character === 'scientu'}
          <path class="scientu-pack" d="M25 64c-7 7-6 22 0 30l12-3-2-28Z" />
          <circle class="scientu-gadget" cx="24" cy="70" r="5" />
          <path class="scientu-gadget-line" d="M24 65V55m0 0 6-5" />
          <path class="scientu-leg" d="M46 91 43 111h12l4-20Z" />
          <path class="scientu-leg" d="m67 91 2 20h12l-5-21Z" />
          <path class="scientu-shoe" d="M40 108h18v7H38c-2-2-1-5 2-7Z" />
          <path class="scientu-shoe" d="M68 108h17c4 2 4 5 2 7H69Z" />
          <path class="scientu-coat" d="M32 58c6-7 16-10 27-10 12 0 22 4 30 12l-8 35H40Z" />
          <path class="scientu-shirt" d="M50 59h18l-2 34H51Z" />
          <path class="scientu-collar" d="m49 58 10 10-9 8-8-15Z" />
          <path class="scientu-collar" d="m69 58-10 10 9 8 8-15Z" />

          {#if resolvedPose === 'inspect' || resolvedPose === 'thinking'}
            <path class="scientu-arm" d="M35 65c-12 4-15 13-9 18 7 0 13-4 18-11Z" />
            <path class="scientu-arm scientu-arm--inspect" d="M84 64c8 0 13 6 13 12-5 4-12 2-19-4Z" />
            <circle class="scientu-lens" cx="99" cy="57" r="8" />
            <path class="scientu-lens-handle" d="m93 63-8 8" />
          {:else if resolvedPose === 'help'}
            <path class="scientu-arm" d="M35 67c-9 9-10 18-3 22 7-2 12-7 15-15Z" />
            <path class="scientu-arm" d="M84 68c11 7 16 15 12 21-8 1-15-5-20-13Z" />
            <path class="scientu-tool" d="m94 87 8 8" />
          {:else if resolvedPose === 'action'}
            <path class="scientu-arm" d="M36 66c-11-4-18-2-20 3 5 6 13 6 22 4Z" />
            <path class="scientu-arm" d="M83 64c10-8 17-8 21-4-2 7-8 12-17 15Z" />
          {:else if resolvedPose === 'proud'}
            <path class="scientu-arm" d="M36 66c-9 4-10 12-4 17l14-8Z" />
            <path class="scientu-arm" d="M84 66c9 4 10 12 4 17l-14-8Z" />
          {:else}
            <path class="scientu-arm" d="M36 65c-10 4-12 11-7 16l15-7Z" />
            <path class="scientu-arm" d="M84 65c10 4 12 11 7 16l-15-7Z" />
          {/if}

          <circle class="scientu-ear" cx="34" cy="39" r="6" />
          <circle class="scientu-head" cx="59" cy="38" r="27" />
          <path class="scientu-hair" d="M31 36c0-18 12-29 29-29 14 0 24 8 28 21-9-7-20-9-30-6-9 2-17 7-27 14Z" />
          <path class="scientu-hair scientu-hair--tuft" d="M52 13c6-12 17-11 21-5-8 0-11 5-11 10Z" />
          <circle class="scientu-goggle" cx="50" cy="17" r="7" />
          <circle class="scientu-goggle" cx="67" cy="15" r="7" />
          <path class="scientu-goggle-strap" d="M43 16q17-10 32-2" />

          <circle class="scientu-glass" cx={threeQuarter ? 50 : 49} cy="40" r="10" />
          {#if !sideView}<circle class="scientu-glass" cx={threeQuarter ? 69 : 70} cy="40" r={threeQuarter ? 8.5 : 10} />{/if}
          <path class="scientu-glass-bridge" d="M59 40h2" />
          {#if closedEyes}
            <path class="scientu-eye-line" d="M45 40q5 4 10 0" />
            {#if !sideView}<path class="scientu-eye-line" d="M65 40q5 4 10 0" />{/if}
          {:else}
            <circle class="scientu-eye" cx={threeQuarter ? 51 : 50} cy="41" r={surprisedExpression ? 3 : 2.5} />
            {#if !sideView}<circle class="scientu-eye" cx={threeQuarter ? 70 : 70} cy="41" r={surprisedExpression ? 3 : 2.5} />{/if}
          {/if}
          <path class="scientu-brow" d={worriedExpression ? 'M43 30q6-2 11 2' : 'M43 30q6-4 11 0'} />
          {#if !sideView}<path class="scientu-brow" d={worriedExpression ? 'M65 32q5-4 11-1' : 'M65 30q6-4 11 0'} />{/if}
          <path class="scientu-nose" d={sideView ? 'M57 43q-8 3 0 6' : 'M59 42q-2 4 1 6'} />

          {#if laughExpression || resolvedExpression === 'aha'}
            <path class="scientu-mouth-open" d="M47 52q12 15 25 0-4 17-13 17S50 63 47 52Z" />
          {:else if surprisedExpression}
            <ellipse class="scientu-mouth-open" cx="60" cy="57" rx="5" ry="7" />
          {:else if worriedExpression}
            <path class="scientu-mouth" d="M51 60q8-5 17 0" />
          {:else}
            <path class="scientu-mouth" d="M50 55q10 9 20 0" />
          {/if}

          {#if resolvedExpression === 'thinking' || resolvedExpression === 'confused'}
            <circle class="thought-dot" cx="91" cy="25" r="2.5" />
            <circle class="thought-dot" cx="99" cy="17" r="3.8" />
          {:else if resolvedExpression === 'aha'}
            <path class="spark" d="m96 21 2 6 6 2-6 2-2 6-2-6-6-2 6-2Z" />
          {:else if resolvedExpression === 'helping'}
            <path class="heart" d="M97 29c-5-7-13 0 0 10 13-10 5-17 0-10Z" />
          {/if}
          <circle class="scientu-badge" cx="72" cy="79" r="6" />
          <path class="scientu-badge-mark" d="m72 74 1.5 3.5 3.5 1.5-3.5 1.5L72 84l-1.5-3.5L67 79l3.5-1.5Z" />

        {:else}
          <path class="shaitanu-cape" d="M30 57c-10 9-15 25-10 42l22-8 14-28Z" />
          <path class="shaitanu-cape shaitanu-cape--right" d="M87 56c12 10 17 26 10 42l-22-9-12-26Z" />
          <path class="shaitanu-leg" d="M46 91 42 111h12l5-20Z" />
          <path class="shaitanu-leg" d="m68 91 2 20h12l-5-22Z" />
          <path class="shaitanu-boot" d="M39 108h18v7H36c-3-3 0-6 3-7Z" />
          <path class="shaitanu-boot" d="M69 108h17c4 2 4 5 2 7H70Z" />
          <path class="shaitanu-body" d="M33 58c7-8 17-11 28-11 12 0 22 4 30 13l-10 35H41Z" />
          <path class="shaitanu-vest" d="M48 61h26l-4 31H50Z" />
          <path class="shaitanu-belt" d="M43 83h39v7H43Z" />
          <circle class="shaitanu-buckle" cx="63" cy="86" r="4" />

          {#if resolvedPose === 'help'}
            <path class="shaitanu-arm" d="M37 66c-8 8-9 17-3 21 7-1 12-7 15-14Z" />
            <path class="shaitanu-arm" d="M86 67c11 6 16 14 12 20-7 2-15-3-21-11Z" />
            <path class="help-spark" d="m101 88 2 4 4 2-4 2-2 4-2-4-4-2 4-2Z" />
          {:else if resolvedPose === 'action'}
            <path class="shaitanu-arm" d="M37 66c-12-4-18-1-20 4 5 6 14 6 23 3Z" />
            <path class="shaitanu-arm" d="M85 64c10-9 17-9 21-5-2 7-8 12-17 16Z" />
          {:else if resolvedPose === 'thinking' || resolvedPose === 'inspect'}
            <path class="shaitanu-arm" d="M37 66c-9 4-11 12-5 17l14-8Z" />
            <path class="shaitanu-arm shaitanu-arm--chin" d="M85 66c5-6 8-13 5-18-6 0-10 5-13 14Z" />
          {:else if resolvedPose === 'proud'}
            <path class="shaitanu-arm shaitanu-arm--cross" d="M38 68c11 1 20 6 28 13l-5 7c-12-5-21-8-30-9Z" />
            <path class="shaitanu-arm shaitanu-arm--cross" d="M86 68c-11 1-20 6-28 13l5 7c12-5 21-8 30-9Z" />
          {:else}
            <path class="shaitanu-arm" d="M37 66c-10 4-12 11-7 16l15-7Z" />
            <path class="shaitanu-arm" d="M86 66c10 4 12 11 7 16l-15-7Z" />
          {/if}

          <path class="shaitanu-ear" d="M37 38 20 33l13 14Z" />
          <path class="shaitanu-ear shaitanu-ear--right" d="m82 38 17-5-13 14Z" />
          <circle class="shaitanu-head" cx="61" cy="39" r="27" />
          <path class="shaitanu-hair" d="M34 36c0-18 11-30 28-30 15 0 26 9 29 23-10-7-20-9-30-6-9 2-18 7-27 13Z" />
          <path class="shaitanu-hair" d="M45 17 39 4l13 8 8-10 3 14Z" />
          <path class="shaitanu-orange-streak" d="M58 9c8-10 18-7 20-1-8 1-11 5-12 11Z" />

          {#if closedEyes}
            <path class="shaitanu-eye-line" d="M45 41q6 4 11-1" />
            {#if !sideView}<path class="shaitanu-eye-line" d="M67 40q6 4 11-1" />{/if}
          {:else}
            <ellipse class="shaitanu-eye-white" cx={threeQuarter ? 51 : 49} cy="41" rx={surprisedExpression ? 5 : 4.3} ry={surprisedExpression ? 6 : 5} />
            <circle class="shaitanu-eye" cx={threeQuarter ? 52 : 50} cy="42" r="2.4" />
            {#if !sideView}
              <ellipse class="shaitanu-eye-white" cx={threeQuarter ? 72 : 73} cy="41" rx={threeQuarter ? 3.7 : 4.3} ry={surprisedExpression ? 6 : 5} />
              <circle class="shaitanu-eye" cx={threeQuarter ? 72 : 73} cy="42" r="2.4" />
            {/if}
          {/if}

          <path class="shaitanu-brow" d={resolvedExpression === 'fake-innocent' ? 'M42 30q7 4 13 0' : worriedExpression ? 'M42 32q6-4 12-1' : 'M42 30q7-6 13-1'} />
          {#if !sideView}<path class="shaitanu-brow" d={resolvedExpression === 'fake-innocent' ? 'M67 30q7 4 13 0' : worriedExpression ? 'M67 31q6-3 12 1' : 'M67 29q7-3 13 2'} />{/if}
          <path class="shaitanu-nose" d={sideView ? 'M60 43q-9 3 0 6' : 'M61 43q-2 4 1 6'} />

          {#if laughExpression}
            <path class="shaitanu-mouth-open" d="M47 51q14 19 29 0-4 21-15 21S51 64 47 51Z" />
            <path class="shaitanu-fang" d="m56 55 6 0-3 7Z" />
          {:else if surprisedExpression}
            <ellipse class="shaitanu-mouth-open" cx="62" cy="58" rx="5.5" ry="7.5" />
          {:else if resolvedExpression === 'sulky'}
            <path class="shaitanu-mouth" d="M52 62q10-7 20 0" />
          {:else if resolvedExpression === 'admiring' || resolvedExpression === 'helping'}
            <path class="shaitanu-mouth" d="M51 57q10 7 20 0" />
          {:else if resolvedExpression === 'fake-innocent'}
            <path class="shaitanu-mouth" d="M54 57q8 3 15 0" />
          {:else}
            <path class="shaitanu-mouth" d="M49 55q12 12 25 1" />
            <path class="shaitanu-fang" d="m58 58 6 0-3 7Z" />
          {/if}

          {#if resolvedExpression === 'confused' || resolvedExpression === 'fake-innocent'}
            <path class="question-mark" d="M99 24c0-8 13-9 13 0 0 6-7 5-7 11M105 42v1" />
          {:else if resolvedExpression === 'wicked-laugh' || resolvedExpression === 'sly'}
            <path class="shaitanu-swirl" d="M98 28c9-8 15 6 5 8-7 1-8-7-2-9" />
          {:else if resolvedExpression === 'admiring'}
            <path class="spark" d="m101 25 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" />
          {/if}
        {/if}
      </g>
    </g>
  </g>
</svg>

<style>
  .story-character{width:100%;height:100%;overflow:visible}
  .story-character__orientation,.story-character__pose,.story-character__actor{transform-origin:60px 92px}
  .story-character--pose-help .story-character__pose{transform:translateY(7px) rotate(-3deg) scale(.96)}
  .story-character--pose-action .story-character__pose{transform:rotate(-5deg) translateX(-2px)}
  .story-character--pose-inspect .story-character__pose,.story-character--pose-thinking .story-character__pose{transform:rotate(-2deg)}
  .story-character--motion-idle .story-character__actor,.story-character--motion-bob .story-character__actor{animation:persona-bob 2.8s ease-in-out infinite}
  .story-character--motion-float .story-character__actor{animation:persona-float 3.2s ease-in-out infinite}
  .story-character--motion-bounce .story-character__actor,.story-character--motion-jump .story-character__actor,.story-character--motion-celebrate .story-character__actor,.story-character--motion-clap .story-character__actor{animation:persona-bounce 1.05s ease-in-out infinite}
  .story-character--motion-head-tilt .story-character__actor,.story-character--motion-think .story-character__actor{animation:persona-head-tilt 2.1s ease-in-out infinite}
  .story-character--motion-lean-in .story-character__actor,.story-character--motion-inspect .story-character__actor,.story-character--motion-point .story-character__actor,.story-character--motion-help .story-character__actor{animation:persona-lean 1.9s ease-in-out infinite}
  .story-character--motion-wiggle .story-character__actor,.story-character--motion-chuckle .story-character__actor{animation:persona-wiggle .72s ease-in-out infinite}
  .story-character--motion-sneak .story-character__actor{animation:persona-sneak 2.25s ease-in-out infinite}
  .story-character--motion-pop-in .story-character__actor{animation:persona-pop 1.8s ease-out infinite}
  .story-character--motion-recoil .story-character__actor{animation:persona-recoil 1.65s ease-in-out infinite}
  .story-character--motion-cape-swish .shaitanu-cape{transform-origin:61px 65px;animation:cape-swish 1.25s ease-in-out infinite}

  .dheu-backpack{fill:#7c9b52;stroke:#526b37;stroke-width:2}.dheu-pack-roll{fill:#a9703d;stroke:#684829;stroke-width:1.5}.dheu-leg,.dheu-arm,.dheu-ear,.dheu-head{fill:#eab17d}.dheu-body{fill:#e7b63d;stroke:#b98122;stroke-width:2}.dheu-shorts{fill:#709746}.dheu-scarf{fill:#ef7d5a}.dheu-shoe{fill:#ef7853;stroke:#a94d38;stroke-width:1.5}.dheu-strap{fill:none;stroke:#526b37;stroke-width:2;stroke-linecap:round}.dheu-hair{fill:#4a3022}.dheu-leaf{fill:#739a42;stroke:#4d6d2c;stroke-width:1}.dheu-eye-white,.shaitanu-eye-white{fill:#fffdf8}.dheu-eye{fill:#513526}.dheu-eye-line,.dheu-brow,.dheu-mouth,.dheu-nose{fill:none;stroke:#513526;stroke-width:2.4;stroke-linecap:round}.dheu-mouth-open{fill:#7b382f;stroke:#513526;stroke-width:1.5}.dheu-magnifier{fill:#d9f4f6aa;stroke:#446f73;stroke-width:2}.dheu-magnifier-handle{stroke:#446f73;stroke-width:3;stroke-linecap:round}

  .scientu-pack{fill:#567c89;stroke:#355560;stroke-width:2}.scientu-gadget{fill:#f2b84b;stroke:#7d652c;stroke-width:1.5}.scientu-gadget-line,.scientu-tool{stroke:#567c89;stroke-width:2.5;stroke-linecap:round}.scientu-leg,.scientu-arm,.scientu-ear,.scientu-head{fill:#e8b37f}.scientu-coat{fill:#eef9fb;stroke:#83b6c1;stroke-width:2}.scientu-shirt{fill:#39a9bd}.scientu-collar{fill:#d7f1f4;stroke:#5e8e99;stroke-width:1.5;stroke-linejoin:round}.scientu-shoe{fill:#3f8898;stroke:#2f6370;stroke-width:1.5}.scientu-hair{fill:#283d52}.scientu-hair--tuft{fill:#3e5e76}.scientu-goggle{fill:#bceff4aa;stroke:#8b6326;stroke-width:2}.scientu-goggle-strap{fill:none;stroke:#73542a;stroke-width:2}.scientu-glass{fill:#d9fbff66;stroke:#3d6671;stroke-width:2.4}.scientu-glass-bridge,.scientu-eye-line,.scientu-mouth,.scientu-nose,.scientu-brow{fill:none;stroke:#354e5b;stroke-width:2.3;stroke-linecap:round}.scientu-eye{fill:#28424e}.scientu-mouth-open{fill:#74413a;stroke:#354e5b;stroke-width:1.5}.scientu-lens{fill:#cff7faaa;stroke:#3d6671;stroke-width:2}.scientu-lens-handle{stroke:#3d6671;stroke-width:3;stroke-linecap:round}.scientu-badge{fill:#f6cf59;stroke:#c29327;stroke-width:1.5}.scientu-badge-mark{fill:#39a9bd}

  .shaitanu-cape{fill:#4b315f;stroke:#35213f;stroke-width:2}.shaitanu-leg,.shaitanu-arm,.shaitanu-head{fill:#d79a73}.shaitanu-body{fill:#7550b8;stroke:#4c3377;stroke-width:2}.shaitanu-vest{fill:#5c3a8f}.shaitanu-belt{fill:#3d2b40}.shaitanu-buckle{fill:#f28a35}.shaitanu-boot{fill:#3d2b40;stroke:#271b2a;stroke-width:1.5}.shaitanu-ear{fill:#d79a73;stroke:#8f624b;stroke-width:1.5}.shaitanu-hair{fill:#452952}.shaitanu-orange-streak{fill:#f28a35}.shaitanu-eye{fill:#4a275c}.shaitanu-eye-line,.shaitanu-brow,.shaitanu-mouth,.shaitanu-nose,.shaitanu-swirl{fill:none;stroke:#38233f;stroke-width:2.5;stroke-linecap:round}.shaitanu-mouth-open{fill:#6e303e;stroke:#38233f;stroke-width:1.5}.shaitanu-fang{fill:#fff9ed}

  .question-mark{fill:none;stroke:#7650b8;stroke-width:3;stroke-linecap:round}.thought-dot{fill:#52aabd}.spark,.help-spark{fill:#f3b932}.heart{fill:#ef7d72}.help-spark{stroke:none}

  @keyframes persona-bob{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-2px) rotate(1deg)}}
  @keyframes persona-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
  @keyframes persona-bounce{0%,100%{transform:translateY(0) scale(1)}45%{transform:translateY(-7px) scale(1.025)}}
  @keyframes persona-head-tilt{0%,100%{transform:rotate(0deg)}50%{transform:rotate(-4deg) translateY(-1px)}}
  @keyframes persona-lean{0%,100%{transform:rotate(0deg) translateX(0)}50%{transform:rotate(-3deg) translateX(-2px)}}
  @keyframes persona-wiggle{0%,100%{transform:rotate(0deg)}25%{transform:rotate(-3deg) translateY(-1px)}75%{transform:rotate(3deg) translateY(-1px)}}
  @keyframes persona-sneak{0%,100%{transform:translateX(0) translateY(0) rotate(0deg)}35%{transform:translateX(-4px) translateY(-2px) rotate(-2deg)}70%{transform:translateX(3px) translateY(0) rotate(2deg)}}
  @keyframes persona-pop{0%,15%{transform:translateY(9px) scale(.88);opacity:.65}28%,75%{transform:translateY(0) scale(1.03);opacity:1}100%{transform:translateY(0) scale(1);opacity:1}}
  @keyframes persona-recoil{0%,100%{transform:translateX(0) rotate(0deg)}35%{transform:translateX(4px) rotate(4deg)}60%{transform:translateX(-1px) rotate(-1deg)}}
  @keyframes cape-swish{0%,100%{transform:rotate(0deg) skewX(0deg)}50%{transform:rotate(6deg) skewX(-5deg)}}

  @media(prefers-reduced-motion:reduce){.story-character__actor,.shaitanu-cape{animation:none!important}}
</style>
