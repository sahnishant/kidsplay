import charactersJson from '../../content/story/characters.json';
import locationsJson from '../../content/story/locations.json';
import missionsJson from '../../content/story/missions.json';
import { getFreeAnimalsQuestions, type SessionLaunch } from '../content';
import type { Question } from '../contracts/question';
import type { MasteryCounter } from '../runtime/localProgress';
import type {
  StoryCharacter,
  StoryCharacterDocument,
  StoryLocation,
  StoryLocationDocument,
  StoryMission,
  StoryMissionDocument
} from './storyTypes';

const characters = (charactersJson as StoryCharacterDocument).characters;
const locations = (locationsJson as StoryLocationDocument).locations;
const missions = (missionsJson as StoryMissionDocument).missions;

export interface StoryMissionLaunch {
  mission: StoryMission;
  session: SessionLaunch;
}

function questionFamily(question: Question): string {
  return question.authoring.source.startsWith('knowledge:')
    ? question.authoring.source
    : question.id.split('.').slice(0, 3).join('.');
}

function desiredRefsCovered(question: Question, desired: Set<string>): string[] {
  return (question.knowledgeRefs ?? []).filter((rowId) => desired.has(rowId));
}

function cloneMission(mission: StoryMission): StoryMission {
  return {
    ...mission,
    knowledgeRefs: [...mission.knowledgeRefs],
    beats: mission.beats.map((beat) => ({ ...beat })),
    successBeat: { ...mission.successBeat },
    reward: { ...mission.reward }
  };
}

function rowMasteryScore(rowId: string, mastery: Record<string, MasteryCounter>): number {
  const counter = mastery[rowId];
  if (!counter || counter.totalWeight <= 0) return -0.5;
  return counter.correctWeight / counter.totalWeight;
}

function missionQuestionMasteryScore(
  refs: string[],
  mastery: Record<string, MasteryCounter>
): number {
  if (!refs.length) return 0;
  return Math.min(...refs.map((rowId) => rowMasteryScore(rowId, mastery)));
}

function chooseMissionQuestions(
  mission: StoryMission,
  mastery: Record<string, MasteryCounter> = {}
): Question[] {
  const desired = new Set(mission.knowledgeRefs);
  const candidates = getFreeAnimalsQuestions()
    .filter((question) => desiredRefsCovered(question, desired).length > 0);

  const selected: Question[] = [];
  const selectedIds = new Set<string>();
  const covered = new Set<string>();
  const usedEngines = new Set<Question['interaction']['type']>();
  const usedFamilies = new Set<string>();

  while (selected.length < mission.questionCount) {
    const next = candidates
      .filter((question) => !selectedIds.has(question.id))
      .map((question) => {
        const refs = desiredRefsCovered(question, desired);
        const uncoveredRefs = refs.filter((rowId) => !covered.has(rowId));
        return {
          question,
          refs,
          coverageGain: uncoveredRefs.length,
          masteryScore: missionQuestionMasteryScore(uncoveredRefs.length ? uncoveredRefs : refs, mastery),
          engineNovelty: usedEngines.has(question.interaction.type) ? 0 : 1,
          familyNovelty: usedFamilies.has(questionFamily(question)) ? 0 : 1
        };
      })
      .sort((left, right) =>
        right.coverageGain - left.coverageGain
        || left.masteryScore - right.masteryScore
        || right.familyNovelty - left.familyNovelty
        || right.engineNovelty - left.engineNovelty
        || right.refs.length - left.refs.length
        || left.question.difficulty - right.question.difficulty
        || left.question.id.localeCompare(right.question.id)
      )[0];

    if (!next) break;
    selected.push(next.question);
    selectedIds.add(next.question.id);
    usedEngines.add(next.question.interaction.type);
    usedFamilies.add(questionFamily(next.question));
    for (const rowId of next.refs) covered.add(rowId);
  }

  const missingRefs = mission.knowledgeRefs.filter((rowId) => !covered.has(rowId));
  if (selected.length !== mission.questionCount || missingRefs.length > 0) {
    throw new Error(
      `Story mission ${mission.id} cannot be built from the current free question bank: `
      + `selected=${selected.length}/${mission.questionCount}, missing=${missingRefs.join(',') || 'none'}`
    );
  }

  return selected;
}

export function getStoryCharacters(): StoryCharacter[] {
  return characters.map((character) => ({ ...character, personalization: { ...character.personalization } }));
}

export function getStoryLocations(): StoryLocation[] {
  return locations.map((location) => ({
    ...location,
    topicGroups: [...location.topicGroups],
    position: { ...location.position }
  }));
}

/** All authored missions, including future paid/goal-specific story content. */
export function getAllStoryMissions(): StoryMission[] {
  return missions.map(cloneMission);
}

/** Missions that the free Dheu world map may launch directly. */
export function getStoryMissions(): StoryMission[] {
  return getAllStoryMissions().filter((mission) => mission.access === 'free');
}

export function getStoryMission(missionId: string): StoryMission {
  const mission = missions.find((item) => item.id === missionId);
  if (!mission) throw new Error(`Unknown story mission ${missionId}`);
  return cloneMission(mission);
}

export function getHeroDisplayName(savedChildName: string): string {
  const normalized = savedChildName.trim();
  return normalized || characters.find((character) => character.id === 'dheu')?.personalization.fallbackName || 'Dheu';
}

export function createStoryMissionLaunch(
  missionId: string,
  mastery: Record<string, MasteryCounter> = {}
): StoryMissionLaunch {
  const mission = getStoryMission(missionId);
  if (mission.access !== 'free') {
    throw new Error(`Story mission ${mission.id} is not available through the free story-world director`);
  }

  return {
    mission,
    session: {
      id: `session.${mission.id}`,
      mode: 'free_explore',
      title: mission.title,
      questions: chooseMissionQuestions(mission, mastery)
    }
  };
}
