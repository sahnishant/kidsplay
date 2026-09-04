<script lang="ts">
  import { onDestroy } from 'svelte';
  import type { SessionLaunch, SessionSection } from '../content';
  import type { Question } from '../contracts/question';
  import type { ResponseAssistanceKind, SessionAttempt } from '../contracts/runtime';
  import { resolveExperienceRecipe, type ExperienceRecipeFamily } from '../experience/experienceRecipes';
  import {
    loadChildAudioPreferences,
    playCharacterNarration,
    playQuestionPrompt,
    playVocabularyAudio,
    saveChildAudioPreferences,
    stopChildAudio,
    type ChildAudioPlaybackResult
  } from '../runtime/childAudio';
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

  const experienceCueByFamily: Record<ExperienceRecipeFamily, string> = {
    guide_to_home: 'Guide each thing toward the place where it belongs.',
    sort_or_match: 'Put the clues that belong together.',
    observe_choose: 'Look closely at the clue before you choose.',
    sequence_process: 'Put the stages from first to last, then see what changes.',
    cause_effect_discovery: 'Try the clue, then notice what happens.'
  };

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
  let soundEnabled = $state(loadChildAudioPreferences().enabled);
  let audioNotice = $state<string | null>(null);
  let interactionEpoch = $state(0);
  let question = $derived(questions[sessionState.index]);
  let assessmentMode = $derived(mode === 'goal_mock' || mode === 'goal_pattern_mock');
  let experienceRecipe = $derived(
    storyCompletion && question && !assessmentMode ? resolveExperienceRecipe(question, 'story') : null
  );
  let experienceCueBody = $derived(
    experienceRecipe ? experienceCueByFamily[experienceRecipe.family] : null
  );
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

  function showAudioAvailability(result: ChildAudioPlaybackResult): void {
    audioNotice = result.source === 'unavailable'
      ? 'This device does not have an offline voice for this language yet.'
      : result.source === 'pending_local_voice'
        ? 'Getting the offline voice ready…'
        : null;
  }

  function narratedQuestionText(): string {
    if (!question) return '';
    if (!experienceCueBody || experienceRecipe?.choreography.audioCue !== 'prompt_and_reaction') return question.prompt.text;
    return `${experienceCueBody} ${question.prompt.text}`;
  }

  function playCurrentQuestionNarration(forceRestart: boolean): ChildAudioPlaybackResult | null {
    if (!question) return null;
    const text = narratedQuestionText();
    if (experienceRecipe?.choreography.audioCue === 'prompt_and_reaction') {
      return playCharacterNarration(
        experienceRecipe.choreography.leadCharacter,
        text,
        question.language,
        forceRestart
      );
    }
    return playQuestionPrompt(text, question.language, forceRestart);
  }

  function toggleSound(): void {
    const next = saveChildAudioPreferences(!soundEnabled);
    soundEnabled = next.enabled;
    audioNotice = null;
    if (!soundEnabled) {
      stopChildAudio();
      return;
    }
    const result = playCurrentQuestionNarration(true);
    if (result) showAudioAvailability(result);
  }

  function hearStoryReaction(): void {
    if (!storyReaction || !question || !soundEnabled) return;
    showAudioAvailability(
      playCharacterNarration(storyReaction.character, storyReaction.text, question.language, true)
    );
  }

  function hearVocabulary(): void {
    if (!vocabularyPresentation?.lemma || !question || !soundEnabled) return;
    showAudioAvailability(playVocabularyAudio(vocabularyPresentation.lemma, question.language, true));
  }

  function handleSubmit(response: unknown): void {
    if (!question || sessionState.submitted) return;
    stopChildAudio();
    audioNotice = null;
    const submittedQuestion = question;
    const result = submitResponse(sessionState, submittedQuestion, response);
    const storedResponse = sessionState.responses[sessionState.index];
    if (result && storedResponse) {
      onAttempt?.({ question: submittedQuestion, response: storedResponse, result });
      onCheckpoint?.(sessionState);
    }
  }

  function retryAssistance(): ResponseAssistanceKind[] {
    if (!repeatedDifficulty) return [];
    const assistance: ResponseAssistanceKind[] = ['explanation'];
    if (reinforcementSceneId || feedbackRecipeId) assistance.push('visual_scaffold');
    return assistance;
  }

  function handleAdvance(): void {
    stopChildAudio();
    audioNotice = null;
    if (question && retryAvailable && prepareRetry(sessionState, question, retryAssistance())) {
      restoredSubmitted = false;
      interactionEpoch += 1;
      onCheckpoint?.(sessionState);
      return;
    }

    advanceSession(sessionState);
    restoredSubmitted = false;
    interactionEpoch += 1;
    if (sessionState.index >= questions.length) {
      onComplete?.(sessionState);
    } else {
      onCheckpoint?.(sessionState);
    }
  }

  function handleReplay(): void {
    stopChildAudio();
    audioNotice = null;
    replaySession(sessionState);
    restoredSubmitted = false;
    interactionEpoch += 1;
    onCheckpoint?.(sessionState);
  }

  function handleExit(): void {
    stopChildAudio();
    audioNotice = null;
    onExit?.();
  }

  $effect(() => {
    const currentQuestion = question;
    const submitted = sessionState.submitted;
    const enabled = soundEnabled;
    if (!currentQuestion || submitted || !enabled) return;
    playCurrentQuestionNarration(true);
  });

  onDestroy(() => stopChildAudio());
