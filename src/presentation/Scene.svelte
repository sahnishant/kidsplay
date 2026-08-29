<script lang="ts">
  import sceneJson from '../../content/scenes/animals.json';

  type Motion = 'bounce' | 'float' | 'pulse' | 'wiggle';
  interface SceneEntity {
    id: string;
    kind: 'emoji' | 'text';
    value: string;
    label: string;
    x: number;
    y: number;
    motion?: Motion;
  }
  interface SceneDefinition {
    id: string;
    theme: 'grass' | 'ocean';
    ariaLabel: string;
    entities: SceneEntity[];
  }

  let { sceneId }: { sceneId: string } = $props();
  const scenes = sceneJson as unknown as SceneDefinition[];
  const byId = new Map(scenes.map((scene) => [scene.id, scene]));
  let scene = $derived(byId.get(sceneId));
</script>

{#if scene}
  <div class={`scene scene--${scene.theme}`} role="img" aria-label={scene.ariaLabel}>
    {#each scene.entities as entity (entity.id)}
      <span
        class={`scene__entity scene__entity--${entity.kind}${entity.motion ? ` motion--${entity.motion}` : ''}`}
        style={`left: ${entity.x}%; top: ${entity.y}%`}
        aria-hidden="true"
      >{entity.value}</span>
    {/each}
  </div>
{:else}
  <div class="scene" role="img" aria-label={`Missing scene ${sceneId}`}></div>
{/if}
