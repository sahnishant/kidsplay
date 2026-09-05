<script lang="ts">
  import { getWorldDepthAdventure, type WorldDepthAdventureStep } from '../experience/worldDepthRegistry';
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

  const learningProgress = loadProgress();
  let adventure = $derived(getWorldDepthAdventure(mission.worldActionRef ?? '', learningProgress));
  let stepIndex = $state(0);
  let completedCount = $state(0);
  let assemblyState = $state<AssemblyInteractionState>(createAssemblyInteractionState());
  let selectedPartId = $state<string | null>(null);
  let guidedStageIndex = $state(0);
  let causeEffectPhase = $state<'act' | 'observe'>('act');
  let feedback = $state<string | null>(null);
  let stepComplete = $state(false);
  let currentStep = $derived(adventure.steps[stepIndex]);

  function guidedStages(step: WorldDepthAdventureStep): readonly string[] {
    return (step as WorldDepthAdventureStep & { guidedStages?: readonly string[] }).guidedStages ?? [];
  }
  function displayRef(ref: string): string {
    return ref.split('.').at(-1)?.replaceAll('-', ' ').replaceAll('_', ' ') ?? ref;
  }
  function isPlacementAssembly(step: WorldDepthAdventureStep): boolean {
    return step.assembly?.operation === 'place_part_in_slot';
  }
  function markStepComplete(step: WorldDepthAdventureStep): void {
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
    feedback = isPlacementAssembly(currentStep) ? 'Now choose where it belongs.' : 'Now choose the matching place.';
  }
  function chooseSlot(slotId: string): void {
    if (!currentStep?.assembly || !selectedPartId || stepComplete) return;
    const result = commitAssemblyPlacement(currentStep.assembly, assemblyState, { partId: selectedPartId, slotId });
    assemblyState = result.state;
    selectedPartId = null;
    if (result.feedback === 'retry_in_place') feedback = currentStep.scaffold;
    else if (result.feedback === 'complete') markStepComplete(currentStep);
    else feedback = isPlacementAssembly(currentStep) ? 'That belongs there. Keep sorting.' : 'That piece fits. Keep going.';
  }
  function advanceGuidedAction(): void {
    if (!currentStep || stepComplete) return;
    const stages = guidedStages(currentStep);
    if (!stages.length) return;
    if (guidedStageIndex >= stages.length - 1) {
      markStepComplete(currentStep);
      return;
    }
    guidedStageIndex += 1;
    feedback = `Good. Next: ${stages[guidedStageIndex]}`;
  }
  function performCauseEffectAction(): void {
    if (!currentStep || stepComplete) return;
    if (causeEffectPhase === 'act') {
      causeEffectPhase = 'observe';
      feedback = 'The blockage moved. Now watch what changes.';
      return;
    }
    markStepComplete(currentStep);
  }
  function performWorldAction(): void {
    if (currentStep && !stepComplete) markStepComplete(currentStep);
  }
  function nextStep(): void {
    if (!stepComplete) return;
    stepIndex += 1;
    assemblyState = createAssemblyInteractionState();
    selectedPartId = null;
    guidedStageIndex = 0;
    causeEffectPhase = 'act';
    feedback = null;
    stepComplete = false;
  }
  function isPlaced(partId: string): boolean {
    return assemblyState.assignments.some((assignment) => assignment.partId === partId);
  }
</script>

<section
  class="world-depth"
  data-world-depth-location={adventure.locationRef}
  data-world-depth-level={adventure.level}
  data-viewport-contract="360x640-scroll-safe"
  aria-labelledby="world-depth-heading"
