<script lang="ts">
  import {
    getTownWorldDepthAdventure,
    selectTownAdaptiveReview,
    type TownAdventureStep
  } from '../town/townWorldDepth';
  import {
    commitAssemblyPlacement,
    createAssemblyInteractionState,
    type AssemblyInteractionState
  } from '../mechanics/assemblyInteraction';
  import { loadProgress } from '../runtime/localProgress';
  import type { StoryMission } from '../story/storyTypes';

  let { mission, childName = '', onComplete, onExit }: {
    mission: StoryMission;
    childName?: string;
    onComplete: (sessionId: string) => void;
    onExit: () => void;
  } = $props();

  const progress = loadProgress();
  let adventure = $derived(getTownWorldDepthAdventure(mission.worldActionRef ?? ''));
  let review = $derived(selectTownAdaptiveReview(adventure.adventureRef, progress));
  let stepIndex = $state(0);
  let completedCount = $state(0);
  let assemblyState = $state<AssemblyInteractionState>(createAssemblyInteractionState());
  let selectedPartId = $state<string | null>(null);
  let guidedStageIndex = $state(0);
  let causePhase = $state<'act' | 'observe'>('act');
  let feedback = $state<string | null>(null);
  let stepComplete = $state(false);
  let currentStep = $derived(adventure.steps[stepIndex]);
  let childDisplayName = $derived(childName.trim() || 'Dheu');

  function label(ref: string): string {
    const parts = ref.split('.');
    return (parts[parts.length - 1] ?? ref).replaceAll('-', ' ').replaceAll('_', ' ');
  }
  function placement(step: TownAdventureStep): boolean {
    return step.assembly?.operation === 'place_part_in_slot';
  }
  function partGlyph(ref: string): string {
    if (ref.includes('sign-panel')) return '🚦';
    if (ref.includes('sign-post')) return '▮';
    if (ref.includes('paper')) return '📄';
    if (ref.includes('bottle')) return '🧴';
    if (ref.includes('food-scrap')) return '🍎';
    return '◆';
  }
  function slotGlyph(ref: string): string {
    if (ref.includes('sign-top')) return '⬆';
    if (ref.includes('sign-base')) return '⬇';
    if (ref.includes('paper-bin')) return '🟦';
    if (ref.includes('recycling-bin')) return '♻️';
    if (ref.includes('compost-bin')) return '🟫';
    return '◎';
  }
  function stageGlyph(stage: string): string {
    const lower = stage.toLowerCase();
    if (lower.includes('stop')) return '✋';
    if (lower.includes('look') || lower.includes('check')) return '👀';
    if (lower.includes('cross')) return '🚶';
    if (lower.includes('pick')) return '🙌';
    if (lower.includes('place')) return '📦';
    return '→';
  }
  function assignedPartFor(slotId: string): string | null {
    return assemblyState.assignments.find((assignment) => assignment.slotId === slotId)?.partId ?? null;
  }
  function finish(step: TownAdventureStep): void {
    completedCount = stepIndex + 1;
    stepComplete = true;
    feedback = step.consequence;
    if (completedCount === adventure.steps.length) {
      onComplete(`session.${mission.id}.world-action.v1`);
      stepIndex = adventure.steps.length;
    }
  }
  function choosePart(partId: string): void {
    if (stepComplete) return;
    selectedPartId = partId;
    feedback = placement(currentStep) ? 'Now choose where it belongs.' : 'Now choose the matching place.';
  }
  function chooseSlot(slotId: string): void {
    if (!currentStep?.assembly || !selectedPartId || stepComplete) return;
    const result = commitAssemblyPlacement(currentStep.assembly, assemblyState, { partId: selectedPartId, slotId });
    assemblyState = result.state;
    selectedPartId = null;
    if (result.feedback === 'retry_in_place') feedback = currentStep.scaffold;
    else if (result.feedback === 'complete') finish(currentStep);
    else feedback = placement(currentStep) ? 'That belongs there. Keep sorting.' : 'That piece fits. Keep going.';
  }
  function advanceGuided(): void {
    if (!currentStep?.guidedStages?.length || stepComplete) return;
    if (guidedStageIndex >= currentStep.guidedStages.length - 1) {
      finish(currentStep);
      return;
    }
    guidedStageIndex += 1;
    feedback = `Good. Next: ${currentStep.guidedStages[guidedStageIndex]}`;
  }
  function advanceCause(): void {
    if (!currentStep || stepComplete) return;
    if (causePhase === 'act') {
      causePhase = 'observe';
      feedback = 'The blockage moved. Now watch the water find its path.';
      return;
    }
    finish(currentStep);
  }
  function nextStep(): void {
    if (!stepComplete) return;
    stepIndex += 1;
    assemblyState = createAssemblyInteractionState();
    selectedPartId = null;
    guidedStageIndex = 0;
    causePhase = 'act';
    feedback = null;
    stepComplete = false;
  }
  function isPlaced(partId: string): boolean {
    return assemblyState.assignments.some((assignment) => assignment.partId === partId);
  }
</script>

