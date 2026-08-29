import freeAnimalsPack from '../content/packs/free-animals.json';
import olympiadPrototypePack from '../content/packs/class2-evs-olympiad-prototype.json';
import profileRegistry from '../content/learning-profiles/registry.json';
import type { Question } from './contracts/question';
import type { MasteryCounter } from './runtime/localProgress';

interface AccessPolicy {
  type: 'free' | 'purchase';
  productId?: string;
}

interface LearningPack {
  id: string;
  kind: 'learning_pack';
  title: string;
  access: AccessPolicy;
  questionRefs: string[];
}

interface GoalPath {
  id: string;
  kind: 'goal_path';
  status: 'prototype' | 'reviewed';
  title: string;
  access: AccessPolicy;
  questionRefs: string[];
  profileRef?: string;
  masteryPolicy?: {
    requiredAccuracy: number;
    minimumIndependentAttempts: number;
  };
}

export interface LearningProfile {
  id: string;
  country: string;
  pathway: 'school' | 'competition';
  curriculumRef: string | null;
  assessmentRef: string | null;
  grade: number;
  alignmentStatus: string;
}

interface ProfileRegistry {
  schemaVersion: number;
  profiles: LearningProfile[];
}

interface ProfileMembershipMember {
  rowId: string;
  fit: 'review' | 'core' | 'stretch' | 'challenge';
}

interface ProfileMembership {
  profileRef: string;
  members: ProfileMembershipMember[];
}

export interface CatalogEntry {
  id: string;
  kind: 'free_explore' | 'goal_learning';
  title: string;
  description: string;
  access: AccessPolicy;
  status: 'ready' | 'prototype';
  profileRef?: string;
  actionLabel: string;
}

export interface SessionLaunch {
  id: string;
  mode: 'free_explore' | 'goal_learning';
  title: string;
  profileRef?: string;
  questions: Question[];
}

export interface ProfileSessionOptions {
  count?: number;
  mastery?: Record<string, MasteryCounter>;
}

const questionModules = import.meta.glob('../content/questions/*.json', {
  eager: true,
  import: 'default'
}) as Record<string, unknown>;

const membershipModules = import.meta.glob('../content/profile-memberships/*.json', {
  eager: true,
  import: 'default'
}) as Record<string, unknown>;

const questionBank = Object.values(questionModules).flatMap((value) =>
  Array.isArray(value) ? (value as Question[]) : []
);
const questionById = new Map(questionBank.map((question) => [question.id, question]));
const memberships = Object.values(membershipModules).filter(
  (value): value is ProfileMembership => Boolean(
    value
      && typeof value === 'object'
      && typeof (value as ProfileMembership).profileRef === 'string'
      && Array.isArray((value as ProfileMembership).members)
  )
);

const profiles = (profileRegistry as ProfileRegistry).profiles;
const freePack = freeAnimalsPack as LearningPack;
const goalPack = olympiadPrototypePack as GoalPath;

const fitRank: Record<ProfileMembershipMember['fit'], number> = {
  core: 0,
  review: 1,
  stretch: 2,
  challenge: 3
};

function resolveQuestionRefs(questionRefs: string[], packId: string): Question[] {
  return questionRefs.map((questionId) => {
    const question = questionById.get(questionId);
    if (!question) throw new Error(`Pack ${packId} refers to unknown question ${questionId}`);
    return question;
  });
}