</script>

{#if question}
  <section class="session-viewport" data-session-state={sessionState.submitted ? 'reaction' : 'answer'} data-session-mode={mode}>
    <header class="session-topbar">
      {#if onExit}
        <button class="home-button" type="button" onclick={handleExit} aria-label="Back to Kidsplay home">←</button>
      {/if}
      <strong class="session-title" title={title}>{title}</strong>
      <button
        class="sound-button"
        type="button"
        aria-pressed={soundEnabled}
        aria-label={soundEnabled ? 'Turn sound off' : 'Turn sound on'}
        title={soundEnabled ? 'Sound on' : 'Sound off'}
        onclick={toggleSound}
      >
        <span aria-hidden="true">{soundEnabled ? '🔊' : '🔇'}</span>
      </button>
      <div class="progress-pill">{sessionState.index + 1} / {questions.length}</div>
    </header>

    <article
      class="session-card answer-state"
      class:answer-state--submitted={sessionState.submitted}
      aria-label={sessionState.submitted ? 'Question with answer feedback' : 'Question'}
    >
      <div class="session-card__scroll answer-state__scroll">
        {#if currentSection || (onCheckpoint && assessmentMode) || sessionState.retryState}
          <div class="question-meta">
            {#if currentSection}
              <span class="reasoning-cue">{currentSection.title} · {currentSection.marksPerQuestion} {currentSection.marksPerQuestion === 1 ? 'mark' : 'marks'}</span>
            {/if}
            {#if onCheckpoint && assessmentMode}<span class="saved-session-note">Saved on this device</span>{/if}
            {#if sessionState.retryState}<span class="reasoning-cue reasoning-cue--goal">Try again</span>{/if}
          </div>
        {/if}

        {#if sessionState.retryState?.assistanceKinds.includes('explanation')}
          <div class="restored-answer-note" role="note" aria-label="Retry clue"><strong>Clue:</strong> {question.feedback.incorrect}</div>
        {/if}

        {#if authoredSceneId}
          <div class="answer-scene"><Scene sceneId={authoredSceneId} /></div>
        {/if}

        <h1 class="question-prompt">{question.prompt.text}</h1>

        {#if audioNotice}
          <p class="saved-session-note audio-notice" aria-live="polite">{audioNotice}</p>
        {/if}

        {#if !restoredSubmitted}
          <div class="interaction-host">
            {#key `${question.id}:${interactionEpoch}`}
              <EngineHost
                {question}
                onSubmit={handleSubmit}
                feedbackMode={assessmentMode ? 'assessment' : 'play'}
                {soundEnabled}
                checkResponse={(response) => evaluate(question, response)}
              />
            {/key}
          </div>
        {:else}
          <div class="restored-answer-note" role="note">Your saved answer is restored. Review the feedback, then continue.</div>
        {/if}

        {#if sessionState.submitted && sessionState.lastResult}
          <section class="inline-reaction" aria-live="polite" aria-label="Answer feedback">
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

            {#if storyReaction}
              <div class="story-reaction" role="note" aria-label={`Story reaction from ${storyReaction.speaker}`} data-trigger={storyReaction.trigger}>
                <span class="story-reaction__actor" aria-hidden="true">
                  <StoryCharacter character={storyReaction.character} mood={storyReaction.mood} motion={storyReaction.motion} />
                </span>
                <span class="story-reaction__copy">
                  <strong>{storyReaction.speaker}</strong>
                  <span>{storyReaction.text}</span>
                  <button
                    class="hear-reaction"
                    type="button"
                    disabled={!soundEnabled}
                    aria-label={`Hear ${storyReaction.speaker}`}
                    onclick={hearStoryReaction}
                  >
                    <span aria-hidden="true">🔊</span>
                  </button>
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
                  onSpeak={soundEnabled ? hearVocabulary : null}
                />
              </div>
            {:else if reinforcementSceneId}
              <div class="reinforcement-scene"><Scene sceneId={reinforcementSceneId} /></div>
            {:else if feedbackRecipeId && !storyReaction}
              <div class="reinforcement-recipe">
                <SemanticVisualPresenter presentation={recipeVisualPresentation(feedbackRecipeId)} />
              </div>
            {/if}
          </section>
        {/if}
      </div>

      {#if sessionState.submitted}
        <button class="next-button" type="button" onclick={handleAdvance}>
          {retryAvailable
            ? (repeatedDifficulty ? 'Try with this clue' : 'Try again')
            : (sessionState.index + 1 < questions.length ? 'Next' : 'Finish')}
        </button>
      {/if}
    </article>
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
          <button class="secondary-button" type="button" onclick={handleExit}>{storyCompletion ? 'Back to Dheu’s world' : 'Back home'}</button>
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
    gap: 6px;
  }

  .session-topbar {
    min-width: 0;
    min-height: 46px;
    display: grid;
    grid-template-columns: auto minmax(0,1fr) auto auto;
    align-items: center;
    gap: 6px;
    padding: 3px 6px;
    border: 1px solid rgba(36,48,58,.08);
    border-radius: 15px;
    background: rgba(255,255,255,.9);
  }

  .home-button,
  .sound-button {
    flex: 0 0 auto;
    width: 40px;
    height: 40px;
    padding: 0;
    border: 0;
    border-radius: 12px;
    background: var(--accent-soft);
    color: var(--accent);
    font-size: 1rem;
    font-weight: 950;
    cursor: pointer;
  }

  .session-title {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: .8rem;
  }

  .progress-pill {
    flex: 0 0 auto;
    min-width: 52px;
    padding: 6px 8px;
    border-radius: 999px;
    background: #fff;
    font-size: .72rem;
    font-weight: 850;
    text-align: center;
  }

  .session-card {
    min-height: 0;
    display: grid;
    grid-template-rows: minmax(0,1fr);
    overflow: hidden;
    border: 1px solid rgba(36,48,58,.08);
    border-radius: 20px;
    background: #fff;
    box-shadow: var(--shadow);
  }
  .answer-state--submitted { grid-template-rows: minmax(0,1fr) auto; }

  .session-card__scroll {
    min-height: 0;
    overflow: auto;
    overscroll-behavior: contain;
    padding: 10px 12px 12px;
  }

  .question-meta { display: flex; flex-wrap: wrap; gap: 5px; align-items: center; justify-content: center; }
  .reasoning-cue, .saved-session-note { display: inline-flex; padding: 4px 7px; border-radius: 999px; background: #f4f6f7; color: var(--muted); font-size: .62rem; font-weight: 800; }
  .reasoning-cue--goal { background: var(--accent-soft); color: var(--accent); }
  .audio-notice { display: block; width: fit-content; margin: 0 auto 6px; text-align: center; }

  .answer-scene :global(.scene) { height: clamp(110px, 22vh, 165px); }
  .question-prompt { margin: 7px 4px 9px; font-size: clamp(1.05rem, 3.9vw, 1.45rem); line-height: 1.12; text-align: center; }
  .interaction-host { display: grid; gap: 8px; }

  .restored-answer-note { margin: 6px 0; padding: 8px 10px; border: 1px solid var(--line); border-radius: 12px; color: var(--muted); font-size: .74rem; font-weight: 700; }
  .inline-reaction { display: grid; gap: 7px; margin-top: 9px; }
  .feedback { display: grid; gap: 2px; padding: 9px 11px; border-radius: 14px; }
  .feedback--correct { background: var(--good-soft); color: var(--good); }
  .feedback--incorrect { background: var(--try-soft); color: var(--try); }
  .feedback strong { font-size: .95rem; }
  .feedback span { line-height: 1.28; font-size: .78rem; font-weight: 650; }

  .story-reaction { display: grid; grid-template-columns: 46px minmax(0,1fr); align-items: center; gap: 7px; padding: 7px 9px; border-radius: 14px; background: linear-gradient(135deg,#f6f7ff,#fffaf0); }
  .story-reaction__actor { width: 44px; height: 44px; }
  .story-reaction__copy { min-width: 0; display: grid; grid-template-columns:minmax(0,1fr) auto; gap: 1px 6px; align-items:center; }
  .story-reaction__copy strong { grid-column:1; font-size: .72rem; }
  .story-reaction__copy > span { grid-column:1; font-size:.74rem; font-weight: 650; line-height: 1.25; }
  .hear-reaction { grid-column:2; grid-row:1/3; width:38px; height:38px; border:0; border-radius:999px; background:#fff; cursor:pointer; }

  .reinforcement-scene :global(.scene) { height: clamp(130px, 28vh, 190px); }
  .reinforcement-meaning,
  .reinforcement-recipe { width: min(100%, 30rem); min-height: 0; margin: 0 auto; }
  .reinforcement-meaning :global(.visual-meaning-presenter) { width: 100%; }
  .reinforcement-recipe :global(.visual-recipe) { width: 100%; }

  .next-button,
  .primary-button,
  .secondary-button {
    min-height: 48px;
    padding: 10px 14px;
    border: 0;
    border-radius: 14px;
    font: inherit;
    font-weight: 900;
    cursor: pointer;
  }
  .next-button { margin: 0 10px 10px; background: #24303a; color: #fff; }

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
    .session-viewport { gap: 4px; }
    .session-topbar { min-height:42px; padding: 2px 4px; }
    .home-button,.sound-button { width:36px; height:36px; }
    .progress-pill { min-width: 48px; padding: 5px 6px; }
    .session-card { border-radius: 17px; }
    .session-card__scroll { padding: 8px; }
    .answer-scene :global(.scene) { height: 105px; }
    .question-prompt { margin: 5px 3px 7px; font-size: 1.05rem; }
    .reinforcement-scene :global(.scene) { height: 145px; }
    .completion-card-viewport { padding: 10px; }
    .completion-actions { grid-template-columns: 1fr; }
  }

  @media (max-height: 650px) {
    .session-topbar { min-height:40px; }
    .home-button,.sound-button { width:34px; height:34px; }
    .answer-scene :global(.scene) { height: 92px; }
    .question-prompt { margin-block:4px 6px; font-size: .98rem; }
    .reinforcement-scene :global(.scene) { height: 125px; }
    .session-card__scroll { padding-top:7px; }
  }
</style>
