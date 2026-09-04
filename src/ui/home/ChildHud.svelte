<script lang="ts">
  import Avatar from '../../presentation/Avatar.svelte';
  import StoryCharacter from '../../presentation/StoryCharacter.svelte';
  import type { ChildSettings } from '../../runtime/localProgress';

  let {
    child,
    displayName,
    worldChanged,
    currentLevel,
    onOpenPlayer
  }: {
    child: ChildSettings;
    displayName: string;
    worldChanged: boolean;
    currentLevel: number | null;
    onOpenPlayer: () => void;
  } = $props();
</script>

<header class="child-hud" data-has-world-changes={worldChanged} aria-label="Player, story guides and adventure progress">
  <button class="child-hud__player" type="button" onclick={onOpenPlayer} aria-label="Open player settings">
    <span class="child-hud__avatar" aria-hidden="true">
      <Avatar avatar={child.avatar} mood="happy" motion="idle" />
    </span>
    <strong>{displayName}</strong>
  </button>

  <div class="child-hud__progress">
    <div class="child-hud__guides" aria-label="Scientu and Shaitanu">
      <span aria-hidden="true"><StoryCharacter character="scientu" expression="thinking" pose="inspect" angle="three-quarter-left" motion="float" /></span>
      <span aria-hidden="true"><StoryCharacter character="shaitanu" expression="sly" pose="proud" angle="three-quarter-left" motion="wiggle" /></span>
    </div>
    {#if currentLevel !== null}
      <span class="hud-pill hud-pill--level" aria-label={`Current adventure level ${currentLevel}`}>
        LEVEL {currentLevel}
      </span>
    {/if}
  </div>
</header>

<style>
  .child-hud{min-height:46px;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:2px 8px;border:1px solid #24303a14;border-radius:15px;background:#fffffff2}
  .child-hud__player{min-width:0;min-height:44px;display:flex;align-items:center;gap:6px;padding:2px 6px 2px 2px;border:0;border-radius:12px;background:transparent;color:var(--ink);font:inherit;cursor:pointer}
  .child-hud__player:hover,.child-hud__player:focus-visible{background:var(--accent-soft)}
  .child-hud__avatar{width:36px;height:36px;flex:none}
  .child-hud__player strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .child-hud__progress,.child-hud__guides{display:flex;align-items:center;gap:5px;flex:none}
  .child-hud__guides{gap:1px}.child-hud__guides>span{width:30px;height:30px}
  .hud-pill{min-height:32px;display:inline-flex;align-items:center;padding:4px 8px;border-radius:999px;font-size:.68rem;font-weight:850}
  .hud-pill--level{background:var(--accent-soft);color:var(--accent)}
</style>
