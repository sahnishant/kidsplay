import { getFreeAnimalsQuestions, type SessionLaunch } from '../content';
import type { Question } from '../contracts/question';
import type { MasteryCounter } from '../runtime/localProgress';
import { getStoryLocations } from './storyDirector';
import type { StoryLocation } from './storyTypes';

const DEFAULT_LOCATION_QUESTION_COUNT = 6;

export interface StoryLocationLaunch {
  location: StoryLocation;
  session: SessionLaunch;
}

function rowKnowledgeGroup(rowId: string): string {
  const parts = rowId.split('.');
  if (parts[1] === 'choice' && parts[2]) return parts[2];
  return parts[1] || 'general';
}

function questionFamily(question: Question): string {
  if (question.authoring.source.startsWith('knowledge:')) return question.authoring.source;
  const refs = question.knowledgeRefs ?? [];
  if (refs.length) return [...new Set(refs.map(rowKnowledgeGroup))].sort().join('+');
  return question.id.split('.').slice(0, 3).join('.');
}

function masteryScore(question: Question, mastery: Record<string, MasteryCounter>): number {
  const refs = question.knowledgeRefs ?? [];
  if (!refs.length) return 0;
  return Math.min(...refs.map((rowId) => {
    const counter = mastery[rowId];
    if (!counter || counter.totalWeight <= 0) return -0.5;
    return counter.correctWeight / counter.totalWeight;
  }));
}

function belongsToLocation(question: Question, topicGroups: Set<string>): boolean {
  const refs = question.knowledgeRefs ?? [];
  return refs.length > 0 && refs.every((rowId) => topicGroups.has(rowKnowledgeGroup(rowId)));
}

function chooseDiverseQuestions(candidates: Question[], count: number): Question[] {
  const selected: Question[] = [];
  const selectedIds = new Set<string>();
  const usedEngines = new Set<Question['interaction']['type']>();
  const usedFamilies = new Set<string>();

  const add = (question: Question): void => {
    selected.push(question);
    selectedIds.add(question.id);
    usedEngines.add(question.interaction.type);
    usedFamilies.add(questionFamily(question));
  };

  for (const question of candidates) {
    if (selected.length >= count) break;
    if (usedEngines.has(question.interaction.type) || usedFamilies.has(questionFamily(question))) continue;
    add(question);
  }

  for (const question of candidates) {
    if (selected.length >= count) break;
    if (selectedIds.has(question.id) || usedFamilies.has(questionFamily(question))) continue;
    add(question);
  }

  for (const question of candidates) {
    if (selected.length >= count) break;
    if (selectedIds.has(question.id)) continue;
    add(question);
  }

  return selected;
}

export function createStoryLocationLaunch(
  locationId: string,
  mastery: Record<string, MasteryCounter> = {},
  questionCount: number = DEFAULT_LOCATION_QUESTION_COUNT
): StoryLocationLaunch {
  const location = getStoryLocations().find((item) => item.id === locationId);
  if (!location) throw new Error(`Unknown story location ${locationId}`);

  const count = Math.max(1, Math.floor(questionCount));
  const topicGroups = new Set(location.topicGroups);
  const candidates = getFreeAnimalsQuestions()
    .filter((question) => belongsToLocation(question, topicGroups))
    .sort((left, right) => {
      const masteryDelta = masteryScore(left, mastery) - masteryScore(right, mastery);
      if (masteryDelta !== 0) return masteryDelta;
      if (left.difficulty !== right.difficulty) return left.difficulty - right.difficulty;
      return left.id.localeCompare(right.id);
    });
  const questions = chooseDiverseQuestions(candidates, count);

  if (questions.length !== count) {
    throw new Error(
      `Story location ${location.id} cannot build a ${count}-question expedition from the current free bank: available=${questions.length}`
    );
  }

  return {
    location,
    session: {
      id: `session.story-location.${location.id}`,
      mode: 'free_explore',
      title: location.expeditionTitle,
      questions
    }
  };
}