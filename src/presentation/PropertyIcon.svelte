<script lang="ts">
  let { icon }: { icon: string } = $props();
</script>

<svg class={`property-icon property-icon--${icon}`} viewBox="0 0 120 100" aria-hidden="true">
  {#if icon === 'around-us'}
    <g><circle class="person" cx="60" cy="48" r="13"/><path class="person-line" d="M60 61v27m0-17-17 12m17-12 17 12"/><circle class="air" cx="20" cy="27" r="5"/><circle class="air" cx="38" cy="14" r="4"/><circle class="air" cx="83" cy="16" r="5"/><circle class="air" cx="102" cy="34" r="4"/><circle class="air" cx="20" cy="68" r="4"/><circle class="air" cx="101" cy="70" r="5"/><path class="orbit" d="M10 50q50-43 100 0Q60 93 10 50Z"/></g>
  {:else if icon === 'groundwater'}
    <g><path class="ground" d="M4 24h112v72H4Z"/><path class="soil-line" d="M4 42h112M4 62h112"/><path class="water" d="M4 71q14-10 28 0t28 0q14-10 28 0t28 0v25H4Z"/><path class="well" d="M50 18h20v52H50Z"/><path class="arrow" d="M60 8v23m-8-8 8 8 8-8"/></g>
  {:else if icon === 'home-supply'}
    <g><path class="house" d="M9 50 47 18l38 32v45H9Z"/><path class="door" d="M37 68h20v27H37Z"/><path class="pipe" d="M79 49h25v19H91v9"/><path class="tap" d="M83 69h31M106 69v13"/><path class="drop" d="M106 83q8 10 0 17-8-7 0-17Z"/></g>
  {:else if icon === 'small-still'}
    <g><ellipse class="water" cx="60" cy="66" rx="49" ry="25"/><ellipse class="shine" cx="60" cy="62" rx="31" ry="10"/><path class="reeds" d="M23 73V38m7 34V47m67 28V40m-8 35V50"/><path class="leaf" d="M19 44q9-9 17 0m53 2q8-9 16 0"/></g>
  {:else if icon === 'salty-water'}
    <g><path class="wave" d="M5 58q14-15 28 0t28 0q14-15 28 0t26 0v38H5Z"/><path class="salt" d="M24 25h12v12H24Zm31-13h14v14H55Zm31 16h11v11H86Z"/><path class="spark" d="M30 16v8m-4-4h8M91 14v8m-4-4h8"/></g>
  {:else if icon === 'small-smooth'}
    <g><ellipse class="pebble" cx="60" cy="60" rx="42" ry="27"/><path class="shine-line" d="M34 51q16-13 35-6"/><path class="size" d="M20 91h80m-72-6-8 6 8 6m64-12 8 6-8 6"/></g>
  {:else if icon === 'sand-grains'}
    <g><path class="rock" d="M16 75 29 27l44-14 31 28-9 43-50 8Z"/><circle class="grain" cx="39" cy="42" r="3"/><circle class="grain" cx="55" cy="32" r="4"/><circle class="grain" cx="76" cy="37" r="3"/><circle class="grain" cx="85" cy="57" r="4"/><circle class="grain" cx="51" cy="70" r="4"/><circle class="grain" cx="70" cy="73" r="3"/><circle class="grain" cx="37" cy="61" r="2.5"/></g>
  {:else if icon === 'thin-sheets'}
    <g><path class="sheet-a" d="M18 55 38 22l69-5-18 31Z"/><path class="sheet-b" d="M14 70 34 37l69-5-18 31Z"/><path class="sheet-c" d="M10 85 30 52l69-5-18 31Z"/></g>
  {:else if icon === 'gemstone'}
    <g><path class="gem" d="M60 8 101 34 89 79 60 94 30 79 19 34Z"/><path class="gem-line" d="m19 34 41 60 41-60M30 79 60 8l29 71M19 34h82"/><path class="spark" d="M12 12v12m-6-6h12M106 72v13m-6-7h12"/></g>
  {:else}
    <g><circle class="outline" cx="60" cy="50" r="38"/><path class="line" d="M60 24v33m0 15v4"/></g>
  {/if}
</svg>

<style>
  .property-icon { width: 100%; height: 100%; overflow: visible; }
  .person { fill: #efbe93; stroke: #9c6f50; stroke-width: 2.5; }
  .person-line, .orbit, .soil-line, .arrow, .pipe, .tap, .reeds, .leaf, .spark, .shine-line, .size, .gem-line, .line { fill: none; stroke: #4f6d7a; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
  .air { fill: #8fd4e8; }
  .ground { fill: #c59b6b; stroke: #87603a; stroke-width: 2; }
  .soil-line { stroke: #9c754e; stroke-width: 2; }
  .water, .wave { fill: #55b9df; stroke: #337f9e; stroke-width: 2.5; }
  .well { fill: #d4c4a5; stroke: #83735c; stroke-width: 2.5; }
  .house { fill: #e8b36b; stroke: #895f30; stroke-width: 2.5; }
  .door { fill: #765036; stroke: #4e3424; stroke-width: 2; }
  .drop { fill: #55b9df; stroke: #337f9e; stroke-width: 1.5; }
  .shine { fill: #a7e4f2; }
  .reeds { stroke: #4e8a42; stroke-width: 4; }
  .leaf { stroke: #67a955; stroke-width: 3; }
  .salt { fill: #f5f2e8; stroke: #9d9a90; stroke-width: 2; }
  .spark { stroke: #f0c44e; }
  .pebble { fill: #a9a39a; stroke: #66625d; stroke-width: 3; }
  .shine-line { stroke: #dedbd4; stroke-width: 4; }
  .rock { fill: #c19868; stroke: #7b5735; stroke-width: 3; }
  .grain { fill: #73533a; }
  .sheet-a { fill: #67757d; stroke: #39464d; stroke-width: 2.5; }
  .sheet-b { fill: #7b898f; stroke: #46545b; stroke-width: 2.5; }
  .sheet-c { fill: #919da2; stroke: #536067; stroke-width: 2.5; }
  .gem { fill: #47ad78; stroke: #267149; stroke-width: 3; }
  .gem-line { stroke: #a0e2ba; stroke-width: 2.5; }
  .outline { fill: #fffdf5; stroke: #53636c; stroke-width: 3; }
</style>
