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
  import type { StoryProgressSnapshot } from '../story/storyProgress';
  import type { StoryLocation, StoryMission } from '../story/storyTypes';
  import type { WorldChange, WorldLocationId, WorldRewardState } from '../story/worldRewards';
  import ExpeditionNode from './story/ExpeditionNode.svelte';

  let {
    childName,
    childAvatar,
    storyProgress,
    worldState,
    recommendedTopics = [],
    topicProgress = [],
    onStartMission,
    onExploreLocation = () => {}
  }: {
    childName: string;
    childAvatar: AvatarId;
    storyProgress: StoryProgressSnapshot;
    worldState?: WorldRewardState;
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
  let presentations = $derived(buildStoryLocationPresentation(locations, missions, storyProgress, recommendedTopics));
  let currentPresentation = $derived(presentations.find((item) => item.state === 'current') ?? null);
  let worldChanged = $derived((worldState?.totalChanges ?? 0) > 0);
  let worldCollectibles = $derived(worldState?.collectibles ?? []);
  let worldDiscoveries = $derived(worldState?.discoveries ?? []);
  let worldTrophies = $derived(worldState?.trophies ?? []);

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

  function worldChangesFor(locationId: string): WorldChange[] {
    return worldState?.locations[locationId as WorldLocationId]?.changes ?? [];
  }

  function changeNames(changes: WorldChange[]): string {
    return changes.map((change) => change.title).join(', ');
  }

  function changeIcons(changes: WorldChange[]): string {
    return changes.slice(-2).map((change) => change.icon).join('');
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

  function continueAdventure(): void {
    if (!currentPresentation) return;
    if (currentPresentation.mission) {
      openMission(currentPresentation.mission.id);
      return;
    }
    onExploreLocation(currentPresentation.location.id);
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
      <span class="eyebrow">CONTINUE ADVENTURE</span>
      {#if currentPresentation}
        <h2 id="story-world-heading">{currentPresentation.location.expeditionTitle}</h2>
        <p><strong>LEVEL {currentPresentation.location.progression.level}</strong> · Follow the glowing path to the next story.</p>
      {:else}
        <h2 id="story-world-heading">Explore {heroName}'s science world</h2>
        <p>Your worlds stay open for another adventure.</p>
      {/if}
    </div>
    {#if currentPresentation}
      <button class="mission-start" type="button" onclick={continueAdventure} aria-label="Continue Adventure">
        Continue Adventure <span aria-hidden="true">▶</span>
      </button>
    {/if}
    <div class="next-adventure__guides" aria-label="Story guides">
      <span aria-hidden="true"><StoryCharacter character="scientu" mood="thinking" motion="float" /></span>
      <span aria-hidden="true"><StoryCharacter character="shaitanu" mood="mischievous" motion="wiggle" /></span>
    </div>
  </header>

  <div class="world-stage">
    <div class="world-map" aria-label={`${heroName}'s story world. Progress is shown by complete, current, available and locked expedition states.`}>
      <div class="world-map__river" aria-hidden="true"></div>
      <div class="world-map__path" aria-hidden="true"></div>

      {#if worldChanged}
        <div class="world-progress" style="right:7px" aria-label="Learning has changed the world">
          <span><strong>🌍 changed</strong></span>
        </div>
      {/if}

      {#if worldCollectibles.length > 0 || worldDiscoveries.length > 0 || worldTrophies.length > 0}
        <div class="world-progress" style="left:7px" aria-label="Persistent learning keepsakes">
          {#if worldCollectibles.length > 0}
            <span role="group" aria-label={`Backpack collectibles: ${changeNames(worldCollectibles)}`}><strong aria-hidden="true">🎒{changeIcons(worldCollectibles)}</strong></span>
          {/if}
          {#if worldDiscoveries.length > 0}
            <span role="group" aria-label={`Lab and science discoveries: ${changeNames(worldDiscoveries)}`}><strong aria-hidden="true">🔬{changeIcons(worldDiscoveries)}</strong></span>
          {/if}
          {#if worldTrophies.length > 0}
            <span role="group" aria-label={`Puzzle trophies: ${changeNames(worldTrophies)}`}><strong aria-hidden="true">🏆{changeIcons(worldTrophies)}</strong></span>
          {/if}
        </div>
      {/if}

      {#each presentations as item}
        <ExpeditionNode
          location={item.location}
          state={item.state}
          icon={locationIcon(item.location.id)}
          {childAvatar}
          actionLabel={actionLabel(item.state, item.mission)}
          ariaLabel={locationAriaLabel(item.location, item.state, item.mission)}
          worldChanges={worldChangesFor(item.location.id)}
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
            <span class="mission-character" aria-hidden="true"><StoryCharacter character="shaitanu" mood="mischievous" motion="wiggle" /></span>
            <div><strong>Shaitanu has a guess.</strong><span>Check the clues before you believe the trick.</span></div>
          </div>
          <div class="mission-dialogue" aria-live="polite" aria-label="Mission dialogue">
            <p data-speaker={selectedBeat.speakerRef}><strong>{speakerName(selectedBeat.speakerRef)}</strong><span>{selectedBeat.text.replaceAll('Dheu', heroName)}</span></p>
          </div>
        </div>

        <footer class="mission-overlay__actions">
          {#if hasMoreMissionBeats}
            <button class="mission-start" type="button" onclick={advanceMissionBeat}>Next story beat</button>
          {:else}
            <button class="mission-start" type="button" onclick={() => onStartMission(selectedMission!.id)}>Start investigation · {selectedMission.questionCount} clues</button>
          {/if}
          <button class="mission-later" type="button" onclick={requestCloseMission}>Not now</button>
        </footer>
      </div>
    {/if}
  </div>
</section>

<style>
  .story-world-viewport{height:100%;min-height:0;display:grid;grid-template-rows:auto minmax(0,1fr);gap:6px;padding:7px;border-radius:20px;background:linear-gradient(#f7fbff,#fff9e7);overflow:hidden}
  .next-adventure{min-height:64px;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:7px 9px;border-radius:14px;background:#fffffff2}.next-adventure__copy{min-width:0;flex:1}.eyebrow{color:var(--accent);font-size:.57rem;font-weight:950;letter-spacing:.08em}.next-adventure h2{margin:1px 0 2px;font-size:clamp(1rem,3.4vw,1.3rem);line-height:1}.next-adventure p{margin:0;color:var(--muted);font-size:.6rem}.next-adventure__guides{display:flex;gap:3px;flex:none}.next-adventure__guides>span{width:30px;height:30px;display:grid;place-items:center}
  .world-stage{min-height:0;position:relative;overflow:hidden;border-radius:17px}.world-map{position:absolute;inset:0;overflow:hidden;border-radius:17px;background:linear-gradient(180deg,#dff4ff 0 28%,#dff3cf 28%)}.world-map__river{position:absolute;width:150%;height:14%;left:-18%;top:54%;border-radius:50%;background:#51b0e1b3;transform:rotate(-8deg)}.world-map__path{position:absolute;width:70%;height:4.5%;min-height:14px;left:8%;top:72%;border-radius:999px;background:#cbaa7791;transform:rotate(5deg)}
  .world-progress{position:absolute;top:7px;z-index:8}.world-progress span{padding:3px 7px;border-radius:999px;background:#ffffffe6;font-size:.53rem}
  .mission-overlay{position:absolute;inset:0;z-index:20;min-height:0;display:grid;grid-template-rows:auto minmax(0,1fr) auto;gap:7px;padding:9px;border-radius:17px;background:linear-gradient(160deg,#f4f0ff,#fff9e9)}.mission-overlay__header{display:flex;align-items:center;gap:8px}.mission-close{width:40px;height:40px;flex:none;border:0;border-radius:12px;color:var(--accent);font-weight:950;cursor:pointer}.mission-overlay__title{min-width:0;flex:1}.mission-overlay__title h3{margin:2px 0 0;font-size:1rem}.mission-beat-count{padding:4px 6px;border-radius:999px;color:var(--muted);font-size:.6rem;font-weight:850}
  .mission-overlay__body{min-height:0;display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr);grid-template-rows:minmax(0,1fr) auto;gap:7px;overflow:hidden}.mission-scene{min-height:0;grid-row:1/3;overflow:hidden;border-radius:14px}.mission-challenge{display:flex;align-items:center;gap:7px;padding:8px}.mission-character{width:44px;height:44px;flex:none}.mission-challenge div{display:grid}.mission-challenge span{color:var(--muted);font-size:.62rem}.mission-dialogue{display:grid;align-items:end}.mission-dialogue p{margin:0;display:grid;padding:9px;font-size:.7rem;line-height:1.3}
  .mission-overlay__actions{display:grid;grid-template-columns:1fr auto;gap:6px}.mission-start,.mission-later{min-height:44px;border:0;border-radius:13px;padding:7px 12px;font:inherit;font-weight:900;cursor:pointer}.mission-start{background:var(--accent);color:#fff}.mission-later{background:#fff;color:var(--muted)}
  @media(max-width:650px){.story-world-viewport{padding:5px}.next-adventure{min-height:62px}.next-adventure p,.next-adventure__guides{display:none}.mission-overlay__body{grid-template-columns:1fr;grid-template-rows:minmax(0,1fr) auto auto}.mission-scene{grid-row:auto}.mission-character{width:36px;height:36px}}
  @media(max-width:420px){.next-adventure h2{font-size:.94rem}.mission-overlay{padding:6px}.mission-overlay__actions{grid-template-columns:1fr}}
  @media(prefers-reduced-motion:reduce){.next-adventure__guides :global(*){animation:none!important}}
</style>