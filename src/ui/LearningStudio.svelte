<script lang="ts">
  import { untrack } from 'svelte';
  import type { EqualPartsQuestion, SequenceOrderQuestion } from '../contracts/question';
  import EngineHost from './EngineHost.svelte';
  import SemanticVisualPresenter from '../presentation/SemanticVisualPresenter.svelte';
  import { resolveItemVisualPresentation } from '../presentation/semanticVisualPresentation';
  import { evaluate } from '../evaluation/evaluate';
  import { evaluateEqualParts, equalPartsTargetCounts } from '../mechanics/equalParts.mjs';
  import { createStudioWorkspace, getLearningStudioActivity, loadLearningStudioQuestion, restoreStudioWorkspace, type StudioQuestion, type StudioWorkspace } from '../experience/learningStudios';

  let { activityId, onClose, initialWorkspace, onWorkspaceChange = () => {} }: {
    activityId: string;
    onClose: () => void;
    initialWorkspace?: StudioWorkspace;
    onWorkspaceChange?: (workspace: StudioWorkspace) => void;
  } = $props();

  let activity = $derived(getLearningStudioActivity(activityId));
  let question = $state<StudioQuestion | null>(null);
  let fractionQuestion = $derived(question?.interaction.type === 'equal_parts' ? question as EqualPartsQuestion : null);
  let sequenceQuestion = $derived(question?.interaction.type === 'sequence_order' ? question as SequenceOrderQuestion : null);
  let loadError = $state('');
  let mode = $state<'explore' | 'watch' | 'practice'>('explore');
  let engineState = $state<unknown>(undefined);
  let engineInitial = $state<unknown>(undefined);
  let resetKey = $state(0);
  let feedback = $state('');
  let checked = $state(false);
  let stepIndex = $state(0);
  let previewOrder = $state<string[]>([]);

  $effect(() => {
    const id = activityId;
    let live = true;
    question = null;
    loadError = '';
    void loadLearningStudioQuestion(id).then((loaded) => {
      if (!live) return;
      const restored = untrack(() => restoreStudioWorkspace(id, loaded, $state.snapshot(initialWorkspace)));
      engineState = restored;
      engineInitial = restored;
      question = loaded;
      mode = 'explore';
      feedback = '';
      checked = false;
      previewOrder = [];
      stepIndex = 0;
    }).catch((error: unknown) => { if (live) loadError = error instanceof Error ? error.message : 'This activity could not be opened.'; });
    return () => { live = false; };
  });

  function remember(state: unknown): void {
    engineState = structuredClone(state);
    if (question) onWorkspaceChange(createStudioWorkspace(activityId, question, state));
  }
  function changeMode(next: typeof mode): void {
    mode = next;
    feedback = '';
    checked = false;
    previewOrder = [];
    stepIndex = 0;
    engineInitial = $state.snapshot(engineState);
    resetKey += 1;
  }
  function retry(): void {
    engineInitial = $state.snapshot(engineState);
    checked = false;
    feedback = '';
    resetKey += 1;
  }
  function restart(): void {
    engineState = undefined;
    engineInitial = undefined;
    feedback = '';
    checked = false;
    previewOrder = [];
    stepIndex = 0;
    resetKey += 1;
    if (question) onWorkspaceChange(createStudioWorkspace(activityId, question, undefined));
  }
  function submit(response: unknown): void {
    if (!question) return;
    remember(response);
    if (mode === 'explore') {
      if (question.interaction.type === 'sequence_order') {
        previewOrder = (response as { orderedItemIds: string[] }).orderedItemIds.slice();
        stepIndex = 0;
        feedback = 'This is your order. Watch one card at a time, or keep rearranging.';
      } else feedback = 'Notice how the amounts change when you change a part.';
      return;
    }
    const result = evaluate(question, response);
    checked = true;
    if (question.interaction.type === 'equal_parts') {
      const diagnostic = evaluateEqualParts(question as EqualPartsQuestion, response);
      feedback = diagnostic.correct ? 'Your amounts match. A different arrangement can work too.'
        : diagnostic.status === 'incomplete' ? 'Some parts are still empty.'
        : 'Keep your design. Compare each amount with the request, then change the parts you need.';
    } else feedback = result.correct ? question.feedback.correct : 'Keep your cards. Think about what comes before and after each step.';
  }
</script>

