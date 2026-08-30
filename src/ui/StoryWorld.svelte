<script lang="ts">
  import Avatar from '../presentation/Avatar.svelte';
  import Scene from '../presentation/Scene.svelte';
  import type { AvatarId } from '../runtime/localProgress';
  import {
    getHeroDisplayName,
    getStoryLocations,
    getStoryMissions
  } from '../story/storyDirector';
  import {
    isStoryMissionComplete,
    storyStarTotal,
    type StoryProgressSnapshot
  } from '../story/storyProgress';
  import type { StoryCharacterId, StoryMission } from '../story/storyTypes';

  let {
    childName,
    childAvatar,
    storyProgress,
    onStartMission
  }: {
    childName: string;
    childAvatar: AvatarId;
    storyProgress: StoryProgressSnapshot;
    onStartMission: (missionId: string) => void;
  } = $props();

  const locations = getStoryLocations();
  const missions = getStoryMissions();
  let selectedMissionId = $state<string | null>(null);
  let selectedMission = $derived(
    selectedMissionId ? missions.find((mission) => mission.id === selectedMissionId) ?? null : null
  );
  let heroName = $derived(getHeroDisplayName(childName));
  let stars = $derived(storyStarTotal(storyProgress));

  function missionForLocation(locationId: string): StoryMission | undefined {
    return missions.find((mission) => mission.locationRef === locationId);
  }

  function speakerName(speakerRef: StoryCharacterId): string {
    if (speakerRef === 'dheu') return heroName;
    return speakerRef === 'scientu' ? 'Scientu' : 'Shaitanu';
  }
</script>

