<script lang="ts">
  import { onMount, type Component } from 'svelte';
  import {
    createSessionForCatalogEntry,
    getCatalogEntries,
    getFreePackQuestions,
    getGoalReadiness,
    type SessionLaunch
  } from './content';
  import type { Question } from './contracts/question';
  import type { SessionAttempt } from './contracts/runtime';
  import type { FirstPlaySurfaceMode } from './experience/firstPlayProduction';
  import { registerAdaptiveContinueHandler } from './runtime/adaptiveContinue';
  import { loadAdaptiveInterestSignals, recordAdaptiveTopicInterest } from './runtime/adaptiveInterest';
  import {
    enterAppSessionLayer,
    installAppBackNavigation,
    pushAppBackLayer,
    requestAppBack
  } from './runtime/appNavigation';
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
  import {
    createStoryMissionLaunch,
    getStoryLocations,
    getStoryMissions
  } from './story/storyDirector';
  import { createStoryLocationLaunch } from './story/storyLocationDirector';
  import { buildStoryLocationPresentation } from './story/storyPresentation';
  import {
    loadStoryProgress,
    recordStoryLocationCompletion,
    recordStoryMissionCompletion
  } from './story/storyProgress';
  import type { StoryLocation, StoryMission } from './story/storyTypes';
  import GrownUpAudioHelp from './ui/GrownUpAudioHelp.svelte';
  import Home from './ui/HomeViewport.svelte';
  import Session from './ui/SessionViewport.svelte';

  type LearnAboutComponent = typeof import('./ui/LearnAboutViewport.svelte')['default'];
  type StoriesComponent = Component<{ onExit: () => void }>;

  const catalog = getCatalogEntries();
  const goalProfileRef = catalog.find((entry) => entry.kind === 'goal_learning')?.profileRef;
  const adaptiveQuestionBank = [...new Map(
    catalog
      .filter((entry) => entry.kind === 'free_explore')
      .flatMap((entry) => getFreePackQuestions(entry.id))
      .map((question) => [question.id, question] as const)
  ).values()];
  const adaptiveQuestionById = new Map(adaptiveQuestionBank.map((question) => [question.id, question]));
  const storyLocations = getStoryLocations();
  const storyMissions = getStoryMissions();
  const forestViewport = import('./ui/ForestWorldDepthViewport.svelte');
  let child = $state(loadChildSettings());
  let progress = $state(loadProgress());
  let storyProgress = $state(loadStoryProgress());
  let adaptiveInterestSignals = $state(loadAdaptiveInterestSignals());
  let activePlaySurface = $state<FirstPlaySurfaceMode | null>(null);
  let activeSession = $state<SessionLaunch | null>(null);
  let activeEntryId = $state<string | null>(null);
  let activeStoryMission = $state<StoryMission | null>(null);
  let activeStoryLocation = $state<StoryLocation | null>(null);
  let pendingAdaptiveMissionId = $state<string | null>(null);
  let pendingAdaptiveQuestionId = $state<string | null>(null);
  let learnAboutOpen = $state(false);
  let LearnAboutView = $state<LearnAboutComponent | null>(null);
  let storiesOpen = $state(false);
  let storiesLoading = $state(false);
  let Stories = $state<StoriesComponent | null>(null);
  let initialSessionState = $state<SessionState | undefined>(undefined);
  let resumableMock = $state(loadMockCheckpoint());
  let mockHistory = $state(loadMockHistory());
  let startError = $state<string | null>(null);
  let releaseSessionBack: (() => void) | null = null;
  let releaseLearnAboutBack: (() => void) | null = null;
  let releaseStoriesBack: (() => void) | null = null;
  let progressSummary = $derived(summarizeProgress(progress));
  let mockTrends = $derived(summarizeMockHistory(mockHistory));
  let goalReadiness = $derived(
    goalProfileRef ? getGoalReadiness(goalProfileRef, progress.knowledge) : null
  );
  let forestStorySession = $derived(
    activeStoryMission?.locationRef === 'forest' || activeStoryLocation?.id === 'forest'
  );

  onMount(() => installAppBackNavigation());
  onMount(() => registerAdaptiveContinueHandler(tryStartAdaptiveExperience));

  function handleChildChange(settings: ChildSettings): void {
    child = saveChildSettings(settings);
  }

  function handleLearnAboutTopicInterest(rootConceptRefs: readonly string[]): void {
    adaptiveInterestSignals = recordAdaptiveTopicInterest(rootConceptRefs);
  }

  function clearActiveSession(): void {
    activeSession = null;
    activeEntryId = null;
    activeStoryMission = null;
    activeStoryLocation = null;
    initialSessionState = undefined;
    startError = null;
    releaseSessionBack = null;
  }

  function clearActivePlaySurface(): void {
    activePlaySurface = null;
    startError = null;
    releaseSessionBack = null;
  }

  function clearPendingAdaptiveMission(): void {
    pendingAdaptiveMissionId = null;
    pendingAdaptiveQuestionId = null;
  }

  function enterSessionBackBoundary(
    layerId = 'learning-session',
    onBack: () => void = clearActiveSession
  ): void {
    releaseSessionBack?.();
    releaseSessionBack = enterAppSessionLayer(layerId, onBack);
  }

  function startFirstPlay(mode: FirstPlaySurfaceMode): void {
    enterSessionBackBoundary(`play:${mode}`, clearActivePlaySurface);
    activePlaySurface = mode;
    startError = null;
  }

  async function openLearnAbout(): Promise<void> {
    try {
      LearnAboutView ??= (await import('./ui/LearnAboutViewport.svelte')).default;
      releaseLearnAboutBack?.();
      learnAboutOpen = true;
      startError = null;
      releaseLearnAboutBack = enterAppSessionLayer('learn-about', () => {
        learnAboutOpen = false;
        releaseLearnAboutBack = null;
      });
    } catch (error) {
      startError = error instanceof Error ? error.message : 'Learn About could not be opened.';
    }
  }

  function requestLearnAboutExit(): void {
    requestAppBack(() => {
      learnAboutOpen = false;
      releaseLearnAboutBack = null;
    });
  }

  function startLearnAboutQuestion(question: Question, title: string): void {
    releaseSessionBack?.();
    releaseSessionBack = pushAppBackLayer('learn-about-question', clearActiveSession);
    activePlaySurface = null;
    activeSession = { id: `learn-about:${question.id}`, mode: 'free_explore', title, questions: [question] };
    activeEntryId = null;
    activeStoryMission = null;
    activeStoryLocation = null;
    initialSessionState = undefined;
    startError = null;
  }

  async function openStories(): Promise<void> {
    if (storiesLoading || storiesOpen) return;
    storiesLoading = true;
    startError = null;
    try {
      Stories ??= (await import('./ui/StoriesViewport.svelte')).default;
      releaseStoriesBack?.();
      storiesOpen = true;
      releaseStoriesBack = enterAppSessionLayer('stories', () => {
        storiesOpen = false;
        releaseStoriesBack = null;
      });
    } catch (error) {
      startError = error instanceof Error ? error.message : 'Stories could not be opened from this installation.';
    } finally {
      storiesLoading = false;
    }
  }

  function requestStoriesExit(): void {
    requestAppBack(() => {
      storiesOpen = false;
      releaseStoriesBack = null;
    });
  }

  async function startSession(entryId: string): Promise<void> {
    try {
      const bicycleWorkshopMode = entryId === 'free.english.bicycle-workshop.1'
        ? 'practice'
        : entryId === 'free.english.bicycle-workshop.chapter-check.1'
          ? 'chapter_check'
          : null;
      const launch = bicycleWorkshopMode
        ? (await import('./experience/bicycleWorkshopRuntime')).createBicycleWorkshopSession(
          bicycleWorkshopMode,
          progress.knowledge
        )
        : createSessionForCatalogEntry(entryId, progress.knowledge);

      enterSessionBackBoundary();
      activePlaySurface = null;
      activeSession = launch;
      activeEntryId = bicycleWorkshopMode ? null : entryId;
      activeStoryMission = null;
      activeStoryLocation = null;
      initialSessionState = undefined;
      startError = null;
    } catch (error) {
      startError = error instanceof Error ? error.message : 'This learning session could not be started.';
    }
  }

  function questionFitsMission(question: Question, mission: StoryMission): boolean {
    if (mission.worldActionRef) return false;
    const missionRefs = new Set(mission.knowledgeRefs);
    return (question.knowledgeRefs ?? []).some((rowId) => missionRefs.has(rowId));
  }

  function weavePendingAdaptiveQuestion(missionId: string, launch: SessionLaunch): SessionLaunch {
    if (pendingAdaptiveMissionId !== missionId || !pendingAdaptiveQuestionId || !launch.questions.length) return launch;
    const adaptiveQuestion = adaptiveQuestionById.get(pendingAdaptiveQuestionId);
    clearPendingAdaptiveMission();
    if (!adaptiveQuestion) return launch;

    const questions = [
      adaptiveQuestion,
      ...launch.questions.filter((question) => question.id !== adaptiveQuestion.id)
    ].slice(0, launch.questions.length);
    return { ...launch, questions };
  }

  async function tryStartAdaptiveExperience(): Promise<boolean> {
    const { decideAdaptiveExperience } = await import('./runtime/adaptiveRouting');
    const currentPresentation = buildStoryLocationPresentation(
      storyLocations,
      storyMissions,
      storyProgress,
      progressSummary.recommendedTopics
    ).find((item) => item.state === 'current') ?? null;
    const currentMission = currentPresentation?.mission ?? null;
    const routingQuestionBank = currentMission
      ? adaptiveQuestionBank.filter((question) => questionFitsMission(question, currentMission))
      : adaptiveQuestionBank;
    const decision = decideAdaptiveExperience({
      progress,
      questionBank: routingQuestionBank,
      currentWorldId: currentPresentation?.location.id ?? null,
      currentWorldTopics: currentPresentation?.location.topicGroups ?? [],
      worldHasProgress: Boolean(storyProgress.updatedAt),
      interestSignals: adaptiveInterestSignals,
      now: new Date()
    });
    if (!decision.questionIds.length) {
      clearPendingAdaptiveMission();
      return false;
    }

    const questions = decision.questionIds
      .map((questionId) => adaptiveQuestionById.get(questionId))
      .filter((question): question is Question => Boolean(question));
    if (!questions.length) {
      clearPendingAdaptiveMission();
      return false;
    }

    if (currentMission) {
      clearPendingAdaptiveMission();
      if (questionFitsMission(questions[0], currentMission)) {
        pendingAdaptiveMissionId = currentMission.id;
        pendingAdaptiveQuestionId = questions[0].id;
      }
      // Mission coherence wins. A compatible adaptive beat is consumed when the
      // child starts the mission; an incompatible due beat remains due for later.
      return false;
    }

    enterSessionBackBoundary('adaptive-adventure');
    activePlaySurface = null;
    activeSession = {
      id: `adaptive.${decision.kind}.${decision.conceptId ?? currentPresentation?.location.id ?? 'world'}`,
      mode: 'free_explore',
      title: currentPresentation?.location.expeditionTitle ?? 'Adventure clue',
      questions
    };
    activeEntryId = null;
    activeStoryMission = null;
    activeStoryLocation = null;
    initialSessionState = undefined;
    startError = null;
    return true;
  }

  function startStoryMission(missionId: string): void {
    try {
      const launch = createStoryMissionLaunch(missionId, progress.knowledge);
      const session = weavePendingAdaptiveQuestion(missionId, launch.session);
      enterSessionBackBoundary();
      activePlaySurface = null;
      activeSession = launch.mission.worldActionRef ? null : session;
      activeStoryMission = launch.mission;
      activeStoryLocation = null;
      activeEntryId = null;
      initialSessionState = undefined;
      startError = null;
    } catch (error) {
      clearPendingAdaptiveMission();
      startError = error instanceof Error ? error.message : 'This story mission could not be started.';
    }
  }

  function startStoryLocation(locationId: string): void {
    try {
      clearPendingAdaptiveMission();
      const launch = createStoryLocationLaunch(locationId, progress.knowledge);
      enterSessionBackBoundary();
      activePlaySurface = null;
      activeSession = launch.session;
      activeStoryMission = null;
      activeStoryLocation = launch.location;
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
      if (launch.mode !== 'goal_pattern_mock') throw new Error('Only structured long mocks can be resumed');
      if (getPatternMockContractSignature(launch.profileRef) !== resumableMock.sectionSignature) {
        throw new Error('The assessment or learning-profile contract changed since this mock was saved');
      }
      const questions = resolveQuestionIds(resumableMock.questionIds);
      if (questions.length !== launch.questions.length) throw new Error('The saved mock no longer matches the current assessment length');
      if (getQuestionContractSignature(questions) !== resumableMock.questionSignature) {
        throw new Error('One or more saved questions changed since this mock was saved');
      }

      enterSessionBackBoundary();
      activePlaySurface = null;
      activeSession = { ...launch, questions };
      activeEntryId = resumableMock.entryId;
      activeStoryMission = null;
      activeStoryLocation = null;
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

  function handleForestWorldComplete(sessionId: string): void {
    if (!activeStoryMission?.worldActionRef) return;
    storyProgress = recordStoryMissionCompletion(activeStoryMission, sessionId);
  }

  function handleSessionComplete(state: SessionState): void {
    if (!activeSession) return;

    if (activeStoryMission) {
      storyProgress = recordStoryMissionCompletion(activeStoryMission, state.sessionId);
      return;
    }

    if (activeStoryLocation) {
      storyProgress = recordStoryLocationCompletion(activeStoryLocation, state.sessionId);
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

  function requestSessionExit(): void {
    requestAppBack(clearActiveSession);
  }

  function requestFirstPlayExit(): void {
    requestAppBack(clearActivePlaySurface);
  }
</script>

{#if activePlaySurface}
  {#await import('./ui/FirstPlayViewport.svelte') then module}
    {@const FirstPlayViewport = module.default}
    <FirstPlayViewport mode={activePlaySurface} onExit={requestFirstPlayExit} />
  {/await}
{:else}
  {#if learnAboutOpen && LearnAboutView}
    <div hidden={Boolean(activeSession || activeStoryMission?.worldActionRef) || storiesOpen}>
      <LearnAboutView
        onExit={requestLearnAboutExit}
        onStartQuestion={startLearnAboutQuestion}
        onTopicInterest={handleLearnAboutTopicInterest}
      />
    </div>
  {/if}

  {#if storiesOpen && Stories}
    <Stories onExit={requestStoriesExit} />
  {:else if activeStoryMission?.worldActionRef}
    {#await forestViewport then forestModule}
      {@const ForestWorldDepthViewport = forestModule.default}
      <ForestWorldDepthViewport
        mission={activeStoryMission}
        childName={child.name}
        onComplete={handleForestWorldComplete}
        onExit={requestSessionExit}
      />
    {/await}
  {:else if activeSession}
    <div class="session-host" class:forest-session-host={forestStorySession}>
      <Session
        title={activeSession.title}
        mode={activeSession.mode}
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
        onExit={requestSessionExit}
      />
      <GrownUpAudioHelp language={activeSession.questions[0]?.language ?? 'en-IN'} />
    </div>
  {:else if !learnAboutOpen}
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
      onOpenLearnAbout={openLearnAbout}
      onOpenStories={openStories}
      onStartFirstPlay={startFirstPlay}
    />

    {#if storiesLoading}
      <div class="app-error" role="status">Opening stories…</div>
    {/if}
    {#if startError}
      <div class="app-error" role="alert">{startError}</div>
    {/if}
  {/if}
{/if}