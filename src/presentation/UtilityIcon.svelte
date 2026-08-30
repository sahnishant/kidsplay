<script lang="ts">
  let { icon }: { icon: string } = $props();
</script>

<svg class={`utility-icon utility-icon--${icon}`} viewBox="0 0 120 100" aria-hidden="true">
  {#if icon === 'bicycle'}
    <g>
      <circle class="wheel" cx="28" cy="72" r="19" /><circle class="wheel" cx="92" cy="72" r="19" />
      <path class="line accent-stroke" d="M28 72 46 45h27l19 27M46 45l18 27H28m36 0 9-27m-16-8h19m-34 8-7-11" />
      <circle class="hub" cx="64" cy="72" r="5" />
    </g>
  {:else if icon === 'car'}
    <g>
      <path class="vehicle" d="M14 64 23 43h17l12-17h35l15 17h7l7 21v15H8V67Z" />
      <path class="window" d="m45 43 10-13h28l11 13Z" />
      <circle class="tyre" cx="31" cy="78" r="12" /><circle class="tyre" cx="91" cy="78" r="12" />
      <circle class="hub" cx="31" cy="78" r="5" /><circle class="hub" cx="91" cy="78" r="5" />
    </g>
  {:else if icon === 'bus'}
    <g>
      <rect class="vehicle" x="12" y="20" width="96" height="60" rx="10" />
      <rect class="window" x="22" y="29" width="18" height="19" rx="3" /><rect class="window" x="45" y="29" width="18" height="19" rx="3" /><rect class="window" x="68" y="29" width="18" height="19" rx="3" /><rect class="window" x="91" y="29" width="10" height="19" rx="3" />
      <path class="paper" d="M22 55h80v13H22Z" />
      <circle class="tyre" cx="31" cy="80" r="11" /><circle class="tyre" cx="90" cy="80" r="11" />
    </g>
  {:else if icon === 'train'}
    <g>
      <rect class="vehicle" x="26" y="12" width="67" height="66" rx="15" />
      <rect class="window" x="36" y="24" width="20" height="18" rx="4" /><rect class="window" x="63" y="24" width="20" height="18" rx="4" />
      <circle class="lamp" cx="60" cy="57" r="7" />
      <circle class="tyre" cx="43" cy="78" r="9" /><circle class="tyre" cx="77" cy="78" r="9" />
      <path class="line" d="M33 91h54M40 83 28 96m52-13 12 13" />
    </g>
  {:else if icon === 'aeroplane'}
    <g>
      <path class="plane" d="M7 56 54 48 80 11l12 3-14 32 29-5 8 8-39 13-12 30-9-2 4-26-34 8Z" />
      <circle class="window-dot" cx="69" cy="52" r="2.5" /><circle class="window-dot" cx="77" cy="50" r="2.5" />
    </g>
  {:else if icon === 'ship'}
    <g>
      <path class="ship-hull" d="M11 62h98L94 84H29Z" />
      <rect class="paper" x="39" y="38" width="47" height="24" rx="3" />
      <rect class="vehicle" x="48" y="26" width="28" height="12" rx="2" />
      <path class="line blue-stroke" d="M6 89q11-8 22 0t22 0q11-8 22 0t22 0q11-8 20 0" />
      <path class="line" d="M60 26V13" />
    </g>
  {:else if icon === 'ambulance'}
    <g>
      <path class="paper" d="M9 50h62V27h24l17 23v30H9Z" />
      <path class="vehicle" d="M71 32h20l12 18H71Z" />
      <path class="cross" d="M36 38h10v10h10v10H46v10H36V58H26V48h10Z" />
      <circle class="tyre" cx="31" cy="80" r="11" /><circle class="tyre" cx="91" cy="80" r="11" />
      <rect class="lamp" x="56" y="20" width="15" height="7" rx="3" />
    </g>
  {:else if icon === 'telephone'}
    <g class="utility-phone">
      <path class="dark" d="M18 29q42-26 84 0l-13 17q-9-7-18-10v12H49V36q-9 3-18 10Z" />
      <rect class="phone-body" x="32" y="43" width="56" height="43" rx="10" />
      <circle class="paper" cx="60" cy="64" r="14" />
      <circle class="dark" cx="60" cy="64" r="5" />
    </g>
  {:else if icon === 'letter'}
    <g>
      <rect class="paper" x="13" y="25" width="94" height="58" rx="6" />
      <path class="line accent-stroke" d="M16 30 60 62l44-32M17 78l31-28m55 28L72 50" />
    </g>
  {:else if icon === 'radio'}
    <g>
      <rect class="radio" x="14" y="29" width="92" height="58" rx="10" />
      <circle class="speaker" cx="48" cy="59" r="20" />
      <circle class="paper" cx="83" cy="48" r="6" /><circle class="paper" cx="83" cy="68" r="6" />
      <path class="line" d="M26 28 89 9" />
    </g>
  {:else if icon === 'newspaper'}
    <g>
      <path class="paper" d="M18 16h84v72H18Z" />
      <rect class="dark" x="28" y="26" width="64" height="9" rx="2" />
      <rect class="soft" x="28" y="44" width="27" height="26" rx="3" />
      <path class="line faint" d="M62 45h30M62 53h30M62 61h30M28 77h64" />
    </g>
  {:else if icon === 'helmet'}
    <g>
      <path class="helmet" d="M20 61q0-46 40-46 39 0 40 46Z" />
      <path class="dark" d="M20 61h87v10H20Z" />
      <path class="line" d="M78 71q-3 20 14 20" />
      <circle class="strap" cx="94" cy="90" r="4" />
    </g>
  {:else if icon === 'seatbelt'}
    <g>
      <path class="belt" d="M25 9h17l54 82H79Z" />
      <rect class="buckle" x="54" y="51" width="25" height="22" rx="4" transform="rotate(34 54 51)" />
      <rect class="paper" x="61" y="55" width="10" height="6" rx="2" transform="rotate(34 61 55)" />
    </g>
  {:else if icon === 'zebra-crossing'}
    <g>
      <path class="road" d="M8 13h104v78H8Z" />
      <path class="paper" d="M19 22h16v60H19Zm26 0h16v60H45Zm26 0h16v60H71Zm26 0h9v60h-9Z" />
    </g>
  {:else if icon === 'traffic-light'}
    <g>
      <rect class="dark" x="39" y="7" width="42" height="70" rx="10" />
      <circle class="red" cx="60" cy="23" r="10" /><circle class="yellow" cx="60" cy="43" r="10" /><circle class="green" cx="60" cy="63" r="10" />
      <rect class="dark" x="55" y="77" width="10" height="18" />
    </g>
  {:else if icon === 'raincoat'}
    <g>
      <path class="coat" d="M45 19q15-15 30 0l24 22-13 16-10-9v44H44V48l-10 9-13-16Z" />
      <path class="line coat-stroke" d="M60 13v79m-15-70 15 12 15-12" />
      <circle class="button" cx="66" cy="48" r="3" /><circle class="button" cx="66" cy="61" r="3" />
    </g>
  {:else if icon === 'sunhat'}
    <g>
      <ellipse class="hat-brim" cx="60" cy="70" rx="50" ry="17" />
      <path class="hat" d="M32 66q2-48 28-48t28 48Z" />
      <path class="ribbon" d="M31 57h58v11H31Z" />
    </g>
  {:else if icon === 'wool'}
    <g>
      <path class="sweater" d="M43 20 24 34 10 58l18 10 10-15v39h44V53l10 15 18-10-14-24-19-14q-17 14-34 0Z" />
      <path class="line sweater-line" d="M45 24q15 13 30 0M43 59h34" />
    </g>
  {:else if icon === 'cotton'}
    <g>
      <path class="shirt" d="M41 18 19 31 7 52l18 12 12-15v43h46V49l12 15 18-12-12-21-22-13q-19 11-38 0Z" />
      <path class="line shirt-line" d="M42 21q18 12 36 0" />
      <circle class="cotton" cx="60" cy="55" r="11" /><circle class="cotton" cx="50" cy="59" r="8" /><circle class="cotton" cx="70" cy="59" r="8" />
    </g>
  {:else if icon === 'pucca-house'}
    <g>
      <path class="roof" d="M10 48 60 9l50 39Z" />
      <rect class="house" x="21" y="46" width="78" height="49" />
      <rect class="door" x="51" y="65" width="20" height="30" />
      <rect class="window" x="30" y="59" width="15" height="15" /><rect class="window" x="77" y="59" width="15" height="15" />
    </g>
  {:else if icon === 'kutcha-house'}
    <g>
      <path class="thatch" d="M8 48 60 12l52 36-8 9H16Z" />
      <path class="mud" d="M20 51h80v44H20Z" />
      <rect class="door dark" x="52" y="65" width="20" height="30" />
      <path class="line mud-line" d="M28 60h18m32 0h14M28 72h14m40 0h10M31 84h16m31 0h13" />
    </g>
  {:else if icon === 'tent'}
    <g>
      <path class="tent" d="M10 89 60 12l50 77Z" />
      <path class="tent-side" d="M60 12 90 89H60Z" />
      <path class="door" d="M60 52 43 89h34Z" />
    </g>
  {:else if icon === 'houseboat'}
    <g>
      <path class="ship-hull" d="M8 73h104L96 89H26Z" />
      <rect class="house" x="28" y="36" width="65" height="38" rx="3" />
      <path class="roof" d="M21 39 60 17l40 22Z" />
      <rect class="window" x="38" y="46" width="15" height="14" /><rect class="window" x="68" y="46" width="15" height="14" />
      <path class="line blue-stroke" d="M7 94q12-7 24 0t24 0q12-7 24 0t24 0" />
    </g>
  {/if}
</svg>

<style>
  .utility-icon { width: 100%; height: 100%; overflow: visible; }
  .line { fill: none; stroke: #3d454b; stroke-width: 2.6; stroke-linecap: round; stroke-linejoin: round; }
  .wheel { fill: #f7f8f8; stroke: #34424a; stroke-width: 5; }
  .tyre { fill: #34424a; stroke: #1f292f; stroke-width: 2; }
  .hub { fill: #d9e2e7; stroke: #52646f; stroke-width: 2; }
  .vehicle { fill: #e65f64; stroke: #87373a; stroke-width: 2.4; stroke-linejoin: round; }
  .window { fill: #bce8f6; stroke: #4d8193; stroke-width: 1.8; }
  .paper { fill: #fffdf5; stroke: #83796e; stroke-width: 2; stroke-linejoin: round; }
  .lamp { fill: #f3c84b; stroke: #9c7d20; stroke-width: 1.5; }
  .plane { fill: #7aaecb; stroke: #416d82; stroke-width: 2.4; stroke-linejoin: round; }
  .window-dot { fill: #ecf8fc; }
  .ship-hull { fill: #477eac; stroke: #274e6d; stroke-width: 2.5; stroke-linejoin: round; }
  .blue-stroke { stroke: #2d8bbd; }
  .dark { fill: #3a4247; stroke: #252b2f; stroke-width: 2; }
  .phone-body, .radio { fill: #79a8c5; stroke: #3b667e; stroke-width: 2.5; }
  .speaker { fill: #50646f; stroke: #293940; stroke-width: 2; }
  .soft { fill: #e4edf0; stroke: #9ba9af; stroke-width: 1.5; }
  .faint { stroke: #9aa5aa; stroke-width: 2; }
  .helmet { fill: #ef705c; stroke: #8e3b30; stroke-width: 2.5; }
  .strap { fill: #3a4247; }
  .belt { fill: #39444c; }
  .buckle { fill: #c5cdd2; stroke: #6c787f; stroke-width: 2; }
  .road { fill: #525a5f; }
  .red { fill: #e65353; }.yellow { fill: #f4c84b; }.green { fill: #4fb269; }
  .coat { fill: #5aa9d6; stroke: #2c6684; stroke-width: 2.5; stroke-linejoin: round; }
  .coat-stroke { stroke: #2c6684; }.button { fill: #f4c84b; }
  .hat { fill: #efc369; stroke: #9b7426; stroke-width: 2.2; }.hat-brim { fill: #f4d98e; stroke: #9b7426; stroke-width: 2.2; }.ribbon { fill: #df6b6f; }
  .sweater { fill: #c98bbf; stroke: #704a69; stroke-width: 2.3; stroke-linejoin: round; }.sweater-line { stroke: #704a69; }
  .shirt { fill: #f0f4f5; stroke: #7e8b90; stroke-width: 2.2; stroke-linejoin: round; }.shirt-line { stroke: #7e8b90; }.cotton { fill: #fff; stroke: #a7b3b7; stroke-width: 1.5; }
  .roof { fill: #cf5f4d; stroke: #7c3a30; stroke-width: 2.3; stroke-linejoin: round; }.house { fill: #e7c58d; stroke: #8a6b3d; stroke-width: 2.2; }.door { fill: #835738; stroke: #563820; stroke-width: 2; }
  .thatch { fill: #c49b55; stroke: #785d32; stroke-width: 2.4; }.mud { fill: #ba885e; stroke: #765236; stroke-width: 2.2; }.mud-line { stroke: #8f6646; }
  .tent { fill: #ee9b55; stroke: #965a28; stroke-width: 2.5; }.tent-side { fill: #d77d3f; stroke: #965a28; stroke-width: 2; }
  .cross { fill: #e34f57; }.accent-stroke { stroke: #5a52d5; }
</style>
