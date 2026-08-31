<script lang="ts">
  import Scene from '../presentation/Scene.svelte';
  import StoryCharacter from '../presentation/StoryCharacter.svelte';
  import type { AvatarId, TopicProgressSummary } from '../runtime/localProgress';
  import {
    getHeroDisplayName,
    getStoryMission,
    getStoryMissionAverageDifficulty,
    getStoryLocations,
    getStoryMissions
  } from '../story/storyDirector';
  import {
    isStoryLocationUnlocked,
    isStoryMissionComplete,
    storyStarTotal,
    storyUnlockedLocationCount,
    type StoryProgressSnapshot
  } from '../story/storyProgress';
  import type { StoryLocation, StoryMission } from '../story/storyTypes';

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
  let selectedMission = $derived(
    selectedMissionId ? missions.find((mission) => mission.id === selectedMissionId) ?? null : null
  );
  let heroName = $derived(getHeroDisplayName(childName));
  let stars = $derived(storyStarTotal(storyProgress));
  let unlockedPlaces = $derived(storyUnlockedLocationCount(storyProgress, locations));

  function missionForLocation(locationId: string): StoryMission | undefined {
    return missions.find((mission) => mission.locationRef === locationId);
  }

  function recommendationForLocation(location: StoryLocation): TopicProgressSummary | undefined {
    return recommendedTopics.find((topic) => location.topicGroups.includes(topic.id));
  }

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

  function closeMission(): void {
    selectedMissionId = null;
  }
</script>

