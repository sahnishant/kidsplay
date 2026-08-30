<script lang="ts">
  let { icon }: { icon: string } = $props();
</script>

<svg class={`concept-icon concept-icon--${icon}`} viewBox="0 0 120 100" aria-hidden="true">
  {#if icon === 'domestic-animal'}
    <g><path class="home" d="M14 52 60 15l46 37v40H14Z"/><path class="paper" d="M46 92V61h28v31"/><circle class="paw" cx="60" cy="55" r="9"/><circle class="paw" cx="47" cy="44" r="5"/><circle class="paw" cx="57" cy="39" r="5"/><circle class="paw" cx="68" cy="40" r="5"/><circle class="paw" cx="76" cy="47" r="5"/></g>
  {:else if icon === 'water-animal'}
    <g><path class="water" d="M5 70q14-12 28 0t28 0q14-12 28 0t26 0v22H5Z"/><path class="animal" d="M27 51q27-24 55 0-28 25-55 0Zm55 0 22-15v30Z"/><circle class="paper" cx="47" cy="47" r="3"/></g>
  {:else if icon === 'ship-of-desert'}
    <g><path class="sand" d="M3 79q24-29 50-8 25-24 64 8v17H3Z"/><path class="route" d="M14 65q34-26 75-5"/><path class="ship" d="M58 17v39M58 20l31 28H58Z"/><path class="ship-hull" d="M37 55h61L86 68H48Z"/></g>
  {:else if icon === 'extinct-animal'}
    <g><path class="ground" d="M4 84h112v12H4Z"/><ellipse class="fossil" cx="59" cy="55" rx="42" ry="27"/><path class="fossil-line" d="M30 59q17-31 46-16 16 8 12 25M46 46l-8-10m21 6-2-14m18 20 10-8M44 65l-11 10m29-8 2 13m15-16 11 8"/></g>
  {:else if icon === 'air-space'}
    <g><rect class="outline" x="20" y="17" width="80" height="67" rx="12"/><circle class="air-dot" cx="38" cy="39" r="5"/><circle class="air-dot" cx="62" cy="31" r="4"/><circle class="air-dot" cx="80" cy="48" r="6"/><circle class="air-dot" cx="48" cy="62" r="6"/><circle class="air-dot" cx="76" cy="69" r="4"/><path class="arrow" d="M17 91h86m-7-7 8 7-8 7"/></g>
  {:else if icon === 'air-life'}
    <g><path class="lung" d="M55 43c-8-21-30-17-34 5-4 22 10 38 32 41Z"/><path class="lung" d="M65 43c8-21 30-17 34 5 4 22-10 38-32 41Z"/><path class="stem" d="M60 12v49M60 28 48 18m12 20 13-11"/><path class="wind" d="M8 24h25m-9-8 9 8-9 8M88 22h24m-9-8 9 8-9 8"/></g>
  {:else if icon === 'air-burning'}
    <g><path class="flame" d="M61 12c16 19 3 26 16 38 8 8 10 27-1 37-14 13-40 7-43-12-3-16 10-22 15-35 4 8 9 10 13 11 4-12-4-21 0-39Z"/><path class="wind" d="M7 35h30m-10-9 10 9-10 9M84 54h29m-10-9 10 9-10 9"/></g>
  {:else if icon === 'wind-power'}
    <g><circle class="gear" cx="72" cy="57" r="26"/><circle class="paper" cx="72" cy="57" r="10"/><path class="wind" d="M5 31h45m-12-9 12 9-12 9M8 67h34m-11-9 11 9-11 9"/></g>
  {:else if icon === 'wind-kite'}
    <g><path class="kite" d="m74 14 26 27-28 28-25-29Z"/><path class="line" d="M72 69q-8 12 2 20m-5-9-9 4m13 3 8 5"/><path class="wind" d="M5 34h38m-10-9 10 9-10 9M9 65h31"/></g>
  {:else if icon === 'wind-sail'}
    <g><path class="wind" d="M4 28h34m-9-8 9 8-9 8M7 51h31"/><path class="mast" d="M66 13v57"/><path class="sail" d="M68 18 104 61H68Z"/><path class="ship-hull" d="M43 69h69L99 86H55Z"/><path class="water-line" d="M34 91q12-7 24 0t24 0q12-7 24 0"/></g>
  {:else if icon === 'lake'}
    <g><path class="land" d="M5 79 31 37l18 20 20-31 20 31 14-16 12 38v17H5Z"/><ellipse class="water" cx="60" cy="76" rx="42" ry="15"/><ellipse class="shine" cx="60" cy="73" rx="26" ry="6"/></g>
  {:else if icon === 'pebble'}
    <g><ellipse class="stone-soft" cx="60" cy="61" rx="43" ry="26"/><path class="shine-line" d="M34 53q18-12 38-4"/></g>
  {:else if icon === 'granite'}
    <g><path class="stone-hard" d="M17 72 29 28l43-17 32 25-7 47-52 8Z"/><circle class="speck" cx="42" cy="42" r="4"/><circle class="speck" cx="70" cy="32" r="3"/><circle class="speck" cx="82" cy="59" r="4"/><circle class="speck" cx="49" cy="70" r="3"/></g>
  {:else if icon === 'marble'}
    <g><rect class="marble" x="18" y="20" width="84" height="65" rx="8"/><path class="marble-line" d="M25 67q18-30 36-8t34-25M31 35q16 10 30-4t31 7"/><path class="shine-line" d="M29 28h35"/></g>
  {:else if icon === 'brain'}
    <g><path class="brain" d="M59 84c-12 9-28 1-27-13-16-2-19-23-7-31-4-14 14-25 25-17 7-13 27-12 32 2 15-2 25 14 18 26 10 12 0 31-15 30-5 11-19 14-26 3Z"/><path class="brain-line" d="M58 26v56M58 43q-15-9-24 2m24 14q-18-6-24 8m25-26q14-12 28-2M60 60q16-8 28 6"/></g>
  {:else if icon === 'legs'}
    <g><path class="body" d="M40 12h40l-5 36-5 44H54l-4-36-7 36H27l9-47Z"/><path class="line" d="M51 47h22M37 91h19m13 0h19"/></g>
  {:else if icon === 'neck'}
    <g><circle class="skin" cx="60" cy="29" r="22"/><path class="skin" d="M49 48v17L27 76l-9 19h84l-9-19-22-11V48Z"/><path class="line" d="M48 62q12 8 24 0"/></g>
  {:else if icon === 'avoid-spoiled'}
    <g><circle class="plate" cx="56" cy="58" r="30"/><path class="food" d="M42 58q14-21 28 0-14 21-28 0Z"/><path class="cross" d="M19 19 101 91M101 19 19 91"/></g>
  {:else if icon === 'wash-hands'}
    <g><path class="hand" d="M24 62q-2-13 8-13l9 8V27q0-7 7-7 6 0 6 7v20-27q0-7 7-7 7 0 7 7v28-23q0-7 7-7 7 0 7 7v28-15q0-7 7-7 7 0 7 8v24q0 32-34 32-27 0-37-26Z"/><path class="water-line" d="M16 18q7 11 0 18-8-7 0-18Zm87 8q7 11 0 18-8-7 0-18Z"/></g>
  {:else if icon === 'wash-produce'}
    <g><circle class="fruit" cx="58" cy="58" r="27"/><path class="leaf" d="M59 31q7-19 25-13-5 17-25 16Z"/><path class="stem" d="M58 32V18"/><path class="water-line" d="M17 25q7 11 0 18-8-7 0-18Zm86 17q7 11 0 18-8-7 0-18Z"/></g>
  {:else if icon === 'keep-clean'}
    <g><path class="shield" d="M60 10 103 27v28q0 27-43 40Q17 82 17 55V27Z"/><path class="check" d="m36 55 16 16 33-38"/></g>
  {:else if icon === 'before-eating'}
    <g><circle class="plate" cx="72" cy="62" r="28"/><path class="fork" d="M23 24v64m-8-64v20q0 12 8 12t8-12V24M96 24v64"/><circle class="clock" cx="72" cy="62" r="13"/><path class="line" d="M72 62V51m0 11 9 5"/></g>
  {:else if icon === 'before-eating-produce'}
    <g><circle class="fruit" cx="70" cy="60" r="25"/><path class="leaf" d="M70 35q7-17 23-12-5 15-23 14Z"/><circle class="clock" cx="28" cy="42" r="17"/><path class="line" d="M28 42V31m0 11 9 6"/><path class="water-line" d="M31 74q6 10 0 17-7-7 0-17Z"/></g>
  {:else if icon === 'eat-slowly'}
    <g><circle class="plate" cx="56" cy="61" r="29"/><path class="bite" d="M40 67q18-29 37-8-8 26-37 8Z"/><circle class="clock" cx="91" cy="31" r="19"/><path class="line" d="M91 31V18m0 13 10 6"/></g>
  {:else if icon === 'zebra-reach'}
    <g><path class="road" d="M4 20h112v76H4Z"/><path class="paper" d="M17 30h17v55H17Zm27 0h17v55H44Zm27 0h17v55H71Zm27 0h10v55H98Z"/><path class="arrow" d="M10 11h45m-10-8 10 8-10 8"/></g>
  {:else if icon === 'traffic-stop'}
    <g><rect class="dark" x="42" y="8" width="36" height="71" rx="10"/><circle class="red" cx="60" cy="26" r="10"/><circle class="dim" cx="60" cy="46" r="10"/><circle class="dim" cx="60" cy="66" r="10"/><rect class="dark" x="55" y="79" width="10" height="17"/></g>
  {:else if icon === 'traffic-check'}
    <g><path class="eye" d="M10 51q50-43 100 0-50 43-100 0Z"/><circle class="iris" cx="60" cy="51" r="18"/><circle class="dark" cx="60" cy="51" r="8"/><path class="check" d="m72 79 10 10 23-27"/></g>
  {:else if icon === 'zebra-cross'}
    <g><path class="road" d="M4 28h112v68H4Z"/><path class="paper" d="M16 36h18v52H16Zm28 0h18v52H44Zm28 0h18v52H72Zm28 0h8v52h-8Z"/><circle class="head" cx="60" cy="14" r="8"/><path class="person" d="M60 22v25m0-14-14 12m14-12 13 11m-13 3-13 22m13-22 14 21"/></g>
  {:else if icon === 'energy-food'}
    <g><path class="bolt" d="M66 7 29 57h27L45 94l47-56H65Z"/></g>
  {:else if icon === 'body-building-food'}
    <g><path class="arm" d="M20 72q11-31 29-19l9 7 9-25q5-12 16-5 10 7 3 19L74 71q18-5 30 12-24 16-51 6Z"/><circle class="muscle" cx="49" cy="64" r="11"/></g>
  {:else if icon === 'protective-food'}
    <g><path class="shield" d="M60 9 103 27v28q0 27-43 40Q17 82 17 55V27Z"/><circle class="fruit" cx="60" cy="50" r="19"/><path class="leaf" d="M60 31q5-13 18-9-4 12-18 11Z"/></g>
  {:else}
    <g><circle class="outline" cx="60" cy="50" r="38"/><path class="line" d="M60 24v33m0 15v4"/></g>
  {/if}
</svg>

<style>
  .concept-icon { width: 100%; height: 100%; overflow: visible; }
  .outline, .clock, .plate { fill: #fffdf5; stroke: #53636c; stroke-width: 3; }
  .home { fill: #e9b36a; stroke: #8b6030; stroke-width: 2.5; }
  .paper { fill: #fffdf5; stroke: #716b63; stroke-width: 2; }
  .paw, .animal, .dark, .iris { fill: #48545b; }
  .water, .fruit { fill: #54b8df; stroke: #347e9c; stroke-width: 2.5; }
  .shine { fill: #a9e6f4; }
  .sand { fill: #e6c77a; stroke: #a68135; stroke-width: 2; }
  .ship, .sail { fill: #f6e5b1; stroke: #896d3c; stroke-width: 2; }
  .ship-hull { fill: #648eb4; stroke: #355d7d; stroke-width: 2.5; }
  .fossil { fill: #d8c59a; stroke: #846f45; stroke-width: 3; }
  .fossil-line, .marble-line, .shine-line, .brain-line { fill: none; stroke: #8c774d; stroke-width: 3; stroke-linecap: round; }
  .ground { fill: #9a7954; }
  .air-dot { fill: #85cde5; }
  .arrow, .route, .wind, .water-line, .line, .mast { fill: none; stroke: #4c7487; stroke-width: 4; stroke-linecap: round; stroke-linejoin: round; }
  .lung { fill: #ef8c8f; stroke: #9e4e52; stroke-width: 2.5; }
  .flame, .bolt { fill: #f29c38; stroke: #ad5c1f; stroke-width: 2.5; }
  .gear { fill: #7fa4b6; stroke: #466575; stroke-width: 5; stroke-dasharray: 7 4; }
  .kite { fill: #e56d75; stroke: #8d3940; stroke-width: 2.5; }
  .land { fill: #75b86a; stroke: #477842; stroke-width: 2; }
  .stone-soft { fill: #aaa49b; stroke: #68645f; stroke-width: 3; }
  .stone-hard { fill: #85888c; stroke: #4e5155; stroke-width: 3; }
  .speck { fill: #d5d1c9; }
  .marble { fill: #e9e5dc; stroke: #8b8882; stroke-width: 3; }
  .brain { fill: #e986a5; stroke: #9c4964; stroke-width: 3; }
  .body { fill: #6fa7c6; stroke: #416a80; stroke-width: 3; }
  .skin, .head { fill: #efbe93; stroke: #a77754; stroke-width: 2.5; }
  .food, .bite { fill: #e6ae54; stroke: #956926; stroke-width: 2; }
  .cross { fill: none; stroke: #d94444; stroke-width: 9; stroke-linecap: round; }
  .hand { fill: #efbe93; stroke: #a77754; stroke-width: 2.5; stroke-linejoin: round; }
  .leaf { fill: #69b95c; stroke: #3e7938; stroke-width: 2; }
  .stem { fill: none; stroke: #4d8d3d; stroke-width: 4; stroke-linecap: round; }
  .shield { fill: #78b7ca; stroke: #3f788b; stroke-width: 3; }
  .check { fill: none; stroke: #2f8b57; stroke-width: 7; stroke-linecap: round; stroke-linejoin: round; }
  .fork { fill: none; stroke: #626d72; stroke-width: 4; stroke-linecap: round; }
  .road { fill: #4d555b; }
  .red { fill: #e45757; stroke: #8f3030; stroke-width: 2; }
  .dim { fill: #a5abae; }
  .eye { fill: #eef8fb; stroke: #507988; stroke-width: 3; }
  .person { fill: none; stroke: #242c31; stroke-width: 5; stroke-linecap: round; stroke-linejoin: round; }
  .muscle { fill: #d97073; stroke: #97484b; stroke-width: 2; }
</style>
