import type {
  ProgressSummary,
  TopicId,
  TopicProgressStatus,
  TopicProgressSummary
} from '../runtime/localProgress';

export const WORLD_LOCATION_IDS = [
  'forest',
  'farm',
  'home-garden',
  'river-pond',
  'road-school',
  'scientu-lab',
  'shaitanu-hideout',
  'observatory',
  'town-square'
] as const;

export type WorldLocationId = (typeof WORLD_LOCATION_IDS)[number];
export type WorldChangeStage = 1 | 2 | 3;
export type WorldChangeKind =
  | 'repair'
  | 'nature'
  | 'discovery'
  | 'collectible'
  | 'trophy'
  | 'landmark';

export interface WorldChange {
  id: string;
  locationId: WorldLocationId;
  kind: WorldChangeKind;
  stage: WorldChangeStage;
  icon: string;
  title: string;
  childLine: string;
}

export interface WorldLocationRewardState {
  locationId: WorldLocationId;
  stage: 0 | WorldChangeStage;
  changes: WorldChange[];
}

export interface WorldRewardState {
  totalChanges: number;
  locations: Record<WorldLocationId, WorldLocationRewardState>;
  repairs: WorldChange[];
  nature: WorldChange[];
  discoveries: WorldChange[];
  collectibles: WorldChange[];
  trophies: WorldChange[];
  landmarks: WorldChange[];
}

type Requirement =
  | { metric: 'attempts'; atLeast: number }
  | { metric: 'practised'; atLeast: number }
  | { metric: 'mastered'; atLeast: number }
  | { metric: 'topic_started'; topic: TopicId }
  | { metric: 'topic_growing'; topic: TopicId }
  | { metric: 'topic_strong'; topic: TopicId };

type WorldChangeRule = WorldChange & { requires: Requirement[] };

