<script lang="ts">
  import StoryCharacter from '../presentation/StoryCharacter.svelte';
  import {
    getForestWorldDepthAdventure,
    type ForestAdventureStep
  } from '../forest/forestWorldDepth';
  import {
    commitAssemblyPlacement,
    createAssemblyInteractionState,
    type AssemblyInteractionState
  } from '../mechanics/assemblyInteraction';
  import type { StoryMission } from '../story/storyTypes';

  let {
    mission,
    childName = '',
    onComplete,
    onExit
  }: {
    mission: StoryMission;
    childName?: string;
    onComplete: (sessionId: string) => void;
    onExit: () => void;
  } = $props();

  const adventure = getForestWorldDepthAdventure(mission.worldActionRef ?? '');
  const displayName = childName.trim() || 'Dheu';
  let stepIndex = $state(0);
  let assemblyState = $state<AssemblyInteractionState>(createAssemblyInteractionState());
  let selectedPartId = $state<string | null>(null);
  let feedback = $state<string | null>(null);
  let stepComplete = $state(false);
  let completedStepIds = $state<string[]>([]);
  let missionComplete = $state(false);
  let completionEmitted = false;
  let currentStep = $derived(adventure.steps[stepIndex]);
  let currentAssembly = $derived(currentStep?.assembly);

  function resetInteraction(): void {
    assemblyState = createAssemblyInteractionState();
    selectedPartId = null;
    feedback = null;
    stepComplete = false;
  }

  function markStepComplete(step: ForestAdventureStep): void {
    if (!completedStepIds.includes(step.id)) completedStepIds = [...completedStepIds, step.id];
    stepComplete = true;
    feedback = step.consequence;
    if (stepIndex === adventure.steps.length - 1) {
      missionComplete = true;
      if (!completionEmitted) {
        completionEmitted = true;
        onComplete(`session.${mission.id}.world-action.v1`);
      }
    }
  }

  function choosePart(partId: string): void {
    if (stepComplete) return;
    selectedPartId = partId;
    feedback = 'Now choose the matching place.';
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
      return;
    }
    if (result.feedback === 'complete') {
      markStepComplete(currentStep);
      return;
    }
    feedback = 'That piece fits. Keep going.';
  }

  function performWorldAction(): void {
    if (!currentStep || stepComplete) return;
    markStepComplete(currentStep);
  }

  function nextStep(): void {
    if (!stepComplete || missionComplete) return;
    stepIndex += 1;
    resetInteraction();
  }

  function isPlaced(partId: string): boolean {
    return assemblyState.assignments.some((assignment) => assignment.partId === partId);
  }

  function objectChanged(step: ForestAdventureStep): boolean {
    return completedStepIds.includes(step.id);
  }
</script>

