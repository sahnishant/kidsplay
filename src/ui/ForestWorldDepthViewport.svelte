<script lang="ts">
  import { getForestWorldDepthAdventure, type ForestAdventureStep } from '../forest/forestWorldDepth';
  import {
    commitAssemblyPlacement,
    createAssemblyInteractionState,
    type AssemblyInteractionState
  } from '../mechanics/assemblyInteraction';
  import type { StoryMission } from '../story/storyTypes';

  let { mission, childName = '', onComplete, onExit }: {
    mission: StoryMission;
    childName?: string;
    onComplete: (sessionId: string) => void;
    onExit: () => void;
  } = $props();

  let adventure = $derived(getForestWorldDepthAdventure(mission.worldActionRef ?? ''));
  let displayName = $derived(childName.trim() || 'Dheu');
  let stepIndex = $state(0);
  let completedCount = $state(0);
  let assemblyState = $state<AssemblyInteractionState>(createAssemblyInteractionState());
  let selectedPartId = $state<string | null>(null);
  let feedback = $state<string | null>(null);
  let stepComplete = $state(false);
  let missionComplete = $derived(stepIndex >= adventure.steps.length);
  let currentStep = $derived(adventure.steps[stepIndex]);
  let currentAssembly = $derived(currentStep?.assembly);

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
    if (stepComplete) return;
    selectedPartId = partId;
    feedback = 'Now choose the matching place.';
  }
  function chooseSlot(slotId: string): void {
    if (!currentStep?.assembly || !selectedPartId || stepComplete) return;
    const result = commitAssemblyPlacement(currentStep.assembly, assemblyState, { partId: selectedPartId, slotId });
    assemblyState = result.state;
    selectedPartId = null;
    if (result.feedback === 'retry_in_place') feedback = currentStep.scaffold;
    else if (result.feedback === 'complete') markStepComplete(currentStep);
    else feedback = 'That piece fits. Keep going.';
  }
  function performWorldAction(): void {
    if (currentStep && !stepComplete) markStepComplete(currentStep);
  }
  function nextStep(): void {
    if (!stepComplete) return;
    stepIndex += 1;
    assemblyState = createAssemblyInteractionState();
    selectedPartId = null;
    feedback = null;
    stepComplete = false;
  }
  function isPlaced(partId: string): boolean {
    return assemblyState.assignments.some((assignment) => assignment.partId === partId);
  }
</script>

