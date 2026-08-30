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
  {:else if icon === 'eggs'}
    <g><path class="nest" d="M17 67q43 35 86 0-12 28-43 28T17 67Z"/><ellipse class="egg" cx="43" cy="49" rx="16" ry="23"/><ellipse class="egg egg-b" cx="72" cy="47" rx="16" ry="24"/><path class="nest-line" d="M22 72q38 16 76 0M29 82q31 11 62 0"/></g>
  {:else if icon === 'flour'}
    <g><path class="flour-bag" d="M31 22h58l10 67H21Z"/><path class="bag-tie" d="M39 22q21-15 42 0M49 12h22"/><ellipse class="flour" cx="60" cy="65" rx="23" ry="12"/><path class="grain-stalk" d="M60 61V34m0 8-9-7m9 14 10-8m-10 14-9-7"/></g>
  {:else if icon === 'rice-plant'}
    <g><path class="plant-stem" d="M60 96V24M60 51 42 34m18 29 20-19m-20 31-24-16"/><path class="rice-head" d="M60 24q10-13 18 0M60 31q-12-12-19 1M72 27q9 7 10 17M48 31q-9 7-10 17"/><circle class="seed" cx="79" cy="25" r="4"/><circle class="seed" cx="82" cy="37" r="4"/><circle class="seed" cx="41" cy="31" r="4"/><circle class="seed" cx="38" cy="43" r="4"/><path class="field" d="M9 94q25-13 51 0 25-13 51 0"/></g>
  {:else if icon === 'mustard'}
    <g><path class="plant-stem" d="M60 95V29m0 22-20-15m20 30 22-18"/><path class="mustard-pod" d="M35 29q11-8 20 1-10 8-20-1Zm31 10q13-9 22 3-12 8-22-3Z"/><circle class="mustard-seed" cx="31" cy="69" r="6"/><circle class="mustard-seed" cx="48" cy="76" r="6"/><circle class="mustard-seed" cx="67" cy="72" r="6"/><circle class="mustard-seed" cx="86" cy="78" r="6"/></g>
  {:else if icon === 'oil'}
    <g><path class="bottle" d="M43 13h34v16l9 10v50H34V39l9-10Z"/><path class="bottle-neck" d="M44 13h32M42 29h36"/><path class="oil-fill" d="M38 58h44v27H38Z"/><path class="oil-drop" d="M100 34q13 18 0 29-13-11 0-29Z"/></g>
  {:else if icon === 'energy-cereal'}
    <g><path class="bowl" d="M20 57h80q-5 34-40 34T20 57Z"/><circle class="cereal" cx="37" cy="50" r="6"/><circle class="cereal" cx="52" cy="46" r="6"/><circle class="cereal" cx="68" cy="49" r="6"/><circle class="cereal" cx="83" cy="45" r="6"/><path class="energy" d="m61 8-14 26h13l-7 20 25-31H64Z"/></g>
  {:else if icon === 'body-building-pulse'}
    <g><path class="bowl" d="M18 58h65q-5 31-32 31T18 58Z"/><circle class="pulse" cx="31" cy="50" r="6"/><circle class="pulse" cx="47" cy="46" r="6"/><circle class="pulse" cx="63" cy="51" r="6"/><path class="dumbbell" d="M84 28v28m-9-23v18m18-18v18m-18-9h18"/></g>
  {:else if icon === 'body-building-dairy'}
    <g><path class="milk" d="M28 20h42l8 68H20Z"/><path class="milk-top" d="M29 20h40M34 32h38"/><path class="dumbbell" d="M88 29v34m-9-27v20m18-20v20m-18-10h18"/><circle class="milk-dot" cx="49" cy="62" r="9"/></g>
  {:else}
    <g><circle class="outline" cx="60" cy="50" r="38"/><path class="line" d="M60 24v33m0 15v4"/></g>
  {/if}
</svg>

<style>
  .property-icon { width: 100%; height: 100%; overflow: visible; }
  .person { fill: #efbe93; stroke: #9c6f50; stroke-width: 2.5; }
  .person-line, .orbit, .soil-line, .arrow, .pipe, .tap, .reeds, .leaf, .spark, .shine-line, .size, .gem-line, .line, .nest-line, .bag-tie, .grain-stalk, .plant-stem, .rice-head, .field, .bottle-neck, .dumbbell, .milk-top { fill: none; stroke: #4f6d7a; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
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
  .nest { fill: #b7834e; stroke: #79532f; stroke-width: 2.5; }
  .nest-line { stroke: #8d6036; stroke-width: 2; }
  .egg { fill: #fff9e7; stroke: #b8aa8a; stroke-width: 2.5; }
  .egg-b { fill: #f8efd5; }
  .flour-bag { fill: #e8d6aa; stroke: #9a7f50; stroke-width: 2.5; }
  .flour { fill: #fffdf2; stroke: #c8bea4; stroke-width: 2; }
  .grain-stalk, .plant-stem, .rice-head { stroke: #5f963f; }
  .seed { fill: #d8bd67; stroke: #927b3d; stroke-width: 1.5; }
  .field { stroke: #70a64e; }
  .mustard-pod { fill: #78a64d; stroke: #4d7431; stroke-width: 2; }
  .mustard-seed { fill: #a97928; stroke: #6e4d1c; stroke-width: 1.5; }
  .bottle { fill: #f2e0a1; stroke: #8c7643; stroke-width: 2.5; }
  .oil-fill, .oil-drop { fill: #e7bd3c; stroke: #a77d19; stroke-width: 2; }
  .bowl { fill: #8fc1d9; stroke: #4f8098; stroke-width: 2.5; }
  .cereal { fill: #d7b35b; stroke: #927435; stroke-width: 1.5; }
  .energy { fill: #f2c444; stroke: #b0811e; stroke-width: 2; }
  .pulse { fill: #ad6c45; stroke: #76472c; stroke-width: 1.5; }
  .dumbbell { stroke: #667078; stroke-width: 5; }
  .milk { fill: #f3f7f7; stroke: #718b96; stroke-width: 2.5; }
  .milk-dot { fill: #8ebcd0; }
  .outline { fill: #fffdf5; stroke: #53636c; stroke-width: 3; }
</style>
