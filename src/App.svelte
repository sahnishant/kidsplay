<script lang="ts">
  import {
    createSessionForCatalogEntry,
    getCatalogEntries,
    getGoalReadiness,
    type SessionLaunch
  } from './content';
  import type { SessionAttempt } from './contracts/runtime';
  import {
    loadChildSettings,
    loadProgress,
    recordAttempt,
    saveChildSettings,
    summarizeProgress,
    type ChildSettings
  } from './runtime/localProgress';
  import {
    getPatternMockContractSignature,
    getQuestionContractSignature
  } from './runtime/mockContract';
  import {
    clearMockCheckpoint,
    loadMockCheckpoint,
    loadMockHistory,
    recordMockCompletion,
    saveMockCheckpoint,
    summarizeMockHistory
  } from './runtime/mockPersistence';
  import { resolveQuestionIds } from './runtime/questionCatalog';
  import {
    createSessionCheckpoint,
    restoreSessionState,
    summarizeSectionResults,
    type SessionState
  } from './runtime/session';
  import { createStoryMissionLaunch } from './story/storyDirector';
  import { createStoryLocationLaunch } from './story/storyLocationDirector';
  import {
    loadStoryProgress,
    recordStoryMissionCompletion
  } from './story/storyProgress';
  import type { StoryMission } from './story/storyTypes';
  import Home from './ui/HomeViewport.svelte';
  import Session from './ui/Session.svelte';

  const catalog = getCatalogEntries();
  const goalProfileRef = catalog.find((entry) => entry.kind === 'goal_learning')?.profileRef;
  let child = $state(loadChildSettings());
  let progress = $state(loadProgress());
  let storyProgress = $state(loadStoryProgress());
  let activeSession = $state<SessionLaunch | null>(null);
  let activeEntryId = $state<string | null>(null);
  let activeStoryMission = $state<StoryMission | null>(null);
  let initialSessionState = $state<SessionState | undefined>(undefined);
  let resumableMock = $state(loadMockCheckpoint());
  let mockHistory = $state(loadMockHistory());
  let startError = $state<string | null>(null);
  let progressSummary = $derived(summarizeProgress(progress));
  let mockTrends = $derived(summarizeMockHistory(mockHistory));
  let goalReadiness = $derived(
    goalProfileRef ? getGoalReadiness(goalProfileRef, progress.knowledge) : null
  );

  function handleChildChange(settings: ChildSettings): void {
    child = saveChildSettings(settings);
  }

  function startSession(entryId: string): void {
    try {
      activeSession = createSessionForCatalogEntry(entryId, progress.knowledge);
      activeEntryId = entryId;
      activeStoryMission = null;
      initialSessionState = undefined;
      startError = null;
    } catch (error) {
      startError = error instanceof Error ? error.message : 'This learning session could not be started.';
    }
  }

  function startStoryMission(missionId: string): void {
    try {
      const launch = createStoryMissionLaunch(missionId, progress.knowledge);
      activeSession = launch.session;
      activeStoryMission = launch.mission;
      activeEntryId = null;
      initialSessionState = undefined;
      startError = null;
    } catch (error) {
      startError = error instanceof Error ? error.message : 'This story mission could not be started.';
    }
  }

  function startStoryLocation(locationId: string): void {
    try {
      const launch = createStoryLocationLaunch(locationId, progress.knowledge);
      activeSession = launch.session;
      activeStoryMission = null;
      activeEntryId = null;
      initialSessionState = undefined;
      startError = null;
    } catch (error) {
      startError = error instanceof Error ? error.message : 'This story-world expedition could not be started.';
    }
  }

  function resumeMock(): void {
    if (!resumableMock) return;
    try {
      const launch = createSessionForCatalogEntry(resumableMock.entryId, progress.knowledge);
      if (launch.mode !== 'goal_pattern_mock') {
        throw new Error('Only structured long mocks can be resumed');
      }
      if (getPatternMockContractSignature(launch.profileRef) !== resumableMock.sectionSignature) {
        throw new Error('The assessment or learning-profile contract changed since this mock was saved');
      }
      const questions = resolveQuestionIds(resumableMock.questionIds);
      if (questions.length !== launch.questions.length) {
        throw new Error('The saved mock no longer matches the current assessment length');
      }
      if (getQuestionContractSignature(questions) !== resumableMock.questionSignature) {
        throw new Error('One or more saved questions changed since this mock was saved');
      }

      activeSession = { ...launch, questions };
      activeEntryId = resumableMock.entryId;
      activeStoryMission = null;
      initialSessionState = restoreSessionState(questions, resumableMock.state);
      startError = null;
    } catch (error) {
      clearMockCheckpoint();
      resumableMock = null;
      startError = error instanceof Error
        ? `Saved mock could not be resumed and was cleared: ${error.message}`
        : 'Saved mock could not be resumed and was cleared.';
    }
  }

  function handleAttempt(attempt: SessionAttempt): void {
    progress = recordAttempt(attempt);
  }

  function handleCheckpoint(state: SessionState): void {
    if (!activeSession || activeSession.mode !== 'goal_pattern_mock' || !activeEntryId) return;
    resumableMock = saveMockCheckpoint({
      entryId: activeEntryId,
      title: activeSession.title,
      questionIds: activeSession.questions.map((question) => question.id),
      sectionSignature: getPatternMockContractSignature(activeSession.profileRef),
      questionSignature: getQuestionContractSignature(activeSession.questions),
      state: createSessionCheckpoint(state)
    });
  }

  function handleSessionComplete(state: SessionState): void {
    if (!activeSession) return;

    if (activeStoryMission) {
      storyProgress = recordStoryMissionCompletion(activeStoryMission, state.sessionId);
      return;
    }

    if (!activeEntryId) return;
    if (activeSession.mode !== 'goal_mock' && activeSession.mode !== 'goal_pattern_mock') return;

    const sections = summarizeSectionResults(activeSession.sections ?? [], state.results);
    const correct = state.results.filter((result) => result.correct).length;
    const earnedMarks = sections.length
      ? sections.reduce((sum, section) => sum + section.earnedMarks, 0)
      : state.results.reduce((sum, result) => sum + result.score, 0);
    const maxMarks = sections.length
      ? sections.reduce((sum, section) => sum + section.maxMarks, 0)
      : state.results.reduce((sum, result) => sum + result.maxScore, 0);

    mockHistory = recordMockCompletion({
      sessionId: state.sessionId,
      entryId: activeEntryId,
      title: activeSession.title,
      questionCount: activeSession.questions.length,
      correct,
      earnedMarks,
      maxMarks,
      sections
    });

    if (activeSession.mode === 'goal_pattern_mock') {
      clearMockCheckpoint();
      resumableMock = null;
    }
  }

  function returnHome(): void {
    activeSession = null;
    activeEntryId = null;
    activeStoryMission = null;
    initialSessionState = undefined;
    startError = null;
  }
</script>

{#if activeSession}
  <Session
    title={activeSession.title}
    questions={activeSession.questions}
    sections={activeSession.sections}
    childName={child.name}
    childAvatar={child.avatar}
    initialState={initialSessionState}
    storyCompletion={activeStoryMission
      ? {
        sceneId: activeStoryMission.successSceneRef,
        text: activeStoryMission.successBeat.text,
        rewardLabel: activeStoryMission.reward.label,
        stars: activeStoryMission.reward.stars
      }
      : undefined}
    onAttempt={handleAttempt}
    onCheckpoint={activeSession.mode === 'goal_pattern_mock' ? handleCheckpoint : undefined}
    onComplete={handleSessionComplete}
    onExit={returnHome}
  />
{:else}
  <Home
    {child}
    {catalog}
    progress={progressSummary}
    {goalReadiness}
    {resumableMock}
    {mockTrends}
    {storyProgress}
    onChildChange={handleChildChange}
    onStart={startSession}
    onStartMission={startStoryMission}
    onExploreLocation={startStoryLocation}
    onResumeMock={resumeMock}
  />

  {#if startError}
    <div class="app-error" role="alert">{startError}</div>
  {/if}
{/if}