<section class="story-world-viewport" aria-labelledby="story-world-heading">
  <header class="story-world-viewport__header">
    <div class="story-world-viewport__copy">
      <span class="eyebrow">DHEU'S WORLD</span>
      <h2 id="story-world-heading">Where should {heroName} explore?</h2>
    </div>
    <div class="story-world-viewport__guides" aria-label="Story guides">
      <span class="guide-face" aria-hidden="true">
        <StoryCharacter character="scientu" mood="thinking" motion="float" />
      </span>
      <span class="guide-face" aria-hidden="true">
        <StoryCharacter character="shaitanu" mood="mischievous" motion="wiggle" />
      </span>
      <span class="story-stars" aria-label={`${stars} story stars`}>⭐ <strong>{stars}</strong></span>
    </div>
  </header>

  <div class="world-stage">
    <div class="world-map" aria-label="Dheu's story world">
      <div class="world-map__river" aria-hidden="true"></div>
      <div class="world-map__path" aria-hidden="true"></div>
      <div class="world-progress" aria-label={`${unlockedPlaces} of ${locations.length} places open`}>
        {unlockedPlaces}/{locations.length} open
      </div>

      {#each locations as location}
        {@const mission = missionForLocation(location.id)}
        {@const completed = mission ? isStoryMissionComplete(storyProgress, mission.id) : false}
        {@const recommendation = recommendationForLocation(location)}
        {@const unlocked = isStoryLocationUnlocked(storyProgress, location)}
        {@const unlockTitle = unlockMissionTitle(location)}
        <button
          class:world-place--mission={Boolean(mission)}
          class:world-place--complete={completed}
          class:world-place--recommended={unlocked && Boolean(recommendation)}
          class:world-place--locked={!unlocked}
          class="world-place"
          style={`--world-x:${location.position.x}%;--world-y:${location.position.y}%`}
          type="button"
          disabled={!unlocked}
          aria-label={!unlocked
            ? `${location.label}: locked until ${unlockTitle ?? 'the previous story mission'}`
            : mission ? `${location.label}: ${mission.title}` : `${location.label}: explore`}
          onclick={() => {
            if (!unlocked) return;
            if (mission) selectedMissionId = mission.id;
            else onExploreLocation(location.id);
          }}
        >
          <span class="world-place__icon" aria-hidden="true">{unlocked ? locationIcon(location.id) : '🔒'}</span>
          <strong>{location.label}</strong>
          <small>{!unlocked ? 'Locked' : completed ? 'Replay' : recommendation ? 'Try next' : mission ? 'Mission' : 'Explore'}</small>
        </button>
      {/each}
    </div>

    {#if selectedMission}
      <section class="mission-overlay" role="dialog" aria-modal="true" aria-labelledby="mission-overlay-heading">
        <header class="mission-overlay__header">
          <button type="button" class="mission-close" onclick={closeMission} aria-label="Close mission">←</button>
          <div>
            <span class="eyebrow">STORY MISSION · {challengeLabel(selectedMission)}</span>
            <h3 id="mission-overlay-heading">{selectedMission.title}</h3>
          </div>
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

          <div class="mission-dialogue" aria-label="Mission dialogue">
            {#each selectedMission.beats as beat}
              <p data-speaker={beat.speakerRef}>
                <strong>{speakerName(beat.speakerRef)}</strong>
                <span>{beat.text.replaceAll('Dheu', heroName)}</span>
              </p>
            {/each}
          </div>
        </div>

        <footer class="mission-overlay__actions">
          <button class="mission-start" type="button" onclick={() => onStartMission(selectedMission!.id)}>
            Start investigation · {selectedMission.questionCount} clues
          </button>
          <button class="mission-later" type="button" onclick={closeMission}>Not now</button>
        </footer>
      </section>
    {/if}
  </div>
</section>

<style>
  .story-world-viewport {
    height: 100%;
    min-height: 0;
    position: relative;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    gap: 8px;
    padding: 10px;
    border: 1px solid rgba(36, 48, 58, .08);
    border-radius: 24px;
    background: linear-gradient(180deg, #f8fbff 0%, #fff9e9 100%);
    overflow: hidden;
  }

  .story-world-viewport__header {
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .story-world-viewport__copy { min-width: 0; }
  .story-world-viewport__copy h2 { margin: 1px 0 0; font-size: clamp(1.05rem, 3.5vw, 1.45rem); line-height: 1.05; }
  .eyebrow { color: var(--accent); font-size: .62rem; font-weight: 950; letter-spacing: .09em; }

  .story-world-viewport__guides {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .guide-face {
    width: 34px;
    height: 34px;
    display: grid;
    place-items: center;
    border-radius: 11px;
    background: #fff;
  }

  .story-stars {
    min-height: 34px;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border-radius: 999px;
    background: #fff;
    font-size: .78rem;
  }

  .world-stage {
    min-height: 0;
    position: relative;
    overflow: hidden;
    border-radius: 20px;
  }

  .world-map {
    position: absolute;
    inset: 0;
    overflow: hidden;
    border-radius: 20px;
    border: 1px solid rgba(36,48,58,.08);
    background:
      radial-gradient(circle at 20% 24%, rgba(88, 181, 103, .26) 0 14%, transparent 15%),
      radial-gradient(circle at 76% 20%, rgba(245, 211, 87, .24) 0 12%, transparent 13%),
      linear-gradient(180deg, #dff4ff 0 28%, #dff3cf 28% 100%);
  }

  .world-map__river {
    position: absolute;
    width: 150%;
    height: 15%;
    min-height: 42px;
    left: -18%;
    top: 54%;
    border-radius: 50%;
    background: rgba(81,176,225,.7);
    transform: rotate(-8deg);
  }

  .world-map__path {
    position: absolute;
    width: 65%;
    height: 5%;
    min-height: 15px;
    left: 20%;
    top: 73%;
    border-radius: 999px;
    background: rgba(203,170,119,.62);
    transform: rotate(4deg);
  }

  .world-progress {
    position: absolute;
    top: 8px;
    right: 8px;
    z-index: 2;
    padding: 5px 8px;
    border-radius: 999px;
    background: rgba(255,255,255,.88);
    color: var(--muted);
    font-size: .62rem;
    font-weight: 850;
  }

  .world-place {
    --world-x: 50%;
    --world-y: 50%;
    position: absolute;
    left: var(--world-x);
    top: var(--world-y);
    z-index: 3;
    width: clamp(68px, 15vw, 94px);
    min-height: 54px;
    display: grid;
    justify-items: center;
    align-content: center;
    gap: 0;
    padding: 5px 4px;
    transform: translate(-50%, -50%);
    border: 2px solid rgba(36,48,58,.12);
    border-radius: 15px;
    background: rgba(255,255,255,.94);
    color: var(--ink);
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(36,48,58,.09);
  }

  .world-place__icon { font-size: 1.25rem; line-height: 1; }
  .world-place strong { max-width: 100%; font-size: .68rem; line-height: 1.05; overflow-wrap: anywhere; }
  .world-place small { color: var(--muted); font-size: .54rem; font-weight: 800; }
  .world-place--recommended { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(90,82,213,.12); }
  .world-place--complete { background: var(--good-soft); }
  .world-place--locked { opacity: .62; cursor: default; }

  .mission-overlay {
    position: absolute;
    inset: 0;
    z-index: 10;
    min-height: 0;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto;
    gap: 8px;
    padding: 10px;
    border: 2px solid rgba(90,82,213,.18);
    border-radius: 20px;
    background: linear-gradient(160deg, #f4f0ff, #fff9e9);
    box-shadow: 0 16px 40px rgba(36,48,58,.18);
  }

  .mission-overlay__header {
    display: flex;
    align-items: center;
    gap: 9px;
  }

  .mission-overlay__header h3 { margin: 1px 0 0; font-size: 1rem; line-height: 1.08; }
  .mission-close {
    flex: 0 0 auto;
    width: 40px;
    height: 40px;
    border: 0;
    border-radius: 13px;
    background: #fff;
    color: var(--accent);
    font-weight: 950;
    cursor: pointer;
  }

  .mission-overlay__body {
    min-height: 0;
    overflow: auto;
    overscroll-behavior: contain;
    display: grid;
    gap: 8px;
    align-content: start;
  }

  .mission-scene :global(.scene) { height: clamp(110px, 22vh, 170px); }

  .mission-challenge {
    display: grid;
    grid-template-columns: 42px minmax(0,1fr);
    align-items: center;
    gap: 8px;
    padding: 8px;
    border-radius: 14px;
    background: rgba(255,255,255,.86);
  }

  .mission-character { width: 40px; height: 40px; }
  .mission-challenge > div { display: grid; gap: 2px; }
  .mission-challenge span { color: var(--muted); font-size: .72rem; font-weight: 700; }

  .mission-dialogue { display: grid; gap: 6px; }
  .mission-dialogue p {
    display: grid;
    gap: 2px;
    margin: 0;
    padding: 8px 10px;
    border-radius: 13px;
    background: rgba(255,255,255,.78);
  }
  .mission-dialogue strong { font-size: .7rem; }
  .mission-dialogue span { font-size: .76rem; font-weight: 650; line-height: 1.3; }

  .mission-overlay__actions { display: grid; grid-template-columns: minmax(0,1fr) auto; gap: 8px; }
  .mission-start, .mission-later {
    min-height: 46px;
    padding: 9px 12px;
    border: 0;
    border-radius: 14px;
    font: inherit;
    font-weight: 900;
    cursor: pointer;
  }
  .mission-start { background: var(--accent); color: #fff; }
  .mission-later { background: #fff; color: var(--ink); }

  @media (max-width: 430px) {
    .story-world-viewport { padding: 7px; gap: 5px; border-radius: 20px; }
    .story-world-viewport__copy h2 { font-size: .98rem; }
    .guide-face { width: 29px; height: 29px; }
    .story-stars { min-height: 29px; font-size: .68rem; }
    .world-place { width: 64px; min-height: 49px; padding: 3px; border-radius: 13px; }
    .world-place__icon { font-size: 1.05rem; }
    .world-place strong { font-size: .59rem; }
    .world-place small { font-size: .48rem; }
    .mission-overlay { padding: 8px; }
    .mission-scene :global(.scene) { height: 105px; }
  }

  @media (max-height: 700px) {
    .story-world-viewport__header { min-height: 32px; }
    .mission-scene :global(.scene) { height: 100px; }
  }
</style>
