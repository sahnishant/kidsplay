<script lang="ts">
  import type { Question } from '../contracts/question';
  import type { SessionAttempt } from '../contracts/runtime';
  import type { AvatarId } from '../runtime/localProgress';
  import { evaluate } from '../evaluation/evaluate';
  import Scene from '../presentation/Scene.svelte';
  import { advanceSession, createSessionState, replaySession, submitResponse } from '../runtime/session';
  import EngineHost from './EngineHost.svelte';

  let {
    title,
    questions,
    childName = '',
    childAvatar = 'fox',
    onAttempt,
    onExit
  }: {
    title: string;
    questions: Question[];
    childName?: string;
    childAvatar?: AvatarId;
    onAttempt?: (attempt: SessionAttempt) => void;
    onExit?: () => void;
  } = $props();

  const avatarSymbols: Record<AvatarId, string> = {
    fox: '🦊',
    owl: '🦉',
    panda: '🐼',
    tiger: '🐯'
  };

  let state = $state(createSessionState());
  let question = $derived(questions[state.index]);
  let correctCount = $derived(state.results.filter((result) => result.correct).length);
  let displayName = $derived(childName.trim() || 'Explorer');

  function handleSubmit(response: unknown): void {
    if (!question) return;
    const result = submitResponse(state, question, response);
    const storedResponse = state.responses[state.responses.length - 1];
    if (result && storedResponse) {
      onAttempt?.({ question, response: storedResponse, result });
    }
  }
</script>

{#if question}
  <section class="app-shell">
    <header class="session-header">
      <div class="session-header__identity">
        {#if onExit}
          <button class="home-button" type="button" onclick={onExit} aria-label="Back to Kidsplay home">←</button>
        {/if}
        <div class="player-avatar" aria-hidden="true">{avatarSymbols[childAvatar]}</div>
        <div>
          <div class="brand">{displayName}</div>
          <div class="pack-title">{title}</div>
        </div>
      </div>
      <div class="progress-pill">{state.index + 1} / {questions.length}</div>
    </header>

    <article class="question-card">
      {#if question.stimulus?.type === 'scene'}
        <Scene sceneId={question.stimulus.sceneId} />
      {/if}

      <h1 class="question-prompt">{question.prompt.text}</h1>

      <div class="interaction-host">
        <EngineHost
          {question}
          onSubmit={handleSubmit}
          checkResponse={(response) => evaluate(question, response)}
        />
      </div>

      {#if state.submitted && state.lastResult}
        <div
          class={`feedback feedback--${state.lastResult.correct ? 'correct' : 'incorrect'}`}
          role="status"
        >
          <strong>{state.lastResult.correct ? 'Nice work!' : 'Try this idea'}</strong>
          <span>{question.feedback[state.lastResult.feedbackKey]}</span>
        </div>
        <button class="next-button" type="button" onclick={() => advanceSession(state)}>
          {state.index + 1 < questions.length ? 'Next' : 'See result'}
        </button>
      {/if}
    </article>
  </section>
{:else}
  <section class="completion-card">
    <div class="completion-emoji">🌟</div>
    <h1>Nice work, {displayName}</h1>
    <p>You solved {correctCount} of {state.results.length} questions correctly.</p>
    <div class="completion-actions">
      <button class="primary-button" type="button" onclick={() => replaySession(state)}>Play again</button>
      {#if onExit}
        <button class="secondary-button" type="button" onclick={onExit}>Back home</button>
      {/if}
    </div>
  </section>
{/if}