const WORLD_CHANGE_RULES: WorldChangeRule[] = [
  {
    id: 'forest-trail-sign', locationId: 'forest', kind: 'repair', stage: 1, icon: '🪧',
    title: 'Trail sign repaired', childLine: 'The forest trail sign is standing again.',
    requires: [{ metric: 'attempts', atLeast: 1 }]
  },
  {
    id: 'forest-animal-clearing', locationId: 'forest', kind: 'nature', stage: 2, icon: '🦌',
    title: 'Forest animals return', childLine: 'Animal friends are visiting the clearing.',
    requires: [{ metric: 'topic_growing', topic: 'animals' }]
  },
  {
    id: 'forest-sapling-grove', locationId: 'forest', kind: 'nature', stage: 3, icon: '🌱',
    title: 'Saplings take root', childLine: 'New saplings are growing beside the trail.',
    requires: [{ metric: 'topic_strong', topic: 'plants' }]
  },

  {
    id: 'farm-gate', locationId: 'farm', kind: 'repair', stage: 1, icon: '🛠️',
    title: 'Farm gate fixed', childLine: 'The farm gate has been fixed.',
    requires: [{ metric: 'practised', atLeast: 2 }]
  },
  {
    id: 'farm-hens', locationId: 'farm', kind: 'nature', stage: 2, icon: '🐔',
    title: 'Hens move into the yard', childLine: 'Hens are pecking around the farmyard.',
    requires: [{ metric: 'topic_growing', topic: 'animals' }]
  },
  {
    id: 'farm-crop-row', locationId: 'farm', kind: 'nature', stage: 3, icon: '🌾',
    title: 'Crop row grows', childLine: 'A bright crop row is growing by the barn.',
    requires: [{ metric: 'topic_strong', topic: 'plants' }]
  },

  {
    id: 'garden-birdhouse', locationId: 'home-garden', kind: 'repair', stage: 1, icon: '🏠',
    title: 'Birdhouse restored', childLine: 'The little garden birdhouse is ready again.',
    requires: [{ metric: 'mastered', atLeast: 1 }]
  },
  {
    id: 'garden-leaf-note', locationId: 'home-garden', kind: 'collectible', stage: 2, icon: '🍃',
    title: 'Leaf field-note collected', childLine: 'A leaf field-note has joined your backpack.',
    requires: [{ metric: 'practised', atLeast: 5 }]
  },
  {
    id: 'garden-sunflowers', locationId: 'home-garden', kind: 'nature', stage: 3, icon: '🌻',
    title: 'Sunflowers bloom', childLine: 'Sunflowers are blooming around home.',
    requires: [{ metric: 'topic_strong', topic: 'plants' }]
  },

  {
    id: 'river-stepping-stones', locationId: 'river-pond', kind: 'repair', stage: 1, icon: '🪨',
    title: 'Stepping stones restored', childLine: 'The stepping stones are back above the water.',
    requires: [{ metric: 'topic_started', topic: 'water' }]
  },
  {
    id: 'pond-frogs', locationId: 'river-pond', kind: 'nature', stage: 2, icon: '🐸',
    title: 'Frogs visit the pond', childLine: 'Frogs have appeared beside the pond.',
    requires: [
      { metric: 'topic_growing', topic: 'water' },
      { metric: 'topic_growing', topic: 'animals' }
    ]
  },
  {
    id: 'river-shell', locationId: 'river-pond', kind: 'collectible', stage: 3, icon: '🐚',
    title: 'River shell collected', childLine: 'A river shell has joined your backpack.',
    requires: [{ metric: 'mastered', atLeast: 5 }]
  },

  {
    id: 'school-crossing-light', locationId: 'road-school', kind: 'repair', stage: 1, icon: '🚦',
    title: 'Crossing light repaired', childLine: 'The school crossing light is working again.',
    requires: [{ metric: 'topic_started', topic: 'safety' }]
  },
  {
    id: 'school-bus-stop', locationId: 'road-school', kind: 'landmark', stage: 2, icon: '🚌',
    title: 'Bus stop appears', childLine: 'A bright bus stop now marks the school road.',
    requires: [{ metric: 'topic_growing', topic: 'transport' }]
  },
  {
    id: 'school-safety-badge', locationId: 'road-school', kind: 'collectible', stage: 3, icon: '🛡️',
    title: 'Safety badge collected', childLine: 'A safety badge has joined your backpack.',
    requires: [{ metric: 'topic_strong', topic: 'safety' }]
  },

  {
    id: 'lab-sample-shelf', locationId: 'scientu-lab', kind: 'discovery', stage: 1, icon: '🧪',
    title: 'Sample shelf discovered', childLine: 'Scientu has opened a new sample shelf.',
    requires: [{ metric: 'mastered', atLeast: 2 }]
  },
  {
    id: 'lab-air-vortex', locationId: 'scientu-lab', kind: 'discovery', stage: 2, icon: '💨',
    title: 'Air vortex discovered', childLine: 'A tiny air vortex is spinning in the lab.',
    requires: [{ metric: 'topic_growing', topic: 'air' }]
  },
  {
    id: 'lab-water-filter', locationId: 'scientu-lab', kind: 'discovery', stage: 3, icon: '💧',
    title: 'Water filter discovered', childLine: 'Scientu has built a clear-water filter.',
    requires: [{ metric: 'topic_strong', topic: 'water' }]
  },

  {
    id: 'hideout-puzzle-scrap', locationId: 'shaitanu-hideout', kind: 'collectible', stage: 1, icon: '🧩',
    title: 'Puzzle scrap collected', childLine: 'A Shaitanu puzzle scrap has joined your backpack.',
    requires: [{ metric: 'topic_started', topic: 'reasoning' }]
  },
  {
    id: 'hideout-puzzle-trophy', locationId: 'shaitanu-hideout', kind: 'trophy', stage: 2, icon: '🏆',
    title: 'Puzzle trophy earned', childLine: 'The hideout puzzle trophy is on display.',
    requires: [{ metric: 'topic_growing', topic: 'reasoning' }]
  },
  {
    id: 'hideout-code-wheel', locationId: 'shaitanu-hideout', kind: 'repair', stage: 3, icon: '⚙️',
    title: 'Code wheel unlocked', childLine: 'Shaitanu’s old code wheel is turning again.',
    requires: [{ metric: 'topic_strong', topic: 'reasoning' }]
  },

  {
    id: 'observatory-lens', locationId: 'observatory', kind: 'repair', stage: 1, icon: '🔭',
    title: 'Telescope lens restored', childLine: 'The observatory telescope is clear again.',
    requires: [{ metric: 'topic_started', topic: 'universe' }]
  },
  {
    id: 'observatory-star-chart', locationId: 'observatory', kind: 'collectible', stage: 2, icon: '🗺️',
    title: 'Star chart collected', childLine: 'A star chart has joined your backpack.',
    requires: [{ metric: 'topic_growing', topic: 'universe' }]
  },
  {
    id: 'observatory-constellation', locationId: 'observatory', kind: 'discovery', stage: 3, icon: '✨',
    title: 'Constellation discovered', childLine: 'A new constellation is glowing above the dome.',
    requires: [{ metric: 'topic_strong', topic: 'universe' }]
  },

  {
    id: 'town-lanterns', locationId: 'town-square', kind: 'landmark', stage: 1, icon: '🏮',
    title: 'Town lanterns light up', childLine: 'The town-square lanterns are shining again.',
    requires: [{ metric: 'attempts', atLeast: 8 }]
  },
  {
    id: 'town-mural', locationId: 'town-square', kind: 'landmark', stage: 2, icon: '🎨',
    title: 'Science mural appears', childLine: 'A science mural now brightens the town square.',
    requires: [{ metric: 'mastered', atLeast: 8 }]
  },
  {
    id: 'town-story-pennant', locationId: 'town-square', kind: 'collectible', stage: 3, icon: '🎏',
    title: 'Story pennant collected', childLine: 'A story pennant has joined your backpack.',
    requires: [{ metric: 'mastered', atLeast: 12 }]
  }
];

