<script lang="ts">
  let { icon }: { icon: string } = $props();
</script>

<svg viewBox="0 0 120 100" width="100%" height="100%" style="overflow:visible" aria-hidden="true">
  {#if icon === 'reduce-sample'}
    <g>
      <rect x="10" y="27" width="17" height="32" rx="4" fill="#79b4d1" stroke="#47758a" stroke-width="2.5" />
      <rect x="31" y="27" width="17" height="32" rx="4" fill="#79b4d1" stroke="#47758a" stroke-width="2.5" />
      <rect x="52" y="27" width="17" height="32" rx="4" fill="#79b4d1" stroke="#47758a" stroke-width="2.5" />
      <path d="M72 43h18m-7-7 7 7-7 7" fill="none" stroke="#5e7b57" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
      <rect x="94" y="31" width="17" height="32" rx="4" fill="#79b4d1" stroke="#47758a" stroke-width="2.5" />
      <path d="M14 70h94" fill="none" stroke="#b9c5c9" stroke-width="2" stroke-linecap="round" />
      <path d="M28 79h49" fill="none" stroke="#6a9d5f" stroke-width="5" stroke-linecap="round" />
      <path d="m68 72 10 7-10 7" fill="none" stroke="#6a9d5f" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
    </g>
  {:else if icon === 'reuse-sample'}
    <g>
      <rect x="47" y="24" width="27" height="49" rx="7" fill="#79b4d1" stroke="#47758a" stroke-width="3" />
      <rect x="53" y="15" width="15" height="12" rx="3" fill="#5f8ea5" stroke="#47758a" stroke-width="2.5" />
      <path d="M31 48a31 31 0 0 1 50-21" fill="none" stroke="#62a15a" stroke-width="5" stroke-linecap="round" />
      <path d="m76 17 10 9-13 4" fill="none" stroke="#62a15a" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M88 52a31 31 0 0 1-50 22" fill="none" stroke="#62a15a" stroke-width="5" stroke-linecap="round" />
      <path d="m43 84-11-9 13-4" fill="none" stroke="#62a15a" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
    </g>
  {:else if icon === 'recycle-sample'}
    <g>
      <path d="M58 15 75 42H63l-8-13-8 13H35l17-27Z" fill="#65a85d" stroke="#3f7841" stroke-width="2.5" stroke-linejoin="round" />
      <path d="m88 49-17 28-6-10 8-14-15-1 6-10 31 1Z" fill="#65a85d" stroke="#3f7841" stroke-width="2.5" stroke-linejoin="round" />
      <path d="M50 84 18 83l6-10h16l-8-14 6-10 16 28Z" fill="#65a85d" stroke="#3f7841" stroke-width="2.5" stroke-linejoin="round" />
      <rect x="50" y="43" width="20" height="28" rx="4" fill="#79b4d1" stroke="#47758a" stroke-width="2.5" />
    </g>
  {/if}
</svg>
