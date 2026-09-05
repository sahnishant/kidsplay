<script lang="ts">
  import { onDestroy } from 'svelte';
  import type { PresentableItem, SingleChoiceQuestion } from '../contracts/question';
  import DragToTarget from '../engines/DragToTarget.svelte';
  import SingleChoice from '../engines/SingleChoice.svelte';
  import { evaluate } from '../evaluation/evaluate';
  import {
    FIRST_PLAY_ACTIVITIES,
    VISUAL_REASONING_ACTIVITIES,
    evaluateFirstPlayQuestion,
    resolveFirstPlayMicroReaction,
    type ContrastActivity,
    type FirstPlayActivity,
    type FirstPlayMicroReaction,
    type FirstPlaySurfaceMode,
    type LetterPictureActivity,
    type ListenFindActivity,
    type PlaceMatchActivity,
    type VisualReasoningActivity
  } from '../experience/firstPlayProduction';
  import { shuffled } from '../mechanics/random';
  import ContainerStateVisual from '../presentation/ContainerStateVisual.svelte';
  import SemanticVisualPresenter from '../presentation/SemanticVisualPresenter.svelte';
  import StoryCharacter from '../presentation/StoryCharacter.svelte';
  import { resolveItemVisualPresentation } from '../presentation/semanticVisualPresentation';
  import {
    loadChildAudioPreferences,
    playCharacterNarration,
    playQuestionPrompt,
    playVocabularyAudio,
    saveChildAudioPreferences,
    stopChildAudio
  } from '../runtime/childAudio';

  let { mode, onExit }: { mode: FirstPlaySurfaceMode; onExit?: () => void } = $props();
  let activities = $derived(mode === 'first_play' ? FIRST_PLAY_ACTIVITIES : VISUAL_REASONING_ACTIVITIES);
  let index = $state(0);
  let interactionEpoch = $state(0);
  let complete = $state(false);
  let causeEffectFilled = $state(false);
  let feedback = $state<'discovery' | 'celebrate' | 'retry_in_place' | null>(null);
  let reaction = $state<FirstPlayMicroReaction | null>(null);
  let soundEnabled = $state(loadChildAudioPreferences().enabled);
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let current = $derived(activities[index]);
  let currentPrompt = $derived(
    current ? ('question' in current ? current.question.prompt.text : current.promptText) : ''
  );
  let contrastStates = $derived.by(() => {
    void interactionEpoch;
    return current?.kind === 'semantic_contrast'
      ? shuffled([...current.states], Math.random)
      : [];
  });

  function clearRetry(): void {
    if (retryTimer) clearTimeout(retryTimer);
    retryTimer = null;
  }

  function playPrompt(): void {
    if (currentPrompt) playQuestionPrompt(currentPrompt, 'en-IN', soundEnabled);
  }

  function showReaction(event: Parameters<typeof resolveFirstPlayMicroReaction>[0]): void {
    reaction = resolveFirstPlayMicroReaction(event);
    if (soundEnabled) playCharacterNarration(reaction.character, reaction.text, 'en-IN', true);
  }

  function reset(): void {
    clearRetry();
    interactionEpoch += 1;
    complete = false;
    feedback = null;
    reaction = null;
    causeEffectFilled = false;
  }

  function retry(): void {
    feedback = 'retry_in_place';
    showReaction('scaffold');
    clearRetry();
    retryTimer = setTimeout(() => {
      interactionEpoch += 1;
      feedback = null;
      reaction = null;
      retryTimer = null;
      if (soundEnabled) playPrompt();
    }, 620);
  }

  function finish(event: Parameters<typeof resolveFirstPlayMicroReaction>[0] = 'celebrate'): void {
    clearRetry();
    feedback = event === 'discover' || event === 'change' ? 'discovery' : 'celebrate';
    complete = true;
    showReaction(event);
  }

  function guided(
    activity: ListenFindActivity | PlaceMatchActivity | LetterPictureActivity | ContrastActivity,
    response: unknown
  ): void {
    if (evaluateFirstPlayQuestion(activity, response).result.correct) finish();
    else retry();
  }

  function touch(activity: Extract<FirstPlayActivity, { kind: 'touch_discover' }>): void {
    if (complete) return;
    feedback = 'discovery';
    reaction = resolveFirstPlayMicroReaction(activity.reactionEvent);
    if (soundEnabled) playVocabularyAudio(activity.spokenLabel, 'en-IN', true);
    complete = true;
  }

  function visualResponse(activity: VisualReasoningActivity, response: unknown): void {
    if (evaluate(activity.question, response).correct) finish();
    else retry();
  }

  function next(): void {
    stopChildAudio();
    index = index + 1 >= activities.length ? 0 : index + 1;
    reset();
  }

  function toggleSound(): void {
    soundEnabled = !soundEnabled;
    saveChildAudioPreferences(soundEnabled);
    if (soundEnabled) playPrompt();
    else stopChildAudio();
  }

  function targetItem(): PresentableItem | null {
    if (!current || !('question' in current) || current.question.interaction.type !== 'single_choice') {
      return null;
    }
    const question = current.question as SingleChoiceQuestion;
    return question.interaction.options.find(
      (option) => option.id === question.solution.correctOptionIds[0]
    ) ?? null;
  }

  $effect(() => {
    if (!current?.id) return;
    const timer = setTimeout(() => {
      if (soundEnabled) playPrompt();
    }, 90);
    return () => clearTimeout(timer);
  });

  onDestroy(() => {
    clearRetry();
    stopChildAudio();
  });
