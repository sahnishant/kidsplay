<script lang="ts">
  let { icon }: { icon: string } = $props();
</script>

<svg class={`everyday-icon everyday-icon--${icon}`} viewBox="0 0 120 100" aria-hidden="true">
  {#if icon === 'toothbrush'}
    <g class="toothbrush">
      <rect class="handle" x="13" y="53" width="82" height="14" rx="7" transform="rotate(-18 13 53)" />
      <rect class="brush-head" x="82" y="28" width="27" height="18" rx="5" transform="rotate(-18 82 28)" />
      <path class="bristle" d="m87 29-3-9m9 8-2-10m9 8-1-10m9 7 1-9" />
    </g>
  {:else if icon === 'soap'}
    <g class="soap">
      <rect class="soap-fill" x="22" y="43" width="76" height="41" rx="16" />
      <path class="soap-mark" d="M45 63q15-13 30 0" />
      <circle class="bubble" cx="32" cy="29" r="9" /><circle class="bubble" cx="51" cy="22" r="6" /><circle class="bubble" cx="72" cy="31" r="8" />
    </g>
  {:else if icon === 'hands'}
    <g class="hands">
      <path class="skin" d="M17 65q7-22 15-16l6 12V28q0-7 7-7t7 7v25-31q0-7 7-7t7 7v30-25q0-7 7-7t7 7v29-17q0-7 7-7t7 7v23q0 28-28 32H45Q22 92 17 65Z" />
      <path class="hand-line" d="M39 59q14 10 31 0" />
    </g>
  {:else if icon === 'nails'}
    <g class="nails">
      <path class="skin" d="M35 91V34q0-20 17-20 16 0 16 20v25h10V41q0-15 13-15 12 0 12 15v24q0 27-27 27Z" />
      <rect class="nail" x="44" y="18" width="16" height="20" rx="8" /><rect class="nail" x="84" y="30" width="12" height="16" rx="6" />
      <path class="shine" d="M47 24h10m29 11h7" />
    </g>
  {:else if icon === 'dustbin'}
    <g class="dustbin">
      <path class="bin-fill" d="M30 35h60l-7 59H37Z" />
      <rect class="bin-dark" x="24" y="27" width="72" height="12" rx="5" />
      <rect class="bin-dark" x="44" y="18" width="32" height="9" rx="4" />
      <path class="bin-line" d="M48 46v37m24-37v37" />
    </g>
  {:else if icon === 'tap'}
    <g class="tap">
      <path class="metal" d="M23 38h42V25h30v15H68v18H47V48H23Z" />
      <rect class="metal" x="44" y="15" width="32" height="9" rx="4" />
      <path class="water-drop" d="M57 63c-12 16-8 28 0 31 9-3 12-15 0-31Z" />
    </g>
  {:else if icon === 'bucket'}
    <g class="bucket">
      <path class="bucket-fill" d="M27 37h66L84 91H36Z" />
      <path class="bucket-line" d="M34 38q4-27 26-27t27 27" />
      <ellipse class="water" cx="60" cy="47" rx="25" ry="7" />
    </g>
  {:else if icon === 'school'}
    <g class="school">
      <path class="school-fill" d="M16 42 60 14l44 28v52H16Z" />
      <path class="roof" d="m10 43 50-34 50 34-7 10-43-29-43 29Z" />
      <rect class="door" x="50" y="61" width="20" height="33" />
      <rect class="window" x="25" y="57" width="17" height="17" /><rect class="window" x="79" y="57" width="17" height="17" />
      <path class="flag-line" d="M60 14V2" /><path class="flag" d="M60 3h25l-7 8 7 8H60Z" />
    </g>
  {:else if icon === 'hospital'}
    <g class="hospital">
      <rect class="hospital-fill" x="19" y="22" width="82" height="72" rx="5" />
      <rect class="door" x="50" y="65" width="20" height="29" />
      <rect class="window" x="28" y="61" width="14" height="14" /><rect class="window" x="78" y="61" width="14" height="14" />
      <path class="cross" d="M51 31h18v12h12v18H69v12H51V61H39V43h12Z" />
    </g>
  {:else if icon === 'post-office'}
    <g class="post-office">
      <path class="post-fill" d="M17 37h86v57H17Z" />
      <path class="roof" d="M11 37 60 10l49 27Z" />
      <rect class="door" x="50" y="61" width="20" height="33" />
      <path class="envelope" d="M28 50h22v16H28Zm0 0 11 9 11-9" />
      <path class="envelope" d="M72 50h22v16H72Zm0 0 11 9 11-9" />
    </g>
  {:else if icon === 'book'}
    <g class="book">
      <path class="book-left" d="M10 27q25-8 48 6v58q-23-14-48-5Z" />
      <path class="book-right" d="M110 27q-25-8-48 6v58q23-14 48-5Z" />
      <path class="book-line" d="M60 34v57M20 43q17-4 30 3m-30 12q17-4 30 3m20-15q14-7 30-3m-30 18q14-7 30-3" />
    </g>
  {:else if icon === 'bell'}
    <g class="bell">
      <path class="bell-fill" d="M29 69h62q-11-12-11-31 0-19-20-25-20 6-20 25 0 19-11 31Z" />
      <circle class="bell-dark" cx="60" cy="78" r="9" />
      <path class="bell-line" d="M24 69h72" />
    </g>
  {:else if icon === 'apple'}
    <g class="apple">
      <path class="apple-fill" d="M60 31q-17-15-33-2-20 17-6 46 13 29 39 16 26 13 39-16 14-29-6-46-16-13-33 2Z" />
      <path class="stem" d="M60 31q2-18 13-24" />
      <path class="leaf" d="M69 16q17-10 24 2-12 13-26 7Z" />
    </g>
  {:else if icon === 'lunchbox'}
    <g class="lunchbox">
      <rect class="lunch-fill" x="17" y="37" width="86" height="55" rx="11" />
      <path class="lunch-dark" d="M42 37v-9q0-13 18-13t18 13v9h-9v-8q0-6-9-6t-9 6v8Z" />
      <path class="lunch-line" d="M18 58h84M44 58v33" />
      <circle class="food-dot" cx="72" cy="73" r="9" /><circle class="food-dot" cx="89" cy="73" r="6" />
    </g>
  {:else if icon === 'covered-food'}
    <g class="covered-food">
      <ellipse class="plate" cx="60" cy="78" rx="43" ry="12" />
      <path class="cover" d="M24 72q5-39 36-39t36 39Z" />
      <circle class="knob" cx="60" cy="28" r="7" />
      <path class="cover-line" d="M25 72h70" />
    </g>
  {:else if icon === 'cough-cover'}
    <g class="cough-cover">
      <circle class="face" cx="47" cy="38" r="24" />
      <circle class="eye" cx="39" cy="34" r="3" /><circle class="eye" cx="55" cy="34" r="3" />
      <path class="mouth" d="M40 48q8-5 15 1" />
      <path class="sleeve" d="M53 56q20 0 31 20L68 90 49 69Z" />
      <path class="droplet" d="M79 43q9 7 0 14m13-19q9 7 1 14" />
    </g>
  {:else if icon === 'bed'}
    <g class="bed">
      <rect class="bed-fill" x="16" y="50" width="90" height="34" rx="5" />
      <rect class="pillow" x="23" y="55" width="28" height="15" rx="7" />
      <path class="blanket" d="M51 53h51v28H51Z" />
      <path class="bed-line" d="M16 84v11m90-11v11M15 46v40" />
    </g>
  {:else if icon === 'clock'}
    <g class="clock">
      <circle class="clock-fill" cx="60" cy="52" r="39" />
      <path class="tick" d="M60 19v7m0 52v7M27 52h7m52 0h7" />
      <path class="hand" d="M60 52V31m0 21 19 10" />
      <circle class="clock-dark" cx="60" cy="52" r="4" />
    </g>
  {:else if icon === 'diya'}
    <g class="diya">
      <path class="diya-fill" d="M20 62q40 30 80 0-7 30-40 30T20 62Z" />
      <path class="flame" d="M60 61q-19-16 2-42 18 23-2 42Z" />
      <path class="wick" d="M60 64V51" />
    </g>
  {:else if icon === 'gift'}
    <g class="gift">
      <rect class="gift-fill" x="20" y="43" width="80" height="49" rx="4" />
      <rect class="ribbon" x="53" y="43" width="14" height="49" />
      <rect class="lid" x="15" y="34" width="90" height="16" rx="4" />
      <path class="bow" d="M60 35Q32 34 37 15q17-3 23 20Zm0 0q28-1 23-20-17-3-23 20Z" />
    </g>
  {/if}
</svg>

<style>
  .everyday-icon { width: 100%; height: 100%; overflow: visible; }
  .handle { fill: #6eb7de; stroke: #36799e; stroke-width: 2; }
  .brush-head { fill: #eef8fb; stroke: #6b929f; stroke-width: 2; }
  .bristle { fill: none; stroke: #5a7ecb; stroke-width: 3; stroke-linecap: round; }
  .soap-fill { fill: #ef9cc0; stroke: #ad547d; stroke-width: 3; }
  .soap-mark { fill: none; stroke: rgba(255,255,255,.8); stroke-width: 4; stroke-linecap: round; }
  .bubble { fill: #dff6ff; stroke: #83bfd4; stroke-width: 2; }
  .skin, .face { fill: #efba89; stroke: #9f6b48; stroke-width: 2.5; stroke-linejoin: round; }
  .hand-line, .shine, .mouth { fill: none; stroke: #8a573d; stroke-width: 2.5; stroke-linecap: round; }
  .nail { fill: #f9d7c2; stroke: #c28f70; stroke-width: 1.5; }
  .bin-fill { fill: #69a96d; stroke: #3c7640; stroke-width: 3; }
  .bin-dark { fill: #487c4b; }
  .bin-line { stroke: #3c7640; stroke-width: 3; }
  .metal { fill: #aab8bf; stroke: #687a82; stroke-width: 3; stroke-linejoin: round; }
  .water-drop, .water { fill: #53b7df; stroke: #287da5; stroke-width: 2; }
  .bucket-fill { fill: #6fadd1; stroke: #3a7798; stroke-width: 3; }
  .bucket-line { fill: none; stroke: #5c666b; stroke-width: 4; }
  .school-fill, .post-fill { fill: #f2d584; stroke: #9e7837; stroke-width: 2.5; }
  .hospital-fill { fill: #eef3f5; stroke: #8498a2; stroke-width: 2.5; }
  .roof { fill: #d76b55; stroke: #984738; stroke-width: 2.5; }
  .door { fill: #8d6651; }
  .window { fill: #86c9e7; stroke: #4b89a5; stroke-width: 2; }
  .flag { fill: #6a67d8; }.flag-line { stroke: #555; stroke-width: 2; }
  .cross { fill: #e45555; }
  .envelope { fill: #f8f4e5; stroke: #766f61; stroke-width: 2; }
  .book-left { fill: #72aad9; stroke: #476f92; stroke-width: 2.5; }
  .book-right { fill: #8dc1e8; stroke: #476f92; stroke-width: 2.5; }
  .book-line { fill: none; stroke: #f7fbff; stroke-width: 2; }
  .bell-fill { fill: #f2bd47; stroke: #aa7822; stroke-width: 3; }.bell-dark { fill: #8b6523; }.bell-line { stroke: #aa7822; stroke-width: 3; }
  .apple-fill { fill: #df574d; stroke: #a3342f; stroke-width: 3; }.stem { fill: none; stroke: #6f4e2d; stroke-width: 4; }.leaf { fill: #5da757; }
  .lunch-fill { fill: #7ab9d5; stroke: #407c96; stroke-width: 3; }.lunch-dark { fill: #477e93; }.lunch-line { stroke: #4d869d; stroke-width: 2; }.food-dot { fill: #e9a456; }
  .plate { fill: #eef4f7; stroke: #8296a0; stroke-width: 2; }.cover { fill: #b9c7ce; stroke: #6c7e86; stroke-width: 3; }.knob { fill: #6f7e84; }.cover-line { stroke: #6c7e86; stroke-width: 3; }
  .eye { fill: #403126; }.sleeve { fill: #6ca0d5; stroke: #426d99; stroke-width: 2; }.droplet { fill: none; stroke: #88bcd2; stroke-width: 3; stroke-linecap: round; }
  .bed-fill { fill: #8ab7d6; stroke: #4c7897; stroke-width: 3; }.pillow { fill: #f5f2df; }.blanket { fill: #7b72d8; }.bed-line { stroke: #604f44; stroke-width: 4; }
  .clock-fill { fill: #f8f5e7; stroke: #647984; stroke-width: 4; }.tick, .hand { fill: none; stroke: #3e5058; stroke-width: 4; stroke-linecap: round; }.clock-dark { fill: #3e5058; }
  .diya-fill { fill: #d97438; stroke: #94451f; stroke-width: 3; }.flame { fill: #f3b62e; stroke: #d46f18; stroke-width: 2; }.wick { stroke: #4b3528; stroke-width: 3; }
  .gift-fill { fill: #6c9ed6; stroke: #3f6792; stroke-width: 3; }.ribbon, .lid, .bow { fill: #ec7587; stroke: #a74959; stroke-width: 2; }
</style>
