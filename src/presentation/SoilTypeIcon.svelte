<script lang="ts">
  let { icon }: { icon: string } = $props();
</script>

<svg viewBox="0 0 120 100" width="100%" height="100%" aria-hidden="true">
  {#if icon === 'sandy-soil-sample'}
    <path d="M10 35Q31 26 54 35T110 34V89H10Z" fill="#d7ad68" stroke="#9a713d" stroke-width="3" />
    <g fill="#f0cf91" stroke="#aa7d43" stroke-width="1.5">
      <circle cx="25" cy="48" r="4"/><circle cx="42" cy="43" r="3"/><circle cx="61" cy="51" r="4"/><circle cx="82" cy="44" r="3"/><circle cx="99" cy="52" r="4"/>
      <circle cx="20" cy="68" r="3"/><circle cx="37" cy="62" r="4"/><circle cx="54" cy="72" r="3"/><circle cx="73" cy="64" r="4"/><circle cx="92" cy="72" r="3"/><circle cx="105" cy="65" r="3"/>
      <circle cx="30" cy="82" r="3"/><circle cx="49" cy="84" r="4"/><circle cx="69" cy="80" r="3"/><circle cx="88" cy="85" r="4"/>
    </g>
  {:else if icon === 'clay-soil-sample'}
    <path d="M10 34Q34 29 56 34T110 33V89H10Z" fill="#a65d43" stroke="#71402f" stroke-width="3" />
    <g fill="none" stroke="#6f3a2b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M29 40l8 13-10 10 12 18"/><path d="M64 36l-7 15 12 9-8 22"/><path d="M91 39l-9 12 10 13-7 18"/>
      <path d="M37 53l18 2M69 60l15-8M39 81l22-2M85 82l14-13"/>
    </g>
  {:else if icon === 'loamy-soil-sample'}
    <path d="M10 37Q32 27 55 36T110 35V89H10Z" fill="#76513b" stroke="#4e3528" stroke-width="3" />
    <g fill="#b7885f">
      <circle cx="25" cy="53" r="4"/><circle cx="43" cy="45" r="3"/><circle cx="61" cy="59" r="4"/><circle cx="82" cy="49" r="3"/><circle cx="99" cy="61" r="4"/>
      <circle cx="34" cy="73" r="3"/><circle cx="55" cy="79" r="4"/><circle cx="78" cy="72" r="4"/><circle cx="96" cy="81" r="3"/>
    </g>
    <g fill="#d3b07d"><circle cx="19" cy="66" r="2.5"/><circle cx="49" cy="63" r="2.5"/><circle cx="70" cy="43" r="2.5"/><circle cx="89" cy="67" r="2.5"/></g>
    <path d="M60 42V17" fill="none" stroke="#4b823b" stroke-width="4" stroke-linecap="round" />
    <path d="M58 27Q40 27 39 16q16-3 20 8M62 23Q76 10 88 17 81 31 62 28" fill="#6aac54" stroke="#3d7636" stroke-width="2" stroke-linejoin="round" />
  {:else if icon === 'humus-sample'}
    <path d="M10 36Q35 25 57 35T110 34V89H10Z" fill="#4a382d" stroke="#2e241e" stroke-width="3" />
    <g fill="#76563c"><circle cx="27" cy="54" r="4"/><circle cx="51" cy="69" r="3"/><circle cx="78" cy="48" r="4"/><circle cx="96" cy="75" r="3"/></g>
    <g fill="#9a6b3f" stroke="#654525" stroke-width="1.5" stroke-linejoin="round">
      <path d="M20 71q12-17 24-3-10 15-24 3Z"/><path d="M69 69q12-17 25-4-10 16-25 4Z"/><path d="M46 49q9-13 19-2-8 12-19 2Z"/>
    </g>
    <g fill="none" stroke="#c08c55" stroke-width="1.5" stroke-linecap="round"><path d="M23 70l17-2M72 68l18-2M49 48l12-1"/></g>
  {/if}
</svg>
