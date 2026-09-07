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
  let stepIndex = $state(0);
  let completedCount = $state(0);
  let assemblyState = $state<AssemblyInteractionState>(createAssemblyInteractionState());
  let selectedPartId = $state<string | null>(null);
  let assemblyDrag = $state<AssemblyDrag | null>(null);
  let suppressPartClick = $state<string | null>(null);
  let seedPicked = $state(false);
  let seedDrag = $state<PointerDrag | null>(null);
  let wateringCanPicked = $state(false);
  let waterDrag = $state<PointerDrag | null>(null);
  let wateredPatches = $state<number[]>([]);
  let feedback = $state<string | null>(null);
  let stepComplete = $state(false);
  let currentStep = $derived(adventure.steps[stepIndex]);
  let childDisplayName = $derived(childName.trim() || 'Dheu');

  function markStepComplete(step: ForestAdventureStep): void {
    completedCount = stepIndex + 1;
    stepComplete = true;
    feedback = step.consequence;
    if (completedCount === adventure.steps.length) {
      onComplete(`session.${mission.id}.world-action.v1`);
    }
  }

  function nextStep(): void {
    if (!stepComplete) return;
    if (completedCount === adventure.steps.length) {
      stepIndex = adventure.steps.length;
      return;
    }
    stepIndex += 1;
    assemblyState = createAssemblyInteractionState();
    selectedPartId = null;
    assemblyDrag = null;
    suppressPartClick = null;
    seedPicked = false;
    seedDrag = null;
    wateringCanPicked = false;
    waterDrag = null;
    wateredPatches = [];
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
      'part.shelter-roof': 'shelter roof',
      'part.shelter-perch': 'landing perch',
      'part.grove.seed-food': 'seed food',
      'part.grove.leaf-litter': 'fallen leaves',
      'part.grove.wrapper': 'wrapper'
    };
    return labels[partId] ?? partId.replace('part.', '').replaceAll('.', ' ').replaceAll('-', ' ');
  }

  function slotLabel(slotId: string): string {
    const labels: Record<string, string> = {
      'slot.shelter-top': 'roof gap',
      'slot.shelter-front': 'perch gap',
      'slot.grove.feeder': 'feeder',
      'slot.grove.compost': 'compost pile',
      'slot.grove.litter-bag': 'litter bag'
    };
    return labels[slotId] ?? slotId.replace('slot.', '').replaceAll('.', ' ').replaceAll('-', ' ');
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

  function choosePart(partId: string): void {
    if (!currentStep?.assembly || stepComplete || isPlaced(partId)) return;
    selectedPartId = partId;
    feedback = currentStep.id === 'forest.l3.step.shelter-repair'
      ? 'Take it to the glowing gap on the shelter.'
      : 'Take it to the place where it belongs in the grove.';
  }

  function chooseSlot(slotId: string): void {
    if (!currentStep?.assembly || !selectedPartId || stepComplete) return;
    const result = commitAssemblyPlacement(currentStep.assembly, assemblyState, {
      partId: selectedPartId,
      slotId
    });
    assemblyState = result.state;
    selectedPartId = null;
    if (result.feedback === 'retry_in_place') {
      feedback = currentStep.scaffold;
    } else if (result.feedback === 'complete') {
      markStepComplete(currentStep);
    } else {
      feedback = 'That belongs there. Keep working in the grove.';
    }
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
    const target = document.elementsFromPoint(event.clientX, event.clientY)
      .find((element) => element instanceof HTMLElement && element.dataset.groveSlot) as HTMLElement | undefined;
    if (target?.dataset.groveSlot) chooseSlot(target.dataset.groveSlot);
    else feedback = 'Drop it onto one of the glowing places in the grove.';
    suppressPartClick = ended.partId;
    queueMicrotask(() => {
      if (suppressPartClick === ended.partId) suppressPartClick = null;
    });
  }

  function activatePart(partId: string): void {
    if (suppressPartClick === partId) return;
    choosePart(partId);
  }

  function pickSeed(): void {
    if (currentStep?.id !== 'forest.l3.step.feed-visitors' || stepComplete) return;
    seedPicked = true;
    feedback = 'Seed scoop ready. Put it inside the feeder.';
  }

  function fillFeeder(): void {
    if (currentStep?.id !== 'forest.l3.step.feed-visitors' || stepComplete || !seedPicked) return;
    seedPicked = false;
    markStepComplete(currentStep);
  }

  function endSeedDrag(event: PointerEvent): void {
    if (!seedDrag || seedDrag.pointerId !== event.pointerId) return;
    const ended = seedDrag;
    seedDrag = null;
    if (!ended.moved) return;
    seedPicked = true;
    const feeder = document.elementsFromPoint(event.clientX, event.clientY)
      .find((element) => element instanceof HTMLElement && element.dataset.feedTarget === 'feeder');
    if (feeder) fillFeeder();
    else feedback = 'The seed is still outside the feeder. Drop it into the feeding tray.';
  }

  function pickWateringCan(): void {
    if (currentStep?.id !== 'forest.l3.step.grow-meadow' || stepComplete) return;
    wateringCanPicked = true;
    feedback = 'Watering can ready. Water one dry patch at a time.';
  }

  function waterPatch(index: number): void {
    if (currentStep?.id !== 'forest.l3.step.grow-meadow' || stepComplete || wateredPatches.includes(index)) return;
    if (!wateringCanPicked) {
      feedback = 'Pick up the watering can first.';
      return;
    }
    const next = [...wateredPatches, index];
    wateredPatches = next;
    wateringCanPicked = false;
    if (next.length === 3) markStepComplete(currentStep);
    else feedback = `${next.length}/3 patches watered. Flowers are starting to rise.`;
  }

  function endWaterDrag(event: PointerEvent): void {
    if (!waterDrag || waterDrag.pointerId !== event.pointerId) return;
    const ended = waterDrag;
    waterDrag = null;
    if (!ended.moved) return;
    wateringCanPicked = true;
    const patch = document.elementsFromPoint(event.clientX, event.clientY)
      .find((element) => element instanceof HTMLElement && element.dataset.meadowPatch !== undefined) as HTMLElement | undefined;
    if (patch?.dataset.meadowPatch !== undefined) waterPatch(Number(patch.dataset.meadowPatch));
    else feedback = 'Pour onto one of the glowing dry soil patches.';
  }

  let shelterDone = $derived(isStepDone('forest.l3.step.shelter-repair') || (currentStep?.id === 'forest.l3.step.shelter-repair' && stepComplete));
  let sortingDone = $derived(isStepDone('forest.l3.step.sort-feeding-place') || (currentStep?.id === 'forest.l3.step.sort-feeding-place' && stepComplete));
  let feederDone = $derived(isStepDone('forest.l3.step.feed-visitors') || (currentStep?.id === 'forest.l3.step.feed-visitors' && stepComplete));
  let meadowDone = $derived(isStepDone('forest.l3.step.grow-meadow') || (currentStep?.id === 'forest.l3.step.grow-meadow' && stepComplete));
  let roofVisible = $derived(shelterDone || (currentStep?.id === 'forest.l3.step.shelter-repair' && isPlaced('part.shelter-roof')));
  let perchVisible = $derived(shelterDone || (currentStep?.id === 'forest.l3.step.shelter-repair' && isPlaced('part.shelter-perch')));
  let seedSorted = $derived(sortingDone || (currentStep?.id === 'forest.l3.step.sort-feeding-place' && isPlaced('part.grove.seed-food')));
  let leavesSorted = $derived(sortingDone || (currentStep?.id === 'forest.l3.step.sort-feeding-place' && isPlaced('part.grove.leaf-litter')));
  let wrapperSorted = $derived(sortingDone || (currentStep?.id === 'forest.l3.step.sort-feeding-place' && isPlaced('part.grove.wrapper')));
  let groveComplete = $derived(completedCount === adventure.steps.length);
</script>

<section class="grove-depth" data-forest-level={adventure.level} data-testid="busy-grove-practical" aria-labelledby="grove-heading">
  <header class="grove-hud">
    <button type="button" class="back" onclick={onExit} aria-label="Back to Dheu's world">←</button>
    <div><small>FOREST LEVEL 3 · WORLD MISSION</small><h1 id="grove-heading">{adventure.title}</h1></div>
    <div class="progress" aria-label={`${completedCount} of ${adventure.steps.length} grove jobs complete`}><strong>{Math.min(stepIndex + 1, adventure.steps.length)}/{adventure.steps.length}</strong><span>{groveComplete ? 'RESTORED' : 'WORKING'}</span></div>
  </header>

  <main class="grove-layout">
    <section class="grove-scene" aria-label={`Interactive grove. ${completedCount} of ${adventure.steps.length} jobs complete.`}>
      <div class="sky" aria-hidden="true"><span class="sun"></span><i></i><i></i></div>
      <div class="far-trees" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
      <div class="ground" aria-hidden="true"></div>
      <div class="path" aria-hidden="true"></div>

      <div class="scientu"><StoryCharacter character="scientu" mood={groveComplete ? 'celebrate' : 'thinking'} motion={groveComplete ? 'celebrate' : 'point'} label="Scientu helps restore the grove" /></div>
      <div class="dheu"><StoryCharacter character="dheu" mood={groveComplete ? 'celebrate' : 'ready'} motion={groveComplete ? 'celebrate' : 'help'} label={`${childDisplayName} works in the grove`} /></div>

      <div class="shelter" class:restored={shelterDone} data-grove-object="shelter" aria-hidden="true">
        <div class="shelter-body"><i></i></div>
        {#if roofVisible}<div class="shelter-roof" data-grove-state="roof-installed"></div>{/if}
        {#if perchVisible}<div class="shelter-perch" data-grove-state="perch-installed"></div>{/if}
      </div>

      <div class="feeder" class:ready={sortingDone} class:full={feederDone} data-grove-object="feeder" aria-hidden="true">
        <i></i><b></b>{#if feederDone}<span class="seed-fill">••••••</span>{/if}
      </div>
      <div class="compost" class:filled={leavesSorted} aria-hidden="true"><span>{leavesSorted ? '🍂' : ''}</span></div>
      <div class="litter-bag" class:filled={wrapperSorted} aria-hidden="true"><span>{wrapperSorted ? '✓' : ''}</span></div>
      {#if feederDone}<div class="returning-bird" data-grove-state="bird-returned" aria-hidden="true">🐦</div>{/if}

      {#each [0, 1, 2] as patch}
        <div class={`meadow-patch meadow-patch--${patch + 1}`} class:watered={meadowDone || wateredPatches.includes(patch)} aria-hidden="true">
          <i></i><span>{meadowDone || wateredPatches.includes(patch) ? '🌼🌷' : '· · ·'}</span>
        </div>
      {/each}
      {#if meadowDone}<div class="butterflies" data-grove-state="butterflies-returned" aria-hidden="true">🦋　🦋　🦋</div>{/if}

      {#if currentStep?.id === 'forest.l3.step.shelter-repair' && !stepComplete}
        <button type="button" class="grove-slot roof-slot" class:ready={selectedPartId === 'part.shelter-roof'} data-grove-slot="slot.shelter-top" onclick={() => chooseSlot('slot.shelter-top')} aria-label="Shelter roof gap">ROOF GAP</button>
        <button type="button" class="grove-slot perch-slot" class:ready={selectedPartId === 'part.shelter-perch'} data-grove-slot="slot.shelter-front" onclick={() => chooseSlot('slot.shelter-front')} aria-label="Shelter perch gap">PERCH GAP</button>
        {#if !isPlaced('part.shelter-roof')}
          <button
            type="button"
            class="loose-piece loose-roof"
            class:selected={selectedPartId === 'part.shelter-roof'}
            class:dragging={assemblyDrag?.partId === 'part.shelter-roof'}
            style:transform={assemblyDrag?.partId === 'part.shelter-roof' ? `translate(${assemblyDrag.dx}px, ${assemblyDrag.dy}px) rotate(-3deg) scale(1.04)` : undefined}
            data-part="part.shelter-roof"
            onpointerdown={(event) => beginAssemblyDrag(event, 'part.shelter-roof')}
            onpointermove={moveAssemblyDrag}
            onpointerup={endAssemblyDrag}
            onpointercancel={() => { assemblyDrag = null; }}
            onclick={() => activatePart('part.shelter-roof')}
            aria-label="Loose shelter roof. Drag it onto the roof gap."
          ><span aria-hidden="true"></span><b>ROOF</b></button>
        {/if}
        {#if !isPlaced('part.shelter-perch')}
          <button
            type="button"
            class="loose-piece loose-perch"
            class:selected={selectedPartId === 'part.shelter-perch'}
            class:dragging={assemblyDrag?.partId === 'part.shelter-perch'}
            style:transform={assemblyDrag?.partId === 'part.shelter-perch' ? `translate(${assemblyDrag.dx}px, ${assemblyDrag.dy}px) scale(1.04)` : undefined}
            data-part="part.shelter-perch"
            onpointerdown={(event) => beginAssemblyDrag(event, 'part.shelter-perch')}
            onpointermove={moveAssemblyDrag}
            onpointerup={endAssemblyDrag}
            onpointercancel={() => { assemblyDrag = null; }}
            onclick={() => activatePart('part.shelter-perch')}
            aria-label="Loose shelter perch. Drag it onto the perch gap."
          ><span aria-hidden="true"></span><b>PERCH</b></button>
        {/if}
      {/if}

      {#if currentStep?.id === 'forest.l3.step.sort-feeding-place' && !stepComplete}
        <button type="button" class="grove-slot feeder-slot" class:ready={selectedPartId === 'part.grove.seed-food'} data-grove-slot="slot.grove.feeder" onclick={() => chooseSlot('slot.grove.feeder')} aria-label="Feeder target">FEEDER</button>
        <button type="button" class="grove-slot compost-slot" class:ready={selectedPartId === 'part.grove.leaf-litter'} data-grove-slot="slot.grove.compost" onclick={() => chooseSlot('slot.grove.compost')} aria-label="Compost target">COMPOST</button>
        <button type="button" class="grove-slot bag-slot" class:ready={selectedPartId === 'part.grove.wrapper'} data-grove-slot="slot.grove.litter-bag" onclick={() => chooseSlot('slot.grove.litter-bag')} aria-label="Litter bag target">BAG</button>
        {#each currentStep.assembly?.parts ?? [] as part, index}
          {#if !isPlaced(part.partId)}
            <button
              type="button"
              class={`scatter-item scatter-item--${index + 1}`}
              class:selected={selectedPartId === part.partId}
              class:dragging={assemblyDrag?.partId === part.partId}
              style:transform={assemblyDrag?.partId === part.partId ? `translate(${assemblyDrag.dx}px, ${assemblyDrag.dy}px) scale(1.08)` : undefined}
              data-part={part.partId}
              onpointerdown={(event) => beginAssemblyDrag(event, part.partId)}
              onpointermove={moveAssemblyDrag}
              onpointerup={endAssemblyDrag}
              onpointercancel={() => { assemblyDrag = null; }}
              onclick={() => activatePart(part.partId)}
              aria-label={`${partLabel(part.partId)}. Drag it to the correct grove place.`}
            ><span aria-hidden="true">{part.partId.includes('seed-food') ? '🌾' : part.partId.includes('leaf') ? '🍂' : '🧃'}</span><b>{partLabel(part.partId)}</b></button>
          {/if}
        {/each}
      {/if}

      {#if currentStep?.id === 'forest.l3.step.feed-visitors' && !stepComplete}
        <button
          type="button"
          class="seed-scoop"
          class:picked={seedPicked}
          style:transform={seedDrag ? `translate(${seedDrag.dx}px, ${seedDrag.dy}px) rotate(-8deg)` : undefined}
          onpointerdown={(event) => { seedPicked = true; seedDrag = beginPointerDrag(event); }}
          onpointermove={(event) => { seedDrag = movePointerDrag(event, seedDrag); }}
          onpointerup={endSeedDrag}
          onpointercancel={() => { seedDrag = null; }}
          onclick={pickSeed}
          aria-label="Seed scoop. Drag the seed into the feeder."
        ><span aria-hidden="true">🌾</span><b>SEED</b></button>
        <button type="button" class="feed-drop" data-feed-target="feeder" onclick={fillFeeder} aria-label="Feeder. Put the seed here.">DROP SEED HERE</button>
      {/if}

      {#if currentStep?.id === 'forest.l3.step.grow-meadow' && !stepComplete}
        <button
          type="button"
          class="watering-can"
          class:picked={wateringCanPicked}
          style:transform={waterDrag ? `translate(${waterDrag.dx}px, ${waterDrag.dy}px) rotate(-9deg)` : undefined}
          onpointerdown={(event) => { wateringCanPicked = true; waterDrag = beginPointerDrag(event); }}
          onpointermove={(event) => { waterDrag = movePointerDrag(event, waterDrag); }}
          onpointerup={endWaterDrag}
          onpointercancel={() => { waterDrag = null; }}
          onclick={pickWateringCan}
          aria-label="Watering can. Drag it to each dry flower patch."
        ><span aria-hidden="true">💧</span><b>WATER</b></button>
        {#each [0, 1, 2] as patch}
          <button
            type="button"
            class={`water-target water-target--${patch + 1}`}
            class:watered={wateredPatches.includes(patch)}
            data-meadow-patch={patch}
            disabled={wateredPatches.includes(patch)}
            onclick={() => waterPatch(patch)}
            aria-label={`Dry flower patch ${patch + 1}${wateredPatches.includes(patch) ? ', watered' : ''}`}
          ><span aria-hidden="true">{wateredPatches.includes(patch) ? '✓' : '💧'}</span></button>
        {/each}
      {/if}

      <div class="scene-instruction" role="status" aria-live="polite">
        <small>DO IT IN THE GROVE</small>
        <strong>{currentStep?.title ?? 'Grove restored!'}</strong>
        <span>{currentStep?.id === 'forest.l3.step.shelter-repair' ? 'Drag the roof and perch onto the shelter.' : currentStep?.id === 'forest.l3.step.sort-feeding-place' ? 'Move each scattered thing to its real place.' : currentStep?.id === 'forest.l3.step.feed-visitors' ? 'Carry the seed scoop into the feeder.' : currentStep?.id === 'forest.l3.step.grow-meadow' ? `Water all three dry patches. ${wateredPatches.length}/3 done.` : adventure.ending}</span>
      </div>
    </section>

    <section class="work-panel" aria-labelledby="grove-action-heading">
      {#if stepIndex >= adventure.steps.length}
        <div class="completion-copy" aria-live="polite">
          <small>GROVE RESTORED</small>
          <h2 id="grove-action-heading">Animals have a place to return to.</h2>
          <p>{adventure.ending}</p>
          <strong>{adventure.nextStateLabel}</strong>
          <button type="button" class="primary" onclick={onExit}>Back to the Forest</button>
        </div>
      {:else if currentStep}
        <div class="step-copy">
          <small>ACTION {stepIndex + 1} OF {adventure.steps.length} · {currentStep.interactionFamily.replaceAll('_', ' ')}</small>
          <h2 id="grove-action-heading">{currentStep.icon} {currentStep.title}</h2>
          <p>{currentStep.prompt}</p>
          <strong>{currentStep.instruction}</strong>
        </div>

        <div class="no-fake-button"><span aria-hidden="true">☝</span><div><b>Work in the picture</b><small>No “do it for me” action button. Move the actual object in the grove.</small></div></div>
        {#if feedback}<div class:success={stepComplete} class="feedback" role="status" aria-live="polite">{feedback}</div>{/if}
        {#if stepComplete}<button type="button" class="primary" onclick={nextStep}>{completedCount === adventure.steps.length ? 'See the restored grove' : 'Next forest job'} →</button>{/if}
      {/if}
    </section>
  </main>
</section>

<style>
  .grove-depth{--ink:#24362b;--forest:#3e814d;--deep:#245436;--cream:#fff9e7;--gold:#f6c94c;--blue:#d9f2ff;height:calc(100dvh - 42px);display:grid;grid-template-rows:auto 1fr;overflow:hidden;background:#edf4d9;color:var(--ink)}
  .grove-hud{display:grid;grid-template-columns:46px minmax(0,1fr) auto;align-items:center;gap:8px;padding:7px 9px;border-bottom:1px solid #97b67255;background:#fffbea}.back{width:44px;height:44px;border:0;border-radius:50%;background:#fff;box-shadow:0 2px 8px #23432f1f;font:inherit;font-size:1.2rem;font-weight:900}.grove-hud small{font-size:.55rem;font-weight:950;letter-spacing:.08em;color:#5a793f}.grove-hud h1{margin:1px 0 0;font-size:1rem}.progress{display:grid;justify-items:center;padding:5px 9px;border-radius:13px;background:#fff}.progress strong{font-size:.82rem;color:var(--forest)}.progress span{font-size:.48rem;font-weight:950;color:#6e7e70}
  .grove-layout{min-height:0;display:grid;grid-template-columns:minmax(0,1.45fr) minmax(320px,.75fr);gap:7px;padding:7px;overflow:hidden}.grove-scene,.work-panel{min-height:0;border-radius:20px;box-shadow:0 5px 18px #24482f18}.grove-scene{position:relative;overflow:hidden;background:linear-gradient(var(--blue) 0 38%,#aed990 38% 70%,#78aa66 70%)}.sky{position:absolute;inset:0 0 62%;pointer-events:none}.sun{position:absolute;right:9%;top:8%;width:50px;height:50px;border-radius:50%;background:#ffd75b;box-shadow:0 0 0 9px #fff4a955}.sky i{position:absolute;width:52px;height:17px;border-radius:999px;background:#fff9}.sky i:before,.sky i:after{content:"";position:absolute;bottom:0;border-radius:50%;background:#fff}.sky i:before{left:8px;width:24px;height:24px}.sky i:after{right:7px;width:20px;height:20px}.sky i:nth-child(2){left:12%;top:13%}.sky i:nth-child(3){left:46%;top:21%;transform:scale(.8)}
  .far-trees{position:absolute;left:0;right:0;top:30%;height:33%;display:flex;align-items:end;justify-content:space-around;pointer-events:none}.far-trees i{position:relative;width:66px;height:105px;border-radius:48% 48% 38% 38%;background:#4e965a;box-shadow:inset 16px 0 #67ad67}.far-trees i:after{content:"";position:absolute;left:29px;bottom:-34px;width:10px;height:46px;background:#7a583b}.far-trees i:nth-child(2),.far-trees i:nth-child(4){transform:scale(.8);opacity:.86}.ground{position:absolute;inset:61% 0 0;background:linear-gradient(#8dbf73 0 52%,#72a65e 52%)}.path{position:absolute;left:39%;bottom:-22%;width:27%;height:66%;border-radius:50% 50% 0 0;background:#d8c397;transform:perspective(220px) rotateX(58deg);opacity:.9}
  .scientu,.dheu{position:absolute;z-index:7;filter:drop-shadow(0 3px 3px #1f392433)}.scientu{left:2%;top:10%;width:90px;height:90px}.dheu{right:2%;top:18%;width:82px;height:82px}
  .shelter{position:absolute;z-index:3;left:39%;top:37%;width:180px;height:155px}.shelter-body{position:absolute;left:36px;top:42px;width:108px;height:104px;border:8px solid #855a34;border-top:0;border-radius:6px 6px 15px 15px;background:#c98b54}.shelter-body:after{content:"";position:absolute;left:28px;bottom:0;width:46px;height:65px;border-radius:50% 50% 0 0;background:#4f3a2b}.shelter-roof{position:absolute;z-index:2;left:17px;top:12px;width:146px;height:56px;background:#a96035;clip-path:polygon(50% 0,100% 80%,92% 100%,50% 28%,8% 100%,0 80%);filter:drop-shadow(0 5px 2px #35261622);animation:roof-set .55s cubic-bezier(.2,.9,.2,1)}.shelter-perch{position:absolute;z-index:4;left:49px;top:114px;width:86px;height:10px;border-radius:9px;background:#704928;box-shadow:0 5px 0 #58391f;animation:perch-set .45s ease-out}.shelter.restored{filter:drop-shadow(0 8px 8px #2b4a2b25)}
  .feeder{position:absolute;z-index:4;left:68%;top:55%;width:92px;height:75px}.feeder i{position:absolute;left:38px;top:24px;width:12px;height:52px;background:#6f5538}.feeder b{position:absolute;left:7px;top:12px;width:76px;height:32px;border:6px solid #7c5b36;border-top-width:9px;border-radius:8px 8px 16px 16px;background:#e9cb82}.feeder.ready{filter:drop-shadow(0 0 8px #fff8bd)}.seed-fill{position:absolute;z-index:2;left:20px;top:17px;width:50px;overflow:hidden;color:#7b5b28;font-size:.7rem;letter-spacing:1px;animation:seed-pour .55s ease-out}.compost{position:absolute;z-index:3;left:75%;bottom:7%;width:90px;height:42px;border-radius:50% 50% 25% 25%;background:#765438;box-shadow:inset 0 8px #8d6847}.compost span{position:absolute;inset:-8px 0 0;display:grid;place-items:center;font-size:1.5rem}.litter-bag{position:absolute;z-index:3;right:4%;bottom:8%;width:54px;height:70px;border-radius:10px 10px 18px 18px;background:#4f7077;box-shadow:inset 0 6px #71949a}.litter-bag:before{content:"";position:absolute;left:11px;right:11px;top:-8px;height:12px;border-radius:50%;background:#405b61}.litter-bag span{position:absolute;inset:0;display:grid;place-items:center;color:#fff;font-size:1.2rem;font-weight:950}.returning-bird{position:absolute;z-index:6;left:62%;top:43%;font-size:2.3rem;animation:bird-arrive 1.1s cubic-bezier(.2,.8,.2,1)}
  .meadow-patch{position:absolute;z-index:3;width:115px;height:70px;border-radius:50%;background:#8e6b45;box-shadow:inset 0 7px #7a5b3c}.meadow-patch i{position:absolute;left:10%;right:10%;top:46%;border-top:3px dashed #b5986e}.meadow-patch span{position:absolute;left:3px;right:3px;bottom:12px;text-align:center;color:#64482f;font-size:1.05rem;transition:transform .35s}.meadow-patch.watered{background:#649c55;box-shadow:inset 0 7px #79b766}.meadow-patch.watered span{bottom:22px;font-size:1.8rem;transform:translateY(-13px) scale(1.08);animation:flowers-rise .65s ease-out}.meadow-patch--1{left:14%;bottom:8%}.meadow-patch--2{left:35%;bottom:5%}.meadow-patch--3{left:55%;bottom:9%}.butterflies{position:absolute;z-index:8;left:24%;right:18%;top:28%;text-align:center;font-size:2rem;animation:butterfly-return 1.5s ease-out both}
  .grove-slot{position:absolute;z-index:9;min-width:74px;min-height:48px;border:3px dashed #fff8c8;border-radius:14px;background:#fffbd129;color:#fff;font:inherit;font-size:.56rem;font-weight:950;text-shadow:0 1px 2px #315138;box-shadow:0 0 0 3px #f6d85c44,0 0 18px #fff5a966;cursor:pointer;animation:target-breathe 1.25s ease-in-out infinite}.grove-slot.ready{background:#fff4a56e;box-shadow:0 0 0 4px #ffd34b8a,0 0 24px #fff1a8}.roof-slot{left:calc(39% + 38px);top:34%;width:105px}.perch-slot{left:calc(39% + 50px);top:49%;width:86px}.feeder-slot{left:67%;top:53%;width:100px}.compost-slot{left:74%;bottom:4%;width:105px}.bag-slot{right:2%;bottom:5%;width:72px}
  .loose-piece,.scatter-item,.seed-scoop,.watering-can{position:absolute;z-index:12;min-width:72px;min-height:55px;border:3px solid #fff8d1;border-radius:15px;background:#fff6d5;color:#314534;font:inherit;font-weight:950;box-shadow:0 7px 15px #24442d2d;touch-action:none;user-select:none;cursor:grab}.loose-piece:active,.scatter-item:active,.seed-scoop:active,.watering-can:active{cursor:grabbing}.loose-piece.selected,.scatter-item.selected,.seed-scoop.picked,.watering-can.picked{outline:4px solid #f5bf32;box-shadow:0 0 0 7px #ffe78055,0 9px 18px #26472e35}.dragging{z-index:30!important}.loose-piece b,.scatter-item b,.seed-scoop b,.watering-can b{display:block;font-size:.55rem}.loose-roof{left:9%;top:45%;width:115px}.loose-roof span{display:block;width:78px;height:28px;margin:auto;background:#a96035;clip-path:polygon(50% 0,100% 83%,88% 100%,50% 32%,12% 100%,0 83%)}.loose-perch{left:21%;top:56%;width:100px}.loose-perch span{display:block;width:70px;height:9px;margin:8px auto;border-radius:9px;background:#704928;box-shadow:0 4px #58391f}
  .scatter-item{width:104px}.scatter-item span{display:block;font-size:1.55rem}.scatter-item--1{left:14%;top:48%;transform:rotate(-5deg)}.scatter-item--2{left:29%;top:61%;transform:rotate(4deg)}.scatter-item--3{left:49%;top:66%;transform:rotate(-4deg)}.seed-scoop{left:22%;top:56%;width:105px}.seed-scoop span,.watering-can span{display:block;font-size:1.6rem}.feed-drop{position:absolute;z-index:11;left:66%;top:51%;width:115px;height:105px;border:4px dashed #ffef92;border-radius:20px;background:#fff5a62c;color:#fff;font:inherit;font-size:.55rem;font-weight:950;text-shadow:0 1px 2px #395344;cursor:pointer;animation:target-breathe 1.1s ease-in-out infinite}.watering-can{left:12%;top:55%;width:112px}.water-target{position:absolute;z-index:11;width:125px;height:80px;border:4px dashed #c9f5ff;border-radius:50%;background:#b5efff22;color:#e9fbff;font:inherit;font-size:1.25rem;cursor:pointer;animation:target-breathe 1.2s ease-in-out infinite}.water-target--1{left:13%;bottom:6%}.water-target--2{left:34%;bottom:3%}.water-target--3{left:54%;bottom:7%}.water-target.watered{border-style:solid;border-color:#d9ffd2;background:#73b56455;animation:none}
  .scene-instruction{position:absolute;z-index:15;left:16px;right:16px;top:14px;margin:auto;max-width:520px;display:grid;gap:2px;padding:8px 12px;border-radius:16px;background:#fffdf2ed;box-shadow:0 5px 16px #28452e24;text-align:center}.scene-instruction small{font-size:.5rem;font-weight:950;letter-spacing:.08em;color:#4a843f}.scene-instruction strong{font-size:.78rem}.scene-instruction span{font-size:.62rem;font-weight:730;color:#59685d}
  .work-panel{display:flex;flex-direction:column;gap:10px;padding:14px;background:#fff}.step-copy{display:grid;gap:5px}.step-copy small{font-size:.54rem;font-weight:950;letter-spacing:.06em;color:#665cd6}.step-copy h2{margin:0;font-size:1.1rem}.step-copy p{margin:0;padding:8px 9px;border-radius:12px;background:#fff7d5;font-size:.69rem;font-weight:800}.step-copy>strong{padding:8px 9px;border-radius:12px;background:#f4f1ff;color:#4d43bd;font-size:.67rem}.no-fake-button{display:grid;grid-template-columns:38px 1fr;gap:8px;align-items:center;padding:10px;border:1px solid #8bbc7c55;border-radius:13px;background:#eff8ea}.no-fake-button>span{width:36px;height:36px;display:grid;place-items:center;border-radius:50%;background:#4b9554;color:#fff}.no-fake-button div{display:grid;gap:2px}.no-fake-button b{font-size:.68rem}.no-fake-button small{font-size:.56rem;line-height:1.25;color:#647166}.feedback{padding:9px 10px;border-radius:12px;background:#eef5f8;font-size:.65rem;font-weight:850}.feedback.success{background:#def3dd;color:#2d6840}.primary{min-height:48px;border:0;border-radius:12px;background:#3f874e;color:#fff;font:inherit;font-size:.7rem;font-weight:950;box-shadow:0 6px 15px #2e6a3d30;cursor:pointer}.completion-copy{display:grid;align-content:center;gap:9px;height:100%;text-align:center}.completion-copy small{font-size:.58rem;font-weight:950;letter-spacing:.08em;color:#3f874e}.completion-copy h2{margin:0;font-size:1.2rem}.completion-copy p{margin:0;font-size:.7rem;line-height:1.4}.completion-copy strong{padding:9px;border-radius:12px;background:#eff8ea;font-size:.68rem}
  @keyframes target-breathe{50%{box-shadow:0 0 0 5px #fff1a84f,0 0 26px #fff0a06e}}@keyframes roof-set{from{transform:translate(-40px,28px) rotate(-12deg);opacity:.35}}@keyframes perch-set{from{transform:translate(-34px,16px);opacity:.35}}@keyframes seed-pour{from{transform:translate(-45px,-24px) rotate(-20deg);opacity:.2}}@keyframes bird-arrive{from{transform:translate(220px,-130px) rotate(-15deg) scale(.5);opacity:0}70%{transform:translate(-8px,4px) rotate(4deg) scale(1.08)}}@keyframes flowers-rise{from{transform:translateY(17px) scale(.35);opacity:.2}}@keyframes butterfly-return{from{transform:translateY(50px) scale(.5);opacity:0}40%{opacity:1}100%{transform:translateY(-18px) scale(1)}}
  @media(max-width:760px){.grove-depth{height:auto;min-height:calc(100dvh - 42px);overflow:visible}.grove-layout{grid-template-columns:1fr;overflow:visible}.grove-scene{min-height:440px}.work-panel{min-height:220px}.scientu{width:72px;height:72px}.dheu{width:68px;height:68px}.scene-instruction{left:74px;right:74px}.shelter{left:34%;transform:scale(.86)}.roof-slot{left:calc(34% + 34px)}.perch-slot{left:calc(34% + 42px)}.feeder,.feed-drop,.feeder-slot{left:66%}.compost,.compost-slot{left:71%}.meadow-patch--1,.water-target--1{left:8%}.meadow-patch--2,.water-target--2{left:35%}.meadow-patch--3,.water-target--3{left:61%}.watering-can{left:4%;top:50%}.loose-roof{left:5%}.loose-perch{left:17%}.scatter-item--1{left:6%}.scatter-item--2{left:27%}.scatter-item--3{left:47%}}
  @media(max-width:420px){.grove-hud{grid-template-columns:44px 1fr 58px}.grove-hud small{display:none}.grove-hud h1{font-size:.88rem}.grove-scene{min-height:390px}.scene-instruction{left:55px;right:55px;padding:6px 8px}.scene-instruction span{font-size:.56rem}.scientu{top:16%;left:0;width:62px;height:62px}.dheu{top:22%;right:0;width:58px;height:58px}.shelter{left:28%;top:37%;transform:scale(.72)}.roof-slot{left:calc(28% + 28px);top:34%;transform:scale(.82)}.perch-slot{left:calc(28% + 38px);top:49%;transform:scale(.82)}.feeder,.feed-drop,.feeder-slot{left:63%;transform:scale(.82)}.loose-piece,.scatter-item,.seed-scoop,.watering-can{transform:scale(.82)}.loose-roof{left:2%}.loose-perch{left:14%}.scatter-item--1{left:1%;top:49%}.scatter-item--2{left:23%;top:61%}.scatter-item--3{left:45%;top:66%}.meadow-patch,.water-target{width:95px}.meadow-patch--1,.water-target--1{left:2%}.meadow-patch--2,.water-target--2{left:34%}.meadow-patch--3,.water-target--3{left:66%}.watering-can{left:1%;top:49%}.no-fake-button small{font-size:.53rem}}
  @media(prefers-reduced-motion:reduce){.grove-depth *{animation:none!important;transition:none!important}.returning-bird,.butterflies,.shelter-roof,.shelter-perch,.meadow-patch.watered span{transform:none!important;opacity:1!important}}
</style>
