import type { Question } from '../contracts/question';
import Crossword from '../engines/Crossword.svelte';
import DragToTarget from '../engines/DragToTarget.svelte';
import Hotspot from '../engines/Hotspot.svelte';
import MazePath from '../engines/MazePath.svelte';
import MemoryPairs from '../engines/MemoryPairs.svelte';
import SequenceOrder from '../engines/SequenceOrder.svelte';
import SingleChoice from '../engines/SingleChoice.svelte';
import type { EngineComponent } from '../engines/types';
import WordBankFill from '../engines/WordBankFill.svelte';
import WordSearch from '../engines/WordSearch.svelte';

const engines = new Map<string, EngineComponent>([
  ['single_choice@1', SingleChoice],
  ['word_bank_fill@1', WordBankFill],
  ['drag_to_target@1', DragToTarget],
  ['word_search@1', WordSearch],
  ['memory_pairs@1', MemoryPairs],
  ['sequence_order@1', SequenceOrder],
  ['hotspot@1', Hotspot],
  ['crossword@1', Crossword],
  ['maze_path@1', MazePath]
]);

export function getEngineComponent(question: Question): EngineComponent {
  const key = `${question.interaction.type}@${question.interaction.version}`;
  const engine = engines.get(key);
  if (!engine) throw new Error(`Unsupported interaction engine: ${key}`);
  return engine;
}
