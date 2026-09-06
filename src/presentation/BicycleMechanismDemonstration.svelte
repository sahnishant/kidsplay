<script lang="ts">
  type Mode = 'drive' | 'brake';

  interface MechanismStep {
    id: string;
    title: string;
    text: string;
    action: string;
  }

  let { mode = 'drive' }: { mode?: Mode } = $props();

  const driveSteps: MechanismStep[] = [
    {
      id: 'pedal',
      title: 'PEDAL',
      text: 'Your foot pushes the pedal. The pedal is the small platform at the end of the crank arm.',
      action: 'Push the pedal'
    },
    {
      id: 'crank',
      title: 'CRANK',
      text: 'The pedal moves around with the crank arm. The crank turns around its centre.',
      action: 'See what moves next'
    },
    {
      id: 'chain',
      title: 'CHAIN',
      text: 'When the crank turns, the chain moves around the bicycle.',
      action: 'Follow the chain'
    },
    {
      id: 'rear-wheel',
      title: 'BACK WHEEL',
      text: 'The moving chain turns the back part of the wheel. Now the back wheel turns.',
      action: 'Make the bicycle roll'
    },
    {
      id: 'roll',
      title: 'BICYCLE ROLLS',
      text: 'The back wheel turns and the bicycle rolls forward. The movement has travelled through the whole system.',
      action: 'Start again'
    }
  ];

  const brakeSteps: MechanismStep[] = [
    {
      id: 'lever',
      title: 'BRAKE LEVER',
      text: 'Your hand squeezes the brake lever on the handlebar.',
      action: 'Squeeze the lever'
    },
    {
      id: 'brake',
      title: 'BRAKE',
      text: 'Squeezing the lever makes the brake act on the wheel.',
      action: 'Watch the wheel'
    },
    {
      id: 'slow',
      title: 'BICYCLE SLOWS',
      text: 'The wheel slows, so the bicycle slows too.',
      action: 'Start again'
    }
  ];

  const steps = $derived(mode === 'drive' ? driveSteps : brakeSteps);
  let stepIndex = $state(0);
  const current = $derived(steps[stepIndex]);
  const visibleSteps = $derived(steps.slice(0, stepIndex + 1));
  const isLast = $derived(stepIndex === steps.length - 1);

  function advance(): void {
    if (isLast) {
      stepIndex = 0;
      return;
    }
    stepIndex += 1;
  }
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

  <div class="mechanism__diagram">
    <svg viewBox="0 0 520 330" role="img" aria-label={mode === 'drive' ? 'Side-view bicycle diagram showing pedal, crank, chain and back wheel' : 'Side-view bicycle diagram showing the brake lever, brake and slowing wheel'}>
      <defs>
        <marker id="mechanism-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7 z" />
        </marker>
      </defs>

      <line class="ground" x1="32" y1="292" x2="490" y2="292" />

      <g class="bike" class:rolling={mode === 'drive' && stepIndex >= 4}>
        <g class="wheel rear" class:active={mode === 'drive' && current.id === 'rear-wheel'} class:spinning={mode === 'drive' && stepIndex >= 3} class:slowing={mode === 'brake' && current.id === 'brake'}>
          <circle cx="126" cy="230" r="72" />
          <line x1="126" y1="158" x2="126" y2="302" />
          <line x1="54" y1="230" x2="198" y2="230" />
          <line x1="76" y1="180" x2="176" y2="280" />
          <line x1="176" y1="180" x2="76" y2="280" />
        </g>
        <g class="wheel front">
          <circle cx="402" cy="230" r="72" />
          <line x1="402" y1="158" x2="402" y2="302" />
          <line x1="330" y1="230" x2="474" y2="230" />
          <line x1="352" y1="180" x2="452" y2="280" />
          <line x1="452" y1="180" x2="352" y2="280" />
        </g>

        <g class="frame">
          <line x1="126" y1="230" x2="260" y2="230" />
          <line x1="126" y1="230" x2="226" y2="116" />
          <line x1="226" y1="116" x2="260" y2="230" />
          <line x1="226" y1="116" x2="334" y2="126" />
          <line x1="334" y1="126" x2="260" y2="230" />
          <line x1="334" y1="126" x2="402" y2="230" />
          <line x1="344" y1="108" x2="402" y2="230" />
          <line x1="216" y1="104" x2="246" y2="104" />
          <line x1="334" y1="126" x2="354" y2="88" />
          <line x1="347" y1="88" x2="383" y2="88" />
        </g>

        <g class="chain" class:active={mode === 'drive' && current.id === 'chain'} class:moving={mode === 'drive' && stepIndex >= 2}>
          <path d="M154 211 L231 201" />
          <path d="M154 247 L231 259" />
          <circle cx="146" cy="230" r="17" />
          <circle cx="260" cy="230" r="31" />
        </g>

        <g class="crank" class:active={mode === 'drive' && current.id === 'crank'} class:turning={mode === 'drive' && stepIndex >= 1}>
          <circle cx="260" cy="230" r="7" />
          <line x1="260" y1="230" x2="294" y2="260" />
          <g class="pedal" class:active={mode === 'drive' && current.id === 'pedal'}>
            <line x1="294" y1="260" x2="309" y2="260" />
            <rect x="305" y="254" width="30" height="12" rx="5" />
          </g>
          <line x1="260" y1="230" x2="226" y2="200" />
          <rect x="191" y="194" width="30" height="12" rx="5" />
        </g>

        <g class="brake-system" class:active={mode === 'brake' && current.id === 'brake'}>
          <path d="M366 92 C320 105 264 130 180 168" />
          <path d="M165 168 L176 179" />
          <path d="M177 168 L166 179" />
        </g>

        <g class="brake-lever" class:active={mode === 'brake' && current.id === 'lever'}>
          <line x1="367" y1="91" x2="390" y2="104" />
          <path d="M386 103 Q395 116 383 127" />
        </g>
      </g>

      {#if mode === 'drive'}
        <g class="callout pedal-callout" class:active={current.id === 'pedal'}>
          <path d="M335 270 L376 296" />
          <rect x="375" y="280" width="119" height="36" rx="10" />
          <text x="386" y="303">PEDAL · foot pushes</text>
        </g>
        <g class="callout crank-callout" class:active={current.id === 'crank'}>
          <path d="M270 206 L300 164" />
          <rect x="282" y="130" width="120" height="40" rx="10" />
          <text x="294" y="155">CRANK · turns around</text>
        </g>
        <g class="callout chain-callout" class:active={current.id === 'chain'}>
          <path d="M205 249 L196 278" />
          <rect x="142" y="278" width="116" height="36" rx="10" />
          <text x="154" y="301">CHAIN · moves</text>
        </g>
        <g class="callout wheel-callout" class:active={current.id === 'rear-wheel'}>
          <path d="M91 170 L62 132" />
          <rect x="16" y="94" width="135" height="40" rx="10" />
          <text x="28" y="119">BACK WHEEL · turns</text>
        </g>
        {#if current.id === 'pedal'}
          <path class="action-arrow" d="M326 212 C340 228 341 245 326 256" marker-end="url(#mechanism-arrow)" />
        {:else if current.id === 'crank'}
          <path class="action-arrow" d="M241 203 A39 39 0 1 1 288 206" marker-end="url(#mechanism-arrow)" />
        {:else if current.id === 'chain'}
          <path class="action-arrow" d="M222 198 L180 204" marker-end="url(#mechanism-arrow)" />
        {:else if current.id === 'rear-wheel'}
          <path class="action-arrow" d="M82 177 A66 66 0 0 1 161 168" marker-end="url(#mechanism-arrow)" />
        {:else}
          <path class="action-arrow" d="M357 70 L432 70" marker-end="url(#mechanism-arrow)" />
        {/if}
      {:else}
        <g class="callout lever-callout" class:active={current.id === 'lever'}>
          <path d="M385 107 L427 132" />
          <rect x="386" y="132" width="116" height="40" rx="10" />
          <text x="398" y="157">LEVER · squeeze</text>
        </g>
        <g class="callout brake-callout" class:active={current.id === 'brake'}>
          <path d="M171 174 L152 132" />
          <rect x="76" y="94" width="130" height="40" rx="10" />
          <text x="88" y="119">BRAKE · slows wheel</text>
        </g>
        {#if current.id === 'lever'}
          <path class="action-arrow" d="M414 96 C406 106 397 112 388 115" marker-end="url(#mechanism-arrow)" />
        {:else if current.id === 'brake'}
          <path class="action-arrow" d="M188 147 C177 157 171 165 170 174" marker-end="url(#mechanism-arrow)" />
        {:else}
          <path class="action-arrow" d="M82 177 A66 66 0 0 1 156 168" marker-end="url(#mechanism-arrow)" />
        {/if}
      {/if}
    </svg>
  </div>

  {#if mode === 'drive'}
    <div class="mechanism__difference" aria-label="Pedal and crank difference">
      <span><b>PEDAL</b> = where the foot pushes</span>
      <span><b>CRANK</b> = the arm that turns</span>
    </div>
  {/if}

  <div class="mechanism__trace" aria-label="Movement shown so far">
    {#each visibleSteps as item, index}
      <span class:mechanism__trace--current={index === stepIndex}>{item.title}</span>
      {#if index < visibleSteps.length - 1}<b aria-hidden="true">→</b>{/if}
    {/each}
  </div>

  <button class="mechanism__action" type="button" onclick={advance}>{current.action}</button>
</div>

<style>
  .mechanism{width:100%;min-height:100%;display:grid;grid-template-rows:auto minmax(210px,1fr) auto auto auto;gap:8px;padding:10px;background:linear-gradient(180deg,#fbfaff 0%,#f7fafc 100%);color:var(--ink)}
  .mechanism__teaching{display:grid;grid-template-columns:34px minmax(0,1fr);gap:8px;align-items:start;padding:8px 9px;border-radius:12px;background:#fff;border:1px solid #6358dc20}.mechanism__number{width:31px;height:31px;display:grid;place-items:center;border-radius:50%;background:var(--accent);color:#fff;font-weight:950}.mechanism__teaching small{display:block;color:var(--accent);font-size:.58rem;font-weight:900;letter-spacing:.06em}.mechanism__teaching strong{display:block;margin-top:2px;font-size:.9rem}.mechanism__teaching p{margin:3px 0 0;font-size:.72rem;font-weight:720;line-height:1.3;color:var(--muted)}
  .mechanism__diagram{min-height:210px;display:grid;place-items:center}.mechanism svg{width:100%;height:100%;max-height:390px;overflow:visible}.ground{stroke:#aeb8c1;stroke-width:3;stroke-linecap:round}.frame line{stroke:#596874;stroke-width:8;stroke-linecap:round}.wheel circle,.wheel line{fill:none;stroke:#475967}.wheel circle{stroke-width:7}.wheel line{stroke-width:2;opacity:.42}.chain path,.chain circle{fill:none;stroke:#6e7c86;stroke-width:5}.chain path{stroke-dasharray:7 5}.crank circle,.crank line,.crank rect{fill:#fff;stroke:#52626e;stroke-width:5}.crank rect{stroke-width:4}.brake-system path,.brake-lever line,.brake-lever path{fill:none;stroke:#7a858e;stroke-width:5;stroke-linecap:round}.brake-system path:first-child{stroke-width:2;stroke-dasharray:5 4}
  .active circle,.active line,.active rect,.active path{stroke:var(--accent)}.pedal.active rect{fill:#f3f0ff;stroke:var(--accent)}.chain.active path{stroke-width:8}.wheel.active circle{stroke-width:10}.brake-system.active path:not(:first-child){stroke-width:8}.brake-lever.active path{stroke-width:8}
  .callout path{fill:none;stroke:#a3adb6;stroke-width:2}.callout rect{fill:#fff;stroke:#c8d0d6;stroke-width:1.5}.callout text{fill:#596874;font-size:12px;font-weight:850}.callout.active path,.callout.active rect{stroke:var(--accent)}.callout.active rect{fill:#f3f0ff}.callout.active text{fill:#3f36a8}.action-arrow{fill:none;stroke:var(--accent);stroke-width:4;stroke-linecap:round;stroke-dasharray:7 5}.mechanism :global(#mechanism-arrow path){fill:var(--accent)}
  .mechanism__difference{display:grid;grid-template-columns:1fr 1fr;gap:6px}.mechanism__difference span{padding:6px 7px;border:1px solid #24303a16;border-radius:9px;background:#fff;font-size:.66rem;font-weight:720}.mechanism__difference b{color:#3f36a8}
  .mechanism__trace{min-height:27px;display:flex;align-items:center;gap:4px;overflow-x:auto;padding-bottom:1px}.mechanism__trace span{flex:0 0 auto;padding:5px 7px;border-radius:999px;background:#eef1f3;color:#5a6872;font-size:.58rem;font-weight:900}.mechanism__trace .mechanism__trace--current{background:#f3f0ff;color:#3f36a8;border:1px solid #6358dc33}.mechanism__trace b{font-size:.68rem;color:#909ba3}.mechanism__action{min-height:44px;border:0;border-radius:11px;background:var(--accent);color:#fff;font:inherit;font-size:.76rem;font-weight:900;cursor:pointer}
  .crank.turning{transform-box:view-box;transform-origin:260px 230px;animation:crank-turn 1.8s linear infinite}.chain.moving path{animation:chain-travel .7s linear infinite}.wheel.spinning{transform-box:view-box;transform-origin:126px 230px;animation:wheel-turn 1.25s linear infinite}.wheel.slowing{transform-box:view-box;transform-origin:126px 230px;animation:wheel-slow 2.2s ease-out infinite}.bike.rolling{animation:bike-nudge 1.4s ease-in-out infinite alternate}
  @keyframes crank-turn{to{transform:rotate(360deg)}}@keyframes chain-travel{to{stroke-dashoffset:-24}}@keyframes wheel-turn{to{transform:rotate(360deg)}}@keyframes wheel-slow{0%{transform:rotate(0)}60%{transform:rotate(210deg)}100%{transform:rotate(250deg)}}@keyframes bike-nudge{to{transform:translateX(7px)}}
  @media(max-width:650px){.mechanism{grid-template-rows:auto minmax(190px,1fr) auto auto auto;padding:7px;gap:6px}.mechanism__teaching{padding:6px 7px}.mechanism__teaching p{font-size:.68rem}.mechanism__diagram{min-height:190px}.mechanism__difference span{font-size:.61rem}.callout text{font-size:11px}}
  @media(prefers-reduced-motion:reduce){.crank.turning,.chain.moving path,.wheel.spinning,.wheel.slowing,.bike.rolling{animation:none}.action-arrow{stroke-dasharray:none}}
</style>