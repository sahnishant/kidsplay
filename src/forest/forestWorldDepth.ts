import forestWorldDepthJson from '../../content/forest/world-depth.json';
import {
  validateWorldActionDefinition,
  type WorldActionDefinition
} from '../experience/worldActionContract';
import {
  validateAssemblyDefinition,
  type AssemblyDefinition
} from '../mechanics/assembly';

export type ForestWorldDepthLevel = 2 | 3;
export type ForestInteractionFamily = 'assemble_repair' | 'practical_life' | 'cause_effect';
export type ForestSemanticDomain = 'trail_infrastructure' | 'water_path' | 'animal_habitat' | 'plant_care';

export interface ForestAdventureStep {
  id: string;
  interactionFamily: ForestInteractionFamily;
  semanticDomain: ForestSemanticDomain;
  icon: string;
  title: string;
  actionLabel: string;
  prompt: string;
  instruction: string;
  consequence: string;
  scaffold: string;
  worldObjectBefore: string;
  worldObjectAfter: string;
  worldAction: WorldActionDefinition;
  assembly?: AssemblyDefinition;
}

export interface ForestWorldDepthAdventure {
  schemaVersion: 1;
  adventureRef: string;
  level: ForestWorldDepthLevel;
  title: string;
  worldProblem: string;
  characterSetup: string;
  ending: string;
  nextStateLabel: string;
  persistentChangeId: string;
  sourceEventRefs: readonly string[];
  steps: readonly ForestAdventureStep[];
}

interface ForestWorldDepthDocument {
  schemaVersion: 1;
  adventures: ForestWorldDepthAdventure[];
}

function validateAdventure(adventure: ForestWorldDepthAdventure): ForestWorldDepthAdventure {
  if (adventure.schemaVersion !== 1 || (adventure.level !== 2 && adventure.level !== 3) || adventure.steps.length < 3) {
    throw new Error(`Invalid Forest world-depth adventure ${adventure.adventureRef}`);
  }
  for (const step of adventure.steps) {
    step.worldAction = validateWorldActionDefinition(step.worldAction);
    if (step.assembly) step.assembly = validateAssemblyDefinition(step.assembly);
  }
  return adventure;
}

const source = forestWorldDepthJson as unknown as ForestWorldDepthDocument;
if (source.schemaVersion !== 1) throw new Error('Invalid Forest world-depth document');
const adventures = source.adventures.map(validateAdventure);

export function getForestWorldDepthAdventures(): ForestWorldDepthAdventure[] {
  return adventures;
}

export function getForestWorldDepthAdventure(adventureRef: string): ForestWorldDepthAdventure {
  const adventure = adventures.find((item) => item.adventureRef === adventureRef);
  if (!adventure) throw new Error(`Unknown Forest world-depth adventure ${adventureRef}`);
  return adventure;
}

export function getForestAssemblyProof(): Array<{
  adventureRef: string;
  stepId: string;
  semanticDomain: ForestSemanticDomain;
  definition: AssemblyDefinition;
}> {
  return adventures.flatMap((adventure) =>
    adventure.steps.flatMap((step) => step.assembly
      ? [{ adventureRef: adventure.adventureRef, stepId: step.id, semanticDomain: step.semanticDomain, definition: step.assembly }]
      : [])
  );
}
