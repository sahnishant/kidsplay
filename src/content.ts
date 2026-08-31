import patternBlueprintJson from '../content/assessment-blueprints/SOF_INDIA_CLASS2_2026-27.json';
import freeAnimalsPack from '../content/packs/free-animals.json';
import freeVocabularyPack from '../content/packs/free-vocabulary.json';
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

export interface SessionSection {
  id: 'logical_reasoning' | 'science' | 'achievers';
  title: string;
  startIndex: number;
  count: number;
  marksPerQuestion: number;
}

type AssessmentSelector = 'logical_reasoning' | 'science_core' | 'achiever_hots';

interface AssessmentBlueprintSection {
  id: SessionSection['id'];
  title: string;
  count: number;
  marksPerQuestion: number;
  selector: AssessmentSelector;
}

interface AssessmentBlueprint {
  schemaVersion: 1;
  id: string;
  profileRef: string;
  academicYear: string;
  status: 'prototype_from_reviewed_format';
  sourceRefs: string[];
  title: string;
  description: string;
  actionLabel: string;
  totalQuestions: number;
  totalMarks: number;
  sections: AssessmentBlueprintSection[];
}

export interface SessionLaunch {
  id: string;
  mode: 'free_explore' | 'goal_learning' | 'goal_mock' | 'goal_pattern_mock';
  title: string;
  profileRef?: string;
  questions: Question[];
  sections?: SessionSection[];
}

export interface ProfileSessionOptions {
  count?: number;
  mastery?: Record<string, MasteryCounter>;
}

export type GoalReadinessStatus = 'getting_started' | 'building' | 'mock_ready';

export interface GoalReadinessSummary {
  profileRef: string;
  practicedRows: number;
  readyRows: number;
  totalRows: number;
  practicedGroups: number;
  totalGroups: number;
  accuracy: number | null;
  score: number;
  status: GoalReadinessStatus;
}

const questionModules = import.meta.glob('../content/questions/*.json', {
  eager: true,
  import: 'default'
}) as Record<string, unknown>;

const membershipModules = import.meta.glob('../content/profile-memberships/*.json', {
  eager: true,
  import: 'default'
}) as Record<string, unknown>;

const resolvedMembershipModules = import.meta.glob('../content/index/__generated-profile-memberships.json', {
  eager: true,
  import: 'default'
}) as Record<string, unknown>;

const questionBank = Object.values(questionModules).flatMap((value) =>
  Array.isArray(value) ? (value as Question[]) : []
);
const questionById = new Map(questionBank.map((question) => [question.id, question]));
const authoredMemberships = Object.values(membershipModules).filter(
  (value): value is ProfileMembership => Boolean(
    value
      && typeof value === 'object'
      && typeof (value as ProfileMembership).profileRef === 'string'
      && Array.isArray((value as ProfileMembership).members)
  )
);
const resolvedMemberships = Object.values(resolvedMembershipModules).flatMap((value) =>
  Array.isArray(value) ? (value as ProfileMembership[]) : []
);
const memberships = resolvedMemberships.length > 0 ? resolvedMemberships : authoredMemberships;

const profiles = (profileRegistry as ProfileRegistry).profiles;
const freePack = freeAnimalsPack as LearningPack;
const vocabularyPack = freeVocabularyPack as LearningPack;
const goalPack = olympiadPrototypePack as GoalPath;
const patternBlueprint = patternBlueprintJson as AssessmentBlueprint;
const goalMockEntryId = `${goalPack.id}.mixed-mock`;
const goalPatternMockEntryId = `${goalPack.id}.pattern-mock-${patternBlueprint.academicYear}`;
const patternSessionSections: SessionSection[] = patternBlueprint.sections.reduce<SessionSection[]>((sections, section) => {
  const startIndex = sections.reduce((sum, item) => sum + item.count, 0);
  sections.push({
    id: section.id,
    title: section.title,
    startIndex,
    count: section.count,
    marksPerQuestion: section.marksPerQuestion
  });
  return sections;
}, []);

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
  return Math.min(...scores);
}

function rowKnowledgeGroup(rowId: string): string {
  const parts = rowId.split('.');
  if (parts[1] === 'choice' && parts[2]) return parts[2];
  return parts[1] || 'general';
}

function knowledgeGroup(question: Question): string {
  const groups = new Set((question.knowledgeRefs ?? []).map(rowKnowledgeGroup).filter(Boolean));
  if (!groups.size) return 'general';
  return groups.size === 1 ? [...groups][0] : 'mixed';
}

function activityFamily(question: Question): string {
  if (question.authoring.source.startsWith('knowledge:')) return question.authoring.source;
  const refs = question.knowledgeRefs ?? [];
  if (refs.length) return [...new Set(refs.map(rowKnowledgeGroup))].sort().join('+');
  return question.id.split('.').slice(0, 3).join('.');
}