function topic(summary: ProgressSummary, topicId: TopicId): TopicProgressSummary | null {
  return summary.topics.find((item) => item.id === topicId) ?? null;
}

function isAtLeastGrowing(status: TopicProgressStatus): boolean {
  return status === 'growing' || status === 'strong';
}

function requirementMet(summary: ProgressSummary, requirement: Requirement): boolean {
  switch (requirement.metric) {
    case 'attempts':
      return summary.totalAttempts >= requirement.atLeast;
    case 'practised':
      return summary.practicedKnowledge >= requirement.atLeast;
    case 'mastered':
      return summary.masteredKnowledge >= requirement.atLeast;
    case 'topic_started':
      return (topic(summary, requirement.topic)?.practicedKnowledge ?? 0) > 0;
    case 'topic_growing':
      return isAtLeastGrowing(topic(summary, requirement.topic)?.status ?? 'not_started');
    case 'topic_strong':
      return topic(summary, requirement.topic)?.status === 'strong';
  }
}

function emptyLocationState(locationId: WorldLocationId): WorldLocationRewardState {
  return { locationId, stage: 0, changes: [] };
}

/**
 * Pure projection of canonical learning progress into persistent-looking world state.
 *
 * Deliberately accepts no story stars, currency, XP, streaks, random seed, or clock.
 * Re-reading the same saved learning progress therefore produces the same world,
 * including offline and after restart. Nothing is spent or consumed.
 */
export function deriveWorldRewardState(summary: ProgressSummary): WorldRewardState {
  const unlocked = WORLD_CHANGE_RULES
    .filter((rule) => rule.requires.every((requirement) => requirementMet(summary, requirement)))
    .map(({ requires: _requires, ...change }) => change);

  const locations = Object.fromEntries(
    WORLD_LOCATION_IDS.map((locationId) => [locationId, emptyLocationState(locationId)])
  ) as Record<WorldLocationId, WorldLocationRewardState>;

  for (const change of unlocked) {
    const locationState = locations[change.locationId];
    locationState.changes.push(change);
    locationState.stage = Math.max(locationState.stage, change.stage) as 0 | WorldChangeStage;
  }

  return {
    totalChanges: unlocked.length,
    locations,
    repairs: unlocked.filter((change) => change.kind === 'repair'),
    nature: unlocked.filter((change) => change.kind === 'nature'),
    discoveries: unlocked.filter((change) => change.kind === 'discovery'),
    collectibles: unlocked.filter((change) => change.kind === 'collectible'),
    trophies: unlocked.filter((change) => change.kind === 'trophy'),
    landmarks: unlocked.filter((change) => change.kind === 'landmark')
  };
}
