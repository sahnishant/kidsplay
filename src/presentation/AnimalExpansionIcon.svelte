<script lang="ts">
  let { icon }: { icon: string } = $props();
</script>

<svg class={`animal-expansion-icon animal-expansion-icon--${icon}`} viewBox="0 0 120 100" aria-hidden="true">
  {#if icon === 'seahorse'}
    <g class="seahorse">
      <path class="sea-animal" d="M65 14q24 2 18 24-4 14-20 13v12q0 14 14 13 12-1 9-13-2-8-10-7 10-11 23-2 13 10 5 27-9 20-34 13-22-7-24-30-2-16 10-27-8-4-7-14 7-6 16 1Z" />
      <circle class="eye" cx="73" cy="27" r="3" /><path class="line" d="M80 37q7 4 12 0" />
      <path class="fin" d="M50 53 32 43l5 24Z" />
    </g>
  {:else if icon === 'emu'}
    <g class="emu">
      <ellipse class="bird-body" cx="61" cy="62" rx="31" ry="22" />
      <path class="bird-neck" d="M76 59q-2-34 12-43 15 2 13 16-8 7-15 2l-1 30Z" />
      <circle class="eye" cx="94" cy="25" r="2.5" />
      <path class="beak" d="m101 28 15 5-15 5Z" />
      <path class="leg" d="M52 79v18m18-18v18M46 97h14m4 0h14" />
      <path class="wing" d="M47 55q18-13 31 4-13 14-27 10Z" />
    </g>
  {:else if icon === 'mammoth'}
    <g class="mammoth">
      <ellipse class="mammoth-fill" cx="58" cy="61" rx="40" ry="27" />
      <circle class="mammoth-fill" cx="86" cy="48" r="23" />
      <path class="mammoth-fill" d="M98 55q10 21 0 35-8 10-15 2 10-7 8-31Z" />
      <path class="ear" d="M74 43q-18-8-18 12 9 13 20 5Z" />
      <path class="tusk" d="M96 62q16 15 20 2-1 20-22 13Z" />
      <path class="leg" d="M34 78v19m23-19v19m23-19v19" />
      <circle class="eye" cx="91" cy="43" r="3" />
      <path class="hair" d="M27 43 17 32m22 5-7-14m21 12-2-16m19 18 3-15" />
    </g>
  {:else if icon === 'sheep' || icon === 'lamb'}
    <g class="sheep">
      <circle class="wool" cx="38" cy="57" r={icon === 'lamb' ? 17 : 22} />
      <circle class="wool" cx="58" cy="52" r={icon === 'lamb' ? 19 : 25} />
      <circle class="wool" cx="78" cy="58" r={icon === 'lamb' ? 16 : 21} />
      <ellipse class="face-dark" cx="92" cy="54" rx="16" ry="19" />
      <circle class="eye-light" cx="88" cy="49" r="2.5" /><circle class="eye-light" cx="98" cy="49" r="2.5" />
      <path class="leg" d="M43 75v21m23-21v21m18-18v18" />
      <path class="ear-dark" d="M82 43 70 36l7 15Zm18 0 12-8-6 16Z" />
    </g>
  {:else if icon === 'tortoise'}
    <g class="tortoise">
      <ellipse class="shell" cx="57" cy="58" rx="38" ry="27" />
      <path class="shell-line" d="M34 40 47 58 32 75m25-44v55m22-46L67 58l15 17M22 58h70" />
      <circle class="tortoise-skin" cx="98" cy="58" r="13" />
      <circle class="eye" cx="103" cy="54" r="2.5" />
      <ellipse class="tortoise-skin" cx="30" cy="84" rx="10" ry="6" /><ellipse class="tortoise-skin" cx="76" cy="84" rx="10" ry="6" />
      <path class="tail" d="m18 59-13 7 13 4Z" />
    </g>
  {:else if icon === 'polar-bear'}
    <g class="polar-bear">
      <ellipse class="polar" cx="59" cy="67" rx="36" ry="24" />
      <circle class="polar" cx="44" cy="43" r="24" />
      <circle class="polar" cx="28" cy="27" r="10" /><circle class="polar" cx="58" cy="25" r="10" />
      <ellipse class="muzzle" cx="39" cy="51" rx="12" ry="9" />
      <circle class="eye" cx="37" cy="41" r="3" /><circle class="eye" cx="52" cy="40" r="3" /><path class="nose" d="m34 49 9 0-4 5Z" />
      <path class="leg" d="M42 82v14m25-14v14m19-12v12" />
    </g>
  {:else if icon === 'rhinoceros'}
    <g class="rhino">
      <ellipse class="rhino-fill" cx="58" cy="66" rx="39" ry="24" />
      <path class="rhino-fill" d="M82 51q10-24 25-11 12 10 5 25-9 16-30 9Z" />
      <path class="horn" d="m101 42 8-24 7 27Z" />
      <circle class="eye" cx="102" cy="52" r="3" />
      <path class="ear" d="M88 42 82 26l14 10Z" />
      <path class="leg" d="M34 80v17m25-17v17m31-17v17" />
      <path class="tail" d="M20 62Q6 54 8 72" />
    </g>
  {:else if icon === 'horse' || icon === 'foal'}
    <g class="horse">
      <ellipse class="horse-fill" cx="58" cy="68" rx={icon === 'foal' ? 31 : 37} ry={icon === 'foal' ? 19 : 23} />
      <path class="horse-fill" d="M75 61q5-32 20-37 16 5 12 21-7 10-18 7l-2 24Z" />
      <path class="mane" d="M83 32q-12 16-9 34l9-4q-4-15 6-27Z" />
      <circle class="eye" cx="99" cy="36" r="2.5" />
      <path class="ear" d="M91 26 91 10l10 15Z" />
      <path class="leg" d="M36 81v17m23-17v17m26-16v16" />
      <path class="tail" d="M23 63q-18 8-12 27" />
    </g>
  {:else if icon === 'hen'}
    <g class="hen">
      <ellipse class="hen-fill" cx="58" cy="62" rx="34" ry="26" />
      <circle class="hen-fill" cx="88" cy="43" r="18" />
      <path class="comb" d="M78 27q3-13 9-3 4-15 9-2 8-10 9 3Z" />
      <path class="beak" d="m104 43 15 7-15 7Z" />
      <circle class="eye" cx="94" cy="40" r="3" />
      <path class="wing" d="M43 54q20-10 29 8-15 15-31 8Z" />
      <path class="leg" d="M50 82v15m21-15v15M43 97h14m7 0h14" />
      <path class="tail-feather" d="M27 56 8 39l8 28-13-4 21 16Z" />
    </g>
  {:else if icon === 'lion'}
    <g class="lion">
      <ellipse class="lion-body" cx="63" cy="72" rx="31" ry="20" />
      <circle class="mane" cx="47" cy="43" r="31" />
      <circle class="lion-face" cx="47" cy="44" r="21" />
      <circle class="eye" cx="40" cy="41" r="3" /><circle class="eye" cx="54" cy="41" r="3" />
      <ellipse class="muzzle" cx="47" cy="53" rx="10" ry="7" /><path class="nose" d="m43 50 8 0-4 4Z" />
      <path class="leg" d="M52 84v13m25-13v13" /><path class="tail" d="M89 72q24-7 19 15" /><circle class="mane" cx="107" cy="88" r="6" />
    </g>
  {:else if icon === 'tadpole'}
    <g class="tadpole">
      <ellipse class="tadpole-fill" cx="40" cy="50" rx="26" ry="22" />
      <circle class="eye" cx="33" cy="45" r="3" />
      <path class="tadpole-tail" d="M62 53q38-28 49 3-18 2-33 20-8-9-16-23Z" />
      <path class="line" d="M29 58q8 5 16 0" />
    </g>
  {:else if icon === 'calf'}
    <g class="calf">
      <ellipse class="calf-body" cx="60" cy="69" rx="31" ry="19" />
      <circle class="calf-head" cx="34" cy="48" r="18" />
      <path class="ear" d="M20 39 8 29l16 2Zm27-1 13-10-6 15Z" />
      <path class="spot" d="M53 57q12-7 19 2-3 12-17 10Z" />
      <circle class="eye" cx="29" cy="45" r="2.5" /><circle class="eye" cx="39" cy="45" r="2.5" />
      <path class="leg" d="M45 82v15m22-15v15m18-13v13" />
    </g>
  {:else if icon === 'kennel'}
    <g class="animal-home">
      <path class="home-fill" d="M15 48 60 14l45 34v47H15Z" />
      <path class="roof" d="M7 49 60 7l53 42-8 10-45-35-45 35Z" />
      <path class="home-door" d="M43 95V60q0-17 17-17t17 17v35Z" />
      <path class="bone-mark" d="M44 35q-6-8-12 0l6 6-6 6q6 8 12 0h32q6 8 12 0l-6-6 6-6q-6-8-12 0Z" />
    </g>
  {:else if icon === 'stable'}
    <g class="animal-home">
      <path class="stable-fill" d="M14 41h92v55H14Z" /><path class="roof" d="M7 42 60 10l53 32Z" />
      <rect class="stable-door" x="43" y="53" width="34" height="43" /><path class="stable-cross" d="M43 53l34 43M77 53 43 96" />
    </g>
  {:else if icon === 'cowshed'}
    <g class="animal-home">
      <path class="shed-fill" d="M17 45h86v51H17Z" /><path class="roof" d="M8 46 27 22h66l19 24Z" />
      <rect class="shed-door" x="45" y="58" width="30" height="38" /><circle class="spot" cx="33" cy="64" r="6" /><circle class="spot" cx="89" cy="71" r="7" />
    </g>
  {:else if icon === 'coop'}
    <g class="animal-home">
      <path class="coop-fill" d="M18 42h84v54H18Z" /><path class="roof" d="M9 43 60 12l51 31Z" />
      <path class="mesh" d="M28 52h64v34H28Zm0 0 64 34m0-34L28 86M49 52v34m22-34v34" />
    </g>
  {:else if icon === 'burrow'}
    <g class="burrow">
      <path class="earth" d="M4 53q28-28 56-6 28-22 56 6v47H4Z" />
      <ellipse class="hole" cx="60" cy="72" rx="27" ry="22" /><path class="grass" d="M18 54V39m0 8-8-6m8 6 8-7m75 14V39m0 8-8-6m8 6 8-7" />
    </g>
  {:else if icon === 'den'}
    <g class="den">
      <path class="rock" d="M8 92q4-64 52-75 48 11 52 75Z" />
      <path class="cave" d="M35 92q2-40 25-42 23 2 25 42Z" />
      <path class="rock-line" d="M28 46 15 39m71 4 18-8M37 27l-4-14m42 15 5-14" />
    </g>
  {/if}
</svg>

<style>
  .animal-expansion-icon { width: 100%; height: 100%; overflow: visible; }
  .sea-animal, .tadpole-fill { fill: #68a9c6; stroke: #33738f; stroke-width: 2.5; }.fin, .tadpole-tail { fill: #83c3d9; stroke: #33738f; stroke-width: 2; }
  .bird-body, .bird-neck { fill: #8b7664; stroke: #55483d; stroke-width: 2.5; }.beak { fill: #e4a33e; }.wing { fill: #aa927d; }.leg { fill: none; stroke: #5a4635; stroke-width: 4; stroke-linecap: round; }
  .mammoth-fill { fill: #8f735d; stroke: #57483d; stroke-width: 3; }.tusk { fill: #f4e8cf; stroke: #bba98b; stroke-width: 2; }.hair { fill: none; stroke: #6a5445; stroke-width: 3; }
  .wool { fill: #f1eee2; stroke: #aaa493; stroke-width: 2; }.face-dark, .ear-dark { fill: #51453d; }.eye-light { fill: #fff; }
  .shell { fill: #6fa34e; stroke: #426d32; stroke-width: 3; }.shell-line { fill: none; stroke: #4f7d3b; stroke-width: 2; }.tortoise-skin { fill: #83af62; }.tail { fill: #83af62; stroke: #426d32; stroke-width: 2; }
  .polar { fill: #f4f4ee; stroke: #9aa4a8; stroke-width: 2.5; }.muzzle { fill: #deded8; }.eye, .nose { fill: #30363a; }
  .rhino-fill { fill: #8b9ca2; stroke: #596a70; stroke-width: 3; }.horn { fill: #e9e2cf; stroke: #9d9480; stroke-width: 2; }
  .horse-fill { fill: #b47b4d; stroke: #71492f; stroke-width: 3; }.mane { fill: #64422e; }.ear { fill: #9a6845; }
  .hen-fill { fill: #d29a59; stroke: #825b35; stroke-width: 2.5; }.comb { fill: #d84f4f; }.tail-feather { fill: #91653b; }.lion-body, .lion-face { fill: #d8a24e; stroke: #8b642d; stroke-width: 2.5; }.mane { fill: #9b6633; }.calf-body, .calf-head { fill: #f0eee3; stroke: #8b8173; stroke-width: 2.5; }.spot { fill: #6f5b4d; }
  .line { fill: none; stroke: #345268; stroke-width: 2.5; stroke-linecap: round; }
  .home-fill { fill: #d9a46c; stroke: #8c6039; stroke-width: 2.5; }.roof { fill: #a85543; stroke: #71382d; stroke-width: 2.5; }.home-door, .stable-door, .shed-door { fill: #604535; }.bone-mark { fill: #f2e3c5; }.stable-fill, .shed-fill { fill: #c99763; stroke: #805936; stroke-width: 2.5; }.stable-cross { stroke: #bd8e61; stroke-width: 4; }
  .coop-fill { fill: #c98b58; stroke: #7a5131; stroke-width: 2.5; }.mesh { fill: none; stroke: #eee7d9; stroke-width: 2; }.earth { fill: #9a6d48; }.hole, .cave { fill: #4e3b31; }.grass { fill: none; stroke: #579347; stroke-width: 3; }.rock { fill: #7f8586; stroke: #555d60; stroke-width: 3; }.rock-line { stroke: #61696b; stroke-width: 3; }
</style>