<section class="town-depth" data-world-depth-location="town-square" data-world-depth-level={adventure.level} data-viewport-contract="360x640-scroll-safe" aria-labelledby="town-depth-heading">
  <header class="mission-bar">
    <button type="button" class="back" onclick={onExit} aria-label="Back to Dheu's world">←</button>
    <div class="mission-title">
      <small>TOWN SQUARE · WORLD MISSION</small>
      <h1 id="town-depth-heading">{adventure.title}</h1>
    </div>
    <div class="mission-count" aria-label={`${completedCount} of ${adventure.steps.length} town jobs complete`}>
      <strong>{completedCount}/{adventure.steps.length}</strong><span>fixed</span>
    </div>
  </header>

  {#if stepIndex >= adventure.steps.length}
    <main class="completion" aria-live="polite">
      <div class="completion-art" aria-hidden="true">
        <span class="completion-sun">☀</span><span class="completion-town">🏘️</span><span class="completion-sparkle">✦</span>
        <div class="completion-road"><i></i><i></i><i></i><i></i></div>
      </div>
      <small>TOWN SQUARE CHANGED</small>
      <h2>{adventure.ending}</h2>
      <p>{mission.successBeat.text.replaceAll('Dheu', childDisplayName)}</p>
      <div class="completion-unlock" role="status"><span aria-hidden="true">✉️</span><strong>{adventure.nextStateLabel}</strong></div>
      <p>The safer Town Square stays this way when you come back.</p>
      <button type="button" class="primary" onclick={onExit}>Back to Dheu's world</button>
    </main>
  {:else if currentStep}
    <nav class="job-rail" aria-label="Town mission jobs">
      {#each adventure.steps as step, index}
        <div class="job" class:done={index < completedCount} class:current={index === stepIndex} aria-current={index === stepIndex ? 'step' : undefined}>
          <span class="job-icon" aria-hidden="true">{index < completedCount ? '✓' : step.icon}</span>
          <span class="job-copy"><b>{index + 1}</b><small>{index < completedCount ? label(step.worldObjectAfter) : label(step.worldObjectBefore)}</small></span>
        </div>
      {/each}
    </nav>

    <main class="body">
      <aside class="world" aria-label={`Illustrated Town Square. ${completedCount} of ${adventure.steps.length} changes complete.`}>
        <div class="scene" data-current-job={stepIndex + 1}>
          <div class="sky"><span class="sun"></span><span class="cloud cloud-a"></span><span class="cloud cloud-b"></span></div>
          <div class="buildings" aria-hidden="true">
            <div class="building building-a"><i></i><i></i><i></i><b>COMMUNITY</b></div>
            <div class="building building-b"><i></i><i></i><b>HELP</b></div>
            <div class="tree tree-a"><i></i></div><div class="tree tree-b"><i></i></div>
          </div>
          <div class="pavement" aria-hidden="true"></div>
          <div class="road" aria-hidden="true"><div class="zebra"><i></i><i></i><i></i><i></i><i></i></div></div>

          <div class="scene-node sign-node" class:active={stepIndex === 0} class:resolved={completedCount > 0} data-scene-problem="crossing-sign">
            <div class="sign" aria-hidden="true"><i></i><b><span></span><span></span><span></span></b></div>
            <small>{completedCount > 0 ? 'SIGN READY' : 'SIGN LOOSE'}</small>
          </div>

          <div class="scene-node crossing-node" class:active={stepIndex === 1} class:resolved={completedCount > 1} data-scene-problem="safe-crossing">
            <div class="walkers" aria-hidden="true"><i></i><i></i><span></span></div>
            <small>{completedCount > 1 ? 'SAFE CROSSING' : 'BUSY CROSSING'}</small>
          </div>

          <div class="scene-node recycle-node" class:active={stepIndex === 2} class:resolved={completedCount > 2} data-scene-problem="recycling">
            <div class="bins" aria-hidden="true"><i></i><i></i><i></i><span>♻</span></div>
            <small>{completedCount > 2 ? 'SORTED' : 'MIXED UP'}</small>
          </div>

          <div class="scene-node parcel-node" class:active={stepIndex === 3} class:resolved={completedCount > 3} data-scene-problem="help-parcel">
            <div class="help-table" aria-hidden="true"><i></i><b></b></div><span class="parcel" aria-hidden="true">◆</span>
            <small>{completedCount > 3 ? 'PARCEL READY' : 'PATH BLOCKED'}</small>
          </div>

          <div class="scene-node rain-node" class:active={stepIndex === 4} class:resolved={completedCount > 4 || (stepIndex === 4 && causePhase === 'observe')} data-scene-problem="rain-channel">
            <div class="channel" aria-hidden="true"><i></i><i></i><span>❧</span><span>❧</span></div>
            <small>{completedCount > 4 || (stepIndex === 4 && causePhase === 'observe') ? 'WATER FLOWS' : 'DRAIN BLOCKED'}</small>
          </div>

          <div class="scene-focus" aria-hidden="true"><span>{currentStep.icon}</span><b>JOB {stepIndex + 1}</b></div>
          <div class="problem-card"><small>WHAT NEEDS HELP?</small><p>{currentStep.prompt}</p></div>
        </div>

        <div class="scientu-line">
          <span class="scientu-avatar" aria-hidden="true">S</span>
          <p><strong>Scientu</strong><span>{adventure.characterSetup.replaceAll('Dheu', childDisplayName)}</span></p>
        </div>
      </aside>

      <section class="action" class:complete={stepComplete} aria-labelledby="town-action-heading">
        <div class="action-kicker"><span>JOB {stepIndex + 1} OF {adventure.steps.length}</span><b>{currentStep.interactionFamily.replaceAll('_', ' ')}</b></div>
        <div class="action-heading"><span class="action-icon" aria-hidden="true">{currentStep.icon}</span><div><small>MAKE THE SQUARE BETTER</small><h2 id="town-action-heading">{currentStep.title}</h2></div></div>

        {#if currentStep.id === adventure.adaptiveReviewPlan.stepId}
          <div class="review" role="note"><span aria-hidden="true">💡</span><div><small>SCIENTU REMEMBERS</small><p>{review.cue}</p></div></div>
        {/if}

        <div class="instruction"><b>YOUR MOVE</b><span>{currentStep.instruction}</span></div>

        {#if currentStep.assembly}
          <div class:placement={placement(currentStep)} class="workbench" data-testid="town-assembly" data-first-attempt={assemblyState.firstAttemptCorrect ?? 'pending'}>
            <div class="tray" aria-label={placement(currentStep) ? 'Things to sort' : 'Pieces'}>
              <div class="workbench-label"><b>{placement(currentStep) ? 'Things to sort' : 'Loose pieces'}</b><span>1 · Tap one</span></div>
              <div class="piece-grid">
                {#each currentStep.assembly.parts as part}
                  <button type="button" class="piece-card" class:selected={selectedPartId === part.partId} class:placed={isPlaced(part.partId)} aria-pressed={selectedPartId === part.partId} disabled={isPlaced(part.partId) || stepComplete} onclick={() => choosePart(part.partId)}>
                    <span class="piece-glyph" aria-hidden="true">{isPlaced(part.partId) ? '✓' : partGlyph(part.partId)}</span>
                    <b>{label(part.partId)}</b>
                    <small>{isPlaced(part.partId) ? 'In place' : selectedPartId === part.partId ? 'Picked up' : 'Tap to pick'}</small>
                  </button>
                {/each}
              </div>
            </div>

            <div class="targets" aria-label={placement(currentStep) ? 'Destinations' : 'Places'}>
              <div class="workbench-label"><b>{placement(currentStep) ? 'Where it belongs' : 'Repair area'}</b><span>2 · Choose a place</span></div>
              <div class="slot-grid">
                {#each currentStep.assembly.slots as slot}
                  <button type="button" class="slot-card" class:ready={Boolean(selectedPartId) && !assignedPartFor(slot.slotId)} class:filled={Boolean(assignedPartFor(slot.slotId))} disabled={!selectedPartId || stepComplete || Boolean(assignedPartFor(slot.slotId))} onclick={() => chooseSlot(slot.slotId)}>
                    <span class="slot-glyph" aria-hidden="true">{assignedPartFor(slot.slotId) ? partGlyph(assignedPartFor(slot.slotId) ?? '') : slotGlyph(slot.slotId)}</span>
                    <b>{assignedPartFor(slot.slotId) ? label(assignedPartFor(slot.slotId) ?? '') : label(slot.slotId)}</b>
                    <small>{assignedPartFor(slot.slotId) ? '✓ fitted' : selectedPartId ? 'Tap to try here' : 'Waiting for a piece'}</small>
                  </button>
                {/each}
              </div>
            </div>
          </div>
        {:else if currentStep.guidedStages?.length}
          <div class="guided" data-testid="town-guided-sequence" aria-label="Action sequence">
            <div class="sequence-path" aria-hidden="true"><span style={`--progress:${Math.max(0, Math.min(100, ((guidedStageIndex + (stepComplete ? 1 : 0)) / currentStep.guidedStages.length) * 100))}%`}></span></div>
            {#each currentStep.guidedStages as stage, index}
              <button type="button" class="sequence-card" class:done={index < guidedStageIndex || stepComplete} class:current={index === guidedStageIndex && !stepComplete} disabled={index !== guidedStageIndex || stepComplete} onclick={advanceGuided}>
                <span class="sequence-number">{index < guidedStageIndex || stepComplete ? '✓' : index + 1}</span>
                <span class="sequence-glyph" aria-hidden="true">{stageGlyph(stage)}</span>
                <b>{stage}</b>
                <small>{index < guidedStageIndex || stepComplete ? 'Done' : index === guidedStageIndex ? 'Tap to do this now' : 'Comes next'}</small>
              </button>
            {/each}
          </div>
        {:else if currentStep.worldAction.family === 'cause_effect' && currentStep.worldAction.stateTransition}
          <div class="cause" data-testid="town-cause-effect" data-phase={causePhase}>
            <div class="cause-scene" class:flowing={causePhase === 'observe' || stepComplete} aria-hidden="true">
              <div class="cause-channel"><span></span><span></span><i>❧</i><i>❧</i><i>❧</i></div>
              <div class="water-arrow">→ → →</div>
            </div>
            <div class="cause-copy"><small>{causePhase === 'act' ? 'BEFORE' : 'AFTER'}</small><strong>{causePhase === 'act' ? label(currentStep.worldAction.stateTransition.beforeStateRef) : label(currentStep.worldAction.stateTransition.afterStateRef)}</strong></div>
            <button type="button" class="cause-action" onclick={advanceCause} disabled={stepComplete}><span aria-hidden="true">{causePhase === 'act' ? '🧹' : '💧'}</span>{causePhase === 'act' ? currentStep.actionLabel : 'Watch the water flow'}</button>
          </div>
        {/if}

        {#if feedback}
          <div class:success={stepComplete} class="feedback" role="status" aria-live="polite"><span aria-hidden="true">{stepComplete ? '✓' : selectedPartId ? '☝' : '💬'}</span><strong>{feedback}</strong></div>
        {/if}
        {#if stepComplete}<button type="button" class="primary next-job" onclick={nextStep}>Next town job <span aria-hidden="true">→</span></button>{/if}
      </section>
    </main>
  {/if}
</section>

<style>
  .town-depth{--navy:#233548;--ink:#22313d;--muted:#637381;--purple:#6358dc;--purple-soft:#eeeaff;--yellow:#ffd85a;--green:#2f8f67;--green-soft:#e2f7e8;--sky:#dff5ff;--cream:#fff8e7;height:calc(100dvh - 42px);min-height:520px;display:grid;grid-template-rows:auto auto 1fr;overflow:hidden;background:linear-gradient(135deg,#fff3cf 0 38%,#e8f8f4 100%);color:var(--ink)}
  .mission-bar{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:10px;padding:10px 14px 7px}.back{width:48px;height:48px;border:1px solid #23354818;border-radius:15px;background:#fff;box-shadow:0 3px 10px #26384c12;font:inherit;font-size:1.15rem;font-weight:900;cursor:pointer}.mission-title small,.action-heading small{font-size:.58rem;font-weight:900;letter-spacing:.08em;color:#52616d}.mission-title h1{margin:1px 0 0;font-size:1.05rem;line-height:1.1}.mission-count{min-width:66px;display:grid;place-items:center;padding:5px 10px;border:1px solid #6358dc25;border-radius:14px;background:#fff9;box-shadow:0 4px 14px #26384c0c}.mission-count strong{font-size:1.05rem;color:var(--purple)}.mission-count span{font-size:.54rem;font-weight:850;text-transform:uppercase;color:var(--muted)}
  .job-rail{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;padding:0 14px 9px}.job{min-width:0;display:flex;align-items:center;gap:7px;padding:6px 8px;border:1px solid #23354812;border-radius:13px;background:#ffffffa8;color:#64717c;transition:transform .2s,background .2s,border-color .2s,box-shadow .2s}.job.current{transform:translateY(-2px);border-color:#6358dc66;background:#fff;box-shadow:0 5px 16px #5148bd18;color:var(--ink)}.job.done{border-color:#2f8f673d;background:var(--green-soft);color:#305d4a}.job-icon{width:28px;height:28px;flex:0 0 auto;display:grid;place-items:center;border-radius:9px;background:#f3f1ec;font-size:.88rem}.job.current .job-icon{background:var(--purple);color:#fff;animation:job-pop 1.4s ease-in-out infinite}.job.done .job-icon{background:var(--green);color:#fff}.job-copy{min-width:0;display:grid;grid-template-columns:auto minmax(0,1fr);align-items:center;gap:4px}.job-copy b{font-size:.58rem}.job-copy small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:.54rem;font-weight:760;text-transform:capitalize}
  .body{min-height:0;display:grid;grid-template-columns:minmax(0,1.18fr) minmax(390px,.82fr);gap:12px;padding:0 14px 14px;overflow:hidden}.world,.action{min-height:0;border:1px solid #23354814;border-radius:22px;background:#fff;box-shadow:0 10px 30px #283b5010;overflow:auto}.world{display:grid;grid-template-rows:minmax(330px,1fr) auto;overflow:hidden}.scene{position:relative;min-height:340px;overflow:hidden;background:linear-gradient(var(--sky) 0 48%,#d9e9c8 48% 60%,#d9d2c5 60% 68%,#65737b 68% 100%)}.sky{position:absolute;inset:0 0 52%}.sun{position:absolute;right:8%;top:8%;width:46px;height:46px;border-radius:50%;background:#ffd451;box-shadow:0 0 0 9px #fff5a455}.cloud,.cloud:before,.cloud:after{position:absolute;height:17px;border-radius:999px;background:#fff9}.cloud{width:60px}.cloud:before,.cloud:after{content:"";bottom:0}.cloud:before{left:9px;width:27px;height:27px}.cloud:after{right:8px;width:22px;height:22px}.cloud-a{left:9%;top:10%}.cloud-b{left:42%;top:20%;transform:scale(.8)}
  .buildings{position:absolute;left:0;right:0;top:25%;height:37%;pointer-events:none}.building{position:absolute;bottom:0;border:3px solid #53636c;border-bottom:0;background:#ffd89b;box-shadow:inset 0 -16px #f3b96b}.building-a{left:5%;width:28%;height:78%;border-radius:12px 12px 0 0}.building-b{right:5%;width:24%;height:64%;background:#ffc2a5;box-shadow:inset 0 -16px #ed957e;border-radius:10px 10px 0 0}.building i{position:relative;display:inline-block;width:16%;height:27%;margin:15% 4% 0;border:2px solid #657680;border-radius:4px;background:#dff5ff}.building b{position:absolute;left:50%;bottom:6px;transform:translateX(-50%);font-size:.5rem;letter-spacing:.08em;color:#4b5860}.tree{position:absolute;bottom:0;width:26px;height:55px;border-radius:50% 50% 35% 35%;background:#62a56d}.tree:after{content:"";position:absolute;left:11px;top:34px;width:5px;height:25px;background:#7b593e}.tree-a{left:36%}.tree-b{right:31%;transform:scale(.78)}.pavement{position:absolute;left:0;right:0;top:60%;height:8%;background:repeating-linear-gradient(90deg,#e9e2d5 0 70px,#d6cbbc 70px 73px)}.road{position:absolute;left:0;right:0;bottom:0;height:32%;background:#64727a}.road:before{content:"";position:absolute;left:0;right:0;top:52%;border-top:3px dashed #e9d98d}.zebra{position:absolute;left:31%;bottom:0;width:29%;height:100%;display:flex;justify-content:space-evenly;transform:skewX(-8deg);background:#55636b}.zebra i{width:10%;height:100%;background:#f6f5ed}
  .scene-node{position:absolute;z-index:4;display:grid;justify-items:center;gap:2px;transition:filter .25s,transform .25s}.scene-node small{padding:3px 7px;border-radius:999px;background:#26384bd9;color:#fff;font-size:.5rem;font-weight:900;letter-spacing:.03em;white-space:nowrap}.scene-node.active{z-index:6;filter:drop-shadow(0 0 12px #ffd85a);animation:scene-focus 1.3s ease-in-out infinite}.scene-node.active small{background:#fff;color:#2e3740;box-shadow:0 0 0 3px var(--yellow),0 4px 12px #0002}.scene-node.resolved small{background:#267d58}.sign-node{left:20%;top:42%}.sign{position:relative;width:44px;height:82px;transform-origin:50% 100%;transform:rotate(-18deg);transition:transform .4s}.sign-node.resolved .sign{transform:rotate(0)}.sign i{position:absolute;left:19px;top:29px;width:7px;height:53px;border-radius:4px;background:#4e5b62}.sign b{position:absolute;left:4px;top:0;width:37px;height:38px;border:4px solid #46545c;border-radius:10px;background:#edf2f3;display:grid;grid-template-columns:repeat(3,1fr);place-items:center}.sign b span{width:8px;height:8px;border-radius:50%;background:#d94c4c}.sign b span:nth-child(2){background:#e5b33c}.sign b span:nth-child(3){background:#48a46e}.crossing-node{left:43%;bottom:8%}.walkers{position:relative;width:58px;height:58px}.walkers i{position:absolute;bottom:3px;width:13px;height:30px;border-radius:9px 9px 5px 5px;background:#6358dc}.walkers i:before{content:"";position:absolute;left:1px;top:-11px;width:11px;height:11px;border-radius:50%;background:#c98059}.walkers i:first-child{left:7px}.walkers i:nth-child(2){right:7px;background:#2f8f67}.walkers span{position:absolute;left:25px;top:20px;width:9px;height:9px;border-radius:50%;background:#f4c84c}.crossing-node.resolved .walkers{transform:translateX(14px)}
  .recycle-node{right:8%;top:48%}.bins{position:relative;width:82px;height:46px;display:flex;align-items:end;gap:4px}.bins i{width:24px;height:35px;border:3px solid #395461;border-radius:5px 5px 8px 8px;background:#72a9dc}.bins i:nth-child(2){background:#63b57c}.bins i:nth-child(3){background:#b4865b}.bins span{position:absolute;left:31px;top:8px;color:#fff;font-size:1rem}.recycle-node:not(.resolved) .bins:after{content:"◆  ◇";position:absolute;left:-15px;bottom:-12px;color:#e97563;font-size:.7rem;transform:rotate(-8deg)}.recycle-node.resolved .bins:after{content:"✓";position:absolute;right:-6px;top:-14px;width:20px;height:20px;display:grid;place-items:center;border-radius:50%;background:#2f8f67;color:#fff;font-weight:900}
  .parcel-node{left:7%;bottom:4%}.help-table{position:relative;width:62px;height:35px}.help-table i{position:absolute;left:0;right:0;top:0;height:8px;border-radius:4px;background:#8e6747}.help-table:before,.help-table:after{content:"";position:absolute;top:7px;width:6px;height:27px;background:#72523d}.help-table:before{left:8px}.help-table:after{right:8px}.parcel{position:absolute;left:55px;bottom:3px;width:24px;height:24px;display:grid;place-items:center;border:2px solid #8b5e34;border-radius:4px;background:#d99a57;color:#9a6437;transition:transform .45s}.parcel-node.resolved .parcel{transform:translate(-43px,-22px)}.rain-node{right:21%;bottom:1%}.channel{position:relative;width:126px;height:24px;border:4px solid #9db7bd;border-top:0;border-radius:0 0 14px 14px;overflow:hidden;background:#8bd5ee}.channel i:first-child{position:absolute;left:-100%;top:7px;width:100%;height:5px;background:#dff8ff;border-radius:99px}.channel i:nth-child(2){position:absolute;left:0;right:0;top:12px;border-top:3px dashed #fff9}.channel span{position:absolute;top:-2px;color:#7a6a3c;font-size:.8rem}.channel span:nth-of-type(1){left:35%}.channel span:nth-of-type(2){left:52%}.rain-node.resolved .channel span{display:none}.rain-node.resolved .channel i:first-child{animation:water-flow 1.2s linear infinite}
  .scene-focus{position:absolute;z-index:7;left:14px;top:14px;display:flex;align-items:center;gap:6px;padding:5px 8px;border-radius:999px;background:#6358dc;color:#fff;box-shadow:0 4px 14px #3c34a83d;font-size:.55rem;letter-spacing:.05em}.scene-focus span{font-size:.9rem}.problem-card{position:absolute;z-index:5;left:14px;bottom:12px;max-width:47%;padding:8px 10px;border-radius:12px;background:#ffffffed;box-shadow:0 5px 16px #26384c18}.problem-card small{font-size:.5rem;font-weight:950;letter-spacing:.06em;color:#6358dc}.problem-card p{margin:2px 0 0;font-size:.63rem;font-weight:750;line-height:1.25}
  .scientu-line{display:grid;grid-template-columns:38px 1fr;gap:8px;align-items:center;padding:8px 11px;border-top:1px solid #23354812;background:#fffdf8}.scientu-avatar{width:35px;height:35px;display:grid;place-items:center;border-radius:50%;background:linear-gradient(145deg,#6f64e6,#4f46bf);color:#fff;font-weight:950;box-shadow:0 3px 9px #6358dc33}.scientu-line p{margin:0;display:grid;gap:1px}.scientu-line strong{font-size:.63rem;color:#443cb0}.scientu-line p span{font-size:.61rem;line-height:1.25;color:#576773}
  .action{display:flex;flex-direction:column;padding:14px;scrollbar-width:thin}.action-kicker{display:flex;justify-content:space-between;gap:8px;align-items:center;margin-bottom:8px}.action-kicker span{padding:4px 7px;border-radius:999px;background:#f0edff;color:#493fbd;font-size:.55rem;font-weight:900;letter-spacing:.04em}.action-kicker b{font-size:.52rem;color:#7a8790;text-transform:uppercase;letter-spacing:.06em}.action-heading{display:grid;grid-template-columns:48px minmax(0,1fr);gap:9px;align-items:center;padding-bottom:9px;border-bottom:1px solid #23354810}.action-icon{width:46px;height:46px;display:grid;place-items:center;border-radius:14px;background:linear-gradient(145deg,#fff0b9,#ffdc65);font-size:1.35rem;box-shadow:inset 0 0 0 2px #dcae2840}.action-heading h2{margin:1px 0 0;font-size:1.08rem;line-height:1.12}.instruction{display:grid;grid-template-columns:auto 1fr;gap:8px;align-items:start;margin:10px 0 8px;padding:9px 10px;border-radius:12px;background:#f7f4ff}.instruction b{padding:3px 5px;border-radius:6px;background:var(--purple);color:#fff;font-size:.51rem;letter-spacing:.05em}.instruction span{font-size:.68rem;font-weight:780;line-height:1.3}.review{display:grid;grid-template-columns:30px 1fr;gap:8px;align-items:start;margin-top:9px;padding:8px 9px;border:1px solid #e3c24b55;border-radius:12px;background:#fff9d9}.review>span{font-size:1rem}.review small{font-size:.5rem;font-weight:900;letter-spacing:.06em;color:#806700}.review p{margin:2px 0 0;font-size:.64rem;font-weight:800;line-height:1.25}
  .workbench{display:grid;grid-template-columns:1fr 1.06fr;gap:8px;min-height:0}.tray,.targets{min-width:0;padding:8px;border:1px solid #23354812;border-radius:14px;background:#fbfcfd}.targets{background:#f7fbf8}.workbench-label{display:flex;justify-content:space-between;gap:5px;align-items:center;margin-bottom:6px}.workbench-label b{font-size:.62rem}.workbench-label span{font-size:.5rem;font-weight:800;color:#77848d}.piece-grid,.slot-grid{display:grid;gap:6px}.piece-card,.slot-card{min-height:64px;width:100%;display:grid;grid-template-columns:42px minmax(0,1fr);grid-template-rows:auto auto;column-gap:7px;align-items:center;padding:7px 8px;border:2px solid #23354812;border-radius:12px;background:#fff;color:var(--ink);font:inherit;text-align:left;cursor:pointer;transition:transform .17s,border-color .17s,box-shadow .17s,background .17s}.piece-card:hover:not(:disabled),.slot-card.ready:hover{transform:translateY(-2px);box-shadow:0 6px 14px #26384c13}.piece-card b,.slot-card b{font-size:.69rem;text-transform:capitalize}.piece-card small,.slot-card small{grid-column:2;font-size:.51rem;font-weight:750;color:#82909a}.piece-glyph,.slot-glyph{grid-row:1/3;width:39px;height:39px;display:grid;place-items:center;border-radius:10px;background:#eef2f4;font-size:1.1rem;font-weight:950;color:#596771}.piece-card.selected{border-color:var(--purple);background:#f2efff;box-shadow:0 0 0 3px #6358dc21}.piece-card.selected .piece-glyph{background:var(--purple);color:#fff;animation:piece-pick .8s ease-in-out infinite alternate}.piece-card.placed,.slot-card.filled{border-color:#2f8f6745;background:var(--green-soft)}.piece-card.placed .piece-glyph,.slot-card.filled .slot-glyph{background:var(--green);color:#fff}.piece-card:disabled{opacity:.72;cursor:default}.slot-card{border-style:dashed}.slot-card.ready{border-style:solid;border-color:#6358dc66;background:#fff;animation:slot-ready 1.3s ease-in-out infinite}.slot-card:disabled:not(.filled){opacity:.56;cursor:default}.placement .piece-glyph{font-size:1.2rem}
  .guided{position:relative;display:grid;gap:7px;padding-left:4px}.sequence-path{position:absolute;left:23px;top:26px;bottom:26px;width:4px;border-radius:99px;background:#e6eaed;overflow:hidden}.sequence-path span{display:block;width:100%;height:var(--progress);background:var(--green);transition:height .35s}.sequence-card{position:relative;z-index:1;min-height:65px;display:grid;grid-template-columns:36px 35px 1fr;grid-template-rows:auto auto;gap:2px 7px;align-items:center;padding:7px 9px;border:2px solid #23354810;border-radius:13px;background:#fff;color:var(--ink);font:inherit;text-align:left}.sequence-number{grid-row:1/3;width:31px;height:31px;display:grid;place-items:center;border-radius:50%;background:#e9edf0;color:#66747e;font-size:.68rem;font-weight:950}.sequence-glyph{grid-row:1/3;width:32px;height:32px;display:grid;place-items:center;border-radius:9px;background:#fff7d8;font-size:1rem}.sequence-card b{font-size:.7rem}.sequence-card small{font-size:.52rem;font-weight:750;color:#89949b}.sequence-card.current{border-color:#6358dc66;background:#f8f6ff;box-shadow:0 4px 14px #6358dc12;cursor:pointer}.sequence-card.current .sequence-number{background:var(--purple);color:#fff;animation:job-pop 1.4s ease-in-out infinite}.sequence-card.done{border-color:#2f8f6730;background:#eef9f1}.sequence-card.done .sequence-number{background:var(--green);color:#fff}.sequence-card:disabled{cursor:default}
  .cause{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center}.cause-scene{grid-column:1/-1;position:relative;height:100px;overflow:hidden;border-radius:14px;background:linear-gradient(#d8efc6 0 56%,#a58c6e 56% 64%,#8bcfe9 64%)}.cause-channel{position:absolute;left:7%;right:7%;bottom:9px;height:29px;border:5px solid #6d8993;border-top:0;border-radius:0 0 15px 15px;background:#8ed9f2;overflow:hidden}.cause-channel span{position:absolute;left:-100%;width:100%;height:6px;top:9px;border-radius:99px;background:#eaffff}.cause-channel span:nth-child(2){top:18px;left:-55%;opacity:.7}.cause-channel i{position:absolute;top:-4px;font-style:normal;color:#796735}.cause-channel i:nth-of-type(1){left:43%}.cause-channel i:nth-of-type(2){left:52%}.cause-channel i:nth-of-type(3){left:61%}.cause-scene.flowing .cause-channel i{display:none}.cause-scene.flowing .cause-channel span{animation:cause-water 1.1s linear infinite}.water-arrow{position:absolute;right:10%;top:23px;color:#2587ad;font-size:1rem;font-weight:950;opacity:.25}.cause-scene.flowing .water-arrow{opacity:1;animation:arrow-drift .9s ease-in-out infinite alternate}.cause-copy{display:grid;padding:7px 9px;border-radius:10px;background:#f2f5f6}.cause-copy small{font-size:.49rem;font-weight:900;color:#7a8790}.cause-copy strong{font-size:.63rem;text-transform:capitalize}.cause-action{min-height:48px;padding:8px 13px;border:0;border-radius:12px;background:var(--purple);color:#fff;font:inherit;font-size:.68rem;font-weight:900;box-shadow:0 5px 14px #5148bd26;cursor:pointer}.cause-action span{margin-right:5px}
  .feedback{display:grid;grid-template-columns:25px 1fr;gap:6px;align-items:center;margin-top:9px;padding:8px 10px;border-radius:12px;background:#eef5fa;color:#40535f}.feedback>span{width:24px;height:24px;display:grid;place-items:center;border-radius:50%;background:#d9e8f2}.feedback strong{font-size:.62rem;line-height:1.28}.feedback.success{background:var(--green-soft);color:#245a43}.feedback.success>span{background:var(--green);color:#fff}.primary{min-height:48px;border:0;border-radius:12px;background:linear-gradient(135deg,#6358dc,#4d43bd);color:#fff;font:inherit;font-size:.7rem;font-weight:900;box-shadow:0 6px 16px #5148bd2b;cursor:pointer}.next-job{margin-top:8px;width:100%;display:flex;align-items:center;justify-content:center;gap:8px}.next-job span{font-size:1rem}
  .completion{align-self:stretch;margin:0 14px 14px;display:grid;align-content:center;justify-items:center;text-align:center;gap:8px;padding:20px;border:1px solid #2f8f6725;border-radius:24px;background:linear-gradient(145deg,#effceb,#fff9df);box-shadow:0 12px 30px #26384c13;overflow:auto}.completion-art{position:relative;width:min(430px,90%);height:150px;overflow:hidden;border-radius:20px;background:linear-gradient(#cceeff 0 57%,#a9d68d 57% 68%,#69767d 68%)}.completion-sun{position:absolute;right:12%;top:12%;font-size:2rem}.completion-town{position:absolute;left:18%;bottom:30%;font-size:4.2rem}.completion-sparkle{position:absolute;left:58%;top:20%;font-size:2rem;color:#e9b71c;animation:job-pop 1.1s ease-in-out infinite}.completion-road{position:absolute;left:30%;bottom:0;width:40%;height:31%;display:flex;justify-content:space-evenly;background:#56636a}.completion-road i{width:12%;height:100%;background:#fff}.completion>small{font-size:.56rem;font-weight:950;letter-spacing:.08em;color:#2f8f67}.completion h2{max-width:720px;margin:0;font-size:1.25rem}.completion p{max-width:650px;margin:0;font-size:.7rem;line-height:1.35}.completion-unlock{display:flex;align-items:center;gap:8px;padding:9px 12px;border-radius:12px;background:#fff;box-shadow:0 4px 12px #26384c10;font-size:.7rem}.completion .primary{min-width:200px;padding:0 16px}
  @keyframes job-pop{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}@keyframes scene-focus{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}@keyframes piece-pick{to{transform:translateY(-3px) rotate(-2deg)}}@keyframes slot-ready{0%,100%{box-shadow:0 0 0 0 #6358dc00}50%{box-shadow:0 0 0 4px #6358dc1c}}@keyframes water-flow{to{left:100%}}@keyframes cause-water{to{left:100%}}@keyframes arrow-drift{to{transform:translateX(8px)}}
  @media(max-width:900px){.body{grid-template-columns:1fr 1fr}.job-copy small{display:none}.job-copy{grid-template-columns:auto}.problem-card{max-width:58%}.workbench{grid-template-columns:1fr}.world{grid-template-rows:minmax(300px,1fr) auto}}
  @media(max-width:650px){.town-depth{height:auto;min-height:calc(100dvh - 42px);overflow:visible}.mission-bar{position:sticky;top:0;z-index:20;padding:7px 8px;background:#fff9dfeb;backdrop-filter:blur(8px)}.mission-count{min-width:55px}.job-rail{position:sticky;top:62px;z-index:19;padding:3px 8px 7px;background:#fff9dfeb;backdrop-filter:blur(8px)}.job{justify-content:center;padding:4px}.job-icon{width:31px;height:31px}.job-copy{display:none}.body{display:grid;grid-template-columns:1fr;gap:8px;padding:0 8px 10px;overflow:visible}.world,.action{overflow:visible;border-radius:17px}.world{grid-template-rows:245px auto}.scene{min-height:245px}.scientu-line{display:none}.problem-card{left:8px;bottom:7px;max-width:63%;padding:6px 7px}.problem-card p{font-size:.57rem}.scene-focus{left:8px;top:8px}.building b{display:none}.sign-node{left:17%;top:39%;transform:scale(.8)}.crossing-node{left:39%;bottom:3%;transform:scale(.82)}.recycle-node{right:5%;top:45%;transform:scale(.8)}.parcel-node{left:5%;bottom:0;transform:scale(.76)}.rain-node{right:11%;bottom:-2%;transform:scale(.72)}.scene-node.active{transform:scale(.9)}.action{padding:10px}.action-heading{grid-template-columns:41px 1fr}.action-icon{width:39px;height:39px}.action-heading h2{font-size:.96rem}.instruction{margin:8px 0 6px}.workbench{grid-template-columns:1fr 1fr}.piece-card,.slot-card{grid-template-columns:34px 1fr;min-height:58px;padding:5px}.piece-glyph,.slot-glyph{width:32px;height:32px}.piece-card small,.slot-card small{display:none}.guided{gap:5px}.sequence-card{min-height:56px}.cause-scene{height:82px}.completion{margin:0 8px 10px}}
  @media(max-width:420px){.mission-title small{display:none}.mission-title h1{font-size:.87rem}.mission-bar{grid-template-columns:42px 1fr 52px}.back{width:42px;height:42px;border-radius:12px}.job-rail{top:56px}.world{grid-template-rows:218px}.scene{min-height:218px}.problem-card{display:none}.workbench{grid-template-columns:1fr}.workbench-label span{font-size:.47rem}.action-kicker b{display:none}.instruction{grid-template-columns:1fr}.instruction b{width:max-content}.sequence-card{grid-template-columns:32px 31px 1fr}.sequence-number{width:28px;height:28px}.sequence-glyph{width:29px;height:29px}.cause{grid-template-columns:1fr}.cause-copy,.cause-action{width:100%}.completion-art{height:125px}.completion-town{font-size:3.4rem}}
  @media(prefers-reduced-motion:reduce){.town-depth *{animation:none!important;transition:none!important}}
</style>
