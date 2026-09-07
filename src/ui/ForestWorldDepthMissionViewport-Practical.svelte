<script lang="ts">
  import { getForestWorldDepthAdventure, type ForestAdventureStep } from '../forest/forestWorldDepth';
  import {
    commitAssemblyPlacement,
    createAssemblyInteractionState,
    type AssemblyInteractionState
  } from '../mechanics/assemblyInteraction';
  import StoryCharacter from '../presentation/StoryCharacter.svelte';
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

  let adventure = $derived(getForestWorldDepthAdventure(mission.worldActionRef ?? ''));
  let quietCreek = $derived(adventure.adventureRef === 'forest.world-depth.l2.creek-rescue');
  let stepIndex = $state(0);
  let completedCount = $state(0);
  let assemblyState = $state<AssemblyInteractionState>(createAssemblyInteractionState());
  let selectedPartId = $state<string | null>(null);
  let assemblyDrag = $state<AssemblyDrag | null>(null);
  let suppressPartClick = $state<string | null>(null);
  let branchPicked = $state(false);
  let branchDrag = $state<PointerDrag | null>(null);
  let wateringCanPicked = $state(false);
  let waterCanDrag = $state<PointerDrag | null>(null);
  let wateredSaplings = $state<number[]>([]);
  let feedback = $state<string | null>(null);
  let stepComplete = $state(false);
  let currentStep = $derived(adventure.steps[stepIndex]);

  function markStepComplete(step: ForestAdventureStep): void {
    completedCount = stepIndex + 1;
    stepComplete = true;
    feedback = step.consequence;
    if (completedCount === adventure.steps.length) {
      onComplete(`session.${mission.id}.world-action.v1`);
      stepIndex = adventure.steps.length;
    }
  }

  function choosePart(partId: string): void {
    if (stepComplete || isPlaced(partId)) return;
    selectedPartId = partId;
    feedback = quietCreek ? 'Now take it to the glowing gap in the creek scene.' : 'Now choose the matching place.';
  }

  function chooseSlot(slotId: string): void {
    if (!currentStep?.assembly || !selectedPartId || stepComplete) return;
    const result = commitAssemblyPlacement(currentStep.assembly, assemblyState, { partId: selectedPartId, slotId });
    assemblyState = result.state;
    selectedPartId = null;
    if (result.feedback === 'retry_in_place') feedback = currentStep.scaffold;
    else if (result.feedback === 'complete') markStepComplete(currentStep);
    else feedback = quietCreek ? 'That fits. Keep repairing the creek.' : 'That piece fits. Keep going.';
  }

  function performWorldAction(): void {
    if (currentStep && !stepComplete) markStepComplete(currentStep);
  }

  function nextStep(): void {
    if (!stepComplete) return;
    stepIndex += 1;
    assemblyState = createAssemblyInteractionState();
    selectedPartId = null;
    assemblyDrag = null;
    branchPicked = false;
    branchDrag = null;
    wateringCanPicked = false;
    waterCanDrag = null;
    wateredSaplings = [];
    feedback = null;
    stepComplete = false;
  }

  function isPlaced(partId: string): boolean {
    return assemblyState.assignments.some((assignment) => assignment.partId === partId);
  }

  function isStepDone(stepId: string): boolean {
    const index = adventure.steps.findIndex((step) => step.id === stepId);
    return index >= 0 && index < completedCount;
  }

  function partLabel(partId: string): string {
    const labels: Record<string, string> = {
      'part.bridge-plank': 'plank',
      'part.bridge-rail': 'rail',
      'part.channel-left': 'left channel',
      'part.channel-right': 'right channel'
    };
    return labels[partId] ?? partId.replace('part.', '').replaceAll('-', ' ');
  }

  function slotLabel(slotId: string): string {
    const labels: Record<string, string> = {
      'slot.bridge-deck': 'missing plank gap',
      'slot.bridge-side': 'missing rail gap',
      'slot.channel-upper': 'upper channel gap',
      'slot.channel-lower': 'lower channel gap'
    };
    return labels[slotId] ?? slotId.replace('slot.', '').replaceAll('-', ' ');
  }

  function beginPointerDrag(event: PointerEvent): PointerDrag {
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
    return { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, dx: 0, dy: 0, moved: false };
  }

  function movePointerDrag(event: PointerEvent, drag: PointerDrag | null): PointerDrag | null {
    if (!drag || drag.pointerId !== event.pointerId) return drag;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    return { ...drag, dx, dy, moved: drag.moved || Math.hypot(dx, dy) > 8 };
  }

  function beginAssemblyDrag(event: PointerEvent, partId: string): void {
    if (stepComplete || isPlaced(partId)) return;
    const drag = beginPointerDrag(event);
    assemblyDrag = { ...drag, partId };
    selectedPartId = partId;
  }

  function moveAssemblyDrag(event: PointerEvent): void {
    if (!assemblyDrag || assemblyDrag.pointerId !== event.pointerId) return;
    const moved = movePointerDrag(event, assemblyDrag);
    if (moved) assemblyDrag = { ...moved, partId: assemblyDrag.partId };
  }

  function endAssemblyDrag(event: PointerEvent): void {
    if (!assemblyDrag || assemblyDrag.pointerId !== event.pointerId) return;
    const ended = assemblyDrag;
    assemblyDrag = null;
    if (!ended.moved) return;
    const slot = document.elementsFromPoint(event.clientX, event.clientY)
      .find((element) => element instanceof HTMLElement && element.dataset.slot) as HTMLElement | undefined;
    if (slot?.dataset.slot) chooseSlot(slot.dataset.slot);
    else feedback = 'Drop it on the glowing matching gap.';
    suppressPartClick = ended.partId;
    queueMicrotask(() => {
      if (suppressPartClick === ended.partId) suppressPartClick = null;
    });
  }

  function activatePart(partId: string): void {
    if (suppressPartClick === partId) return;
    choosePart(partId);
  }

  function pickBranch(): void {
    if (currentStep?.id !== 'forest.l2.step.release-creek' || stepComplete) return;
    branchPicked = true;
    feedback = 'You grabbed the branch. Move it onto the glowing dry bank.';
  }

  function placeBranchOnBank(): void {
    if (currentStep?.id !== 'forest.l2.step.release-creek' || stepComplete || !branchPicked) return;
    markStepComplete(currentStep);
  }

  function endBranchDrag(event: PointerEvent): void {
    if (!branchDrag || branchDrag.pointerId !== event.pointerId) return;
    const ended = branchDrag;
    branchDrag = null;
    if (!ended.moved) return;
    const bank = document.elementsFromPoint(event.clientX, event.clientY)
      .find((element) => element instanceof HTMLElement && element.dataset.branchBank === 'clear');
    branchPicked = true;
    if (bank) placeBranchOnBank();
    else feedback = 'The branch is still over the water. Drag it onto the glowing bank.';
  }

  function pickWateringCan(): void {
    if (currentStep?.id !== 'forest.l2.step.water-saplings' || stepComplete) return;
    wateringCanPicked = true;
    feedback = 'Watering can ready. Take it to one of the dry saplings.';
  }

  function waterSapling(index: number): void {
    if (currentStep?.id !== 'forest.l2.step.water-saplings' || stepComplete || wateredSaplings.includes(index)) return;
    if (!wateringCanPicked && !waterCanDrag?.moved) {
      feedback = 'Pick up the watering can first.';
      return;
    }
    const next = [...wateredSaplings, index];
    wateredSaplings = next;
    wateringCanPicked = false;
    if (next.length === 3) {
      markStepComplete(currentStep);
    } else {
      feedback = `${next.length} of 3 saplings watered. The plant perks up. Water another one.`;
    }
  }

  function endWaterCanDrag(event: PointerEvent): void {
    if (!waterCanDrag || waterCanDrag.pointerId !== event.pointerId) return;
    const ended = waterCanDrag;
    if (!ended.moved) {
      waterCanDrag = null;
      return;
    }
    const target = document.elementsFromPoint(event.clientX, event.clientY)
      .find((element) => element instanceof HTMLElement && element.dataset.saplingTarget !== undefined) as HTMLElement | undefined;
    waterCanDrag = ended;
    if (target?.dataset.saplingTarget !== undefined) {
      wateringCanPicked = true;
      waterSapling(Number(target.dataset.saplingTarget));
    } else {
      feedback = 'Pour the water onto one of the glowing saplings.';
    }
    waterCanDrag = null;
  }

  let bridgeDone = $derived(isStepDone('forest.l2.step.bridge-repair'));
  let creekDone = $derived(isStepDone('forest.l2.step.release-creek'));
  let channelDone = $derived(isStepDone('forest.l2.step.channel-connect'));
  let saplingsDone = $derived(isStepDone('forest.l2.step.water-saplings'));
  let plankVisible = $derived(bridgeDone || (currentStep?.id === 'forest.l2.step.bridge-repair' && isPlaced('part.bridge-plank')));
  let railVisible = $derived(bridgeDone || (currentStep?.id === 'forest.l2.step.bridge-repair' && isPlaced('part.bridge-rail')));
  let channelLeftVisible = $derived(channelDone || (currentStep?.id === 'forest.l2.step.channel-connect' && isPlaced('part.channel-left')));
  let channelRightVisible = $derived(channelDone || (currentStep?.id === 'forest.l2.step.channel-connect' && isPlaced('part.channel-right')));
  let progressNumber = $derived(Math.min(stepIndex + 1, adventure.steps.length));
  let scenePrompt = $derived(
    currentStep?.id === 'forest.l2.step.bridge-repair' ? 'Drag the loose wood into the bridge gaps.'
      : currentStep?.id === 'forest.l2.step.release-creek' ? 'Move the fallen branch out of the water.'
        : currentStep?.id === 'forest.l2.step.channel-connect' ? 'Build the water path to the plants.'
          : currentStep?.id === 'forest.l2.step.water-saplings' ? `Water each sapling. ${wateredSaplings.length}/3 are drinking.`
            : 'Creek rescued!'
  );
