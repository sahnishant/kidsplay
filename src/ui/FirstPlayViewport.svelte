<script lang="ts">
  import { onDestroy } from 'svelte';
  import type { PresentableItem, SingleChoiceQuestion } from '../contracts/question';
  import type { SessionAttempt } from '../contracts/runtime';
  import DragToTarget from '../engines/DragToTarget.svelte';
  import SingleChoice from '../engines/SingleChoice.svelte';
  import { evaluate } from '../evaluation/evaluate';
  import {
    FIRST_PLAY_ACTIVITIES, VISUAL_REASONING_ACTIVITIES, evaluateFirstPlayQuestion,
    resolveFirstPlayMicroReaction, type ContrastActivity, type FirstPlayActivity,
    type FirstPlayMicroReaction, type FirstPlaySurfaceMode, type ListenFindActivity,
    type PlaceMatchActivity, type VisualReasoningActivity
  } from '../experience/firstPlayProduction';
  import { shuffled } from '../mechanics/random';
  import ContainerStateVisual from '../presentation/ContainerStateVisual.svelte';
  import SemanticVisualPresenter from '../presentation/SemanticVisualPresenter.svelte';
  import StoryCharacter from '../presentation/StoryCharacter.svelte';
  import { resolveItemVisualPresentation } from '../presentation/semanticVisualPresentation';
  import { loadChildAudioPreferences, playCharacterNarration, playQuestionPrompt, playVocabularyAudio, saveChildAudioPreferences, stopChildAudio } from '../runtime/childAudio';

  let { mode, onAttempt, onExit }: { mode: FirstPlaySurfaceMode; onAttempt?: (attempt: SessionAttempt) => void; onExit?: () => void } = $props();
  const sessionId = globalThis.crypto?.randomUUID?.() ?? `first-play-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let activities = $derived(mode === 'first_play' ? FIRST_PLAY_ACTIVITIES : VISUAL_REASONING_ACTIVITIES);
  let index = $state(0), interactionEpoch = $state(0), complete = $state(false), causeEffectFilled = $state(false);
  let feedback = $state<'discovery' | 'celebrate' | 'retry_in_place' | null>(null);
  let reaction = $state<FirstPlayMicroReaction | null>(null);
  let soundEnabled = $state(loadChildAudioPreferences().enabled);
  let attemptCount = $state<Record<string, number>>({});
  let startedAtMs = $state(Date.now());
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let current = $derived(activities[index]);
  let contrastStates = $derived.by(() => { void interactionEpoch; return current?.kind === 'semantic_contrast' ? shuffled([...current.states], Math.random) : []; });

  function clearRetry(): void { if (retryTimer) clearTimeout(retryTimer); retryTimer = null; }
  function playPrompt(): void { if (current) playQuestionPrompt(current.promptText, 'en-IN', soundEnabled); }
  function showReaction(event: Parameters<typeof resolveFirstPlayMicroReaction>[0]): void {
    reaction = resolveFirstPlayMicroReaction(event);
    if (soundEnabled) playCharacterNarration(reaction.character, reaction.text, 'en-IN', true);
  }
  function resetInteraction(): void {
    clearRetry(); interactionEpoch += 1; complete = false; feedback = null; reaction = null; causeEffectFilled = false; startedAtMs = Date.now();
  }
  function scheduleRetry(): void {
    feedback = 'retry_in_place'; showReaction('scaffold'); clearRetry();
    retryTimer = setTimeout(() => {
      interactionEpoch += 1; feedback = null; reaction = null; startedAtMs = Date.now(); retryTimer = null;
      if (soundEnabled) playPrompt();
    }, 620);
  }
  function finish(event: Parameters<typeof resolveFirstPlayMicroReaction>[0] = 'celebrate'): void {
    clearRetry(); feedback = event === 'discover' || event === 'change' ? 'discovery' : 'celebrate'; complete = true; showReaction(event);
  }
  function guided(activity: ListenFindActivity | PlaceMatchActivity | ContrastActivity, response: unknown): void {
    const outcome = evaluateFirstPlayQuestion(activity, response);
    if (outcome.result.correct) finish(activity.reactionEvent); else scheduleRetry();
  }
  function touch(activity: Extract<FirstPlayActivity, { kind: 'touch_discover' }>): void {
    if (complete) return;
    feedback = 'discovery'; reaction = resolveFirstPlayMicroReaction(activity.reactionEvent);
    if (soundEnabled) playVocabularyAudio(activity.spokenLabel, 'en-IN', true);
    complete = true;
  }
  function attemptEnvelope(question: SingleChoiceQuestion, response: unknown, attempts: number): SessionAttempt {
    return {
      question,
      response: {
        sessionId, questionId: question.id, questionRevision: question.revision,
        interactionType: question.interaction.type, interactionVersion: question.interaction.version,
        response, startedAt: new Date(startedAtMs).toISOString(), submittedAt: new Date().toISOString(),
        durationMs: Math.max(0, Date.now() - startedAtMs), attempts,
        attemptKind: attempts === 1 ? 'independent' : 'retry',
        assistanceKinds: attempts === 1 ? [] : ['hint'], hintsUsed: attempts === 1 ? [] : ['first-play.scientu.look-again']
      },
      result: evaluate(question, response)
    };
  }
  function visualResponse(activity: VisualReasoningActivity, response: unknown): void {
    const attempts = (attemptCount[activity.id] ?? 0) + 1;
    attemptCount = { ...attemptCount, [activity.id]: attempts };
    const attempt = attemptEnvelope(activity.question, response, attempts);
    onAttempt?.(attempt);
    if (attempt.result.correct) finish(); else scheduleRetry();
  }
  function nextActivity(): void { stopChildAudio(); index = index + 1 >= activities.length ? 0 : index + 1; resetInteraction(); }
  function toggleSound(): void {
    soundEnabled = !soundEnabled; saveChildAudioPreferences(soundEnabled);
    if (soundEnabled) playPrompt(); else stopChildAudio();
  }
  function targetItem(): PresentableItem | null {
    if (!current || !('question' in current) || current.question.interaction.type !== 'single_choice') return null;
    const question = current.question as SingleChoiceQuestion;
    return question.interaction.options.find((option) => option.id === question.solution.correctOptionIds[0]) ?? null;
  }

  $effect(() => {
    if (!current?.id) return;
    const timer = setTimeout(() => { if (soundEnabled) playPrompt(); }, 90);
    return () => clearTimeout(timer);
  });
  onDestroy(() => { clearRetry(); stopChildAudio(); });
</script>

<main class="fp" data-first-play-mode={mode} data-activity-id={current?.id} data-feedback={feedback} aria-label={mode === 'first_play' ? 'First Play sampler' : 'Picture play sampler'}>
  <header class="fp-top">
    <button class="fp-control" type="button" aria-label="Back" onclick={() => onExit?.()}>←</button>
    <div class="fp-dots" aria-label={`${index + 1} of ${activities.length}`}>
      {#each activities as _, i}<span class:active={i === index} class:done={i < index}></span>{/each}
    </div>
    <button class="fp-control" type="button" aria-label={soundEnabled ? 'Turn sound off' : 'Turn sound on'} aria-pressed={soundEnabled} onclick={toggleSound}><span aria-hidden="true">{soundEnabled ? '🔊' : '🔇'}</span></button>
  </header>

  <section class="fp-stage">
    <div class="fp-prompt">
      <button class="fp-repeat" type="button" aria-label="Repeat" onclick={playPrompt}><span aria-hidden="true">↻ 🔊</span></button>
      <p>{current?.promptText}</p>
    </div>

    {#if !soundEnabled && current}
      <div class="silent-clue" aria-label="Visual clue">
        {#if mode === 'visual_reasoning' && current.kind === 'odd_one_out'}
          <span aria-hidden="true">● ● ● ◇</span>
        {:else if current.kind === 'semantic_contrast'}
          <ContainerStateVisual state="full" compact label="Full bucket clue" />
        {:else if current.kind === 'cause_effect'}
          <ContainerStateVisual state="empty" compact label="Empty bucket clue" />
        {:else if targetItem()}
          {@const clue = resolveItemVisualPresentation(targetItem() as PresentableItem)}
          <SemanticVisualPresenter presentation={clue} class="fp-clue" itemClass="fp-clue-item" />
        {/if}
      </div>
    {/if}

    <div class="fp-interaction">
      {#if current && mode === 'first_play'}
        {@const activity = current as FirstPlayActivity}
        {#if activity.kind === 'touch_discover'}
          {@const presentation = resolveItemVisualPresentation(activity.item)}
          <button class="fp-big" type="button" aria-label={activity.item.label} data-first-play-primary="true" disabled={complete} onclick={() => touch(activity)}>
            <SemanticVisualPresenter presentation={presentation} class="fp-big-visuals" itemClass="fp-big-visual" />
          </button>
        {:else if activity.kind === 'listen_find'}
          {#key `${activity.id}:${interactionEpoch}`}<SingleChoice question={activity.question} checkResponse={(r) => evaluate(activity.question, r)} onSubmit={(r) => guided(activity, r)} />{/key}
        {:else if activity.kind === 'place_match'}
          {#key `${activity.id}:${interactionEpoch}`}<DragToTarget question={activity.question} checkResponse={(r) => evaluate(activity.question, r)} onSubmit={(r) => guided(activity, r)} submissionMode="auto_when_complete" dropSnapTolerancePx={activity.dropSnapTolerancePx} showLabels={false} oversized={true} />{/key}
        {:else if activity.kind === 'semantic_contrast'}
          <div class="fp-states" data-first-play-state-choice="true">
            {#each contrastStates as state (state.optionId)}
              <button type="button" data-first-play-primary="true" aria-label={`${state.state === 'full' ? 'Full' : 'Empty'} bucket`} disabled={complete} onclick={() => !complete && guided(activity, { selectedOptionIds: [state.optionId] })}><ContainerStateVisual state={state.state} /></button>
            {/each}
          </div>
        {:else if activity.kind === 'cause_effect'}
          <button class="fp-big cause-effect-target" type="button" data-first-play-primary="true" aria-label={causeEffectFilled ? 'Full bucket' : 'Empty bucket'} disabled={complete} onclick={() => { if (!complete) { causeEffectFilled = true; finish(activity.reactionEvent); } }}><ContainerStateVisual state={causeEffectFilled ? activity.afterState : activity.beforeState} /></button>
        {/if}
      {:else if current && mode === 'visual_reasoning'}
        {@const activity = current as VisualReasoningActivity}
        {#key `${activity.id}:${interactionEpoch}`}<SingleChoice question={activity.question} checkResponse={(r) => evaluate(activity.question, r)} onSubmit={(r) => visualResponse(activity, r)} />{/key}
      {/if}
    </div>

    <div class="fp-reaction" aria-live="polite">
      {#if reaction}
        <span aria-hidden="true"><StoryCharacter character={reaction.character} mood={reaction.mood} motion={feedback === 'retry_in_place' ? 'head-tilt' : feedback === 'celebrate' ? 'bounce' : 'point'} /></span>
        <strong>{reaction.text}</strong>
      {/if}
    </div>
  </section>

  <footer class="fp-foot">
    {#if complete}<button class="fp-next" type="button" aria-label={index + 1 >= activities.length ? 'Replay sampler' : 'Next activity'} onclick={nextActivity}><span aria-hidden="true">{index + 1 >= activities.length ? '↻' : '➜'}</span></button>{/if}
  </footer>
</main>

<style>
  .fp{width:min(720px,100%);height:100dvh;margin:auto;display:grid;grid-template-rows:52px minmax(0,1fr) 60px;gap:4px;overflow:hidden}.fp-top{display:grid;grid-template-columns:52px 1fr 52px;gap:6px}.fp-control,.fp-repeat,.fp-next,.fp-big,.fp-states button{border:0;background:#fff;color:var(--ink);font:inherit;font-weight:900;cursor:pointer}.fp-control{width:52px;height:52px;border-radius:16px}.fp-dots{display:flex;align-items:center;justify-content:center;gap:4px;overflow:hidden}.fp-dots span{width:7px;height:7px;border-radius:9px;background:#d9e0e5}.fp-dots .done{background:#9ecfae}.fp-dots .active{width:18px;background:var(--accent)}
  .fp-stage{min-height:0;display:grid;grid-template-rows:auto auto minmax(0,1fr) 54px;gap:3px;overflow:hidden}.fp-prompt{min-height:54px;display:flex;align-items:center;justify-content:center;gap:7px}.fp-repeat{min-width:68px;min-height:54px;border-radius:16px}.fp-prompt p{margin:0;max-width:28ch;text-align:center;font-size:.9rem;font-weight:900;line-height:1.1}.silent-clue{min-height:54px;display:flex;place-content:center;align-items:center}.fp-interaction{min-height:0;display:grid;align-items:center;overflow:auto}.fp-big{width:min(330px,88vw);min-height:300px;margin:auto;border:3px solid var(--line);border-radius:26px}.fp-big:disabled,.fp-states button:disabled{opacity:1}:global(.fp-big-visuals){display:flex;min-height:210px;align-items:center;justify-content:center}:global(.fp-big-visual){width:min(210px,62vw);height:min(210px,32vh)}:global(.fp-clue){display:flex;justify-content:center}:global(.fp-clue-item){width:58px;height:52px}
  .fp-states{min-height:300px;display:grid;grid-template-columns:1fr 1fr;gap:8px}.fp-states button{min-width:0;min-height:280px;border:3px solid var(--line);border-radius:22px}.fp-reaction{min-height:54px;display:grid;grid-template-columns:48px 1fr;align-items:center;gap:6px;max-width:350px;width:100%;margin:auto}.fp-reaction>span{width:46px;height:46px}.fp-reaction strong{font-size:.8rem;line-height:1.05}.fp-foot{display:grid;place-items:center}.fp-next{width:72px;height:58px;border-radius:18px;background:var(--accent);color:#fff;font-size:1.8rem}
</style>
