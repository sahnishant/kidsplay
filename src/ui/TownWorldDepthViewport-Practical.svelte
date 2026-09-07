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

  type PointerDrag = {
    pointerId: number;
    startX: number;
    startY: number;
    dx: number;
    dy: number;
    moved: boolean;
  };

  type AssemblyDrag = PointerDrag & { partId: string };

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
  let assemblyDrag = $state<AssemblyDrag | null>(null);
  let suppressPartClick = $state<string | null>(null);
  let crossingStage = $state(0);
  let parcelPicked = $state(false);
  let parcelDrag = $state<PointerDrag | null>(null);
  let rainDrag = $state<PointerDrag | null>(null);
  let feedback = $state<string | null>(null);
  let stepComplete = $state(false);
  let currentStep = $derived(adventure.steps[stepIndex]);
  let childDisplayName = $derived(childName.trim() || 'Dheu');

  function label(ref: string): string {
    const parts = ref.split('.');
    return (parts[parts.length - 1] ?? ref).replaceAll('-', ' ').replaceAll('_', ' ');
  }

  function partGlyph(ref: string): string {
    if (ref.includes('sign-panel')) return '🚦';
    if (ref.includes('sign-post')) return '┃';
    if (ref.includes('paper')) return '📄';
    if (ref.includes('bottle')) return '🧴';
    if (ref.includes('food-scrap')) return '🍎';
    return '◆';
  }

  function slotLabel(ref: string): string {
    if (ref.includes('sign-top')) return 'sign top';
    if (ref.includes('sign-base')) return 'sign post';
    if (ref.includes('paper-bin')) return 'paper bin';
    if (ref.includes('recycling-bin')) return 'recycling bin';
    if (ref.includes('compost-bin')) return 'compost bin';
    return label(ref);
  }

  function isPlaced(partId: string): boolean {
    return assemblyState.assignments.some((assignment) => assignment.partId === partId);
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

  function nextStep(): void {
    if (!stepComplete) return;
    stepIndex += 1;
    assemblyState = createAssemblyInteractionState();
    selectedPartId = null;
    assemblyDrag = null;
    crossingStage = 0;
    parcelPicked = false;
    parcelDrag = null;
    rainDrag = null;
    feedback = null;
    stepComplete = false;
  }

  function choosePart(partId: string): void {
    if (stepComplete || isPlaced(partId)) return;
    selectedPartId = partId;
    feedback = 'Now put it on the glowing place in the town picture.';
  }

  function chooseSlot(slotId: string): void {
    if (!currentStep?.assembly || !selectedPartId || stepComplete) return;
    const result = commitAssemblyPlacement(currentStep.assembly, assemblyState, {
      partId: selectedPartId,
      slotId
    });
    assemblyState = result.state;
    selectedPartId = null;
    if (result.feedback === 'retry_in_place') feedback = currentStep.scaffold;
    else if (result.feedback === 'complete') finish(currentStep);
    else feedback = 'That fits. Keep going.';
  }

  function beginAssemblyDrag(event: PointerEvent, partId: string): void {
    if (stepComplete || isPlaced(partId)) return;
    assemblyDrag = {
      partId,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      dx: 0,
      dy: 0,
      moved: false
    };
    selectedPartId = partId;
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
  }

  function moveAssemblyDrag(event: PointerEvent): void {
    if (!assemblyDrag || assemblyDrag.pointerId !== event.pointerId) return;
    const dx = event.clientX - assemblyDrag.startX;
    const dy = event.clientY - assemblyDrag.startY;
    assemblyDrag = { ...assemblyDrag, dx, dy, moved: assemblyDrag.moved || Math.hypot(dx, dy) > 8 };
  }

  function endAssemblyDrag(event: PointerEvent): void {
    if (!assemblyDrag || assemblyDrag.pointerId !== event.pointerId) return;
    const ended = assemblyDrag;
    assemblyDrag = null;
    if (!ended.moved) return;
    const target = document.elementsFromPoint(event.clientX, event.clientY)
      .find((element) => element instanceof HTMLElement && element.dataset.townSlot) as HTMLElement | undefined;
    if (target?.dataset.townSlot) chooseSlot(target.dataset.townSlot);
    else feedback = 'Drop it on one of the glowing places.';
    suppressPartClick = ended.partId;
    queueMicrotask(() => {
      if (suppressPartClick === ended.partId) suppressPartClick = null;
    });
  }

  function activatePart(partId: string): void {
    if (suppressPartClick === partId) return;
    choosePart(partId);
  }

  function advanceCrossing(): void {
    if (currentStep?.id !== 'town.l2.step.safe-crossing' || stepComplete) return;
    if (crossingStage === 0) {
      crossingStage = 1;
      feedback = 'They walk to the edge and stop before the road.';
      return;
    }
    if (crossingStage === 1) {
      crossingStage = 2;
      feedback = 'They look left, right, then left again. The road is clear.';
      return;
    }
    crossingStage = 3;
    feedback = 'Now they cross all the way on the zebra crossing.';
    finish(currentStep);
  }

  function beginSimpleDrag(event: PointerEvent): PointerDrag {
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
    return {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      dx: 0,
      dy: 0,
      moved: false
    };
  }

  function moveSimpleDrag(event: PointerEvent, drag: PointerDrag | null): PointerDrag | null {
    if (!drag || drag.pointerId !== event.pointerId) return drag;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    return { ...drag, dx, dy, moved: drag.moved || Math.hypot(dx, dy) > 8 };
  }

  function pickParcel(): void {
    if (currentStep?.id !== 'town.l2.step.pack-help-parcel' || stepComplete) return;
    parcelPicked = true;
    feedback = 'Parcel picked up. Put it on the help table.';
  }

  function placeParcel(): void {
    if (currentStep?.id !== 'town.l2.step.pack-help-parcel' || stepComplete || !parcelPicked) return;
    finish(currentStep);
  }

  function endParcelDrag(event: PointerEvent): void {
    if (!parcelDrag || parcelDrag.pointerId !== event.pointerId) return;
    const ended = parcelDrag;
    parcelDrag = null;
    if (!ended.moved) return;
    const target = document.elementsFromPoint(event.clientX, event.clientY)
      .find((element) => element instanceof HTMLElement && element.dataset.parcelTarget === 'help-table');
    if (target) {
      parcelPicked = true;
      placeParcel();
    } else {
      parcelPicked = true;
      feedback = 'Keep the parcel off the path. Put it on the glowing help table.';
    }
  }

  function clearRain(): void {
    if (currentStep?.id !== 'town.l2.step.clear-rain-channel' || stepComplete) return;
    finish(currentStep);
  }

  function endRainDrag(event: PointerEvent): void {
    if (!rainDrag || rainDrag.pointerId !== event.pointerId) return;
    const ended = rainDrag;
    rainDrag = null;
    if (!ended.moved) return;
    const target = document.elementsFromPoint(event.clientX, event.clientY)
      .find((element) => element instanceof HTMLElement && element.dataset.rainTarget === 'clear-bank');
    if (target) clearRain();
    else feedback = 'Pull the leaves out of the channel and onto the glowing dry bank.';
  }

  function crossingStatus(index: number): 'done' | 'current' | 'next' {
    if (index < crossingStage) return 'done';
    if (index === crossingStage && crossingStage < 3) return 'current';
    return 'next';
  }
</script>

<section class="town-depth" data-world-depth-location="town-square" data-world-depth-level={adventure.level} data-viewport-contract="360x640-scroll-safe" aria-labelledby="town-depth-heading">
  <header class="mission-bar">
    <button type="button" class="back" onclick={onExit} aria-label="Back to Dheu's world">←</button>
    <div class="mission-title"><small>TOWN SQUARE · WORLD MISSION</small><h1 id="town-depth-heading">{adventure.title}</h1></div>
    <div class="mission-count"><strong>{completedCount}/{adventure.steps.length}</strong><span>fixed</span></div>
  </header>

  {#if stepIndex >= adventure.steps.length}
    <main class="completion" aria-live="polite">
      <div class="completion-scene" aria-hidden="true"><span>☀️</span><b>🏘️</b><i>✓</i></div>
      <small>TOWN SQUARE CHANGED</small>
      <h2>{adventure.ending}</h2>
      <p>{mission.successBeat.text.replaceAll('Dheu', childDisplayName)}</p>
      <strong>{adventure.nextStateLabel}</strong>
      <button type="button" class="primary" onclick={onExit}>Back to Dheu's world</button>
    </main>
  {:else if currentStep}
    <nav class="job-rail" aria-label="Town mission jobs">
      {#each adventure.steps as step, index}
        <div class="job" class:done={index < completedCount} class:current={index === stepIndex}>
          <span>{index < completedCount ? '✓' : step.icon}</span><b>{index + 1}</b>
        </div>
      {/each}
    </nav>

    <main class="body">
      <section class="world" aria-label={`Interactive Town Square. ${completedCount} of ${adventure.steps.length} changes complete.`}>
        <div class="scene" data-current-job={stepIndex + 1}>
          <div class="sky" aria-hidden="true"><i class="sun"></i><i class="cloud cloud-a"></i><i class="cloud cloud-b"></i></div>
          <div class="buildings" aria-hidden="true">
            <div class="building building-a"><i></i><i></i><i></i><b>COMMUNITY</b></div>
            <div class="building building-b"><i></i><i></i><b>HELP</b></div>
            <div class="tree tree-a"></div><div class="tree tree-b"></div>
          </div>
          <div class="pavement" aria-hidden="true"></div>
          <div class="road" aria-hidden="true"><div class="zebra"><i></i><i></i><i></i><i></i><i></i></div><div class="lane-line"></div></div>

          <div class="scene-node sign-node" class:active={stepIndex === 0} class:resolved={completedCount > 0}>
            <div class="sign" aria-hidden="true"><i></i><b><span></span><span></span><span></span></b></div>
            <small>{completedCount > 0 ? 'SIGN READY' : 'SIGN LOOSE'}</small>
          </div>

          <div class="scene-node crossing-node" class:active={stepIndex === 1} class:resolved={completedCount > 1} data-crossing-phase={crossingStage}>
            <button type="button" class="walkers" onclick={advanceCrossing} aria-label={crossingStage === 0 ? 'Move to the edge and stop' : crossingStage === 1 ? 'Look both ways' : 'Cross at the zebra crossing'}>
              <i class="walker walker-a"><span></span></i><i class="walker walker-b"><span></span></i><b aria-hidden="true"></b>
            </button>
            {#if crossingStage === 2}<div class="look-cues" aria-hidden="true"><span>←</span><span>→</span></div>{/if}
            <small>{completedCount > 1 ? 'SAFE CROSSING' : crossingStage === 0 ? 'COME TO THE EDGE' : crossingStage === 1 ? 'STOP' : crossingStage === 2 ? 'LOOK BOTH WAYS' : 'CROSSING'}</small>
          </div>

          <div class="scene-node recycle-node" class:active={stepIndex === 2} class:resolved={completedCount > 2}>
            <div class="bins" aria-hidden="true"><i></i><i></i><i></i><span>♻</span></div>
            <small>{completedCount > 2 ? 'SORTED' : 'MIXED UP'}</small>
          </div>

          <div class="scene-node parcel-node" class:active={stepIndex === 3} class:resolved={completedCount > 3}>
            <button type="button" class="help-table" data-parcel-target="help-table" aria-label="Help table. Put the parcel here." aria-disabled={!parcelPicked} onclick={placeParcel}><i></i><b></b></button>
            <button
              type="button"
              class="parcel"
              class:picked={parcelPicked}
              aria-label="Help parcel. Drag it onto the help table."
              style:transform={parcelDrag ? `translate(${parcelDrag.dx}px, ${parcelDrag.dy}px) scale(1.06)` : undefined}
              onpointerdown={(event) => { if (!stepComplete) parcelDrag = beginSimpleDrag(event); }}
              onpointermove={(event) => { parcelDrag = moveSimpleDrag(event, parcelDrag); }}
              onpointerup={endParcelDrag}
              onpointercancel={() => { parcelDrag = null; }}
              onclick={pickParcel}
            >◆</button>
            <small>{completedCount > 3 ? 'PARCEL ON TABLE' : parcelPicked ? 'PUT IT ON THE TABLE' : 'PARCEL ON PATH'}</small>
          </div>

          <div class="scene-node rain-node" class:active={stepIndex === 4} class:resolved={completedCount > 4}>
            <div class="channel" aria-hidden="true"><i></i><i></i><i></i></div>
            {#if completedCount <= 4}
              <button
                type="button"
                class="leaf-blockage"
                aria-label="Leaves blocking the drain. Drag them onto the dry bank."
                style:transform={rainDrag ? `translate(${rainDrag.dx}px, ${rainDrag.dy}px) rotate(-6deg)` : undefined}
                onpointerdown={(event) => { if (!stepComplete) rainDrag = beginSimpleDrag(event); }}
                onpointermove={(event) => { rainDrag = moveSimpleDrag(event, rainDrag); }}
                onpointerup={endRainDrag}
                onpointercancel={() => { rainDrag = null; }}
                onclick={clearRain}
              >❧❧</button>
              <div class="rain-bank-target" data-rain-target="clear-bank" aria-hidden="true">↙</div>
            {:else}
              <div class="cleared-leaves" aria-hidden="true">❧❧</div>
            {/if}
            <small>{completedCount > 4 ? 'WATER FLOWS' : 'DRAIN BLOCKED'}</small>
          </div>

          {#if currentStep.assembly && !stepComplete}
            {#each currentStep.assembly.slots as slot}
              <button
                type="button"
                class={`town-slot town-slot--${slot.slotId.replace('slot.town.', '').replaceAll('.', '-').replaceAll('_', '-')}`}
                class:ready={Boolean(selectedPartId) && !assignedPartFor(slot.slotId)}
                class:filled={Boolean(assignedPartFor(slot.slotId))}
                data-town-slot={slot.slotId}
                aria-label={slotLabel(slot.slotId)}
                onclick={() => chooseSlot(slot.slotId)}
              ><span class="sr-only">{slotLabel(slot.slotId)}</span></button>
            {/each}
          {/if}

          <div class="scene-callout"><span>{currentStep.icon}</span><b>DO IT IN THE TOWN</b></div>
        </div>
      </section>

      <section class="action" class:complete={stepComplete} aria-labelledby="town-action-heading">
        <div class="action-kicker"><span>JOB {stepIndex + 1} OF {adventure.steps.length}</span><b>{currentStep.interactionFamily.replaceAll('_', ' ')}</b></div>
        <div class="action-heading"><span class="action-icon" aria-hidden="true">{currentStep.icon}</span><div><small>MAKE THE SQUARE BETTER</small><h2 id="town-action-heading">{currentStep.title}</h2></div></div>

        {#if currentStep.id === adventure.adaptiveReviewPlan.stepId}
          <div class="review" role="note"><span aria-hidden="true">💡</span><div><small>SCIENTU REMEMBERS</small><p>{review.cue}</p></div></div>
        {/if}

        <div class="instruction"><b>YOUR MOVE</b><span>{currentStep.instruction}</span></div>

        {#if currentStep.assembly && !stepComplete}
          <div class="piece-tray" data-testid="town-assembly" data-first-attempt={assemblyState.firstAttemptCorrect ?? 'pending'}>
            <small>DRAG A PIECE TO THE GLOWING PLACE IN THE PICTURE</small>
            <div class="piece-grid">
              {#each currentStep.assembly.parts as part}
                <button
                  type="button"
                  class="piece-card"
                  class:selected={selectedPartId === part.partId}
                  class:placed={isPlaced(part.partId)}
                  class:dragging={assemblyDrag?.partId === part.partId}
                  disabled={isPlaced(part.partId)}
                  data-part={part.partId}
                  style:transform={assemblyDrag?.partId === part.partId ? `translate(${assemblyDrag.dx}px, ${assemblyDrag.dy}px) scale(1.06)` : undefined}
                  onpointerdown={(event) => beginAssemblyDrag(event, part.partId)}
                  onpointermove={moveAssemblyDrag}
                  onpointerup={endAssemblyDrag}
                  onpointercancel={() => { assemblyDrag = null; }}
                  onclick={() => activatePart(part.partId)}
                ><span aria-hidden="true">{isPlaced(part.partId) ? '✓' : partGlyph(part.partId)}</span><b>{label(part.partId)}</b><small>{isPlaced(part.partId) ? 'Placed' : 'Drag me'}</small></button>
              {/each}
            </div>
          </div>
        {:else if currentStep.id === 'town.l2.step.safe-crossing' && !stepComplete}
          <div class="practical-guide" data-testid="town-guided-sequence">
            <strong>Tap the people in the town picture.</strong>
            {#each currentStep.guidedStages ?? [] as stage, index}
              <div class:done={crossingStatus(index) === 'done'} class:current={crossingStatus(index) === 'current'}><span>{crossingStatus(index) === 'done' ? '✓' : index + 1}</span><b>{stage}</b></div>
            {/each}
          </div>
        {:else if currentStep.id === 'town.l2.step.pack-help-parcel' && !stepComplete}
          <div class="practical-guide parcel-guide"><strong>Move the parcel in the town picture.</strong><p>Drag it onto the help table, or tap the parcel and then the table.</p></div>
        {:else if currentStep.id === 'town.l2.step.clear-rain-channel' && !stepComplete}
          <div class="practical-guide rain-guide"><strong>Clear the actual drain.</strong><p>Drag the leaves onto the dry bank. Water starts moving as soon as the channel is open.</p></div>
        {/if}

        {#if feedback}<div class:success={stepComplete} class="feedback" role="status" aria-live="polite"><span aria-hidden="true">{stepComplete ? '✓' : '●'}</span><strong>{feedback}</strong></div>{/if}
        {#if stepComplete}<button type="button" class="primary next-job" onclick={nextStep}>Next town job <span aria-hidden="true">→</span></button>{/if}
      </section>
    </main>
  {/if}
</section>

<style>
  .town-depth{--ink:#243541;--purple:#6257db;--green:#2f936a;--yellow:#ffd75c;--sky:#dff5ff;height:calc(100dvh - 42px);min-height:520px;display:grid;grid-template-rows:auto auto 1fr;overflow:hidden;background:linear-gradient(135deg,#fff2c9,#eaf8ef);color:var(--ink)}
  .mission-bar{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:10px;padding:9px 13px 6px}.back{width:46px;height:46px;border:1px solid #24354118;border-radius:14px;background:#fff;font:inherit;font-weight:950;font-size:1.1rem}.mission-title small,.action-heading small{font-size:.56rem;font-weight:950;letter-spacing:.08em;color:#5d6c76}.mission-title h1{margin:1px 0 0;font-size:1.02rem}.mission-count{display:grid;place-items:center;min-width:62px;padding:5px 9px;border-radius:13px;background:#fff}.mission-count strong{color:var(--purple)}.mission-count span{font-size:.5rem;font-weight:900;text-transform:uppercase;color:#72808a}
  .job-rail{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;padding:0 13px 8px}.job{display:flex;justify-content:center;align-items:center;gap:5px;min-height:34px;border:1px solid #24354112;border-radius:11px;background:#ffffffad;color:#77838a}.job span{font-size:.9rem}.job b{font-size:.58rem}.job.current{transform:translateY(-2px);border-color:#6257db70;background:#fff;color:var(--ink);box-shadow:0 4px 12px #4c42b51c}.job.current span{animation:job-pop 1.1s ease-in-out infinite}.job.done{background:#e3f7e8;color:#246c4e;border-color:#2f936a38}
  .body{min-height:0;display:grid;grid-template-columns:minmax(0,1.18fr) minmax(365px,.82fr);gap:10px;padding:0 13px 13px;overflow:hidden}.world,.action{min-height:0;border:1px solid #24354113;border-radius:20px;background:#fff;box-shadow:0 8px 26px #24354110;overflow:hidden}.scene{position:relative;height:100%;min-height:330px;overflow:hidden;background:linear-gradient(var(--sky) 0 46%,#dcebc9 46% 59%,#e4ddd1 59% 67%,#66757c 67%)}
  .sky{position:absolute;inset:0 0 54%}.sun{position:absolute;right:9%;top:7%;width:44px;height:44px;border-radius:50%;background:#ffd451;box-shadow:0 0 0 8px #fff3a54d}.cloud,.cloud:before,.cloud:after{position:absolute;border-radius:99px;background:#fff9}.cloud{width:58px;height:16px}.cloud:before,.cloud:after{content:"";position:absolute;bottom:0}.cloud:before{left:8px;width:26px;height:26px}.cloud:after{right:7px;width:20px;height:20px}.cloud-a{left:8%;top:12%}.cloud-b{left:44%;top:20%;transform:scale(.78)}
  .buildings{position:absolute;inset:24% 0 40%;pointer-events:none}.building{position:absolute;bottom:0;border:3px solid #52636c;border-bottom:0;background:#ffd698;box-shadow:inset 0 -15px #efb66d}.building-a{left:5%;width:28%;height:80%;border-radius:11px 11px 0 0}.building-b{right:6%;width:25%;height:66%;background:#ffc1a5;box-shadow:inset 0 -15px #ef977e;border-radius:10px 10px 0 0}.building i{display:inline-block;width:16%;height:25%;margin:16% 4% 0;border:2px solid #61727b;border-radius:4px;background:#def4ff}.building b{position:absolute;left:50%;bottom:5px;transform:translateX(-50%);font-size:.48rem;letter-spacing:.06em}.tree{position:absolute;bottom:0;width:24px;height:52px;border-radius:50% 50% 35% 35%;background:#5da268}.tree:after{content:"";position:absolute;left:10px;top:32px;width:5px;height:23px;background:#77543d}.tree-a{left:36%}.tree-b{right:32%;transform:scale(.8)}.pavement{position:absolute;left:0;right:0;top:59%;height:8%;background:repeating-linear-gradient(90deg,#eae3d7 0 68px,#d1c7b8 68px 71px)}.road{position:absolute;left:0;right:0;bottom:0;height:33%;background:#65747b}.lane-line{position:absolute;left:0;right:0;top:51%;border-top:3px dashed #ead58a}.zebra{position:absolute;left:30%;bottom:0;width:31%;height:100%;display:flex;justify-content:space-evenly;transform:skewX(-8deg);background:#56646b}.zebra i{width:10%;height:100%;background:#f8f7ef}
  .scene-node{position:absolute;z-index:5;display:grid;justify-items:center;gap:2px}.scene-node small{padding:3px 7px;border-radius:99px;background:#293b4bdb;color:#fff;font-size:.48rem;font-weight:950;letter-spacing:.03em;white-space:nowrap}.scene-node.active{z-index:8;filter:drop-shadow(0 0 13px #ffd75c);animation:focus-breathe 1.25s ease-in-out infinite}.scene-node.active small{background:#fff;color:#283640;box-shadow:0 0 0 3px var(--yellow),0 4px 12px #0002}.scene-node.resolved small{background:#267e59;color:#fff}
  .sign-node{left:18%;top:40%}.sign{position:relative;width:42px;height:80px;transform-origin:50% 100%;transform:rotate(-17deg);transition:transform .45s}.sign-node.resolved .sign{transform:rotate(0)}.sign i{position:absolute;left:18px;top:28px;width:7px;height:52px;border-radius:4px;background:#4d5b62}.sign b{position:absolute;left:3px;top:0;width:36px;height:38px;border:4px solid #46545c;border-radius:10px;background:#eef4f4;display:grid;grid-template-columns:repeat(3,1fr);place-items:center}.sign b span{width:8px;height:8px;border-radius:50%;background:#d94c4c}.sign b span:nth-child(2){background:#e5b33c}.sign b span:nth-child(3){background:#48a46e}
  .crossing-node{left:35%;bottom:4%;width:220px;height:94px;pointer-events:none}.walkers{position:absolute;left:0;bottom:25px;width:64px;height:60px;border:0;background:transparent;pointer-events:auto;cursor:pointer;touch-action:manipulation;transition:transform .55s cubic-bezier(.2,.8,.2,1)}.walker{position:absolute;bottom:2px;width:14px;height:32px;border-radius:9px 9px 5px 5px;background:#6358dc;transform-origin:50% 20%}.walker:before{content:"";position:absolute;left:1px;top:-12px;width:12px;height:12px;border-radius:50%;background:#c9815b}.walker span:before,.walker span:after{content:"";position:absolute;bottom:-10px;width:4px;height:14px;border-radius:4px;background:#334957}.walker span:before{left:2px}.walker span:after{right:2px}.walker-a{left:8px}.walker-b{right:8px;background:#2f936a}.walkers b{position:absolute;left:29px;top:18px;width:8px;height:8px;border-radius:50%;background:#f2c84e}.crossing-node[data-crossing-phase="0"] .walkers{transform:translate(-64px,-30px)}.crossing-node[data-crossing-phase="1"] .walkers{transform:translate(0,-30px)}.crossing-node[data-crossing-phase="2"] .walkers{transform:translate(0,-30px)}.crossing-node[data-crossing-phase="2"] .walker:before{animation:head-check .75s ease-in-out infinite alternate}.crossing-node[data-crossing-phase="3"] .walkers,.crossing-node.resolved .walkers{animation:cross-road 1.25s cubic-bezier(.25,.7,.2,1) both}.crossing-node[data-crossing-phase="3"] .walker span:before,.crossing-node[data-crossing-phase="3"] .walker span:after{animation:step-feet .28s ease-in-out infinite alternate}.look-cues{position:absolute;left:0;top:0;width:74px;display:flex;justify-content:space-between;color:#fff;font-size:1.2rem;font-weight:950;text-shadow:0 1px 3px #213540;animation:look-sweep .75s ease-in-out infinite alternate}.crossing-node small{position:absolute;left:0;bottom:0}
  .recycle-node{right:7%;top:46%}.bins{position:relative;width:84px;height:48px;display:flex;align-items:end;gap:4px}.bins i{width:24px;height:35px;border:3px solid #395461;border-radius:5px 5px 8px 8px;background:#72a9dc}.bins i:nth-child(2){background:#63b57c}.bins i:nth-child(3){background:#b4865b}.bins span{position:absolute;left:33px;top:8px;color:#fff;font-size:1rem}.recycle-node:not(.resolved) .bins:after{content:"📄  🧴  🍎";position:absolute;left:-18px;bottom:-15px;font-size:.68rem}.parcel-node{left:6%;bottom:2%;width:105px;height:72px}.help-table{position:absolute;left:0;bottom:17px;width:66px;height:40px;border:0;background:transparent;cursor:pointer}.help-table i{position:absolute;left:0;right:0;top:0;height:9px;border-radius:4px;background:#8e6747}.help-table:before,.help-table:after{content:"";position:absolute;top:8px;width:6px;height:29px;background:#72523d}.help-table:before{left:9px}.help-table:after{right:9px}.parcel{position:absolute;z-index:3;left:71px;bottom:0;width:29px;height:29px;display:grid;place-items:center;border:2px solid #8b5e34;border-radius:5px;background:#d99a57;color:#9a6437;font:inherit;cursor:grab;touch-action:none;transition:left .55s,bottom .55s,transform .25s}.parcel.picked{bottom:8px;box-shadow:0 5px 11px #23354135}.parcel-node.resolved .parcel{left:19px;bottom:43px;transform:rotate(-2deg);animation:parcel-land .62s ease-out}.parcel-node small{position:absolute;left:0;bottom:-5px}.rain-node{right:18%;bottom:1%;width:145px;height:67px}.channel{position:absolute;left:10px;right:0;bottom:18px;height:28px;border:4px solid #91acb4;border-top:0;border-radius:0 0 14px 14px;overflow:hidden;background:#83d2ed}.channel i{position:absolute;left:-110%;width:95%;height:5px;border-radius:99px;background:#eaffff}.channel i:nth-child(1){top:7px}.channel i:nth-child(2){top:15px;animation-delay:.22s}.channel i:nth-child(3){top:21px;animation-delay:.45s}.rain-node.resolved .channel i{animation:water-rush .8s linear infinite}.leaf-blockage{position:absolute;z-index:4;left:55px;bottom:26px;min-width:48px;min-height:44px;border:0;background:transparent;color:#7a693d;font:inherit;font-size:1rem;cursor:grab;touch-action:none}.rain-bank-target{position:absolute;left:-31px;bottom:8px;width:50px;height:46px;display:grid;place-items:center;border:3px dashed #fff5b8;border-radius:14px;background:#fff4aa20;color:#fff6bf;font-size:1.1rem;font-weight:950;animation:target-pulse 1s ease-in-out infinite}.cleared-leaves{position:absolute;left:-20px;bottom:7px;color:#79673c;transform:rotate(-15deg);animation:leaf-clear .55s ease-out}.rain-node small{position:absolute;right:4px;bottom:0}
  .town-slot{position:absolute;z-index:10;min-width:44px;min-height:44px;border:3px dashed #fff0;border-radius:12px;background:#fff0;transition:box-shadow .2s,border-color .2s}.town-slot.ready{border-color:#fff4ad;background:#fff6a525;box-shadow:0 0 0 3px #ffd75c73,0 0 18px #fff0a8;animation:target-pulse 1s ease-in-out infinite}.town-slot.filled{pointer-events:none}.town-slot--sign-top{left:17%;top:38%;width:54px;height:51px}.town-slot--sign-base{left:18%;top:48%;width:50px;height:67px}.town-slot--paper-bin{right:12.7%;top:48%;width:34px;height:54px}.town-slot--recycling-bin{right:9.3%;top:48%;width:34px;height:54px}.town-slot--compost-bin{right:5.8%;top:48%;width:34px;height:54px}.scene-callout{position:absolute;z-index:12;left:12px;top:12px;display:flex;align-items:center;gap:6px;padding:5px 8px;border-radius:99px;background:#6257db;color:#fff;font-size:.53rem;letter-spacing:.05em;box-shadow:0 4px 14px #443ba53d}.scene-callout span{font-size:.88rem}
  .action{display:flex;flex-direction:column;padding:13px;overflow:auto}.action-kicker{display:flex;justify-content:space-between;gap:8px;align-items:center;margin-bottom:7px}.action-kicker span{padding:4px 7px;border-radius:99px;background:#f0edff;color:#493fbd;font-size:.53rem;font-weight:950}.action-kicker b{font-size:.5rem;color:#7a8790;text-transform:uppercase}.action-heading{display:grid;grid-template-columns:46px 1fr;gap:9px;align-items:center;padding-bottom:9px;border-bottom:1px solid #24354110}.action-icon{width:44px;height:44px;display:grid;place-items:center;border-radius:13px;background:#ffe27e;font-size:1.25rem}.action-heading h2{margin:1px 0 0;font-size:1.05rem;line-height:1.1}.review{display:grid;grid-template-columns:28px 1fr;gap:7px;margin-top:9px;padding:8px;border:1px solid #e1c24d55;border-radius:11px;background:#fff9d9}.review small{font-size:.49rem;font-weight:950;color:#806700}.review p{margin:2px 0 0;font-size:.62rem;font-weight:800}.instruction{display:grid;grid-template-columns:auto 1fr;gap:7px;margin:9px 0 8px;padding:8px 9px;border-radius:11px;background:#f7f4ff}.instruction b{height:max-content;padding:3px 5px;border-radius:5px;background:var(--purple);color:#fff;font-size:.49rem}.instruction span{font-size:.67rem;font-weight:780;line-height:1.28}.piece-tray{padding:9px;border:1px solid #24354112;border-radius:13px;background:#fbfcfd}.piece-tray>small{display:block;margin-bottom:7px;font-size:.5rem;font-weight:900;color:#66747e}.piece-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.piece-card{position:relative;z-index:15;min-height:72px;display:grid;grid-template-columns:42px 1fr;grid-template-rows:auto auto;gap:2px 7px;align-items:center;padding:7px;border:2px solid #24354115;border-radius:12px;background:#fff;color:var(--ink);font:inherit;text-align:left;touch-action:none;cursor:grab}.piece-card>span{grid-row:1/3;width:40px;height:40px;display:grid;place-items:center;border-radius:10px;background:#eef3f4;font-size:1.12rem}.piece-card b{font-size:.67rem;text-transform:capitalize}.piece-card small{font-size:.51rem;font-weight:750;color:#7e8a92}.piece-card.selected{border-color:var(--purple);background:#f2efff}.piece-card.placed{border-color:#2f936a40;background:#e3f7e8;opacity:.62}.piece-card.dragging{z-index:30;box-shadow:0 8px 20px #24354135}.practical-guide{display:grid;gap:7px;padding:10px;border-radius:13px;background:#f5faf7}.practical-guide>strong{font-size:.72rem;color:#2c684f}.practical-guide>p{margin:0;font-size:.64rem;line-height:1.3}.practical-guide>div{display:grid;grid-template-columns:32px 1fr;align-items:center;gap:7px;min-height:52px;padding:6px 8px;border:1px solid #24354110;border-radius:11px;background:#fff}.practical-guide>div span{width:29px;height:29px;display:grid;place-items:center;border-radius:50%;background:#e9edf0;font-size:.65rem;font-weight:950}.practical-guide>div b{font-size:.65rem}.practical-guide>div.current{border-color:#6257db70;background:#f7f5ff}.practical-guide>div.current span{background:#6257db;color:#fff;animation:job-pop 1.1s infinite}.practical-guide>div.done{background:#eaf8ed}.practical-guide>div.done span{background:#2f936a;color:#fff}.feedback{display:grid;grid-template-columns:25px 1fr;gap:6px;align-items:center;margin-top:9px;padding:8px 9px;border-radius:11px;background:#eef5fa}.feedback>span{width:24px;height:24px;display:grid;place-items:center;border-radius:50%;background:#d9e8f2}.feedback strong{font-size:.61rem;line-height:1.25}.feedback.success{background:#e3f7e8;color:#245a43}.feedback.success>span{background:#2f936a;color:#fff}.primary{min-height:47px;border:0;border-radius:11px;background:linear-gradient(135deg,#6257db,#4d43bd);color:#fff;font:inherit;font-size:.69rem;font-weight:950}.next-job{margin-top:8px;width:100%}.completion{margin:0 13px 13px;display:grid;align-content:center;justify-items:center;text-align:center;gap:8px;padding:20px;border-radius:22px;background:linear-gradient(145deg,#effceb,#fff8d9)}.completion-scene{position:relative;width:min(420px,90%);height:125px;border-radius:18px;background:linear-gradient(#cceeff 0 60%,#a8d98c 60%);overflow:hidden}.completion-scene span{position:absolute;right:10%;top:10%;font-size:2rem}.completion-scene b{position:absolute;left:18%;bottom:10%;font-size:4rem}.completion-scene i{position:absolute;right:24%;bottom:20%;font-style:normal;font-size:2rem;color:#26875d}.completion h2{max-width:680px;margin:0;font-size:1.18rem}.completion p{max-width:620px;margin:0;font-size:.68rem}.completion>small{font-size:.54rem;font-weight:950;color:#2f936a}.completion .primary{min-width:200px;padding:0 14px}.sr-only{position:absolute!important;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
  @keyframes job-pop{50%{transform:scale(1.09)}}@keyframes focus-breathe{50%{filter:drop-shadow(0 0 19px #ffd75c);transform:scale(1.03)}}@keyframes target-pulse{50%{box-shadow:0 0 0 5px #ffd75c6e,0 0 24px #fff0a8}}@keyframes head-check{from{transform:translateX(-3px)}to{transform:translateX(3px)}}@keyframes look-sweep{to{transform:scaleX(1.16)}}@keyframes cross-road{0%{transform:translate(0,-30px)}35%{transform:translate(44px,-10px)}72%{transform:translate(96px,8px)}100%{transform:translate(145px,23px)}}@keyframes step-feet{from{transform:rotate(-16deg)}to{transform:rotate(16deg)}}@keyframes parcel-land{0%{left:71px;bottom:0;transform:rotate(5deg) scale(1.08)}65%{bottom:52px}100%{left:19px;bottom:43px;transform:rotate(-2deg)}}@keyframes water-rush{to{left:110%}}@keyframes leaf-clear{from{left:55px;bottom:26px;transform:rotate(4deg)}to{left:-20px;bottom:7px;transform:rotate(-15deg)}}
  @media(max-width:900px){.body{grid-template-columns:1fr 1fr}.crossing-node{left:32%;transform:scale(.88);transform-origin:left bottom}.town-slot--paper-bin{right:15%}.town-slot--recycling-bin{right:10.8%}.town-slot--compost-bin{right:6.7%}}
  @media(max-width:650px){.town-depth{height:auto;min-height:calc(100dvh - 42px);overflow:visible}.mission-bar{position:sticky;top:0;z-index:30;padding:6px 8px;background:#fff7dbed;backdrop-filter:blur(8px)}.job-rail{position:sticky;top:58px;z-index:29;padding:3px 8px 6px;background:#fff7dbed;backdrop-filter:blur(8px)}.body{grid-template-columns:1fr;gap:8px;padding:0 8px 10px;overflow:visible}.world,.action{overflow:visible;border-radius:16px}.scene{height:270px;min-height:270px}.building b{display:none}.crossing-node{left:29%;bottom:2%;transform:scale(.72);transform-origin:left bottom}.sign-node{left:15%;top:38%;transform:scale(.82)}.recycle-node{right:4%;top:45%;transform:scale(.8)}.parcel-node{left:4%;bottom:0;transform:scale(.8);transform-origin:left bottom}.rain-node{right:6%;bottom:0;transform:scale(.74);transform-origin:right bottom}.scene-node.active{animation:none;filter:drop-shadow(0 0 13px #ffd75c)}.town-slot--sign-top{left:14%;top:36%}.town-slot--sign-base{left:15%;top:46%}.town-slot--paper-bin{right:16%;top:47%}.town-slot--recycling-bin{right:10%;top:47%}.town-slot--compost-bin{right:4%;top:47%}.action{padding:10px}.piece-card{min-height:62px}.completion{margin:0 8px 10px}}
  @media(max-width:420px){.mission-title small{display:none}.mission-title h1{font-size:.85rem}.mission-bar{grid-template-columns:42px 1fr 54px}.back{width:42px;height:42px}.job-rail{top:54px}.scene{height:238px;min-height:238px}.scene-callout{left:7px;top:7px}.piece-grid{grid-template-columns:1fr 1fr}.piece-card{grid-template-columns:34px 1fr;padding:5px}.piece-card>span{width:32px;height:32px}.piece-card small{display:none}.instruction{grid-template-columns:1fr}.instruction b{width:max-content}}
  @media(prefers-reduced-motion:reduce){.town-depth *{animation:none!important;transition:none!important}.crossing-node[data-crossing-phase="3"] .walkers,.crossing-node.resolved .walkers{transform:translate(145px,23px)}.parcel-node.resolved .parcel{left:19px;bottom:43px;transform:rotate(-2deg)}.rain-node.resolved .channel i{left:15%;opacity:.9}}
</style>
