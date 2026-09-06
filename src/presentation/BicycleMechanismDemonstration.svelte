<script lang="ts">
  type Mode = 'drive' | 'brake';
  interface MechanismStep { id:string; title:string; text:string; action:string; }
  let { mode = 'drive' }: { mode?: Mode } = $props();
  const bikeUrl = new URL('../ui/bicycleStoryBike.svg', import.meta.url).href;

  const driveSteps: MechanismStep[] = [
    { id:'pedal', title:'PEDAL', text:'Your foot pushes the pedal. The pedal is the small platform at the end of the crank arm.', action:'Push the pedal' },
    { id:'crank', title:'CRANK', text:'The pedal moves around with the crank arm. The crank turns around its centre.', action:'See what moves next' },
    { id:'chain', title:'CHAIN', text:'When the crank turns, the chain moves around the bicycle.', action:'Follow the chain' },
    { id:'rear-wheel', title:'BACK WHEEL', text:'The moving chain turns the back part of the wheel. Now the back wheel turns.', action:'Make the bicycle roll' },
    { id:'roll', title:'BICYCLE ROLLS', text:'The back wheel turns and the bicycle rolls forward. The movement has travelled through the whole system.', action:'Start again' }
  ];
  const brakeSteps: MechanismStep[] = [
    { id:'lever', title:'BRAKE LEVER', text:'Your hand squeezes the brake lever on the handlebar.', action:'Squeeze the lever' },
    { id:'brake', title:'BRAKE', text:'Squeezing the lever makes the brake act on the wheel.', action:'Watch the wheel' },
    { id:'slow', title:'BICYCLE SLOWS', text:'The wheel slows, so the bicycle slows too.', action:'Start again' }
  ];

  const steps = $derived(mode === 'drive' ? driveSteps : brakeSteps);
  let stepIndex = $state(0);
  const current = $derived(steps[stepIndex]);
  const visibleSteps = $derived(steps.slice(0, stepIndex + 1));
  const isLast = $derived(stepIndex === steps.length - 1);
  function advance(): void { stepIndex = isLast ? 0 : stepIndex + 1; }
</script>

