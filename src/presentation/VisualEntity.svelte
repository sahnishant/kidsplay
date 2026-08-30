<script lang="ts">
  import SceneIcon from './SceneIcon.svelte';
  import EntityIcon from './EntityIcon.svelte';
  import type { SceneIconId } from './sceneTypes';
  import { resolveVisualDefinition, type VisualContext } from './visualRegistry';

  let {
    visualRef,
    context = 'option',
    decorative = true,
    label
  }: {
    visualRef: string;
    context?: VisualContext;
    decorative?: boolean;
    label?: string;
  } = $props();

  let visual = $derived(resolveVisualDefinition(visualRef));
  let accessibleLabel = $derived(label ?? visual?.label ?? '');

  function sceneIcon(value: string): SceneIconId {
    return value as SceneIconId;
  }
</script>

{#if visual}
  <span
    class={`visual-entity visual-entity--${context} visual-motion--${visual.motion}`}
    data-visual-ref={visual.id}
    data-glyph={visual.glyph}
    role={decorative ? undefined : 'img'}
    aria-label={decorative ? undefined : accessibleLabel}
    aria-hidden={decorative ? 'true' : undefined}
  >
    <span class="visual-entity__art">
      {#if visual.renderer === 'scene-icon'}
        <SceneIcon icon={sceneIcon(visual.glyph)} />
      {:else}
        <EntityIcon icon={visual.glyph} />
      {/if}
    </span>
  </span>
{/if}

<style>
  .visual-entity {
    display: inline-grid;
    place-items: center;
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
    pointer-events: none;
  }

  .visual-entity__art {
    display: block;
    width: 100%;
    height: 100%;
    transform-origin: 50% 72%;
  }

  .visual-motion--idle .visual-entity__art,
  .visual-motion--wag .visual-entity__art {
    animation: visual-idle 2.8s ease-in-out infinite;
  }

  .visual-motion--swim .visual-entity__art {
    animation: visual-swim 2.5s ease-in-out infinite;
  }

  .visual-motion--flap .visual-entity__art {
    animation: visual-air-bob 2.1s ease-in-out infinite;
  }

  .visual-motion--hop .visual-entity__art {
    animation: visual-hop 1.7s ease-in-out infinite;
  }

  .visual-motion--float .visual-entity__art,
  .visual-motion--drift .visual-entity__art {
    animation: visual-float 2.9s ease-in-out infinite;
  }

  .visual-motion--sway .visual-entity__art {
    animation: visual-sway 2.6s ease-in-out infinite;
  }

  .visual-motion--pulse .visual-entity__art,
  .visual-motion--breathe .visual-entity__art {
    animation: visual-pulse 2.2s ease-in-out infinite;
  }

  .visual-motion--blink .visual-entity__art {
    animation: visual-blink 3.6s ease-in-out infinite;
  }

  .visual-motion--chomp .visual-entity__art {
    animation: visual-chomp 2.1s ease-in-out infinite;
  }

  .visual-motion--flex .visual-entity__art {
    animation: visual-flex 2.4s ease-in-out infinite;
  }

  .visual-motion--spin .visual-entity__art {
    animation: visual-spin 8s linear infinite;
    transform-origin: 50% 50%;
  }

  .visual-motion--spin[data-glyph='windmill'] .visual-entity__art {
    animation: visual-idle 3s ease-in-out infinite;
  }

  .visual-motion--spin[data-glyph='windmill'] :global(.windmill-blades) {
    animation: visual-spin 2.8s linear infinite;
    transform-origin: 60px 39px;
  }

  .visual-motion--flicker .visual-entity__art {
    animation: visual-idle 2.8s ease-in-out infinite;
  }

  .visual-motion--flicker :global(.candle-flame) {
    animation: visual-flame .8s ease-in-out infinite;
    transform-origin: 60px 43px;
  }

  .visual-motion--wag :global(.dog-tail),
  .visual-motion--wag :global(.entity-tail) {
    animation: visual-tail .75s ease-in-out infinite alternate;
    transform-origin: 88% 70%;
  }

  .visual-motion--swim :global(.whale-tail),
  .visual-motion--swim :global(.entity-tail) {
    animation: visual-tail 1s ease-in-out infinite alternate;
    transform-origin: 82% 55%;
  }

  .visual-motion--flap :global(.entity-wing--left) {
    animation: visual-wing-left .72s ease-in-out infinite alternate;
    transform-origin: 58% 52%;
  }

  .visual-motion--flap :global(.entity-wing--right),
  .visual-motion--flap :global(.entity-wing:not(.entity-wing--left)) {
    animation: visual-wing-right .72s ease-in-out infinite alternate;
    transform-origin: 42% 52%;
  }

  @keyframes visual-idle {
    0%, 100% { transform: translateY(0) rotate(-1deg); }
    50% { transform: translateY(-3px) rotate(1deg); }
  }

  @keyframes visual-swim {
    0%, 100% { transform: translateX(-2px) translateY(1px) rotate(-1deg); }
    50% { transform: translateX(4px) translateY(-3px) rotate(1deg); }
  }

  @keyframes visual-air-bob {
    0%, 100% { transform: translateY(1px) rotate(-2deg); }
    50% { transform: translateY(-5px) rotate(2deg); }
  }

  @keyframes visual-hop {
    0%, 100% { transform: translateY(1px) scaleY(1); }
    42% { transform: translateY(-9px) scaleY(1.03); }
    75% { transform: translateY(1px) scaleY(.97); }
  }

  @keyframes visual-float {
    0%, 100% { transform: translateY(2px); }
    50% { transform: translateY(-5px); }
  }

  @keyframes visual-sway {
    0%, 100% { transform: rotate(-2deg); }
    50% { transform: rotate(2deg); }
  }

  @keyframes visual-pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.055); }
  }

  @keyframes visual-blink {
    0%, 43%, 47%, 100% { transform: scaleY(1); }
    45% { transform: scaleY(.2); }
  }

  @keyframes visual-chomp {
    0%, 80%, 100% { transform: scaleY(1); }
    88% { transform: scaleY(.9); }
  }

  @keyframes visual-flex {
    0%, 100% { transform: rotate(-2deg) scale(1); }
    50% { transform: rotate(2deg) scale(1.04); }
  }

  @keyframes visual-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes visual-flame {
    0%, 100% { transform: scale(.95) rotate(-2deg); }
    50% { transform: scale(1.08) rotate(3deg); }
  }

  @keyframes visual-tail {
    from { transform: rotate(-8deg); }
    to { transform: rotate(10deg); }
  }

  @keyframes visual-wing-left {
    from { transform: rotate(-5deg) scaleX(1); }
    to { transform: rotate(12deg) scaleX(.88); }
  }

  @keyframes visual-wing-right {
    from { transform: rotate(5deg) scaleX(1); }
    to { transform: rotate(-12deg) scaleX(.88); }
  }

  @media (prefers-reduced-motion: reduce) {
    .visual-entity__art,
    .visual-entity :global(*) {
      animation: none !important;
    }
  }
</style>
