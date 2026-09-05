<script lang="ts">
  let { icon }: { icon: string } = $props();
</script>

<svg class={`bicycle-workshop-icon bicycle-workshop-icon--${icon}`} viewBox="0 0 120 100" aria-hidden="true">
  {#if icon === 'wheel'}
    <g class="wheel-art">
      <circle class="tyre" cx="60" cy="50" r="38" />
      <circle class="rim" cx="60" cy="50" r="30" />
      <circle class="hub" cx="60" cy="50" r="6" />
      <path class="spokes" d="M60 20v60M30 50h60M39 29l42 42M81 29 39 71" />
    </g>
  {:else if icon === 'tyre'}
    <g>
      <circle class="tyre tyre--wide" cx="60" cy="50" r="36" />
      <circle class="paper" cx="60" cy="50" r="23" />
      <path class="tread" d="m36 23 8 8m13-17 3 11m23-2-8 8m17 12-11 3m11 19-11-3m2 21-8-8m-15 11-3-11m-21 8 8-8m-17-10 11-3m-11-19 11 3" />
    </g>
  {:else if icon === 'pedal'}
    <g>
      <circle class="gear" cx="53" cy="53" r="18" />
      <circle class="hub" cx="53" cy="53" r="5" />
      <path class="metal" d="M53 53 75 70" />
      <rect class="rubber" x="72" y="65" width="30" height="11" rx="4" transform="rotate(8 72 65)" />
      <path class="metal" d="M53 53 34 35" />
      <rect class="rubber" x="12" y="25" width="28" height="11" rx="4" transform="rotate(8 12 25)" />
    </g>
  {:else if icon === 'handlebar'}
    <g>
      <path class="metal" d="M60 84V42M60 44c0-17 8-25 23-25h18M60 44c0-17-8-25-23-25H19" />
      <rect class="rubber" x="9" y="13" width="23" height="13" rx="6" />
      <rect class="rubber" x="88" y="13" width="23" height="13" rx="6" />
      <path class="accent" d="M49 84h22" />
    </g>
  {:else if icon === 'brake'}
    <g>
      <path class="metal" d="M26 24h48q17 0 22 17" />
      <path class="lever" d="M55 28q28 12 32 37l-10 3Q70 48 48 39Z" />
      <circle class="bolt" cx="56" cy="29" r="5" />
      <path class="cable" d="M96 41q11 20 3 42" />
      <path class="label-line" d="M24 78h48" />
    </g>
  {:else if icon === 'bell'}
    <g>
      <path class="bell" d="M28 61q0-35 32-35t32 35Z" />
      <rect class="dark" x="23" y="59" width="74" height="9" rx="4" />
      <circle class="clapper" cx="60" cy="71" r="7" />
      <path class="ringer" d="M86 35q16-9 19 4" />
      <circle class="ringer-dot" cx="105" cy="39" r="5" />
      <path class="sound" d="M18 32q-10 9 0 18m84-20q11 10 0 21" />
    </g>
  {:else if icon === 'seat'}
    <g>
      <path class="seat" d="M18 37q42-22 84 0l-9 19H31Z" />
      <path class="metal" d="M58 56v31m6-31v31" />
      <path class="accent" d="M47 88h28" />
    </g>
  {:else if icon === 'carrier'}
    <g>
      <path class="metal" d="M23 35h70M27 45h70M32 35l-9 52m64-52 12 52M40 35v10m17-10v10m17-10v10" />
      <circle class="bolt" cx="23" cy="87" r="5" /><circle class="bolt" cx="99" cy="87" r="5" />
    </g>
  {:else if icon === 'chain'}
    <g class="chain-art">
      <ellipse class="chain" cx="60" cy="52" rx="46" ry="23" />
      <ellipse class="chain-inner" cx="60" cy="52" rx="34" ry="12" />
      <circle class="gear" cx="28" cy="52" r="14" /><circle class="gear" cx="92" cy="52" r="12" />
      <circle class="hub" cx="28" cy="52" r="4" /><circle class="hub" cx="92" cy="52" r="4" />
    </g>
  {:else if icon === 'crank'}
    <g>
      <circle class="gear" cx="55" cy="50" r="27" />
      <circle class="hub" cx="55" cy="50" r="7" />
      <path class="metal" d="M55 50 85 73" />
      <rect class="rubber" x="82" y="68" width="27" height="10" rx="4" transform="rotate(8 82 68)" />
      <path class="gear-teeth" d="M55 17v8m0 50v8M22 50h8m50 0h8M32 27l6 6m34 34 6 6m0-46-6 6M38 67l-6 6" />
    </g>
  {:else if icon === 'frame'}
    <g>
      <path class="frame" d="M27 76 48 35h25l20 41H27l34-1L48 35m13 40 12-40m-32-8h38" />
      <circle class="joint" cx="27" cy="76" r="5" /><circle class="joint" cx="61" cy="75" r="5" /><circle class="joint" cx="93" cy="76" r="5" />
    </g>
  {:else if icon === 'cycling-helmet'}
    <g>
      <path class="helmet" d="M19 59q1-43 41-43 38 0 41 43Z" />
      <path class="vent" d="M39 28h15m10-6h15m-46 20h17m15-7h21" />
      <path class="dark" d="M18 58h89v11H18Z" />
      <path class="strap" d="M77 69q-1 22 17 22M93 91l8-12" />
      <circle class="buckle" cx="95" cy="91" r="5" />
    </g>
  {:else if icon === 'bicycle'}
    <g>
      <circle class="tyre" cx="27" cy="72" r="20" /><circle class="tyre" cx="94" cy="72" r="20" />
      <circle class="rim" cx="27" cy="72" r="14" /><circle class="rim" cx="94" cy="72" r="14" />
      <path class="frame" d="M27 72 48 39h26l20 33M48 39l16 33H27m37 0 10-33m-17-9h20m-33 9-8-12" />
      <circle class="gear" cx="64" cy="72" r="6" />
      <path class="accent" d="M94 72 79 31h17" />
      <path class="bell" d="M86 31q0-8 8-8t8 8Z" />
    </g>
  {/if}
</svg>

<style>
  .bicycle-workshop-icon{width:100%;height:100%;overflow:visible}.tyre{fill:none;stroke:#263943;stroke-width:8}.tyre--wide{stroke-width:13}.rim{fill:none;stroke:#a9bcc5;stroke-width:3}.hub,.bolt,.joint{fill:#f5b642;stroke:#785a1a;stroke-width:2}.spokes,.metal,.frame,.cable,.sound,.strap,.gear-teeth,.accent,.label-line{fill:none;stroke:#3c5967;stroke-width:4;stroke-linecap:round;stroke-linejoin:round}.frame,.accent{stroke:#e75f62}.rubber,.dark{fill:#33464f}.gear{fill:#f7d66d;stroke:#806926;stroke-width:3}.tread{fill:none;stroke:#d8e3e8;stroke-width:4;stroke-linecap:round}.paper{fill:#fffdf6;stroke:#7b8c94;stroke-width:2}.lever{fill:#e75f62;stroke:#85383a;stroke-width:3}.ringer{fill:none;stroke:#3c5967;stroke-width:3}.ringer-dot,.clapper{fill:#f5b642;stroke:#785a1a;stroke-width:2}.bell{fill:#f5b642;stroke:#785a1a;stroke-width:3}.seat{fill:#576c76;stroke:#263943;stroke-width:3}.chain{fill:none;stroke:#485f69;stroke-width:8;stroke-dasharray:5 5}.chain-inner{fill:none;stroke:#d2dee3;stroke-width:2}.vent{fill:none;stroke:#ffb4a8;stroke-width:5;stroke-linecap:round}.helmet{fill:#e75f62;stroke:#85383a;stroke-width:3}.buckle{fill:#f5b642;stroke:#785a1a;stroke-width:2}@media(prefers-reduced-motion:reduce){.wheel-art,.chain-art{animation:none!important}}
</style>
