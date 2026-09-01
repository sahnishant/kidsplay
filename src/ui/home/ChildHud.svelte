<script lang="ts">
  import Avatar from '../../presentation/Avatar.svelte';
  import type { ChildSettings } from '../../runtime/localProgress';

  let {
    child,
    displayName,
    stars,
    currentLevel,
    onOpenPlayer
  }: {
    child: ChildSettings;
    displayName: string;
    stars: number;
    currentLevel: number | null;
    onOpenPlayer: () => void;
  } = $props();
</script>

<header class="child-hud" aria-label="Player and adventure progress">
  <button class="child-hud__player" type="button" onclick={onOpenPlayer} aria-label="Open player settings">
    <span class="child-hud__avatar" aria-hidden="true">
      <Avatar avatar={child.avatar} mood="happy" motion="idle" />
    </span>
    <strong>{displayName}</strong>
  </button>

  <div class="child-hud__progress">
    <span class="hud-pill" aria-label={`${stars} story stars`}>⭐ <strong>{stars}</strong></span>
    {#if currentLevel !== null}
      <span class="hud-pill hud-pill--level" aria-label={`Current adventure level ${currentLevel}`}>
        LEVEL <strong>{currentLevel}</strong>
      </span>
    {/if}
  </div>
</header>

<style>
  .child-hud {
    min-width: 0;
    min-height: 48px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 5px 9px;
    border: 1px solid rgba(36, 48, 58, .08);
    border-radius: 16px;
    background: rgba(255,255,255,.92);
  }

  .child-hud__player {
    min-width: 0;
    min-height: 42px;
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 2px 7px 2px 2px;
    border: 0;
    border-radius: 13px;
    background: transparent;
    color: var(--ink);
    font: inherit;
    cursor: pointer;
  }

  .child-hud__player:focus-visible,
  .child-hud__player:hover { background: var(--accent-soft); }

  .child-hud__avatar { width: 38px; height: 38px; flex: 0 0 auto; }
  .child-hud__player strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: .94rem; }

  .child-hud__progress { display: flex; align-items: center; gap: 6px; flex: 0 0 auto; }
  .hud-pill {
    min-height: 34px;
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 5px 9px;
    border-radius: 999px;
    background: #fff7d7;
    font-size: .72rem;
    font-weight: 850;
  }
  .hud-pill--level { background: var(--accent-soft); color: var(--accent); letter-spacing: .035em; }
  .hud-pill strong { font-size: .88rem; }

  @media (max-width: 430px) {
    .child-hud { min-height: 44px; padding: 3px 6px; }
    .child-hud__player { min-height: 38px; }
    .child-hud__avatar { width: 34px; height: 34px; }
    .hud-pill { min-height: 30px; padding: 4px 7px; font-size: .64rem; }
  }
</style>