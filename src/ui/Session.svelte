<script lang="ts">
  import type { Question } from '../contracts/question';
  import { evaluate } from '../evaluation/evaluate';
  import Scene from '../presentation/Scene.svelte';
  import { advanceSession, createSessionState, replaySession, submitResponse } from '../runtime/session';
  import EngineHost from './EngineHost.svelte';

  let { title, questions }: { title: string; questions: Question[] } = $props();
  let state = $state(createSessionState());
  let question = $derived(questions[state.index]);
  let correctCount = $derived(state.results.filter((result) => result.correct).length);

  function handleSubmit(response: unknown): void {
    if (!question) return;
    submitResponse(state, question, response);
  }
</script>

{#if question}
  <section class="app-shell">
    <header class="session-header">
      <div>
        <div class="brand">Kidsplay Lab</div>
        <div class="pack-title">{title}</div>
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
    <h1>Pack complete</h1>
    <p>You solved {correctCount} of {state.results.length} questions correctly.</p>
    <button class="primary-button" type="button" onclick={() => replaySession(state)}>Play again</button>
  </section>
{/if}
