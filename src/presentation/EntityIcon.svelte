<script lang="ts">
  let { icon }: { icon: string } = $props();
</script>

<svg class={`entity-icon entity-icon--${icon}`} viewBox="0 0 120 100" aria-hidden="true">
  {#if icon === 'fish'}
    <g class="entity-fish">
      <ellipse class="animal-fill" cx="55" cy="52" rx="35" ry="22" />
      <path class="animal-fill entity-tail" d="M88 51 113 31 110 70Z" />
      <path class="animal-accent" d="M50 34 62 18 70 38ZM50 70 62 83 68 67Z" />
      <circle class="eye" cx="37" cy="47" r="3.5" />
      <path class="line" d="M23 56q8 6 14 0" />
    </g>
  {:else if icon === 'bird'}
    <g class="entity-bird">
      <ellipse class="animal-fill" cx="61" cy="55" rx="30" ry="22" />
      <circle class="animal-fill" cx="37" cy="39" r="17" />
      <path class="warm entity-wing" d="M57 48q24-18 33 4-13 19-31 16Z" />
      <path class="warm" d="m21 39-15 7 16 5Z" />
      <circle class="eye" cx="32" cy="35" r="3" />
      <path class="line" d="M51 74v12m22-13 4 12" />
    </g>
  {:else if icon === 'cat'}
    <g class="entity-cat">
      <ellipse class="animal-fill" cx="61" cy="72" rx="29" ry="20" />
      <circle class="animal-fill" cx="48" cy="43" r="25" />
      <path class="animal-fill" d="M27 30 30 8 44 24ZM55 24 72 8 70 34Z" />
      <path class="line entity-tail" d="M87 74q27-16 25 7-1 10-13 10" />
      <circle class="eye" cx="39" cy="42" r="3" /><circle class="eye" cx="56" cy="42" r="3" />
      <path class="nose" d="m43 51 6 0-3 4Z" />
      <path class="line" d="M46 55q-6 6-12 0m12 0q6 6 12 0M34 50H19m16 6H20m34-6h15m-15 6h15" />
    </g>
  {:else if icon === 'cow'}
    <g class="entity-cow">
      <ellipse class="paper" cx="61" cy="60" rx="37" ry="24" />
      <circle class="paper" cx="28" cy="47" r="18" />
      <path class="warm" d="M16 33 7 20l16 7Zm24-2 10-12 2 16Z" />
      <path class="spot" d="M53 44q15-9 23 2-4 15-20 13Zm18 21q13-5 19 5-8 12-20 7Z" />
      <circle class="eye" cx="23" cy="43" r="2.8" /><circle class="eye" cx="34" cy="43" r="2.8" />
      <path class="line" d="M42 76v18m20-18v18m23-19v19" />
      <path class="line entity-tail" d="M96 56q18-7 15 12" />
    </g>
  {:else if icon === 'frog'}
    <g class="entity-frog">
      <ellipse class="green" cx="59" cy="64" rx="33" ry="23" />
      <ellipse class="green" cx="59" cy="42" rx="29" ry="23" />
      <circle class="green" cx="42" cy="24" r="11" /><circle class="green" cx="76" cy="24" r="11" />
      <circle class="paper" cx="42" cy="24" r="6" /><circle class="paper" cx="76" cy="24" r="6" />
      <circle class="eye" cx="42" cy="24" r="3" /><circle class="eye" cx="76" cy="24" r="3" />
      <path class="line" d="M48 51q11 9 22 0M31 72 13 88m76-16 18 16" />
    </g>
  {:else if icon === 'duck'}
    <g class="entity-duck">
      <ellipse class="yellow" cx="65" cy="65" rx="35" ry="21" />
      <circle class="yellow" cx="39" cy="42" r="21" />
      <path class="warm" d="M20 43 3 50l18 7Z" />
      <path class="soft entity-wing" d="M55 58q21-13 32 5-17 14-31 10Z" />
      <circle class="eye" cx="35" cy="37" r="3" />
      <path class="line" d="M40 86h57" />
    </g>
  {:else if icon === 'butterfly'}
    <g class="entity-butterfly">
      <ellipse class="pink entity-wing entity-wing--left" cx="39" cy="40" rx="25" ry="29" transform="rotate(-24 39 40)" />
      <ellipse class="purple entity-wing entity-wing--right" cx="81" cy="40" rx="25" ry="29" transform="rotate(24 81 40)" />
      <ellipse class="warm entity-wing entity-wing--left" cx="42" cy="72" rx="18" ry="20" transform="rotate(18 42 72)" />
      <ellipse class="blue entity-wing entity-wing--right" cx="78" cy="72" rx="18" ry="20" transform="rotate(-18 78 72)" />
      <rect class="dark" x="56" y="28" width="8" height="53" rx="4" />
      <path class="line" d="M59 30Q47 12 43 10m18 20q12-18 16-20" />
    </g>
  {:else if icon === 'bee'}
    <g class="entity-bee">
      <ellipse class="paper entity-wing entity-wing--left" cx="46" cy="35" rx="18" ry="13" transform="rotate(-28 46 35)" />
      <ellipse class="paper entity-wing entity-wing--right" cx="73" cy="35" rx="18" ry="13" transform="rotate(28 73 35)" />
      <ellipse class="yellow" cx="60" cy="58" rx="31" ry="20" />
      <path class="stripe" d="M44 41v34m15-37v40m17-35v31" />
      <circle class="eye" cx="36" cy="55" r="3" />
      <path class="line" d="M32 42q-5-12-13-13m20 12q2-12 10-16" />
    </g>
  {:else if icon === 'tiger'}
    <g class="entity-tiger">
      <ellipse class="orange-fill" cx="61" cy="72" rx="30" ry="20" />
      <circle class="orange-fill" cx="49" cy="43" r="25" />
      <path class="orange-fill" d="M29 30 31 9 44 25Zm28-5L72 10l-1 23Z" />
      <path class="stripe" d="M40 20l5 14m9-16-2 16M35 60l10 4m27-1 10 5" />
      <circle class="eye" cx="40" cy="42" r="3" /><circle class="eye" cx="57" cy="42" r="3" />
      <path class="nose" d="m44 51 7 0-3.5 4Z" />
      <path class="line entity-tail" d="M88 73q27-15 23 8" />
    </g>
  {:else if icon === 'camel'}
    <g class="entity-camel">
      <path class="sand" d="M24 73q4-26 24-26 7-20 20 0 6-18 19 2 8 3 12 16l-7 13H34Z" />
      <path class="sand" d="M82 52q0-31 15-38 15 3 13 20-8 5-16 2v25Z" />
      <circle class="eye" cx="101" cy="25" r="2.5" />
      <path class="line" d="M42 74v22m19-22v22m23-20v20" />
      <path class="line entity-tail" d="M27 62q-18 2-15 15" />
    </g>
  {:else if icon === 'rabbit'}
    <g class="entity-rabbit">
      <ellipse class="paper" cx="60" cy="72" rx="29" ry="20" />
      <circle class="paper" cx="48" cy="45" r="23" />
      <ellipse class="paper" cx="37" cy="17" rx="9" ry="24" transform="rotate(-9 37 17)" />
      <ellipse class="paper" cx="58" cy="17" rx="9" ry="24" transform="rotate(8 58 17)" />
      <ellipse class="pink-soft" cx="37" cy="17" rx="4" ry="17" transform="rotate(-9 37 17)" />
      <ellipse class="pink-soft" cx="58" cy="17" rx="4" ry="17" transform="rotate(8 58 17)" />
      <circle class="eye" cx="42" cy="43" r="3" /><circle class="nose" cx="55" cy="50" r="3" />
      <circle class="paper" cx="92" cy="72" r="10" />
    </g>
  {:else if icon === 'land'}
    <g class="entity-land">
      <path class="green" d="M4 84q18-38 39-22 19-48 43-9 13-4 30 31Z" />
      <path class="earth-fill" d="M4 84h112v12H4Z" />
      <path class="line green-stroke" d="M26 72v-12m0 6-8-5m8 5 8-6m51 14v-14m0 7-8-6m8 6 8-6" />
    </g>
  {:else if icon === 'forest'}
    <g class="entity-forest">
      <rect class="wood" x="23" y="55" width="9" height="39" rx="3" /><circle class="green entity-leaf" cx="27" cy="45" r="24" />
      <rect class="wood" x="55" y="45" width="10" height="49" rx="3" /><circle class="green entity-leaf" cx="60" cy="34" r="28" />
      <rect class="wood" x="89" y="57" width="8" height="37" rx="3" /><circle class="green entity-leaf" cx="93" cy="47" r="22" />
    </g>
  {:else if icon === 'tree'}
    <g class="entity-tree">
      <rect class="wood" x="54" y="52" width="13" height="43" rx="4" />
      <circle class="green entity-leaf" cx="60" cy="42" r="31" />
      <circle class="green-light entity-leaf" cx="38" cy="50" r="18" /><circle class="green-light entity-leaf" cx="82" cy="49" r="18" />
    </g>
  {:else if icon === 'flower'}
    <g class="entity-flower">
      <path class="green-stroke line" d="M60 48v47m0-20q-18-11-25-3m25 9q14-12 24-8" />
      <circle class="pink entity-leaf" cx="60" cy="32" r="13" />
      <circle class="purple entity-leaf" cx="45" cy="38" r="12" /><circle class="purple entity-leaf" cx="75" cy="38" r="12" />
      <circle class="pink entity-leaf" cx="49" cy="22" r="12" /><circle class="pink entity-leaf" cx="71" cy="22" r="12" />
      <circle class="yellow" cx="60" cy="32" r="8" />
    </g>
  {:else if icon === 'lotus'}
    <g class="entity-lotus">
      <path class="pink entity-leaf" d="M60 75Q34 50 60 22q26 28 0 53Z" />
      <path class="pink-soft entity-leaf" d="M58 77Q23 70 26 39q27 5 32 38Zm4 0q35-7 32-38-27 5-32 38Z" />
      <path class="paper entity-leaf" d="M59 76Q39 66 42 43q15 7 17 33Zm2 0q20-10 17-33-15 7-17 33Z" />
      <path class="blue-stroke line" d="M14 86h92" />
    </g>
  {:else if icon === 'leaves'}
    <g class="entity-leaves">
      <path class="green entity-leaf" d="M59 90Q18 77 20 34q37 6 39 56Z" />
      <path class="green-light entity-leaf" d="M61 90q40-17 39-56-35 8-39 56Z" />
      <path class="green-stroke line" d="M60 91V24m0 52L31 50m29 16 29-22" />
    </g>
  {:else if icon === 'rice'}
    <g class="entity-rice">
      <path class="bowl" d="M21 52h78q-7 38-39 38T21 52Z" />
      <path class="paper" d="M28 53q6-28 16-7 8-31 17-3 13-27 18 3 11-20 15 7Z" />
      <path class="grain" d="M39 43q5-9 10 0m10-4q5-9 10 0m10 4q5-8 10 0" />
    </g>
  {:else if icon === 'pulses'}
    <g class="entity-pulses">
      <path class="bowl" d="M21 52h78q-7 38-39 38T21 52Z" />
      <g class="pulse-dots"><circle cx="38" cy="48" r="7" /><circle cx="53" cy="43" r="7" /><circle cx="68" cy="47" r="7" /><circle cx="82" cy="43" r="7" /><circle cx="60" cy="57" r="7" /></g>
    </g>
  {:else if icon === 'spinach'}
    <g class="entity-spinach">
      <path class="green entity-leaf" d="M60 91C19 67 18 22 57 12c33 18 40 58 3 79Z" />
      <path class="green-stroke line" d="M60 91 55 22m3 36-23-20m23 32 25-23" />
    </g>
  {:else if icon === 'orange'}
    <g class="entity-orange">
      <circle class="orange-fill" cx="60" cy="57" r="35" />
      <path class="green entity-leaf" d="M58 23Q72 5 90 14 78 31 58 27Z" />
      <path class="green-stroke line" d="M60 25q-2-9 4-17" />
      <circle class="orange-dot" cx="47" cy="48" r="2" /><circle class="orange-dot" cx="72" cy="62" r="2" />
    </g>
  {:else if icon === 'milk'}
    <g class="entity-milk">
      <path class="paper" d="M34 23h44l10 18v52H32V41Z" />
      <path class="blue" d="M34 23 48 8h30v15Z" />
      <path class="blue-light" d="M32 47h56v24H32Z" />
      <path class="line blue-stroke" d="M47 9v14" />
      <text x="60" y="64" text-anchor="middle" class="milk-text">MILK</text>
    </g>
  {:else if icon === 'butter'}
    <g class="entity-butter">
      <path class="yellow" d="M22 52 52 28h49L72 52Z" />
      <path class="yellow-dark" d="M22 52h50v30H22Zm50 0 29-24v31L72 82Z" />
      <path class="paper" d="M38 57q12-11 23 0-11 9-23 0Z" />
    </g>
  {:else if icon === 'wheat'}
    <g class="entity-wheat">
      <path class="wheat-stroke line" d="M60 94V12m0 17L44 18m16 24L42 32m18 23L43 46m17-17 16-11M60 42l19-10M60 55l17-10" />
      <ellipse class="wheat-fill entity-leaf" cx="44" cy="18" rx="9" ry="5" transform="rotate(32 44 18)" />
      <ellipse class="wheat-fill entity-leaf" cx="42" cy="32" rx="9" ry="5" transform="rotate(32 42 32)" />
      <ellipse class="wheat-fill entity-leaf" cx="43" cy="46" rx="9" ry="5" transform="rotate(32 43 46)" />
      <ellipse class="wheat-fill entity-leaf" cx="76" cy="18" rx="9" ry="5" transform="rotate(-32 76 18)" />
      <ellipse class="wheat-fill entity-leaf" cx="79" cy="32" rx="9" ry="5" transform="rotate(-32 79 32)" />
      <ellipse class="wheat-fill entity-leaf" cx="77" cy="45" rx="9" ry="5" transform="rotate(-32 77 45)" />
    </g>
  {:else if icon === 'honey'}
    <g class="entity-honey">
      <rect class="honey-jar" x="31" y="31" width="58" height="59" rx="14" />
      <rect class="warm" x="37" y="20" width="46" height="16" rx="5" />
      <path class="paper" d="M39 51h42v24H39Z" />
      <path class="honey-drop" d="M60 47q17 20 0 31-17-11 0-31Z" />
    </g>
  {:else if icon === 'eyes'}
    <g class="entity-eyes">
      <path class="paper eye-shell" d="M9 51q22-30 45 0Q31 81 9 51Zm57 0q22-30 45 0Q88 81 66 51Z" />
      <circle class="blue" cx="32" cy="51" r="11" /><circle class="blue" cx="89" cy="51" r="11" />
      <circle class="eye entity-eye-pupil" cx="32" cy="51" r="5" /><circle class="eye entity-eye-pupil" cx="89" cy="51" r="5" />
    </g>
  {:else if icon === 'ears'}
    <g class="entity-ears">
      <path class="skin" d="M39 13C17 11 10 31 17 54c5 18 20 29 25 42 8-5 9-15 4-24-6-9 2-16 7-25 8-16 0-33-14-34Z" />
      <path class="skin" d="M81 13c22-2 29 18 22 41-5 18-20 29-25 42-8-5-9-15-4-24 6-9-2-16-7-25-8-16 0-33 14-34Z" />
      <path class="line skin-stroke" d="M35 31q16 8 4 26-9 12 0 22m46-48q-16 8-4 26 9 12 0 22" />
    </g>
  {:else if icon === 'nose'}
    <g class="entity-nose">
      <path class="skin" d="M61 12c-5 22-12 39-19 57-5 14 5 22 18 16 13 7 26-2 18-16-8-16-13-35-17-57Z" />
      <ellipse class="nose-hole" cx="50" cy="76" rx="5" ry="3" /><ellipse class="nose-hole" cx="70" cy="76" rx="5" ry="3" />
    </g>
  {:else if icon === 'tongue'}
    <g class="entity-tongue">
      <path class="mouth-fill" d="M15 45q45-35 90 0-14 42-45 42T15 45Z" />
      <path class="paper" d="M24 44q36-19 72 0-38 12-72 0Z" />
      <path class="pink" d="M43 58q17-16 34 0v26q-17 15-34 0Z" />
      <path class="line tongue-line" d="M60 61v26" />
    </g>
  {:else if icon === 'teeth'}
    <g class="entity-teeth">
      <path class="mouth-fill" d="M12 43q48-30 96 0-11 43-48 43T12 43Z" />
      <g class="entity-jaw">
        <path class="paper" d="M25 43h14v20H25Zm14 0h14v22H39Zm14 0h14v22H53Zm14 0h14v20H67Zm14 0h14v17H81Z" />
      </g>
    </g>
  {:else if icon === 'stomach'}
    <g class="entity-stomach">
      <path class="pink" d="M64 16c-6 18 4 24 13 28 21 9 20 42 0 49-22 8-44-3-49-20-5-16 8-24 17-33 7-8 5-18 4-24Z" />
      <path class="line pink-stroke" d="M55 18q-2 24 15 33 16 8 4 24" />
    </g>
  {:else if icon === 'muscles'}
    <g class="entity-muscles entity-flex">
      <path class="skin" d="M19 74q18-29 33-19 6-27 29-20 18 6 16 24 18-2 18 15 0 20-27 20H42Q26 94 19 74Z" />
      <path class="line skin-stroke" d="M47 58q16 18 39 5m-28-9q8-13 21-10" />
    </g>
  {:else if icon === 'joints'}
    <g class="entity-joints entity-flex">
      <rect class="bone-fill" x="16" y="39" width="42" height="16" rx="8" transform="rotate(12 16 39)" />
      <rect class="bone-fill" x="60" y="54" width="42" height="16" rx="8" transform="rotate(-24 60 54)" />
      <circle class="warm" cx="59" cy="56" r="13" />
      <circle class="paper" cx="59" cy="56" r="6" />
    </g>
  {:else if icon === 'ball'}
    <g class="entity-ball">
      <circle class="blue" cx="60" cy="53" r="34" />
      <path class="paper" d="M34 32q26 17 52 0-4 13-16 21 13 7 17 20-27-14-54 0 3-13 17-20-12-8-16-21Z" />
      <path class="line" d="M27 53h66M60 19v68" />
    </g>
  {:else if icon === 'mat'}
    <g class="entity-mat">
      <rect class="purple" x="10" y="36" width="100" height="45" rx="10" />
      <rect class="paper" x="20" y="45" width="80" height="27" rx="7" />
      <path class="line" d="M29 51h62M29 61h62" />
    </g>
  {:else if icon === 'branch'}
    <g class="entity-branch">
      <path class="line" d="M7 76q31-18 57-20 24-2 49-29M48 59 36 37m31 15 9-23m13 8 15-13" />
      <ellipse class="green-light entity-leaf" cx="33" cy="34" rx="10" ry="6" transform="rotate(24 33 34)" />
      <ellipse class="green entity-leaf" cx="77" cy="25" rx="11" ry="6" transform="rotate(-28 77 25)" />
      <ellipse class="green-light entity-leaf" cx="105" cy="21" rx="9" ry="5" transform="rotate(-20 105 21)" />
    </g>
  {:else if icon === 'grass'}
    <g class="entity-grass">
      <path class="earth-fill" d="M6 87h108v9H6Z" />
      <path class="green-stroke line" d="M16 88q5-26 10 0m3 0q7-34 13 0m3 0q5-23 10 0m4 0q7-37 13 0m3 0q5-25 10 0m3 0q7-33 13 0" />
    </g>
  {:else if icon === 'cloud'}
    <g class="entity-cloud">
      <circle class="cloud entity-cloud-part" cx="38" cy="57" r="23" />
      <circle class="cloud entity-cloud-part" cx="61" cy="42" r="29" />
      <circle class="cloud entity-cloud-part" cx="84" cy="59" r="22" />
      <rect class="cloud" x="30" y="55" width="64" height="25" rx="12" />
    </g>
  {/if}
</svg>

<style>
  .entity-icon { width: 100%; height: 100%; overflow: visible; }
  .animal-fill { fill: #5aa9d6; stroke: #275e7b; stroke-width: 2.4; stroke-linejoin: round; }
  .animal-accent, .blue-light { fill: #a9def2; }
  .soft { fill: #f1c46f; stroke: #a86d24; stroke-width: 2; }
  .paper { fill: #fffaf0; stroke: #725d4e; stroke-width: 2; stroke-linejoin: round; }
  .warm { fill: #f0a83c; stroke: #8f5a16; stroke-width: 2; stroke-linejoin: round; }
  .yellow { fill: #f4c84c; stroke: #9a7419; stroke-width: 2.2; stroke-linejoin: round; }
  .yellow-dark { fill: #e3ad2d; stroke: #9a7419; stroke-width: 2; stroke-linejoin: round; }
  .green { fill: #5dbb65; stroke: #2e7740; stroke-width: 2.2; stroke-linejoin: round; }
  .green-light { fill: #82cf72; stroke: #2e7740; stroke-width: 2; }
  .green-stroke { stroke: #2e7740; }
  .earth-fill { fill: #a46e42; }
  .wood { fill: #8b5d37; }
  .pink { fill: #ec7ea1; stroke: #9d4865; stroke-width: 2.2; }
  .pink-soft { fill: #f5b4c8; stroke: #a85c74; stroke-width: 1.8; }
  .purple { fill: #9d83db; stroke: #6650a8; stroke-width: 2; }
  .blue { fill: #5aa9d6; stroke: #275e7b; stroke-width: 2; }
  .blue-stroke { stroke: #2d88bd; }
  .dark, .eye, .nose, .nose-hole { fill: #322f31; }
  .line { fill: none; stroke: #433b38; stroke-width: 2.6; stroke-linecap: round; stroke-linejoin: round; }
  .nose { fill: #5a3735; }
  .spot, .stripe { fill: #584239; stroke: none; }
  .stripe { fill: none; stroke: #594033; stroke-width: 5; stroke-linecap: round; }
  .orange-fill { fill: #ee963a; stroke: #8f531d; stroke-width: 2.3; stroke-linejoin: round; }
  .orange-dot { fill: rgba(113, 63, 21, .35); }
  .sand { fill: #cfa665; stroke: #74542d; stroke-width: 2.3; stroke-linejoin: round; }
  .bowl { fill: #6aa5cc; stroke: #355f78; stroke-width: 2.4; stroke-linejoin: round; }
  .grain { fill: none; stroke: #c7a96b; stroke-width: 2; stroke-linecap: round; }
  .pulse-dots circle { fill: #d49a52; stroke: #81562e; stroke-width: 1.5; }
  .wheat-stroke { stroke: #9a7026; }
  .wheat-fill { fill: #dfb84f; stroke: #9a7026; stroke-width: 1.5; }
  .honey-jar { fill: #f7c44b; stroke: #9e701a; stroke-width: 2.5; }
  .honey-drop { fill: #d99013; }
  .milk-text { font: 800 14px system-ui, sans-serif; fill: #286b91; }
  .skin { fill: #e9b48d; stroke: #8f664e; stroke-width: 2.2; stroke-linejoin: round; }
  .skin-stroke { stroke: #8f664e; }
  .mouth-fill { fill: #a94355; stroke: #6d2f3a; stroke-width: 2.3; }
  .tongue-line { stroke: #a84e68; }
  .pink-stroke { stroke: #9d4865; }
  .bone-fill { fill: #f4e6c8; stroke: #9a835d; stroke-width: 2.3; }
  .cloud { fill: #e8f3f9; stroke: #7595a8; stroke-width: 2.2; }
</style>