</script>

{#if quietCreek}
  <section class="forest-depth quiet-creek" data-forest-level={adventure.level} aria-labelledby="forest-depth-heading">
    <header class="creek-hud">
      <button type="button" class="back creek-back" onclick={onExit} aria-label="Back to Dheu's world">←</button>
      <div class="creek-title"><small>FOREST LEVEL {adventure.level}</small><h1 id="forest-depth-heading">{adventure.title}</h1></div>
      <div class="creek-progress"><strong>{progressNumber}/{adventure.steps.length}</strong><span class="progress-dots" aria-hidden="true">{#each adventure.steps as _, index}<i class:done={index < progressNumber}></i>{/each}</span></div>
    </header>

    <main class="creek-body">
      <section class="creek-scene" data-testid="quiet-creek-scene" aria-label={`Interactive Quiet Creek. ${completedCount} of ${adventure.steps.length} jobs complete.`}>
        <img src="/assets/forest/quiet-creek-scene.svg" alt="" aria-hidden="true" />
        <div class="scene-shade" aria-hidden="true"></div>
        <div class="scientu"><StoryCharacter character="scientu" mood="thinking" motion="point" label="Scientu points to the creek problem" /></div>
        <div class="dheu"><StoryCharacter character="dheu" mood={saplingsDone ? 'celebrate' : 'ready'} motion={saplingsDone ? 'celebrate' : 'help'} label={`${childName.trim() || 'Dheu'} is ready to help`} /></div>
        <div class="speech-bubble">{scenePrompt}</div>

        {#if plankVisible}<div class="scene-plank" data-scene-state="bridge-plank-repaired" aria-hidden="true"></div>{/if}
        {#if railVisible}<div class="scene-rail" data-scene-state="bridge-rail-repaired" aria-hidden="true"><i></i><i></i><i></i></div>{/if}
        {#if creekDone}<div class="flow-lines" data-scene-state="creek-flowing" aria-hidden="true"><i></i><i></i><i></i><i></i><b>➜</b></div>{/if}
        {#if channelLeftVisible}<div class="channel-piece channel-piece--left" data-scene-state="channel-left-connected" aria-hidden="true"></div>{/if}
        {#if channelRightVisible}<div class="channel-piece channel-piece--right" data-scene-state="channel-right-connected" aria-hidden="true"></div>{/if}
        {#if saplingsDone}<div class="healthy-plants" data-scene-state="saplings-watered" aria-hidden="true">🌱🌿🌱</div><div class="forest-return" aria-hidden="true">🐸 🦋</div>{/if}

        {#if currentStep?.id === 'forest.l2.step.release-creek' && !stepComplete}
          <button
            type="button"
            class="fallen-branch branch-action"
            class:picked={branchPicked}
            aria-label="Fallen branch. Drag it out of the creek and onto the dry bank."
            style:transform={branchDrag ? `translate(${branchDrag.dx}px, ${branchDrag.dy}px) rotate(9deg)` : undefined}
            onpointerdown={(event) => { branchDrag = beginPointerDrag(event); }}
            onpointermove={(event) => { branchDrag = movePointerDrag(event, branchDrag); }}
            onpointerup={endBranchDrag}
            onpointercancel={() => { branchDrag = null; }}
            onclick={pickBranch}
          ><span aria-hidden="true"></span></button>
          <button type="button" class="branch-bank-target" data-branch-bank="clear" aria-label="Dry bank. Put the branch here." aria-disabled={!branchPicked} onclick={placeBranchOnBank}>↙</button>
        {:else if !creekDone}
          <div class="fallen-branch" aria-hidden="true"><span></span></div>
        {:else}
          <div class="fallen-branch cleared-branch" aria-hidden="true"><span></span></div>
        {/if}

        {#if currentStep?.assembly && !stepComplete}
          {#each currentStep.assembly.slots as slot}
            <button
              type="button"
              class={`slot-target slot-target--${slot.slotId.replace('slot.', '').replaceAll('.', '-').replaceAll('_', '-').replaceAll('/', '-')}`}
              class:slot-ready={Boolean(selectedPartId)}
              data-slot={slot.slotId}
              onclick={() => chooseSlot(slot.slotId)}
              aria-label={slotLabel(slot.slotId)}
            ><span class="sr-only">{slotLabel(slot.slotId)}</span></button>
          {/each}
        {/if}

        {#if currentStep?.id === 'forest.l2.step.water-saplings' && !stepComplete}
          <button
            type="button"
            class="watering-can"
            class:picked={wateringCanPicked}
            aria-label="Watering can. Drag it to each dry sapling."
            style:transform={waterCanDrag ? `translate(${waterCanDrag.dx}px, ${waterCanDrag.dy}px) rotate(-8deg)` : undefined}
            onpointerdown={(event) => { waterCanDrag = beginPointerDrag(event); }}
            onpointermove={(event) => { waterCanDrag = movePointerDrag(event, waterCanDrag); }}
            onpointerup={endWaterCanDrag}
            onpointercancel={() => { waterCanDrag = null; }}
            onclick={pickWateringCan}
          ><span class="can-art" aria-hidden="true"><i></i><b></b></span></button>
          {#each [0, 1, 2] as sapling}
            <button
              type="button"
              class={`sapling-target sapling-target--${sapling + 1}`}
              class:watered={wateredSaplings.includes(sapling)}
              data-sapling-target={sapling}
              aria-label={`Sapling ${sapling + 1}${wateredSaplings.includes(sapling) ? ', watered' : ', dry'}`}
              disabled={wateredSaplings.includes(sapling)}
              onclick={() => waterSapling(sapling)}
            ><span aria-hidden="true">🌱</span><i aria-hidden="true">•••</i></button>
          {/each}
        {/if}
      </section>

      <section class:complete-tray={stepIndex >= adventure.steps.length} class="creek-tray" aria-labelledby="forest-action-heading">
        {#if stepIndex >= adventure.steps.length}
          <div class="finish-copy" aria-live="polite"><strong id="forest-action-heading">Creek rescued!</strong><span>{adventure.ending}</span><b>{adventure.nextStateLabel}</b></div>
          <button type="button" class="primary creek-primary" onclick={onExit}>Back to the Forest</button>
        {:else if currentStep}
          <div class="action-copy"><small>ACTION {stepIndex + 1} OF {adventure.steps.length}</small><h2 id="forest-action-heading">{currentStep.title}</h2><p>{currentStep.instruction}</p></div>

          {#if stepComplete}
            <div class="step-result"><span class="success-mark" aria-hidden="true">✓</span><span class="feedback success" role="status" aria-live="polite">{feedback}</span></div>
            <button type="button" class="primary creek-primary" onclick={nextStep}>Next</button>
          {:else if currentStep.assembly}
            <div class="piece-row" data-testid="forest-assembly" data-first-attempt={assemblyState.firstAttemptCorrect ?? 'pending'} aria-label="Pieces to place">
              {#each currentStep.assembly.parts as part}
                <button
                  type="button"
                  class:selected={selectedPartId === part.partId}
                  class:placed={isPlaced(part.partId)}
                  class:dragging={assemblyDrag?.partId === part.partId}
                  class={`piece-card piece-card--${part.partId.replace('part.', '').replaceAll('.', '-').replaceAll('_', '-').replaceAll('/', '-')}`}
                  disabled={isPlaced(part.partId)}
                  data-part={part.partId}
                  style:transform={assemblyDrag?.partId === part.partId ? `translate(${assemblyDrag.dx}px, ${assemblyDrag.dy}px) scale(1.04)` : undefined}
                  onpointerdown={(event) => beginAssemblyDrag(event, part.partId)}
                  onpointermove={moveAssemblyDrag}
                  onpointerup={endAssemblyDrag}
                  onpointercancel={() => { assemblyDrag = null; }}
                  onclick={() => activatePart(part.partId)}
                ><span class="piece-art" aria-hidden="true"><i></i><i></i><i></i></span><b>{isPlaced(part.partId) ? '✓ ' : ''}{partLabel(part.partId)}</b></button>
              {/each}
            </div>
          {:else if currentStep.id === 'forest.l2.step.release-creek'}
            <div class="scene-task-hint"><strong>Move the branch in the creek picture.</strong><span>Drag it onto the glowing bank, or tap the branch and then the bank.</span></div>
          {:else if currentStep.id === 'forest.l2.step.water-saplings'}
            <div class="scene-task-hint"><strong>Water the plants in the creek picture.</strong><span>Take the watering can to all three saplings. Each one visibly perks up.</span></div>
          {:else}
            <button type="button" class="world-action creek-action" onclick={performWorldAction}>{currentStep.actionLabel}</button>
          {/if}
          {#if feedback && !stepComplete}<div class="feedback" role="status" aria-live="polite">{feedback}</div>{/if}
        {/if}
      </section>
    </main>
  </section>
{:else}
  <section class="forest-depth" data-forest-level={adventure.level} aria-labelledby="forest-depth-heading">
    <header>
      <button type="button" class="back" onclick={onExit} aria-label="Back to Dheu's world">←</button>
      <div><small>FOREST LEVEL {adventure.level} · WORLD MISSION</small><h1 id="forest-depth-heading">{adventure.title}</h1></div>
    </header>

    {#if stepIndex >= adventure.steps.length}
      <main class="completion" aria-live="polite">
        <div aria-label="Persistent Forest consequence"><span aria-hidden="true">🌳✨</span><strong>{adventure.ending}</strong></div>
        <p>{mission.successBeat.text.replaceAll('Dheu', childName.trim() || 'Dheu')}</p>
        <div role="status"><strong>{adventure.nextStateLabel}</strong></div>
        <button type="button" class="primary" onclick={onExit}>Back to Dheu's world</button>
      </main>
    {:else if currentStep}
      <main class="body">
        <aside class="world" aria-label={`Forest world state. ${completedCount} of ${adventure.steps.length} changes complete.`}>
          <div class="problem"><small>WORLD PROBLEM</small><p>{adventure.worldProblem}</p></div>
          <div class="objects">{#each adventure.steps as step, index}<div class:changed={index < completedCount} class="object"><span aria-hidden="true">{step.icon}</span><small>{index < completedCount ? step.worldObjectAfter : step.worldObjectBefore}</small></div>{/each}</div>
          <p class="character-line"><strong>Scientu:</strong> {adventure.characterSetup}</p>
        </aside>
        <section class="action" aria-labelledby="forest-action-heading">
          <small>ACTION {stepIndex + 1} OF {adventure.steps.length} · {currentStep.interactionFamily.replaceAll('_', ' ')}</small>
          <h2 id="forest-action-heading">{currentStep.icon} {currentStep.title}</h2>
          <p>{currentStep.prompt}</p><p><strong>{currentStep.instruction}</strong></p>
          {#if currentStep.assembly}
            <div class="assembly" data-testid="forest-assembly" data-first-attempt={assemblyState.firstAttemptCorrect ?? 'pending'}>
              <div>{#each currentStep.assembly.parts as part}<button type="button" class:selected={selectedPartId === part.partId} class:placed={isPlaced(part.partId)} disabled={isPlaced(part.partId) || stepComplete} onclick={() => choosePart(part.partId)}>{isPlaced(part.partId) ? '✓ ' : ''}{partLabel(part.partId)}</button>{/each}</div>
              <div>{#each currentStep.assembly.slots as slot}<button type="button" disabled={!selectedPartId || stepComplete} onclick={() => chooseSlot(slot.slotId)}>{slotLabel(slot.slotId)}</button>{/each}</div>
            </div>
          {:else}
            <button type="button" class="world-action" onclick={performWorldAction} disabled={stepComplete}>{currentStep.actionLabel}</button>
          {/if}
          {#if feedback}<div class:success={stepComplete} class="feedback" role="status" aria-live="polite">{feedback}</div>{/if}
          {#if stepComplete}<button type="button" class="primary" onclick={nextStep}>Next forest job</button>{/if}
        </section>
      </main>
    {/if}
  </section>
{/if}

<style>
  .forest-depth{height:calc(100dvh - 42px);display:grid;grid-template-rows:auto 1fr;gap:5px;overflow:hidden}.forest-depth>header{display:flex;align-items:center;gap:6px;padding:5px}.forest-depth h1,.action h2{margin:2px 0;font-size:1rem}.forest-depth small{font-size:.58rem}.back,.assembly button,.world-action,.primary,.piece-card,.slot-target,.branch-action,.branch-bank-target,.watering-can,.sapling-target{min-width:44px;min-height:44px;border:0;font:inherit}.body{min-height:0;display:grid;grid-template-columns:1fr 1.2fr;gap:5px;overflow:hidden}.world,.action,.completion{min-height:0;overflow:auto;padding:8px}.objects{display:grid;grid-template-columns:1fr 1fr;gap:5px}.object{display:grid;place-items:center;text-align:center;padding:4px;background:#f1e9d8}.object.changed,.placed,.feedback.success{background:#def2dc}.action{display:flex;flex-direction:column}.forest-depth p{margin:3px 0;font-size:.7rem;line-height:1.3}.assembly{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:7px 0}.assembly>div{display:grid;gap:5px}.selected{outline:3px solid #5680b7}.feedback{padding:5px 8px;font-size:.7rem}.completion{display:grid;align-content:center;justify-items:center;text-align:center;gap:8px}
  .quiet-creek{background:#dfeecd}.creek-hud{z-index:5;display:grid!important;grid-template-columns:46px 1fr auto;gap:7px!important;padding:5px 7px!important;background:#f8f3dc;border-bottom:1px solid #c9d7a3}.creek-back{border-radius:50%;background:#fff;color:#246ba1;font-size:1.35rem;font-weight:900;box-shadow:0 2px 6px #264a3930}.creek-title{min-width:0}.creek-title h1{margin:0!important;font-size:.98rem!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.creek-title small{font-weight:900;color:#54703d}.creek-progress{display:grid;justify-items:center;align-content:center;min-width:58px;padding:4px 7px;border-radius:14px;background:#fff}.creek-progress strong{font-size:.76rem;color:#4f8a38}.progress-dots{display:flex;gap:3px}.progress-dots i{width:7px;height:7px;border-radius:50%;background:#cad4d7}.progress-dots i.done{background:#f1ba3c}.creek-body{min-height:0;display:grid;grid-template-rows:minmax(0,1fr) auto;gap:5px;padding:0 5px 5px}.creek-scene{position:relative;min-height:0;overflow:hidden;border-radius:18px;background:#8ecfe2;box-shadow:0 2px 9px #25442e35}.creek-scene>img{width:100%;height:100%;display:block;object-fit:cover}.scene-shade{position:absolute;inset:0;background:linear-gradient(#0000 75%,#173b2317);pointer-events:none}.scientu,.dheu{position:absolute;z-index:3;filter:drop-shadow(0 3px 3px #263c2d38)}.scientu{left:10px;top:48px;width:91px;height:91px}.dheu{right:9px;top:75px;width:84px;height:84px}.speech-bubble{position:absolute;z-index:4;top:12px;left:87px;width:min(44%,190px);padding:8px 11px;border-radius:18px;background:#fffdf1f2;font-size:.71rem;line-height:1.17;font-weight:900;color:#254d3b;box-shadow:0 3px 8px #32453422}
  .scene-plank{position:absolute;z-index:4;left:45.1%;top:50.4%;width:10.2%;height:5.2%;border-radius:4px;background:linear-gradient(90deg,#8f5a31,#c48247 48%,#925a31);box-shadow:inset 0 -3px #6a4026,0 2px 2px #3f2c2130}.scene-rail{position:absolute;z-index:4;left:55.5%;top:42.3%;width:16.5%;height:10%;border-top:5px solid #c59a63;border-radius:50%;transform:rotate(-8deg)}.scene-rail i{position:absolute;top:-5px;width:5px;height:30px;border-radius:3px;background:#86552f}.scene-rail i:nth-child(1){left:2px}.scene-rail i:nth-child(2){left:52%}.scene-rail i:nth-child(3){right:2px}.fallen-branch{position:absolute;z-index:7;left:36%;top:67.5%;width:31%;height:5.5%;transform:rotate(9deg);border-radius:15px;background:linear-gradient(#805132,#653d27);box-shadow:inset 0 -3px #4f301f,0 2px 4px #23341f28}.fallen-branch span:before,.fallen-branch span:after{content:"";position:absolute;width:26%;height:6px;border-radius:7px;background:#72462c}.fallen-branch span:before{left:12%;top:-5px;transform:rotate(-34deg)}.fallen-branch span:after{right:11%;bottom:-5px;transform:rotate(34deg)}.branch-action{cursor:grab;touch-action:none;outline:4px solid #fff4a0c9;outline-offset:4px;animation:branch-nudge 1.45s ease-in-out infinite}.branch-action.picked{box-shadow:0 8px 18px #2d321d55;outline-color:#ffd343}.branch-bank-target{position:absolute;z-index:8;left:16%;top:72%;width:18%;height:17%;border:4px dashed #fff1a0;border-radius:18px;background:#fff6a323;color:#fff4b5;font-size:1.3rem;font-weight:950;cursor:pointer;animation:bank-pulse 1s ease-in-out infinite}.cleared-branch{left:18%;top:78%;transform:rotate(-14deg);opacity:.95;animation:branch-to-bank .72s cubic-bezier(.2,.8,.2,1)}
  .flow-lines{position:absolute;z-index:5;left:40%;top:57%;width:25%;height:38%;pointer-events:none;filter:drop-shadow(0 0 3px #d7fbff)}.flow-lines i{position:absolute;left:-20%;width:115%;height:5px;border-radius:50%;background:#e8fcff;opacity:.92;animation:water-run .78s linear infinite}.flow-lines i:nth-child(1){top:10%;transform:rotate(84deg)}.flow-lines i:nth-child(2){top:37%;transform:rotate(81deg);animation-delay:.15s}.flow-lines i:nth-child(3){top:64%;transform:rotate(78deg);animation-delay:.3s}.flow-lines i:nth-child(4){top:86%;transform:rotate(75deg);animation-delay:.45s}.flow-lines b{position:absolute;right:-18%;bottom:5%;color:#e9fdff;font-size:1.7rem;animation:stream-arrow .7s ease-in-out infinite alternate}.channel-piece{position:absolute;z-index:4;width:12%;height:4.5%;border-radius:50%;background:#55c4e5;box-shadow:inset 0 3px #c9f4ff}.channel-piece--left{left:69%;top:72%;transform:rotate(27deg)}.channel-piece--right{left:79%;top:79%;transform:rotate(34deg)}.healthy-plants{position:absolute;z-index:6;left:4%;top:66%;font-size:1.55rem;letter-spacing:-4px;filter:drop-shadow(0 2px 2px #30472d40);animation:plants-rise .55s ease-out}.forest-return{position:absolute;z-index:6;right:7%;bottom:10%;font-size:1.25rem;animation:pop .5s ease-out}
  .slot-target{position:absolute;z-index:9;background:transparent;border:3px dashed transparent;border-radius:8px;box-shadow:none;transition:border-color .16s,box-shadow .16s,background .16s}.slot-target.slot-ready{border-color:#fff5a9;background:#fff9cf20;box-shadow:0 0 0 3px #fff2a277,0 0 18px #fff0a9;animation:gap-breathe 1s ease-in-out infinite}.slot-target--bridge-deck{left:44.1%;top:47.7%;width:12.4%;height:11.5%}.slot-target--bridge-side{left:54.2%;top:38.7%;width:20%;height:15%;transform:rotate(-8deg);border-radius:18px}.slot-target--channel-upper{left:66.5%;top:68.5%;width:17%;height:10%;border-radius:50%}.slot-target--channel-lower{left:77%;top:75.5%;width:17%;height:10%;border-radius:50%}
  .watering-can{position:absolute;z-index:11;left:30%;top:76%;width:62px;height:54px;border-radius:14px;background:#fff9d8dd;cursor:grab;touch-action:none;outline:3px solid #fff5a8;box-shadow:0 4px 12px #233a2940}.watering-can.picked{outline-color:#ffd343;transform:translateY(-6px)}.can-art{position:relative;display:block;width:42px;height:28px;margin:auto;border-radius:6px 6px 11px 11px;background:#5ca7c8;border:3px solid #376f88}.can-art:before{content:"";position:absolute;left:-13px;top:-4px;width:18px;height:20px;border:4px solid #376f88;border-right:0;border-radius:14px 0 0 14px}.can-art:after{content:"";position:absolute;right:-20px;top:7px;width:24px;height:7px;border-radius:0 8px 8px 0;background:#5ca7c8;transform:rotate(-17deg);transform-origin:left}.sapling-target{position:absolute;z-index:10;width:58px;height:58px;border:3px dashed #fff2a2;border-radius:50%;background:#fff3a41e;cursor:pointer;box-shadow:0 0 14px #fff4aa7a;animation:sapling-pulse 1.1s ease-in-out infinite}.sapling-target span{display:block;font-size:1.35rem;filter:grayscale(.45);transition:transform .3s,filter .3s}.sapling-target i{position:absolute;left:50%;top:5px;transform:translateX(-50%);font-style:normal;color:#92dcf4;opacity:0}.sapling-target.watered{border-style:solid;border-color:#7ed37b;background:#dff6caa6;box-shadow:0 0 14px #8ae37d66;animation:none}.sapling-target.watered span{transform:scale(1.35) translateY(-5px);filter:none}.sapling-target.watered i{opacity:1;animation:drops .65s ease-out}.sapling-target--1{left:3%;top:65%}.sapling-target--2{left:12%;top:72%}.sapling-target--3{left:21%;top:65%}
  .creek-tray{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px;align-items:center;min-height:112px;padding:7px 9px;border-radius:17px;background:#fffdf0;box-shadow:0 1px 6px #32452e30}.action-copy{min-width:0}.action-copy small{font-weight:900;color:#55773e}.action-copy h2{margin:0;font-size:.88rem}.action-copy p{margin:2px 0 0;font-size:.66rem}.piece-row{grid-column:1/-1;display:grid;grid-template-columns:1fr 1fr;gap:7px}.piece-card{position:relative;z-index:12;display:grid;grid-template-columns:62px 1fr;align-items:center;gap:5px;padding:5px 9px;border:2px solid #b6d4c1;border-radius:14px;background:#f5fbef;color:#35443a;font-size:.72rem;font-weight:900;touch-action:none;user-select:none;box-shadow:0 2px 6px #28462c20}.piece-card:not(.placed):not(.selected){animation:piece-invite 2s ease-in-out infinite}.piece-card.selected{outline:3px solid #f1ba3c;background:#fff8d8}.piece-card.placed{opacity:.48}.piece-card.dragging{z-index:30;box-shadow:0 8px 18px #17382455;animation:none}.piece-art{position:relative;display:block;width:58px;height:30px}.piece-card--bridge-plank .piece-art{height:18px;border-radius:4px;background:linear-gradient(90deg,#8f5a31,#c98649,#8f5a31);box-shadow:inset 0 -3px #684127}.piece-card--bridge-rail .piece-art{border-top:5px solid #c59a63;border-radius:50%}.piece-card--bridge-rail .piece-art i{position:absolute;top:-2px;width:5px;height:28px;border-radius:3px;background:#875831}.piece-card--bridge-rail .piece-art i:nth-child(1){left:4px}.piece-card--bridge-rail .piece-art i:nth-child(2){left:27px}.piece-card--bridge-rail .piece-art i:nth-child(3){right:4px}.piece-card--channel-left .piece-art,.piece-card--channel-right .piece-art{height:16px;border-radius:50%;background:#55c4e5;box-shadow:inset 0 3px #caf6ff}.piece-card--channel-left .piece-art{transform:rotate(20deg)}.piece-card--channel-right .piece-art{transform:rotate(-20deg)}.scene-task-hint{grid-column:1/-1;display:grid;gap:2px;padding:8px 10px;border-radius:12px;background:#eaf6df;color:#315839}.scene-task-hint strong{font-size:.72rem}.scene-task-hint span{font-size:.62rem}.creek-primary{min-width:74px;border-radius:13px;background:#4f9341;color:#fff;font-weight:900;padding:7px 12px}.step-result{display:flex;align-items:center;gap:5px;min-width:0}.success-mark{display:grid;place-items:center;width:32px;height:32px;border-radius:50%;background:#5aa34b;color:#fff;font-weight:1000}.finish-copy{display:grid;gap:2px;font-size:.67rem}.finish-copy strong{font-size:1rem;color:#39743b}.finish-copy b{color:#6a6b23}.complete-tray{min-height:96px}.sr-only{position:absolute!important;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
  @keyframes gap-breathe{50%{box-shadow:0 0 0 4px #fff0a488,0 0 22px #fff1a9bb}}@keyframes piece-invite{0%,78%,100%{transform:translateY(0)}84%{transform:translateY(-3px) rotate(-.7deg)}90%{transform:translateY(0) rotate(.7deg)}}@keyframes branch-nudge{0%,66%,100%{transform:rotate(9deg) translateX(0)}76%{transform:rotate(5deg) translateX(-7px)}88%{transform:rotate(13deg) translateX(7px)}}@keyframes bank-pulse{50%{box-shadow:0 0 0 5px #fff0a34f,0 0 22px #fff1a4aa}}@keyframes branch-to-bank{from{left:36%;top:67.5%;transform:rotate(9deg)}to{left:18%;top:78%;transform:rotate(-14deg)}}@keyframes water-run{0%{opacity:.25;translate:0 -9px}45%{opacity:1}100%{opacity:.25;translate:0 12px}}@keyframes stream-arrow{to{transform:translate(10px,8px)}}@keyframes sapling-pulse{50%{box-shadow:0 0 0 5px #fff1a04c,0 0 20px #fff1a0a6}}@keyframes drops{from{transform:translate(-50%,-12px);opacity:1}to{transform:translate(-50%,9px);opacity:.1}}@keyframes plants-rise{from{transform:scale(.6);opacity:.4}}@keyframes pop{from{transform:scale(.5);opacity:0}}
  @media(max-width:650px){.problem,.character-line{display:none}.body{grid-template-columns:1fr;grid-template-rows:.4fr .6fr}.objects{grid-template-columns:repeat(4,1fr)}.scientu{width:84px;height:84px}.dheu{width:78px;height:78px}.speech-bubble{left:79px;width:46%;font-size:.66rem}.branch-bank-target{left:13%;width:21%}.watering-can{left:31%;top:75%;transform:scale(.88)}.sapling-target{width:50px;height:50px}.sapling-target--1{left:2%}.sapling-target--2{left:12%}.sapling-target--3{left:22%}}
  @media(prefers-reduced-motion:reduce){.forest-depth *{animation:none!important;transition:none!important}.flow-lines i{opacity:.9}.cleared-branch{left:18%;top:78%;transform:rotate(-14deg)}.sapling-target.watered span{transform:scale(1.3) translateY(-4px)}}
</style>
