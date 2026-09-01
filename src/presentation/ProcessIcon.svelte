<script lang="ts">
  let { icon }: { icon: string } = $props();
</script>

<svg class={`process-icon process-icon--${icon}`} viewBox="0 0 120 100" aria-hidden="true">
  {#if icon === 'egg'}
    <g class="egg">
      <path class="egg-fill" d="M60 9c-19 0-34 32-34 55 0 20 14 31 34 31s34-11 34-31C94 41 79 9 60 9Z" />
      <ellipse class="egg-shine" cx="48" cy="40" rx="7" ry="12" />
    </g>
  {:else if icon === 'caterpillar'}
    <g class="caterpillar">
      <circle class="segment segment-1" cx="25" cy="61" r="15" />
      <circle class="segment segment-2" cx="47" cy="57" r="17" />
      <circle class="segment segment-3" cx="70" cy="54" r="18" />
      <circle class="head" cx="94" cy="47" r="19" />
      <circle class="eye" cx="89" cy="43" r="3" /><circle class="eye" cx="101" cy="43" r="3" />
      <path class="smile" d="M88 53q7 6 14 0" />
      <path class="antenna" d="M88 31q-5-13-14-14m25 12q4-13 13-16" />
      <path class="leg" d="M30 75v10m22-12v12m23-15v12" />
    </g>
  {:else if icon === 'chrysalis'}
    <g class="chrysalis">
      <path class="twig" d="M18 19h84" />
      <path class="stem" d="M61 19v13" />
      <path class="chrysalis-fill" d="M60 29q22 9 18 34-3 27-18 33-15-6-18-33-4-25 18-34Z" />
      <path class="chrysalis-line" d="M46 51h28M44 65h32M48 79h24" />
    </g>
  {:else if icon === 'sprout'}
    <g class="sprout">
      <path class="soil" d="M6 73q25-15 54 0 28-15 54 0v27H6Z" />
      <path class="stem" d="M60 76V41" />
      <path class="leaf leaf-left" d="M58 54Q32 53 31 34q23-2 28 15Z" />
      <path class="leaf leaf-right" d="M62 45q18-21 35-11-7 21-35 17Z" />
      <path class="root" d="M60 76v20m0-10-11 8m11-11 12 10" />
    </g>
  {:else if icon === 'sapling'}
    <g class="sapling">
      <path class="soil" d="M5 82q28-13 55 0 27-13 55 0v18H5Z" />
      <path class="stem-thick" d="M60 86V29" />
      <path class="leaf leaf-left" d="M57 52Q28 50 25 29q27-3 33 17Z" />
      <path class="leaf leaf-right" d="M63 42q21-25 40-12-8 24-40 19Z" />
      <path class="leaf leaf-left" d="M58 68Q38 66 35 53q19-4 24 11Z" />
    </g>
  {:else if icon === 'adult-plant'}
    <g class="adult-plant">
      <path class="soil" d="M5 88q27-10 55 0 27-10 55 0v12H5Z" />
      <path class="stem-thick" d="M60 91V24" />
      <path class="leaf leaf-left" d="M57 47Q29 45 25 25q27-2 33 17Z" />
      <path class="leaf leaf-right" d="M63 38q20-23 39-12-7 24-39 19Z" />
      <path class="leaf leaf-left" d="M58 69Q35 67 32 51q22-3 27 13Z" />
      <path class="leaf leaf-right" d="M62 65q22-18 37-5-10 19-37 12Z" />
      <circle class="flower" cx="60" cy="18" r="10" /><circle class="flower-center" cx="60" cy="18" r="4" />
    </g>
  {:else if icon === 'ice-cube'}
    <g class="ice-cube">
      <path d="M23 37 55 18l42 13-3 45-35 17-37-17Z" fill="#c8effa" stroke="#4c91ac" stroke-width="2.8" stroke-linejoin="round" />
      <path d="M55 18 60 57 94 76 97 31Z" fill="#8fd6ea" stroke="#4c91ac" stroke-width="2.4" stroke-linejoin="round" />
      <path d="M23 37 60 57 97 31M60 57l-1 36" fill="none" stroke="#4c91ac" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      <path d="m34 37 20-11m-18 22 13-7" fill="none" stroke="white" stroke-opacity=".85" stroke-width="4" stroke-linecap="round" />
    </g>
  {:else if icon === 'liquid-water'}
    <g class="liquid-water">
      <path d="M31 12h58l-7 80H38Z" fill="#eff8fb" fill-opacity=".42" stroke="#6f929f" stroke-width="3" stroke-linejoin="round" />
      <path d="M38 50q22-8 44 0l-4 36H42Z" fill="#56b9df" opacity=".86" />
      <path d="M38 50q22-8 44 0" fill="none" stroke="#287da5" stroke-width="2.4" stroke-linecap="round" />
      <circle cx="53" cy="65" r="3" fill="#dff7ff" stroke="#4d9fc0" stroke-width="1.4" /><circle cx="68" cy="73" r="2" fill="#dff7ff" stroke="#4d9fc0" stroke-width="1.4" />
    </g>
  {:else if icon === 'container-closed'}
    <g class="state-container state-container--closed">
      <path d="M29 35h62l-6 57H35Z" fill="#f0d79c" stroke="#8c6b35" stroke-width="3" stroke-linejoin="round" />
      <rect x="23" y="24" width="74" height="15" rx="5" fill="#f4c969" stroke="#8c6b35" stroke-width="3" />
      <path d="M47 24v-8h26v8" fill="none" stroke="#8c6b35" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
    </g>
  {:else if icon === 'container-open'}
    <g class="state-container state-container--open">
      <path d="M29 35h62l-6 57H35Z" fill="#f0d79c" stroke="#8c6b35" stroke-width="3" stroke-linejoin="round" />
      <path d="m24 30 66-19 5 14-66 19Z" fill="#f4c969" stroke="#8c6b35" stroke-width="3" stroke-linejoin="round" />
      <path d="m48 23-2-7 25-7 2 7" fill="none" stroke="#8c6b35" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
    </g>
  {:else if icon === 'container-empty'}
    <g class="fill-container fill-container--empty">
      <path d="M31 13h58l-7 79H38Z" fill="#eff8fb" fill-opacity=".42" stroke="#6f929f" stroke-width="3" stroke-linejoin="round" />
      <path d="M40 82h40" fill="none" stroke="#9bb1ba" stroke-width="2" stroke-linecap="round" />
    </g>
  {:else if icon === 'container-partly-full'}
    <g class="fill-container fill-container--partly-full">
      <path d="M31 13h58l-7 79H38Z" fill="#eff8fb" fill-opacity=".42" stroke="#6f929f" stroke-width="3" stroke-linejoin="round" />
      <path d="M38 59q22-8 44 0l-3 28H41Z" fill="#56b9df" opacity=".86" />
      <path d="M38 59q22-8 44 0" fill="none" stroke="#287da5" stroke-width="2.4" stroke-linecap="round" />
    </g>
  {:else if icon === 'container-full'}
    <g class="fill-container fill-container--full">
      <path d="M31 13h58l-7 79H38Z" fill="#eff8fb" fill-opacity=".42" stroke="#6f929f" stroke-width="3" stroke-linejoin="round" />
      <path d="M35 31q25-8 50 0l-5 56H40Z" fill="#56b9df" opacity=".86" />
      <path d="M35 31q25-8 50 0" fill="none" stroke="#287da5" stroke-width="2.4" stroke-linecap="round" />
    </g>
  {/if}
</svg>

<style>
  .process-icon { width: 100%; height: 100%; overflow: visible; }
  .egg-fill { fill: #f4ead0; stroke: #bda778; stroke-width: 3; }.egg-shine { fill: rgba(255,255,255,.65); }
  .segment { fill: #78bd58; stroke: #477d38; stroke-width: 2.5; }.segment-2 { fill: #87c861; }.segment-3 { fill: #6fb453; }.head { fill: #8bc965; stroke: #477d38; stroke-width: 2.5; }
  .eye { fill: #27362c; }.smile, .antenna, .leg { fill: none; stroke: #355b31; stroke-width: 2.5; stroke-linecap: round; }
  .twig { fill: none; stroke: #795438; stroke-width: 6; stroke-linecap: round; }.stem { fill: none; stroke: #557c3e; stroke-width: 4; }
  .chrysalis-fill { fill: #a87a48; stroke: #68482b; stroke-width: 3; }.chrysalis-line { fill: none; stroke: #805b36; stroke-width: 2; }
  .soil { fill: #a96f48; }.stem-thick { fill: none; stroke: #4f923f; stroke-width: 8; stroke-linecap: round; }
  .leaf { fill: #6cba57; stroke: #3f7e37; stroke-width: 2; stroke-linejoin: round; }.leaf-right { fill: #7bc761; }
  .root { fill: none; stroke: #7a5638; stroke-width: 3; stroke-linecap: round; }
  .flower { fill: #e983a5; stroke: #af4f70; stroke-width: 2; }.flower-center { fill: #f2c64f; }
</style>
