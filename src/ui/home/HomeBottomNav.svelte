<script lang="ts">
  export type HomePrimaryView = 'world' | 'progress' | 'practice' | 'goals';

  let {
    active = 'world',
    onOpen
  }: {
    active?: HomePrimaryView;
    onOpen: (view: HomePrimaryView) => void;
  } = $props();

  const items: Array<{ id: HomePrimaryView; icon: string; label: string; aria: string }> = [
    { id: 'world', icon: '🌍', label: 'World', aria: 'Open story world' },
    { id: 'progress', icon: '⭐', label: 'Progress', aria: 'Open learning progress' },
    { id: 'practice', icon: '🎯', label: 'Play', aria: 'Open practice activities' },
    { id: 'goals', icon: '🏆', label: 'Goals', aria: 'Open goal learning' }
  ];
</script>

<nav class="home-nav" aria-label="Kidsplay areas">
  {#each items as item}
    <button
      type="button"
      class:home-nav__button--active={active === item.id}
      class="home-nav__button"
      aria-current={active === item.id ? 'page' : undefined}
      aria-label={item.aria}
      onclick={() => onOpen(item.id)}
    >
      <span aria-hidden="true">{item.icon}</span>
      <small>{item.label}</small>
    </button>
  {/each}
</nav>

<style>
  .home-nav {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px;
  }

  .home-nav__button {
    min-width: 0;
    min-height: 50px;
    display: grid;
    grid-template-columns: auto auto;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 6px 8px;
    border: 1px solid rgba(36, 48, 58, .1);
    border-radius: 15px;
    background: rgba(255,255,255,.94);
    color: var(--ink);
    cursor: pointer;
  }

  .home-nav__button--active { background: var(--accent-soft); border-color: rgba(90,82,213,.28); color: var(--accent); }
  .home-nav__button > span { font-size: 1.02rem; }
  .home-nav__button small { font-weight: 900; }

  @media (max-width: 650px) {
    .home-nav__button { grid-template-columns: 1fr; gap: 0; min-height: 48px; padding: 4px; }
    .home-nav__button > span { font-size: .94rem; }
    .home-nav__button small { font-size: .65rem; }
  }
</style>