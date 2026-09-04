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
  if (adventure.schemaVersion !== 1 || ![2, 3].includes(adventure.level)) {
    throw new Error(`Invalid Forest world-depth adventure ${adventure.adventureRef}`);
  }
  if (adventure.steps.length < 3) {
    throw new Error(`Forest world-depth adventure ${adventure.adventureRef} needs at least three actions`);
  }
  return {
    ...adventure,
    steps: adventure.steps.map((step) => ({
      ...step,
      worldAction: validateWorldActionDefinition(step.worldAction),
      ...(step.assembly ? { assembly: validateAssemblyDefinition(step.assembly) } : {})
    }))
  };
}

const document = forestWorldDepthJson as unknown as ForestWorldDepthDocument;
if (document.schemaVersion !== 1 || !Array.isArray(document.adventures)) {
  throw new Error('Invalid Forest world-depth document');
}
const adventures = document.adventures.map(validateAdventure);

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