>
  <header>
    <button type="button" class="back" onclick={onExit} aria-label="Back to Dheu's world">←</button>
    <div><small>{adventure.worldLabel.toUpperCase()} · WORLD MISSION</small><h1 id="world-depth-heading">{adventure.title}</h1></div>
  </header>

  {#if stepIndex >= adventure.steps.length}
    <main class="completion" aria-live="polite">
      <div aria-label={`Persistent ${adventure.worldLabel} consequence`}><span aria-hidden="true">✨</span><strong>{adventure.ending}</strong></div>
      <p>{mission.successBeat.text.replaceAll('Dheu', childName.trim() || 'Dheu')}</p>
      <div role="status"><strong>{adventure.nextStateLabel}</strong></div>
      <p>The changed {adventure.worldLabel} stays this way when you come back.</p>
      <button type="button" class="primary" onclick={onExit}>Back to Dheu's world</button>
    </main>
  {:else if currentStep}
    <main class="body">
      <aside class="world" aria-label={`${adventure.worldLabel} world state. ${completedCount} of ${adventure.steps.length} changes complete.`}>
        <div class="problem"><small>WORLD PROBLEM</small><p>{adventure.worldProblem}</p></div>
        <div class="objects">
          {#each adventure.steps as step, index}
            <div class:changed={index < completedCount} class="object" data-world-object={step.id}>
              <span aria-hidden="true">{step.icon}</span><small>{displayRef(index < completedCount ? step.worldObjectAfter : step.worldObjectBefore)}</small>
            </div>
          {/each}
        </div>
        <p class="character-line"><strong>Scientu:</strong> {adventure.characterSetup}</p>
      </aside>

      <section class="action" aria-labelledby="world-action-heading">
        <small>ACTION {stepIndex + 1} OF {adventure.steps.length} · {currentStep.interactionFamily.replaceAll('_', ' ')}</small>
        <h2 id="world-action-heading">{currentStep.icon} {currentStep.title}</h2>
        <p>{currentStep.prompt}</p>

        {#if adventure.adaptiveReview && currentStep.id === adventure.adaptiveReviewStepId}
          <div class="adaptive-review" role="note">
            <small>SCIENTU'S REVIEW CLUE</small>
            <p>{adventure.adaptiveReview.cue}</p>
          </div>
        {/if}

        <p><strong>{currentStep.instruction}</strong></p>

        {#if currentStep.assembly}
          <div class:placement={isPlacementAssembly(currentStep)} class="assembly" data-testid="world-depth-assembly" data-first-attempt={assemblyState.firstAttemptCorrect ?? 'pending'}>
            <div aria-label={isPlacementAssembly(currentStep) ? 'Things to sort' : 'Pieces'}>
              {#each currentStep.assembly.parts as part}
                <button type="button" class:selected={selectedPartId === part.partId} class:placed={isPlaced(part.partId)} disabled={isPlaced(part.partId) || stepComplete} data-part={part.partId} onclick={() => choosePart(part.partId)}>{isPlaced(part.partId) ? '✓ ' : ''}{displayRef(part.partId)}</button>
              {/each}
            </div>
            <div aria-label={isPlacementAssembly(currentStep) ? 'Destinations' : 'Places'}>
              {#each currentStep.assembly.slots as slot}
                <button type="button" disabled={!selectedPartId || stepComplete} data-slot={slot.slotId} onclick={() => chooseSlot(slot.slotId)}>{displayRef(slot.slotId)}</button>
              {/each}
            </div>
          </div>
        {:else if guidedStages(currentStep).length > 0}
          <div class="guided-actions" data-testid="world-depth-guided-sequence" aria-label="Action sequence">
            {#each guidedStages(currentStep) as stage, index}
              <button
                type="button"
                class:done={index < guidedStageIndex || stepComplete}
                class:current={index === guidedStageIndex && !stepComplete}
                disabled={index !== guidedStageIndex || stepComplete}
                onclick={advanceGuidedAction}
              >{index < guidedStageIndex || stepComplete ? '✓ ' : ''}{stage}</button>
            {/each}
          </div>
        {:else if currentStep.worldAction.family === 'cause_effect' && currentStep.worldAction.stateTransition}
          <div class="cause-effect" data-testid="world-depth-cause-effect" data-phase={causeEffectPhase}>
            <button type="button" onclick={performCauseEffectAction} disabled={stepComplete}>
              {causeEffectPhase === 'act' ? currentStep.actionLabel : 'Watch what changes'}
            </button>
            <small>{causeEffectPhase === 'act' ? displayRef(currentStep.worldAction.stateTransition.beforeStateRef) : displayRef(currentStep.worldAction.stateTransition.afterStateRef)}</small>
          </div>
        {:else}
          <button type="button" class="world-action" onclick={performWorldAction} disabled={stepComplete}>{currentStep.actionLabel}</button>
        {/if}

        {#if feedback}<div class:success={stepComplete} class="feedback" role="status" aria-live="polite">{feedback}</div>{/if}
        {#if stepComplete}<button type="button" class="primary" onclick={nextStep}>Next {adventure.worldLabel.toLowerCase()} job</button>{/if}
      </section>
    </main>
  {/if}
</section>

<style>
  .world-depth{height:calc(100dvh - 42px);display:grid;grid-template-rows:auto 1fr;gap:5px;overflow:hidden}.world-depth>header{display:flex;align-items:center;gap:6px;padding:5px}.world-depth h1,.action h2{margin:2px 0;font-size:1rem}.world-depth small{font-size:.58rem}.back,.assembly button,.guided-actions button,.cause-effect button,.world-action,.primary{min-width:44px;min-height:48px;border:0;font:inherit}.body{min-height:0;display:grid;grid-template-columns:1fr 1.2fr;gap:5px;overflow:hidden}.world,.action,.completion{min-height:0;overflow:auto;padding:8px}.objects{display:grid;grid-template-columns:repeat(3,1fr);gap:5px}.object{display:grid;place-items:center;text-align:center;padding:4px;background:#f1e9d8}.object.changed,.placed,.guided-actions .done,.feedback.success{background:#def2dc}.action{display:flex;flex-direction:column}.world-depth p{margin:3px 0;font-size:.7rem;line-height:1.3}.assembly{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:7px 0}.assembly>div,.guided-actions{display:grid;gap:5px}.placement button{text-align:left}.selected,.guided-actions .current{outline:3px solid #5680b7}.guided-actions{margin:7px 0}.cause-effect{display:grid;grid-template-columns:1fr auto;align-items:center;gap:7px;margin:7px 0}.cause-effect small{padding:6px;border-radius:8px;background:#f1e9d8}.feedback,.adaptive-review{margin-top:6px;padding:8px;font-size:.7rem}.adaptive-review{border:1px solid #24303a1f;border-radius:10px;background:#eef8ff}.adaptive-review p{font-weight:800}.completion{display:grid;align-content:center;justify-items:center;text-align:center;gap:8px}@media(max-width:650px){.problem,.character-line{display:none}.body{grid-template-columns:1fr;grid-template-rows:.38fr .62fr}.objects{grid-template-columns:repeat(5,minmax(0,1fr))}}@media(max-width:400px) and (max-height:700px){.world-depth>header{padding:3px 4px}.world-depth h1{font-size:.88rem}.body{grid-template-rows:.32fr .68fr}.world,.action{padding:5px}.objects{grid-template-columns:repeat(3,minmax(0,1fr));gap:3px}.object{padding:2px}.object small{font-size:.5rem}.action h2{font-size:.92rem}.world-depth p{font-size:.66rem}.back,.assembly button,.guided-actions button,.cause-effect button,.world-action,.primary{min-height:44px}.adaptive-review{padding:5px;margin-top:3px}.assembly,.guided-actions,.cause-effect{margin:4px 0;gap:4px}.assembly>div,.guided-actions{gap:3px}}@media(prefers-reduced-motion:reduce){.world-depth *{animation:none!important;transition:none!important}}
</style>
