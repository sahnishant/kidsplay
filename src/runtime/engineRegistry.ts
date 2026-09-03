import type { Question } from '../contracts/question';
import Crossword from '../engines/Crossword.svelte';
import DragToTarget from '../engines/DragToTarget.svelte';
import Hotspot from '../engines/Hotspot.svelte';
import MazePath from '../engines/MazePath.svelte';
import MemoryPairs from '../engines/MemoryPairs.svelte';
import SequenceOrder from '../engines/SequenceOrder.svelte';
import SingleChoice from '../engines/SingleChoice.svelte';
import TracePath from '../engines/TracePath.svelte';
import type { EngineComponent } from '../engines/types';
import WordBankFill from '../engines/WordBankFill.svelte';
import WordSearch from '../engines/WordSearch.svelte';

export type EngineRetryCapability = 'retry_same_state' | 'reset_for_retry' | 'explanation_only';

// Keep this registry in the canonical key -> component shape consumed by validate-engine-registry.mjs.
const engines = new Map<string, EngineComponent>([
  ['single_choice@1', SingleChoice],
  ['word_bank_fill@1', WordBankFill],
  ['drag_to_target@1', DragToTarget],
  ['word_search@1', WordSearch],
  ['memory_pairs@1', MemoryPairs],
  ['sequence_order@1', SequenceOrder],
  ['hotspot@1', Hotspot],
  ['trace_path@1', TracePath],
  ['crossword@1', Crossword],
  ['maze_path@1', MazePath]
]);

const retryCapabilities = new Map<string, EngineRetryCapability>([
  ['single_choice@1', 'reset_for_retry'],
  ['word_bank_fill@1', 'reset_for_retry'],
  ['drag_to_target@1', 'reset_for_retry'],
  ['trace_path@1', 'reset_for_retry'],
  ['word_search@1', 'explanation_only'],
  ['memory_pairs@1', 'explanation_only'],
  ['sequence_order@1', 'explanation_only'],
  ['hotspot@1', 'explanation_only'],
  ['crossword@1', 'explanation_only'],
  ['maze_path@1', 'explanation_only']
]);

function engineKey(question: Question): string {
  return `${question.interaction.type}@${question.interaction.version}`;
}

export function getEngineComponent(question: Question): EngineComponent {
  const key = engineKey(question);
  const engine = engines.get(key);
  if (!engine) throw new Error(`Unsupported interaction engine: ${key}`);
  return engine;
}

export function getEngineRetryCapability(question: Question): EngineRetryCapability {
  const key = engineKey(question);
  const capability = retryCapabilities.get(key);
  if (!capability) throw new Error(`Unsupported retry capability: ${key}`);
  return capability;
}
