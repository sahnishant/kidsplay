<script lang="ts">
  import VisualEntity from './VisualEntity.svelte';
  import { resolveAnimationComposition } from './animationRegistry';

  let {
    animationId,
    embedded = false,
    decorative = false
  }: {
    animationId: string;
    embedded?: boolean;
    decorative?: boolean;
  } = $props();

  let composition = $derived(resolveAnimationComposition(animationId));

  function partStyle(x: number, y: number, scale = 1): string {
    return `left:${x}%;top:${y}%;--animation-scale:${scale}`;
  }
</script>

{#if composition}
  <div
    class:semantic-animation--embedded={embedded}
    class={`semantic-animation semantic-animation--${composition.theme}`}
    data-animation-id={composition.id}
    data-semantic-ref={composition.semanticRef}
    data-pose={composition.subject.pose}
    data-expression={composition.subject.expression}
    data-orientation={composition.subject.orientation}
    role={decorative ? undefined : 'img'}
    aria-label={decorative ? undefined : composition.ariaLabel}
    aria-hidden={decorative ? 'true' : undefined}
  >
    <span
      class="semantic-animation__subject"
      data-part-role="subject"
      style={partStyle(composition.subject.x, composition.subject.y, composition.subject.scale)}
      aria-hidden="true"
    >
      <VisualEntity visualRef={composition.subject.variantRef} context="feedback" />
    </span>

    {#each composition.parts as part (part.id)}
      <span
        class={`semantic-animation__part semantic-animation__part--${part.role}${part.motion ? ` composition-motion--${part.motion}` : ''}`}
        data-part-id={part.id}
        data-part-role={part.role}
        data-part-slot={part.slot}
        data-visual-ref={part.visualRef}
        style={partStyle(part.x, part.y, part.scale)}
        aria-hidden="true"
      >
        {#if part.visualRef}
          <VisualEntity visualRef={part.visualRef} context="feedback" />
        {:else if part.text}
          <span class="semantic-animation__text">{part.text}</span>
        {/if}
      </span>
    {/each}
  </div>
{:else}
  <div
    class="semantic-animation semantic-animation--missing"
    data-animation-id={animationId}
    role={decorative ? undefined : 'img'}
    aria-label={decorative ? undefined : `Missing animation ${animationId}`}
    aria-hidden={decorative ? 'true' : undefined}
  ></div>
{/if}

<style>
  .semantic-animation {
    position: relative;
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    border-radius: inherit;
  }

  .semantic-animation:not(.semantic-animation--embedded).semantic-animation--grass {
    background: linear-gradient(#c9efff 0 58%, #a9dc79 58% 100%);
  }

  .semantic-animation:not(.semantic-animation--embedded).semantic-animation--ocean {
    background: linear-gradient(#c9f1ff 0 22%, #5bc0e9 22%, #2988c8 100%);
  }

  .semantic-animation:not(.semantic-animation--embedded).semantic-animation--paper {
    background:
      radial-gradient(circle at 18% 20%, rgba(90, 82, 213, 0.08), transparent 23%),
      linear-gradient(145deg, #fff 0%, #f6f7fb 100%);
  }

  .semantic-animation__subject,
  .semantic-animation__part {
    position: absolute;
    width: clamp(72px, 22vw, 132px);
    height: clamp(62px, 19vw, 112px);
    transform: translate(-50%, -50%) scale(var(--animation-scale, 1));
    transform-origin: 50% 60%;
  }

  .semantic-animation__subject {
    z-index: 3;
  }

  .semantic-animation__part--context {
    z-index: 1;
  }

  .semantic-animation__part--prop {
    z-index: 2;
  }

  .semantic-animation__part--relation {
    z-index: 4;
  }

  .semantic-animation__text {
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
    color: #fff;
    font-size: clamp(2.4rem, 10vw, 4.4rem);
    font-weight: 950;
    text-shadow: 0 3px 0 rgba(36, 48, 58, .15);
  }

  .composition-motion--pulse {
    animation: composition-pulse 1.45s ease-in-out infinite;
  }

  .composition-motion--float,
  .composition-motion--drift {
    animation: composition-float 2.5s ease-in-out infinite;
  }

  .composition-motion--wiggle {
    animation: composition-wiggle 1.7s ease-in-out infinite;
  }

  @keyframes composition-pulse {
    0%, 100% { transform: translate(-50%, -50%) scale(var(--animation-scale, 1)); }
    50% { transform: translate(-50%, -50%) scale(calc(var(--animation-scale, 1) * 1.12)); }
  }

  @keyframes composition-float {
    0%, 100% { transform: translate(-50%, -50%) translateY(2px) scale(var(--animation-scale, 1)); }
    50% { transform: translate(-50%, -50%) translateY(-6px) scale(var(--animation-scale, 1)); }
  }

  @keyframes composition-wiggle {
    0%, 100% { transform: translate(-50%, -50%) rotate(-4deg) scale(var(--animation-scale, 1)); }
    50% { transform: translate(-50%, -50%) rotate(4deg) scale(var(--animation-scale, 1)); }
  }

  @media (prefers-reduced-motion: reduce) {
    .semantic-animation__part {
      animation: none !important;
    }
  }
</style>
