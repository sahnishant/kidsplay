import type { Question } from '../contracts/question';
import { dragToTargetEngine } from '../engines/dragToTarget';
import { memoryPairsEngine } from '../engines/memoryPairs';
import { singleChoiceEngine } from '../engines/singleChoice';
import type { InteractionEngine } from '../engines/types';
import { wordBankFillEngine } from '../engines/wordBankFill';
import { wordSearchEngine } from '../engines/wordSearch';

const engines = new Map<string, InteractionEngine>([
  [singleChoiceEngine.key, singleChoiceEngine],
  [wordBankFillEngine.key, wordBankFillEngine],
  [dragToTargetEngine.key, dragToTargetEngine],
  [wordSearchEngine.key, wordSearchEngine],
  [memoryPairsEngine.key, memoryPairsEngine]
]);

export function getEngine(question: Question): InteractionEngine {
  const key = `${question.interaction.type}@${question.interaction.version}`;
  const engine = engines.get(key);
  if (!engine) throw new Error(`Unsupported interaction engine: ${key}`);
  return engine;
}
