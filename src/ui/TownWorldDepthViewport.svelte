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

  function label(ref: string): string {
    const parts = ref.split('.');
    return (parts[parts.length - 1] ?? ref).replaceAll('-', ' ').replaceAll('_', ' ');
  }
  function placement(step: TownAdventureStep): boolean {
    return step.assembly?.operation === 'place_part_in_slot';
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
      feedback = 'The blockage moved. Now watch what changes.';
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
  <header>
    <button type="button" class="back" onclick={onExit} aria-label="Back to Dheu's world">←</button>
    <div><small>TOWN SQUARE · WORLD MISSION</small><h1 id="town-depth-heading">{adventure.title}</h1></div>
  </header>

  {#if stepIndex >= adventure.steps.length}
    <main class="completion" aria-live="polite">
      <div aria-label="Persistent Town Square consequence"><span aria-hidden="true">🏘️✨</span><strong>{adventure.ending}</strong></div>
      <p>{mission.successBeat.text.replaceAll('Dheu', childName.trim() || 'Dheu')}</p>
      <div role="status"><strong>{adventure.nextStateLabel}</strong></div>
      <p>The changed Town Square stays this way when you come back.</p>
      <button type="button" class="primary" onclick={onExit}>Back to Dheu's world</button>
    </main>
  {:else if currentStep}
    <main class="body">
      <aside class="world" aria-label={`Town Square world state. ${completedCount} of ${adventure.steps.length} changes complete.`}>
        <div class="problem"><small>WORLD PROBLEM</small><p>{adventure.worldProblem}</p></div>
        <div class="objects">
          {#each adventure.steps as step, index}
            <div class:changed={index < completedCount} class="object" data-world-object={step.id}>
              <span aria-hidden="true">{step.icon}</span><small>{label(index < completedCount ? step.worldObjectAfter : step.worldObjectBefore)}</small>
            </div>
          {/each}
        </div>
        <p class="character-line"><strong>Scientu:</strong> {adventure.characterSetup}</p>
      </aside>

      <section class="action" aria-labelledby="town-action-heading">
        <small>ACTION {stepIndex + 1} OF {adventure.steps.length} · {currentStep.interactionFamily.replaceAll('_', ' ')}</small>
        <h2 id="town-action-heading">{currentStep.icon} {currentStep.title}</h2>
        <p>{currentStep.prompt}</p>
        {#if currentStep.id === adventure.adaptiveReviewPlan.stepId}
          <div class="review" role="note"><small>SCIENTU'S REVIEW CLUE</small><p>{review.cue}</p></div>
        {/if}
        <p><strong>{currentStep.instruction}</strong></p>

        {#if currentStep.assembly}
          <div class:placement={placement(currentStep)} class="assembly" data-testid="town-assembly" data-first-attempt={assemblyState.firstAttemptCorrect ?? 'pending'}>
            <div aria-label={placement(currentStep) ? 'Things to sort' : 'Pieces'}>
              {#each currentStep.assembly.parts as part}
                <button type="button" class:selected={selectedPartId === part.partId} class:placed={isPlaced(part.partId)} disabled={isPlaced(part.partId) || stepComplete} onclick={() => choosePart(part.partId)}>{isPlaced(part.partId) ? '✓ ' : ''}{label(part.partId)}</button>
              {/each}
            </div>
            <div aria-label={placement(currentStep) ? 'Destinations' : 'Places'}>
              {#each currentStep.assembly.slots as slot}
                <button type="button" disabled={!selectedPartId || stepComplete} onclick={() => chooseSlot(slot.slotId)}>{label(slot.slotId)}</button>
              {/each}
            </div>
          </div>
        {:else if currentStep.guidedStages?.length}
          <div class="guided" data-testid="town-guided-sequence" aria-label="Action sequence">
            {#each currentStep.guidedStages as stage, index}
              <button type="button" class:done={index < guidedStageIndex || stepComplete} class:current={index === guidedStageIndex && !stepComplete} disabled={index !== guidedStageIndex || stepComplete} onclick={advanceGuided}>{index < guidedStageIndex || stepComplete ? '✓ ' : ''}{stage}</button>
            {/each}
          </div>
        {:else if currentStep.worldAction.family === 'cause_effect' && currentStep.worldAction.stateTransition}
          <div class="cause" data-testid="town-cause-effect" data-phase={causePhase}>
            <button type="button" onclick={advanceCause} disabled={stepComplete}>{causePhase === 'act' ? currentStep.actionLabel : 'Watch what changes'}</button>
            <small>{causePhase === 'act' ? label(currentStep.worldAction.stateTransition.beforeStateRef) : label(currentStep.worldAction.stateTransition.afterStateRef)}</small>
          </div>
        {/if}

        {#if feedback}<div class:success={stepComplete} class="feedback" role="status" aria-live="polite">{feedback}</div>{/if}
        {#if stepComplete}<button type="button" class="primary" onclick={nextStep}>Next town job</button>{/if}
      </section>
    </main>
  {/if}
</section>

<style>
  .town-depth{height:calc(100dvh - 42px);display:grid;grid-template-rows:auto 1fr;gap:5px;overflow:hidden}.town-depth>header{display:flex;align-items:center;gap:6px;padding:5px}.town-depth h1,.action h2{margin:2px 0;font-size:1rem}.town-depth small{font-size:.58rem}.back,.assembly button,.guided button,.cause button,.primary{min-width:44px;min-height:48px;border:0;font:inherit}.body{min-height:0;display:grid;grid-template-columns:1fr 1.2fr;gap:5px;overflow:hidden}.world,.action,.completion{min-height:0;overflow:auto;padding:8px}.objects{display:grid;grid-template-columns:repeat(3,1fr);gap:5px}.object{display:grid;place-items:center;text-align:center;padding:4px;background:#f1e9d8}.object.changed,.placed,.guided .done,.feedback.success{background:#def2dc}.action{display:flex;flex-direction:column}.town-depth p{margin:3px 0;font-size:.7rem;line-height:1.3}.assembly{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:7px 0}.assembly>div,.guided{display:grid;gap:5px}.placement button{text-align:left}.selected,.guided .current{outline:3px solid #5680b7}.guided{margin:7px 0}.cause{display:grid;grid-template-columns:1fr auto;align-items:center;gap:7px;margin:7px 0}.cause small{padding:6px;border-radius:8px;background:#f1e9d8}.feedback,.review{margin-top:6px;padding:8px;font-size:.7rem}.review{border:1px solid #24303a1f;border-radius:10px;background:#eef8ff}.review p{font-weight:800}.completion{display:grid;align-content:center;justify-items:center;text-align:center;gap:8px}@media(max-width:650px){.problem,.character-line{display:none}.body{grid-template-columns:1fr;grid-template-rows:.38fr .62fr}.objects{grid-template-columns:repeat(5,minmax(0,1fr))}}@media(max-width:400px) and (max-height:700px){.town-depth>header{padding:3px 4px}.town-depth h1{font-size:.88rem}.body{grid-template-rows:.32fr .68fr}.world,.action{padding:5px}.objects{grid-template-columns:repeat(3,minmax(0,1fr));gap:3px}.object{padding:2px}.object small{font-size:.5rem}.action h2{font-size:.92rem}.town-depth p{font-size:.66rem}.back,.assembly button,.guided button,.cause button,.primary{min-height:44px}.review{padding:5px;margin-top:3px}.assembly,.guided,.cause{margin:4px 0;gap:4px}.assembly>div,.guided{gap:3px}}@media(prefers-reduced-motion:reduce){.town-depth *{animation:none!important}}
</style>
