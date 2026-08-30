import patternBlueprintJson from '../../content/assessment-blueprints/SOF_INDIA_CLASS2_2026-27.json';
import sofClass2MembershipJson from '../../content/profile-memberships/SOF_INDIA_CLASS2.json';
import type { Question } from '../contracts/question';

interface AssessmentBlueprintSectionShape {
  id: string;
  title: string;
  count: number;
  marksPerQuestion: number;
  selector: string;
}

interface AssessmentBlueprintShape {
  schemaVersion: number;
  id: string;
  profileRef: string;
  academicYear: string;
  status: string;
  sourceRefs: string[];
  totalQuestions: number;
  totalMarks: number;
  sections: AssessmentBlueprintSectionShape[];
}

interface ProfileMembershipShape {
  profileRef: string;
  provenance?: unknown;
  members: Array<{ rowId: string; fit: string }>;
}

const patternBlueprint = patternBlueprintJson as AssessmentBlueprintShape;
const sofClass2Membership = sofClass2MembershipJson as ProfileMembershipShape;

export function getPatternMockContractSignature(profileRef: string | undefined): string {
  if (!profileRef || profileRef !== patternBlueprint.profileRef || profileRef !== sofClass2Membership.profileRef) {
    throw new Error(`Cannot fingerprint pattern mock contract for profile ${profileRef ?? 'unknown'}`);
  }

  return JSON.stringify({
    blueprint: {
      schemaVersion: patternBlueprint.schemaVersion,
      id: patternBlueprint.id,
      profileRef: patternBlueprint.profileRef,
      academicYear: patternBlueprint.academicYear,
      status: patternBlueprint.status,
      sourceRefs: [...patternBlueprint.sourceRefs].sort(),
      totalQuestions: patternBlueprint.totalQuestions,
      totalMarks: patternBlueprint.totalMarks,
      sections: patternBlueprint.sections.map((section) => ({
        id: section.id,
        title: section.title,
        count: section.count,
        marksPerQuestion: section.marksPerQuestion,
        selector: section.selector
      }))
    },
    membership: {
      profileRef: sofClass2Membership.profileRef,
      provenance: sofClass2Membership.provenance ?? null,
      members: sofClass2Membership.members
        .map((member) => ({ rowId: member.rowId, fit: member.fit }))
        .sort((left, right) => left.rowId.localeCompare(right.rowId) || left.fit.localeCompare(right.fit))
    }
  });
}

export function getQuestionContractSignature(questions: Question[]): string {
  if (!questions.length) throw new Error('Cannot fingerprint an empty mock question set');
  return JSON.stringify(questions.map((question) => ({
    id: question.id,
    revision: question.revision,
    schemaVersion: question.schemaVersion,
    conceptIds: [...question.conceptIds],
    knowledgeRefs: [...(question.knowledgeRefs ?? [])],
    difficulty: question.difficulty,
    language: question.language,
    prompt: question.prompt,
    stimulus: question.stimulus ?? null,
    interaction: question.interaction,
    solution: question.solution,
    feedback: question.feedback
  })));
}
