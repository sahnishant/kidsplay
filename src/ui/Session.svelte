<script lang="ts">
  import type { SessionSection } from '../content';
  import type { Question } from '../contracts/question';
  import type { SessionAttempt } from '../contracts/runtime';
  import type { AvatarId } from '../runtime/localProgress';
  import { evaluate } from '../evaluation/evaluate';
  import Avatar from '../presentation/Avatar.svelte';
  import Scene from '../presentation/Scene.svelte';
  import StoryCharacter from '../presentation/StoryCharacter.svelte';
  import { resolveQuestionSceneId } from '../presentation/questionScene';
  import { resolveStoryReaction } from '../story/storyReaction';
  import {
    advanceSession,
    createSessionState,
    replaySession,
    submitResponse,
    summarizeSectionResults,
    type SessionState
  } from '../runtime/session';
  import EngineHost from './EngineHost.svelte';

  export interface StoryCompletionView {
    sceneId?: string;
    text: string;
    rewardLabel: string;
    stars: number;
  }

  let {
    title,
    questions,
    sections = [],
    childName = '',
    childAvatar = 'fox',
    initialState,
    storyCompletion,
    onAttempt,
    onCheckpoint,
    onComplete,
    onExit
  }: {
    title: string;
    questions: Question[];
    sections?: SessionSection[];
    childName?: string;
    childAvatar?: AvatarId;
    initialState?: SessionState;
    storyCompletion?: StoryCompletionView;
    onAttempt?: (attempt: SessionAttempt) => void;
    onCheckpoint?: (state: SessionState) => void;
    onComplete?: (state: SessionState) => void;
    onExit?: () => void;
  } = $props();

  function seedSessionState(): SessionState {
    return initialState ?? createSessionState();
  }

  const seededState = seedSessionState();
  let sessionState = $state(seededState);
  let restoredSubmitted = $state(seededState.submitted);
  let question = $derived(questions[sessionState.index]);
  let authoredSceneId = $derived(
    question?.stimulus?.type === 'scene' ? question.stimulus.sceneId : null
  );
  let reinforcementSceneId = $derived(
    question && !authoredSceneId && sections.length === 0 && sessionState.submitted
      ? resolveQuestionSceneId(question)
      : null
  );
  let correctCount = $derived(sessionState.results.filter((result) => result.correct).length);
  let displayName = $derived(childName.trim() || 'Explorer');
  let reasoningQuestion = $derived(
    Boolean(question && (question.knowledgeRefs?.length ?? 0) >= 2 && question.difficulty >= 3)
  );
  let currentSection = $derived(
    sections.find((section) => sessionState.index >= section.startIndex && sessionState.index < section.startIndex + section.count)
  );
  let sectionScores = $derived(summarizeSectionResults(sections, sessionState.results));
  let earnedMarks = $derived(sectionScores.reduce((sum, section) => sum + section.earnedMarks, 0));
  let maxMarks = $derived(sectionScores.reduce((sum, section) => sum + section.maxMarks, 0));
  let storyReaction = $derived(
    storyCompletion && question && sessionState.submitted && sessionState.lastResult
      ? resolveStoryReaction({
          correct: sessionState.lastResult.correct,
          difficulty: question.difficulty,
          knowledgeRefCount: question.knowledgeRefs?.length ?? 0,
          isFinalQuestion: sessionState.index + 1 >= questions.length,
          incorrectCount: sessionState.results.filter((result) => !result.correct).length,
          previousCorrect: sessionState.results[sessionState.results.length - 2]?.correct
        })
      : null
  );

  function handleSubmit(response: unknown): void {
    if (!question) return;
    const result = submitResponse(sessionState, question, response);
    const storedResponse = sessionState.responses[sessionState.responses.length - 1];
    if (result && storedResponse) {
      onAttempt?.({ question, response: storedResponse, result });
      onCheckpoint?.(sessionState);
    }
  }

  function handleAdvance(): void {
    advanceSession(sessionState);
    restoredSubmitted = false;
    if (sessionState.index >= questions.length) {
      onComplete?.(sessionState);
    } else {
      onCheckpoint?.(sessionState);
    }
  }

  function handleReplay(): void {
    replaySession(sessionState);
    restoredSubmitted = false;
    onCheckpoint?.(sessionState);
  }
