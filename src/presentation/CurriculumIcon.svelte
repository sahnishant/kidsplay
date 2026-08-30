<script lang="ts">
  let { icon }: { icon: string } = $props();
</script>

<svg class={`curriculum-icon curriculum-icon--${icon}`} viewBox="0 0 120 100" aria-hidden="true">
  {#if icon === 'earth-rotation'}
    <g><circle class="earth" cx="58" cy="52" r="28"/><path class="land" d="M38 36q12-13 25-6l4 10 14 4-5 11-12 3-6 18-11-4-2-13-12-7Z"/><path class="arrow" d="M18 55q2-35 37-43m-9-7 10 7-9 9M99 48q2 34-31 43m9 6-10-6 8-10"/></g>
  {:else if icon === 'mercury'}
    <g><circle class="sun" cx="18" cy="50" r="12"/><circle class="mercury" cx="75" cy="51" r="18"/><circle class="crater" cx="68" cy="45" r="4"/><circle class="crater" cx="82" cy="56" r="5"/><path class="orbit" d="M35 23q45-18 75 17M35 77q45 18 75-17"/></g>
  {:else if icon === 'venus'}
    <g><circle class="sun" cx="17" cy="50" r="11"/><circle class="venus" cx="75" cy="51" r="24"/><path class="band" d="M54 42q21 8 42 0M53 53q22 9 44 0M57 64q18 7 36 0"/><path class="orbit" d="M33 20q47-16 78 17M33 80q47 16 78-17"/></g>
  {:else if icon === 'jupiter'}
    <g><circle class="jupiter" cx="60" cy="50" r="39"/><path class="jupiter-band" d="M25 31h70M22 43h76M21 55h78M25 68h70"/><ellipse class="spot" cx="76" cy="58" rx="11" ry="6"/></g>
  {:else if icon === 'family-tree'}
    <g><circle class="person-a" cx="33" cy="20" r="11"/><circle class="person-b" cx="86" cy="20" r="11"/><circle class="person-c" cx="43" cy="78" r="11"/><circle class="person-d" cx="79" cy="78" r="11"/><path class="tree-line" d="M33 31v15h53V31M59 46v15H43v6m16-6h20v6"/></g>
  {:else if icon === 'grandparent'}
    <g><circle class="skin" cx="42" cy="39" r="22"/><path class="hair" d="M22 33q5-25 22-22 17 2 20 22-12-9-21-8-11 0-21 8Z"/><circle class="glasses" cx="34" cy="40" r="7"/><circle class="glasses" cx="51" cy="40" r="7"/><path class="line" d="M41 40h4M34 55q9 7 18 0"/><circle class="skin" cx="84" cy="65" r="16"/><path class="body" d="M64 98q3-22 20-22t20 22Z"/></g>
  {:else if icon === 'cousin'}
    <g><circle class="skin" cx="36" cy="54" r="17"/><circle class="skin" cx="84" cy="54" r="17"/><path class="body-a" d="M14 96q3-28 22-28t22 28Z"/><path class="body-b" d="M62 96q3-28 22-28t22 28Z"/><path class="family-line" d="M36 31V17h48v14M60 17V7"/><circle class="family-dot" cx="60" cy="7" r="5"/></g>
  {:else if icon === 'shared-housework'}
    <g><path class="house" d="M10 48 60 12l50 36v47H10Z"/><path class="door" d="M50 65h20v30H50Z"/><circle class="person-a" cx="29" cy="63" r="8"/><path class="person-line" d="M29 71v21m0-13-11 8m11-8 10 8"/><path class="broom" d="M84 58 70 94m10-11 13 7-20 5Z"/></g>
  {:else if icon === 'diwali'}
    <g><path class="diya" d="M22 58q38 33 76 0-6 32-38 32T22 58Z"/><path class="flame" d="M60 9q19 22 2 43-20-13-2-43Z"/><circle class="spark" cx="24" cy="23" r="4"/><circle class="spark" cx="94" cy="31" r="4"/></g>
  {:else if icon === 'holi'}
    <g><circle class="holi-a" cx="38" cy="48" r="23"/><circle class="holi-b" cx="75" cy="55" r="27"/><circle class="holi-c" cx="63" cy="27" r="16"/><circle class="drop-a" cx="20" cy="75" r="7"/><circle class="drop-b" cx="101" cy="34" r="8"/></g>
  {:else if icon === 'eid'}
    <g><path class="moon" d="M76 11q-31 9-31 39t31 39q-45 7-55-31Q11 19 49 7q14-4 27 4Z"/><path class="star" d="m88 22 6 12 14 2-10 10 2 14-12-7-13 7 3-14-11-10 15-2Z"/></g>
  {:else if icon === 'onam'}
    <g><circle class="flower-a" cx="60" cy="50" r="39"/><circle class="flower-b" cx="60" cy="50" r="28"/><circle class="flower-c" cx="60" cy="50" r="16"/><circle class="flower-center" cx="60" cy="50" r="7"/><path class="petal-line" d="M60 11v78M21 50h78M33 23l54 54M87 23 33 77"/></g>
  {:else if icon === 'bathe'}
    <g><path class="shower" d="M18 36q0-23 22-23h14v12H40q-10 0-10 11v7h-12Z"/><path class="shower-head" d="M13 43h32l-4 13H17Z"/><path class="water-line" d="M20 62v21m10-21v27m10-27v20"/><circle class="skin" cx="78" cy="37" r="15"/><path class="body" d="M56 94q2-40 22-40t22 40Z"/></g>
  {:else if icon === 'trim-nails'}
    <g><path class="hand" d="M25 90V49q0-8 7-8 7 0 7 8V27q0-8 7-8 7 0 7 8v20-27q0-8 7-8 7 0 7 8v28-21q0-8 7-8 7 0 7 8v25-12q0-8 7-8 7 0 7 9v20q0 35-33 35H25Z"/><path class="clipper" d="M78 16h29l-7 16H76Z"/><circle class="clipper-dot" cx="91" cy="25" r="4"/></g>
  {:else if icon === 'electric-socket'}
    <g><rect class="socket" x="24" y="14" width="72" height="73" rx="13"/><circle class="dark" cx="47" cy="47" r="7"/><circle class="dark" cx="73" cy="47" r="7"/><path class="socket-line" d="M60 61v13"/><path class="danger" d="M104 14 84 47h14L85 77"/></g>
  {:else if icon === 'red-light'}
    <g><rect class="traffic" x="39" y="5" width="42" height="75" rx="10"/><circle class="red" cx="60" cy="23" r="11"/><circle class="dim" cx="60" cy="46" r="10"/><circle class="dim" cx="60" cy="67" r="10"/><path class="pole" d="M60 80v16"/></g>
  {:else if icon === 'steep-descent'}
    <g><path class="sign" d="M60 7 111 92H9Z"/><path class="road-down" d="M32 38h16l36 34h-16Z"/><circle class="wheel" cx="45" cy="54" r="7"/><circle class="wheel" cx="69" cy="66" r="7"/></g>
  {:else if icon === 'stilt-house'}
    <g><path class="roof" d="M17 43 60 12l43 31Z"/><rect class="house" x="28" y="42" width="64" height="31"/><rect class="window" x="42" y="51" width="13" height="12"/><rect class="window" x="68" y="51" width="13" height="12"/><path class="stilts" d="M37 73v23m16-23v23m18-23v23m15-23v23"/><path class="water-line" d="M9 91q11-6 22 0t22 0q11-6 22 0t22 0"/></g>
  {:else if icon === 'igloo'}
    <g><path class="igloo" d="M11 83q3-65 55-65 44 0 49 65Z"/><path class="igloo-line" d="M20 61h86M30 41h61M47 23v60m25-61v61M15 73h28"/><path class="door" d="M43 83q1-31 22-31t22 31Z"/></g>
  {:else if icon === 'gumboots'}
    <g><path class="boot-a" d="M19 12h29v45l16 12v21H15V68h12Z"/><path class="boot-b" d="M66 12h29v45l15 12v21H62V68h12Z"/><path class="boot-line" d="M18 33h30m17 0h30"/></g>
  {:else if icon === 'sandstone'}
    <g><path class="stone" d="M17 72 27 28l46-17 31 27-10 46-48 7Z"/><circle class="grain" cx="38" cy="42" r="3"/><circle class="grain" cx="53" cy="34" r="4"/><circle class="grain" cx="77" cy="35" r="3"/><circle class="grain" cx="84" cy="56" r="4"/><circle class="grain" cx="52" cy="69" r="4"/><circle class="grain" cx="72" cy="72" r="3"/></g>
  {:else if icon === 'slate'}
    <g><path class="slate-a" d="M18 75 35 28l66-8-16 48Z"/><path class="slate-b" d="M24 84 42 39l65-8-16 47Z"/><path class="slate-line" d="M37 53 91 47M32 67l54-7"/></g>
  {:else if icon === 'emerald'}
    <g><path class="gem" d="M60 8 99 34 88 78 60 94 31 78 20 34Z"/><path class="gem-line" d="m20 34 40 60 39-60M31 78l29-70 28 70M20 34h79"/></g>
  {:else}
    <g><circle class="outline" cx="60" cy="50" r="38"/><path class="line" d="M60 24v33m0 15v4"/></g>
  {/if}
</svg>

<style>
  .curriculum-icon { width: 100%; height: 100%; overflow: visible; }
  .earth { fill: #4fa9d5; stroke: #2f718f; stroke-width: 3; }
  .land { fill: #6db95d; }
  .arrow, .orbit, .line, .tree-line, .family-line, .person-line, .water-line, .petal-line, .socket-line, .danger, .pole, .stilts, .boot-line, .slate-line, .gem-line { fill: none; stroke: #53636c; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
  .sun { fill: #f4c742; stroke: #ba8b1b; stroke-width: 2; }
  .mercury { fill: #96999d; stroke: #5d6064; stroke-width: 3; }
  .crater { fill: #71757a; }
  .venus { fill: #e3a14f; stroke: #a46829; stroke-width: 3; }
  .band { fill: none; stroke: #f5cf8a; stroke-width: 4; stroke-linecap: round; }
  .jupiter { fill: #d4a66f; stroke: #916945; stroke-width: 3; }
  .jupiter-band { fill: none; stroke: #f2d6b4; stroke-width: 6; }
  .spot { fill: #ad604a; }
  .person-a, .person-b, .person-c, .person-d, .family-dot { fill: #73a9c5; stroke: #416b80; stroke-width: 2; }
  .skin { fill: #efbe93; stroke: #a77754; stroke-width: 2; }
  .hair { fill: #d9d7d1; stroke: #77736c; stroke-width: 2; }
  .glasses { fill: none; stroke: #4a555b; stroke-width: 2; }
  .body, .body-a { fill: #73a9c5; stroke: #416b80; stroke-width: 2; }
  .body-b { fill: #df7b88; stroke: #964c56; stroke-width: 2; }
  .house { fill: #e9b36a; stroke: #8b6030; stroke-width: 2.5; }
  .door { fill: #79523a; stroke: #503524; stroke-width: 2; }
  .broom { fill: #b87a3d; stroke: #74491f; stroke-width: 3; }
  .diya { fill: #d88642; stroke: #8d4e24; stroke-width: 3; }
  .flame { fill: #f3bf3e; stroke: #c3781c; stroke-width: 2; }
  .spark { fill: #f3bf3e; }
  .holi-a { fill: #e45f6c; } .holi-b { fill: #51a7d3; } .holi-c { fill: #e1b23f; } .drop-a { fill: #7abd61; } .drop-b { fill: #ab6bc2; }
  .moon { fill: #7d8dd1; stroke: #4b5797; stroke-width: 2.5; }
  .star { fill: #f2c84b; stroke: #ae831e; stroke-width: 2; }
  .flower-a { fill: #e76268; } .flower-b { fill: #efb84b; } .flower-c { fill: #73b760; } .flower-center { fill: #b96cae; }
  .shower, .shower-head { fill: none; stroke: #6e8996; stroke-width: 5; stroke-linecap: round; stroke-linejoin: round; }
  .hand { fill: #efbe93; stroke: #a77754; stroke-width: 2.5; stroke-linejoin: round; }
  .clipper { fill: #aeb9bf; stroke: #637078; stroke-width: 2; } .clipper-dot { fill: #4e5d65; }
  .socket { fill: #f2eee4; stroke: #7f766d; stroke-width: 3; } .dark { fill: #464f54; } .danger { stroke: #e0952f; stroke-width: 6; }
  .traffic { fill: #3e464a; stroke: #252b2e; stroke-width: 2; } .red { fill: #e45151; stroke: #9a3030; stroke-width: 2; } .dim { fill: #8a9296; }
  .sign { fill: #fff5e8; stroke: #d6534e; stroke-width: 8; stroke-linejoin: round; } .road-down { fill: #535b60; } .wheel { fill: #272d31; }
  .roof { fill: #bd7650; stroke: #7d452e; stroke-width: 2; } .window { fill: #bce8f6; stroke: #4d8193; stroke-width: 1.8; }
  .igloo { fill: #eaf5fa; stroke: #7e9ba8; stroke-width: 3; } .igloo-line { fill: none; stroke: #aac4cf; stroke-width: 2; }
  .boot-a { fill: #e66b6b; stroke: #924040; stroke-width: 3; } .boot-b { fill: #5d9bc1; stroke: #36657f; stroke-width: 3; }
  .stone { fill: #c59a68; stroke: #805b36; stroke-width: 3; } .grain { fill: #76573c; }
  .slate-a { fill: #6e7b83; stroke: #3d4950; stroke-width: 3; } .slate-b { fill: #89969d; stroke: #4c5960; stroke-width: 2; }
  .gem { fill: #49af79; stroke: #26724a; stroke-width: 3; } .gem-line { stroke: #9be0b6; stroke-width: 2.5; }
  .outline { fill: #fffdf5; stroke: #53636c; stroke-width: 3; }
</style>
