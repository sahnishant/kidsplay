<script lang="ts">
  import { untrack } from 'svelte';
  import type { EqualPartsQuestion, SequenceOrderQuestion } from '../contracts/question';
  import EngineHost from './EngineHost.svelte';
  import FractionDemonstration from './FractionDemonstration.svelte';
  import SemanticVisualPresenter from '../presentation/SemanticVisualPresenter.svelte';
  import { resolveItemVisualPresentation } from '../presentation/semanticVisualPresentation';
  import { describeStudioWork } from '../presentation/studioWorkDescription';
  import { evaluate } from '../evaluation/evaluate';
  import { evaluateEqualParts } from '../mechanics/equalParts.mjs';
  import { getLearningStudioActivity, loadLearningStudioQuestion, type StudioQuestion } from '../experience/learningStudios';
  import { createStudioWorkspace, readStudioWorkspace, isStudioResponse, type StudioWorkspace, type StudioLearningState } from '../experience/studioWorkspace.mjs';

  let { activityId, onClose, initialWorkspace, onWorkspaceChange = () => {} }: {
    activityId: string; onClose: () => void; initialWorkspace?: unknown;
    onWorkspaceChange?: (workspace: StudioWorkspace) => void;
  } = $props();
  let activity = $derived(getLearningStudioActivity(activityId));
  let question = $state<StudioQuestion | null>(null);
  let fractionQuestion = $derived(question?.interaction.type === 'equal_parts' ? question as EqualPartsQuestion : null);
  let sequenceQuestion = $derived(question?.interaction.type === 'sequence_order' ? question as SequenceOrderQuestion : null);
  let storySequence = $derived(question?.authoring.compiledBy === 'story-manifest->sequence_order@1');
  let loadError = $state('');
  let mode = $state<StudioLearningState['mode']>('explore');
  let demonstrationSeen = $state(false);
  let checkCount = $state(0);
  let engineState = $state<unknown>(undefined);
  let engineInitial = $state<unknown>(undefined);
  let resetKey = $state(0);
  let feedback = $state('');
  let checked = $state(false);
  let stepIndex = $state(0);
  let previewOrder = $state<string[]>([]);
  let confirmReset = $state(false);
  let restoreNotice = $state('');
  let saveAllowed = $state(true);
  let awaitingInitialState = true;
  let demonstrationLength = $derived(fractionQuestion?.interaction.categories.length ?? sequenceQuestion?.interaction.items.length ?? 1);

  $effect(() => {
    const id = activityId;
    let live = true;
    question = null;
    loadError = '';
    void loadLearningStudioQuestion(id).then((loaded) => {
      if (!live) return;
      const saved = untrack(() => $state.snapshot(initialWorkspace));
      const restored = readStudioWorkspace(id, loaded, saved);
      saveAllowed = saved == null || restored !== null;
      restoreNotice = saveAllowed ? '' : 'This activity has changed. Old work is saved. Choose Start over for a new copy.';
      engineState = restored?.state ?? undefined;
      engineInitial = restored?.state ?? undefined;
      mode = restored?.learning.mode ?? 'explore';
      demonstrationSeen = restored?.learning.demonstrationSeen ?? false;
      checkCount = restored?.learning.checkCount ?? 0;
      checked = restored?.learning.checked ?? false;
      stepIndex = restored?.learning.stepIndex ?? 0;
      awaitingInitialState = true;
      previewOrder = [];
      confirmReset = false;
      question = loaded;
      feedback = checked && restored?.state ? describeResponse(loaded, restored.state) : '';
    }).catch(() => { if (live) loadError = 'This activity could not be opened. Go back and try again.'; });
    return () => { live = false; };
  });

  function persist(): void {
    if (!question || !saveAllowed) return;
    onWorkspaceChange(createStudioWorkspace(activityId, question, $state.snapshot(engineState), { mode, demonstrationSeen, checkCount, stepIndex, checked }));
  }
  function remember(state: unknown): void {
    if (!question || checked || !isStudioResponse(question, state)) return;
    const first = awaitingInitialState;
    awaitingInitialState = false;
    const unchanged = JSON.stringify(engineState) === JSON.stringify(state);
    engineState = structuredClone(state);
    // A preview is the child's current work, never an old order or answer key.
    if (previewOrder.length && question.interaction.type === 'sequence_order') {
      previewOrder = (state as { orderedItemIds: string[] }).orderedItemIds.slice();
    }
    // Mounting/restoring a renderer is exposure, not a child action or a save.
    if (!first && !unchanged) persist();
  }
  function changeMode(next: typeof mode): void {
    if (next === mode) return;
    mode = next;
    if (next === 'watch') demonstrationSeen = true;
    feedback = '';
    checked = false;
    previewOrder = [];
    stepIndex = 0;
    confirmReset = false;
    engineInitial = $state.snapshot(engineState);
    awaitingInitialState = true;
    resetKey += 1;
    persist();
  }
  function changeStep(next: number): void {
    const length = previewOrder.length || demonstrationLength;
    if (next < 0 || next >= length) return;
    stepIndex = next;
    persist();
  }
  function retry(): void {
    engineInitial = $state.snapshot(engineState);
    checked = false;
    feedback = '';
    awaitingInitialState = true;
    resetKey += 1;
    persist();
  }
  function restart(): void {
    engineState = undefined;
    engineInitial = undefined;
    mode = 'explore';
    feedback = '';
    checked = false;
    previewOrder = [];
    stepIndex = 0;
    confirmReset = false;
    restoreNotice = '';
    saveAllowed = true;
    awaitingInitialState = true;
    resetKey += 1;
    persist();
  }
  function describeResponse(source: StudioQuestion, response: unknown): string {
    if (source.interaction.type !== 'equal_parts') return evaluate(source, response).correct ? source.feedback.correct : source.feedback.incorrect;
    const diagnostic = evaluateEqualParts(source as EqualPartsQuestion, response);
    if (diagnostic.correct) return 'Your amounts match. A different arrangement can work too.';
    if (diagnostic.status === 'incomplete') return `${diagnostic.unassigned} parts are still empty. Keep your design and fill them.`;
    const category = source.interaction.categories.find((item) => diagnostic.counts[item.id] !== diagnostic.targets[item.id]);
    if (!category) return 'Keep your design and compare the amounts.';
    const difference = diagnostic.targets[category.id] - diagnostic.counts[category.id];
    return `${category.label} needs ${Math.abs(difference)} ${difference > 0 ? 'more' : 'fewer'} ${Math.abs(difference) === 1 ? 'part' : 'parts'}. Keep your design and adjust it.`;
  }
  function submit(response: unknown): void {
    if (!question || checked || mode === 'watch' || !isStudioResponse(question, response)) return;
    engineState = structuredClone(response);
    if (mode === 'explore') {
      if (question.interaction.type === 'sequence_order') {
        previewOrder = (response as { orderedItemIds: string[] }).orderedItemIds.slice();
        stepIndex = 0;
        feedback = 'This is your order. Look at one card at a time, or keep rearranging.';
      } else feedback = 'Notice how the amounts change when you change a part.';
    } else {
      feedback = describeResponse(question, response);
      checked = true;
      checkCount = Math.min(1000000, checkCount + 1);
    }
    persist();
  }
