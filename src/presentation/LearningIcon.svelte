<script lang="ts">
  let { icon }: { icon: string } = $props();
</script>

<svg class={`learning-icon learning-icon--${icon}`} viewBox="0 0 120 100" aria-hidden="true">
  {#if icon === 'mango'}
    <g><path class="trunk" d="M54 95V46h14v49Z"/><path class="canopy" d="M16 53q-7-25 18-31 7-22 28-10 20-14 31 8 24 1 19 27 8 23-21 28H36Q12 77 16 53Z"/><ellipse class="mango" cx="42" cy="54" rx="7" ry="10"/><ellipse class="mango" cx="77" cy="45" rx="7" ry="10"/><ellipse class="mango" cx="67" cy="66" rx="7" ry="10"/></g>
  {:else if icon === 'rose'}
    <g><path class="stem" d="M60 94V45M60 66 42 54m18 25 18-11"/><path class="leaf" d="M42 54q-19 0-21 15 16 4 27-8M78 68q18-1 21 14-16 5-27-7"/><circle class="rose-a" cx="60" cy="31" r="18"/><circle class="rose-b" cx="49" cy="31" r="10"/><circle class="rose-b" cx="70" cy="31" r="10"/><circle class="rose-c" cx="60" cy="25" r="9"/></g>
  {:else if icon === 'mint'}
    <g><path class="stem" d="M60 94V24"/><path class="leaf" d="M58 35q-23-18-35 2 13 19 35 8Zm4 14q24-18 35 3-14 18-35 7Zm-4 14q-24-17-35 4 14 18 35 7Zm4 14q22-15 33 4-13 16-33 7Z"/></g>
  {:else if icon === 'sugarcane'}
    <g><path class="cane-a" d="M37 94 48 19h13L52 94Z"/><path class="cane-b" d="M63 94 68 12h13l-5 82Z"/><path class="joint" d="M43 52h14m-11 20h10m10-26h13m-14 23h13"/><path class="leaf" d="M50 26Q20 8 12 33q25 8 38 1M75 21q25-17 35 4-19 13-35 4"/></g>
  {:else if icon === 'rubber-tree'}
    <g><path class="trunk" d="M52 96 48 28h22l-3 68Z"/><path class="canopy" d="M16 43q0-20 22-21 8-19 25-9 17-12 27 6 24-2 21 23 6 20-20 25H36Q13 65 16 43Z"/><path class="cut" d="m48 53 22-8"/><path class="tap" d="M58 52v18"/><path class="cup" d="M49 69h20l-3 13H52Z"/></g>
  {:else if icon === 'tea-plant'}
    <g><path class="stem" d="M60 94V38m0 20-20-12m20 28 22-13"/><path class="leaf" d="M58 37q-17-24-37-5 13 23 37 14Zm4 4q18-23 38-3-14 21-38 12ZM40 46q-20-8-27 12 17 12 31-4Zm42 15q21-9 27 12-18 11-31-5Z"/></g>
  {:else if icon === 'banana'}
    <g><path class="banana" d="M25 21q7 47 56 57 18 4 29-7-6 26-35 24Q25 90 12 42 8 27 25 21Z"/><path class="banana-line" d="M27 30q14 43 61 50"/></g>
  {:else if icon === 'hive'}
    <g><path class="hive" d="M38 16h44l10 13 8 15 3 17-7 18-13 13H37L24 79l-7-18 3-17 8-15Z"/><path class="hive-line" d="M29 29h62M22 44h77M20 60h82M27 78h66"/><ellipse class="door" cx="60" cy="74" rx="10" ry="8"/></g>
  {:else if icon === 'skin'}
    <g><path class="skin" d="M14 42q18-14 36 0t36 0q11-9 20-3v48H14Z"/><path class="skin-line" d="M14 55q18-14 36 0t36 0q11-9 20-3M14 70q18-14 36 0t36 0q11-9 20-3"/><path class="touch" d="M60 12v24m-9-15 9-9 9 9"/></g>
  {:else if icon === 'triangle'}
    <path class="shape" d="M60 12 109 88H11Z"/>
  {:else if icon === 'square'}
    <rect class="shape" x="20" y="12" width="80" height="80" rx="4"/>
  {:else if icon === 'circle'}
    <circle class="shape" cx="60" cy="52" r="40"/>
  {:else if icon === 'star'}
    <path class="star" d="m60 8 13 27 30 4-22 21 6 30-27-14-27 14 6-30-22-21 30-4Z"/>
  {:else}
    <g><circle class="outline" cx="60" cy="50" r="38"/><path class="line" d="M60 24v33m0 15v4"/></g>
  {/if}
</svg>

<style>
  .learning-icon { width: 100%; height: 100%; overflow: visible; }
  .trunk { fill: #8a5a35; stroke: #5b3921; stroke-width: 2; }
  .canopy { fill: #69ac58; stroke: #3f7435; stroke-width: 2.5; }
  .mango { fill: #edae42; stroke: #9f7023; stroke-width: 1.8; }
  .stem, .tap, .touch, .banana-line, .line { fill: none; stroke: #4e823e; stroke-width: 4; stroke-linecap: round; stroke-linejoin: round; }
  .leaf { fill: #68b45b; stroke: #3e7938; stroke-width: 2; }
  .rose-a { fill: #d94e63; stroke: #913442; stroke-width: 2; } .rose-b { fill: #ed7180; } .rose-c { fill: #b9324a; }
  .cane-a { fill: #83b75b; stroke: #517b35; stroke-width: 2.5; } .cane-b { fill: #9ac868; stroke: #5a853a; stroke-width: 2.5; }
  .joint, .cut { fill: none; stroke: #6d5a34; stroke-width: 3; stroke-linecap: round; }
  .cup { fill: #9a6d46; stroke: #65452d; stroke-width: 2; }
  .banana { fill: #f1c94f; stroke: #b18a27; stroke-width: 3; } .banana-line { stroke: #d49f2c; stroke-width: 2.5; }
  .hive { fill: #d9a44e; stroke: #8d6226; stroke-width: 3; } .hive-line { fill: none; stroke: #ad7931; stroke-width: 3; } .door { fill: #684723; }
  .skin { fill: #eab892; stroke: #a67554; stroke-width: 3; } .skin-line { fill: none; stroke: #c98e68; stroke-width: 2.5; }
  .touch { stroke: #4f7d91; }
  .shape { fill: #74acd0; stroke: #3f708e; stroke-width: 4; }
  .star { fill: #efbe45; stroke: #9d7622; stroke-width: 3; }
  .outline { fill: #fffdf5; stroke: #53636c; stroke-width: 3; }
</style>