<section class="studio" data-learning-studio={activityId} aria-label={activity.childTitle}>
  <header class="studio__header">
    <button type="button" onclick={onClose} aria-label="Back to topic">←</button>
    <div><small>EXPLORE & PRACTISE</small><h2>{activity.childTitle}</h2></div>
  </header>
  {#if loadError}
    <p role="alert">{loadError}</p><button type="button" onclick={onClose}>Back to topic</button>
  {:else if !question}
    <p role="status">Opening the activity…</p>
  {:else}
    <nav aria-label="Learning studio mode">
      <button type="button" aria-pressed={mode === 'explore'} onclick={() => changeMode('explore')}>Explore</button>
      <button type="button" aria-pressed={mode === 'watch'} onclick={() => changeMode('watch')}>Show me</button>
      <button type="button" aria-pressed={mode === 'practice'} onclick={() => changeMode('practice')}>Try it</button>
    </nav>
    <div class="studio__body">
      {#if mode === 'watch' && fractionQuestion}
        {@const counts = equalPartsTargetCounts(fractionQuestion)}
        <p>One whole is split into {fractionQuestion.interaction.partCount} equal parts.</p>
        <p>The bottom number names equal parts of a whole. The top number tells how many of those parts we mean.</p>
        {#each fractionQuestion.interaction.categories as category}
          {@const goal = fractionQuestion.solution.fractions[category.id]}
          <p><strong>{category.label}: {goal.numerator}/{goal.denominator}</strong> — use {counts[category.id]} of the {fractionQuestion.interaction.partCount} equal parts on this board.</p>
        {/each}
        <p>The amounts matter. Their positions can be different.</p>
        <button type="button" onclick={() => changeMode('explore')}>Make my own version</button>
      {:else if mode === 'watch' && sequenceQuestion}
        {@const ids = sequenceQuestion.solution.orderedItemIds}
        {@const item = sequenceQuestion!.interaction.items.find((candidate) => candidate.id === ids[stepIndex])!}
        {@const visual = resolveItemVisualPresentation(item, { recipeSurface: 'sequence-item' })}
        <p>Follow this sequence one step at a time.</p>
        <article class="studio__step" aria-live="polite">
          <small>Step {stepIndex + 1} of {ids.length}</small>
          {#if visual.hasVisuals}<SemanticVisualPresenter presentation={visual} class="studio__visual" />{/if}
          <strong>{item.label}</strong>
        </article>
        <div class="studio__controls">
          <button type="button" disabled={stepIndex === 0} onclick={() => stepIndex -= 1}>Previous step</button>
          <button type="button" disabled={stepIndex === ids.length - 1} onclick={() => stepIndex += 1}>Next step</button>
        </div>
      {:else}
        {#if mode === 'practice'}<p class="studio__prompt">{question.prompt.text}</p>{/if}
        {#key `${activityId}:${mode}:${resetKey}`}
          <EngineHost {question} onSubmit={submit} checkResponse={(response) => evaluate(question!, response)}
            feedbackMode={mode === 'explore' ? 'explore' : 'play'} soundEnabled={false}
            initialState={engineInitial} onStateChange={remember} />
        {/key}
        {#if previewOrder.length && sequenceQuestion}
          {@const item = sequenceQuestion!.interaction.items.find((candidate) => candidate.id === previewOrder[stepIndex])}
          <article class="studio__step" aria-live="polite"><small>YOUR ORDER · {stepIndex + 1}/{previewOrder.length}</small><strong>{item?.label}</strong></article>
          <div class="studio__controls">
            <button type="button" disabled={stepIndex === 0} onclick={() => stepIndex -= 1}>Previous card</button>
            <button type="button" disabled={stepIndex === previewOrder.length - 1} onclick={() => stepIndex += 1}>Next card</button>
          </div>
        {/if}
      {/if}
      <p role="status" aria-live="polite">{feedback}</p>
      {#if checked}<button type="button" onclick={retry}>Change my answer</button>{/if}
      <button type="button" class="studio__restart" onclick={restart}>Start over</button>
    </div>
  {/if}
</section>

<style>
  .studio{width:100%;min-width:0;max-height:100%;display:flex;flex-direction:column;background:var(--paper,#fff);color:var(--ink,#24303a);border-radius:14px;padding:8px;box-sizing:border-box}.studio__header{display:flex;align-items:center;gap:8px}.studio h2{margin:0;font-size:1.1rem}.studio small{font-size:.68rem}.studio button{font:inherit;min-height:48px;padding:7px 10px;border:1px solid var(--line,#ccd4db);border-radius:10px;background:var(--paper,#fff);color:inherit}.studio button[aria-pressed=true]{outline:2px solid var(--accent,#5042a8);font-weight:800}.studio button:focus-visible{outline:3px solid var(--accent,#5042a8);outline-offset:2px}.studio nav,.studio__controls{display:flex;gap:6px;margin:7px 0;flex-wrap:wrap}.studio nav button{flex:1}.studio__body{overflow:auto;min-height:0;padding:2px}.studio p{margin:8px 0;line-height:1.35}.studio__prompt{font-weight:750}.studio__step{display:grid;gap:8px;padding:14px;border:1px solid var(--line,#ccd4db);border-radius:12px;margin:8px 0}.studio__restart{margin-top:8px}:global(.studio__visual){max-width:180px;height:110px}@media(prefers-reduced-motion:reduce){.studio *{animation:none!important;transition:none!important}}
</style>