<section class="story-world" aria-labelledby="story-world-heading">
  <header class="story-world__header">
    <div>
      <span class="eyebrow">DHEU'S WORLD</span>
      <h2 id="story-world-heading">Where should {heroName} explore?</h2>
      <p>Help Scientu investigate ideas and catch Shaitanu's tricky guesses.</p>
    </div>
    <div class="story-stars" aria-label={`${stars} story stars`}>
      <span aria-hidden="true">⭐</span>
      <strong>{stars}</strong>
    </div>
  </header>

  <div class="story-cast" aria-label="Story characters">
    <div class="story-cast__hero">
      <span class="story-cast__avatar" aria-hidden="true">
        <Avatar avatar={childAvatar} mood="happy" motion="idle" />
      </span>
      <span><strong>{heroName}</strong><small>Explorer</small></span>
    </div>
    <div class="story-cast__character story-cast__character--scientu">
      <span class="story-cast__mark" aria-hidden="true">🧪</span>
      <span><strong>Scientu</strong><small>Ask why</small></span>
    </div>
    <div class="story-cast__character story-cast__character--shaitanu">
      <span class="story-cast__mark" aria-hidden="true">🌀</span>
      <span><strong>Shaitanu</strong><small>Spot the trick</small></span>
    </div>
  </div>

  <div class="world-map" aria-label="Dheu's story world">
    <div class="world-map__river" aria-hidden="true"></div>
    <div class="world-map__path" aria-hidden="true"></div>
    {#each locations as location}
      {@const mission = missionForLocation(location.id)}
      {@const completed = mission ? isStoryMissionComplete(storyProgress, mission.id) : false}
      <button
        class:world-place--mission={Boolean(mission)}
        class:world-place--complete={completed}
        class="world-place"
        style={`--world-x:${location.position.x}%;--world-y:${location.position.y}%`}
        type="button"
        disabled={!mission}
        aria-label={mission ? `${location.label}: ${mission.title}` : `${location.label}: more adventures coming`}
        onclick={() => mission && (selectedMissionId = mission.id)}
      >
        <span class="world-place__icon" aria-hidden="true">
          {location.id === 'river-pond' ? '🌊' : location.id === 'farm' ? '🐄' : location.id === 'forest' ? '🌳' : location.id === 'observatory' ? '🔭' : location.id === 'scientu-lab' ? '🔬' : location.id === 'road-school' ? '🚌' : location.id === 'home-garden' ? '🏡' : location.id === 'shaitanu-hideout' ? '🪨' : '🏘️'}
        </span>
        <strong>{location.label}</strong>
        <small>{mission ? (completed ? 'Mission complete · replay' : 'New mission') : 'More adventures soon'}</small>
      </button>
    {/each}
  </div>

  {#if selectedMission}
    <article class="mission-intro" aria-labelledby="mission-intro-heading">
      <div class="mission-intro__scene">
        {#if selectedMission.openingSceneRef}
          <Scene sceneId={selectedMission.openingSceneRef} />
        {/if}
      </div>
      <div class="mission-intro__copy">
        <span class="eyebrow">STORY MISSION</span>
        <h3 id="mission-intro-heading">{selectedMission.title}</h3>
        <div class="mission-dialogue">
          {#each selectedMission.beats as beat}
            <p data-speaker={beat.speakerRef}>
              <strong>{speakerName(beat.speakerRef)}</strong>
              <span>{beat.text.replaceAll('Dheu', heroName)}</span>
            </p>
          {/each}
        </div>
        <div class="mission-intro__actions">
          <button class="mission-start" type="button" onclick={() => onStartMission(selectedMission!.id)}>
            Start investigation · {selectedMission.questionCount} clues
          </button>
          <button class="mission-close" type="button" onclick={() => (selectedMissionId = null)}>Not now</button>
        </div>
      </div>
    </article>
  {/if}
</section>

<style>
  .story-world {
    display: grid;
    gap: 16px;
    padding: 22px;
    border: 1px solid rgba(36, 48, 58, 0.08);
    border-radius: 30px;
    background: linear-gradient(180deg, #f8fbff 0%, #fff9e9 100%);
    overflow: hidden;
  }

  .story-world__header {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: flex-start;
  }

  .story-world__header h2 {
    margin: 3px 0 6px;
    font-size: clamp(1.55rem, 4vw, 2.2rem);
  }

  .story-world__header p {
    margin: 0;
    color: var(--muted);
    font-weight: 650;
  }

  .story-stars {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 46px;
    padding: 8px 13px;
    border-radius: 999px;
    background: #fff;
    box-shadow: 0 5px 18px rgba(36, 48, 58, 0.08);
    font-size: 1.15rem;
  }

  .story-cast {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }

  .story-cast__hero,
  .story-cast__character {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px;
    border: 1px solid rgba(36, 48, 58, 0.08);
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.82);
  }

  .story-cast__avatar,
  .story-cast__mark {
    flex: 0 0 auto;
    width: 48px;
    height: 48px;
    display: grid;
    place-items: center;
    border-radius: 15px;
    background: #fff;
  }

  .story-cast__mark {
    font-size: 1.55rem;
  }

  .story-cast__hero > span:last-child,
  .story-cast__character > span:last-child {
    min-width: 0;
    display: grid;
  }

  .story-cast small {
    color: var(--muted);
    font-weight: 700;
  }

  .world-map {
    position: relative;
    min-height: 430px;
    border-radius: 26px;
    background:
      radial-gradient(circle at 20% 24%, rgba(88, 181, 103, 0.26) 0 14%, transparent 15%),
      radial-gradient(circle at 76% 20%, rgba(245, 211, 87, 0.24) 0 12%, transparent 13%),
      linear-gradient(180deg, #dff4ff 0 28%, #dff3cf 28% 100%);
    border: 1px solid rgba(36, 48, 58, 0.08);
    overflow: hidden;
  }

  .world-map__river {
    position: absolute;
    width: 150%;
    height: 62px;
    left: -18%;
    top: 54%;
    border-radius: 50%;
    background: rgba(81, 176, 225, 0.7);
    transform: rotate(-8deg);
  }

  .world-map__path {
    position: absolute;
    width: 65%;
    height: 22px;
    left: 20%;
    top: 73%;
    border-radius: 999px;
    background: rgba(203, 170, 119, 0.62);
    transform: rotate(7deg);
  }

  .world-place {
    position: absolute;
    left: var(--world-x);
    top: var(--world-y);
    width: 126px;
    min-height: 86px;
    transform: translate(-50%, -50%);
    display: grid;
    justify-items: center;
    align-content: center;
    gap: 1px;
    padding: 8px;
    border: 2px solid rgba(36, 48, 58, 0.12);
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.9);
    color: var(--ink);
    font: inherit;
    cursor: pointer;
    box-shadow: 0 5px 16px rgba(36, 48, 58, 0.08);
  }

  .world-place:disabled {
    cursor: default;
    opacity: 0.72;
  }

  .world-place--mission {
    border-color: var(--accent);
    box-shadow: 0 0 0 4px rgba(90, 82, 213, 0.1), 0 8px 20px rgba(36, 48, 58, 0.1);
  }

  .world-place--complete {
    border-color: var(--good);
    background: var(--good-soft);
  }

  .world-place__icon {
    font-size: 1.45rem;
  }

  .world-place strong {
    font-size: 0.77rem;
    line-height: 1.1;
    text-align: center;
  }

  .world-place small {
    color: var(--muted);
    font-size: 0.6rem;
    font-weight: 750;
    text-align: center;
  }

  .mission-intro {
    display: grid;
    grid-template-columns: minmax(230px, 0.8fr) minmax(0, 1.2fr);
    gap: 18px;
    padding: 18px;
    border-radius: 24px;
    background: #fff;
    border: 2px solid rgba(90, 82, 213, 0.18);
  }

  .mission-intro__scene :global(.scene) {
    height: 100%;
    min-height: 220px;
  }

  .mission-intro__copy h3 {
    margin: 4px 0 10px;
    font-size: 1.45rem;
  }

  .mission-dialogue {
    display: grid;
    gap: 8px;
  }

  .mission-dialogue p {
    display: grid;
    gap: 2px;
    margin: 0;
    padding: 9px 11px;
    border-radius: 14px;
    background: #f6f7f8;
  }

  .mission-dialogue p[data-speaker='scientu'] {
    background: #edf8ff;
  }

  .mission-dialogue p[data-speaker='shaitanu'] {
    background: #fff4e6;
  }

  .mission-dialogue strong {
    font-size: 0.75rem;
  }

  .mission-dialogue span {
    font-weight: 650;
    line-height: 1.4;
  }

  .mission-intro__actions {
    display: flex;
    gap: 9px;
    margin-top: 14px;
  }

  .mission-start,
  .mission-close {
    min-height: 48px;
    padding: 10px 14px;
    border-radius: 15px;
    font: inherit;
    font-weight: 900;
    cursor: pointer;
  }

  .mission-start {
    flex: 1;
    border: 0;
    background: var(--accent);
    color: #fff;
  }

  .mission-close {
    border: 2px solid #e2e7ea;
    background: #fff;
    color: var(--ink);
  }

  @media (max-width: 650px) {
    .story-world {
      padding: 18px;
      border-radius: 24px;
    }

    .story-cast {
      grid-template-columns: 1fr;
    }

    .world-map {
      min-height: auto;
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 9px;
      padding: 12px;
      background: linear-gradient(180deg, #e5f6ff, #e5f3d8);
    }

    .world-map__river,
    .world-map__path {
      display: none;
    }

    .world-place {
      position: static;
      width: auto;
      min-height: 84px;
      transform: none;
    }

    .mission-intro {
      grid-template-columns: 1fr;
    }

    .mission-intro__scene :global(.scene) {
      min-height: 170px;
    }
  }

  @media (max-width: 430px) {
    .story-world__header {
      align-items: flex-start;
    }

    .story-stars {
      min-height: 40px;
      padding: 6px 10px;
    }

    .world-map {
      grid-template-columns: 1fr;
    }

    .mission-intro__actions {
      flex-direction: column;
    }
  }
</style>
