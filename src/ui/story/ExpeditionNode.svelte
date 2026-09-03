<script lang="ts">
  import Avatar from '../../presentation/Avatar.svelte';
  import type { AvatarId } from '../../runtime/localProgress';
  import type { StoryLocationVisualState } from '../../story/storyPresentation';
  import type { StoryLocation } from '../../story/storyTypes';
  import type { WorldChange } from '../../story/worldRewards';

  let {
    location,
    state,
    icon,
    childAvatar,
    actionLabel,
    ariaLabel,
    worldChanges = [],
    onActivate
  }: {
    location: StoryLocation;
    state: StoryLocationVisualState;
    icon: string;
    childAvatar: AvatarId;
    actionLabel: string;
    ariaLabel: string;
    worldChanges?: WorldChange[];
    onActivate: () => void;
  } = $props();

  let visibleWorldChanges = $derived(worldChanges.slice(-3));
  let accessibleLabel = $derived(
    worldChanges.length === 0
      ? ariaLabel
      : `${ariaLabel}. Learning changed this place: ${worldChanges.map((change) => change.title).join(', ')}.`
  );
</script>

<div class:expedition-shell--current={state === 'current'} class="expedition-shell"
  style={`--world-x:${location.position.x}%;--world-y:${location.position.y}%`}>
  {#if state === 'current'}<span class="hero-marker" aria-hidden="true"><Avatar avatar={childAvatar} mood="happy" motion="bounce" /></span>{/if}
  <button type="button" class="expedition-node" data-state={state} disabled={state === 'locked'} aria-label={accessibleLabel} onclick={onActivate}>
    <span class="expedition-node__state" aria-hidden="true">{state === 'complete' ? '✓' : state === 'locked' ? '🔒' : state === 'current' ? '▶' : '•'}</span>
    <span class="expedition-node__icon" aria-hidden="true">{state === 'locked' ? '☁️' : icon}</span>
    <span class="expedition-node__level">LEVEL {location.progression.level}</span><strong>{location.expeditionTitle}</strong>
    {#if visibleWorldChanges.length > 0}
      <span aria-hidden="true">{#each visibleWorldChanges as change}{change.icon}{/each}</span>
    {/if}
    <small>{actionLabel}</small>
  </button>
</div>

<style>
  .expedition-shell{position:absolute;left:var(--world-x);top:var(--world-y);z-index:3;width:clamp(86px,16vw,122px);transform:translate(-50%,-50%)}.expedition-shell--current{z-index:6;width:clamp(106px,19vw,142px)}
  .hero-marker{position:absolute;width:42px;height:42px;left:50%;top:-34px;z-index:8;transform:translateX(-50%);pointer-events:none}
  .expedition-node{position:relative;width:100%;min-height:74px;display:grid;justify-items:center;align-content:center;padding:7px 5px;border:2px solid #24303a24;border-radius:16px;background:#fffffff5;color:var(--ink);box-shadow:0 5px 12px #24303a1c;cursor:pointer}
  .expedition-node[data-state='current']{min-height:88px;border:3px solid var(--accent);background:#f8f5ff;box-shadow:0 0 0 4px #5a52d51f}.expedition-node[data-state='complete']{border-color:#3391516b;background:var(--good-soft)}.expedition-node[data-state='locked']{opacity:.45;cursor:default}
  .expedition-node__state{position:absolute;top:4px;right:5px;min-width:17px;min-height:17px;display:grid;place-items:center;border-radius:50%;background:#ffffffe0;font-size:.55rem;font-weight:950}.expedition-node[data-state='complete'] .expedition-node__state{background:var(--good);color:#fff}.expedition-node[data-state='current'] .expedition-node__state{background:var(--accent);color:#fff}
  .expedition-node__icon{font-size:1.25rem;line-height:1}.expedition-node__level{color:var(--accent);font-size:.52rem;font-weight:950}.expedition-node strong{font-size:.63rem;line-height:1.05;text-align:center}.expedition-node small{color:var(--muted);font-size:.5rem;font-weight:850}.expedition-node[data-state='current'] strong{font-size:.71rem}.expedition-node[data-state='current'] small{color:var(--accent)}
  @media(max-width:520px){.expedition-shell{width:clamp(74px,24vw,94px)}.expedition-shell--current{width:clamp(90px,29vw,112px)}.expedition-node{min-height:64px}.expedition-node[data-state='current']{min-height:76px}.hero-marker{width:36px;height:36px;top:-29px}.expedition-node strong{font-size:.55rem}}
  @media(prefers-reduced-motion:reduce){.hero-marker :global(*){animation:none!important}}
</style>