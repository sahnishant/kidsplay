<script lang="ts">
  import sceneJson from '../../content/scenes/animals.json';
  import type { SceneIconId, SceneMotion } from './sceneTypes';
  import SceneIcon from './SceneIcon.svelte';

  interface SceneEntity {
    id: string;
    kind: 'icon' | 'text';
    value: string;
    label: string;
    x: number;
    y: number;
    motion?: SceneMotion;
  }
  interface SceneDefinition {
    id: string;
    theme: 'grass' | 'ocean' | 'paper';
    ariaLabel: string;
    entities: SceneEntity[];
  }

  let { sceneId }: { sceneId: string } = $props();
  const scenes = sceneJson as unknown as SceneDefinition[];
  const byId = new Map(scenes.map((scene) => [scene.id, scene]));
  let scene = $derived(byId.get(sceneId));

  function iconName(value: string): SceneIconId {
    return value as SceneIconId;
  }
</script>

{#if scene}
  <div class={`scene scene--${scene.theme}`} role="img" aria-label={scene.ariaLabel}>
    {#each scene.entities as entity (entity.id)}
      <span
        class={`scene__entity scene__entity--${entity.kind}${entity.motion ? ` motion--${entity.motion}` : ''}`}
        style={`left: ${entity.x}%; top: ${entity.y}%`}
        aria-hidden="true"
      >
        {#if entity.kind === 'icon'}
          <SceneIcon icon={iconName(entity.value)} />
        {:else}
          {entity.value}
        {/if}
      </span>
    {/each}
  </div>
{:else}
  <div class="scene" role="img" aria-label={`Missing scene ${sceneId}`}></div>
{/if}

<style>
  .scene--paper {
    background:
      radial-gradient(circle at 18% 20%, rgba(90, 82, 213, 0.08), transparent 23%),
      linear-gradient(145deg, #fff 0%, #f6f7fb 100%);
  }

  .scene__entity--icon {
    width: clamp(74px, 21vw, 132px);
    height: clamp(64px, 18vw, 112px);
    filter: drop-shadow(0 8px 8px rgba(23, 48, 63, 0.14));
  }

  .motion--spin {
    animation: scene-spin 7s linear infinite;
  }

  @keyframes scene-spin {
    from { transform: translate(-50%, -50%) rotate(0deg); }
    to { transform: translate(-50%, -50%) rotate(360deg); }
  }

  @media (prefers-reduced-motion: reduce) {
    .motion--spin {
      animation: none;
    }
  }
</style>
