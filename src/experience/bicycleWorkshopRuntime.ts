import coreQuestionsJson from '../../content/curriculum-runtime/bicycle-workshop/questions/core.json';
import playQuestionsJson from '../../content/curriculum-runtime/bicycle-workshop/questions/play.json';
import readingQuestionsJson from '../../content/curriculum-runtime/bicycle-workshop/questions/reading.json';
import practicePackJson from '../../content/curriculum-runtime/bicycle-workshop/packs/practice.json';
import readingPackJson from '../../content/curriculum-runtime/bicycle-workshop/packs/reading.json';
import chapterCheckPackJson from '../../content/curriculum-runtime/bicycle-workshop/packs/chapter-check.json';
import type { Question } from '../contracts/question';
import type { MasteryCounter } from '../runtime/localProgress';

export const BICYCLE_WORKSHOP_PRACTICE_ID = 'free.english.bicycle-workshop.1';
export const BICYCLE_WORKSHOP_CHAPTER_CHECK_ID = 'free.english.bicycle-workshop.chapter-check.1';

export type BicycleWorkshopLaunchMode = 'practice' | 'chapter_check';

export interface BicycleWorkshopSessionLaunch {
  id: string;
  mode: 'free_explore';
  title: string;
  questions: Question[];
}

interface ChapterPack {
  id: string;
  title: string;
  questionRefs: string[];
  includePackRefs?: string[];
}

const questions = [
  ...(coreQuestionsJson as Question[]),
  ...(playQuestionsJson as Question[]),
  ...(readingQuestionsJson as Question[])
];
const questionById = new Map(questions.map((question) => [question.id, question]));
const practicePack = practicePackJson as ChapterPack;
const readingPack = readingPackJson as ChapterPack;
const chapterCheckPack = chapterCheckPackJson as ChapterPack;
const packById = new Map([practicePack, readingPack, chapterCheckPack].map((pack) => [pack.id, pack]));

function resolvePackQuestionRefs(pack: ChapterPack, visiting = new Set<string>()): string[] {
  if (visiting.has(pack.id)) throw new Error(`Bicycle Workshop pack cycle at ${pack.id}`);
  const nextVisiting = new Set(visiting).add(pack.id);
  const refs = [...pack.questionRefs];

  for (const includedPackRef of pack.includePackRefs ?? []) {
    const included = packById.get(includedPackRef);
    if (!included) throw new Error(`Bicycle Workshop pack ${pack.id} includes unknown pack ${includedPackRef}`);
    refs.push(...resolvePackQuestionRefs(included, nextVisiting));
  }

  const unique = [...new Set(refs)];
  if (unique.length !== refs.length) throw new Error(`Bicycle Workshop pack ${pack.id} resolves duplicate question refs`);
  return unique;
}

function resolveQuestions(pack: ChapterPack): Question[] {
  return resolvePackQuestionRefs(pack).map((questionId) => {
    const question = questionById.get(questionId);
    if (!question) throw new Error(`Bicycle Workshop pack ${pack.id} refers to unknown question ${questionId}`);
    return question;
  });
}

function masteryScore(question: Question, mastery: Record<string, MasteryCounter>): number {
  const refs = question.knowledgeRefs ?? [];
  if (!refs.length) return 0;
  const scores = refs.map((rowId) => {
    const counter = mastery[rowId];
    if (!counter || counter.totalWeight <= 0) return -1;
    return counter.correctWeight / counter.totalWeight;
  });
  return Math.min(...scores);
}

function stablePracticeCandidates(mastery: Record<string, MasteryCounter>): Question[] {
  return resolveQuestions(practicePack).sort((left, right) => {
    const masteryDelta = masteryScore(left, mastery) - masteryScore(right, mastery);
    if (masteryDelta !== 0) return masteryDelta;
    if (left.difficulty !== right.difficulty) return left.difficulty - right.difficulty;
    return left.id.localeCompare(right.id);
  });
}

function choosePracticeQuestions(mastery: Record<string, MasteryCounter>, count = 8): Question[] {
  const candidates = stablePracticeCandidates(mastery);
  const selected: Question[] = [];
  const selectedIds = new Set<string>();

  const selectFirst = (predicate: (question: Question) => boolean): void => {
    if (selected.length >= count) return;
    const next = candidates.find((question) => !selectedIds.has(question.id) && predicate(question));
    if (!next) return;
    selected.push(next);
    selectedIds.add(next.id);
  };

  // One reading-capability item plus one item from every reusable activity family
  // keeps the short session broad while weakness ordering decides which item wins
  // inside each lane.
  selectFirst((question) => question.id.startsWith('bicycle.workshop.reading.'));
  for (const family of [
    'single_choice',
    'word_bank_fill',
    'drag_to_target',
    'sequence_order',
    'memory_pairs',
    'word_search'
  ] as const) {
    selectFirst((question) => question.interaction.type === family);
  }

  for (const question of candidates) {
    if (selected.length >= count) break;
    if (selectedIds.has(question.id)) continue;
    selected.push(question);
    selectedIds.add(question.id);
  }

  return selected;
}

export function getBicycleWorkshopQuestionBank(): Question[] {
  return questions.map((question) => structuredClone(question));
}

export function getBicycleWorkshopPackQuestions(mode: BicycleWorkshopLaunchMode): Question[] {
  const pack = mode === 'chapter_check' ? chapterCheckPack : practicePack;
  return resolveQuestions(pack).map((question) => structuredClone(question));
}

export function createBicycleWorkshopSession(
  mode: BicycleWorkshopLaunchMode,
  mastery: Record<string, MasteryCounter> = {}
): BicycleWorkshopSessionLaunch {
  if (mode === 'chapter_check') {
    return {
      id: 'session.bicycle-workshop.chapter-check',
      mode: 'free_explore',
      title: chapterCheckPack.title,
      questions: resolveQuestions(chapterCheckPack).map((question) => structuredClone(question))
    };
  }

  return {
    id: 'session.bicycle-workshop.practice',
    mode: 'free_explore',
    title: practicePack.title,
    questions: choosePracticeQuestions(mastery).map((question) => structuredClone(question))
  };
}
