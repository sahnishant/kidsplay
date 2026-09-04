<script lang="ts">
  import { onDestroy } from 'svelte';
  import type { PresentableItem, SingleChoiceQuestion } from '../contracts/question';
  import type { SessionAttempt } from '../contracts/runtime';
  import SingleChoice from '../engines/SingleChoice.svelte';
  import DragToTarget from '../engines/DragToTarget.svelte';
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

  let {
    mode,
    onAttempt,
    onExit
  }: {
    mode: FirstPlaySurfaceMode;
    onAttempt?: (attempt: SessionAttempt) => void;
    onExit?: () => void;
  } = $props();

  const activities = mode === 'first_play' ? FIRST_PLAY_ACTIVITIES : VISUAL_REASONING_ACTIVITIES;
  const sessionId = globalThis.crypto?.randomUUID?.() ?? `first-play-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  let index = $state(0);
  let interactionEpoch = $state(0);
  let complete = $state(false);
  let feedback = $state<'discovery' | 'celebrate' | 'retry_in_place' | null>(null);
  let reaction = $state<FirstPlayMicroReaction | null>(null);
  let soundEnabled = $state(loadChildAudioPreferences().enabled);
  let causeEffectFilled = $state(false);
  let attemptCount = $state<Record<string, number>>({});
  let startedAtMs = $state(Date.now());
  let retryTimer: ReturnType<typeof setTimeout> | null = null;

  let current = $derived(activities[index]);
  let isFirstPlay = $derived(mode === 'first_play');
  let progressLabel = $derived(`${index + 1} of ${activities.length}`);
  let contrastStates = $derived.by(() => {
    void interactionEpoch;
    return current && 'kind' in current && current.kind === 'semantic_contrast'
      ? shuffled([...current.states], Math.random)
      : [];
  });

  function clearRetryTimer(): void {
    if (!retryTimer) return;
    clearTimeout(retryTimer);
    retryTimer = null;
  }

  function playPrompt(): void {
    if (!current) return;
    playQuestionPrompt(current.promptText, 'en-IN', soundEnabled);
  }

  function showReaction(event: Parameters<typeof resolveFirstPlayMicroReaction>[0], speak = true): void {
    const nextReaction = resolveFirstPlayMicroReaction(event);
    reaction = nextReaction;
    if (speak && soundEnabled) {
      playCharacterNarration(nextReaction.character, nextReaction.text, 'en-IN', true);
    }
  }

  function resetInteraction(): void {
    clearRetryTimer();
    interactionEpoch += 1;
    complete = false;
    feedback = null;
    reaction = null;
    causeEffectFilled = false;
    startedAtMs = Date.now();
  }

  function scheduleGentleRetry(): void {
    feedback = 'retry_in_place';
    showReaction('scaffold');
    clearRetryTimer();
    retryTimer = setTimeout(() => {
      interactionEpoch += 1;
      feedback = null;
      reaction = null;
      startedAtMs = Date.now();
      retryTimer = null;
      if (soundEnabled) playPrompt();
    }, 620);
  }

  function finish(event: Parameters<typeof resolveFirstPlayMicroReaction>[0] = 'celebrate'): void {
    clearRetryTimer();
    feedback = event === 'discover' || event === 'change' ? 'discovery' : 'celebrate';
    complete = true;
    showReaction(event);
  }

  function handleTouchDiscover(activity: Extract<FirstPlayActivity, { kind: 'touch_discover' }>): void {
    if (complete) return;
    feedback = 'discovery';
    reaction = resolveFirstPlayMicroReaction(activity.reactionEvent);
    if (soundEnabled) playVocabularyAudio(activity.spokenLabel, 'en-IN', true);
    complete = true;
  }

  function handleGuidedResponse(activity: ListenFindActivity | PlaceMatchActivity | ContrastActivity, response: unknown): void {
    const outcome = evaluateFirstPlayQuestion(activity, response);
    feedback = outcome.feedback;
    if (outcome.result.correct) {
      finish(activity.reactionEvent);
    } else {
      scheduleGentleRetry();
    }
  }

  function responseEnvelope(question: SingleChoiceQuestion, response: unknown, nextAttempt: number): SessionAttempt {
    const submittedAt = new Date().toISOString();
    const result = evaluate(question, response);
    return {
      question,
      response: {
        sessionId,
        questionId: question.id,
        questionRevision: question.revision,
        interactionType: question.interaction.type,
        interactionVersion: question.interaction.version,
        response,
        startedAt: new Date(startedAtMs).toISOString(),
        submittedAt,
        durationMs: Math.max(0, Date.now() - startedAtMs),
        attempts: nextAttempt,
        attemptKind: nextAttempt === 1 ? 'independent' : 'retry',
        assistanceKinds: nextAttempt === 1 ? [] : ['hint'],
        hintsUsed: nextAttempt === 1 ? [] : ['first-play.scientu.look-again']
      },
      result
    };
  }

  function handleVisualReasoningResponse(activity: VisualReasoningActivity, response: unknown): void {
    const nextAttempt = (attemptCount[activity.id] ?? 0) + 1;
    attemptCount = { ...attemptCount, [activity.id]: nextAttempt };
    const attempt = responseEnvelope(activity.question, response, nextAttempt);
    onAttempt?.(attempt);
    if (attempt.result.correct) {
      finish('celebrate');
    } else {
      scheduleGentleRetry();
    }
  }

  function handleContrast(activity: ContrastActivity, optionId: string): void {
    if (complete) return;
    handleGuidedResponse(activity, { selectedOptionIds: [optionId] });
  }

  function handleCauseEffect(activity: Extract<FirstPlayActivity, { kind: 'cause_effect' }>): void {
    if (complete) return;
    causeEffectFilled = true;
    finish(activity.reactionEvent);
  }

  function nextActivity(): void {
    stopChildAudio();
    if (index + 1 >= activities.length) {
      index = 0;
    } else {
      index += 1;
    }
    resetInteraction();
  }

  function toggleSound(): void {
    soundEnabled = !soundEnabled;
    saveChildAudioPreferences(soundEnabled);
    if (!soundEnabled) {
      stopChildAudio();
      return;
    }
    playPrompt();
  }

  function targetItemFor(question: SingleChoiceQuestion): PresentableItem | null {
    const targetId = question.solution.correctOptionIds[0];
    return question.interaction.options.find((option) => option.id === targetId) ?? null;
  }

  function currentTargetItem(): PresentableItem | null {
    if (!current || !('question' in current) || current.question.interaction.type !== 'single_choice') return null;
    return targetItemFor(current.question);
  }

  $effect(() => {
    const activityId = current?.id;
    if (!activityId) return;
    const timer = setTimeout(() => {
      if (soundEnabled) playPrompt();
    }, 90);
    return () => clearTimeout(timer);
  });

  onDestroy(() => {
    clearRetryTimer();
    stopChildAudio();
  });
</script>

<main
  class={`first-play-viewport first-play-viewport--${mode}`}
  data-first-play-mode={mode}
  data-activity-id={current?.id}
  data-feedback={feedback}
  aria-label={isFirstPlay ? 'First Play sampler' : 'Picture play sampler'}
>
  <header class="first-play-topbar">
    <button class="round-control" type="button" aria-label="Back" onclick={() => onExit?.()}>←</button>
    <div class="progress-dots" aria-label={progressLabel}>
      {#each activities as _, dotIndex}
        <span class:progress-dot--active={dotIndex === index} class:progress-dot--done={dotIndex < index} class="progress-dot"></span>
      {/each}
    </div>
    <button class="round-control" type="button" aria-label={soundEnabled ? 'Turn sound off' : 'Turn sound on'} aria-pressed={soundEnabled} onclick={toggleSound}>
      <span aria-hidden="true">{soundEnabled ? '🔊' : '🔇'}</span>
    </button>
  </header>

  <section class="first-play-stage">
    <div class="prompt-row">
      <button class="repeat-control" type="button" aria-label="Repeat" onclick={playPrompt}>
        <span aria-hidden="true">↻ 🔊</span>
      </button>
      <p class="prompt-text" aria-live="polite">{current?.promptText}</p>
    </div>

    {#if !soundEnabled && current}
      <div class="silent-clue" aria-label="Visual clue">
        {#if mode === 'visual_reasoning' && current.kind === 'odd_one_out'}
          <span class="odd-clue" aria-hidden="true">● ● ● ◇</span>
        {:else if current.kind === 'semantic_contrast'}
          <ContainerStateVisual state="full" compact label="Full bucket clue" />
        {:else if current.kind === 'cause_effect'}
          <ContainerStateVisual state="empty" compact label="Empty bucket clue" />
        {:else if currentTargetItem()}
          {@const cluePresentation = resolveItemVisualPresentation(currentTargetItem() as PresentableItem)}
          <SemanticVisualPresenter presentation={cluePresentation} class="silent-clue__visuals" itemClass="silent-clue__visual" />
        {/if}
      </div>
    {/if}

    <div class="interaction-zone" aria-live="off">
      {#if current && mode === 'first_play'}
        {@const activity = current as FirstPlayActivity}
        {#if activity.kind === 'touch_discover'}
          {@const touchPresentation = resolveItemVisualPresentation(activity.item)}
          <button
            class="discover-target"
            type="button"
            aria-label={activity.item.label}
            data-first-play-primary="true"
            disabled={complete}
            onclick={() => handleTouchDiscover(activity)}
          >
            <SemanticVisualPresenter presentation={touchPresentation} class="discover-target__visuals" itemClass="discover-target__visual" />
          </button>
        {:else if activity.kind === 'listen_find'}
          {#key `${activity.id}:${interactionEpoch}`}
            <SingleChoice
              question={activity.question}
              checkResponse={(response) => evaluate(activity.question, response)}
              onSubmit={(response) => handleGuidedResponse(activity, response)}
            />
          {/key}
        {:else if activity.kind === 'place_match'}
          {#key `${activity.id}:${interactionEpoch}`}
            <DragToTarget
              question={activity.question}
              checkResponse={(response) => evaluate(activity.question, response)}
              onSubmit={(response) => handleGuidedResponse(activity, response)}
              submissionMode="auto_when_complete"
              dropSnapTolerancePx={activity.dropSnapTolerancePx}
              showLabels={false}
              oversized={true}
            />
          {/key}
        {:else if activity.kind === 'semantic_contrast'}
          <div class="state-choice-grid" data-first-play-state-choice="true">
            {#each contrastStates as stateOption (stateOption.optionId)}
              <button
                type="button"
                class="state-choice"
                data-first-play-primary="true"
                aria-label={`${stateOption.state === 'full' ? 'Full' : 'Empty'} bucket`}
                disabled={complete}
                onclick={() => handleContrast(activity, stateOption.optionId)}
              >
                <ContainerStateVisual state={stateOption.state} />
              </button>
            {/each}
          </div>
        {:else if activity.kind === 'cause_effect'}
          <button
            type="button"
            class="cause-effect-target"
            data-first-play-primary="true"
            aria-label={causeEffectFilled ? 'Full bucket' : 'Empty bucket'}
            disabled={complete}
            onclick={() => handleCauseEffect(activity)}
          >
            <ContainerStateVisual state={causeEffectFilled ? activity.afterState : activity.beforeState} />
          </button>
        {/if}
      {:else if current && mode === 'visual_reasoning'}
        {@const activity = current as VisualReasoningActivity}
        {#key `${activity.id}:${interactionEpoch}`}
          <SingleChoice
            question={activity.question}
            checkResponse={(response) => evaluate(activity.question, response)}
            onSubmit={(response) => handleVisualReasoningResponse(activity, response)}
          />
        {/key}
      {/if}
    </div>

    <div class="reaction-slot" aria-live="polite">
      {#if reaction}
        <div class={`micro-reaction micro-reaction--${feedback ?? 'discovery'}`}>
          <span class="micro-reaction__character" aria-hidden="true">
            <StoryCharacter character={reaction.character} mood={reaction.mood} motion={feedback === 'retry_in_place' ? 'head-tilt' : feedback === 'celebrate' ? 'bounce' : 'point'} />
          </span>
          <span class="micro-reaction__text">{reaction.text}</span>
        </div>
      {/if}
    </div>
  </section>

  <footer class="first-play-footer">
    {#if complete}
      <button
        type="button"
        class="next-control"
        aria-label={index + 1 >= activities.length ? 'Replay sampler' : 'Next activity'}
        onclick={nextActivity}
      >
        <span aria-hidden="true">{index + 1 >= activities.length ? '↻' : '➜'}</span>
      </button>
    {:else}
      <span class="footer-placeholder" aria-hidden="true">•</span>
    {/if}
  </footer>
</main>

<style>
  .first-play-viewport {
    width: min(720px, 100%);
    height: calc(100dvh - 22px);
    margin: 0 auto;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto;
    gap: 6px;
    overflow: hidden;
    padding: 4px;
  }

  .first-play-topbar {
    min-height: 58px;
    display: grid;
    grid-template-columns: 58px minmax(0, 1fr) 58px;
    align-items: center;
    gap: 8px;
  }

  .round-control,
  .repeat-control,
  .next-control {
    border: 0;
    cursor: pointer;
    font: inherit;
    font-weight: 950;
    color: var(--ink);
    background: #fff;
    box-shadow: 0 5px 14px rgba(36, 48, 58, .1);
    -webkit-tap-highlight-color: transparent;
  }

  .round-control {
    width: 58px;
    height: 58px;
    border-radius: 18px;
    font-size: 1.35rem;
  }

  .progress-dots {
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    overflow: hidden;
  }

  .progress-dot {
    width: 8px;
    height: 8px;
    flex: 0 0 8px;
    border-radius: 999px;
    background: #d9e0e5;
  }
  .progress-dot--done { background: #9ecfae; }
  .progress-dot--active { width: 20px; flex-basis: 20px; background: var(--accent); }

  .first-play-stage {
    min-height: 0;
    display: grid;
    grid-template-rows: auto auto minmax(0, 1fr) minmax(58px, auto);
    gap: 6px;
    overflow: hidden;
  }

  .prompt-row {
    min-height: 62px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
  }

  .repeat-control {
    min-width: 72px;
    min-height: 58px;
    padding: 7px 12px;
    border-radius: 19px;
    font-size: 1.05rem;
  }

  .prompt-text {
    margin: 0;
    max-width: 34ch;
    color: var(--ink);
    font-size: clamp(.9rem, 3vw, 1.08rem);
    font-weight: 900;
    line-height: 1.15;
    text-align: center;
  }

  .silent-clue {
    min-height: 58px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2px;
  }

  .odd-clue {
    font-size: 1.5rem;
    letter-spacing: .12em;
  }

  :global(.silent-clue__visuals) {
    display: flex;
    justify-content: center;
    min-height: 56px;
  }

  :global(.silent-clue__visual) {
    width: 60px;
    height: 54px;
  }

  .interaction-zone {
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    display: grid;
    align-items: center;
    padding: 3px;
    overscroll-behavior: contain;
  }

  .discover-target,
  .cause-effect-target {
    width: min(330px, 88vw);
    min-height: min(50vh, 350px);
    margin: auto;
    display: grid;
    place-items: center;
    border: 3px solid #d9e1e6;
    border-radius: 34px;
    background: #fff;
    cursor: pointer;
    box-shadow: 0 10px 24px rgba(36, 48, 58, .11);
    -webkit-tap-highlight-color: transparent;
  }

  :global(.discover-target__visuals) {
    width: 100%;
    min-height: 240px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  :global(.discover-target__visual) {
    width: min(220px, 64vw);
    height: min(220px, 32vh);
  }

  .state-choice-grid {
    min-height: min(50vh, 370px);
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    align-items: stretch;
  }

  .state-choice {
    min-width: 0;
    min-height: 260px;
    display: grid;
    place-items: center;
    padding: 6px;
    border: 3px solid #d9e1e6;
    border-radius: 28px;
    background: #fff;
    cursor: pointer;
  }

  .discover-target:disabled,
  .cause-effect-target:disabled,
  .state-choice:disabled {
    opacity: 1;
  }

  .reaction-slot {
    min-height: 58px;
    display: grid;
    align-items: center;
  }

  .micro-reaction {
    width: min(360px, 100%);
    min-height: 58px;
    margin: auto;
    display: grid;
    grid-template-columns: 56px minmax(0, 1fr);
    align-items: center;
    gap: 7px;
    padding: 4px 10px;
    border-radius: 18px;
    background: #fff;
    border: 2px solid #e3e7eb;
  }

  .micro-reaction--celebrate { border-color: #9ed7b2; background: #f2fff6; }
  .micro-reaction--retry_in_place { border-color: #efc08d; background: #fff9f0; }
  .micro-reaction__character { width: 52px; height: 52px; }
  .micro-reaction__text { font-size: .82rem; font-weight: 900; line-height: 1.1; }

  .first-play-footer {
    min-height: 70px;
    display: grid;
    place-items: center;
  }

  .next-control {
    width: 78px;
    height: 64px;
    border-radius: 22px;
    background: var(--accent);
    color: #fff;
    font-size: 2rem;
  }

  .footer-placeholder { opacity: .12; }

  :global(.first-play-viewport .choice-grid--visual-dominant) {
    align-self: stretch;
  }

  :global(.first-play-viewport .choice-button--visual-dominant:focus-visible),
  .discover-target:focus-visible,
  .state-choice:focus-visible,
  .cause-effect-target:focus-visible,
  .round-control:focus-visible,
  .repeat-control:focus-visible,
  .next-control:focus-visible {
    outline: 4px solid #2f6fed;
    outline-offset: 3px;
  }

  @media (max-width: 480px) {
    .first-play-viewport {
      height: 100dvh;
      padding: 4px;
      gap: 4px;
    }

    .first-play-topbar {
      min-height: 52px;
      grid-template-columns: 52px minmax(0, 1fr) 52px;
    }

    .round-control { width: 52px; height: 52px; border-radius: 16px; }
    .prompt-row { min-height: 56px; }
    .repeat-control { min-width: 68px; min-height: 54px; }
    .prompt-text { font-size: .88rem; }
    .discover-target,
    .cause-effect-target { min-height: 300px; border-radius: 28px; }
    :global(.discover-target__visuals) { min-height: 210px; }
    .state-choice-grid { min-height: 315px; gap: 9px; }
    .state-choice { min-height: 300px; border-radius: 23px; }
    .reaction-slot { min-height: 54px; }
    .micro-reaction { min-height: 54px; grid-template-columns: 50px minmax(0, 1fr); }
    .micro-reaction__character { width: 47px; height: 47px; }
    .first-play-footer { min-height: 64px; }
    .next-control { width: 76px; height: 60px; }
  }

  @media (prefers-reduced-motion: reduce) {
    .first-play-viewport *,
    .first-play-viewport *::before,
    .first-play-viewport *::after {
      scroll-behavior: auto !important;
      animation-duration: .001ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: .001ms !important;
    }
  }
</style>