<section class="forest-depth" data-forest-level={adventure.level} aria-labelledby="forest-depth-heading">
  <header>
    <button type="button" class="back" onclick={onExit} aria-label="Back to Dheu's world">←</button>
    <div><small>FOREST LEVEL {adventure.level} · WORLD MISSION</small><h1 id="forest-depth-heading">{adventure.title}</h1></div>
  </header>

  {#if missionComplete}
    <main class="completion" aria-live="polite">
      <div aria-label="Persistent Forest consequence"><span aria-hidden="true">🌳✨</span><strong>{adventure.ending}</strong></div>
      <p>{mission.successBeat.text.replaceAll('Dheu', displayName)}</p>
      <div role="status"><strong>{adventure.nextStateLabel}</strong></div>
      <p>This changed Forest comes from saved story progress, so replaying the mission cannot farm another reward.</p>
      <button type="button" class="primary" onclick={onExit}>Back to Dheu's world</button>
    </main>
  {:else if currentStep}
    <main class="body">
      <aside class="world" aria-label={`Forest world state. ${completedCount} of ${adventure.steps.length} changes complete.`}>
        <div class="problem"><small>WORLD PROBLEM</small><p>{adventure.worldProblem}</p></div>
        <div class="objects">
          {#each adventure.steps as step, index}
            <div class:changed={index < completedCount} class="object" data-world-object={step.id}>
              <span aria-hidden="true">{step.icon}</span><small>{index < completedCount ? step.worldObjectAfter : step.worldObjectBefore}</small>
            </div>
          {/each}
        </div>
        <p class="character-line"><strong>Scientu:</strong> {adventure.characterSetup}</p>
      </aside>

      <section class="action" aria-labelledby="forest-action-heading">
        <small>ACTION {stepIndex + 1} OF {adventure.steps.length} · {currentStep.interactionFamily.replaceAll('_', ' ')}</small>
        <h2 id="forest-action-heading">{currentStep.icon} {currentStep.title}</h2>
        <p>{currentStep.prompt}</p><p><strong>{currentStep.instruction}</strong></p>

        {#if currentAssembly}
          <div class="assembly" data-testid="forest-assembly" data-first-attempt={assemblyState.firstAttemptCorrect ?? 'pending'}>
            <div aria-label="Pieces">
              {#each currentAssembly.parts as part}
                <button type="button" class:selected={selectedPartId === part.partId} class:placed={isPlaced(part.partId)} disabled={isPlaced(part.partId) || stepComplete} data-part={part.partId} onclick={() => choosePart(part.partId)}>{isPlaced(part.partId) ? '✓ ' : ''}{part.partId.replace('part.', '').replaceAll('-', ' ')}</button>
              {/each}
            </div>
            <div aria-label="Places">
              {#each currentAssembly.slots as slot}
                <button type="button" disabled={!selectedPartId || stepComplete} data-slot={slot.slotId} onclick={() => chooseSlot(slot.slotId)}>{slot.slotId.replace('slot.', '').replaceAll('-', ' ')}</button>
              {/each}
            </div>
          </div>
        {:else}
          <button type="button" class="world-action" onclick={performWorldAction} disabled={stepComplete}>{currentStep.worldAction.action === 'water' ? 'Water it' : currentStep.worldAction.action === 'sort' ? 'Sort and clear it' : currentStep.worldAction.action === 'feed' ? 'Place the food' : currentStep.worldAction.action === 'grow' ? 'Water and watch it grow' : 'Make the change'}</button>
        {/if}

        {#if feedback}<div class:success={stepComplete} class="feedback" role="status" aria-live="polite">{feedback}</div>{/if}
        {#if stepComplete}<button type="button" class="primary" onclick={nextStep}>Next forest job</button>{/if}
      </section>
    </main>
  {/if}
</section>

<style>
  .forest-depth{height:calc(100dvh - 42px);display:grid;grid-template-rows:auto 1fr;gap:5px;overflow:hidden}.forest-depth>header{display:flex;align-items:center;gap:6px;padding:5px}.forest-depth h1,.action h2{margin:2px 0;font-size:1rem}.forest-depth small{font-size:.58rem}.back,.assembly button,.world-action,.primary{min-width:44px;min-height:48px;border:0;font:inherit}.body{min-height:0;display:grid;grid-template-columns:1fr 1.2fr;gap:5px;overflow:hidden}.world,.action,.completion{min-height:0;overflow:auto;padding:8px}.objects{display:grid;grid-template-columns:1fr 1fr;gap:5px}.object{display:grid;place-items:center;text-align:center;padding:4px;background:#f1e9d8}.object.changed,.placed,.feedback.success{background:#def2dc}.action{display:flex;flex-direction:column}.forest-depth p{margin:3px 0;font-size:.7rem;line-height:1.3}.assembly{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:7px 0}.assembly>div{display:grid;gap:5px}.selected{outline:3px solid #5680b7}.feedback{margin-top:6px;padding:8px;font-size:.7rem}.completion{display:grid;align-content:center;justify-items:center;text-align:center;gap:8px}@media(max-width:650px){.problem,.character-line{display:none}.body{grid-template-columns:1fr;grid-template-rows:.4fr .6fr}.objects{grid-template-columns:repeat(4,1fr)}}@media(prefers-reduced-motion:reduce){.forest-depth *{animation:none!important;transition:none!important}}
</style>
