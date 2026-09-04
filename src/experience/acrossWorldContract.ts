export type GeographicNodeType =
  | 'world'
  | 'region'
  | 'country'
  | 'state_province'
  | 'city'
  | 'destination';

export type AcrossWorldDestinationArchetype =
  | 'landmark'
  | 'city'
  | 'natural_place'
  | 'community_place'
  | 'wildlife'
  | 'how_it_works';

export type AcrossWorldTravelMode =
  | 'walk'
  | 'bicycle'
  | 'car_taxi'
  | 'bus'
  | 'train'
  | 'boat_ferry'
  | 'plane'
  | 'helicopter';

export type AcrossWorldRouteAction =
  | 'board'
  | 'pack_place'
  | 'route_follow'
  | 'sort'
  | 'connect'
  | 'stop_go'
  | 'observe';

export type AcrossWorldDepthBand = 'd0_first_play' | 'd1_preschool' | 'd2_early_primary' | 'd3_deeper_primary';

export interface GeographicNode {
  nodeId: string;
  type: GeographicNodeType;
  parentNodeId?: string;
  childName: string;
}

export interface AcrossWorldRoute {
  routeId: string;
  fromNodeId: string;
  toNodeId: string;
  admissibleTravelModes: readonly AcrossWorldTravelMode[];
  /** One explicit reviewed/planning rationale ref per admitted travel mode. */
  travelModeRationaleRefs: Readonly<Partial<Record<AcrossWorldTravelMode, string>>>;
  actionFamilies: readonly AcrossWorldRouteAction[];
  firstPlayCompatible: boolean;
}

export interface AcrossWorldDestination {
  destinationId: string;
  geoNodeId: string;
  childName: string;
  archetype: AcrossWorldDestinationArchetype;
  canonicalKnowledgeRefs: readonly string[];
  routeRefs: readonly string[];
  depthBands: readonly AcrossWorldDepthBand[];
  recipeFamilies: readonly string[];
  discoveryProjectionRef?: string;
  learnAboutTopicRefs?: readonly string[];
}

export interface AcrossWorldCampaign {
  schemaVersion: 1;
  campaignId: string;
  /** Existing Story World locations remain the familiar/local foundation. */
  localWorldLocationRefs: readonly string[];
  geographicNodes: readonly GeographicNode[];
  routes: readonly AcrossWorldRoute[];
  destinations: readonly AcrossWorldDestination[];
}