</script>

<main
  class="first-play-viewport"
  style="height:100%;display:grid;grid-template-rows:auto minmax(0,1fr) auto;gap:4px;overflow:hidden"
  data-first-play-mode={mode}
  data-activity-id={current?.id}
  data-feedback={feedback}
  aria-label={mode === 'first_play' ? 'First Play sampler' : 'Picture play sampler'}
>
  <header style="min-height:44px;display:grid;grid-template-columns:auto minmax(0,1fr) auto auto;align-items:center;gap:5px;padding:2px 4px;border:1px solid #24303a12;border-radius:14px;background:#fffffff0">
    <button style="width:40px;height:40px;padding:0;border:0;border-radius:12px;background:var(--accent-soft);color:var(--accent);font:inherit;font-weight:950;cursor:pointer" type="button" aria-label="Back" onclick={() => onExit?.()}>←</button>
    <strong style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:left;font-size:.84rem;line-height:1.1" title={currentPrompt}>{currentPrompt}</strong>
    <span style="padding:4px 6px;border-radius:999px;background:#fff;color:var(--muted);font-size:.65rem;font-weight:850" aria-label={`${index + 1} of ${activities.length}`}>{index + 1}/{activities.length}</span>
    <button style="width:40px;height:40px;padding:0;border:0;border-radius:12px;background:var(--accent-soft);color:var(--accent);font:inherit;font-weight:950;cursor:pointer" type="button" aria-label={soundEnabled ? 'Turn sound off' : 'Turn sound on'} aria-pressed={soundEnabled} onclick={toggleSound}><span aria-hidden="true">{soundEnabled ? '🔊' : '🔇'}</span></button>
  </header>

  <section style="min-height:0;display:grid;grid-template-rows:auto auto minmax(0,1fr);gap:4px;overflow:hidden">
    {#if current?.kind === 'letter_picture'}
      <span data-first-play-grapheme={current.grapheme} aria-label={`Letter ${current.grapheme}`} style="justify-self:center;padding:0 9px;font-size:3rem;font-weight:950;line-height:.86">{current.grapheme}</span>
    {/if}

    {#if !soundEnabled && current}
      <div class="silent-clue" style="min-height:42px;display:flex;align-items:center;justify-content:center" aria-label="Visual clue">
        {#if mode === 'visual_reasoning' && current.kind === 'odd_one_out'}
          <span aria-hidden="true">● ● ● ◇</span>
        {:else if current.kind === 'semantic_contrast'}
          <ContainerStateVisual state="full" compact label="Full bucket clue" />
        {:else if current.kind === 'cause_effect'}
          <ContainerStateVisual state="empty" compact label="Empty bucket clue" />
        {:else if targetItem()}
          {@const clue = resolveItemVisualPresentation(targetItem() as PresentableItem)}
          <SemanticVisualPresenter presentation={clue} style="display:flex;justify-content:center" itemStyle="width:52px;height:46px" />
        {/if}
      </div>
    {/if}

    <div style="min-height:0;display:grid;align-items:center;overflow:auto">
      {#if current && mode === 'first_play'}
        {@const activity = current as FirstPlayActivity}
        {#if activity.kind === 'touch_discover'}
          {@const presentation = resolveItemVisualPresentation(activity.item)}
          <button class="choice-button" style="width:100%;min-height:230px;padding:10px" type="button" aria-label={activity.item.label} data-first-play-primary="true" disabled={complete} onclick={() => touch(activity)}>
            <SemanticVisualPresenter presentation={presentation} style="display:flex;min-height:180px;align-items:center;justify-content:center" itemStyle="width:min(185px,62vw);height:min(185px,32vh)" />
          </button>
        {:else if activity.kind === 'listen_find' || activity.kind === 'letter_picture'}
          {#key `${activity.id}:${interactionEpoch}`}<SingleChoice question={activity.question} checkResponse={(r) => evaluate(activity.question, r)} onSubmit={(r) => guided(activity, r)} />{/key}
        {:else if activity.kind === 'place_match'}
          {#key `${activity.id}:${interactionEpoch}`}<DragToTarget question={activity.question} checkResponse={(r) => evaluate(activity.question, r)} onSubmit={(r) => guided(activity, r)} submissionMode="auto_when_complete" dropSnapTolerancePx={activity.dropSnapTolerancePx} showLabels={false} oversized={true} />{/key}
        {:else if activity.kind === 'semantic_contrast'}
          <div class="choice-grid" style="min-height:230px" data-first-play-state-choice="true">
            {#each contrastStates as state (state.optionId)}
              <button class="choice-button" style="min-height:210px;padding:7px" type="button" data-first-play-primary="true" aria-label={`${state.state === 'full' ? 'Full' : 'Empty'} bucket`} disabled={complete} onclick={() => !complete && guided(activity, { selectedOptionIds: [state.optionId] })}><ContainerStateVisual state={state.state} /></button>
            {/each}
          </div>
        {:else if activity.kind === 'cause_effect'}
          <button class="choice-button cause-effect-target" style="width:100%;min-height:230px;padding:8px" type="button" data-first-play-primary="true" aria-label={causeEffectFilled ? 'Full bucket' : 'Empty bucket'} disabled={complete} onclick={() => { if (!complete) { causeEffectFilled = true; finish('change'); } }}><ContainerStateVisual state={causeEffectFilled ? activity.afterState : activity.beforeState} /></button>
        {/if}
      {:else if current && mode === 'visual_reasoning'}
        {@const activity = current as VisualReasoningActivity}
        {#key `${activity.id}:${interactionEpoch}`}<SingleChoice question={activity.question} checkResponse={(r) => evaluate(activity.question, r)} onSubmit={(r) => visualResponse(activity, r)} hideLabels={activity.kind === 'visual_scene_choice'} />{/key}
      {/if}
    </div>
  </section>

  <footer style="min-height:44px;display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:6px;padding:2px 4px" aria-live="polite">
    {#if reaction}
      <span style="width:38px;height:38px" aria-hidden="true"><StoryCharacter character={reaction.character} mood={reaction.mood} motion={feedback === 'retry_in_place' ? 'head-tilt' : feedback === 'celebrate' ? 'bounce' : 'point'} /></span>
      <strong style="min-width:0;font-size:.8rem;line-height:1.15">{reaction.text}</strong>
    {:else}
      <span style="grid-column:1/3" aria-hidden="true"></span>
    {/if}

    {#if complete}
      <button style="width:44px;height:40px;border:0;border-radius:13px;background:var(--accent);color:#fff;font-size:1.05rem;font-weight:950;cursor:pointer" type="button" aria-label={index + 1 >= activities.length ? 'Play sampler again' : 'Next activity'} onclick={next}>
        <span aria-hidden="true">{index + 1 >= activities.length ? '↻' : '➜'}</span>
      </button>
    {/if}
  </footer>
</main>