function masteryScore(question: Question, mastery: Record<string, MasteryCounter>): number {
  const refs = question.knowledgeRefs ?? [];
  if (!refs.length) return 0;
  const scores = refs.map((rowId) => {
    const counter = mastery[rowId];
    if (!counter || counter.totalWeight <= 0) return -0.5;
    return counter.correctWeight / counter.totalWeight;
  });
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

function knowledgeGroup(question: Question): string {
  const groups = new Set(
    (question.knowledgeRefs ?? [])
      .map((rowId) => rowId.split('.')[1])
      .filter(Boolean)
  );
  if (!groups.size) return 'general';
  return groups.size === 1 ? [...groups][0] : 'mixed';
}

function interleaveByKnowledgeGroup(candidates: Question[]): Question[] {
  const buckets = new Map<string, Question[]>();
  for (const question of candidates) {
    const group = knowledgeGroup(question);
    buckets.set(group, [...(buckets.get(group) ?? []), question]);
  }

  const result: Question[] = [];
  let remaining = true;
  while (remaining) {
    remaining = false;
    for (const bucket of buckets.values()) {
      const next = bucket.shift();
      if (!next) continue;
      result.push(next);
      remaining = true;
    }
  }
  return result;
}

function chooseWithEngineVariety(candidates: Question[], count: number): Question[] {
  const selected: Question[] = [];
  const selectedIds = new Set<string>();
  const usedEngines = new Set<Question['interaction']['type']>();

  for (const question of candidates) {
    if (selected.length >= count) break;
    if (usedEngines.has(question.interaction.type)) continue;
    selected.push(question);
    selectedIds.add(question.id);
    usedEngines.add(question.interaction.type);
  }

  for (const question of candidates) {
    if (selected.length >= count) break;
    if (selectedIds.has(question.id)) continue;
    selected.push(question);
    selectedIds.add(question.id);
  }

  return selected;
}

export function getLearningProfiles(): LearningProfile[] {
  return [...profiles];
}

export function getCatalogEntries(): CatalogEntry[] {
  return [
    {
      id: freePack.id,
      kind: 'free_explore',
      title: freePack.title,
      description: 'Short mixed Animals and Plants sessions that keep moving toward unseen and weaker knowledge.',
      access: freePack.access,
      status: 'ready',
      actionLabel: 'Play free'
    },
    {
      id: goalPack.id,
      kind: 'goal_learning',
      title: goalPack.title,
      description: 'SOF Class 2 profile-driven practice with progress tracking. Prototype access is open while purchase flow is not connected.',
      access: goalPack.access,
      status: goalPack.status === 'reviewed' ? 'ready' : 'prototype',
      profileRef: goalPack.profileRef,
      actionLabel: goalPack.status === 'prototype' ? 'Try prototype' : 'Start goal'
    }
  ];
}

export function getFreeAnimalsQuestions(): Question[] {
  return resolveQuestionRefs(freePack.questionRefs, freePack.id);
}

export function getFreeExploreQuestions(options: ProfileSessionOptions = {}): Question[] {
  const mastery = options.mastery ?? {};
  const count = Math.max(1, options.count ?? 8);
  const candidates = getFreeAnimalsQuestions().sort((left, right) => {
    const masteryDelta = masteryScore(left, mastery) - masteryScore(right, mastery);
    if (masteryDelta !== 0) return masteryDelta;
    if (left.difficulty !== right.difficulty) return left.difficulty - right.difficulty;
    return left.id.localeCompare(right.id);
  });
  return chooseWithEngineVariety(interleaveByKnowledgeGroup(candidates), count);
}

export function getFreeAnimalsPackTitle(): string {
  return freePack.title;
}

export function getProfileQuestions(profileRef: string, options: ProfileSessionOptions = {}): Question[] {
  const membership = memberships.find((item) => item.profileRef === profileRef);
  if (!membership) throw new Error(`Unknown profile membership ${profileRef}`);

  const memberByRow = new Map(membership.members.map((member) => [member.rowId, member]));
  const mastery = options.mastery ?? {};
  const count = Math.max(1, options.count ?? 8);

  const candidates = questionBank
    .filter((question) => {
      const refs = question.knowledgeRefs ?? [];
      return refs.length > 0 && refs.every((rowId) => memberByRow.has(rowId));
    })
    .sort((left, right) => {
      const leftRefs = left.knowledgeRefs ?? [];
      const rightRefs = right.knowledgeRefs ?? [];
      const leftFit = Math.min(...leftRefs.map((rowId) => fitRank[memberByRow.get(rowId)?.fit ?? 'challenge']));
      const rightFit = Math.min(...rightRefs.map((rowId) => fitRank[memberByRow.get(rowId)?.fit ?? 'challenge']));
      if (leftFit !== rightFit) return leftFit - rightFit;

      const masteryDelta = masteryScore(left, mastery) - masteryScore(right, mastery);
      if (masteryDelta !== 0) return masteryDelta;
      if (left.difficulty !== right.difficulty) return left.difficulty - right.difficulty;
      return left.id.localeCompare(right.id);
    });

  return chooseWithEngineVariety(candidates, count);
}

export function createSessionForCatalogEntry(
  entryId: string,
  mastery: Record<string, MasteryCounter> = {}
): SessionLaunch {
  if (entryId === freePack.id) {
    return {
      id: `session.${freePack.id}`,
      mode: 'free_explore',
      title: freePack.title,
      questions: getFreeExploreQuestions({ count: 8, mastery })
    };
  }

  if (entryId === goalPack.id) {
    const profileQuestions = goalPack.profileRef
      ? getProfileQuestions(goalPack.profileRef, { count: 8, mastery })
      : [];
    const questions = profileQuestions.length
      ? profileQuestions
      : resolveQuestionRefs(goalPack.questionRefs, goalPack.id);

    return {
      id: `session.${goalPack.id}`,
      mode: 'goal_learning',
      title: goalPack.title,
      profileRef: goalPack.profileRef,
      questions
    };
  }

  throw new Error(`Unknown catalog entry ${entryId}`);
}