</script>

{#if question}
  <section class="app-shell">
    <header class="session-header">
      <div class="session-header__identity">
        {#if onExit}
          <button class="home-button" type="button" onclick={onExit} aria-label="Back to Kidsplay home">←</button>
        {/if}
        <div class="player-avatar" aria-hidden="true">
          <Avatar
            avatar={childAvatar}
            mood={sessionState.submitted && sessionState.lastResult
              ? (sessionState.lastResult.correct ? 'celebrate' : 'thinking')
              : (reasoningQuestion ? 'thinking' : 'happy')}
            motion={sessionState.submitted && sessionState.lastResult
              ? (sessionState.lastResult.correct ? 'bounce' : 'think')
              : (reasoningQuestion ? 'think' : 'idle')}
          />
        </div>
        <div>
          <div class="brand">{displayName}</div>
          <div class="pack-title">{title}</div>
        </div>
      </div>
      <div class="progress-pill">{sessionState.index + 1} / {questions.length}</div>
    </header>

    <article class="question-card">
      {#if currentSection}
        <div class="reasoning-cue access-badge">
          {currentSection.title} · {currentSection.marksPerQuestion} {currentSection.marksPerQuestion === 1 ? 'mark' : 'marks'}
        </div>
      {/if}

      {#if onCheckpoint}
        <div class="saved-session-note">Mock progress saves on this device</div>
      {/if}

      {#if authoredSceneId}
        <Scene sceneId={authoredSceneId} />
      {/if}

      {#if reasoningQuestion}
        <div class="reasoning-cue access-badge access-badge--goal">Think it through</div>
      {/if}

      <h1 class="question-prompt">{question.prompt.text}</h1>

      {#if restoredSubmitted}
        <div class="restored-answer-note" role="note">
          Your saved answer is restored. Review the feedback below, then continue.
        </div>
      {:else}
        <div class="interaction-host">
          <EngineHost
            {question}
            onSubmit={handleSubmit}
            checkResponse={(response) => evaluate(question, response)}
          />
        </div>
      {/if}

      {#if sessionState.submitted && sessionState.lastResult}
        <div
          class={`feedback feedback--${sessionState.lastResult.correct ? 'correct' : 'incorrect'}`}
          role="status"
        >
          <strong>{sessionState.lastResult.correct ? 'Nice work!' : 'Try this idea'}</strong>
          <span>{question.feedback[sessionState.lastResult.feedbackKey]}</span>
        </div>
        {#if storyReaction}
          <div
            class="story-reaction"
            role="note"
            aria-label={`Story reaction from ${storyReaction.speaker}`}
            data-trigger={storyReaction.trigger}
          >
            <span class="story-reaction__actor" aria-hidden="true">
              <StoryCharacter
                character={storyReaction.character}
                mood={storyReaction.mood}
                motion={storyReaction.motion}
              />
            </span>
            <span class="story-reaction__copy">
              <strong>{storyReaction.speaker}</strong>
              <span>{storyReaction.text}</span>
            </span>
          </div>
        {/if}
        {#if reinforcementSceneId}
          <div class="reinforcement-scene">
            <Scene sceneId={reinforcementSceneId} />
          </div>
        {/if}
        <button class="next-button" type="button" onclick={handleAdvance}>
          {sessionState.index + 1 < questions.length ? 'Next' : 'Finish'}
        </button>
      {/if}
    </article>
  </section>
{:else}
  <section class="completion-card">
    <div class="completion-avatar" aria-hidden="true">
      <Avatar avatar={childAvatar} mood="celebrate" motion="bounce" />
    </div>
    <h1>Nice work, {displayName}</h1>
    <p>You solved {correctCount} of {sessionState.results.length} questions correctly.</p>

    {#if storyCompletion}
      <div class="story-completion" aria-label="Story mission complete">
        {#if storyCompletion.sceneId}
          <div class="story-completion__scene">
            <Scene sceneId={storyCompletion.sceneId} />
          </div>
        {/if}
        <span class="eyebrow">MISSION COMPLETE</span>
        <p>{storyCompletion.text}</p>
        <strong>⭐ {storyCompletion.stars} · {storyCompletion.rewardLabel}</strong>
      </div>
    {/if}

    {#if maxMarks > 0}
      <p><strong>{earnedMarks} / {maxMarks} practice marks</strong></p>
    {/if}

    {#if sectionScores.length > 0}
      <div class="section-results" aria-label="Section results">
        {#each sectionScores as section}
          <article class="section-result">
            <strong>{section.title}</strong>
            <span>{section.correct} / {section.total} correct</span>
            <span>{section.earnedMarks} / {section.maxMarks} marks</span>
            <small>{section.accuracy === null ? 'Not attempted' : `${Math.round(section.accuracy * 100)}% accuracy`}</small>
          </article>
        {/each}
      </div>
    {/if}

    <div class="completion-actions">
      <button class="primary-button" type="button" onclick={handleReplay}>Play again</button>
      {#if onExit}
        <button class="secondary-button" type="button" onclick={onExit}>
          {storyCompletion ? 'Back to Dheu’s world' : 'Back home'}
        </button>
      {/if}
    </div>
  </section>
{/if}

<style>
  .saved-session-note,
  .restored-answer-note {
    margin: 4px 0 12px;
    font-size: 0.8rem;
    opacity: 0.74;
  }

  .restored-answer-note {
    padding: 10px 12px;
    border: 1px solid var(--border, #d9d9d9);
    border-radius: 12px;
  }

  .story-reaction {
    display: grid;
    grid-template-columns: 48px minmax(0, 1fr);
    align-items: center;
    gap: 10px;
    margin-top: 10px;
    padding: 9px 11px 9px 8px;
    border: 1px solid rgba(90, 82, 213, 0.14);
    border-radius: 15px;
    background: linear-gradient(135deg, #f6f7ff, #fffaf0);
  }

  .story-reaction__actor {
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    border-radius: 13px;
    background: #fff;
  }

  .story-reaction__copy {
    min-width: 0;
    display: grid;
    gap: 2px;
  }

  .story-reaction__copy strong {
    font-size: 0.78rem;
  }

  .story-reaction__copy > span {
    font-weight: 650;
    line-height: 1.35;
  }

  .reinforcement-scene {
    margin-top: 12px;
  }

  .reinforcement-scene :global(.scene) {
    height: clamp(150px, 24vh, 190px);
  }

  .completion-avatar {
    width: 110px;
    height: 110px;
    margin: 0 auto 4px;
  }

  .story-completion {
    display: grid;
    gap: 7px;
    width: min(100%, 620px);
    margin: 16px auto;
    padding: 15px;
    border: 2px solid rgba(90, 82, 213, 0.16);
    border-radius: 20px;
    background: linear-gradient(160deg, #f4f0ff, #fff9e9);
  }

  .story-completion p {
    margin: 0;
    line-height: 1.45;
  }

  .story-completion__scene :global(.scene) {
    height: clamp(140px, 22vh, 180px);
  }

  .section-results {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 10px;
    width: min(100%, 620px);
    margin: 18px auto;
    text-align: left;
  }

  .section-result {
    display: grid;
    gap: 4px;
    padding: 12px;
    border: 1px solid var(--border, #d9d9d9);
    border-radius: 14px;
  }

  .section-result span,
  .section-result small {
    opacity: 0.76;
  }
</style>
