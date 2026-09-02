<script lang="ts">
  import VisualEntity from './VisualEntity.svelte';
  import { resolveVocabularyVisualPlan } from './vocabularyVisualRegistry';

  let {
    senseKey,
    compact = false
  }: {
    senseKey: string;
    compact?: boolean;
  } = $props();

  let plan = $derived(resolveVocabularyVisualPlan(senseKey));
  let parameters = $derived(plan?.parameters ?? {});
  let motionEnabled = $derived(Boolean(plan && plan.motionPolicy !== 'none'));
  let relation = $derived(String(parameters.relation ?? 'inside'));
  let dimension = $derived(String(parameters.dimension ?? 'size'));
  let target = $derived(String(parameters.target ?? parameters.quantity ?? parameters.comparison ?? 'target'));
  let contrast = $derived(String(parameters.contrast ?? 'contrast'));
  let action = $derived(String(parameters.action ?? 'move'));
  let state = $derived(String(parameters.state ?? 'state'));
  let density = $derived(String(parameters.density ?? 'medium'));
  let buildingCount = $derived(density === 'high' ? 7 : density === 'low' ? 3 : 5);
  let buildings = $derived(Array.from({ length: buildingCount }, (_, index) => index));
  let semanticDepthMode = $derived(String(parameters.semanticDepthMode ?? ''));
  let semanticDepthCue = $derived(plan?.maturity === 'V6' && semanticDepthMode ? depthCueFor(semanticDepthMode) : '');

  const ink = '#40566b';
  const softInk = '#71899a';
  const blue = '#79abc8';
  const paleBlue = '#cbe7f2';
  const green = '#88b56d';
  const gold = '#e3aa55';
  const red = '#d96f5b';
  const brown = '#a96f4f';
  const cream = '#fff0bd';

  function labelFor(value: unknown): string {
    return String(value ?? '')
      .replaceAll('-', ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function depthCueFor(mode: string): string {
    const labels: Record<string, string> = {
      cause_effect: 'Cause → result',
      compare_contrast: 'Compare the ideas',
      state_transition: 'Track the change',
      spatial_reasoning: 'Notice the position',
      sequence: 'Follow the order',
      classification: 'Connect the category',
      quantity: 'Compare the amount',
      action_explanation: 'Action → meaning',
      state_explanation: 'State → meaning',
      attribute_explanation: 'Compare the feature'
    };
    return labels[mode] ?? 'Connected explanation';
  }

  function relationPosition(value: string): { x: number; y: number } {
    if (value === 'on-top-of' || value === 'above') return { x: 160, y: 34 };
    if (value === 'below') return { x: 160, y: 139 };
    if (value === 'behind') return { x: 197, y: 88 };
    if (value === 'beside' || value === 'near') return { x: 226, y: 91 };
    if (value === 'outside') return { x: 248, y: 132 };
    return { x: 160, y: 91 };
  }

  function sizePair(): { target: number; contrast: number } {
    return ['small', 'tiny'].includes(target) ? { target: 24, contrast: 49 } : { target: 50, contrast: 26 };
  }

  function heightPair(): { target: number; contrast: number } {
    return target === 'short' ? { target: 38, contrast: 78 } : { target: 78, contrast: 38 };
  }
</script>

{#if plan}
  <section
    class:compact
    class:motion-enabled={motionEnabled}
    class="vocabulary-semantic-scene"
    data-vocabulary-sense={plan.senseKey}
    data-vocabulary-strategy={plan.strategy}
    data-scene-template={plan.sceneTemplate ?? 'direct'}
    data-motion-policy={plan.motionPolicy}
    data-semantic-depth-mode={semanticDepthMode || undefined}
    aria-label={`Visual explanation for ${plan.lemma}: ${labelFor(plan.strategy)}.${semanticDepthCue ? ` Connected explanation: ${semanticDepthCue}.` : ''}`}
  >
    {#if plan.strategy === 'direct_entity' && plan.visualRef}
      <div class="direct-entity" data-scene-kind="direct-entity">
        <VisualEntity visualRef={plan.visualRef} decorative={false} label={plan.lemma} />
      </div>
    {:else}
      <svg class="semantic-svg" viewBox="0 0 320 176" role="img" aria-hidden="true">
        <rect x="0" y="0" width="320" height="176" rx="20" fill="#f7fbff" />
        <rect x="0" y="111" width="320" height="65" fill="#eef7e6" />

        {#if plan.strategy === 'place_scene'}
          <g data-scene-kind="place" data-place-kind={String(parameters.placeKind ?? plan.sceneTemplate ?? 'place')}>
            <circle cx="269" cy="29" r="15" fill="#ffd866" />
            {#if plan.sceneTemplate === 'settlement'}
              <g data-density={density} data-traffic={String(parameters.traffic ?? 'medium')}>
                {#each buildings as building}
                  {@const x = 36 + building * 36}
                  {@const h = density === 'high' ? (building % 3 === 1 ? 76 : building % 3 === 2 ? 61 : 47) : density === 'low' ? 40 : building % 2 ? 57 : 44}
                  <rect x={x} y={111 - h} width={density === 'low' ? 42 : 31} height={h} rx="4" fill={cream} stroke={ink} stroke-width="3" />
                  <rect x={x + 5} y={111 - h + 11} width="7" height="8" fill={paleBlue} stroke={ink} stroke-width="1" />
                  <rect x={x + 18} y={111 - h + 11} width="7" height="8" fill={paleBlue} stroke={ink} stroke-width="1" />
                  <rect x={x + 12} y="96" width="8" height="15" fill={brown} />
                {/each}
                {#if parameters.farmland === 'high'}
                  <path d="M8 132 L86 132 M11 140 L80 140 M15 148 L74 148" stroke={green} stroke-width="4" stroke-linecap="round" />
                {/if}
                {#if parameters.traffic === 'high' || parameters.traffic === 'medium'}
                  <path d="M83 164 L320 130" stroke="#747b80" stroke-width="19" />
                  <path d="M93 160 L309 132" stroke="#fff0a4" stroke-width="2" stroke-dasharray="11 9" />
                  <g class:motion-travel={motionEnabled && parameters.traffic === 'high'}>
                    <rect x="211" y="135" width="22" height="11" rx="3" fill={red} />
                    <circle cx="216" cy="147" r="3" fill={ink} /><circle cx="229" cy="147" r="3" fill={ink} />
                  </g>
                {:else}
                  <path d="M112 176 Q175 140 250 132" stroke="#d7bd8a" stroke-width="18" fill="none" />
                {/if}
              </g>
            {:else}
              <rect x="112" y="48" width="96" height="77" rx="5" fill={cream} stroke={ink} stroke-width="4" />
              <rect x="128" y="65" width="18" height="17" fill={paleBlue} stroke={ink} stroke-width="2" />
              <rect x="173" y="65" width="18" height="17" fill={paleBlue} stroke={ink} stroke-width="2" />
              <rect x="149" y="94" width="22" height="31" fill={brown} />
              <text x="160" y="35" text-anchor="middle" font-size="13" font-weight="800" fill={ink}>{labelFor(parameters.placeKind ?? plan.lemma)}</text>
            {/if}
          </g>

        {:else if plan.strategy === 'spatial_relation'}
          {@const pos = relationPosition(relation)}
          <g data-scene-kind="spatial-relation" data-relation={relation}>
            {#if relation === 'between'}
              <rect x="72" y="64" width="67" height="51" rx="7" fill={cream} stroke={ink} stroke-width="4" />
              <rect x="181" y="64" width="67" height="51" rx="7" fill={cream} stroke={ink} stroke-width="4" />
            {:else}
              <rect x="122" y="64" width="76" height="55" rx="7" fill={cream} stroke={ink} stroke-width="4" />
            {/if}
            <circle cx={pos.x} cy={pos.y} r="15" fill={red} stroke="#a44337" stroke-width="3" />
          </g>

        {:else if plan.strategy === 'attribute_contrast'}
          <g data-scene-kind="attribute-contrast" data-dimension={dimension}>
            <rect x="25" y="21" width="118" height="132" rx="16" fill="#ffffffd9" stroke="#dce3e7" />
            <rect x="177" y="21" width="118" height="132" rx="16" fill="#ffffffd9" stroke="#dce3e7" />
            {#if dimension === 'size'}
              {@const pair = sizePair()}
              <circle cx="84" cy="82" r={pair.target} fill={blue} stroke={ink} stroke-width="3" />
              <circle cx="236" cy="82" r={pair.contrast} fill={blue} stroke={ink} stroke-width="3" />
            {:else if dimension === 'height'}
              {@const pair = heightPair()}
              <rect x="64" y={124 - pair.target} width="40" height={pair.target} rx="8" fill={blue} stroke={ink} stroke-width="3" />
              <rect x="216" y={124 - pair.contrast} width="40" height={pair.contrast} rx="8" fill={blue} stroke={ink} stroke-width="3" />
            {:else if dimension === 'length'}
              <rect x="42" y="70" width="83" height="27" rx="8" fill={blue} stroke={ink} stroke-width="3" />
              <rect x="215" y="70" width="43" height="27" rx="8" fill={blue} stroke={ink} stroke-width="3" />
            {:else if dimension === 'weight'}
              <rect x="51" y="55" width="66" height="58" rx="8" fill={blue} stroke={ink} stroke-width="3" />
              <rect x="214" y="66" width="44" height="38" rx="8" fill={blue} stroke={ink} stroke-width="3" />
              <path d="M43 121 H125 M208 111 H265" stroke={softInk} stroke-width="3" />
            {:else if dimension === 'speed'}
              <path d="M42 104 H126 M194 104 H278" stroke={softInk} stroke-width="3" />
              <g class:motion-travel={motionEnabled}>
                <circle cx="112" cy="91" r="13" fill={red} /><path d="M45 72 H73 M52 82 H84" stroke={blue} stroke-width="4" />
              </g>
              <circle cx="218" cy="91" r="13" fill={red} /><path d="M195 78 H209" stroke={blue} stroke-width="4" />
            {:else if dimension === 'age-state'}
              <rect x="49" y="51" width="69" height="69" rx="3" fill="#d7c09e" stroke={ink} stroke-width="3" />
              <path d="M72 56 L89 81 L79 108" stroke={brown} stroke-width="3" fill="none" />
              <rect x="211" y="36" width="51" height="84" rx="3" fill={paleBlue} stroke={ink} stroke-width="3" />
              <rect x="220" y="49" width="9" height="12" fill="#fff" /><rect x="242" y="49" width="9" height="12" fill="#fff" />
              <rect x="220" y="70" width="9" height="12" fill="#fff" /><rect x="242" y="70" width="9" height="12" fill="#fff" />
            {:else if dimension === 'temperature'}
              <circle cx="84" cy="65" r="23" fill="#ffd866" />
              <path d="M84 27 V18 M84 112 V103 M46 65 H37 M131 65 H122 M57 38 L50 31 M118 99 L111 92 M111 38 L118 31 M50 99 L57 92" stroke={gold} stroke-width="4" />
              <text x="236" y="77" text-anchor="middle" font-size="42" fill={blue}>❄</text>
            {:else if dimension === 'width'}
              <rect x="72" y="48" width="27" height="75" rx="6" fill={blue} stroke={ink} stroke-width="3" />
              <rect x="196" y="61" width="80" height="49" rx="6" fill={blue} stroke={ink} stroke-width="3" />
            {:else if dimension === 'texture'}
              <path d="M43 83 H125" stroke={blue} stroke-width="7" stroke-linecap="round" />
              <path d="M195 91 L207 72 L220 94 L234 70 L248 94 L263 72 L278 91" stroke={blue} stroke-width="6" fill="none" stroke-linejoin="round" />
            {:else if dimension === 'fill-level'}
              <path d="M61 45 H107 L102 119 H66 Z" fill="#fff" stroke={ink} stroke-width="4" />
              <path d="M65 70 H103 L100 115 H68 Z" fill={blue} />
              <path d="M213 45 H259 L254 119 H218 Z" fill="#fff" stroke={ink} stroke-width="4" />
              <path d="M217 108 H255 L254 115 H218 Z" fill={blue} />
            {:else}
              <circle cx="84" cy="82" r="45" fill={blue} stroke={ink} stroke-width="3" />
              <circle cx="236" cy="82" r="25" fill={blue} stroke={ink} stroke-width="3" />
            {/if}
            <text x="84" y="142" text-anchor="middle" font-size="11" font-weight="800" fill={ink}>{labelFor(target)}</text>
            <text x="236" y="142" text-anchor="middle" font-size="11" font-weight="800" fill={ink}>{labelFor(contrast)}</text>
            <text x="160" y="89" text-anchor="middle" font-size="20" font-weight="900" fill={softInk}>↔</text>
          </g>

        {:else if plan.strategy === 'quantity_scene'}
          <g data-scene-kind="quantity" data-quantity={String(parameters.quantity ?? parameters.comparison ?? parameters.fraction ?? '')}>
            <rect x="25" y="28" width="118" height="119" rx="16" fill="#ffffffd9" stroke="#dce3e7" />
            <rect x="177" y="28" width="118" height="119" rx="16" fill="#ffffffd9" stroke="#dce3e7" />
            <circle cx="68" cy="73" r="12" fill={green} /><circle cx="101" cy="95" r="12" fill={green} />
            {#each [[210,61],[241,58],[267,76],[210,101],[244,97],[271,112]] as point}
              <circle cx={point[0]} cy={point[1]} r="10" fill={green} />
            {/each}
            <text x="84" y="133" text-anchor="middle" font-size="11" font-weight="800" fill={ink}>{labelFor(parameters.quantity ?? parameters.fraction ?? 'few')}</text>
            <text x="236" y="133" text-anchor="middle" font-size="11" font-weight="800" fill={ink}>{parameters.comparison === 'scarce' ? 'More available' : 'More'}</text>
            <text x="160" y="91" text-anchor="middle" font-size="20" font-weight="900" fill={softInk}>↔</text>
          </g>

        {:else if plan.strategy === 'expression_scene'}
          <g data-scene-kind="expression" data-expression={String(parameters.expression ?? 'happy')} class:motion-bob={motionEnabled}>
            <circle cx="160" cy="82" r="48" fill="#ffd98a" stroke="#7a6241" stroke-width="4" />
            <circle cx="143" cy="69" r="5" fill="#333" /><circle cx="177" cy="69" r="5" fill="#333" />
            <path d="M139 94 Q160 116 181 94" stroke="#8f4f46" stroke-width="5" fill="none" stroke-linecap="round" />
          </g>

        {:else if plan.strategy === 'state_scene'}
          <g data-scene-kind="state" data-state={state}>
            {#if state === 'fragile'}
              <path d="M127 37 H193 L186 127 H134 Z" fill="#e9f7fb" stroke={ink} stroke-width="4" />
              <path d="M157 45 L170 77 L157 104 L173 126" stroke={brown} stroke-width="4" fill="none" />
              <text x="160" y="151" text-anchor="middle" font-size="12" font-weight="800" fill={ink}>Handle gently</text>
            {:else if state === 'silent'}
              <path d="M105 74 H128 L164 48 V116 L128 91 H105 Z" fill={softInk} />
              <text x="213" y="102" text-anchor="middle" font-size="58" font-weight="700" fill={red}>×</text>
              <text x="160" y="147" text-anchor="middle" font-size="12" font-weight="800" fill={ink}>No sound</text>
            {:else}
              <rect x="122" y="48" width="76" height="76" rx="16" fill={blue} stroke={ink} stroke-width="3" />
            {/if}
          </g>

        {:else if plan.strategy === 'action_scene'}
          <g data-scene-kind="action" data-action={action}>
            <circle cx="100" cy="62" r="17" fill="#d69b72" stroke="#7c5a43" stroke-width="3" />
            <rect x="81" y="80" width="38" height="48" rx="13" fill={blue} />
            {#if action === 'observe'}
              <circle cx="221" cy="77" r="27" fill="#fff" stroke={ink} stroke-width="4" class:motion-focus={motionEnabled} />
              <circle cx="221" cy="77" r="9" fill={blue} />
              <path d="M239 96 L260 118" stroke={ink} stroke-width="6" />
              <path d="M124 75 L187 76" stroke={softInk} stroke-width="3" stroke-dasharray="7 6" />
            {:else}
              <text x="213" y="90" text-anchor="middle" font-size="36" font-weight="900" fill={ink}>→</text>
            {/if}
          </g>

        {:else if plan.strategy === 'cause_effect'}
          <g data-scene-kind="cause-effect" data-action={action}>
            <circle cx="72" cy="61" r="16" fill="#d69b72" stroke="#7c5a43" stroke-width="3" />
            <rect x="55" y="79" width="34" height="43" rx="12" fill={blue} />
            <text x="156" y="93" text-anchor="middle" font-size="38" font-weight="900" fill={ink}>{action === 'pull' ? '←' : '→'}</text>
            <rect class="movable-box" class:motion-pull={motionEnabled && action === 'pull'} class:motion-push={motionEnabled && action !== 'pull'} x="208" y="66" width="57" height="57" rx="7" fill="#d9ad72" stroke="#70553f" stroke-width="4" />
          </g>

        {:else if plan.strategy === 'process_scene'}
          <g data-scene-kind="state-transition" data-from={String(parameters.from ?? 'before')} data-to={String(parameters.to ?? 'after')}>
            {#if parameters.dimension === 'fill-level'}
              <path d="M54 46 H106 L101 122 H59 Z" fill="#fff" stroke={ink} stroke-width="4" /><path d="M58 111 H102 L101 119 H59 Z" fill={blue} />
              <path d="M214 46 H266 L261 122 H219 Z" fill="#fff" stroke={ink} stroke-width="4" /><path d="M218 69 H262 L261 119 H219 Z" fill={blue} />
            {:else}
              <g><rect x="55" y="43" width="51" height="82" fill="#d9ad72" stroke="#70553f" stroke-width="5" /><circle cx="96" cy="84" r="4" fill="#70553f" /></g>
              <g class:motion-open={motionEnabled}><path d="M217 43 L266 51 L252 125 L217 125 Z" fill="#d9ad72" stroke="#70553f" stroke-width="5" /><circle cx="250" cy="85" r="4" fill="#70553f" /></g>
            {/if}
            <text x="160" y="91" text-anchor="middle" font-size="27" font-weight="900" fill={ink}>→</text>
            <text x="80" y="148" text-anchor="middle" font-size="11" font-weight="800" fill={ink}>{labelFor(parameters.from ?? 'before')}</text>
            <text x="240" y="148" text-anchor="middle" font-size="11" font-weight="800" fill={ink}>{labelFor(parameters.to ?? 'after')}</text>
          </g>

        {:else if plan.strategy === 'sequence_scene'}
          <g data-scene-kind="sequence">
            <rect x="45" y="48" width="88" height="77" rx="14" fill="#fff" stroke="#dce3e7" />
            <rect x="187" y="48" width="88" height="77" rx="14" fill="#fff" stroke="#dce3e7" />
            <circle cx="89" cy="74" r="18" fill={blue} /><text x="89" y="80" text-anchor="middle" font-size="17" font-weight="900" fill="#fff">1</text>
            <circle cx="231" cy="74" r="18" fill={blue} /><text x="231" y="80" text-anchor="middle" font-size="17" font-weight="900" fill="#fff">2</text>
            <text x="89" y="110" text-anchor="middle" font-size="11" font-weight="800" fill={ink}>{parameters.timeRelation === 'before-expected' ? 'Earlier' : 'Before'}</text>
            <text x="231" y="110" text-anchor="middle" font-size="11" font-weight="800" fill={ink}>{parameters.timeRelation === 'after-expected' ? 'Later' : 'Next'}</text>
            <text x="160" y="91" text-anchor="middle" font-size="25" font-weight="900" fill={ink}>→</text>
          </g>

        {:else if plan.strategy === 'part_whole'}
          <g data-scene-kind="part-whole">
            {#each [100,135,170,205] as x, index}
              <circle cx={x} cy="88" r={index === 2 ? 17 : 13} fill={index === 2 ? gold : blue} stroke={ink} stroke-width="2" />
            {/each}
            <circle cx="170" cy="88" r="26" fill="none" stroke="#d07e35" stroke-width="3" stroke-dasharray="6 5" class:motion-focus={motionEnabled} />
          </g>

        {:else if plan.strategy === 'comparison_scene'}
          <g data-scene-kind="comparison">
            <rect x="53" y="59" width="31" height="31" rx="6" fill={blue} /><rect x="92" y="59" width="31" height="31" rx="6" fill={blue} />
            <rect x="198" y="59" width="31" height="31" rx="6" fill={blue} /><circle cx="252" cy="75" r="16" fill={gold} />
            <text x="160" y="84" text-anchor="middle" font-size="24" font-weight="900" fill={ink}>↔</text>
          </g>

        {:else}
          <g data-scene-kind="fallback"><text x="160" y="90" text-anchor="middle" font-size="18" font-weight="800" fill={ink}>{plan.lemma}</text></g>
        {/if}

        <text x="16" y="160" font-size="12" font-weight="850" fill={ink}>{plan.lemma}</text>
      </svg>
    {/if}
    {#if semanticDepthCue}
      <div class="semantic-depth-cue" data-semantic-depth-cue data-semantic-depth-mode={semanticDepthMode} aria-hidden="true">
        {semanticDepthCue}
      </div>
    {/if}
  </section>
{/if}

<style>
  .vocabulary-semantic-scene{position:relative;width:100%;min-height:176px;overflow:hidden;border:1px solid rgba(38,50,59,.16);border-radius:22px;background:#f7fbff}.compact{min-height:138px;border-radius:18px}.semantic-svg{display:block;width:100%;height:176px}.compact .semantic-svg{height:138px}.direct-entity{width:min(160px,42vw);height:150px;margin:12px auto}.semantic-depth-cue{position:absolute;top:8px;right:8px;max-width:56%;padding:4px 8px;border:1px solid rgba(64,86,107,.18);border-radius:999px;background:rgba(255,255,255,.94);font-size:.68rem;font-weight:850;line-height:1.15;color:#40566b;text-align:center}.compact .semantic-depth-cue{top:6px;right:6px;max-width:62%;padding:3px 6px;font-size:.62rem}.motion-travel{animation:vocab-travel 1.3s ease-in-out infinite alternate}.motion-bob{animation:vocab-bob 1.5s ease-in-out infinite alternate}.motion-focus{transform-box:fill-box;transform-origin:center;animation:vocab-focus 1.35s ease-in-out infinite alternate}.motion-push{animation:vocab-push 1.35s ease-in-out infinite alternate}.motion-pull{animation:vocab-pull 1.35s ease-in-out infinite alternate}.motion-open{transform-box:fill-box;transform-origin:left center;animation:vocab-open 1.5s ease-in-out infinite alternate}@keyframes vocab-travel{from{transform:translateX(-33px)}to{transform:translateX(0)}}@keyframes vocab-bob{from{transform:translateY(0)}to{transform:translateY(-5px)}}@keyframes vocab-focus{from{transform:scale(.93);opacity:.7}to{transform:scale(1.06);opacity:1}}@keyframes vocab-push{from{transform:translateX(-7px)}to{transform:translateX(13px)}}@keyframes vocab-pull{from{transform:translateX(12px)}to{transform:translateX(-9px)}}@keyframes vocab-open{from{transform:skewY(0deg) scaleX(1)}to{transform:skewY(-7deg) scaleX(.76)}}@media(prefers-reduced-motion:reduce){.vocabulary-semantic-scene *{animation:none!important}}
</style>