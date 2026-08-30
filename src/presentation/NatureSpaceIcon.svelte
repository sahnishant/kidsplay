<script lang="ts">
  let { icon }: { icon: string } = $props();
</script>

<svg class={`nature-space-icon nature-space-icon--${icon}`} viewBox="0 0 120 100" aria-hidden="true">
  {#if icon === 'moon'}
    <g class="moon">
      <path class="moon-fill" d="M82 12c-25 8-34 40-17 59 10 12 26 17 42 10-9 11-23 18-39 18C40 99 19 78 19 51 19 24 42 4 68 4c5 0 10 1 14 2Z" />
      <circle class="moon-crater" cx="48" cy="40" r="6" /><circle class="moon-crater" cx="57" cy="66" r="4" />
    </g>
  {:else if icon === 'star'}
    <path class="star-fill" d="m60 5 14 28 31 5-23 22 6 31-28-15-28 15 6-31-23-22 31-5Z" />
  {:else if icon === 'planet'}
    <g class="planet">
      <circle class="planet-fill" cx="60" cy="51" r="28" />
      <path class="planet-band" d="M9 62c16 12 76 13 101-3M14 43c21 12 70 13 94 3" />
      <path class="planet-ring" d="M9 60c13 14 87 21 103-4M10 43c17-16 85-18 100 1" />
    </g>
  {:else if icon === 'river'}
    <g class="river">
      <path class="hill" d="M0 56 22 23l18 24 21-31 25 38 13-18 21 27v37H0Z" />
      <path class="river-fill" d="M51 42c-8 15 8 21-2 34-5 8-20 12-30 24h70c-8-9-12-16-8-24 6-12 17-19 10-34Z" />
      <path class="river-line" d="M66 48c-3 13 9 19 1 29-5 7-12 10-18 19" />
    </g>
  {:else if icon === 'pond'}
    <g class="pond">
      <ellipse class="pond-fill" cx="60" cy="68" rx="47" ry="22" />
      <ellipse class="pond-shine" cx="60" cy="64" rx="31" ry="10" />
      <path class="reed" d="M24 68V33m0 14-8-9m8 4 7-11m68 38V39m0 12-8-8m8 2 7-10" />
    </g>
  {:else if icon === 'well'}
    <g class="well">
      <path class="well-stone" d="M25 49h70v42H25Z" />
      <ellipse class="well-top" cx="60" cy="49" rx="38" ry="14" />
      <ellipse class="water-fill" cx="60" cy="50" rx="27" ry="8" />
      <path class="wood-line" d="M31 44V18m58 26V18M27 18h66M60 18v24" />
      <path class="bucket" d="M51 39h18l-3 15H54Z" />
    </g>
  {:else if icon === 'rain'}
    <g class="rain">
      <path class="cloud-fill" d="M24 47c-7-17 12-30 27-21 6-20 39-17 41 5 19-2 27 24 8 31H30c-11 0-16-7-6-15Z" />
      <path class="rain-drop" d="M37 69 31 84m28-15-6 19m29-19-7 15" />
    </g>
  {:else if icon === 'rainbow'}
    <g class="rainbow">
      <path class="rainbow-red" d="M11 87a49 49 0 0 1 98 0H96a36 36 0 0 0-72 0Z" />
      <path class="rainbow-orange" d="M24 87a36 36 0 0 1 72 0H84a24 24 0 0 0-48 0Z" />
      <path class="rainbow-blue" d="M36 87a24 24 0 0 1 48 0H70a10 10 0 0 0-20 0Z" />
      <circle class="cloud-fill" cx="22" cy="86" r="15" /><circle class="cloud-fill" cx="98" cy="86" r="15" />
    </g>
  {:else if icon === 'lightning'}
    <g class="lightning">
      <path class="cloud-fill" d="M23 43c-6-16 13-28 27-20 7-19 37-15 39 5 18-1 25 22 8 29H29c-10 0-15-6-6-14Z" />
      <path class="lightning-fill" d="M61 51 44 76h14l-6 21 27-32H64l9-14Z" />
    </g>
  {:else if icon === 'snow'}
    <g class="snow">
      <path class="cloud-fill" d="M23 41c-6-16 13-28 27-20 7-19 37-15 39 5 18-1 25 22 8 29H29c-10 0-15-6-6-14Z" />
      <g class="snowflake"><path d="M39 65v25m-11-18 22 12m0-12L28 84M78 65v25m-11-18 22 12m0-12L67 84" /></g>
    </g>
  {:else if icon === 'seed'}
    <g class="seed">
      <ellipse class="seed-fill" cx="58" cy="57" rx="23" ry="34" transform="rotate(31 58 57)" />
      <path class="seed-line" d="M46 75q23-18 30-46" />
      <path class="sprout" d="M66 31q-4-18 13-22 3 16-13 22Zm-3 4q-17-8-20 7 13 8 20-7Z" />
    </g>
  {:else if icon === 'roots'}
    <g class="roots">
      <path class="ground" d="M7 35h106v12H7Z" />
      <path class="stem-line" d="M60 7v31" />
      <path class="leaf-fill" d="M59 24Q40 22 39 9q18-2 21 12Zm2-6Q76 5 88 13 79 28 61 22Z" />
      <path class="root-line" d="M60 42v50M60 54 43 69m17-5 18 15M46 66l-8 18m39-8 9 15M60 75 51 94m9-19 12 19" />
    </g>
  {:else if icon === 'stem'}
    <g class="stem">
      <path class="stem-thick" d="M60 92V20" />
      <path class="leaf-fill" d="M58 50Q32 49 29 31q25-2 30 14Zm3-14Q80 17 96 26 85 47 61 42Zm-2 35Q39 68 34 55q22-4 26 11Z" />
    </g>
  {:else if icon === 'fruit'}
    <g class="fruit">
      <circle class="fruit-fill" cx="58" cy="57" r="30" />
      <path class="stem-line" d="M58 29q2-15 13-22" />
      <path class="leaf-fill" d="M65 18q19-10 26 2-13 14-28 7Z" />
      <ellipse class="fruit-shine" cx="47" cy="46" rx="7" ry="11" />
    </g>
  {:else if icon === 'mountain'}
    <g class="mountain">
      <path class="mountain-back" d="M4 91 39 33l22 34L79 19l37 72Z" />
      <path class="snow-cap" d="m79 19 12 23-11-5-8 8-7-7Z" />
      <path class="mountain-front" d="M4 91 39 33l38 58Z" />
      <path class="snow-cap" d="m39 33 10 15-10-4-8 7-5-5Z" />
    </g>
  {:else if icon === 'day-night'}
    <g class="day-night">
      <path class="day-half" d="M60 7a43 43 0 0 0 0 86Z" />
      <path class="night-half" d="M60 7a43 43 0 0 1 0 86Z" />
      <circle class="sun-small" cx="35" cy="45" r="12" />
      <path class="moon-small" d="M85 31c-13 4-15 22-3 28 5 3 11 3 16 0-4 7-11 11-19 9-11-3-17-14-14-25 2-8 10-14 20-12Z" />
    </g>
  {/if}
</svg>

<style>
  .nature-space-icon { width: 100%; height: 100%; overflow: visible; }
  .moon-fill { fill: #f5df91; stroke: #b99d52; stroke-width: 2.5; }
  .moon-crater { fill: #d8bf6f; opacity: .7; }
  .star-fill, .lightning-fill, .sun-small { fill: #f5c744; stroke: #c89419; stroke-width: 2.5; stroke-linejoin: round; }
  .planet-fill { fill: #8a82df; stroke: #5750aa; stroke-width: 3; }
  .planet-band { fill: none; stroke: #b8b1ff; stroke-width: 4; opacity: .8; }
  .planet-ring { fill: none; stroke: #e1a95c; stroke-width: 5; stroke-linecap: round; }
  .hill, .mountain-front { fill: #75b864; stroke: #477842; stroke-width: 2; }
  .mountain-back { fill: #718fa0; stroke: #486270; stroke-width: 2; }
  .snow-cap { fill: #f5fbff; }
  .river-fill, .pond-fill, .water-fill { fill: #3aa6d8; }
  .river-line { fill: none; stroke: #bfeeff; stroke-width: 3; stroke-linecap: round; }
  .pond-shine { fill: #8ed9ef; opacity: .75; }
  .reed, .stem-line, .root-line { fill: none; stroke: #4c823e; stroke-width: 4; stroke-linecap: round; stroke-linejoin: round; }
  .well-stone { fill: #bcaaa0; stroke: #77655b; stroke-width: 2; }
  .well-top { fill: #dccbc0; stroke: #77655b; stroke-width: 3; }
  .wood-line { fill: none; stroke: #795438; stroke-width: 5; stroke-linecap: round; }
  .bucket { fill: #7ea7b7; stroke: #466c7a; stroke-width: 2; }
  .cloud-fill { fill: #e9f5fb; stroke: #85a9b9; stroke-width: 2; }
  .rain-drop { fill: none; stroke: #3d9bd1; stroke-width: 5; stroke-linecap: round; }
  .rainbow-red { fill: #e86566; }
  .rainbow-orange { fill: #f0ad4e; }
  .rainbow-blue { fill: #629ed5; }
  .snowflake { fill: none; stroke: #68b8df; stroke-width: 3; stroke-linecap: round; }
  .seed-fill { fill: #a86d3d; stroke: #674123; stroke-width: 2.5; }
  .seed-line { fill: none; stroke: #6f4528; stroke-width: 2; }
  .sprout, .leaf-fill { fill: #67b658; stroke: #3c7a37; stroke-width: 2; stroke-linejoin: round; }
  .ground { fill: #b57b50; }
  .stem-thick { fill: none; stroke: #4d913e; stroke-width: 9; stroke-linecap: round; }
  .fruit-fill { fill: #e45c4f; stroke: #aa392f; stroke-width: 3; }
  .fruit-shine { fill: rgba(255,255,255,.45); }
  .day-half { fill: #bfeaff; }
  .night-half { fill: #44517e; }
  .moon-small { fill: #f6e6a5; }
</style>
