<script lang="ts">
  import StudioScene from '../presentation/StudioScene.svelte';

  let { onExit }: { onExit: () => void } = $props();

  const scenes = [
    { id: 'day-sunrise', label: 'Morning', symbol: '🌅' },
    { id: 'day-noon', label: 'Day', symbol: '☀️' },
    { id: 'day-sunset', label: 'Evening', symbol: '🌇' },
    { id: 'day-midnight', label: 'Night', symbol: '🌙' }
  ] as const;

  let selected = $state<(typeof scenes)[number]['id']>('day-sunrise');
  let selectedScene = $derived(scenes.find((scene) => scene.id === selected) ?? scenes[0]);
</script>

<section class="calm-scene-play" aria-labelledby="calm-scene-title" data-calm-scene-play>
  <header class="calm-scene-play__header">
    <button type="button" class="calm-scene-play__back" aria-label="Back to Play" onclick={onExit}>←</button>
    <div>
      <span>QUIET PLAY</span>
      <h1 id="calm-scene-title">Sky Window</h1>
    </div>
  </header>

  <div class="calm-scene-play__stage" aria-live="polite" aria-label={`${selectedScene.label} sky`}>
    <StudioScene icon={selectedScene.id} />
    <p>Look around the {selectedScene.label.toLowerCase()} sky.</p>
  </div>

  <div class="calm-scene-play__choices" role="group" aria-label="Choose a sky">
    {#each scenes as scene}
      <button
        type="button"
        aria-pressed={selected === scene.id}
        class:calm-scene-play__choice--selected={selected === scene.id}
        class="calm-scene-play__choice"
        onclick={() => { selected = scene.id; }}
      >
        <span aria-hidden="true">{scene.symbol}</span>
        <strong>{scene.label}</strong>
      </button>
    {/each}
  </div>

  <p class="calm-scene-play__note">No score. Pick any sky you like.</p>
  <button type="button" class="calm-scene-play__done" onclick={onExit}>Done</button>
</section>

<style>
  .calm-scene-play{height:100%;min-height:0;display:grid;grid-template-rows:auto minmax(0,1fr) auto auto auto;gap:8px;padding:8px;overflow:hidden;background:linear-gradient(180deg,#f7fbfd,#fffaf0);color:var(--ink)}
  .calm-scene-play__header{display:flex;align-items:center;gap:9px}.calm-scene-play__header span{font-size:.62rem;font-weight:950;letter-spacing:.08em;color:var(--accent)}.calm-scene-play__header h1{margin:1px 0 0;font-size:clamp(1.15rem,4vw,1.5rem)}
  .calm-scene-play__back,.calm-scene-play__done,.calm-scene-play__choice{min-width:44px;min-height:44px;border:0;font:inherit;font-weight:900;cursor:pointer}.calm-scene-play__back{width:44px;border-radius:13px;background:var(--accent-soft);color:var(--accent);font-size:1.15rem}.calm-scene-play__stage{min-height:0;display:grid;place-items:center;align-content:center;gap:6px;padding:8px;border:1px solid #24303a14;border-radius:20px;background:#ffffffd9;overflow:hidden}.calm-scene-play__stage :global(.studio-scene){width:min(100%,560px);max-height:100%}.calm-scene-play__stage p{margin:0;color:var(--muted);font-size:.82rem;font-weight:800}
  .calm-scene-play__choices{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}.calm-scene-play__choice{display:grid;place-items:center;gap:2px;padding:6px;border:2px solid var(--line);border-radius:15px;background:#fff;color:var(--ink)}.calm-scene-play__choice span{font-size:1.45rem}.calm-scene-play__choice strong{font-size:.72rem}.calm-scene-play__choice--selected{border-color:var(--accent);background:var(--accent-soft)}
  .calm-scene-play__note{margin:0;text-align:center;color:var(--muted);font-size:.72rem;font-weight:800}.calm-scene-play__done{justify-self:center;min-width:120px;padding:8px 18px;border-radius:14px;background:var(--accent);color:#fff}
  @media(max-width:480px){.calm-scene-play{padding:6px;gap:6px}.calm-scene-play__choices{gap:5px}.calm-scene-play__choice{padding:4px}.calm-scene-play__choice strong{font-size:.65rem}}
  @media(prefers-reduced-motion:reduce){.calm-scene-play *{scroll-behavior:auto!important}}
</style>
