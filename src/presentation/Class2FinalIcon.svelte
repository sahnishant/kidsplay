<script lang="ts">
  let { icon }: { icon: string } = $props();
</script>

<svg class={`class2-final-icon class2-final-icon--${icon}`} viewBox="0 0 120 100" aria-hidden="true">
  {#if icon === 'caravan'}
    <g>
      <rect class="caravan" x="14" y="26" width="82" height="52" rx="12" />
      <path class="roof-line" d="M25 26q22-19 50 0" />
      <rect class="window" x="29" y="39" width="25" height="18" rx="4" />
      <rect class="door" x="64" y="38" width="21" height="40" rx="3" />
      <circle class="wheel" cx="35" cy="80" r="10" /><circle class="wheel" cx="78" cy="80" r="10" />
      <path class="hitch" d="M96 68h14l7 8" />
    </g>
  {:else if icon === 'moonlight'}
    <g>
      <path class="moon" d="M77 9q-28 8-28 34t28 34Q39 83 30 53 21 20 54 9q12-4 23 0Z" />
      <path class="ray" d="M81 25 105 12M87 42h27M81 59l24 15" />
      <path class="ground" d="M7 88q27-17 53-4 28-15 54 4" />
      <path class="shine" d="M67 80q14-10 28 0M73 70q9-7 18 0" />
    </g>
  {:else if icon === 'neem'}
    <g>
      <rect class="trunk" x="54" y="50" width="13" height="44" rx="4" />
      <path class="branch" d="M60 58 36 36m25 20 23-25M60 70 30 58m31 7 31-8" />
      <g class="leaf-fill">
        <ellipse cx="31" cy="31" rx="15" ry="9" transform="rotate(-25 31 31)" />
        <ellipse cx="48" cy="24" rx="14" ry="9" transform="rotate(20 48 24)" />
        <ellipse cx="76" cy="25" rx="15" ry="9" transform="rotate(-20 76 25)" />
        <ellipse cx="91" cy="39" rx="14" ry="9" transform="rotate(25 91 39)" />
        <ellipse cx="27" cy="55" rx="15" ry="9" transform="rotate(15 27 55)" />
        <ellipse cx="91" cy="59" rx="15" ry="9" transform="rotate(-15 91 59)" />
      </g>
    </g>
  {:else if icon === 'orbit'}
    <g>
      <circle class="sun" cx="58" cy="50" r="16" />
      <ellipse class="orbit" cx="58" cy="50" rx="48" ry="27" transform="rotate(-16 58 50)" />
      <circle class="planet" cx="101" cy="38" r="9" />
      <path class="arrow" d="M19 61q-7-8-4-16m-5 5 5-6 7 4" />
    </g>
  {:else if icon === 'pea'}
    <g>
      <path class="vine" d="M57 95Q47 65 58 36T50 7" />
      <path class="leaf" d="M55 34Q30 17 18 37q20 17 37-3Zm1 23q25-18 39 2-20 18-39-2Z" />
      <path class="pod" d="M48 63q-27-4-33 15 23 16 42-2Z" />
      <circle class="pea" cx="28" cy="76" r="5" /><circle class="pea" cx="39" cy="75" r="5" /><circle class="pea" cx="50" cy="72" r="5" />
    </g>
  {:else if icon === 'plateau'}
    <g>
      <path class="land" d="M7 91 24 48l16-7 6-25h31l7 25 18 8 12 42Z" />
      <path class="top" d="M46 16h31l7 25-44 0Z" />
      <path class="contour" d="M24 48q18 10 34 1t44 0M15 70q25 11 45 1t48 0" />
    </g>
  {:else if icon === 'pumpkin'}
    <g>
      <ellipse class="pumpkin" cx="60" cy="61" rx="43" ry="29" />
      <ellipse class="pumpkin-line" cx="60" cy="61" rx="20" ry="29" />
      <path class="pumpkin-line" d="M40 35q-11 26 0 52m40-52q11 26 0 52" />
      <path class="stem" d="M58 32q-2-17 13-22m-7 12q16-6 26 2" />
      <path class="leaf" d="M88 18q20-8 24 8-18 10-24-8Z" />
    </g>
  {:else if icon === 'saturn'}
    <g>
      <circle class="saturn" cx="60" cy="50" r="29" />
      <path class="saturn-band" d="M38 37q22 8 44 0M34 50q26 9 52 0M39 64q21 7 42 0" />
      <ellipse class="ring" cx="60" cy="50" rx="54" ry="17" transform="rotate(-11 60 50)" />
      <path class="ring-front" d="M12 55q48 22 96-9" />
    </g>
  {:else if icon === 'school-uniform'}
    <g>
      <path class="shirt" d="M39 19 18 32 7 52l18 11 12-14v44h46V49l12 14 18-11-11-20-21-13q-21 13-42 0Z" />
      <path class="collar" d="M40 22 60 38 80 22M60 38v51" />
      <path class="tie" d="m60 37 8 12-8 31-8-31Z" />
      <path class="badge" d="M75 48h13v12H75Z" />
    </g>
  {:else if icon === 'sharp-tools'}
    <g>
      <circle class="scissor-ring" cx="31" cy="70" r="11" /><circle class="scissor-ring" cx="54" cy="78" r="11" />
      <path class="blade" d="M39 63 82 17l-31 51m-4 3 42 12" />
      <path class="knife" d="M72 70 105 40q8 20-20 43Z" />
      <path class="handle" d="M67 73 83 89" />
      <path class="warning" d="M15 13h29L29 39Z" />
      <path class="warning-mark" d="M29 20v9m0 4v1" />
    </g>
  {:else if icon === 'tonga'}
    <g>
      <circle class="tonga-wheel" cx="83" cy="78" r="14" />
      <path class="tonga-cart" d="M62 51h43l-8 24H68Z" />
      <path class="tonga-line" d="M64 61 47 59M98 51V32h10" />
      <path class="tonga-horse" d="M14 63q2-23 19-26 12-13 23-3l8 13-10 10-9-8-2 28H27l-2-19-5 19H8l6-14Z" />
      <path class="tonga-horse" d="M43 39q-1-19 10-25 14 3 13 17-8 5-15 1l-1 13Z" />
      <circle class="tonga-eye" cx="58" cy="24" r="2" />
      <path class="tonga-line" d="M28 77v15m15-15v15M61 48 78 51" />
    </g>
  {:else if icon === 'television'}
    <g>
      <rect class="tv" x="12" y="21" width="96" height="61" rx="10" />
      <rect class="screen" x="22" y="30" width="65" height="43" rx="5" />
      <circle class="knob" cx="98" cy="42" r="6" /><circle class="knob" cx="98" cy="61" r="6" />
      <path class="antenna" d="M51 21 36 5m33 16L84 5M38 91h44" />
      <path class="play" d="m48 41 23 11-23 12Z" />
    </g>
  {:else}
    <g><circle class="fallback" cx="60" cy="50" r="38" /><path class="line" d="M60 25v32m0 15v4" /></g>
  {/if}
</svg>

<style>
  .class2-final-icon { width: 100%; height: 100%; overflow: visible; }
  .caravan { fill: #f3d594; stroke: #8b6c37; stroke-width: 2.5; }
  .roof-line, .hitch, .ray, .ground, .shine, .branch, .orbit, .arrow, .vine, .contour, .pumpkin-line, .stem, .saturn-band, .ring, .ring-front, .collar, .blade, .knife, .handle, .warning-mark, .antenna, .tonga-line, .line { fill: none; stroke: #46545c; stroke-width: 2.7; stroke-linecap: round; stroke-linejoin: round; }
  .window, .screen { fill: #bce8f6; stroke: #4d8193; stroke-width: 2; }
  .door { fill: #bc7d4c; stroke: #754526; stroke-width: 2; }
  .wheel, .tonga-wheel { fill: #34424a; stroke: #1f292f; stroke-width: 2; }
  .moon { fill: #f1e5a3; stroke: #a99b54; stroke-width: 2.3; }
  .trunk { fill: #9a6b3d; stroke: #664322; stroke-width: 2; }
  .leaf-fill, .leaf { fill: #65aa68; stroke: #39743f; stroke-width: 2; }
  .sun { fill: #f2c247; stroke: #9c7620; stroke-width: 2; }
  .planet { fill: #72a9d0; stroke: #3f6f8e; stroke-width: 2; }
  .pod { fill: #79b869; stroke: #3f7840; stroke-width: 2.3; }
  .pea { fill: #b5d66a; stroke: #658636; stroke-width: 1.5; }
  .land { fill: #bb8c61; stroke: #765034; stroke-width: 2.5; }
  .top { fill: #74af67; stroke: #477546; stroke-width: 2; }
  .pumpkin { fill: #e98a3a; stroke: #9b511e; stroke-width: 2.5; }
  .pumpkin-line { stroke: #b75d25; }
  .saturn { fill: #d8ae72; stroke: #8c6539; stroke-width: 2.5; }
  .saturn-band { stroke: #f0d3a6; stroke-width: 4; }
  .ring { stroke: #b98d5e; stroke-width: 8; }
  .ring-front { stroke: #e7c793; stroke-width: 8; }
  .shirt { fill: #e7edf1; stroke: #61737f; stroke-width: 2.4; }
  .tie { fill: #5f6ec7; stroke: #37458d; stroke-width: 2; }
  .badge { fill: #f1c44d; stroke: #9d7922; stroke-width: 1.5; }
  .scissor-ring { fill: none; stroke: #53636c; stroke-width: 5; }
  .knife { fill: #dce3e7; }
  .handle { stroke: #9a633a; stroke-width: 8; }
  .warning { fill: #f2c247; stroke: #9c7620; stroke-width: 2; }
  .tonga-cart { fill: #c88445; stroke: #78461f; stroke-width: 2.5; }
  .tonga-horse { fill: #b98250; stroke: #724825; stroke-width: 2.3; stroke-linejoin: round; }
  .tonga-eye { fill: #2f3437; }
  .tv { fill: #586a75; stroke: #34434b; stroke-width: 2.5; }
  .knob { fill: #d9e2e7; stroke: #34434b; stroke-width: 2; }
  .play { fill: #fff; opacity: .9; }
  .fallback { fill: #f8fafb; stroke: #7a8790; stroke-width: 2.5; }
</style>
