<script lang="ts">
  import { onMount } from 'svelte';
  import type { SessionLaunch } from '../../content';
  import { createSessionForCatalogEntry } from '../../content';
  import type { Question } from '../../contracts/question';
  import type { SessionAttempt } from '../../contracts/runtime';
  import type { ExperienceDiscoveryDescriptor } from '../../experienceDiscovery';
  import { loadProgress, recordAttempt, type AvatarId } from '../../runtime/localProgress';
  import { getStoryMission } from '../../story/storyDirector';
  import { recordStoryMissionCompletion } from '../../story/storyProgress';
  import SessionViewport from '../SessionViewport.svelte';

  let {
    entry,
    childName,
    childAvatar,
    onExit
  }: {
    entry: ExperienceDiscoveryDescriptor;
    childName: string;
    childAvatar: AvatarId;
    onExit: () => void;
  } = $props();

  let nestedSession = $state<SessionLaunch | null>(null);
  let error = $state<string | null>(null);

  onMount(() => {
    if (entry.launch.owner !== 'catalog') return;
    try {
      nestedSession = createSessionForCatalogEntry(entry.launch.ref, loadProgress().knowledge);
    } catch (cause) {
      error = cause instanceof Error ? cause.message : 'This activity could not be opened.';
    }
  });

  function handleAttempt(attempt: SessionAttempt): void {
    recordAttempt(attempt);
  }

  function startQuestion(question: Question, title: string): void {
    nestedSession = {
      id: `nav100:${entry.canonicalId}:${question.id}`,
      mode: 'free_explore',
      title,
      questions: [question]
    };
  }

  async function startBicycle(mode: 'practice' | 'chapter_check'): Promise<void> {
    try {
      const { createBicycleWorkshopSession } = await import('../../experience/bicycleWorkshopRuntime');
      nestedSession = createBicycleWorkshopSession(mode, loadProgress().knowledge);
    } catch (cause) {
      error = cause instanceof Error ? cause.message : 'Bicycle practice could not be opened.';
    }
  }
</script>

{#if nestedSession}
  <SessionViewport
    title={nestedSession.title}
    mode={nestedSession.mode}
    questions={nestedSession.questions}
    sections={nestedSession.sections}
    {childName}
    {childAvatar}
    onAttempt={handleAttempt}
    onExit={() => nestedSession = null}
  />
{:else if error}
  <main class="launch-error" role="alert">
    <strong>Could not open {entry.childTitle}</strong>
    <p>{error}</p>
    <button type="button" onclick={onExit}>Back</button>
  </main>
{:else if entry.launch.owner === 'bicycle_workshop'}
  {#await import('../BicycleWorkshopViewport.svelte') then module}
    {@const BicycleWorkshopViewport = module.default}
    <BicycleWorkshopViewport
      {onExit}
      onPractice={() => void startBicycle('practice')}
      onChapterCheck={() => void startBicycle('chapter_check')}
    />
  {/await}
{:else if entry.launch.owner === 'phonics'}
  {#await import('../PhonicsAdventureViewport.svelte') then module}
    {@const PhonicsAdventureViewport = module.default}
    <PhonicsAdventureViewport {childName} {childAvatar} {onExit} />
  {/await}
{:else if entry.launch.owner === 'stories'}
  {#await import('../StoriesViewport.svelte') then module}
    {@const StoriesViewport = module.default}
    <StoriesViewport {onExit} initialStoryId={entry.launch.ref} />
  {/await}
{:else if entry.launch.owner === 'learn_about'}
  {#await import('../LearnAboutViewport.svelte') then module}
    {@const LearnAboutViewport = module.default}
    <LearnAboutViewport
      {onExit}
      initialTopicId={entry.launch.ref}
      onStartQuestion={startQuestion}
    />
  {/await}
{:else if entry.launch.owner === 'learning_studio'}
  <main class="studio-launch-host">
    <header>
      <button type="button" onclick={onExit} aria-label="Back to browse">←</button>
      <div><small>HANDS-ON ACTIVITY</small><h1>{entry.childTitle}</h1></div>
    </header>
    {#await import('../StudioLauncher.svelte') then module}
      {@const StudioLauncher = module.default}
      <StudioLauncher activityRefs={[entry.launch.ref]} />
    {/await}
  </main>
{:else if entry.launch.owner === 'story_world'}
  {@const mission = getStoryMission(entry.launch.ref)}
  {#if mission.worldActionRef}
    {#await import('../ForestWorldDepthViewport.svelte') then module}
      {@const ForestWorldDepthViewport = module.default}
      <ForestWorldDepthViewport
        {mission}
        {childName}
        onComplete={(sessionId) => recordStoryMissionCompletion(mission, sessionId)}
        {onExit}
      />
    {/await}
  {:else}
    <main class="launch-error">
      <strong>{entry.childTitle}</strong>
      <p>This story mission still opens from Story World in the current runtime.</p>
      <button type="button" onclick={onExit}>Back</button>
    </main>
  {/if}
{:else if entry.launch.owner === 'catalog'}
  <main class="launch-error" role="status">Opening {entry.childTitle}…</main>
{:else}
  <main class="launch-error">
    <strong>{entry.childTitle}</strong>
    <p>This activity does not have a prototype launch adapter yet.</p>
    <button type="button" onclick={onExit}>Back</button>
  </main>
{/if}

<style>
  .launch-error,.studio-launch-host{width:min(900px,100%);min-height:calc(100dvh - 42px);margin:auto;box-sizing:border-box;padding:18px;background:#f6fbff;color:#17324d}.launch-error{display:flex;flex-direction:column;gap:10px;align-items:flex-start;justify-content:center}.launch-error button,.studio-launch-host header button{min-height:46px;padding:0 16px;border:0;border-radius:13px;background:#17324d;color:white;font:inherit;font-weight:800;cursor:pointer}.studio-launch-host header{display:flex;gap:12px;align-items:center;margin-bottom:18px}.studio-launch-host h1{margin:.15rem 0 0}.studio-launch-host small{font-weight:900;letter-spacing:.08em}.launch-error button:focus-visible,.studio-launch-host button:focus-visible{outline:4px solid #ffb02e;outline-offset:3px}
</style>
