import type { Question } from '../contracts/question';

const questionModules = import.meta.glob('../../content/questions/*.json', {
  eager: true,
  import: 'default'
}) as Record<string, unknown>;

const questions = Object.values(questionModules).flatMap((value) =>
  Array.isArray(value) ? (value as Question[]) : []
);
const questionById = new Map(questions.map((question) => [question.id, question]));

export function resolveQuestionIds(questionIds: string[]): Question[] {
  if (!questionIds.length) throw new Error('A resumable session must contain questions');
  if (new Set(questionIds).size !== questionIds.length) {
    throw new Error('A resumable session cannot contain duplicate question ids');
  }

  return questionIds.map((questionId) => {
    const question = questionById.get(questionId);
    if (!question) throw new Error(`Resumable session refers to unknown question ${questionId}`);
    return question;
  });
}
