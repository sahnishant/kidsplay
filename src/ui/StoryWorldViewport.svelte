<script lang="ts">
  import { onDestroy, tick } from 'svelte';
  import type { DiscoveryEntry } from '../experience/discoveryProjection';
  import Avatar from '../presentation/Avatar.svelte';
  import Scene from '../presentation/Scene.svelte';
  import StoryCharacter from '../presentation/StoryCharacter.svelte';
  import { pushAppBackLayer, requestAppBack } from '../runtime/appNavigation';
  import { tryAdaptiveContinue } from '../runtime/adaptiveContinue';
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
  import type { StoryBeat, StoryLocation, StoryMission } from '../story/storyTypes';
  import type { WorldChange, WorldLocationId, WorldRewardState } from '../story/worldRewards';
  import ExpeditionNode from './story/ExpeditionNode.svelte';

  let {
    childName,
    childAvatar,
    storyProgress,
    worldState,
    forestDiscoveries = [],
    recommendedTopics = [],
    topicProgress = [],
    onStartMission,
    onExploreLocation = () => {}
  }: {
    childName: string;
    childAvatar: AvatarId;
    storyProgress: StoryProgressSnapshot;
    worldState?: WorldRewardState;
    forestDiscoveries?: DiscoveryEntry[];
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
  let missionOverlay = $state<HTMLDivElement | null>(null);
  let missionCloseButton = $state<HTMLButtonElement | null>(null);
  let returnFocusElement: HTMLElement | null = null;

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

  function worldDepthLabel(mission: StoryMission): string {
    return locations.find((location) => location.id === mission.locationRef)?.label ?? 'World';
  }

  function challengeLabel(mission: StoryMission): string {
    if (mission.worldActionRef) return `${worldDepthLabel(mission)} Level ${mission.worldDepthLevel ?? 2}`;
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

  function missionStartLabel(mission: StoryMission): string {
    return mission.worldActionRef
      ? `Start ${worldDepthLabel(mission)} Level ${mission.worldDepthLevel ?? 2}`
      : `Start investigation · ${mission.questionCount} clues`;
  }

  function speakerName(value: string): string {
    if (value === 'dheu') return heroName;
    if (value === 'scientu') return 'Scientu';
    return 'Shaitanu';
  }

  function beatMood(beat: StoryBeat): 'happy' | 'thinking' | 'mischievous' | 'celebrate' | 'worried' | 'ready' {
    if (beat.mood === 'thinking' || beat.mood === 'mischievous' || beat.mood === 'celebrate' || beat.mood === 'worried' || beat.mood === 'ready') return beat.mood;
    return 'happy';
  }

  function heroAvatarMood(beat: StoryBeat): 'happy' | 'thinking' | 'celebrate' {
    if (beat.mood === 'thinking') return 'thinking';
    if (beat.mood === 'celebrate' || beat.mood === 'ready') return 'celebrate';
    return 'happy';
  }

  function heroAvatarMotion(beat: StoryBeat): 'idle' | 'think' | 'bounce' {
    if (beat.mood === 'thinking') return 'think';
    if (beat.mood === 'celebrate' || beat.mood === 'ready') return 'bounce';
    return 'idle';
  }

  function speakerPrompt(beat: StoryBeat): string {
    if (beat.speakerRef === 'dheu') return `${heroName} is in the adventure.`;
    if (beat.speakerRef === 'scientu') return 'Scientu spotted something.';
    return 'Shaitanu has a trick.';
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

  function forestDiscoveryLabel(): string {
    return forestDiscoveries.map((entry) => entry.kind.replaceAll('_', ' ')).join(', ');
  }

  function restoreMissionFocus(target: HTMLElement | null): void {
    void tick().then(() => {
      if (target?.isConnected) target.focus();
    });
  }

  function closeMissionFromBack(): void {
    const focusTarget = returnFocusElement;
    selectedMissionId = null;
    missionBeatIndex = 0;
    releaseMissionBack = null;
    missionOverlay = null;
    missionCloseButton = null;
    returnFocusElement = null;
    restoreMissionFocus(focusTarget);
  }

  function openMission(missionId: string): void {
    releaseMissionBack?.();
    const active = document.activeElement;
    returnFocusElement = active instanceof HTMLElement ? active : null;
    missionBeatIndex = 0;
    selectedMissionId = missionId;
    releaseMissionBack = pushAppBackLayer(`story-mission:${missionId}`, closeMissionFromBack);
    void tick().then(() => missionCloseButton?.focus());
  }

  async function continueAdventure(): Promise<void> {
    if (await tryAdaptiveContinue()) return;
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

  function handleMissionKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab' || !missionOverlay) return;
    const controls = Array.from(
      missionOverlay.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((element) => element.getAttribute('aria-hidden') !== 'true');
    if (!controls.length) return;

    const first = controls[0];
    const last = controls[controls.length - 1];
    const active = document.activeElement;
    if (!missionOverlay.contains(active)) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
      return;
    }
    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
      return;
    }
    if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
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
    const depth = mission?.worldActionRef ? `, ${worldDepthLabel(mission)} depth ${mission.worldDepthLevel ?? 2}` : '';
    const action = state === 'complete' ? 'complete, replay' : state === 'current' ? 'play next' : mission ? mission.title : 'explore';
    return `${location.expeditionTitle}, Level ${location.progression.level}${depth}: ${action}`;
  }

  onDestroy(() => releaseMissionBack?.());
</script>

<section class="story-world-viewport" aria-labelledby="story-world-heading">
  <header class="next-adventure">
    <div class="next-adventure__copy">
      <span class="next-adventure__icon" aria-hidden="true">{currentPresentation ? locationIcon(currentPresentation.location.id) : '🗺️'}</span>
      {#if currentPresentation}
        <h2 id="story-world-heading">{currentPresentation.location.expeditionTitle}</h2>
      {:else}
        <h2 id="story-world-heading">Explore {heroName}'s science world</h2>
      {/if}
    </div>
    {#if currentPresentation}
      <button class="mission-start next-adventure__continue" type="button" onclick={continueAdventure} aria-label={`Continue ${currentPresentation.location.expeditionTitle}`}>
        Continue <span aria-hidden="true">▶</span>
      </button>
    {/if}
  </header>

  <div class="world-stage">
    <div class="world-map" aria-label={`${heroName}'s story world. Progress is shown by complete, current, available and locked expedition states.`}>
      <div class="world-map__river" aria-hidden="true"></div>
      <div class="world-map__path" aria-hidden="true"></div>

      {#if worldCollectibles.length > 0 || worldDiscoveries.length > 0 || worldTrophies.length > 0}
        <div class="world-progress" style="left:7px" aria-label="Persistent learning keepsakes">
          {#if worldCollectibles.length > 0}<span role="group" aria-label={`Backpack collectibles: ${changeNames(worldCollectibles)}`}><strong aria-hidden="true">🎒{changeIcons(worldCollectibles)}</strong></span>{/if}
          {#if worldDiscoveries.length > 0}<span role="group" aria-label={`Lab and science discoveries: ${changeNames(worldDiscoveries)}`}><strong aria-hidden="true">🔬{changeIcons(worldDiscoveries)}</strong></span>{/if}
          {#if worldTrophies.length > 0}<span role="group" aria-label={`Puzzle trophies: ${changeNames(worldTrophies)}`}><strong aria-hidden="true">🏆{changeIcons(worldTrophies)}</strong></span>{/if}
        </div>
      {/if}

      {#if forestDiscoveries.length > 0}
        <div class="world-progress" style="left:7px;top:auto;bottom:7px" aria-label={`Forest discoveries: ${forestDiscoveryLabel()}`}>
          <span><strong>📖 {forestDiscoveries.length} Forest finds</strong></span>
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
      <div
        class="mission-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mission-overlay-heading"
        tabindex="-1"
        bind:this={missionOverlay}
        onkeydown={handleMissionKeydown}
      >
        <header class="mission-overlay__header">
          <button bind:this={missionCloseButton} type="button" class="mission-close" onclick={requestCloseMission} aria-label="Close mission">←</button>
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
          <div class={`mission-persona mission-persona--${selectedBeat.speakerRef}`} data-speaker={selectedBeat.speakerRef} data-intent={selectedBeat.intent ?? 'story'}>
            <span class="mission-character" aria-hidden="true">
              {#if selectedBeat.speakerRef === 'dheu'}
                <Avatar avatar={childAvatar} mood={heroAvatarMood(selectedBeat)} motion={heroAvatarMotion(selectedBeat)} />
              {:else}
                <StoryCharacter character={selectedBeat.speakerRef} mood={beatMood(selectedBeat)} expression={selectedBeat.expression} pose={selectedBeat.pose} angle={selectedBeat.angle} motion={selectedBeat.motion} />
              {/if}
            </span>
            <div><strong>{speakerName(selectedBeat.speakerRef)}</strong><span>{speakerPrompt(selectedBeat)}</span></div>
          </div>
          <div class="mission-dialogue" aria-live="polite" aria-label="Mission dialogue">
            <p data-speaker={selectedBeat.speakerRef} data-delivery={selectedBeat.delivery ?? 'plain'}>
              <strong>{speakerName(selectedBeat.speakerRef)}</strong>
              <span>{selectedBeat.text.replaceAll('Dheu', heroName)}</span>
            </p>
          </div>
        </div>

        <footer class="mission-overlay__actions">
          {#if hasMoreMissionBeats}
            <button class="mission-start" type="button" onclick={advanceMissionBeat}>Next story beat</button>
          {:else}
            <button class="mission-start" type="button" onclick={() => onStartMission(selectedMission!.id)}>{missionStartLabel(selectedMission)}</button>
          {/if}
          <button class="mission-later" type="button" onclick={requestCloseMission}>Not now</button>
        </footer>
      </div>
    {/if}
  </div>
</section>

<style>
  .story-world-viewport{height:100%;min-height:0;display:grid;grid-template-rows:auto minmax(0,1fr);gap:5px;padding:6px;border-radius:20px;background:linear-gradient(#f7fbff,#fff9e7);overflow:hidden}
  .next-adventure{min-height:48px;display:flex;align-items:center;justify-content:space-between;gap:7px;padding:4px 7px;border-radius:14px;background:#fffffff2}.next-adventure__copy{min-width:0;flex:1;display:flex;align-items:center;gap:7px}.next-adventure__icon{width:30px;height:30px;display:grid;place-items:center;flex:none;font-size:1.35rem}.eyebrow{color:var(--accent);font-size:.57rem;font-weight:950;letter-spacing:.08em}.next-adventure h2{min-width:0;margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:clamp(.95rem,3vw,1.08rem);line-height:1.05}.next-adventure__continue{min-height:40px;flex:none;padding:6px 11px;white-space:nowrap}
  .world-stage{min-height:0;position:relative;overflow:hidden;border-radius:17px}.world-map{position:absolute;inset:0;overflow:hidden;border-radius:17px;background:linear-gradient(180deg,#dff4ff 0 28%,#dff3cf 28%)}.world-map__river{position:absolute;width:150%;height:14%;left:-18%;top:54%;border-radius:50%;background:#51b0e1b3;transform:rotate(-8deg)}.world-map__path{position:absolute;width:70%;height:4.5%;min-height:14px;left:8%;top:72%;border-radius:999px;background:#cbaa7791;transform:rotate(5deg)}
  .world-progress{position:absolute;top:7px;z-index:8}.world-progress span{padding:3px 7px;border-radius:999px;background:#ffffffe6;font-size:.53rem}
  .mission-overlay{position:absolute;inset:0;z-index:20;min-height:0;display:grid;grid-template-rows:auto minmax(0,1fr) auto;gap:7px;padding:9px;border-radius:17px;background:linear-gradient(160deg,#f4f0ff,#fff9e9)}.mission-overlay__header{display:flex;align-items:center;gap:8px}.mission-close{width:44px;height:44px;flex:none;border:0;border-radius:12px;color:var(--accent);font-weight:950;cursor:pointer}.mission-overlay__title{min-width:0;flex:1}.mission-overlay__title h3{margin:2px 0 0;font-size:1rem}.mission-beat-count{padding:4px 6px;border-radius:999px;color:var(--muted);font-size:.6rem;font-weight:850}
  .mission-overlay__body{min-height:0;display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr);grid-template-rows:minmax(0,1fr) auto;gap:7px;overflow:hidden}.mission-scene{min-height:0;grid-row:1/3;overflow:hidden;border-radius:14px}.mission-persona{display:flex;align-items:center;gap:8px;padding:7px 9px;border-radius:14px;background:#ffffffc7;border:1px solid rgba(36,48,58,.07)}.mission-character{width:60px;height:60px;flex:none;display:grid;place-items:center}.mission-persona div{min-width:0;display:grid;gap:1px}.mission-persona strong{font-size:.72rem}.mission-persona span{color:var(--muted);font-size:.6rem}.mission-persona--dheu{background:#fff8dccf}.mission-persona--scientu{background:#e9f9fccf}.mission-persona--shaitanu{background:#f4edffcf}.mission-dialogue{display:grid;align-items:end}.mission-dialogue p{margin:0;display:grid;gap:3px;padding:9px;border-radius:14px;background:#ffffffc9;font-size:.7rem;line-height:1.3}.mission-dialogue p[data-delivery='boast']{font-weight:760}.mission-dialogue p[data-delivery='gentle']{background:#f8fffbdd}.mission-dialogue p[data-delivery='suspicious']{background:#f5fbffdd}
  .mission-overlay__actions{display:grid;grid-template-columns:1fr auto;gap:6px}.mission-start,.mission-later{min-height:44px;border:0;border-radius:13px;padding:7px 12px;font:inherit;font-weight:900;cursor:pointer}.mission-start{background:var(--accent);color:#fff}.mission-later{background:#fff;color:var(--muted)}
  @media(max-width:650px){.story-world-viewport{padding:4px}.next-adventure{min-height:46px;padding:3px 6px}.next-adventure__icon{width:28px;height:28px;font-size:1.2rem}.next-adventure__continue{min-height:38px;padding:5px 10px}.mission-overlay__body{grid-template-columns:1fr;grid-template-rows:minmax(0,1fr) auto auto}.mission-scene{grid-row:auto}.mission-persona{min-height:62px}.mission-character{width:50px;height:50px}.mission-dialogue p{font-size:.68rem}}
  @media(max-width:420px){.next-adventure h2{font-size:.9rem}.next-adventure__continue{padding-inline:9px}.mission-overlay{padding:6px}.mission-overlay__actions{grid-template-columns:1fr}.mission-persona{padding:5px 7px}.mission-character{width:46px;height:46px}}
  @media(prefers-reduced-motion:reduce){.mission-persona :global(*){animation:none!important}}
</style>