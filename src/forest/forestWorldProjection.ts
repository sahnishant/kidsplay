import type { StoryProgressSnapshot } from '../story/storyProgress';
import type { WorldChange, WorldRewardState } from '../story/worldRewards';
import { mergeTownWorldDepthState } from '../town/townWorldProjection';

function forestMissionChanges(snapshot: StoryProgressSnapshot): WorldChange[] {
  const changes: WorldChange[] = [];
  if (snapshot.completedMissions['mission.forest-creek-rescue']) {
    changes.push({
      id: 'forest-creek-restored',
      locationId: 'forest',
      kind: 'repair',
      stage: 2,
      icon: '🌊',
      title: 'Creek crossing and water path restored',
      childLine: 'The repaired crossing stands above a flowing creek.'
    });
  }
  if (snapshot.completedMissions['mission.forest-busy-grove']) {
    changes.push({
      id: 'forest-busy-grove-restored',
      locationId: 'forest',
      kind: 'nature',
      stage: 3,
      icon: '🦋',
      title: 'Busy grove restored',
      childLine: 'The shelter, feeder and flowering grove are active again.'
    });
  }
  return changes;
}

/**
 * Backwards-compatible world-depth projection seam used by Home. Forest remains the
 * original producer; Town composes through the same story-progress authority instead
 * of creating another store or reward system.
 */
export function mergeForestWorldDepthState(
  base: WorldRewardState,
  storyProgress: StoryProgressSnapshot
): WorldRewardState {
  const existingIds = new Set(base.locations.forest.changes.map((change) => change.id));
  const additions = forestMissionChanges(storyProgress).filter((change) => !existingIds.has(change.id));
  let projected = base;

  if (additions.length) {
    const forestChanges = [...base.locations.forest.changes, ...additions];
    const forestStage = Math.max(base.locations.forest.stage, ...additions.map((change) => change.stage)) as 0 | 1 | 2 | 3;
    projected = {
      ...base,
      totalChanges: base.totalChanges + additions.length,
      locations: {
        ...base.locations,
        forest: {
          locationId: 'forest',
          stage: forestStage,
          changes: forestChanges
        }
      },
      repairs: [...base.repairs, ...additions.filter((change) => change.kind === 'repair')],
      nature: [...base.nature, ...additions.filter((change) => change.kind === 'nature')]
    };
  }

  return mergeTownWorldDepthState(projected, storyProgress);
}
