<script lang="ts">
  let { icon }: { icon: string } = $props();
</script>

<svg class="material-property-icon" viewBox="0 0 120 100" aria-hidden="true">
  {#if icon === 'transparent-sample'}
    <g>
      <circle cx="14" cy="50" r="8" fill="#f3c957" stroke="#9b7628" stroke-width="2.5" />
      <path d="M7 35 3 29M7 65 3 71M14 33V25" fill="none" stroke="#d6a52e" stroke-width="2.5" stroke-linecap="round" />
      <path d="M24 38h23M24 50h23M24 62h23" fill="none" stroke="#e3b536" stroke-width="3" stroke-linecap="round" />
      <rect x="47" y="14" width="25" height="72" rx="5" fill="#dff5fb" fill-opacity=".55" stroke="#5995aa" stroke-width="3" />
      <path d="M72 38h35M72 50h35M72 62h35" fill="none" stroke="#e3b536" stroke-width="3" stroke-linecap="round" />
      <circle cx="94" cy="50" r="11" fill="#7fb7d0" fill-opacity=".6" stroke="#457c94" stroke-width="2.5" />
      <path d="M51 21h8" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".9" />
    </g>
  {:else if icon === 'opaque-sample'}
    <g>
      <circle cx="14" cy="50" r="8" fill="#f3c957" stroke="#9b7628" stroke-width="2.5" />
      <path d="M7 35 3 29M7 65 3 71M14 33V25" fill="none" stroke="#d6a52e" stroke-width="2.5" stroke-linecap="round" />
      <path d="M24 38h23M24 50h23M24 62h23" fill="none" stroke="#e3b536" stroke-width="3" stroke-linecap="round" />
      <rect x="47" y="14" width="25" height="72" rx="5" fill="#8d7863" stroke="#59493b" stroke-width="3" />
      <path d="M43 34v8M43 46v8M43 58v8" fill="none" stroke="#b27641" stroke-width="3" stroke-linecap="round" />
      <circle cx="94" cy="50" r="11" fill="#78858a" fill-opacity=".25" stroke="#68767b" stroke-width="2.5" stroke-dasharray="4 4" />
      <path d="M87 43 101 57M101 43 87 57" fill="none" stroke="#68767b" stroke-width="2.5" stroke-linecap="round" />
    </g>
  {/if}
</svg>

<style>
  .material-property-icon { width: 100%; height: 100%; overflow: visible; }
</style>
