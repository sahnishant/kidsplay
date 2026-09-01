<script lang="ts">
  let { icon }: { icon: string } = $props();
</script>

<svg class="measurement-icon" viewBox="0 0 120 100" aria-hidden="true">
  {#if icon === 'thermometer'}
    <g>
      <rect x="49" y="10" width="22" height="58" rx="11" fill="#edf6f8" stroke="#526c76" stroke-width="3" />
      <rect x="56" y="25" width="8" height="48" rx="4" fill="#e65c50" />
      <circle cx="60" cy="77" r="16" fill="#e65c50" stroke="#9b3d36" stroke-width="3" />
      <path d="M75 22h11M75 34h8M75 46h11M75 58h8" fill="none" stroke="#718890" stroke-width="2.5" stroke-linecap="round" />
      <path d="M60 18v8" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8" />
    </g>
  {:else if icon === 'ruler'}
    <g transform="rotate(-9 60 50)">
      <rect x="10" y="35" width="100" height="30" rx="5" fill="#f2cd63" stroke="#98742a" stroke-width="3" />
      <path d="M20 35v14M30 35v9M40 35v14M50 35v9M60 35v14M70 35v9M80 35v14M90 35v9M100 35v14" fill="none" stroke="#71541e" stroke-width="2" stroke-linecap="round" />
      <path d="M16 58h88" fill="none" stroke="#c1922e" stroke-width="2" />
    </g>
  {:else if icon === 'balance-scale'}
    <g>
      <path d="M60 13v68M36 84h48" fill="none" stroke="#586b73" stroke-width="5" stroke-linecap="round" />
      <path d="M27 30h66" fill="none" stroke="#586b73" stroke-width="4" stroke-linecap="round" />
      <circle cx="60" cy="30" r="6" fill="#e6b64f" stroke="#8e6b22" stroke-width="2.5" />
      <path d="M31 31 19 57m12-26 12 26M89 31 77 57m12-26 12 26" fill="none" stroke="#7c8b91" stroke-width="2.5" />
      <path d="M12 57h38q-3 16-19 16T12 57ZM70 57h38q-3 16-19 16T70 57Z" fill="#8fc5dc" stroke="#4d7e93" stroke-width="2.5" stroke-linejoin="round" />
    </g>
  {:else if icon === 'measuring-vessel'}
    <g>
      <path d="M30 11h60l-7 80H37Z" fill="#eff8fb" fill-opacity=".5" stroke="#687f89" stroke-width="3" stroke-linejoin="round" />
      <path d="M38 55q22-6 44 0l-3 31H41Z" fill="#56b9df" opacity=".82" />
      <path d="M75 28h11M74 38h8M73 48h11M72 58h8M71 68h11" fill="none" stroke="#536c77" stroke-width="2.4" stroke-linecap="round" />
      <path d="M39 55q21-6 43 0" fill="none" stroke="#287da5" stroke-width="2.2" stroke-linecap="round" />
      <path d="M42 18h23" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".75" />
    </g>
  {/if}
</svg>

<style>
  .measurement-icon { width: 100%; height: 100%; overflow: visible; }
</style>
