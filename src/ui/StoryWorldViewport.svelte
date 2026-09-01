<script lang="ts">
  import { onDestroy } from 'svelte';
  import Scene from '../presentation/Scene.svelte';
  import StoryCharacter from '../presentation/StoryCharacter.svelte';
  import { pushAppBackLayer, requestAppBack } from '../runtime/appNavigation';
  import type { AvatarId, TopicProgressSummary } from '../runtime/localProgress';
  import {
    getHeroDisplayName,
    getStoryMission,
    getStoryMissionAverageDifficulty,
    getStoryLocations,
    getStoryMissions
  } from '../story/storyDirector';
  import { buildStoryLocationPresentation } from '../story/storyPresentation';
  import {
    storyStarTotal,
    storyUnlockedLocationCount,
    type StoryProgressSnapshot
  } from '../story/storyProgress';
  import type { StoryLocation, StoryMission } from '../story/storyTypes';
  import ExpeditionNode from './story/ExpeditionNode.svelte';

  let {
    childName,
    childAvatar,
    storyProgress,
    recommendedTopics = [],
    topicProgress = [],
    onStartMission,
    onExploreLocation = () => {}
  }: {
    childName: string;
    childAvatar: AvatarId;
    storyProgress: StoryProgressSnapshot;
    recommendedTopics?: TopicProgressSummary[];
    topicProgress?: TopicProgressSummary[];
    onStartMission: (missionId: string) => void;
    onExploreLocation?: (locationId: string) => void;
  } = $props();

  const locations = getStoryLocations();
  const missions = getStoryMissions();
  let selectedMissionId = $state<string | null>(null);
  let missionBeatIndex = $state(0);
  let releaseMissionBack: (() => void) | null = null;

  let selectedMission = $derived(
    selectedMissionId ? missions.find((mission) => mission.id === selectedMissionId) ?? null : null
  );
  let selectedBeat = $derived(selectedMission?.beats[missionBeatIndex] ?? null);
  let hasMoreMissionBeats = $derived(
    Boolean(selectedMission && missionBeatIndex < selectedMission.beats.length - 1)
  );
  let heroName = $derived(getHeroDisplayName(childName));
  let stars = $derived(storyStarTotal(storyProgress));
  let unlockedPlaces = $derived(storyUnlockedLocationCount(storyProgress, locations));
  let presentations = $derived(buildStoryLocationPresentation(locations, missions, storyProgress, recommendedTopics));
  let currentPresentation = $derived(presentations.find((item) => item.state === 'current') ?? null);
  let completedPlaces = $derived(presentations.filter((item) => item.state === 'complete').length);

  function unlockMissionTitle(location: StoryLocation): string | null {
    if (location.unlock.type !== 'mission') return null;
    return getStoryMission(location.unlock.missionRef).title;
  }

  function locationIcon(locationId: string): string {
    return locationId === 'river-pond' ? '🌊'
      : locationId === 'farm' ? '🐄'
      : locationId === 'forest' ? '🌳'
      : locationId === 'observatory' ? '🔭'
      : locationId === 'scientu-lab' ? '🔬'
      : locationId === 'road-school' ? '🚌'
      : locationId === 'home-garden' ? '🏡'
      : locationId === 'shaitanu-hideout' ? '🪨'
      : '🏘️';
  }

  function challengeLabel(mission: StoryMission): string {
    const difficulty = getStoryMissionAverageDifficulty(mission.id);
    const relevant = topicProgress.filter((topic) => {
      const location = locations.find((item) => item.id === mission.locationRef);
      return location?.topicGroups.includes(topic.id);
    });
    const strongTopics = relevant.filter((topic) => topic.status === 'strong').length;
    if (difficulty >= 3 || strongTopics >= 2) return 'Clever trap';
    if (difficulty >= 2 || strongTopics >= 1) return 'Tricky twist';
    return 'Warm-up tease';
  }

  function speakerName(value: string): string {
    if (value === 'dheu') return heroName;
    if (value === 'scientu') return 'Scientu';
    return 'Shaitanu';
  }

  function closeMissionFromBack(): void {
    selectedMissionId = null;
    missionBeatIndex = 0;
    releaseMissionBack = null;
  }

  function openMission(missionId: string): void {
    releaseMissionBack?.();
    missionBeatIndex = 0;
    selectedMissionId = missionId;
    releaseMissionBack = pushAppBackLayer(`story-mission:${missionId}`, closeMissionFromBack);
  }

  function requestCloseMission(): void {
    requestAppBack(closeMissionFromBack);
  }

  function advanceMissionBeat(): void {
    if (!selectedMission || !hasMoreMissionBeats) return;
    missionBeatIndex += 1;
  }

  function actionLabel(state: 'complete' | 'current' | 'available' | 'locked', mission?: StoryMission): string {
    if (state === 'locked') return 'Locked';
    if (state === 'complete') return 'Replay';
    if (state === 'current') return 'Play next';
    return mission ? 'Mission' : 'Explore';
  }

  function locationAriaLabel(location: StoryLocation, state: 'complete' | 'current' | 'available' | 'locked', mission?: StoryMission): string {
    if (state === 'locked') {
      return `${location.expeditionTitle}, Level ${location.progression.level}: locked until ${unlockMissionTitle(location) ?? 'the previous story mission'}`;
    }
    const action = state === 'complete' ? 'complete, replay' : state === 'current' ? 'play next' : mission ? mission.title : 'explore';
    return `${location.expeditionTitle}, Level ${location.progression.level}: ${action}`;
  }

  onDestroy(() => releaseMissionBack?.());
