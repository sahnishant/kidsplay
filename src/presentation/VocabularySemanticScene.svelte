<script lang="ts">
  import VisualEntity from './VisualEntity.svelte';
  import {
    resolveVocabularyVisualPlan,
    type VocabularyVisualRuntimePlan
  } from './vocabularyVisualRegistry';

  let {
    senseKey,
    compact = false
  }: {
    senseKey: string;
    compact?: boolean;
  } = $props();

  let plan = $derived(resolveVocabularyVisualPlan(senseKey));
  let motionEnabled = $derived(Boolean(plan && plan.motionPolicy !== 'none'));
  let parameters = $derived(plan?.parameters ?? {});
  let density = $derived(String(parameters.density ?? 'medium'));
  let buildingCount = $derived(density === 'high' ? 7 : density === 'low' ? 3 : 5);
  let buildings = $derived(Array.from({ length: buildingCount }, (_, index) => index));
  let relation = $derived(String(parameters.relation ?? 'inside'));
  let dimension = $derived(String(parameters.dimension ?? 'size'));
  let target = $derived(String(parameters.target ?? parameters.quantity ?? parameters.comparison ?? 'target'));
  let contrast = $derived(String(parameters.contrast ?? 'contrast'));
  let action = $derived(String(parameters.action ?? 'move'));
  let state = $derived(String(parameters.state ?? 'state'));
  let expression = $derived(String(parameters.expression ?? 'happy'));
  let transitionFrom = $derived(String(parameters.from ?? 'before'));
  let transitionTo = $derived(String(parameters.to ?? 'after'));

  function labelFor(value: unknown): string {
    return String(value ?? '')
      .replaceAll('-', ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function accessibleLabel(value: VocabularyVisualRuntimePlan): string {
    return `Visual explanation for ${value.lemma}: ${labelFor(value.strategy)}.`;
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
    aria-label={accessibleLabel(plan)}
  >
    {#if plan.strategy === 'direct_entity' && plan.visualRef}
      <div class="direct-entity" data-scene-kind="direct-entity">
        <VisualEntity visualRef={plan.visualRef} decorative={false} label={plan.lemma} />
      </div>

    {:else if plan.strategy === 'place_scene'}
      <div class="place-stage" data-scene-kind="place" data-place-kind={String(parameters.placeKind ?? plan.sceneTemplate ?? 'place')}>
        <div class="sky-disc" aria-hidden="true"></div>
        {#if plan.sceneTemplate === 'settlement'}
          <div class="settlement" data-density={density} data-traffic={String(parameters.traffic ?? 'medium')}>
            {#each buildings as building}
              <span class="building" data-building={building} aria-hidden="true">
                <i></i><i></i><i></i><b></b>
              </span>
            {/each}
          </div>
          {#if parameters.farmland === 'high'}
            <div class="farmland" aria-hidden="true"><span></span><span></span><span></span></div>
          {/if}
          {#if parameters.traffic === 'high' || parameters.traffic === 'medium'}
            <div class="road"><span class="vehicle" aria-hidden="true"></span></div>
          {:else}
            <div class="path" aria-hidden="true"></div>
          {/if}
        {:else}
          <div class="generic-place-building" aria-hidden="true"><i></i><i></i><i></i><b></b></div>
          <div class="place-marker">{labelFor(parameters.placeKind ?? plan.lemma)}</div>
        {/if}
        <strong class="scene-word">{plan.lemma}</strong>
      </div>

    {:else if plan.strategy === 'spatial_relation'}
      <div class="relation-stage" data-scene-kind="spatial-relation" data-relation={relation}>
        <div class="reference-object reference-a" aria-hidden="true"></div>
        {#if relation === 'between'}<div class="reference-object reference-b" aria-hidden="true"></div>{/if}
        <div class="relation-subject" aria-hidden="true"></div>
        <strong class="relation-label">{plan.lemma}</strong>
      </div>

    {:else if plan.strategy === 'attribute_contrast'}
      <div class="contrast-stage" data-scene-kind="attribute-contrast" data-dimension={dimension}>
        <article class="contrast-card contrast-card--target" data-value={target}>
          {#if dimension === 'size' || dimension === 'height' || dimension === 'length' || dimension === 'weight' || dimension === 'hardness'}
            <span class="metric-shape target-shape" aria-hidden="true"></span>
          {:else if dimension === 'speed'}
            <span class="speed-lane" aria-hidden="true"><i class="speed-dot speed-dot--target"></i><b></b><b></b><b></b></span>
          {:else if dimension === 'age-state'}
            <span class="age-building age-building--old" aria-hidden="true"><i></i><i></i><b></b></span>
          {:else if dimension === 'temperature'}
            <span class="temperature-symbol temperature-symbol--hot" aria-hidden="true">☀</span>
            <span class="thermometer thermometer--high" aria-hidden="true"><i></i></span>
          {:else if dimension === 'width'}
            <span class="width-bar width-bar--target" aria-hidden="true"></span>
          {:else if dimension === 'texture'}
            <span class="texture-line texture-line--smooth" aria-hidden="true"></span>
          {:else if dimension === 'fill-level'}
            <span class="cup cup--full" aria-hidden="true"><i></i></span>
          {:else}
            <span class="metric-shape target-shape" aria-hidden="true"></span>
          {/if}
          <strong>{labelFor(target)}</strong>
        </article>
        <span class="compare-mark" aria-hidden="true">↔</span>
        <article class="contrast-card contrast-card--contrast" data-value={contrast}>
          {#if dimension === 'size' || dimension === 'height' || dimension === 'length' || dimension === 'weight' || dimension === 'hardness'}
            <span class="metric-shape contrast-shape" aria-hidden="true"></span>
          {:else if dimension === 'speed'}
            <span class="speed-lane" aria-hidden="true"><i class="speed-dot speed-dot--slow"></i><b></b></span>
          {:else if dimension === 'age-state'}
            <span class="age-building age-building--modern" aria-hidden="true"><i></i><i></i><i></i><b></b></span>
          {:else if dimension === 'temperature'}
            <span class="temperature-symbol temperature-symbol--cold" aria-hidden="true">❄</span>
            <span class="thermometer thermometer--low" aria-hidden="true"><i></i></span>
          {:else if dimension === 'width'}
            <span class="width-bar width-bar--contrast" aria-hidden="true"></span>
          {:else if dimension === 'texture'}
            <span class="texture-line texture-line--rough" aria-hidden="true"></span>
          {:else if dimension === 'fill-level'}
            <span class="cup cup--empty" aria-hidden="true"><i></i></span>
          {:else}
            <span class="metric-shape contrast-shape" aria-hidden="true"></span>
          {/if}
          <strong>{labelFor(contrast)}</strong>
        </article>
      </div>

    {:else if plan.strategy === 'quantity_scene'}
      <div class="quantity-stage" data-scene-kind="quantity" data-quantity={String(parameters.quantity ?? parameters.comparison ?? parameters.fraction ?? '')}>
        <article class="quantity-group quantity-group--few">
          <div aria-hidden="true"><i></i><i></i></div>
          <strong>{labelFor(parameters.quantity ?? parameters.fraction ?? 'few')}</strong>
        </article>
        <span class="compare-mark" aria-hidden="true">↔</span>
        <article class="quantity-group quantity-group--many">
          <div aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>
          <strong>{parameters.comparison === 'scarce' ? 'More would be available' : 'More'}</strong>
        </article>
      </div>

    {:else if plan.strategy === 'expression_scene'}
      <div class="expression-stage" data-scene-kind="expression" data-expression={expression}>
        <div class="face" aria-hidden="true"><i class="eye eye--left"></i><i class="eye eye--right"></i><b class="mouth"></b></div>
        <strong>{plan.lemma}</strong>
      </div>

    {:else if plan.strategy === 'state_scene'}
      <div class="state-stage" data-scene-kind="state" data-state={state}>
        {#if state === 'fragile'}
          <div class="fragile-glass" aria-hidden="true"><i></i><b></b></div>
          <div class="care-cue">Handle gently</div>
        {:else if state === 'silent'}
          <div class="speaker" aria-hidden="true"><i></i><b>×</b></div>
          <div class="care-cue">No sound</div>
        {:else}
          <div class="state-object" aria-hidden="true"></div>
        {/if}
        <strong>{plan.lemma}</strong>
      </div>

    {:else if plan.strategy === 'action_scene'}
      <div class="action-stage" data-scene-kind="action" data-action={action}>
        {#if action === 'observe'}
          <div class="observer" aria-hidden="true"><span class="actor-head"></span><span class="actor-body"></span></div>
          <div class="focus-target" aria-hidden="true"><i></i><b></b></div>
          <span class="sight-line" aria-hidden="true"></span>
        {:else}
          <div class="generic-actor" aria-hidden="true"><span class="actor-head"></span><span class="actor-body"></span><i></i><b></b></div>
          <span class="action-arrow" aria-hidden="true">→</span>
        {/if}
        <strong>{plan.lemma}</strong>
      </div>

    {:else if plan.strategy === 'cause_effect'}
      <div class="force-stage" data-scene-kind="cause-effect" data-action={action}>
        <div class="generic-actor" aria-hidden="true"><span class="actor-head"></span><span class="actor-body"></span></div>
        <span class="force-arrow" class:force-arrow--pull={action === 'pull'} aria-hidden="true">{action === 'pull' ? '←' : '→'}</span>
        <div class="movable-box" aria-hidden="true"></div>
        <strong>{plan.lemma}</strong>
      </div>

    {:else if plan.strategy === 'process_scene'}
      <div class="transition-stage" data-scene-kind="state-transition" data-from={transitionFrom} data-to={transitionTo}>
        <article class="transition-state transition-state--from">
          {#if parameters.dimension === 'fill-level'}<span class="cup cup--empty" aria-hidden="true"><i></i></span>{:else}<span class="door door--closed" aria-hidden="true"><i></i></span>{/if}
          <strong>{labelFor(transitionFrom)}</strong>
        </article>
        <span class="transition-arrow" aria-hidden="true">→</span>
        <article class="transition-state transition-state--to">
          {#if parameters.dimension === 'fill-level'}<span class="cup cup--full" aria-hidden="true"><i></i></span>{:else}<span class="door door--open" aria-hidden="true"><i></i></span>{/if}
          <strong>{labelFor(transitionTo)}</strong>
        </article>
      </div>

    {:else if plan.strategy === 'sequence_scene'}
      <div class="sequence-stage" data-scene-kind="sequence">
        <article class="sequence-step sequence-step--first"><span>1</span><strong>{parameters.timeRelation === 'before-expected' ? 'Earlier' : 'Before'}</strong></article>
        <span class="sequence-arrow" aria-hidden="true">→</span>
        <article class="sequence-step sequence-step--next"><span>2</span><strong>{parameters.timeRelation === 'after-expected' ? 'Later' : 'Next'}</strong></article>
        <div class="sequence-focus">{plan.lemma}</div>
      </div>

    {:else if plan.strategy === 'part_whole'}
      <div class="part-whole-stage" data-scene-kind="part-whole">
        <div class="member-group" aria-hidden="true"><i></i><i class="member-focus"></i><i></i><i></i></div>
        <span class="focus-ring" aria-hidden="true"></span>
        <strong>{plan.lemma}</strong>
      </div>

    {:else if plan.strategy === 'comparison_scene'}
      <div class="comparison-stage" data-scene-kind="comparison">
        <div class="comparison-pair comparison-pair--left" aria-hidden="true"><i></i><i></i></div>
        <span class="compare-mark" aria-hidden="true">↔</span>
        <div class="comparison-pair comparison-pair--right" aria-hidden="true"><i></i><i class="different"></i></div>
        <strong>{plan.lemma}</strong>
      </div>

    {:else}
      <div class="scene-fallback" data-scene-kind="fallback"><strong>{plan.lemma}</strong></div>
    {/if}
  </section>
{/if}

<style>
  .vocabulary-semantic-scene {
    --ink: #26323b;
    --line: rgba(38,50,59,.16);
    --paper: #fffdf7;
    position: relative;
    width: 100%;
    min-height: 176px;
    overflow: hidden;
    border: 1px solid var(--line);
    border-radius: 22px;
    background: linear-gradient(180deg,#f7fbff 0 58%,#eef7e6 58% 100%);
    color: var(--ink);
  }
  .compact { min-height: 138px; border-radius: 18px; }
  .direct-entity { width: min(160px, 42vw); height: 150px; margin: 12px auto; }
  .scene-word, .relation-label { position: absolute; left: 12px; bottom: 9px; padding: 5px 9px; border-radius: 999px; background: rgba(255,255,255,.9); font-size: .74rem; text-transform: capitalize; }

  .place-stage { position: relative; min-height: 176px; height: 100%; }
  .sky-disc { position: absolute; width: 28px; height: 28px; border-radius: 50%; right: 14%; top: 13%; background: #ffd866; box-shadow: 0 0 0 7px rgba(255,216,102,.16); }
  .settlement { position: absolute; left: 8%; right: 8%; bottom: 35px; height: 92px; display: flex; align-items: flex-end; justify-content: center; gap: 5px; }
  .building, .generic-place-building, .age-building { position: relative; display: inline-block; width: 34px; height: 54px; border: 3px solid #40566b; border-radius: 5px 5px 2px 2px; background: #fff0bd; box-sizing: border-box; }
  .settlement[data-density="high"] .building:nth-child(2n) { height: 75px; }
  .settlement[data-density="high"] .building:nth-child(3n) { height: 88px; }
  .settlement[data-density="low"] .building { width: 42px; height: 44px; }
  .building i, .generic-place-building i, .age-building i { display: inline-block; width: 7px; height: 8px; margin: 8px 2px 0; background: #bde1ef; border: 1px solid #40566b; }
  .building b, .generic-place-building b, .age-building b { position: absolute; width: 9px; height: 17px; bottom: 0; left: calc(50% - 4px); background: #a96b50; }
  .farmland { position: absolute; left: 2%; bottom: 18px; width: 27%; display: grid; gap: 3px; transform: skewX(-12deg); }
  .farmland span { height: 4px; border-radius: 99px; background: #88b56d; }
  .road { position: absolute; left: 25%; right: 0; bottom: 8px; height: 18px; background: #6d7379; transform: skewX(-16deg); }
  .road::after { content: ''; position: absolute; left: 10%; right: 10%; top: 8px; border-top: 2px dashed #fff4a2; }
  .vehicle { position: absolute; width: 20px; height: 10px; border-radius: 4px; left: 48%; top: 3px; background: #df6f5b; z-index: 1; }
  .path { position: absolute; width: 55%; height: 18px; bottom: 7px; left: 32%; border-radius: 50%; background: #d7bd8a; transform: rotate(-7deg); }
  .generic-place-building { position: absolute; width: 92px; height: 88px; left: calc(50% - 46px); bottom: 34px; }
  .generic-place-building i { width: 14px; height: 15px; }
  .generic-place-building b { width: 18px; height: 28px; left: calc(50% - 9px); }
  .place-marker { position: absolute; left: 50%; top: 18px; transform: translateX(-50%); padding: 5px 9px; border-radius: 999px; background: rgba(255,255,255,.86); font-weight: 850; font-size: .72rem; }

  .relation-stage { position: relative; min-height: 176px; }
  .reference-object { position: absolute; width: 76px; height: 58px; left: calc(50% - 38px); top: 58px; border: 4px solid #526879; border-radius: 9px; background: #f6dfaa; }
  .relation-subject { position: absolute; width: 30px; height: 30px; border-radius: 50%; background: #dd6f5c; border: 3px solid #a44337; z-index: 2; }
  .relation-stage[data-relation="inside"] .relation-subject { left: calc(50% - 15px); top: 72px; }
  .relation-stage[data-relation="on-top-of"] .relation-subject { left: calc(50% - 15px); top: 24px; }
  .relation-stage[data-relation="below"] .relation-subject { left: calc(50% - 15px); top: 126px; }
  .relation-stage[data-relation="above"] .relation-subject { left: calc(50% - 15px); top: 15px; }
  .relation-stage[data-relation="behind"] .relation-subject { left: calc(50% + 20px); top: 72px; z-index: 0; opacity: .7; }
  .relation-stage[data-relation="beside"] .relation-subject { left: calc(50% + 55px); top: 72px; }
  .relation-stage[data-relation="outside"] .relation-subject { left: calc(50% + 70px); top: 110px; }
  .relation-stage[data-relation="near"] .relation-subject { left: calc(50% + 45px); top: 72px; }
  .relation-stage[data-relation="between"] .reference-a { left: calc(50% - 104px); }
  .relation-stage[data-relation="between"] .reference-b { left: calc(50% + 28px); }
  .relation-stage[data-relation="between"] .relation-subject { left: calc(50% - 15px); top: 73px; }

  .contrast-stage, .quantity-stage, .transition-stage { min-height: 176px; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 9px; padding: 16px; box-sizing: border-box; }
  .contrast-card, .quantity-group, .transition-state { min-width: 0; height: 132px; display: grid; place-items: center; align-content: center; gap: 8px; border: 1px solid rgba(38,50,59,.11); border-radius: 18px; background: rgba(255,255,255,.82); text-align: center; }
  .contrast-card strong, .quantity-group strong, .transition-state strong { max-width: 100%; font-size: .72rem; line-height: 1.1; overflow-wrap: anywhere; }
  .compare-mark, .transition-arrow, .sequence-arrow { font-weight: 950; font-size: 1.25rem; opacity: .65; }
  .metric-shape { display: block; border-radius: 50%; background: #6eabd0; border: 3px solid #3f7898; }
  .target-shape { width: 72px; height: 72px; }
  .contrast-shape { width: 38px; height: 38px; }
  .contrast-stage[data-dimension="height"] .target-shape { width: 38px; height: 82px; border-radius: 11px; }
  .contrast-stage[data-dimension="height"] .contrast-shape { width: 38px; height: 43px; border-radius: 11px; }
  .contrast-stage[data-dimension="length"] .target-shape { width: 88px; height: 24px; border-radius: 11px; }
  .contrast-stage[data-dimension="length"] .contrast-shape { width: 43px; height: 24px; border-radius: 11px; }
  .contrast-stage[data-dimension="weight"] .target-shape { width: 66px; height: 56px; border-radius: 9px; box-shadow: 0 9px 0 -4px rgba(38,50,59,.25); }
  .contrast-stage[data-dimension="weight"] .contrast-shape { width: 45px; height: 36px; border-radius: 9px; box-shadow: 0 4px 0 -3px rgba(38,50,59,.2); }
  .speed-lane { position: relative; display: block; width: 88px; height: 45px; border-bottom: 3px solid #82909a; }
  .speed-lane b { display: block; width: 20px; border-top: 3px solid #8bb8d1; margin: 7px 0; }
  .speed-dot { position: absolute; width: 22px; height: 22px; border-radius: 50%; right: 6px; bottom: 3px; background: #df6f5b; }
  .motion-enabled .speed-dot--target { animation: vocabulary-travel 1.25s ease-in-out infinite alternate; }
  .age-building--old { width: 62px; height: 62px; transform: rotate(-1deg); background: #d7c09e; }
  .age-building--old::after { content: ''; position: absolute; width: 22px; border-top: 3px solid #9a674f; transform: rotate(55deg); top: 29px; left: 18px; }
  .age-building--modern { width: 54px; height: 82px; background: #c6e4ee; }
  .temperature-symbol { font-size: 2.2rem; line-height: 1; }
  .thermometer { position: relative; display: block; width: 14px; height: 55px; border: 3px solid #56636c; border-radius: 10px; background: #fff; }
  .thermometer::after { content: ''; position: absolute; width: 22px; height: 22px; border: 3px solid #56636c; border-radius: 50%; bottom: -14px; left: -7px; background: #fff; }
  .thermometer i { position: absolute; bottom: 2px; left: 3px; right: 3px; border-radius: 9px; background: #df6f5b; }
  .thermometer--high i { height: 43px; }
  .thermometer--low i { height: 14px; background: #6eaed8; }
  .width-bar { display: block; height: 40px; border-radius: 8px; background: #6eabd0; border: 3px solid #3f7898; }
  .width-bar--target { width: 32px; }
  .width-bar--contrast { width: 82px; }
  .texture-line { display: block; width: 92px; height: 34px; }
  .texture-line--smooth { border-bottom: 5px solid #5e93ae; border-radius: 50%; }
  .texture-line--rough { background: linear-gradient(135deg, transparent 40%, #5e93ae 41% 53%, transparent 54%) 0 0/18px 18px; }
  .cup { position: relative; display: block; width: 55px; height: 70px; border: 4px solid #526879; border-top-width: 2px; border-radius: 4px 4px 13px 13px; overflow: hidden; background: #fff; }
  .cup i { position: absolute; left: 0; right: 0; bottom: 0; background: #6cb9dc; }
  .cup--full i { height: 78%; }
  .cup--empty i { height: 12%; }

  .quantity-group > div { width: 92px; min-height: 68px; display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 7px; }
  .quantity-group i { width: 22px; height: 22px; border-radius: 50%; background: #7aaa6c; border: 2px solid #527a47; }
  .quantity-group--few i { opacity: .9; }

  .expression-stage, .state-stage, .action-stage, .force-stage, .part-whole-stage, .comparison-stage { min-height: 176px; display: grid; place-items: center; align-content: center; gap: 8px; position: relative; }
  .face { position: relative; width: 96px; height: 96px; border-radius: 50%; background: #ffd98a; border: 4px solid #7a6241; }
  .eye { position: absolute; top: 31px; width: 9px; height: 12px; border-radius: 50%; background: #3b3b3b; }
  .eye--left { left: 26px; } .eye--right { right: 26px; }
  .mouth { position: absolute; left: 28px; right: 28px; bottom: 22px; height: 18px; border-bottom: 5px solid #8f4f46; border-radius: 0 0 30px 30px; }
  .motion-enabled .face { animation: vocabulary-gentle-bob 1.6s ease-in-out infinite alternate; }
  .fragile-glass { position: relative; width: 62px; height: 82px; border: 4px solid #63869a; border-radius: 5px 5px 14px 14px; background: rgba(193,230,242,.35); }
  .fragile-glass i, .fragile-glass b { position: absolute; width: 4px; background: #76564d; transform-origin: top; }
  .fragile-glass i { height: 36px; left: 29px; top: 7px; transform: rotate(23deg); }
  .fragile-glass b { height: 27px; left: 39px; top: 34px; transform: rotate(-42deg); }
  .care-cue { padding: 4px 8px; border-radius: 999px; background: rgba(255,255,255,.9); font-size: .7rem; font-weight: 800; }
  .speaker { position: relative; width: 90px; height: 72px; }
  .speaker i { position: absolute; width: 35px; height: 35px; left: 8px; top: 18px; background: #71899a; clip-path: polygon(0 30%,40% 30%,100% 0,100% 100%,40% 70%,0 70%); }
  .speaker b { position: absolute; font-size: 3rem; right: 8px; top: 1px; color: #c95b52; }
  .state-object { width: 72px; height: 72px; border-radius: 16px; background: #89a9bb; }

  .observer, .generic-actor { position: relative; width: 54px; height: 88px; }
  .actor-head { position: absolute; width: 34px; height: 34px; left: 10px; top: 0; border-radius: 50%; background: #d69b72; border: 3px solid #7c5a43; }
  .actor-body { position: absolute; width: 42px; height: 48px; left: 6px; top: 37px; border-radius: 16px 16px 8px 8px; background: #7aa6c6; }
  .action-stage { grid-template-columns: 62px 80px; grid-template-rows: 1fr auto; column-gap: 28px; }
  .action-stage strong { grid-column: 1 / -1; }
  .focus-target { position: relative; width: 58px; height: 58px; border-radius: 50%; border: 4px solid #58758a; background: #fff; }
  .focus-target i { position: absolute; width: 19px; height: 19px; border-radius: 50%; background: #7aa6c6; left: 16px; top: 16px; }
  .focus-target b { position: absolute; width: 32px; border-top: 5px solid #58758a; transform: rotate(45deg); right: -22px; bottom: -8px; }
  .sight-line { position: absolute; width: 74px; border-top: 3px dashed rgba(76,111,132,.55); left: calc(50% - 44px); top: 74px; transform: rotate(-5deg); }
  .motion-enabled .focus-target { animation: vocabulary-focus 1.4s ease-in-out infinite alternate; }
  .generic-actor i, .generic-actor b { position: absolute; width: 28px; border-top: 5px solid #526879; top: 54px; }
  .generic-actor i { left: -11px; transform: rotate(-35deg); } .generic-actor b { right: -11px; transform: rotate(35deg); }
  .action-arrow { position: absolute; right: 18%; top: 49%; font-size: 2rem; }
  .force-stage { grid-template-columns: 60px 55px 62px; column-gap: 15px; }
  .force-stage strong { grid-column: 1 / -1; }
  .force-arrow { font-size: 2rem; font-weight: 950; }
  .movable-box { width: 56px; height: 56px; border: 4px solid #70553f; border-radius: 7px; background: #d9ad72; }
  .motion-enabled .force-stage[data-action="push"] .movable-box { animation: vocabulary-push 1.4s ease-in-out infinite alternate; }
  .motion-enabled .force-stage[data-action="pull"] .movable-box { animation: vocabulary-pull 1.4s ease-in-out infinite alternate; }

  .door { position: relative; display: block; width: 48px; height: 80px; border: 5px solid #70553f; background: #d9ad72; transform-origin: left center; }
  .door i { position: absolute; width: 7px; height: 7px; border-radius: 50%; right: 6px; top: 36px; background: #70553f; }
  .door--open { transform: perspective(120px) rotateY(-38deg); }
  .motion-enabled .transition-state--to .door--open { animation: vocabulary-door-open 1.5s ease-in-out infinite alternate; }

  .sequence-stage { min-height: 176px; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 10px; padding: 20px; position: relative; }
  .sequence-step { display: grid; place-items: center; gap: 7px; padding: 14px 8px; border-radius: 18px; background: rgba(255,255,255,.82); }
  .sequence-step span { display: grid; place-items: center; width: 35px; height: 35px; border-radius: 50%; background: #7aa6c6; color: #fff; font-weight: 900; }
  .sequence-step strong { font-size: .75rem; }
  .sequence-focus { position: absolute; left: 50%; bottom: 7px; transform: translateX(-50%); font-weight: 900; text-transform: capitalize; }

  .member-group { position: relative; width: 150px; display: flex; justify-content: center; gap: 10px; }
  .member-group i { width: 27px; height: 27px; border-radius: 50%; background: #7aa6c6; border: 3px solid #58758a; }
  .member-group .member-focus { background: #e4a653; transform: scale(1.25); }
  .focus-ring { position: absolute; width: 43px; height: 43px; border: 3px dashed #d07e35; border-radius: 50%; top: 49px; left: calc(50% - 21px); }
  .motion-enabled .focus-ring { animation: vocabulary-focus 1.4s ease-in-out infinite alternate; }

  .comparison-stage { grid-template-columns: 80px auto 80px; }
  .comparison-stage strong { grid-column: 1 / -1; }
  .comparison-pair { display: flex; gap: 7px; }
  .comparison-pair i { width: 30px; height: 30px; border-radius: 7px; background: #7aa6c6; }
  .comparison-pair .different { border-radius: 50%; background: #e4a653; }
  .scene-fallback { min-height: 176px; display: grid; place-items: center; }

  @keyframes vocabulary-travel { from { transform: translateX(-44px); } to { transform: translateX(0); } }
  @keyframes vocabulary-gentle-bob { from { transform: translateY(0); } to { transform: translateY(-5px); } }
  @keyframes vocabulary-focus { from { transform: scale(.94); opacity: .72; } to { transform: scale(1.06); opacity: 1; } }
  @keyframes vocabulary-push { from { transform: translateX(-8px); } to { transform: translateX(14px); } }
  @keyframes vocabulary-pull { from { transform: translateX(12px); } to { transform: translateX(-10px); } }
  @keyframes vocabulary-door-open { from { transform: perspective(120px) rotateY(-12deg); } to { transform: perspective(120px) rotateY(-48deg); } }

  @media (prefers-reduced-motion: reduce) {
    .vocabulary-semantic-scene *, .vocabulary-semantic-scene *::before, .vocabulary-semantic-scene *::after {
      animation-duration: .001ms !important;
      animation-iteration-count: 1 !important;
      scroll-behavior: auto !important;
    }
  }

  @media (max-width: 420px) {
    .contrast-stage, .quantity-stage, .transition-stage { padding: 9px; gap: 5px; }
    .contrast-card, .quantity-group, .transition-state { height: 119px; }
    .target-shape { width: 60px; height: 60px; }
    .contrast-shape { width: 34px; height: 34px; }
  }
</style>
