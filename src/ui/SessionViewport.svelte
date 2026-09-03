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
    guide_to_home: 'Dheu: Guide the animal toward the home that belongs with it.',
    sort_or_match: 'Dheu: Put the forest clues that belong together.',
    observe_choose: 'Scientu: Look closely at the clue before you choose.',
    sequence_process: 'Scientu: Put the growing stages from first to last.',
    cause_effect_discovery: 'Scientu: Try the clue and notice what can grow or change.'
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
  let autoAdvanceTimer: ReturnType<typeof setTimeout> | null = null;
  let question = $derived(questions[sessionState.index]);
  let assessmentMode = $derived(mode === 'goal_mock' || mode === 'goal_pattern_mock');
  let experienceRecipe = $derived(
    storyCompletion && question && !assessmentMode ? resolveExperienceRecipe(question, 'story') : null
  );
  let experienceCueText = $derived(
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

  function showAudioAvailability(result: ChildAudioPlaybackResult): void {
    audioNotice = result.source === 'unavailable'
      ? 'This device does not have an offline voice for this language yet.'
      : result.source === 'pending_local_voice'
        ? 'Getting the offline voice ready…'
        : null;
  }

  function narratedQuestionText(): string {
    if (!question) return '';
    if (!experienceCueText || experienceRecipe?.choreography.audioCue !== 'prompt_and_reaction') return question.prompt.text;
    return `${experienceCueText} ${question.prompt.text}`;
  }

  function repeatQuestionPrompt(): void {
    if (!question || !soundEnabled) return;
    showAudioAvailability(playQuestionPrompt(narratedQuestionText(), question.language, true));
  }

  function toggleSound(): void {
    const next = saveChildAudioPreferences(!soundEnabled);
    soundEnabled = next.enabled;
    audioNotice = null;
    if (!soundEnabled) stopChildAudio();
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
    stopChildAudio();
    audioNotice = null;
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
    stopChildAudio();
    audioNotice = null;
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
    stopChildAudio();
    audioNotice = null;
    replaySession(sessionState);
    restoredSubmitted = false;
    onCheckpoint?.(sessionState);
  }

  function handleExit(): void {
    clearAutoAdvance();
    stopChildAudio();
    audioNotice = null;
    onExit?.();
  }

  $effect(() => {
    const currentQuestion = question;
    const submitted = sessionState.submitted;
    const enabled = soundEnabled;
    const narratedText = narratedQuestionText();
    if (!currentQuestion || submitted || !enabled) return;
    playQuestionPrompt(narratedText, currentQuestion.language, true);
  });

  onDestroy(() => {
    clearAutoAdvance();
    stopChildAudio();
  });
</script>

{#if question}
  <section class="session-viewport" data-session-state={sessionState.submitted ? 'reaction' : 'answer'} data-session-mode={mode}>
    <header class="session-topbar">
      <div class="session-topbar__identity">
        {#if onExit}
          <button class="home-button" type="button" onclick={handleExit} aria-label="Back to Kidsplay home">←</button>
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
      <div style="display:flex;align-items:center;gap:6px">
        <button
          type="button"
          aria-pressed={soundEnabled}
          aria-label={soundEnabled ? 'Turn sound off' : 'Turn sound on'}
          title={soundEnabled ? 'Sound on' : 'Sound off'}
          onclick={toggleSound}
          style="width:44px;height:44px;padding:0;border:0;border-radius:13px;background:var(--accent-soft);font-size:1.05rem;cursor:pointer"
        >
          <span aria-hidden="true">{soundEnabled ? '🔊' : '🔇'}</span>
        </button>
        <div class="progress-pill">{sessionState.index + 1} / {questions.length}</div>
      </div>
    </header>

    {#if !sessionState.submitted}
      <article class="session-card answer-state">
        <div class="session-card__scroll answer-state__scroll">
          <div class="question-meta">
            {#if currentSection}
              <span class="reasoning-cue">Section: {currentSection.title} · {currentSection.marksPerQuestion} {currentSection.marksPerQuestion === 1 ? 'mark' : 'marks'} each</span>
            {/if}
            {#if onCheckpoint}<span class="saved-session-note">Mock progress saves on this device</span>{/if}
            {#if experienceCueText}<span class="reasoning-cue reasoning-cue--goal">{experienceCueText}</span>{/if}
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
          <div style="text-align:center;margin:-6px 0 10px">
            <button
              type="button"
              disabled={!soundEnabled}
              aria-label="Repeat question"
              onclick={repeatQuestionPrompt}
              style="min-height:44px;padding:7px 12px;border:0;border-radius:999px;background:var(--accent-soft);color:var(--accent);font:inherit;font-size:.78rem;font-weight:900;cursor:pointer"
            >
              <span aria-hidden="true">↻</span>
              <span>Repeat</span>
            </button>
          </div>
          {#if audioNotice}
            <p class="saved-session-note" style="display:block;margin:0 auto 8px;text-align:center" aria-live="polite">{audioNotice}</p>
          {/if}

          <div class="interaction-host">
            <EngineHost
              {question}
              onSubmit={handleSubmit}
              feedbackMode={assessmentMode ? 'assessment' : 'play'}
              {soundEnabled}
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
                <button
                  type="button"
                  disabled={!soundEnabled}
                  aria-label={`Hear ${storyReaction.speaker}`}
                  onclick={hearStoryReaction}
                  style="justify-self:start;min-height:44px;padding:7px 10px;border:0;border-radius:999px;background:#fff;color:var(--ink);font:inherit;font-size:.72rem;font-weight:850;cursor:pointer"
                >
                  <span aria-hidden="true">🔊</span>
                  <span>Hear {storyReaction.speaker}</span>
                </button>
              </span>
            </div>
          {/if}

          {#if audioNotice}
            <p class="saved-session-note" style="display:block;margin:0 auto 8px;text-align:center" aria-live="polite">{audioNotice}</p>
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
  .session-title { min-width: 0; display: grid; gap: 1px; }
  .session-title strong { font-size: .82rem; line-height: 1; }
  .session-title span { color: var(--muted); font-size: .62rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .player-avatar { width: 34px; height: 34px; flex: none; }
  .home-button { width: 38px; height: 38px; flex: none; border: 0; border-radius: 12px; background: var(--accent-soft); color: var(--accent); font: inherit; font-weight: 950; cursor: pointer; }
  .progress-pill { flex: none; padding: 5px 8px; border-radius: 999px; background: #f1f3f5; color: var(--muted); font-size: .66rem; font-weight: 900; }

  .session-card { min-height: 0; overflow: hidden; border: 1px solid rgba(36,48,58,.09); border-radius: 20px; background: rgba(255,255,255,.94); box-shadow: 0 14px 28px rgba(24,33,43,.07); }
  .session-card__scroll { min-height: 0; height: 100%; overflow: auto; padding: 14px; }
  .answer-state { display: grid; grid-template-rows: minmax(0,1fr); }
  .question-meta { display: flex; flex-wrap: wrap; justify-content: center; gap: 5px; margin-bottom: 6px; }
  .reasoning-cue, .saved-session-note { display: inline-flex; align-items: center; min-height: 28px; padding: 4px 8px; border-radius: 999px; background: #f1f3f5; color: var(--muted); font-size: .62rem; font-weight: 850; }
  .reasoning-cue--goal { background: #eeeaff; color: var(--accent); }
  .restored-answer-note { margin: 0 auto 9px; padding: 8px 10px; border-radius: 12px; background: #fff7d6; color: #655000; font-size: .7rem; font-weight: 800; }
  .question-prompt { margin: 7px auto 12px; max-width: 680px; font-size: clamp(1.15rem, 4vw, 1.75rem); line-height: 1.08; text-align: center; }
  .answer-scene, .reinforcement-scene, .reinforcement-meaning, .reinforcement-recipe { width: min(100%, 520px); margin: 0 auto 7px; }
  .answer-scene { max-height: 145px; overflow: hidden; }
  .interaction-host { min-height: 0; }

  .reaction-state { display: grid; grid-template-rows: minmax(0,1fr) auto; }
  .reaction-state__scroll { display: grid; align-content: center; gap: 8px; }
  .feedback { width: min(100%, 620px); margin: auto; padding: 11px 13px; border-radius: 16px; display: grid; gap: 3px; text-align: center; }
  .feedback strong { font-size: 1rem; }
  .feedback span { font-size: .78rem; }
  .feedback--correct { background: var(--good-soft); color: #165f3a; }
  .feedback--incorrect { background: var(--warn-soft); color: #714000; }
  .reaction-avatar { width: 96px; height: 96px; margin: 0 auto; }
  .story-reaction { width: min(100%, 600px); margin: 0 auto; display: grid; grid-template-columns: 76px minmax(0,1fr); align-items: center; gap: 10px; padding: 10px 12px; border-radius: 18px; background: linear-gradient(145deg,#f8f4ff,#eef9ff); }
  .story-reaction__actor { width: 68px; height: 68px; }
  .story-reaction__copy { min-width: 0; display: grid; gap: 2px; }
  .story-reaction__copy strong { color: var(--accent); font-size: .76rem; }
  .story-reaction__copy span { color: var(--ink); font-size: .72rem; line-height: 1.35; }
  .next-button { min-height: 48px; margin: 10px 14px 14px; border: 0; border-radius: 15px; background: var(--accent); color: #fff; font: inherit; font-weight: 950; cursor: pointer; }

  .completion-viewport { display: grid; place-items: center; }
  .completion-card-viewport { width: min(680px, 100%); max-height: 100%; display: grid; grid-template-rows: minmax(0,1fr) auto; overflow: hidden; border: 1px solid rgba(36,48,58,.09); border-radius: 22px; background: rgba(255,255,255,.95); box-shadow: 0 18px 34px rgba(24,33,43,.08); }
  .completion-scroll { min-height: 0; overflow: auto; padding: 18px; text-align: center; }
  .completion-scroll h1 { margin: 6px 0; font-size: 1.45rem; }
  .completion-scroll p { margin: 5px 0; color: var(--muted); }
  .completion-avatar { width: 104px; height: 104px; margin: 0 auto; }
  .story-completion { display: grid; gap: 6px; margin-top: 10px; padding: 11px; border-radius: 17px; background: #eef9f2; }
  .story-completion__scene { max-height: 110px; overflow: hidden; }
  .section-results { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 7px; margin-top: 10px; }
  .section-result { display: grid; gap: 2px; padding: 8px; border-radius: 13px; background: #f7f8fa; font-size: .68rem; }
  .section-result small { color: var(--muted); }
  .completion-actions { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 8px; padding: 0 14px 14px; }
  .primary-button, .secondary-button { min-height: 48px; border: 0; border-radius: 14px; font: inherit; font-weight: 900; cursor: pointer; }
  .primary-button { background: var(--accent); color: #fff; }
  .secondary-button { background: #f1f3f5; color: var(--ink); }

  @media (max-width: 520px) {
    .session-card__scroll { padding: 10px; }
    .question-prompt { font-size: 1.08rem; margin: 5px auto 9px; }
    .story-reaction { grid-template-columns: 58px minmax(0,1fr); padding: 8px; }
    .story-reaction__actor { width: 52px; height: 52px; }
    .section-results { grid-template-columns: 1fr; }
  }

  @media (prefers-reduced-motion: reduce) {
    .session-card, .completion-card-viewport { scroll-behavior: auto; }
  }
</style>
