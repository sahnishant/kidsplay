import type { EqualPartsQuestion, SequenceOrderQuestion } from '../contracts/question';
import { isStudioResponse } from '../experience/studioWorkspace.mjs';

/** Accessible description of the child's submitted work, never the answer key. */
export function describeStudioWork(question: EqualPartsQuestion | SequenceOrderQuestion, state: unknown): string {
  if (!isStudioResponse(question, state)) return 'Submitted work is unavailable.';
  const interaction = question.interaction;
  if (interaction.type === 'equal_parts') {
    const values = (state as { assignments: Array<string | null> }).assignments;
    const amounts = interaction.categories.map(({ id, label }) => `${label}: ${values.filter((value) => value === id).length} of ${interaction.partCount} equal parts`);
    const empty = values.filter((value) => value === null).length;
    if (empty) amounts.push(`${empty} parts empty`);
    return `Your submitted work: ${amounts.join('; ')}.`;
  }
  const ids = (state as { orderedItemIds: string[] }).orderedItemIds;
  const labels = new Map(interaction.items.map((item) => [item.id, item.label]));
  return `Your submitted work: ${ids.map((id) => labels.get(id)).join(' → ')}.`;
}
