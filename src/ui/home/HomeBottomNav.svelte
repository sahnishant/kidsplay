<script lang="ts">
  type HomePrimaryView = 'world' | 'practice';

  let { active = 'world', onOpen }: {
    active?: HomePrimaryView;
    onOpen: (view: HomePrimaryView) => void;
  } = $props();

  const items: Array<{ id: HomePrimaryView; icon: string; label: string; aria: string }> = [
    { id: 'world', icon: '🗺️', label: 'Adventure', aria: 'Open story world' },
    { id: 'practice', icon: '🎲', label: 'Play', aria: 'Open practice activities' }
  ];
</script>

<nav class="home-nav" aria-label="Kidsplay child areas">
  {#each items as item}
    <button type="button" class:home-nav__button--active={active === item.id} class="home-nav__button"
      aria-current={active === item.id ? 'page' : undefined} aria-label={item.aria} onclick={() => onOpen(item.id)}>
      <span aria-hidden="true">{item.icon}</span><small>{item.label}</small>
    </button>
  {/each}
</nav>

<style>
  .home-nav{width:min(360px,100%);margin-inline:auto;display:grid;grid-template-columns:repeat(2,1fr);gap:7px}
  .home-nav__button{min-width:0;min-height:48px;display:flex;align-items:center;justify-content:center;gap:6px;padding:5px 10px;border:1px solid #24303a1a;border-radius:14px;background:#fffffff0;color:var(--ink);cursor:pointer}
  .home-nav__button--active{background:var(--accent-soft);color:var(--accent)}
  .home-nav__button small{font-weight:900}
  @media(max-width:650px){.home-nav__button{gap:4px}.home-nav__button small{font-size:.68rem}}
</style>