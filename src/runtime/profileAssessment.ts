import type { Question } from '../contracts/question';

export type AssessmentSelector = 'logical_reasoning' | 'science_core' | 'achiever_hots';
export type MembershipOrigin = 'direct' | 'inherited';
export type QuestionCurriculumOrigin = 'current' | 'previous' | 'mixed';

export interface EffectiveProfileMember {
  rowId: string;
  fit: 'review' | 'core' | 'stretch' | 'challenge';
  origin?: MembershipOrigin;
  inheritedFromProfileRef?: string | null;
}

export interface AssessmentBlueprintSection {
  id: 'logical_reasoning' | 'science' | 'achievers';
  title: string;
  count: number;
  marksPerQuestion: number;
  selector: AssessmentSelector;
}

export interface AssessmentSelectionPolicy {
  sourceRef: string;
  scope: 'level_i_science_section';
  currentClassScienceCount: number;
  previousClassScienceCount: number;
  achieversCurrentClassOnly: boolean;
  notes: string;
}

export interface AssessmentBlueprint {
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
  selectionPolicy?: AssessmentSelectionPolicy;
  sections: AssessmentBlueprintSection[];
}

export interface SelectedAssessmentSection {
  id: AssessmentBlueprintSection['id'];
  title: string;
  startIndex: number;
  count: number;
  marksPerQuestion: number;
}

export interface AssessmentBuildResult {
  questions: Question[];
  sections: SelectedAssessmentSection[];
  originCounts: Record<QuestionCurriculumOrigin, number>;
}

function rowKnowledgeGroup(rowId: string): string {
  const parts = rowId.split('.');
  if (parts[1] === 'choice' && parts[2]) return parts[2];
  return parts[1] || 'general';
}

function isLogicalReasoningQuestion(question: Question): boolean {
  const refs = question.knowledgeRefs ?? [];
  return refs.length > 0 && refs.every((rowId) => rowKnowledgeGroup(rowId) === 'reasoning');
}

function isAchieverQuestion(question: Question): boolean {
  return question.authoring.source === 'kidsplay-editorial-hots' && !isLogicalReasoningQuestion(question);
}

function matchesSelector(question: Question, selector: AssessmentSelector): boolean {
  if (selector === 'logical_reasoning') return isLogicalReasoningQuestion(question);
  if (selector === 'achiever_hots') return isAchieverQuestion(question);
  return !isLogicalReasoningQuestion(question) && !isAchieverQuestion(question);
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

function interleaveByGroup(candidates: Question[]): Question[] {
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

function chooseDiverse(candidates: Question[], count: number): Question[] {
  const ordered = interleaveByGroup(candidates);
  const selected: Question[] = [];
  const selectedIds = new Set<string>();
  const usedEngines = new Set<Question['interaction']['type']>();
  const usedFamilies = new Set<string>();

  const add = (question: Question): void => {
    selected.push(question);
    selectedIds.add(question.id);
    usedEngines.add(question.interaction.type);
    usedFamilies.add(activityFamily(question));
  };

  for (const question of ordered) {
    if (selected.length >= count) break;
    if (usedEngines.has(question.interaction.type) || usedFamilies.has(activityFamily(question))) continue;
    add(question);
  }
  for (const question of ordered) {
    if (selected.length >= count) break;
    if (selectedIds.has(question.id) || usedFamilies.has(activityFamily(question))) continue;
    add(question);
  }
  for (const question of ordered) {
    if (selected.length >= count) break;
    if (selectedIds.has(question.id)) continue;
    add(question);
  }
  return selected;
}

export function questionCurriculumOrigin(
  question: Question,
  memberByRow: Map<string, EffectiveProfileMember>
): QuestionCurriculumOrigin {
  const refs = question.knowledgeRefs ?? [];
  if (!refs.length) return 'mixed';
  let direct = 0;
  let inherited = 0;
  for (const rowId of refs) {
    const member = memberByRow.get(rowId);
    if (!member) return 'mixed';
    if ((member.origin ?? 'direct') === 'inherited') inherited += 1;
    else direct += 1;
  }
  if (direct && inherited) return 'mixed';
  return inherited ? 'previous' : 'current';
}

function selectSection(
  candidates: Question[],
  section: AssessmentBlueprintSection,
  blueprint: AssessmentBlueprint,
  memberByRow: Map<string, EffectiveProfileMember>
): Question[] {
  const eligible = candidates.filter((question) => matchesSelector(question, section.selector));
  const policy = blueprint.selectionPolicy;

  if (section.selector === 'science_core' && policy?.scope === 'level_i_science_section') {
    const current = eligible.filter((question) => questionCurriculumOrigin(question, memberByRow) === 'current');
    const previous = eligible.filter((question) => questionCurriculumOrigin(question, memberByRow) === 'previous');
    const selectedCurrent = chooseDiverse(current, policy.currentClassScienceCount);
    const selectedPrevious = chooseDiverse(previous, policy.previousClassScienceCount);
    if (selectedCurrent.length !== policy.currentClassScienceCount || selectedPrevious.length !== policy.previousClassScienceCount) {
      throw new Error(
        `Profile ${blueprint.profileRef} cannot satisfy ${blueprint.id} science mix: ` +
        `current ${selectedCurrent.length}/${policy.currentClassScienceCount}, previous ${selectedPrevious.length}/${policy.previousClassScienceCount}`
      );
    }
    return [...selectedCurrent, ...selectedPrevious];
  }

  const policyEligible = section.selector === 'achiever_hots' && policy?.achieversCurrentClassOnly
    ? eligible.filter((question) => questionCurriculumOrigin(question, memberByRow) === 'current')
    : eligible;
  const selected = chooseDiverse(policyEligible, section.count);
  if (selected.length !== section.count) {
    throw new Error(
      `Profile ${blueprint.profileRef} cannot build ${blueprint.id} section ${section.id}: ` +
      `required=${section.count}, available=${selected.length}`
    );
  }
  return selected;
}

export function buildProfilePatternAssessment(
  candidates: Question[],
  blueprint: AssessmentBlueprint,
  members: EffectiveProfileMember[]
): AssessmentBuildResult {
  const memberByRow = new Map(members.map((member) => [member.rowId, member]));
  const sections: SelectedAssessmentSection[] = [];
  const questionSections: Question[][] = [];
  let startIndex = 0;

  for (const section of blueprint.sections) {
    const selected = selectSection(candidates, section, blueprint, memberByRow);
    questionSections.push(selected);
    sections.push({
      id: section.id,
      title: section.title,
      startIndex,
      count: section.count,
      marksPerQuestion: section.marksPerQuestion
    });
    startIndex += section.count;
  }

  const questions = questionSections.flat();
  if (questions.length !== blueprint.totalQuestions) {
    throw new Error(`${blueprint.id} expected ${blueprint.totalQuestions} questions but built ${questions.length}`);
  }
  const uniqueIds = new Set(questions.map((question) => question.id));
  if (uniqueIds.size !== questions.length) throw new Error(`${blueprint.id} selected duplicate question ids`);

  const originCounts: Record<QuestionCurriculumOrigin, number> = { current: 0, previous: 0, mixed: 0 };
  for (const question of questions) originCounts[questionCurriculumOrigin(question, memberByRow)] += 1;

  return { questions, sections, originCounts };
}