</script>

<section class="story-world-viewport" aria-labelledby="story-world-heading">
  <header class="next-adventure">
    <div class="next-adventure__copy">
      <span class="eyebrow">YOUR NEXT ADVENTURE</span>
      {#if currentPresentation}
        <h2 id="story-world-heading">{currentPresentation.location.expeditionTitle}</h2>
        <p><strong>LEVEL {currentPresentation.location.progression.level}</strong> · Find the clues and make this world stronger.</p>
      {:else}
        <h2 id="story-world-heading">Explore {heroName}'s science world</h2>
        <p>Choose any open expedition.</p>
      {/if}
    </div>
    <div class="next-adventure__guides" aria-label="Story guides">
      <span aria-hidden="true"><StoryCharacter character="scientu" mood="thinking" motion="float" /></span>
      <span aria-hidden="true"><StoryCharacter character="shaitanu" mood="mischievous" motion="wiggle" /></span>
    </div>
  </header>

  <div class="world-stage">
    <div class="world-map" aria-label={`${heroName}'s story world`}>
      <div class="world-map__river" aria-hidden="true"></div>
      <div class="world-map__path world-map__path--one" aria-hidden="true"></div>
      <div class="world-map__path world-map__path--two" aria-hidden="true"></div>
      <div class="world-progress" aria-label={`${unlockedPlaces} of ${locations.length} places open; ${completedPlaces} complete`}>
        <span><strong>{completedPlaces}</strong> done</span>
        <span><strong>{unlockedPlaces}/{locations.length}</strong> open</span>
        <span><strong>⭐ {stars}</strong></span>
      </div>

      {#each presentations as item}
        <ExpeditionNode
          location={item.location}
          state={item.state}
          icon={locationIcon(item.location.id)}
          {childAvatar}
          actionLabel={actionLabel(item.state, item.mission)}
          ariaLabel={locationAriaLabel(item.location, item.state, item.mission)}
          onActivate={() => {
            if (item.state === 'locked') return;
            if (item.mission) openMission(item.mission.id);
            else onExploreLocation(item.location.id);
          }}
        />
      {/each}
    </div>

    {#if selectedMission && selectedBeat}
      <div class="mission-overlay" role="dialog" aria-modal="true" aria-labelledby="mission-overlay-heading">
        <header class="mission-overlay__header">
          <button type="button" class="mission-close" onclick={requestCloseMission} aria-label="Close mission">←</button>
          <div class="mission-overlay__title">
            <span class="eyebrow">STORY MISSION · {challengeLabel(selectedMission)}</span>
            <h3 id="mission-overlay-heading">{selectedMission.title}</h3>
          </div>
          <span class="mission-beat-count" aria-label={`Story beat ${missionBeatIndex + 1} of ${selectedMission.beats.length}`}>
            {missionBeatIndex + 1}/{selectedMission.beats.length}
          </span>
        </header>

        <div class="mission-overlay__body">
          {#if selectedMission.openingSceneRef}
            <div class="mission-scene"><Scene sceneId={selectedMission.openingSceneRef} /></div>
          {/if}

          <div class="mission-challenge">
            <span class="mission-character" aria-hidden="true">
              <StoryCharacter character="shaitanu" mood="mischievous" motion="wiggle" />
            </span>
            <div>
              <strong>Shaitanu has a guess.</strong>
              <span>Check the clues before you believe the trick.</span>
            </div>
          </div>

          <div class="mission-dialogue" aria-live="polite" aria-label="Mission dialogue">
            <p data-speaker={selectedBeat.speakerRef}>
              <strong>{speakerName(selectedBeat.speakerRef)}</strong>
              <span>{selectedBeat.text.replaceAll('Dheu', heroName)}</span>
            </p>
          </div>
        </div>

        <footer class="mission-overlay__actions">
          {#if hasMoreMissionBeats}
            <button class="mission-start" type="button" onclick={advanceMissionBeat}>Next story beat</button>
          {:else}
            <button class="mission-start" type="button" onclick={() => onStartMission(selectedMission!.id)}>
              Start investigation · {selectedMission.questionCount} clues
            </button>
          {/if}
          <button class="mission-later" type="button" onclick={requestCloseMission}>Not now</button>
        </footer>
      </div>
    {/if}
  </div>
</section>

<style>
  .story-world-viewport {
    height: 100%;
    min-height: 0;
    position: relative;
    display: grid;
    grid-template-rows: auto minmax(0,1fr);
    gap: 7px;
    padding: 8px;
    border: 1px solid rgba(36,48,58,.08);
    border-radius: 22px;
    background: linear-gradient(180deg,#f7fbff,#fff9e7);
    overflow: hidden;
  }

  .next-adventure {
    min-width: 0;
    min-height: 58px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 7px 10px;
    border-radius: 16px;
    background: linear-gradient(120deg,rgba(255,255,255,.96),rgba(243,240,255,.92));
  }
  .next-adventure__copy { min-width: 0; }
  .eyebrow { color: var(--accent); font-size: .58rem; font-weight: 950; letter-spacing: .09em; }
  .next-adventure h2 { margin: 1px 0 2px; font-size: clamp(1rem,3.4vw,1.35rem); line-height: 1; }
  .next-adventure p { margin: 0; color: var(--muted); font-size: .62rem; font-weight: 750; }
  .next-adventure p strong { color: var(--accent); }
  .next-adventure__guides { flex: 0 0 auto; display: flex; gap: 3px; }
  .next-adventure__guides > span { width: 34px; height: 34px; display: grid; place-items: center; border-radius: 11px; background: #fff; }

  .world-stage { min-height: 0; position: relative; overflow: hidden; border-radius: 18px; }
  .world-map {
    position: absolute;
    inset: 0;
    overflow: hidden;
    border-radius: 18px;
    border: 1px solid rgba(36,48,58,.08);
    background:
      radial-gradient(circle at 18% 24%,rgba(82,181,103,.25) 0 13%,transparent 14%),
      radial-gradient(circle at 77% 18%,rgba(245,211,87,.23) 0 11%,transparent 12%),
      linear-gradient(180deg,#dff4ff 0 28%,#dff3cf 28% 100%);
  }
  .world-map__river { position:absolute; width:150%; height:14%; min-height:40px; left:-18%; top:54%; border-radius:50%; background:rgba(81,176,225,.68); transform:rotate(-8deg); }
  .world-map__path { position:absolute; height:4.5%; min-height:14px; border-radius:999px; background:rgba(203,170,119,.57); transform-origin:left center; }
  .world-map__path--one { width:70%; left:8%; top:72%; transform:rotate(5deg); }
  .world-map__path--two { width:58%; left:31%; top:39%; transform:rotate(-22deg); opacity:.75; }
  .world-progress { position:absolute; top:7px; right:7px; z-index:8; display:flex; gap:4px; }
  .world-progress span { min-height:27px; display:flex; align-items:center; gap:3px; padding:3px 7px; border-radius:999px; background:rgba(255,255,255,.9); color:var(--muted); font-size:.54rem; font-weight:800; }
  .world-progress strong { color:var(--ink); }

  .mission-overlay { position:absolute; inset:0; z-index:20; min-height:0; display:grid; grid-template-rows:auto minmax(0,1fr) auto; gap:8px; padding:10px; border:2px solid rgba(90,82,213,.18); border-radius:18px; background:linear-gradient(160deg,#f4f0ff,#fff9e9); box-shadow:0 16px 40px rgba(36,48,58,.18); }
  .mission-overlay__header { min-width:0; display:flex; align-items:center; gap:9px; }
  .mission-close { width:42px; height:42px; flex:0 0 auto; border:0; border-radius:13px; background:#fff; color:var(--accent); font-size:1.15rem; font-weight:950; cursor:pointer; }
  .mission-overlay__title { min-width:0; flex:1; }
  .mission-overlay__title h3 { margin:2px 0 0; font-size:1rem; line-height:1.08; }
  .mission-beat-count { flex:0 0 auto; padding:4px 7px; border-radius:999px; background:#fff; color:var(--muted); font-size:.62rem; font-weight:850; }
  .mission-overlay__body { min-height:0; display:grid; grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr); grid-template-rows:minmax(0,1fr) auto; gap:8px; overflow:hidden; }
  .mission-scene { min-height:0; grid-row:1 / 3; overflow:hidden; border-radius:16px; background:#fff; }
  .mission-challenge { min-width:0; display:flex; align-items:center; gap:8px; padding:9px; border-radius:15px; background:rgba(255,255,255,.82); }
  .mission-character { width:48px; height:48px; flex:0 0 auto; }
  .mission-challenge div { display:grid; gap:1px; }
  .mission-challenge strong { font-size:.78rem; }
  .mission-challenge span { color:var(--muted); font-size:.64rem; font-weight:700; line-height:1.2; }
  .mission-dialogue { min-width:0; min-height:0; display:grid; align-items:end; }
  .mission-dialogue p { margin:0; display:grid; gap:3px; padding:10px; border-radius:15px; background:#fff; font-size:.72rem; line-height:1.3; }
  .mission-dialogue p strong { color:var(--accent); }
  .mission-overlay__actions { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:7px; }
  .mission-start,.mission-later { min-height:44px; border:0; border-radius:14px; padding:8px 13px; font:inherit; font-weight:900; cursor:pointer; }
  .mission-start { background:var(--accent); color:#fff; }
  .mission-later { background:#fff; color:var(--muted); }

  @media (max-width:600px) {
    .story-world-viewport { padding:6px; gap:5px; }
    .next-adventure { min-height:52px; padding:6px 8px; }
    .next-adventure p { display:none; }
    .next-adventure__guides > span { width:29px; height:29px; }
    .world-progress span:first-child { display:none; }
    .mission-overlay__body { grid-template-columns:1fr; grid-template-rows:minmax(0,1fr) auto auto; }
    .mission-scene { grid-row:auto; min-height:0; }
    .mission-character { width:38px; height:38px; }
  }

  @media (max-width:420px) {
    .next-adventure__guides { display:none; }
    .world-progress span { padding:2px 5px; font-size:.48rem; }
    .mission-overlay { padding:7px; }
    .mission-overlay__actions { grid-template-columns:1fr; }
    .mission-later { min-height:38px; }
  }

  @media (prefers-reduced-motion: reduce) {
    .next-adventure__guides :global(*) { animation:none !important; }
  }
</style>