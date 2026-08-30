import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();

async function readJson(path) {
  return JSON.parse(await readFile(join(root, path), 'utf8'));
}

async function jsonFiles(directory) {
  return (await readdir(join(root, directory)))
    .filter((name) => name.endsWith('.json'))
    .map((name) => `${directory}/${name}`);
}

function walk(value, visitor) {
  if (Array.isArray(value)) {
    for (const item of value) walk(item, visitor);
    return;
  }
  if (!value || typeof value !== 'object') return;
  visitor(value);
  for (const child of Object.values(value)) walk(child, visitor);
}

function requireCondition(condition, message) {
  if (!condition) throw new Error(`Story validation failed: ${message}`);
}

function uniqueIds(items, label) {
  const ids = new Set();
  for (const item of items) {
    requireCondition(typeof item.id === 'string' && item.id.length > 0, `${label} has an item without id`);
    requireCondition(!ids.has(item.id), `${label} contains duplicate id ${item.id}`);
    ids.add(item.id);
  }
  return ids;
}

const charactersDoc = await readJson('content/story/characters.json');
const locationsDoc = await readJson('content/story/locations.json');
const missionsDoc = await readJson('content/story/missions.json');

requireCondition(charactersDoc.schemaVersion === 1, 'characters schemaVersion must be 1');
requireCondition(locationsDoc.schemaVersion === 1, 'locations schemaVersion must be 1');
requireCondition(missionsDoc.schemaVersion === 1, 'missions schemaVersion must be 1');
requireCondition(Array.isArray(charactersDoc.characters), 'characters must be an array');
requireCondition(Array.isArray(locationsDoc.locations), 'locations must be an array');
requireCondition(Array.isArray(missionsDoc.missions), 'missions must be an array');

const characterIds = uniqueIds(charactersDoc.characters, 'characters');
const locationIds = uniqueIds(locationsDoc.locations, 'locations');
const missionIds = uniqueIds(missionsDoc.missions, 'missions');
const missionById = new Map(missionsDoc.missions.map((mission) => [mission.id, mission]));

for (const id of ['dheu', 'scientu', 'shaitanu']) {
  requireCondition(characterIds.has(id), `required character ${id} is missing`);
}

for (const location of locationsDoc.locations) {
  requireCondition(Array.isArray(location.topicGroups) && location.topicGroups.length > 0, `location ${location.id} needs topicGroups`);
  requireCondition(location.position && Number.isFinite(location.position.x) && Number.isFinite(location.position.y), `location ${location.id} needs numeric position`);
  requireCondition(location.position.x >= 0 && location.position.x <= 100, `location ${location.id} x must be 0..100`);
  requireCondition(location.position.y >= 0 && location.position.y <= 100, `location ${location.id} y must be 0..100`);
  requireCondition(location.unlock && typeof location.unlock === 'object', `location ${location.id} needs a story unlock rule`);
  requireCondition(location.unlock.type === 'start' || location.unlock.type === 'mission', `location ${location.id} has invalid unlock type`);
  if (location.unlock.type === 'mission') {
    requireCondition(typeof location.unlock.missionRef === 'string' && location.unlock.missionRef.length > 0, `location ${location.id} needs unlock missionRef`);
    requireCondition(missionIds.has(location.unlock.missionRef), `location ${location.id} has unknown unlock mission ${location.unlock.missionRef}`);
    requireCondition(missionById.get(location.unlock.missionRef)?.access === 'free', `location ${location.id} cannot depend on a non-free mission`);
  }
}

const knowledgeRowIds = new Set();
for (const path of await jsonFiles('content/knowledge')) {
  walk(await readJson(path), (object) => {
    if (typeof object.rowId === 'string') knowledgeRowIds.add(object.rowId);
  });
}

const sceneIds = new Set();
for (const path of await jsonFiles('content/scenes')) {
  walk(await readJson(path), (object) => {
    if (typeof object.id === 'string' && object.id.startsWith('scene.')) sceneIds.add(object.id);
  });
}

const rewardIds = new Set();
const freeMissionLocations = new Set();
let freeMissionCount = 0;

