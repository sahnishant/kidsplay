import type { Question } from '../contracts/question';
import { crosswordEngine } from '../engines/crossword';
import { dragToTargetEngine } from '../engines/dragToTarget';
import { hotspotEngine } from '../engines/hotspot';
import { mazePathEngine } from '../engines/mazePath';
import { memoryPairsEngine } from '../engines/memoryPairs';
import { sequenceOrderEngine } from '../engines/sequenceOrder';
import { singleChoiceEngine } from '../engines/singleChoice';
import type { InteractionEngine } from '../engines/types';
import { wordBankFillEngine } from '../engines/wordBankFill';
import { wordSearchEngine } from '../engines/wordSearch';

const engines = new Map<string, InteractionEngine>([
  ['single_choice@1', singleChoiceEngine],
  ['word_bank_fill@1', wordBankFillEngine],
  ['drag_to_target@1', dragToTargetEngine],
  ['word_search@1', wordSearchEngine],
  ['memory_pairs@1', memoryPairsEngine],
  ['sequence_order@1', sequenceOrderEngine],
  ['hotspot@1', hotspotEngine],
  ['crossword@1', crosswordEngine],
  ['maze_path@1', mazePathEngine]
]);

for (const [key, engine] of engines) {
  if (engine.key !== key) throw new Error(`Runtime engine key mismatch: registry ${key}, implementation ${engine.key}`);
}

export function getEngine(question: Question): InteractionEngine {
  const key = `${question.interaction.type}@${question.interaction.version}`;
  const engine = engines.get(key);
  if (!engine) throw new Error(`Unsupported interaction engine: ${key}`);
  return engine;
}
