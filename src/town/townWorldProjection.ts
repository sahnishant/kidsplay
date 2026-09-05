import type { StoryProgressSnapshot } from '../story/storyProgress';
import type { WorldChange, WorldRewardState } from '../story/worldRewards';

const TOWN_MISSION = 'mission.town-square-helper';

function townMissionChanges(snapshot: StoryProgressSnapshot): WorldChange[] {
  if (!snapshot.completedMissions[TOWN_MISSION]) return [];
  return [
    {
      id: 'town-square-crossing-restored',
      locationId: 'town-square',
      kind: 'repair',
      stage: 2,
      icon: '🚦',
      title: 'Town Square crossing restored',
      childLine: 'The crossing sign stands up and the safe crossing is ready.'
    },
    {
      id: 'town-square-community-corner-ready',
      locationId: 'town-square',
      kind: 'landmark',
      stage: 3,
      icon: '♻️',
      title: 'Community corner ready',
      childLine: 'The recycling and help corner stays tidy beside the clear walking path.'
    }
  ];
}

/** Town mission consequences are pure projections from canonical story progress. */
export function mergeTownWorldDepthState(
  base: WorldRewardState,
  storyProgress: StoryProgressSnapshot
): WorldRewardState {
  const current = base.locations['town-square'];
  const existingIds = new Set(current.changes.map((change) => change.id));
  const additions = townMissionChanges(storyProgress).filter((change) => !existingIds.has(change.id));
  if (!additions.length) return base;

  const changes = [...current.changes, ...additions];
  const stage = Math.max(current.stage, ...additions.map((change) => change.stage)) as 0 | 1 | 2 | 3;
  return {
    ...base,
    totalChanges: base.totalChanges + additions.length,
    locations: {
      ...base.locations,
      'town-square': { locationId: 'town-square', stage, changes }
    },
    repairs: [...base.repairs, ...additions.filter((change) => change.kind === 'repair')],
    landmarks: [...base.landmarks, ...additions.filter((change) => change.kind === 'landmark')]
  };
}
