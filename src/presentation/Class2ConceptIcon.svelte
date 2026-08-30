<script lang="ts">
  let { icon }: { icon: string } = $props();
</script>

<svg class={`class2-concept-icon class2-concept-icon--${icon}`} viewBox="0 0 120 100" aria-hidden="true">
  {#if icon === 'exercise'}
    <g>
      <circle class="skin" cx="48" cy="21" r="10" />
      <path class="person" d="M48 32v27m0-17-20 9m20-9 19 10M48 59 31 87m17-28 22 27" />
      <circle class="ball" cx="88" cy="70" r="14" />
      <path class="ball-line" d="M76 64h24M82 58l12 24M95 58 82 82" />
      <path class="motion" d="M14 35h15m-10-7 10 7-10 7M10 58h13" />
    </g>
  {:else if icon === 'air-pollution'}
    <g>
      <rect class="factory" x="13" y="57" width="66" height="34" rx="3" />
      <path class="factory" d="M21 57V39h16v18m12 0V29h16v28" />
      <path class="smoke" d="M55 29q-10-13 4-19 9-11 21-1 18-4 20 11 13 7 5 19H71q-10-1-16-10Z" />
      <path class="warning" d="M96 52 112 83H80Z" />
      <path class="warning-line" d="M96 62v11m0 5v1" />
    </g>
  {:else if icon === 'balanced-diet'}
    <g>
      <circle class="plate" cx="59" cy="54" r="38" />
      <path class="divider" d="M59 16v76M22 54h74" />
      <path class="grain" d="M37 37q7-13 14 0-7 11-14 0Zm2-14q5-8 10 0" />
      <path class="leaf" d="M72 28q20-7 18 14-16 6-20-8Z" />
      <path class="fruit" d="M31 69q0-11 10-13 10 2 10 13 0 12-10 17-10-5-10-17Z" />
      <path class="protein" d="M71 63q13-9 22 3-1 14-15 18-12-6-7-21Z" />
      <path class="check" d="m89 16 7 7 14-17" />
    </g>
  {:else if icon === 'bird-beak'}
    <g>
      <circle class="bird" cx="53" cy="51" r="31" />
      <circle class="eye" cx="45" cy="42" r="4" />
      <path class="beak-highlight" d="M78 49 111 59 78 69Z" />
      <path class="focus" d="M91 32v12m15 0-9 8m-22-24 7 11" />
    </g>
  {:else if icon === 'bird-feathers'}
    <g>
      <path class="feather feather-a" d="M29 83Q12 47 43 16q15 31-14 67Z" />
      <path class="feather feather-b" d="M59 89Q39 49 70 12q18 37-11 77Z" />
      <path class="feather feather-c" d="M88 83Q70 47 99 22q13 32-11 61Z" />
      <path class="feather-line" d="M27 84 42 26M57 90 69 22M87 84 98 31" />
    </g>
  {:else if icon === 'bird-wings'}
    <g>
      <path class="wing" d="M17 69Q24 23 59 23q-7 18 4 27-13 35-46 19Z" />
      <path class="wing wing-right" d="M103 69Q96 23 61 23q7 18-4 27 13 35 46 19Z" />
      <path class="wing-line" d="M28 57q17-20 31-22M92 57Q75 37 61 35" />
    </g>
  {:else if icon === 'carbohydrates'}
    <g>
      <path class="bowl" d="M20 54h66q-5 34-33 34T20 54Z" />
      <path class="grain" d="M26 53q7-25 16-5 8-28 16-3 11-23 16 2 8-17 12 6Z" />
      <path class="bolt" d="M96 14 80 45h13L84 77l25-40H97Z" />
    </g>
  {:else if icon === 'fats'}
    <g>
      <path class="oil-bottle" d="M35 26h29l7 13v45q0 8-8 8H36q-8 0-8-8V39Z" />
      <path class="cap" d="M40 13h19v13H40Z" />
      <path class="oil" d="M34 58h31v26H34Z" />
      <path class="drop" d="M90 29q15 19 0 33-15-14 0-33Z" />
    </g>
  {:else if icon === 'email'}
    <g>
      <rect class="envelope" x="11" y="24" width="98" height="63" rx="8" />
      <path class="envelope-line" d="M15 30 60 61l45-31M17 81l30-29m56 29L73 52" />
      <circle class="badge" cx="91" cy="27" r="20" />
      <text class="at" x="91" y="34" text-anchor="middle">@</text>
    </g>
  {:else if icon === 'evaporation'}
    <g>
      <path class="water" d="M13 73q14-9 28 0t28 0q14-9 28 0t18 0v18H13Z" />
      <circle class="sun" cx="94" cy="21" r="13" />
      <path class="sun-ray" d="M94 2v7m0 24v8M75 21h7m24 0h8M81 8l5 5m16 16 6 6m0-27-6 5M86 29l-5 6" />
      <path class="vapour" d="M35 67q-9-13 2-23t1-22M60 67q-10-12 1-22t1-23M84 67q-9-12 2-21t0-19" />
      <path class="arrow" d="M29 41l8-9 8 9m8 0 8-9 8 9m8 0 8-9 8 9" />
    </g>
  {:else if icon === 'farmer'}
    <g>
      <circle class="skin" cx="48" cy="31" r="15" />
      <path class="hat" d="M23 29h50M34 25q3-17 15-17 13 0 17 17Z" />
      <path class="shirt" d="M30 48h36l11 37H18Z" />
      <path class="person-line" d="M30 58 13 75m53-17 17 17M35 84l-8 13m33-13 8 13" />
      <path class="stem" d="M96 91V53m0 15q-14-14-24-5m24 10q13-14 22-8" />
      <path class="leaf" d="M72 63q13-9 24 5-15 7-24-5Zm24 10q12-10 22-8-5 15-22 8Z" />
    </g>
  {:else if icon === 'filtration'}
    <g>
      <path class="filter" d="M22 17h76L71 55v24H49V55Z" />
      <path class="filter-paper" d="M33 25h54L67 51H53Z" />
      <circle class="particle" cx="45" cy="34" r="3" /><circle class="particle" cx="58" cy="39" r="3" /><circle class="particle" cx="71" cy="32" r="3" />
      <path class="drop" d="M60 79q11 12 0 20-11-8 0-20Z" />
    </g>
  {:else}
    <g><circle class="plate" cx="60" cy="50" r="38" /><path class="divider" d="M60 24v34m0 14v4" /></g>
  {/if}
</svg>

<style>
  .class2-concept-icon { width: 100%; height: 100%; overflow: visible; }
  .skin { fill: #efb48f; stroke: #a9684c; stroke-width: 2; }
  .person, .person-line, .motion, .ball-line, .focus, .divider, .feather-line, .wing-line, .envelope-line, .sun-ray, .vapour, .arrow, .stem { fill: none; stroke: #3d454b; stroke-width: 2.8; stroke-linecap: round; stroke-linejoin: round; }
  .ball { fill: #ef705c; stroke: #8e3b30; stroke-width: 2.5; }
  .factory { fill: #8899a4; stroke: #495861; stroke-width: 2.4; stroke-linejoin: round; }
  .smoke { fill: #78848b; stroke: #4d585e; stroke-width: 2; }
  .warning { fill: #f3c84b; stroke: #9c7d20; stroke-width: 2; }
  .warning-line { fill: none; stroke: #654f13; stroke-width: 4; stroke-linecap: round; }
  .plate { fill: #fffdf5; stroke: #8b8174; stroke-width: 2.5; }
  .grain { fill: #e7c86b; stroke: #9d7b2d; stroke-width: 2; }
  .leaf { fill: #6fb17d; stroke: #387349; stroke-width: 2; }
  .fruit { fill: #e76565; stroke: #983d3d; stroke-width: 2; }
  .protein { fill: #dfa66a; stroke: #976438; stroke-width: 2; }
  .check { fill: none; stroke: #2f8b5f; stroke-width: 5; stroke-linecap: round; stroke-linejoin: round; }
  .bird { fill: #8fc2df; stroke: #426d85; stroke-width: 2.5; }
  .eye { fill: #2e3539; }
  .beak-highlight { fill: #f1a548; stroke: #a36319; stroke-width: 2.5; }
  .feather { stroke-width: 2.2; stroke-linejoin: round; }
  .feather-a { fill: #8fc2df; stroke: #426d85; }
  .feather-b { fill: #e88ba9; stroke: #98506b; }
  .feather-c { fill: #e8c766; stroke: #95772b; }
  .wing { fill: #8fc2df; stroke: #426d85; stroke-width: 2.5; }
  .wing-right { fill: #73abc9; }
  .bowl { fill: #de8c66; stroke: #8e5136; stroke-width: 2.4; }
  .bolt { fill: #f3c84b; stroke: #9c7d20; stroke-width: 2; stroke-linejoin: round; }
  .oil-bottle { fill: #f8f3dd; stroke: #817866; stroke-width: 2.5; }
  .cap { fill: #5e7e92; stroke: #385363; stroke-width: 2; }
  .oil { fill: #e7c650; opacity: .9; }
  .drop { fill: #e3be43; stroke: #957826; stroke-width: 2.2; }
  .envelope { fill: #fffdf5; stroke: #81786c; stroke-width: 2.5; }
  .badge { fill: #665bd6; stroke: #4037a4; stroke-width: 2; }
  .at { fill: white; font: 900 25px/1 system-ui, sans-serif; }
  .water { fill: #8ed3ec; stroke: #3e8eaa; stroke-width: 2; }
  .sun { fill: #f3c84b; stroke: #a17f22; stroke-width: 2; }
  .shirt { fill: #6aa2c2; stroke: #3c6a83; stroke-width: 2.5; }
  .hat { fill: #e1b662; stroke: #92702f; stroke-width: 2.4; stroke-linejoin: round; }
  .filter { fill: #b8dbe7; stroke: #4c8091; stroke-width: 2.5; stroke-linejoin: round; }
  .filter-paper { fill: #fff8de; stroke: #a59058; stroke-width: 1.8; }
  .particle { fill: #8a6b4d; }
</style>