for (const mission of missionsDoc.missions) {
  requireCondition(locationIds.has(mission.locationRef), `mission ${mission.id} has unknown location ${mission.locationRef}`);
  requireCondition(mission.access === 'free' || mission.access === 'goal', `mission ${mission.id} has invalid access`);
  if (mission.access === 'free') {
    freeMissionCount += 1;
    requireCondition(!freeMissionLocations.has(mission.locationRef), `free story map has multiple missions at location ${mission.locationRef}`);
    freeMissionLocations.add(mission.locationRef);
  }
  requireCondition(Number.isInteger(mission.questionCount) && mission.questionCount >= 4 && mission.questionCount <= 12, `mission ${mission.id} questionCount must be 4..12`);
  requireCondition(Array.isArray(mission.knowledgeRefs) && mission.knowledgeRefs.length >= 2, `mission ${mission.id} needs multiple knowledgeRefs`);
  requireCondition(new Set(mission.knowledgeRefs).size === mission.knowledgeRefs.length, `mission ${mission.id} has duplicate knowledgeRefs`);
  for (const rowId of mission.knowledgeRefs) {
    requireCondition(knowledgeRowIds.has(rowId), `mission ${mission.id} has unknown knowledgeRef ${rowId}`);
  }
  if (mission.openingSceneRef) requireCondition(sceneIds.has(mission.openingSceneRef), `mission ${mission.id} has unknown opening scene ${mission.openingSceneRef}`);
  if (mission.successSceneRef) requireCondition(sceneIds.has(mission.successSceneRef), `mission ${mission.id} has unknown success scene ${mission.successSceneRef}`);
  requireCondition(Array.isArray(mission.beats) && mission.beats.length > 0, `mission ${mission.id} needs opening beats`);
  const speakers = new Set();
  for (const beat of mission.beats) {
    requireCondition(characterIds.has(beat.speakerRef), `mission ${mission.id} has unknown speaker ${beat.speakerRef}`);
    requireCondition(typeof beat.text === 'string' && beat.text.trim().length > 0, `mission ${mission.id} has an empty beat`);
    speakers.add(beat.speakerRef);
  }
  for (const requiredSpeaker of ['dheu', 'scientu', 'shaitanu']) {
    requireCondition(speakers.has(requiredSpeaker), `mission ${mission.id} opening must include ${requiredSpeaker}`);
  }
  requireCondition(characterIds.has(mission.successBeat?.speakerRef), `mission ${mission.id} has invalid success speaker`);
  requireCondition(typeof mission.reward?.id === 'string' && mission.reward.id.length > 0 && typeof mission.reward?.label === 'string' && mission.reward.label.length > 0, `mission ${mission.id} needs a reward`);
  requireCondition(!rewardIds.has(mission.reward.id), `missions contain duplicate reward id ${mission.reward.id}`);
  rewardIds.add(mission.reward.id);
  requireCondition(Number.isInteger(mission.reward?.stars) && mission.reward.stars >= 0, `mission ${mission.id} reward stars must be a non-negative integer`);
}

requireCondition(freeMissionCount > 0, 'story world needs at least one directly playable free mission');

// Prove the story-only unlock graph is reachable without consulting curriculum/mastery state.
const reachableLocations = new Set(
  locationsDoc.locations.filter((location) => location.unlock.type === 'start').map((location) => location.id)
);
const completableMissions = new Set();
let changed = true;
while (changed) {
  changed = false;
  for (const mission of missionsDoc.missions) {
    if (mission.access !== 'free' || completableMissions.has(mission.id)) continue;
    if (reachableLocations.has(mission.locationRef)) {
      completableMissions.add(mission.id);
      changed = true;
    }
  }
  for (const location of locationsDoc.locations) {
    if (reachableLocations.has(location.id) || location.unlock.type !== 'mission') continue;
    if (completableMissions.has(location.unlock.missionRef)) {
      reachableLocations.add(location.id);
      changed = true;
    }
  }
}

for (const location of locationsDoc.locations) {
  requireCondition(reachableLocations.has(location.id), `location ${location.id} is unreachable in the story unlock graph`);
}
for (const mission of missionsDoc.missions.filter((mission) => mission.access === 'free')) {
  requireCondition(completableMissions.has(mission.id), `free mission ${mission.id} is unreachable in the story unlock graph`);
}

console.log(`Story validation passed: ${charactersDoc.characters.length} characters / ${locationsDoc.locations.length} locations / ${missionsDoc.missions.length} missions (${freeMissionCount} free map missions; story unlock graph reachable)`);
