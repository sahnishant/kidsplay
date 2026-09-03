<script lang="ts">
  import { onDestroy } from 'svelte';
  import type { SessionLaunch, SessionSection } from '../content';
  import type { Question } from '../contracts/question';
  import type { ResponseAssistanceKind, SessionAttempt } from '../contracts/runtime';
  import type { AvatarId } from '../runtime/localProgress';
  import { evaluate } from '../evaluation/evaluate';
  import Avatar from '../presentation/Avatar.svelte';
  import Scene from '../presentation/Scene.svelte';
  import SemanticVisualPresenter from '../presentation/SemanticVisualPresenter.svelte';
  import StoryCharacter from '../presentation/StoryCharacter.svelte';
  import VisualMeaningPresenter from '../presentation/VisualMeaningPresenter.svelte';
  import { resolveQuestionFeedbackRecipeId } from '../presentation/questionFeedbackVisual';
  import { resolveQuestionSceneId } from '../presentation/questionScene';
  import { recipeVisualPresentation } from '../presentation/semanticVisualPresentation';
  import { resolveVisualMeaningPresentation } from '../presentation/vocabularyPresentation';
  import { resolveStoryReaction } from '../story/storyReaction';
  import { resolveRetryPolicy } from '../runtime/retryPolicy';
  import {
    advanceSession,
    createSessionState,
    prepareRetry,
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
    mode = 'free_explore',
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
    mode?: SessionLaunch['mode'];
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
  const vocabularyScenePrefix = 'vocabulary:';
  let sessionState = $state(seededState);
  let restoredSubmitted = $state(seededState.submitted);
  let autoAdvanceTimer: ReturnType<typeof setTimeout> | null = null;
  let question = $derived(questions[sessionState.index]);
  let assessmentMode = $derived(mode === 'goal_mock' || mode === 'goal_pattern_mock');
  let retryPolicy = $derived(question ? resolveRetryPolicy(question, mode) : null);
  let latestResponse = $derived(question ? sessionState.responses[sessionState.index] : undefined);
  let retryAvailable = $derived(Boolean(
    question
      && sessionState.submitted
      && sessionState.lastResult
      && !sessionState.lastResult.correct
      && retryPolicy?.retryAllowed
  ));
  let repeatedDifficulty = $derived(Boolean(retryAvailable && (latestResponse?.attempts ?? 1) >= 2));
  let showCanonicalFeedback = $derived(Boolean(
    sessionState.lastResult?.correct || !retryAvailable || repeatedDifficulty
  ));
  let authoredSceneId = $derived(
    question?.stimulus?.type === 'scene' ? question.stimulus.sceneId : null
  );
  let reinforcementSceneId = $derived(
    question && !authoredSceneId && sections.length === 0 && sessionState.submitted && showCanonicalFeedback
      ? resolveQuestionSceneId(question)
      : null
  );
  let vocabularySenseKey = $derived(
    reinforcementSceneId?.startsWith(vocabularyScenePrefix)
      ? reinforcementSceneId.slice(vocabularyScenePrefix.length)
      : null
  );
  let vocabularyPresentation = $derived(
    vocabularySenseKey ? resolveVisualMeaningPresentation(vocabularySenseKey) : null
  );
  let feedbackRecipeId = $derived(
    question
      && !authoredSceneId
      && sections.length === 0
      && sessionState.submitted
      && showCanonicalFeedback
      && !reinforcementSceneId
      ? resolveQuestionFeedbackRecipeId(question)
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
    storyCompletion && question && sessionState.submitted && sessionState.lastResult && showCanonicalFeedback
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

  function clearAutoAdvance(): void {
    if (!autoAdvanceTimer) return;
    clearTimeout(autoAdvanceTimer);
    autoAdvanceTimer = null;
  }

  function autoAdvanceDelay(currentQuestion: Question): number {
    const richReinforcement = Boolean(storyCompletion)
      || Boolean(resolveQuestionSceneId(currentQuestion))
      || Boolean(resolveQuestionFeedbackRecipeId(currentQuestion));
    return richReinforcement ? 2600 : 1500;
  }

  function queueAutoAdvance(currentQuestion: Question, correct: boolean): void {
    clearAutoAdvance();
    if (assessmentMode || restoredSubmitted || !correct) return;
    autoAdvanceTimer = setTimeout(() => {
      autoAdvanceTimer = null;
      handleAdvance();
    }, autoAdvanceDelay(currentQuestion));
  }

  function handleSubmit(response: unknown): void {
    if (!question) return;
    const submittedQuestion = question;
    const result = submitResponse(sessionState, submittedQuestion, response);
    const storedResponse = sessionState.responses[sessionState.index];
    if (result && storedResponse) {
      onAttempt?.({ question: submittedQuestion, response: storedResponse, result });
      onCheckpoint?.(sessionState);
      queueAutoAdvance(submittedQuestion, result.correct);
    }
  }

  function retryAssistance(): ResponseAssistanceKind[] {
    if (!repeatedDifficulty) return [];
    const assistance: ResponseAssistanceKind[] = ['explanation'];
    if (reinforcementSceneId || feedbackRecipeId) assistance.push('visual_scaffold');
    return assistance;
  }

  function handleAdvance(): void {
    clearAutoAdvance();
    if (question && retryAvailable && prepareRetry(sessionState, question, retryAssistance())) {
      restoredSubmitted = false;
      onCheckpoint?.(sessionState);
      return;
    }

    advanceSession(sessionState);
    restoredSubmitted = false;
    if (sessionState.index >= questions.length) {
      onComplete?.(sessionState);
    } else {
      onCheckpoint?.(sessionState);
    }
  }

  function handleReplay(): void {
    clearAutoAdvance();
    replaySession(sessionState);
    restoredSubmitted = false;
    onCheckpoint?.(sessionState);
  }

  onDestroy(clearAutoAdvance);
</script>

{#if question}
  <section class="session-viewport" data-session-state={sessionState.submitted ? 'reaction' : 'answer'} data-session-mode={mode}>
    <header class="session-topbar">
      <div class="session-topbar__identity">
        {#if onExit}
          <button class="home-button" type="button" onclick={onExit} aria-label="Back to Kidsplay home">←</button>
        {/if}
        <span class="player-avatar" aria-hidden="true">
          <Avatar
            avatar={childAvatar}
            mood={sessionState.submitted && sessionState.lastResult
              ? (sessionState.lastResult.correct ? 'celebrate' : 'thinking')
              : (reasoningQuestion ? 'thinking' : 'happy')}
            motion={sessionState.submitted && sessionState.lastResult
              ? (sessionState.lastResult.correct ? 'bounce' : 'think')
              : (reasoningQuestion ? 'think' : 'idle')}
          />
        </span>
        <div class="session-title">
          <strong>{displayName}</strong>
          <span>{title}</span>
        </div>
      </div>
      <div class="progress-pill">{sessionState.index + 1} / {questions.length}</div>
    </header>

    {#if !sessionState.submitted}
      <article class="session-card answer-state">
        <div class="session-card__scroll answer-state__scroll">
          <div class="question-meta">
            {#if currentSection}
              <span class="reasoning-cue">Section: {currentSection.title} · {currentSection.marksPerQuestion} {currentSection.marksPerQuestion === 1 ? 'mark' : 'marks'} each</span>
            {/if}
            {#if onCheckpoint}<span class="saved-session-note">Mock progress saves on this device</span>{/if}
            {#if reasoningQuestion}<span class="reasoning-cue reasoning-cue--goal">Think it through</span>{/if}
            {#if sessionState.retryState}<span class="reasoning-cue reasoning-cue--goal">Try again</span>{/if}
          </div>

          {#if sessionState.retryState?.assistanceKinds.includes('explanation')}
            <div class="restored-answer-note" role="note" aria-label="Retry clue"><strong>Clue:</strong> {question.feedback.incorrect}</div>
          {/if}

          {#if authoredSceneId}
            <div class="answer-scene"><Scene sceneId={authoredSceneId} /></div>
          {/if}

          <h1 class="question-prompt">{question.prompt.text}</h1>
          <div class="interaction-host">
            <EngineHost
              {question}
              onSubmit={handleSubmit}
              feedbackMode={assessmentMode ? 'assessment' : 'play'}
              checkResponse={(response) => evaluate(question, response)}
            />
          </div>
        </div>
      </article>
    {:else}
      <article class="session-card reaction-state" aria-label="Answer reaction">
        <div class="session-card__scroll reaction-state__scroll">
          {#if restoredSubmitted}
            <div class="restored-answer-note" role="note">Your saved answer is restored. Review the feedback, then continue.</div>
          {/if}

          {#if sessionState.lastResult}
            <div class={`feedback feedback--${sessionState.lastResult.correct ? 'correct' : 'incorrect'}`} role="status">
              <strong>
                {sessionState.lastResult.correct
                  ? 'Nice work!'
                  : retryAvailable
                    ? (repeatedDifficulty ? 'Here’s a clue' : 'Give it another try')
                    : 'Try this idea'}
              </strong>
              <span>
                {sessionState.lastResult.correct || showCanonicalFeedback
                  ? question.feedback[sessionState.lastResult.feedbackKey]
                  : 'That one did not work. Try another way.'}
              </span>
            </div>
          {/if}

          {#if storyReaction}
            <div class="story-reaction" role="note" aria-label={`Story reaction from ${storyReaction.speaker}`} data-trigger={storyReaction.trigger}>
              <span class="story-reaction__actor" aria-hidden="true">
                <StoryCharacter character={storyReaction.character} mood={storyReaction.mood} motion={storyReaction.motion} />
              </span>
              <span class="story-reaction__copy">
                <strong>{storyReaction.speaker}</strong>
                <span>{storyReaction.text}</span>
              </span>
            </div>
          {/if}

          {#if vocabularySenseKey && vocabularyPresentation?.lemma}
            <div class="reinforcement-meaning">
              <VisualMeaningPresenter
                senseKey={vocabularySenseKey}
                word={vocabularyPresentation.lemma}
                mode="glance"
                phase="explanation"
              />
            </div>
          {:else if reinforcementSceneId}
            <div class="reinforcement-scene"><Scene sceneId={reinforcementSceneId} /></div>
          {:else if feedbackRecipeId && !storyReaction}
            <div class="reinforcement-recipe">
              <SemanticVisualPresenter presentation={recipeVisualPresentation(feedbackRecipeId)} />
            </div>
          {/if}

          {#if !reinforcementSceneId && !feedbackRecipeId && !storyReaction}
            <div class="reaction-avatar" aria-hidden="true">
              <Avatar
                avatar={childAvatar}
                mood={sessionState.lastResult?.correct ? 'celebrate' : 'thinking'}
                motion={sessionState.lastResult?.correct ? 'bounce' : 'think'}
              />
            </div>
          {/if}
        </div>

        <button class="next-button" type="button" onclick={handleAdvance}>
          {retryAvailable
            ? (repeatedDifficulty ? 'Try with this clue' : 'Try again')
            : (sessionState.index + 1 < questions.length ? 'Next' : 'See result')}
        </button>
      </article>
    {/if}
  </section>
{:else}
  <section class="completion-viewport">
    <article class="completion-card-viewport">
      <div class="completion-scroll">
        <div class="completion-avatar" aria-hidden="true">
          <Avatar avatar={childAvatar} mood="celebrate" motion="bounce" />
        </div>
        <h1>Nice work, {displayName}</h1>
        <p>You solved {correctCount} of {sessionState.results.length} questions correctly.</p>

        {#if storyCompletion}
          <div class="story-completion" aria-label="Story mission complete">
            {#if storyCompletion.sceneId}<div class="story-completion__scene"><Scene sceneId={storyCompletion.sceneId} /></div>{/if}
            <span class="eyebrow">MISSION COMPLETE</span>
            <p>{storyCompletion.text}</p>
            <strong>⭐ {storyCompletion.stars} · {storyCompletion.rewardLabel}</strong>
          </div>
        {/if}

        {#if maxMarks > 0}<p><strong>{earnedMarks} / {maxMarks} practice marks</strong></p>{/if}

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
      </div>

      <div class="completion-actions">
        <button class="primary-button" type="button" onclick={handleReplay}>Play again</button>
        {#if onExit}
          <button class="secondary-button" type="button" onclick={onExit}>{storyCompletion ? 'Back to Dheu’s world' : 'Back home'}</button>
        {/if}
      </div>
    </article>
  </section>
{/if}

<style>
  .session-viewport,
  .completion-viewport {
    width: min(760px, 100%);
    height: 100%;
    min-height: 0;
    margin: 0 auto;
    overflow: hidden;
  }

  .session-viewport {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    gap: 10px;
  }

  .session-topbar {
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 7px 10px;
    border: 1px solid rgba(36,48,58,.08);
    border-radius: 18px;
    background: rgba(255,255,255,.9);
  }

  .session-topbar__identity { min-width: 0; display: flex; align-items: center; gap: 8px; }
  .home-button { flex: 0 0 auto; width: 42px; height: 42px; border: 0; border-radius: 13px; background: var(--accent-soft); color: var(--accent); font-size: 1.1rem; font-weight: 950; cursor: pointer; }
  .player-avatar { flex: 0 0 auto; width: 42px; height: 42px; }
  .session-title { min-width: 0; display: grid; }
  .session-title strong { font-size: .85rem; }
  .session-title span { max-width: 48vw; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--muted); font-size: .72rem; font-weight: 700; }
  .progress-pill { flex: 0 0 auto; min-width: 62px; padding: 8px 10px; border-radius: 999px; background: #fff; font-size: .78rem; font-weight: 850; text-align: center; }

  .session-card {
    min-height: 0;
    display: grid;
    overflow: hidden;
    border: 1px solid rgba(36,48,58,.08);
    border-radius: 24px;
    background: #fff;
    box-shadow: var(--shadow);
  }

  .answer-state { grid-template-rows: minmax(0,1fr); }
  .reaction-state { grid-template-rows: minmax(0,1fr) auto; }

  .session-card__scroll {
    min-height: 0;
    overflow: auto;
    overscroll-behavior: contain;
    padding: 14px;
  }

  .question-meta { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; justify-content: center; }
  .reasoning-cue, .saved-session-note { display: inline-flex; padding: 5px 8px; border-radius: 999px; background: #f4f6f7; color: var(--muted); font-size: .66rem; font-weight: 800; }
  .reasoning-cue--goal { background: var(--accent-soft); color: var(--accent); }

  .answer-scene :global(.scene) { height: clamp(125px, 25vh, 190px); }
  .question-prompt { margin: 14px 4px 12px; font-size: clamp(1.25rem, 4.5vw, 1.85rem); line-height: 1.14; text-align: center; }
  .interaction-host { display: grid; gap: 10px; }

  .reaction-state__scroll { display: grid; align-content: center; gap: 10px; }
  .restored-answer-note { padding: 9px 11px; border: 1px solid var(--line); border-radius: 13px; color: var(--muted); font-size: .76rem; font-weight: 700; }
  .feedback { display: grid; gap: 4px; padding: 14px; border-radius: 18px; }
  .feedback--correct { background: var(--good-soft); color: var(--good); }
  .feedback--incorrect { background: var(--try-soft); color: var(--try); }
  .feedback strong { font-size: 1.05rem; }
  .feedback span { line-height: 1.38; font-weight: 650; }

  .story-reaction { display: grid; grid-template-columns: 54px minmax(0,1fr); align-items: center; gap: 10px; padding: 10px; border-radius: 16px; background: linear-gradient(135deg,#f6f7ff,#fffaf0); }
  .story-reaction__actor { width: 50px; height: 50px; }
  .story-reaction__copy { min-width: 0; display: grid; gap: 2px; }
  .story-reaction__copy strong { font-size: .78rem; }
  .story-reaction__copy > span { font-weight: 650; line-height: 1.35; }

  .reinforcement-scene :global(.scene) { height: clamp(160px, 34vh, 235px); }
  .reinforcement-meaning,
  .reinforcement-recipe { width: min(100%, 30rem); min-height: 0; margin: 0 auto; }
  .reinforcement-meaning :global(.visual-meaning-presenter) { width: 100%; }
  .reinforcement-recipe :global(.visual-recipe) { width: 100%; }
  .reaction-avatar { width: min(180px, 45vw); height: min(180px, 45vw); margin: 0 auto; }

  .next-button,
  .primary-button,
  .secondary-button {
    min-height: 52px;
    padding: 12px 16px;
    border: 0;
    border-radius: 16px;
    font: inherit;
    font-weight: 900;
    cursor: pointer;
  }
  .next-button { margin: 0 14px 14px; background: #24303a; color: #fff; }

  .completion-viewport { display: grid; place-items: center; }
  .completion-card-viewport { width: min(620px,100%); max-height: 100%; min-height: 0; display: grid; grid-template-rows: minmax(0,1fr) auto; overflow: hidden; padding: 14px; border: 1px solid rgba(36,48,58,.08); border-radius: 24px; background: #fff; box-shadow: var(--shadow); text-align: center; }
  .completion-scroll { min-height: 0; overflow: auto; overscroll-behavior: contain; padding: 4px 6px 10px; }
  .completion-avatar { width: 96px; height: 96px; margin: 0 auto; }
  .completion-card-viewport h1 { margin: 4px 0; }
  .completion-card-viewport p { color: var(--muted); font-weight: 650; }
  .eyebrow { color: var(--accent); font-size: .66rem; font-weight: 950; letter-spacing: .09em; }

  .story-completion { display: grid; gap: 6px; margin: 12px 0; padding: 12px; border-radius: 18px; background: linear-gradient(160deg,#f4f0ff,#fff9e9); }
  .story-completion p { margin: 0; }
  .story-completion__scene :global(.scene) { height: clamp(120px,22vh,170px); }

  .section-results { display: grid; grid-template-columns: repeat(auto-fit,minmax(140px,1fr)); gap: 8px; margin: 12px 0; text-align: left; }
  .section-result { display: grid; gap: 3px; padding: 10px; border: 1px solid var(--line); border-radius: 13px; }
  .section-result span, .section-result small { color: var(--muted); font-size: .75rem; }

  .completion-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding-top: 8px; }
  .primary-button { background: var(--accent); color: #fff; }
  .secondary-button { background: #f4f6f7; color: var(--ink); }

  @media (max-width: 430px) {
    .session-viewport { gap: 7px; }
    .session-topbar { padding: 5px 7px; border-radius: 15px; }
    .home-button { width: 38px; height: 38px; }
    .player-avatar { width: 36px; height: 36px; }
    .progress-pill { min-width: 55px; padding: 6px 8px; }
    .session-card { border-radius: 20px; }
    .session-card__scroll { padding: 10px; }
    .answer-scene :global(.scene) { height: 120px; }
    .question-prompt { margin-top: 10px; font-size: 1.22rem; }
    .reinforcement-scene :global(.scene) { height: 190px; }
    .next-button { margin: 0 10px 10px; }
    .completion-card-viewport { padding: 10px; }
    .completion-actions { grid-template-columns: 1fr; }
  }

  @media (max-height: 650px) {
    .answer-scene :global(.scene) { height: 105px; }
    .question-prompt { font-size: 1.15rem; }
    .reinforcement-scene :global(.scene) { height: 155px; }
    .reaction-avatar { width: 110px; height: 110px; }
  }
</style>