function isReasoningQuestion(question: Question): boolean {
  return (question.knowledgeRefs?.length ?? 0) >= 2 && question.difficulty >= 3;
}

function isLogicalReasoningQuestion(question: Question): boolean {
  const refs = question.knowledgeRefs ?? [];
  return refs.length > 0 && refs.every((rowId) => rowKnowledgeGroup(rowId) === 'reasoning');
}

function isAchieverQuestion(question: Question): boolean {
  return question.authoring.source === 'kidsplay-editorial-hots' && !isLogicalReasoningQuestion(question);
}

function matchesAssessmentSelector(question: Question, selector: AssessmentSelector): boolean {
  if (selector === 'logical_reasoning') return isLogicalReasoningQuestion(question);
  if (selector === 'achiever_hots') return isAchieverQuestion(question);
  return !isLogicalReasoningQuestion(question) && !isAchieverQuestion(question);
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

function chooseDiverseSession(candidates: Question[], count: number): Question[] {
  const selected: Question[] = [];
  const selectedIds = new Set<string>();
  const usedEngines = new Set<Question['interaction']['type']>();
  const usedFamilies = new Set<string>();

  const select = (question: Question): void => {
    selected.push(question);
    selectedIds.add(question.id);
    usedEngines.add(question.interaction.type);
    usedFamilies.add(activityFamily(question));
  };

  for (const question of candidates) {
    if (selected.length >= count) break;
    if (usedEngines.has(question.interaction.type) || usedFamilies.has(activityFamily(question))) continue;
    select(question);
  }

  for (const question of candidates) {
    if (selected.length >= count) break;
    if (selectedIds.has(question.id) || usedFamilies.has(activityFamily(question))) continue;
    select(question);
  }

  for (const question of candidates) {
    if (selected.length >= count) break;
    if (selectedIds.has(question.id)) continue;
    select(question);
  }

  return selected;
}

function ensureReasoningQuota(
  selected: Question[],
  candidates: Question[],
  count: number,
  minimumReasoning: number
): Question[] {
  const result = [...selected];
  const availableReasoning = candidates.filter(isReasoningQuestion);
  const target = Math.min(minimumReasoning, availableReasoning.length, count);
  let reasoningCount = result.filter(isReasoningQuestion).length;
  if (reasoningCount >= target) return result;

  const selectedIds = new Set(result.map((question) => question.id));
  for (const reasoning of availableReasoning) {
    if (reasoningCount >= target) break;
    if (selectedIds.has(reasoning.id)) continue;

    if (result.length < count) {
      result.push(reasoning);
      selectedIds.add(reasoning.id);
      reasoningCount += 1;
      continue;
    }

    let replaceIndex = -1;
    for (let index = result.length - 1; index >= 0; index -= 1) {
      if (!isReasoningQuestion(result[index])) {
        replaceIndex = index;
        break;
      }
    }
    if (replaceIndex < 0) break;

    selectedIds.delete(result[replaceIndex].id);
    result[replaceIndex] = reasoning;
    selectedIds.add(reasoning.id);
    reasoningCount += 1;
  }

  return result;
}

function questionFitRank(
  question: Question,
  memberByRow: Map<string, ProfileMembershipMember>
): number {
  const refs = question.knowledgeRefs ?? [];
  if (!refs.length) return fitRank.challenge;
  return Math.max(...refs.map((rowId) => fitRank[memberByRow.get(rowId)?.fit ?? 'challenge']));
}

function getMembership(profileRef: string): ProfileMembership {
  const membership = memberships.find((item) => item.profileRef === profileRef);
  if (!membership) throw new Error(`Unknown profile membership ${profileRef}`);
  return membership;
}

function getProfileCandidates(
  profileRef: string,
  mastery: Record<string, MasteryCounter>
): Question[] {
  const membership = getMembership(profileRef);
  const memberByRow = new Map(membership.members.map((member) => [member.rowId, member]));

  const sorted = questionBank
    .filter((question) => {
      const refs = question.knowledgeRefs ?? [];
      return refs.length > 0 && refs.every((rowId) => memberByRow.has(rowId));
    })
    .sort((left, right) => {
      const fitDelta = questionFitRank(left, memberByRow) - questionFitRank(right, memberByRow);
      if (fitDelta !== 0) return fitDelta;

      const masteryDelta = masteryScore(left, mastery) - masteryScore(right, mastery);
      if (masteryDelta !== 0) return masteryDelta;
      if (left.difficulty !== right.difficulty) return left.difficulty - right.difficulty;
      return left.id.localeCompare(right.id);
    });

  return [0, 1, 2, 3].flatMap((rank) =>
    interleaveByKnowledgeGroup(sorted.filter((question) => questionFitRank(question, memberByRow) === rank))
  );
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
      description: 'Short mixed Class 2 science, EVS and logical-reasoning sessions that keep moving toward unseen and weaker knowledge.',
      access: freePack.access,
      status: 'ready',
      actionLabel: 'Play free'
    },
    {
      id: vocabularyPack.id,
      kind: 'free_explore',
      title: vocabularyPack.title,
      description: 'Short vocabulary sessions that mix meanings, synonyms, antonyms, homophones, matching, word puzzles and spelling play from the same reusable word knowledge.',
      access: vocabularyPack.access,
      status: 'ready',
      actionLabel: 'Play words'
    },
    {
      id: goalPack.id,
      kind: 'goal_learning',
      title: goalPack.title,
      description: 'SOF Class 2 profile-driven practice with adaptive selection, weak-topic diagnostics and multi-fact reasoning. Row placement remains prototype-unverified.',
      access: goalPack.access,
      status: goalPack.status === 'reviewed' ? 'ready' : 'prototype',
      profileRef: goalPack.profileRef,
      actionLabel: goalPack.status === 'prototype' ? 'Try prototype' : 'Start goal'
    },
    {
      id: goalMockEntryId,
      kind: 'goal_learning',
      title: 'Class 2 Science Olympiad: 20-Question Mixed Mock',
      description: 'A quick 20-question mixed practice mock assembled from the same profile-selected bank, with several multi-fact reasoning items. It is not an official SOF paper.',
      access: goalPack.access,
      status: 'prototype',
      profileRef: goalPack.profileRef,
      actionLabel: 'Try mixed mock'
    },
    {
      id: goalPatternMockEntryId,
      kind: 'goal_learning',
      title: patternBlueprint.title,
      description: patternBlueprint.description,
      access: goalPack.access,
      status: 'prototype',
      profileRef: patternBlueprint.profileRef,
      actionLabel: patternBlueprint.actionLabel
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
  const selected = chooseDiverseSession(interleaveByKnowledgeGroup(candidates), count);
  return count >= 4 ? ensureReasoningQuota(selected, candidates, count, 1) : selected;
}

export function getFreeAnimalsPackTitle(): string {
  return freePack.title;
}

export function getFreeVocabularyQuestions(): Question[] {
  return resolveQuestionRefs(vocabularyPack.questionRefs, vocabularyPack.id);
}

export function getFreeVocabularyExploreQuestions(options: ProfileSessionOptions = {}): Question[] {
  const mastery = options.mastery ?? {};
  const count = Math.max(1, options.count ?? 8);
  const candidates = getFreeVocabularyQuestions().sort((left, right) => {
    const masteryDelta = masteryScore(left, mastery) - masteryScore(right, mastery);
    if (masteryDelta !== 0) return masteryDelta;
    if (left.difficulty !== right.difficulty) return left.difficulty - right.difficulty;
    return left.id.localeCompare(right.id);
  });
  return chooseDiverseSession(candidates, count);
}

export function getProfileQuestions(profileRef: string, options: ProfileSessionOptions = {}): Question[] {
  const mastery = options.mastery ?? {};
  const count = Math.max(1, options.count ?? 8);
  const candidates = getProfileCandidates(profileRef, mastery);
  const selected = chooseDiverseSession(candidates, count);
  return count >= 4 ? ensureReasoningQuota(selected, candidates, count, 1) : selected;
}

export function getProfileMockQuestions(profileRef: string, options: ProfileSessionOptions = {}): Question[] {
  const mastery = options.mastery ?? {};
  const count = Math.max(8, options.count ?? 20);
  const candidates = getProfileCandidates(profileRef, mastery);
  const selected = chooseDiverseSession(candidates, count);
  const reasoningTarget = Math.max(2, Math.min(4, Math.floor(count / 5)));
  return ensureReasoningQuota(selected, candidates, count, reasoningTarget);
}

export function getProfilePatternMockQuestions(
  profileRef: string,
  options: Omit<ProfileSessionOptions, 'count'> = {}
): Question[] {
  if (profileRef !== patternBlueprint.profileRef) {
    throw new Error(`Assessment blueprint ${patternBlueprint.id} targets ${patternBlueprint.profileRef}, not ${profileRef}`);
  }

  const mastery = options.mastery ?? {};
  const candidates = getProfileCandidates(profileRef, mastery);
  const sections = patternBlueprint.sections.map((section) => {
    const sectionCandidates = candidates.filter((question) => matchesAssessmentSelector(question, section.selector));
    const selected = chooseDiverseSession(sectionCandidates, section.count);
    if (selected.length !== section.count) {
      throw new Error(
        `Profile ${profileRef} cannot build ${patternBlueprint.id} section ${section.id}: required=${section.count}, available=${selected.length}`
      );
    }
    return selected;
  });
  const questions = sections.flat();
  if (questions.length !== patternBlueprint.totalQuestions) {
    throw new Error(
      `Assessment blueprint ${patternBlueprint.id} expected ${patternBlueprint.totalQuestions} questions but built ${questions.length}`
    );
  }
  return questions;
}

export function getGoalReadiness(
  profileRef: string,
  mastery: Record<string, MasteryCounter> = {}
): GoalReadinessSummary {
  const membership = getMembership(profileRef);
  const policy = goalPack.profileRef === profileRef && goalPack.masteryPolicy
    ? goalPack.masteryPolicy
    : { requiredAccuracy: 0.8, minimumIndependentAttempts: 3 };
  const practiced = membership.members
    .map((member) => ({ member, counter: mastery[member.rowId] }))
    .filter((item): item is { member: ProfileMembershipMember; counter: MasteryCounter } =>
      Boolean(item.counter && item.counter.totalWeight > 0)
    );
  const counters = practiced.map((item) => item.counter);
  const practicedRows = counters.length;
  const readyRows = counters.filter((counter) =>
    counter.attempts >= policy.minimumIndependentAttempts
      && counter.correctWeight / counter.totalWeight >= policy.requiredAccuracy
  ).length;
  const practicedGroups = new Set(practiced.map(({ member }) => rowKnowledgeGroup(member.rowId))).size;
  const totalGroups = new Set(membership.members.map((member) => rowKnowledgeGroup(member.rowId))).size;
  const totalWeight = counters.reduce((sum, counter) => sum + counter.totalWeight, 0);
  const correctWeight = counters.reduce((sum, counter) => sum + counter.correctWeight, 0);
  const accuracy = totalWeight > 0 ? correctWeight / totalWeight : null;

  const practiceTargetRows = Math.min(
    membership.members.length,
    Math.max(24, Math.ceil(membership.members.length * 0.2))
  );
  const breadthTargetGroups = Math.min(totalGroups, Math.max(8, Math.ceil(totalGroups * 0.6)));
  const readyTargetRows = Math.min(practiceTargetRows, Math.max(12, Math.ceil(practiceTargetRows * 0.5)));
  const rowCoverage = practiceTargetRows ? Math.min(1, practicedRows / practiceTargetRows) : 0;
  const breadthCoverage = breadthTargetGroups ? Math.min(1, practicedGroups / breadthTargetGroups) : 0;
  const readyCoverage = readyTargetRows ? Math.min(1, readyRows / readyTargetRows) : 0;
  const accuracyFactor = accuracy ?? 0;
  const score = Math.round(
    (rowCoverage * 0.25 + breadthCoverage * 0.25 + readyCoverage * 0.2 + accuracyFactor * 0.3) * 100
  );

  let status: GoalReadinessStatus = 'getting_started';
  if (
    practicedRows >= practiceTargetRows
      && practicedGroups >= breadthTargetGroups
      && readyRows >= readyTargetRows
      && accuracy !== null
      && accuracy >= policy.requiredAccuracy
  ) {
    status = 'mock_ready';
  } else if (practicedRows >= 8 || practicedGroups >= 3) {
    status = 'building';
  }

  return {
    profileRef,
    practicedRows,
    readyRows,
    totalRows: membership.members.length,
    practicedGroups,
    totalGroups,
    accuracy,
    score,
    status
  };
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

  if (entryId === vocabularyPack.id) {
    return {
      id: `session.${vocabularyPack.id}`,
      mode: 'free_explore',
      title: vocabularyPack.title,
      questions: getFreeVocabularyExploreQuestions({ count: 8, mastery })
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

  if (entryId === goalMockEntryId && goalPack.profileRef) {
    return {
      id: `session.${goalMockEntryId}`,
      mode: 'goal_mock',
      title: 'Class 2 Science Olympiad: 20-Question Mixed Mock',
      profileRef: goalPack.profileRef,
      questions: getProfileMockQuestions(goalPack.profileRef, { count: 20, mastery })
    };
  }

  if (entryId === goalPatternMockEntryId) {
    return {
      id: `session.${goalPatternMockEntryId}`,
      mode: 'goal_pattern_mock',
      title: patternBlueprint.title,
      profileRef: patternBlueprint.profileRef,
      questions: getProfilePatternMockQuestions(patternBlueprint.profileRef, { mastery }),
      sections: patternSessionSections.map((section) => ({ ...section }))
    };
  }

  throw new Error(`Unknown catalog entry ${entryId}`);
}