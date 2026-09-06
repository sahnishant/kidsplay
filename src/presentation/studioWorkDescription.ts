import type { CollectionCountQuestion, DragToTargetQuestion, EqualPartsQuestion, SequenceOrderQuestion } from '../contracts/question';
import { isStudioResponse } from '../experience/studioWorkspace.mjs';

/** Accessible description of the child's submitted work, never the answer key. */
export function describeStudioWork(question: EqualPartsQuestion | SequenceOrderQuestion | DragToTargetQuestion | CollectionCountQuestion, state: unknown): string {
  if (!isStudioResponse(question, state)) return 'Submitted work is unavailable.';
  const interaction = question.interaction;
  if (interaction.type === 'equal_parts') {
    const values = (state as { assignments: Array<string | null> }).assignments;
    const amounts = interaction.categories.map(({ id, label }) => `${label}: ${values.filter((value) => value === id).length} of ${interaction.partCount} equal parts`);
    const empty = values.filter((value) => value === null).length;
    if (empty) amounts.push(`${empty} parts empty`);
    return `Your submitted work: ${amounts.join('; ')}.`;
  }
  if (interaction.type === 'drag_to_target') {
    const values = (state as { assignments: Record<string, string> }).assignments;
    const itemLabels = new Map(interaction.items.map((item) => [item.id, item.label]));
    const targetLabels = new Map(interaction.targets.map((target) => [target.id, target.label]));
    const matches = Object.entries(values).map(([itemId, targetId]) => `${itemLabels.get(itemId) ?? itemId} → ${targetLabels.get(targetId) ?? targetId}`);
    const unassigned = interaction.items.filter((item) => !values[item.id]).map((item) => item.label);
    if (unassigned.length) matches.push(`not matched yet: ${unassigned.join(', ')}`);
    return `Your submitted work: ${matches.join('; ')}.`;
  }
  if (interaction.type === 'collection_count') {
    const values = (state as { assignments: Record<string,string> }).assignments;
    const groups = interaction.targets.map((target) => `${target.label}: ${Object.values(values).filter((targetId) => targetId === target.id).length} objects`);
    const unassigned = interaction.items.length - Object.keys(values).length;
    if (unassigned) groups.push(`${unassigned} objects ungrouped`);
    return `Your submitted work: ${groups.join('; ')}.`;
  }
  const ids = (state as { orderedItemIds: string[] }).orderedItemIds;
  const labels = new Map(interaction.items.map((item) => [item.id, item.label]));
  return `Your submitted work: ${ids.map((id) => labels.get(id)).join(' → ')}.`;
}