</script>

{#snippet illustration(item: SequenceOrderQuestion['interaction']['items'][number])}
  {@const visual = resolveItemVisualPresentation(item, { recipeSurface: 'sequence-item' })}
  {#if visual.hasVisuals}
    <div class="studio__illustration" class:studio__illustration--wide={item.visualRefs?.some((ref) => ref.startsWith('visual.studio.'))}>
      <SemanticVisualPresenter presentation={visual} style="display:block;width:100%;height:100%" itemStyle="display:block;width:100%;height:100%" />
    </div>
  {/if}
{/snippet}

<section class="studio" data-learning-studio={activityId} aria-label={activity.childTitle}>
  <header class="studio__header">
    <button type="button" onclick={onClose} aria-label="Back to topic">←</button>
    <h2>{activity.childTitle}</h2>
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
    {#if checked}
      <div class="studio__feedback">
        <p role="status" aria-live="polite">{feedback}</p>
        <button type="button" onclick={retry}>Change my answer</button>
      </div>
    {/if}
    <div class="studio__body">
      {#if restoreNotice}<p role="alert">{restoreNotice}</p>{/if}
      {#if sequenceQuestion || mode === 'practice'}<p class="studio__prompt">{question.prompt.text}</p>{/if}
      {#if mode === 'watch' && fractionQuestion}
        <FractionDemonstration question={fractionQuestion} step={stepIndex} />
        <div class="studio__controls">
          <button type="button" disabled={stepIndex === 0} onclick={() => changeStep(stepIndex - 1)}>Previous step</button>
          <button type="button" disabled={stepIndex === demonstrationLength - 1} onclick={() => changeStep(stepIndex + 1)}>Next step</button>
        </div>
        <button type="button" onclick={() => changeMode('explore')}>Make my own version</button>
      {:else if mode === 'watch' && sequenceQuestion}
        {@const ids = sequenceQuestion.solution.orderedItemIds}
        {@const item = sequenceQuestion.interaction.items.find((candidate) => candidate.id === ids[stepIndex])!}
        <p>{storySequence ? 'Read at your own pace. No answers are needed to reach the ending.' : 'Follow one step at a time.'}</p>
        <article class="studio__step" aria-live="polite">
          <small>{storySequence ? 'Page' : 'Step'} {stepIndex + 1} of {ids.length}</small>
          {@render illustration(item)}
          <strong>{item.label}</strong>
        </article>
        <div class="studio__controls">
          <button type="button" disabled={stepIndex === 0} onclick={() => changeStep(stepIndex - 1)}>Previous step</button>
          <button type="button" disabled={stepIndex === ids.length - 1} onclick={() => changeStep(stepIndex + 1)}>Next step</button>
        </div>
      {:else}
        {#key `${activityId}:${mode}:${resetKey}`}
          {@const generation = resetKey}
          <div role="group" aria-label={checked ? describeStudioWork(question, engineState) : undefined}>
            <div inert={checked}>
              <EngineHost {question} onSubmit={(response) => { if (generation === resetKey) submit(response); }} checkResponse={(response) => evaluate(question!, response)}
                feedbackMode={mode === 'explore' ? 'explore' : 'play'} soundEnabled={false}
                initialState={engineInitial} onStateChange={(state) => { if (generation === resetKey) remember(state); }} />
            </div>
          </div>
        {/key}
        {#if previewOrder.length && sequenceQuestion}
          {@const item = sequenceQuestion.interaction.items.find((candidate) => candidate.id === previewOrder[stepIndex])}
          <article class="studio__step" aria-live="polite">
            <small>YOUR ORDER · {stepIndex + 1}/{previewOrder.length}</small>
            {#if item}{@render illustration(item)}<strong>{item.label}</strong>{/if}
          </article>
          <div class="studio__controls">
            <button type="button" disabled={stepIndex === 0} onclick={() => changeStep(stepIndex - 1)}>Previous card</button>
            <button type="button" disabled={stepIndex === previewOrder.length - 1} onclick={() => changeStep(stepIndex + 1)}>Next card</button>
          </div>
        {/if}
      {/if}
      <p role="status" aria-live="polite">{checked ? '' : feedback}</p>
      {#if confirmReset}
        <div class="studio__reset" role="group" aria-label="Confirm start over">
          <p>Clear this activity's work? Your other activities stay saved.</p>
          <button type="button" onclick={() => confirmReset = false}>Keep my work</button>
          <button type="button" onclick={restart}>Clear this activity</button>
        </div>
      {:else}<button type="button" class="studio__restart" onclick={() => confirmReset = true}>Start over</button>{/if}
    </div>
  {/if}
</section>

<style>
  .studio{width:100%;height:100%;min-height:0;min-width:0;display:flex;flex-direction:column;background:#fffef9;color:var(--ink,#24303a);box-sizing:border-box}
  .studio__header{display:flex;align-items:center;gap:8px;flex:none}.studio h2{margin:0;font-size:1.05rem;overflow-wrap:anywhere}.studio small{font-size:.72rem;letter-spacing:.04em}
  .studio button{font:inherit;min-height:48px;min-width:48px;padding:7px 10px;border:1px solid #cdd8c6;border-radius:12px;background:#fffef9;color:var(--ink,#24303a)}
  .studio button[aria-pressed=true]{background:#e4eddc;border-color:#57745f;font-weight:800;box-shadow:inset 0 -3px #57745f}.studio button:focus-visible{outline:3px solid #426454;outline-offset:2px}
  .studio nav,.studio__controls{display:flex;gap:6px;margin:7px 0;flex-wrap:wrap;flex:none}.studio nav button{flex:1}.studio__controls button{flex:1}
  .studio__body{overflow:auto;overscroll-behavior:contain;min-height:0;flex:1;padding:3px 4px 12px;overflow-wrap:anywhere}.studio p{margin:8px 0;line-height:1.35}.studio__prompt{font-weight:700;font-size:.94rem}
  .studio__step{display:grid;grid-template-columns:minmax(0,1fr);gap:8px;padding:10px;border:1px solid #d4dfcc;border-radius:17px;margin:8px 0;background:#f7f9ef;box-shadow:0 2px 0 #e1e7d8}.studio__step strong{font-size:1.05rem;line-height:1.4}
  .studio__illustration{width:min(180px,100%);height:130px;padding:8px;box-sizing:border-box;justify-self:center}
  /* A definite preferred width avoids cyclic percentage sizing in this grid. */
  .studio__illustration--wide{width:320px;max-width:100%;height:auto;aspect-ratio:8/5;padding:0}
  .studio__illustration :global(.visual-entity){display:block}
  .studio__feedback{flex:none;max-height:32dvh;overflow:auto;padding:3px 8px 8px;background:#f0f4e8;border-radius:12px;border:1px solid #d4dfcc}
  .studio__restart{margin-top:8px}.studio__reset{padding:8px;border:1px solid #ccd6c7;border-radius:12px}
  :global(.studio [inert] :is(.letter-order__tile,.sequence-order__item,.parts button,.categories button)){opacity:1;color:var(--ink,#24303a)}
  @media(prefers-reduced-motion:reduce){.studio *{animation:none!important;transition:none!important}}
  @media(forced-colors:active){.studio button[aria-pressed=true]{outline:2px solid Highlight}}
</style>
