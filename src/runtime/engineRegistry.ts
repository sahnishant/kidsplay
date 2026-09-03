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

export type EngineRetryCapability = 'retry_same_state' | 'reset_for_retry' | 'explanation_only';

interface EngineRegistration {
  component: EngineComponent;
  retryCapability: EngineRetryCapability;
}

const engines = new Map<string, EngineRegistration>([
  ['single_choice@1', { component: SingleChoice, retryCapability: 'reset_for_retry' }],
  ['word_bank_fill@1', { component: WordBankFill, retryCapability: 'reset_for_retry' }],
  ['drag_to_target@1', { component: DragToTarget, retryCapability: 'reset_for_retry' }],
  ['word_search@1', { component: WordSearch, retryCapability: 'explanation_only' }],
  ['memory_pairs@1', { component: MemoryPairs, retryCapability: 'explanation_only' }],
  ['sequence_order@1', { component: SequenceOrder, retryCapability: 'explanation_only' }],
  ['hotspot@1', { component: Hotspot, retryCapability: 'explanation_only' }],
  ['crossword@1', { component: Crossword, retryCapability: 'explanation_only' }],
  ['maze_path@1', { component: MazePath, retryCapability: 'explanation_only' }]
]);

function getEngineRegistration(question: Question): EngineRegistration {
  const key = `${question.interaction.type}@${question.interaction.version}`;
  const registration = engines.get(key);
  if (!registration) throw new Error(`Unsupported interaction engine: ${key}`);
  return registration;
}

export function getEngineComponent(question: Question): EngineComponent {
  return getEngineRegistration(question).component;
}

export function getEngineRetryCapability(question: Question): EngineRetryCapability {
  return getEngineRegistration(question).retryCapability;
}
