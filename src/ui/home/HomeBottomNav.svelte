<script lang="ts">
  type HomePrimaryView = 'world' | 'practice' | 'stories';

  let { active = 'world', onOpen }: {
    active?: HomePrimaryView;
    onOpen: (view: HomePrimaryView) => void;
  } = $props();

  const items: Array<{ id: HomePrimaryView; icon: string; label: string; aria: string }> = [
    { id: 'world', icon: '🗺️', label: 'Adventure', aria: 'Open story world' },
    { id: 'practice', icon: '🎲', label: 'Play', aria: 'Open practice activities' },
    { id: 'stories', icon: '🌙', label: 'Stories', aria: 'Open Stories' }
  ];

  let menuOpen = $state(false);

  function openArea(view: HomePrimaryView): void {
    menuOpen = false;
    onOpen(view);
  }
</script>

<details class="home-nav-menu" bind:open={menuOpen}>
  <summary
    class="home-nav-menu__toggle"
    aria-label={menuOpen ? 'Close child navigation' : 'Open child navigation'}
  >
    <span aria-hidden="true">☰</span><small>Menu</small>
  </summary>

  <nav class="home-nav" aria-label="Kidsplay child areas">
    {#each items as item}
      <button
        type="button"
        class:home-nav__button--active={active === item.id}
        class="home-nav__button"
        aria-current={active === item.id ? 'page' : undefined}
        aria-label={item.aria}
        onclick={() => openArea(item.id)}
      >
        <span aria-hidden="true">{item.icon}</span><small>{item.label}</small>
      </button>
    {/each}
  </nav>
</details>

<style>
  .home-nav-menu{position:absolute;right:5px;bottom:5px;z-index:70}
  .home-nav-menu__toggle,.home-nav__button{min-height:44px;border:0;border-radius:12px;background:#fff;color:var(--ink);cursor:pointer}
  .home-nav-menu__toggle{min-width:44px;display:flex;align-items:center;justify-content:center;gap:5px;padding:5px 7px;box-shadow:0 7px 20px #24303a1f;list-style:none}
  .home-nav-menu__toggle::-webkit-details-marker{display:none}
  .home-nav-menu__toggle span{font-size:1.05rem}
  .home-nav-menu__toggle small,.home-nav__button small{font-size:.63rem;font-weight:900}
  .home-nav{position:absolute;right:0;bottom:50px;width:136px;display:grid;gap:5px;padding:6px;border-radius:16px;background:#fffffff7;box-shadow:0 12px 28px #24303a24}
  .home-nav__button{min-width:0;display:flex;align-items:center;gap:8px;padding:6px 10px;text-align:left}
  .home-nav__button--active{background:var(--accent-soft);color:var(--accent)}
  @media(max-width:650px){.home-nav-menu__toggle small{display:none}}
</style>