<section class="forest-depth" data-forest-level={adventure.level} aria-labelledby="forest-depth-heading">
  <header class="forest-depth__header">
    <button type="button" class="back" onclick={onExit} aria-label="Back to Dheu's world">←</button>
    <div class="title-copy">
      <span>FOREST LEVEL {adventure.level} · WORLD MISSION</span>
      <h1 id="forest-depth-heading">{adventure.title}</h1>
    </div>
    <div class="characters" aria-label="Dheu, Scientu and Shaitanu are in this adventure">
      <span aria-hidden="true"><StoryCharacter character="dheu" expression="determined" pose="action" motion="idle" /></span>
      <span aria-hidden="true"><StoryCharacter character="scientu" expression="thinking" pose="inspect" motion="idle" /></span>
      <span aria-hidden="true"><StoryCharacter character="shaitanu" expression="sly" pose="proud" motion="idle" /></span>
    </div>
  </header>

  {#if missionComplete}
    <main class="completion" aria-live="polite">
      <div class="completion__world" aria-label="Persistent Forest consequence">
        <span aria-hidden="true">🌳✨</span>
        <strong>{adventure.ending}</strong>
      </div>
      <p>{mission.successBeat.text.replaceAll('Dheu', displayName)}</p>
      <div class="unlock" role="status">{adventure.nextStateLabel}</div>
      <p class="persistence-note">This changed Forest is derived from saved story progress, so replaying the mission cannot farm another reward.</p>
      <button type="button" class="primary" onclick={onExit}>Back to Dheu's world</button>
    </main>
  {:else if currentStep}
    <main class="forest-depth__body">
      <aside class="world-panel" aria-label={`Forest world state. ${completedStepIds.length} of ${adventure.steps.length} changes complete.`}>
        <div class="problem">
          <span>WORLD PROBLEM</span>
          <p>{adventure.worldProblem}</p>
        </div>
        <div class="world-objects">
          {#each adventure.steps as step}
            <div class:changed={objectChanged(step)} class="world-object" data-world-object={step.id}>
              <span aria-hidden="true">{step.icon}</span>
              <small>{objectChanged(step) ? step.worldObjectAfter : step.worldObjectBefore}</small>
            </div>
          {/each}
        </div>
        <p class="character-line"><strong>Scientu:</strong> {adventure.characterSetup}</p>
      </aside>

      <section class="action-panel" aria-labelledby="forest-action-heading">
        <div class="step-count">ACTION {stepIndex + 1} OF {adventure.steps.length} · {currentStep.interactionFamily.replaceAll('_', ' ')}</div>
        <h2 id="forest-action-heading">{currentStep.icon} {currentStep.title}</h2>
        <p class="prompt">{currentStep.prompt}</p>
        <p class="instruction">{currentStep.instruction}</p>

        {#if currentAssembly}
          <div class="assembly" data-testid="forest-assembly" data-first-attempt={assemblyState.firstAttemptCorrect ?? 'pending'}>
            <div class="assembly-group" aria-label="Pieces">
              {#each currentAssembly.parts as part}
                <button
                  type="button"
                  class:selected={selectedPartId === part.partId}
                  class:placed={isPlaced(part.partId)}
                  disabled={isPlaced(part.partId) || stepComplete}
                  data-part={part.partId}
                  onclick={() => choosePart(part.partId)}
                >
                  {isPlaced(part.partId) ? '✓ ' : ''}{part.partId.replace('part.', '').replaceAll('-', ' ')}
                </button>
              {/each}
            </div>
            <div class="assembly-group" aria-label="Places">
              {#each currentAssembly.slots as slot}
                <button
                  type="button"
                  disabled={!selectedPartId || stepComplete}
                  data-slot={slot.slotId}
                  onclick={() => chooseSlot(slot.slotId)}
                >
                  {slot.slotId.replace('slot.', '').replaceAll('-', ' ')}
                </button>
              {/each}
            </div>
          </div>
        {:else}
          <button type="button" class="world-action" onclick={performWorldAction} disabled={stepComplete}>
            {currentStep.worldAction.action === 'water' ? 'Water it' : currentStep.worldAction.action === 'sort' ? 'Sort and clear it' : currentStep.worldAction.action === 'feed' ? 'Place the food' : currentStep.worldAction.action === 'grow' ? 'Water and watch it grow' : 'Make the change'}
          </button>
        {/if}

        {#if feedback}
          <div class:success={stepComplete} class="feedback" role="status" aria-live="polite">{feedback}</div>
        {/if}

        {#if stepComplete && !missionComplete}
          <button type="button" class="primary" onclick={nextStep}>Next forest job</button>
        {/if}
      </section>
    </main>
  {/if}
</section>

<style>
  .forest-depth{width:min(960px,100%);height:calc(100dvh - 42px);margin:auto;display:grid;grid-template-rows:auto minmax(0,1fr);gap:7px;overflow:hidden;border-radius:22px;background:linear-gradient(180deg,#eaf8e4,#f9f4db)}
  .forest-depth__header{min-height:64px;display:flex;align-items:center;gap:8px;padding:7px 9px;background:#ffffffd9;border:1px solid #24303a12;border-radius:18px}.back{width:48px;height:48px;flex:none;border:0;border-radius:14px;background:#eef3ea;font-size:1.15rem;font-weight:950}.title-copy{min-width:0;flex:1}.title-copy span,.step-count,.problem span{font-size:.58rem;font-weight:950;letter-spacing:.07em;color:#426b3c}.title-copy h1{margin:2px 0 0;font-size:clamp(1rem,4vw,1.35rem);line-height:1.05}.characters{display:flex;gap:2px;flex:none}.characters>span{width:38px;height:38px;display:grid;place-items:center}
  .forest-depth__body{min-height:0;display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:7px;overflow:hidden}.world-panel,.action-panel,.completion{min-height:0;border-radius:18px;background:#ffffffe8;border:1px solid #24303a12}.world-panel{padding:10px;overflow:auto}.problem p,.character-line,.prompt,.instruction,.completion p{margin:4px 0;font-size:.76rem;line-height:1.35}.world-objects{display:grid;grid-template-columns:repeat(2,1fr);gap:7px;margin:10px 0}.world-object{min-height:66px;display:grid;place-items:center;text-align:center;padding:6px;border-radius:13px;background:#f3ead9;border:2px dashed #b8a98f}.world-object.changed{background:#e5f6dd;border-style:solid;border-color:#74a969}.world-object span{font-size:1.35rem}.world-object small{font-size:.58rem;font-weight:850}.character-line{padding:8px;border-radius:12px;background:#eef8f8}
  .action-panel{padding:12px;display:flex;flex-direction:column;overflow:auto}.action-panel h2{margin:5px 0 3px;font-size:1.05rem}.instruction{font-weight:750}.assembly{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0}.assembly-group{display:grid;gap:7px}.assembly button,.world-action,.primary{min-height:48px;border:0;border-radius:13px;padding:8px 10px;font:inherit;font-weight:900;cursor:pointer}.assembly button{background:#f0f4f6;color:#24303a}.assembly button.selected{outline:3px solid #5e8dcb}.assembly button.placed{background:#e2f3df}.assembly button:disabled,.world-action:disabled{opacity:.66}.world-action{margin-top:10px;background:#dfefe0;color:#254a2a}.feedback{margin-top:8px;padding:9px;border-radius:12px;background:#fff2cf;font-size:.72rem;font-weight:800}.feedback.success{background:#e1f5df}.primary{margin-top:auto;background:#365f99;color:#fff}
  .completion{display:grid;align-content:center;justify-items:center;gap:10px;padding:18px;text-align:center;overflow:auto}.completion__world{display:grid;gap:8px;max-width:560px;font-size:.9rem}.completion__world span{font-size:3rem}.unlock{padding:9px 13px;border-radius:999px;background:#e5f6dd;font-weight:950}.persistence-note{max-width:520px;color:#59645b}.completion .primary{margin-top:4px;min-width:min(100%,320px)}
  @media(max-width:650px){.forest-depth{gap:5px}.characters{display:none}.forest-depth__body{grid-template-columns:1fr;grid-template-rows:minmax(0,.43fr) minmax(0,.57fr)}.world-panel{padding:7px}.problem,.character-line{display:none}.world-objects{grid-template-columns:repeat(4,1fr);gap:4px;margin:0}.world-object{min-height:54px;padding:3px}.world-object small{font-size:.5rem}.action-panel{padding:9px}.assembly{margin:7px 0}}
  @media(max-width:420px){.title-copy h1{font-size:.98rem}.forest-depth__header{min-height:58px;padding:5px}.back{width:46px;height:46px}.action-panel h2{font-size:.98rem}.prompt,.instruction{font-size:.7rem}.world-object span{font-size:1.1rem}}
  @media(prefers-reduced-motion:reduce){.forest-depth *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
</style>