<div class="mechanism" data-mechanism-mode={mode} data-mechanism-step={current.id}>
  <div class="mechanism__teaching" aria-live="polite">
    <span class="mechanism__number">{stepIndex + 1}</span>
    <div>
      <small>{mode === 'drive' ? 'FOLLOW THE POWER' : 'FOLLOW THE SLOWING'}</small>
      <strong>{current.title}</strong>
      <p>{current.text}</p>
    </div>
  </div>

  <div class="mechanism__diagram" role="img" aria-label={mode === 'drive' ? 'The same colorful bicycle showing pedal, crank, chain and back wheel movement' : 'The same colorful bicycle showing the brake lever, brake and slowing wheel'}>
    <div class="mechanism__art" class:rolling={mode === 'drive' && current.id === 'roll'}>
      <img class="mechanism__bike" src={bikeUrl} alt="" aria-hidden="true" />
      <svg class="mechanism__overlay" viewBox="0 0 760 420" aria-hidden="true">
        <defs><marker id="mechanism-arrow" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 z" /></marker></defs>

        {#if mode === 'drive'}
          <g class="mechanism-crank" class:active={current.id === 'crank' || current.id === 'pedal'} class:turning={stepIndex >= 1}>
            <circle cx="355" cy="280" r="39"/><line x1="355" y1="280" x2="398" y2="252"/><line x1="355" y1="280" x2="315" y2="307"/>
          </g>
          <g class="mechanism-pedal" class:active={current.id === 'pedal'}><rect x="389" y="243" width="44" height="20" rx="9"/><circle class="focus-halo" cx="410" cy="253" r="27"/></g>
          <g class="mechanism-chain" class:active={current.id === 'chain'} class:moving={stepIndex >= 2}><path d="M218 260 L350 253"/><path d="M218 299 L350 306"/></g>
          <g class="mechanism-wheel" class:active={current.id === 'rear-wheel'} class:spinning={stepIndex >= 3}><circle cx="205" cy="280" r="105"/><line x1="205" y1="171" x2="205" y2="190"/></g>

          <g class="callout" class:active={current.id === 'pedal'}><path d="M412 261 L535 326"/><rect x="528" y="306" width="205" height="48" rx="13"/><text x="546" y="336">PEDAL · foot pushes</text></g>
          <g class="callout" class:active={current.id === 'crank'}><path d="M362 250 L480 186"/><rect x="450" y="145" width="218" height="48" rx="13"/><text x="468" y="175">CRANK · turns around</text></g>
          <g class="callout" class:active={current.id === 'chain'}><path d="M280 294 L244 335"/><rect x="112" y="328" width="190" height="48" rx="13"/><text x="130" y="358">CHAIN · moves</text></g>
          <g class="callout" class:active={current.id === 'rear-wheel'}><path d="M151 198 L103 136"/><rect x="24" y="88" width="205" height="48" rx="13"/><text x="42" y="118">BACK WHEEL · turns</text></g>

          {#if current.id === 'pedal'}
            <path class="action-arrow" d="M428 225 C449 245 448 273 426 290" marker-end="url(#mechanism-arrow)"/>
          {:else if current.id === 'crank'}
            <path class="action-arrow" d="M326 242 A52 52 0 1 1 397 244" marker-end="url(#mechanism-arrow)"/>
          {:else if current.id === 'chain'}
            <path class="action-arrow" d="M337 248 L270 252" marker-end="url(#mechanism-arrow)"/>
          {:else if current.id === 'rear-wheel'}
            <path class="action-arrow" d="M154 188 A102 102 0 0 1 251 184" marker-end="url(#mechanism-arrow)"/>
          {:else}
            <path class="action-arrow roll-arrow" d="M486 385 L650 385" marker-end="url(#mechanism-arrow)"/>
          {/if}
        {:else}
          <g class="mechanism-lever" class:active={current.id === 'lever'}><path d="M526 104 Q548 112 552 126"/><circle class="focus-halo" cx="535" cy="110" r="28"/></g>
          <g class="mechanism-brake" class:active={current.id === 'brake'}><path d="M526 120 C535 145 535 178 520 210"/><circle class="focus-halo" cx="520" cy="210" r="28"/></g>
          <g class="mechanism-wheel" class:active={current.id === 'slow'} class:slowing={current.id === 'slow'}><circle cx="545" cy="280" r="105"/><line x1="545" y1="171" x2="545" y2="190"/></g>
          <g class="callout" class:active={current.id === 'lever'}><path d="M535 111 L648 147"/><rect x="570" y="145" width="168" height="48" rx="13"/><text x="588" y="175">LEVER · squeeze</text></g>
          <g class="callout" class:active={current.id === 'brake'}><path d="M518 209 L625 244"/><rect x="555" y="241" width="183" height="48" rx="13"/><text x="573" y="271">BRAKE · slows wheel</text></g>
          {#if current.id === 'lever'}
            <path class="action-arrow" d="M566 91 C555 103 546 110 538 113" marker-end="url(#mechanism-arrow)"/>
          {:else if current.id === 'brake'}
            <path class="action-arrow" d="M555 155 C536 172 526 191 520 209" marker-end="url(#mechanism-arrow)"/>
          {:else}
            <path class="action-arrow" d="M494 191 A102 102 0 0 1 590 184" marker-end="url(#mechanism-arrow)"/>
          {/if}
        {/if}
      </svg>
    </div>
  </div>

  {#if mode === 'drive'}
    <div class="mechanism__difference" aria-label="Pedal and crank difference"><span><b>PEDAL</b> = where the foot pushes</span><span><b>CRANK</b> = the arm that turns</span></div>
  {/if}
  <div class="mechanism__trace" aria-label="Movement shown so far">
    {#each visibleSteps as item, index}<span class:mechanism__trace--current={index === stepIndex}>{item.title}</span>{#if index < visibleSteps.length - 1}<b aria-hidden="true">→</b>{/if}{/each}
  </div>
  <button class="mechanism__action" type="button" onclick={advance}>{current.action}</button>
</div>

<style>
.mechanism{width:100%;min-height:100%;display:grid;grid-template-rows:auto minmax(210px,1fr) auto auto auto;gap:8px;padding:10px;background:linear-gradient(180deg,#fbfaff,#f7fafc);color:var(--ink)}
.mechanism__teaching{display:grid;grid-template-columns:34px minmax(0,1fr);gap:8px;align-items:start;padding:8px 9px;border-radius:12px;background:#fff;border:1px solid #6358dc20}.mechanism__number{width:31px;height:31px;display:grid;place-items:center;border-radius:50%;background:var(--accent);color:#fff;font-weight:950}.mechanism__teaching small{display:block;color:var(--accent);font-size:.58rem;font-weight:900;letter-spacing:.06em}.mechanism__teaching strong{display:block;margin-top:2px;font-size:.9rem}.mechanism__teaching p{margin:3px 0 0;font-size:.72rem;font-weight:720;line-height:1.3;color:var(--muted)}
.mechanism__diagram{min-height:210px;display:grid;place-items:center;overflow:hidden;border-radius:16px;background:linear-gradient(#eef8ff 0 62%,#f8f2de 62%)}.mechanism__art{position:relative;width:min(100%,760px);aspect-ratio:760/420}.mechanism__bike,.mechanism__overlay{position:absolute;inset:0;width:100%;height:100%}
.mechanism-crank circle,.mechanism-crank line,.mechanism-pedal rect,.mechanism-chain path,.mechanism-wheel circle,.mechanism-wheel line,.mechanism-lever path,.mechanism-brake path{fill:none;stroke:#6358dc;stroke-width:6;stroke-linecap:round;opacity:.2}.mechanism-chain path{stroke-dasharray:9 7}.mechanism-wheel circle{stroke-width:7}.mechanism-pedal rect{fill:#f3f0ff}.focus-halo{fill:#ffd34e35!important;stroke:#ffd34e!important;stroke-width:5!important;opacity:0}.active circle,.active line,.active rect,.active path{opacity:1}.active .focus-halo{opacity:1}.mechanism-chain.active path{stroke-width:9}.mechanism-wheel.active circle{stroke-width:11}.mechanism-lever.active path,.mechanism-brake.active path{stroke-width:9}
.callout path{fill:none;stroke:#a3adb6;stroke-width:2.5}.callout rect{fill:#fff;stroke:#c8d0d6;stroke-width:2}.callout text{fill:#596874;font-size:16px;font-weight:850}.callout.active path,.callout.active rect{stroke:var(--accent)}.callout.active rect{fill:#f3f0ff}.callout.active text{fill:#3f36a8}.action-arrow{fill:none;stroke:var(--accent);stroke-width:5;stroke-linecap:round;stroke-dasharray:9 7}.mechanism :global(#mechanism-arrow path){fill:var(--accent)}
.mechanism__difference{display:grid;grid-template-columns:1fr 1fr;gap:6px}.mechanism__difference span{padding:6px 7px;border:1px solid #24303a16;border-radius:9px;background:#fff;font-size:.66rem;font-weight:720}.mechanism__difference b{color:#3f36a8}.mechanism__trace{min-height:27px;display:flex;align-items:center;gap:4px;overflow-x:auto}.mechanism__trace span{flex:0 0 auto;padding:5px 7px;border-radius:999px;background:#eef1f3;color:#5a6872;font-size:.58rem;font-weight:900}.mechanism__trace .mechanism__trace--current{background:#f3f0ff;color:#3f36a8;border:1px solid #6358dc33}.mechanism__trace b{font-size:.68rem;color:#909ba3}.mechanism__action{min-height:44px;border:0;border-radius:11px;background:var(--accent);color:#fff;font:inherit;font-size:.76rem;font-weight:900;cursor:pointer}
.mechanism-crank.turning{transform-box:view-box;transform-origin:355px 280px;animation:crank-turn 1.8s linear infinite}.mechanism-chain.moving path{opacity:.8;animation:chain-travel .7s linear infinite}.mechanism-wheel.spinning{transform-box:view-box;transform-origin:205px 280px;animation:wheel-turn 1.25s linear infinite}.mechanism-wheel.slowing{transform-box:view-box;transform-origin:545px 280px;animation:wheel-slow 2.2s ease-out infinite}.mechanism__art.rolling{animation:bike-nudge 1.4s ease-in-out infinite alternate}.roll-arrow{animation:chain-travel .7s linear infinite}
@keyframes crank-turn{to{transform:rotate(360deg)}}@keyframes chain-travel{to{stroke-dashoffset:-32}}@keyframes wheel-turn{to{transform:rotate(360deg)}}@keyframes wheel-slow{0%{transform:rotate(0)}60%{transform:rotate(210deg)}100%{transform:rotate(250deg)}}@keyframes bike-nudge{to{transform:translateX(7px)}}
@media(max-width:650px){.mechanism{grid-template-rows:auto minmax(190px,1fr) auto auto auto;padding:7px;gap:6px}.mechanism__teaching{padding:6px 7px}.mechanism__teaching p{font-size:.68rem}.mechanism__diagram{min-height:190px}.mechanism__difference span{font-size:.61rem}.callout text{font-size:15px}}
@media(prefers-reduced-motion:reduce){.mechanism-crank.turning,.mechanism-chain.moving path,.mechanism-wheel.spinning,.mechanism-wheel.slowing,.mechanism__art.rolling,.roll-arrow{animation:none}.action-arrow{stroke-dasharray:none}}
</style>