const VALID_NODE_TYPES = new Set<GeographicNodeType>([
  'world',
  'region',
  'country',
  'state_province',
  'city',
  'destination'
]);
const VALID_ARCHETYPES = new Set<AcrossWorldDestinationArchetype>([
  'landmark',
  'city',
  'natural_place',
  'community_place',
  'wildlife',
  'how_it_works'
]);
const VALID_TRAVEL_MODES = new Set<AcrossWorldTravelMode>([
  'walk',
  'bicycle',
  'car_taxi',
  'bus',
  'train',
  'boat_ferry',
  'plane',
  'helicopter'
]);
const VALID_ROUTE_ACTIONS = new Set<AcrossWorldRouteAction>([
  'board',
  'pack_place',
  'route_follow',
  'sort',
  'connect',
  'stop_go',
  'observe'
]);
const FIRST_PLAY_ROUTE_ACTIONS = new Set<AcrossWorldRouteAction>([
  'board',
  'pack_place',
  'route_follow',
  'observe'
]);
const VALID_DEPTHS = new Set<AcrossWorldDepthBand>([
  'd0_first_play',
  'd1_preschool',
  'd2_early_primary',
  'd3_deeper_primary'
]);
const FORBIDDEN_KEYS = new Set([
  'fact',
  'facts',
  'answer',
  'answers',
  'solution',
  'correctOption',
  'correctOptionId',
  'evaluator',
  'evaluatorId',
  'coins',
  'xp',
  'currency'
]);
const STABLE_REF = /^[a-z0-9]+(?:[._:#-][a-z0-9]+)*$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function assertStableRef(value: unknown, context: string): string {
  if (typeof value !== 'string' || !value.trim() || !STABLE_REF.test(value)) {
    throw new Error(`${context} must be a stable ref`);
  }
  return value;
}

function assertChildName(value: unknown, context: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${context} must be non-empty child-facing text`);
  return value.trim();
}

function uniqueRefs(value: unknown, context: string, allowEmpty = false): string[] {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0)) throw new Error(`${context} must be ${allowEmpty ? 'an' : 'a non-empty'} array`);
  const refs = value.map((item, index) => assertStableRef(item, `${context}[${index}]`));
  if (new Set(refs).size !== refs.length) throw new Error(`${context} contains duplicates`);
  return refs;
}

function rejectOwnedTruth(value: unknown, path = 'campaign'): void {
  if (Array.isArray(value)) {
    value.forEach((child, index) => rejectOwnedTruth(child, `${path}[${index}]`));
    return;
  }
  if (!isRecord(value)) return;
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_KEYS.has(key)) {
      throw new Error(`${path}.${key} is forbidden: Across the World references canonical truth/evaluation but may not own it`);
    }
    rejectOwnedTruth(child, `${path}.${key}`);
  }
}

function validateNode(value: unknown, index: number): GeographicNode {
  if (!isRecord(value)) throw new Error(`geographicNodes[${index}] must be an object`);
  const nodeId = assertStableRef(value.nodeId, `geographicNodes[${index}].nodeId`);
  if (typeof value.type !== 'string' || !VALID_NODE_TYPES.has(value.type as GeographicNodeType)) {
    throw new Error(`${nodeId}: invalid node type`);
  }
  const parentNodeId = value.parentNodeId === undefined ? undefined : assertStableRef(value.parentNodeId, `${nodeId}.parentNodeId`);
  if (value.type === 'world' && parentNodeId) throw new Error(`${nodeId}: world node may not have a parent`);
  if (value.type !== 'world' && !parentNodeId) throw new Error(`${nodeId}: non-world node requires a parent`);
  return {
    nodeId,
    type: value.type as GeographicNodeType,
    ...(parentNodeId ? { parentNodeId } : {}),
    childName: assertChildName(value.childName, `${nodeId}.childName`)
  };
}

function validateRoute(value: unknown, index: number): AcrossWorldRoute {
  if (!isRecord(value)) throw new Error(`routes[${index}] must be an object`);
  const routeId = assertStableRef(value.routeId, `routes[${index}].routeId`);
  const fromNodeId = assertStableRef(value.fromNodeId, `${routeId}.fromNodeId`);
  const toNodeId = assertStableRef(value.toNodeId, `${routeId}.toNodeId`);
  if (fromNodeId === toNodeId) throw new Error(`${routeId}: route endpoints must differ`);

  if (!Array.isArray(value.admissibleTravelModes) || value.admissibleTravelModes.length === 0) {
    throw new Error(`${routeId}: admissibleTravelModes is required`);
  }
  const admissibleTravelModes = value.admissibleTravelModes.map((mode) => {
    if (typeof mode !== 'string' || !VALID_TRAVEL_MODES.has(mode as AcrossWorldTravelMode)) {
      throw new Error(`${routeId}: invalid travel mode ${String(mode)}`);
    }
    return mode as AcrossWorldTravelMode;
  });
  if (new Set(admissibleTravelModes).size !== admissibleTravelModes.length) throw new Error(`${routeId}: duplicate travel modes`);

  if (!isRecord(value.travelModeRationaleRefs)) throw new Error(`${routeId}: travelModeRationaleRefs is required`);
  const travelModeRationaleRefs: Partial<Record<AcrossWorldTravelMode, string>> = {};
  for (const mode of admissibleTravelModes) {
    travelModeRationaleRefs[mode] = assertStableRef(value.travelModeRationaleRefs[mode], `${routeId}.travelModeRationaleRefs.${mode}`);
  }
  for (const key of Object.keys(value.travelModeRationaleRefs)) {
    if (!VALID_TRAVEL_MODES.has(key as AcrossWorldTravelMode) || !admissibleTravelModes.includes(key as AcrossWorldTravelMode)) {
      throw new Error(`${routeId}: rationale supplied for non-admitted travel mode ${key}`);
    }
  }

  if (!Array.isArray(value.actionFamilies) || value.actionFamilies.length === 0) throw new Error(`${routeId}: actionFamilies is required`);
  const actionFamilies = value.actionFamilies.map((action) => {
    if (typeof action !== 'string' || !VALID_ROUTE_ACTIONS.has(action as AcrossWorldRouteAction)) {
      throw new Error(`${routeId}: invalid route action ${String(action)}`);
    }
    return action as AcrossWorldRouteAction;
  });
  if (new Set(actionFamilies).size !== actionFamilies.length) throw new Error(`${routeId}: duplicate route actions`);
  if (typeof value.firstPlayCompatible !== 'boolean') throw new Error(`${routeId}: firstPlayCompatible must be boolean`);
  if (value.firstPlayCompatible && actionFamilies.some((action) => !FIRST_PLAY_ROUTE_ACTIONS.has(action))) {
    throw new Error(`${routeId}: First Play route contains a higher-demand action`);
  }

  return {
    routeId,
    fromNodeId,
    toNodeId,
    admissibleTravelModes,
    travelModeRationaleRefs,
    actionFamilies,
    firstPlayCompatible: value.firstPlayCompatible
  };
}

function validateDestination(value: unknown, index: number): AcrossWorldDestination {
  if (!isRecord(value)) throw new Error(`destinations[${index}] must be an object`);
  const destinationId = assertStableRef(value.destinationId, `destinations[${index}].destinationId`);
  const geoNodeId = assertStableRef(value.geoNodeId, `${destinationId}.geoNodeId`);
  if (typeof value.archetype !== 'string' || !VALID_ARCHETYPES.has(value.archetype as AcrossWorldDestinationArchetype)) {
    throw new Error(`${destinationId}: invalid destination archetype`);
  }
  const canonicalKnowledgeRefs = uniqueRefs(value.canonicalKnowledgeRefs, `${destinationId}.canonicalKnowledgeRefs`);
  const routeRefs = uniqueRefs(value.routeRefs, `${destinationId}.routeRefs`);
  if (!Array.isArray(value.depthBands) || value.depthBands.length === 0) throw new Error(`${destinationId}.depthBands is required`);
  const depthBands = value.depthBands.map((band) => {
    if (typeof band !== 'string' || !VALID_DEPTHS.has(band as AcrossWorldDepthBand)) throw new Error(`${destinationId}: invalid depth band`);
    return band as AcrossWorldDepthBand;
  });
  if (new Set(depthBands).size !== depthBands.length) throw new Error(`${destinationId}: duplicate depth bands`);
  const recipeFamilies = uniqueRefs(value.recipeFamilies, `${destinationId}.recipeFamilies`);
  const discoveryProjectionRef = value.discoveryProjectionRef === undefined
    ? undefined
    : assertStableRef(value.discoveryProjectionRef, `${destinationId}.discoveryProjectionRef`);
  const learnAboutTopicRefs = value.learnAboutTopicRefs === undefined
    ? undefined
    : uniqueRefs(value.learnAboutTopicRefs, `${destinationId}.learnAboutTopicRefs`);

  return {
    destinationId,
    geoNodeId,
    childName: assertChildName(value.childName, `${destinationId}.childName`),
    archetype: value.archetype as AcrossWorldDestinationArchetype,
    canonicalKnowledgeRefs,
    routeRefs,
    depthBands,
    recipeFamilies,
    ...(discoveryProjectionRef ? { discoveryProjectionRef } : {}),
    ...(learnAboutTopicRefs ? { learnAboutTopicRefs } : {})
  };
}

export function validateAcrossWorldCampaign(value: unknown): AcrossWorldCampaign {
  rejectOwnedTruth(value);
  if (!isRecord(value) || value.schemaVersion !== 1) throw new Error('Across the World campaign must use schemaVersion 1');
  const campaignId = assertStableRef(value.campaignId, 'campaignId');
  const localWorldLocationRefs = uniqueRefs(value.localWorldLocationRefs, `${campaignId}.localWorldLocationRefs`);
  if (!Array.isArray(value.geographicNodes) || value.geographicNodes.length === 0) throw new Error(`${campaignId}: geographicNodes[] is required`);
  const geographicNodes = value.geographicNodes.map(validateNode);
  const nodeIds = geographicNodes.map((node) => node.nodeId);
  if (new Set(nodeIds).size !== nodeIds.length) throw new Error(`${campaignId}: duplicate geographic node ids`);
  const nodeById = new Map(geographicNodes.map((node) => [node.nodeId, node]));
  const worldNodes = geographicNodes.filter((node) => node.type === 'world');
  if (worldNodes.length !== 1) throw new Error(`${campaignId}: exactly one world root is required`);
  for (const node of geographicNodes) {
    if (node.parentNodeId && !nodeById.has(node.parentNodeId)) throw new Error(`${node.nodeId}: unknown parent ${node.parentNodeId}`);
  }

  if (!Array.isArray(value.routes)) throw new Error(`${campaignId}: routes[] is required`);
  const routes = value.routes.map(validateRoute);
  const routeIds = routes.map((route) => route.routeId);
  if (new Set(routeIds).size !== routeIds.length) throw new Error(`${campaignId}: duplicate route ids`);
  for (const route of routes) {
    if (!nodeById.has(route.fromNodeId) || !nodeById.has(route.toNodeId)) throw new Error(`${route.routeId}: route endpoint is unknown`);
  }

  if (!Array.isArray(value.destinations)) throw new Error(`${campaignId}: destinations[] is required`);
  const destinations = value.destinations.map(validateDestination);
  const destinationIds = destinations.map((destination) => destination.destinationId);
  if (new Set(destinationIds).size !== destinationIds.length) throw new Error(`${campaignId}: duplicate destination ids`);
  const routeIdSet = new Set(routeIds);
  for (const destination of destinations) {
    const node = nodeById.get(destination.geoNodeId);
    if (!node || node.type !== 'destination') throw new Error(`${destination.destinationId}: geoNodeId must reference a destination node`);
    for (const routeRef of destination.routeRefs) {
      if (!routeIdSet.has(routeRef)) throw new Error(`${destination.destinationId}: unknown route ref ${routeRef}`);
    }
  }

  return {
    schemaVersion: 1,
    campaignId,
    localWorldLocationRefs,
    geographicNodes,
    routes,
    destinations
  };
}
