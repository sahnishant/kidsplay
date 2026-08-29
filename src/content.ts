import animalQuestionJson from '../content/questions/animals.json';
import wordSearchQuestionJson from '../content/questions/word-search.json';
import freeAnimalsPack from '../content/packs/free-animals.json';
import type { Question } from './contracts/question';

interface LearningPack {
  id: string;
  title: string;
  questionRefs: string[];
}

const questionBank = [...animalQuestionJson, ...wordSearchQuestionJson] as unknown as Question[];
const freePack = freeAnimalsPack as LearningPack;

export function getFreeAnimalsQuestions(): Question[] {
  const byId = new Map(questionBank.map((question) => [question.id, question]));

  return freePack.questionRefs.map((questionId) => {
    const question = byId.get(questionId);
    if (!question) throw new Error(`Pack ${freePack.id} refers to unknown question ${questionId}`);
    return question;
  });
}

export function getFreeAnimalsPackTitle(): string {
  return freePack.title;
}
