<script lang="ts">
  import StoryCharacter from './StoryCharacter.svelte';
  let { icon }: { icon: string } = $props();
  // Named visual states, not a process model: order and wording remain source-owned.
  let day = $derived(icon === 'day-sunrise' || icon === 'day-noon' || icon === 'day-sunset' || icon === 'day-midnight');
  let lion = $derived(icon === 'lion-cub' || icon === 'lion-subadult' || icon === 'lion-adult');
  let water = $derived(icon === 'water-ice' || icon === 'water-liquid');
  let plant = $derived(icon === 'plant-seed' || icon === 'plant-sprout' || icon === 'plant-young');
  let visit = $derived(icon === 'visit-arrive' || icon === 'visit-look' || icon === 'visit-draw' || icon === 'visit-leave');
  let night = $derived(icon === 'day-midnight');
  let evening = $derived(icon === 'day-sunset');
  let cub = $derived(icon === 'lion-cub');
  let adult = $derived(icon === 'lion-adult');
  let sky = $derived(night ? '#233b61' : evening ? '#eed0cb' : icon === 'day-sunrise' ? '#fae7b7' : '#dceff1');
</script>

{#snippet cloud(x: number, y: number, scale = 1)}
  <g transform={`translate(${x} ${y}) scale(${scale})`} fill="white" opacity=".75">
    <path d="M0 12C-2 4 8 0 15 4C18-8 36-8 41 3C52-2 65 5 62 14H0Z" />
  </g>
{/snippet}
{#snippet grasses()}
  <g fill="none" stroke="#a3ab6b" stroke-width="2" stroke-linecap="round">
    <path d="m25 175-3-7m3 7 5-6m238 6-3-8m3 8 6-5m-43 11-2-6m2 6 4-4" />
  </g>
{/snippet}
{#snippet truck(x: number, y: number, scale = 1, drawing = false)}
  <g transform={`translate(${x} ${y}) scale(${scale})`} stroke={drawing ? '#617989' : '#744b42'} stroke-width="2.8" stroke-linejoin="round">
    <rect x="0" y="23" width="89" height="45" rx="7" fill={drawing ? '#fffdf6' : '#d97057'} />
    <path d="M89 29h28l20 20v19H89Z" fill={drawing ? '#fffdf6' : '#e58968'} />
    <path d="M98 36h14l13 15H98Z" fill={drawing ? '#fffdf6' : '#cce8e4'} />
    <path d="M11 16h91m-89-7h90M20 9v7m15-7v7m15-7v7m15-7v7m15-7v7" fill="none" stroke={drawing ? '#617989' : '#586b76'} stroke-width="4" stroke-linecap="round" />
    <rect x="104" y="19" width="13" height="7" rx="3" fill={drawing ? '#fffdf6' : '#eebc61'} />
    <rect x="10" y="34" width="30" height="21" rx="3" fill={drawing ? '#fffdf6' : '#f4debb'} />
    <path d="M17 39h16m-16 6h16m-16 6h16" stroke-width="2" />
    <circle cx="65" cy="46" r="13" fill={drawing ? '#fffdf6' : '#f6ddb7'} />
    <circle cx="65" cy="46" r="7" fill="none" />
    <path d="M0 61h137" stroke={drawing ? '#617989' : '#fbe8bc'} stroke-width="5" />
    <circle cx="25" cy="69" r="13" fill={drawing ? '#fffdf6' : '#435660'} /><circle cx="111" cy="69" r="13" fill={drawing ? '#fffdf6' : '#435660'} />
    <circle cx="25" cy="69" r="5" fill="#eff1e5"/><circle cx="111" cy="69" r="5" fill="#eff1e5"/>
  </g>
{/snippet}
{#snippet grownUp(x: number, y: number, firefighter = false)}
  <g transform={`translate(${x} ${y})`} stroke="#6d6154" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
    <path d="M-9 46-3 77M9 46l5 31" fill="none" stroke="#536b79" stroke-width="12" />
    <path d="M-8 82H2m7 0h11" stroke="#4e5358" stroke-width="7" />
    <path d="M-14 18Q0 10 14 18l3 34h-34Z" fill={firefighter ? '#ccae64' : '#76978b'} />
    <path d="m-14 22-8 22m37-23 14 11" fill="none" stroke={firefighter ? '#ccae64' : '#76978b'} stroke-width="9" />
    <circle cy="2" r="13" fill="#d9a97e" />
    <path d="M-13 1q-2-18 13-18T13 1l-5-8q-12 8-21 4" fill="#554b43" />
    {#if firefighter}<path d="M-15-5q0-17 15-17T15-5m-34 2h38" fill="#e1c276" stroke="#8b754d" stroke-width="4" />{/if}
    <path d="M-4 7q4 3 8 0" fill="none" /><circle cx="-5" cy="1" r="1" fill="#54473d"/><circle cx="5" cy="1" r="1" fill="#54473d"/>
  </g>
{/snippet}

{#if day || lion || water || plant || visit}
  <span class="studio-scene" data-studio-scene={icon}>
    <svg viewBox="0 0 320 200" aria-hidden="true" focusable="false">
      <rect x="1" y="1" width="318" height="198" rx="22" fill={day ? sky : water ? '#e5f0ed' : plant ? '#e7f0df' : lion ? '#f4e8c8' : '#e7eee4'} />
      {#if day}
        {#if night}
          <g fill="#f7e9be"><circle cx="43" cy="35" r="2"/><circle cx="108" cy="23" r="1.8"/><circle cx="193" cy="39" r="2"/><circle cx="273" cy="28" r="1.5"/><circle cx="228" cy="72" r="1.6"/><path d="m72 67 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z"/></g>
        {:else}
          {@render cloud(34, 39, .85)}{@render cloud(230, 63, .65)}
          <circle cx={icon === 'day-noon' ? 158 : evening ? 245 : 74} cy={icon === 'day-noon' ? 48 : 121} r="25" fill={evening ? '#de906e' : '#efbc58'} />
          {#if icon === 'day-noon'}<circle cx="158" cy="48" r="33" fill="none" stroke="#efbc58" stroke-width="2" stroke-dasharray="2 9" />{/if}
        {/if}
        <path d="M8 131q59-32 118-10 65-36 186 6v63H8Z" fill={night ? '#3d5d67' : evening ? '#c3b091' : '#bdca94'} />
        <path d="M5 153q70-29 153-4 78-14 157 4v25q0 19-20 19H24q-19 0-19-19Z" fill={night ? '#527065' : '#9baa76'} />
        <path d="M146 193q39-25 48-49" fill="none" stroke={night ? '#8c9a80' : '#e7dcb4'} stroke-width="16" />
        <g stroke={night ? '#324953' : '#7e8461'} stroke-width="3" stroke-linejoin="round">
          <path d="M229 138v-40"/><path d="M195 105q1-16 19-16 4-23 28-10 18-6 24 13 10 2 10 13Z" fill={night ? '#516b70' : '#86a185'} />
          <path d="M45 155v-29h38v29" fill={night ? '#819186' : '#f7e4bd'} /><path d="m39 128 25-21 25 21Z" fill={night ? '#697c7c' : '#bb8470'} /><rect x="58" y="139" width="12" height="16" rx="2" fill={night ? '#dbc17e' : '#a4bab0'} />
        </g>
        {#if icon === 'day-sunrise' || evening}
          <path d={evening ? 'M272 83v21m-6-6 6 6 6-6' : 'M46 104V83m-6 6 6-6 6 6'} fill="none" stroke="#7f6557" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
        {/if}
      {:else if lion}
        {@render cloud(36, 34, .8)}
        <path d="M12 147q65-27 130-8 89-20 168 10v29q0 18-21 18H31q-19 0-19-18Z" fill="#d4ce94" />
        <path d="M252 141v-35m0 17-17-14m17 7 12-14" stroke="#8e845c" stroke-width="4" fill="none" stroke-linecap="round" />
        <path d="M224 105q-5-14 13-14 6-17 23-7 14-6 21 7 16 0 15 14Z" fill="#a7b08a" />
        <path d="M254 178q2-17 18-17 20-6 27 17Z" fill="#b8b49e" stroke="#8b9379" stroke-width="2" />
        <ellipse cx="147" cy="175" rx={adult ? 94 : cub ? 53 : 74} ry="8" fill="#8b9566" opacity=".2" />
        <g transform={`translate(${cub ? 83 : adult ? 48 : 63} ${cub ? 69 : adult ? 28 : 48}) scale(${cub ? .69 : adult ? 1 : .86})`} stroke="#927249" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <path class="scene-tail" d="M162 82q37-29 31-53" fill="none" stroke="#cca363" stroke-width="8" /><path d="m193 27-2-11 7 7" fill="#93734b" />
          <path d="m75 99-9 40h24l10-36m48-4 6 40h24l-4-47" fill="#cfa969" />
          <ellipse cx="125" cy="88" rx={cub ? 53 : 69} ry={cub ? 34 : 39} fill="#d9b576" />
          <path d="M67 96v47h26l4-41m39-5 7 46h25l-11-48" fill="#e5c28a" />
          <path d="M66 143h28m49 0h26" stroke="#a88252" />
          <g transform={cub ? 'translate(-7 -10) scale(1.12)' : undefined}>
            <circle cx="39" cy="39" r="14" fill="#dab475"/><circle cx="88" cy="35" r="14" fill="#dab475"/>
            <circle cx="39" cy="39" r="7" fill="#c79770" stroke="none"/><circle cx="88" cy="35" r="7" fill="#c79770" stroke="none"/>
            <path d="M29 53q0-30 38-28 35 0 35 35 0 40-38 39-38-2-35-46Z" fill="#e5bf7e" />
            <ellipse cx="56" cy="72" rx="16" ry="12" fill="#f2ddb6" stroke="none"/><ellipse cx="79" cy="72" rx="16" ry="12" fill="#f2ddb6" stroke="none"/>
            <path d="m59 64 9 6 9-7Z" fill="#735744" stroke="#735744"/><path d="M68 71v7m0 0q-7 6-14 0m14 0q7 6 14 0" fill="none" stroke-width="2" />
            <ellipse cx="48" cy="54" rx="3.5" ry="4.5" fill="#493f34" stroke="none"/><ellipse cx="83" cy="53" rx="3.5" ry="4.5" fill="#493f34" stroke="none"/>
            <circle cx="49" cy="52" r="1.2" fill="white" stroke="none"/><circle cx="84" cy="51" r="1.2" fill="white" stroke="none"/>
            <path d="m39 74-11-2m12 7-11 2m58-8 12-3m-11 9 12 1" fill="none" stroke-width="1.5"/>
          </g>
          {#if cub}<g fill="#b68b56" stroke="none" opacity=".55"><circle cx="113" cy="72" r="3"/><circle cx="137" cy="76" r="3"/><circle cx="126" cy="91" r="3"/><circle cx="152" cy="91" r="3"/></g>{/if}
        </g>
        {@render grasses()}
      {:else if water}
        <circle cx="160" cy="88" r="67" fill="#f6f5df"/><ellipse cx="160" cy="175" rx="102" ry="10" fill="#b1c9bd" opacity=".45" />
        <path d="M73 87h174l-13 67q-5 19-27 19H113q-22 0-27-19Z" fill="#f5fbf5" stroke="#6f9b9b" stroke-width="3" stroke-linejoin="round" />
        {#if icon === 'water-ice'}
          <g class="scene-settle" stroke="#659da9" stroke-width="2.5" stroke-linejoin="round">
            <path d="m112 101 31-13 30 19-7 43-37 6-22-20Z" fill="#afd9df"/><path d="m112 101 21 19 40-13m-40 13-4 36" fill="none"/>
            <path d="m174 105 30-10 23 20-11 40-40-4-12-26Z" fill="#c8e8e6"/><path d="m174 105 22 20 31-10m-31 10-20 26" fill="none"/>
            <path d="m125 104 13-5m42 10 12-4" stroke="#f8ffff" stroke-width="4" stroke-linecap="round"/>
          </g>
        {:else}
          <path d="M85 120q27-8 51 0t49 0 50 0l-5 30q-4 18-25 18h-90q-22 0-26-18Z" fill="#8cc9d1" />
          <path class="scene-ripple" d="M96 122q24-5 43 0m30 0q27 5 55-1m-111 18h28m24 12h33" fill="none" stroke="#d9f0ed" stroke-width="3" stroke-linecap="round" />
        {/if}
        <path d="M73 87h174M91 95l8 51" fill="none" stroke="#6f9b9b" stroke-width="3" stroke-linecap="round"/>
        <path d="M103 154l3 5" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
      {:else if plant}
        {@render cloud(30, 36, .8)}{@render cloud(237, 39, .65)}
        <path d="M11 127q72-12 142 0 70-12 156 0v51q0 18-20 18H31q-20 0-20-18Z" fill="#b58e68" />
        <path d="M11 128q72-12 142 0 70-12 156 0" fill="none" stroke="#8a9b64" stroke-width="8" />
        <g fill="#d2b492"><ellipse cx="66" cy="158" rx="6" ry="3"/><ellipse cx="263" cy="177" rx="5" ry="3"/><circle cx="231" cy="144" r="3"/><circle cx="109" cy="182" r="2"/><circle cx="37" cy="183" r="2"/></g>
        <ellipse cx="160" cy="145" rx="12" ry="8" fill="#8d653f" stroke="#6e5138" stroke-width="2" transform="rotate(-25 160 145)" />
        {#if icon !== 'plant-seed'}
          <g stroke-linecap="round" stroke-linejoin="round">
            <path d={icon === 'plant-young' ? 'M160 139v44m0-21-18 11m18-4 22 14m-22-31 14 8' : 'M160 147v26m0-14-9 7m9-2 10 7'} fill="none" stroke="#f2d4a5" stroke-width="3" />
            <path d={icon === 'plant-young' ? 'M160 142V54' : 'M160 142V97'} fill="none" stroke="#698c50" stroke-width="6" />
            <g class="scene-leaves" fill="#86ac68" stroke="#597f48" stroke-width="2.5">
              <path d={icon === 'plant-young' ? 'M158 85q-37-1-42-29 30-5 42 23Z' : 'M158 113q-23-1-28-20 22-4 28 15Z'} />
              <path d={icon === 'plant-young' ? 'M162 72q16-28 46-21-8 29-46 27Z' : 'M162 103q12-21 34-16-5 23-34 22Z'} fill="#a1bf76" />
              {#if icon === 'plant-young'}<path d="M158 113q-30 0-33-21 24-4 33 15Zm4-13q18-20 40-12-8 22-40 19Z" />{/if}
            </g>
          </g>
        {/if}
      {:else if visit}
        {@render cloud(27, 28, .75)}
        <path d="M11 160q111-23 298 0v18q0 18-20 18H31q-20 0-20-18Z" fill="#cecbaa" />
        <g stroke="#9b8875" stroke-width="2.5" stroke-linejoin="round">
          <path d="M167 160V55h128v105" fill="#ead6b8"/><path d="m160 57 9-19h125l9 19Z" fill="#cc8b74"/>
          <rect x="203" y="92" width="74" height="68" rx="9" fill="#acb6a9"/><path d="M207 104h66m-66 12h66m-66 12h66" fill="none" stroke="#84978f" />
          <rect x="176" y="73" width="17" height="29" rx="3" fill="#b5d5ce"/><path d="M180 120h10v40h-10Z" fill="#f4e7cd"/>
        </g>
        {#if icon === 'visit-arrive'}
          <path d="M114 191q8-22 54-28" fill="none" stroke="#eee7ce" stroke-width="17" />
          {@render grownUp(103, 91)}
        {:else if icon === 'visit-look'}
          {@render truck(164, 105, .96)}{@render grownUp(128, 75, true)}{@render grownUp(91, 95)}
        {:else if icon === 'visit-draw'}
          {@render truck(228, 109, .5)}{@render grownUp(103, 91)}
          <g transform="translate(143 73) rotate(-5 65 55)" stroke="#9a866c" stroke-width="2.5" stroke-linejoin="round">
            <rect width="138" height="103" rx="8" fill="#fffdf1"/><path d="M13 4v95" stroke="#d2bd9d"/>
            <path d="M6 16h13M6 33h13M6 50h13M6 67h13M6 84h13" stroke="#8b9f9a" stroke-width="4" stroke-linecap="round"/>
            {@render truck(27, 19, .7, true)}
            <path d="m103 5 14-21 6 4-14 21-9 7Z" fill="#e9bd61"/><path d="m100 16 5-3" stroke="#62656a"/>
          </g>
        {:else}
          {@render grownUp(108, 91)}
          <g transform="translate(133 91)" fill="#eedbc0" stroke="#8a7661" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M0 21V4q1-5 4 0V-1q3-4 5 1v-2q4-3 5 2v7q4-6 7-2l-4 16q-2 11-9 11Z"/><path class="scene-greeting" d="m-8 2-3-5m32 1 4-4m-17-7v-5" fill="none"/></g>
        {/if}
      {/if}
    </svg>
    {#if visit}
      <span class="studio-scene__hero" aria-hidden="true"><StoryCharacter character="dheu" motion="idle" pose={icon === 'visit-draw' ? 'inspect' : 'neutral'} expression="curious" /></span>
    {/if}
  </span>
{/if}

<style>
  .studio-scene{display:block;position:relative;width:100%;height:100%;min-width:0;min-height:0;isolation:isolate;pointer-events:none}
  .studio-scene>svg{display:block;width:100%;height:100%;overflow:visible}
  .studio-scene__hero{position:absolute;left:5%;bottom:8%;width:22%;height:61%;display:block}
  .studio-scene__hero :global(svg){width:100%;height:100%;display:block}
  .studio-scene__hero :global(*){animation:none!important;transition:none!important}
  .scene-tail{transform-origin:162px 82px;animation:tail-settle 1.5s ease-out 1}
  .scene-leaves{transform-origin:160px 128px;animation:leaf-settle 1.5s ease-out 1}
  .scene-greeting{animation:ink-arrive .7s ease-out 1}
  .scene-ripple{animation:ink-arrive 1.2s ease-out 1}
  .scene-settle{animation:ink-arrive .7s ease-out 1}
  @keyframes tail-settle{0%{transform:rotate(-5deg)}60%{transform:rotate(2deg)}100%{transform:rotate(0)}}
  @keyframes leaf-settle{0%{transform:rotate(-2deg)}60%{transform:rotate(1deg)}100%{transform:rotate(0)}}
  @keyframes ink-arrive{from{opacity:.65}to{opacity:1}}
  @media(prefers-reduced-motion:reduce){.studio-scene :global(*){animation:none!important;transition:none!important}}
  @media(forced-colors:active){.studio-scene{forced-color-adjust:none}}
</style>
