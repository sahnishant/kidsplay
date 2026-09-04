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

function worldAction(definition: WorldActionDefinition): WorldActionDefinition {
  return validateWorldActionDefinition(definition);
}

function assembly(definition: AssemblyDefinition): AssemblyDefinition {
  return validateAssemblyDefinition(definition);
}

const level2: ForestWorldDepthAdventure = {
  schemaVersion: 1,
  adventureRef: 'forest.world-depth.l2.creek-rescue',
  level: 2,
  title: 'The Quiet Creek Rescue',
  worldProblem: 'A fallen branch has broken the little crossing and blocked the creek. The young plants beside it are dry.',
  characterSetup: 'Shaitanu says the creek can stay stuck. Scientu notices that water, roots and a safe crossing are all connected. Dheu decides to repair the route instead of answering cards.',
  ending: 'Water is moving again, the crossing is safe, and the creek-bank plants have been watered.',
  nextStateLabel: 'Forest Level 3 unlocked',
  persistentChangeId: 'forest-creek-restored',
  sourceEventRefs: ['event.forest.l2.creek-restored', 'event.forest.l2.creek-word-found'],
  steps: [
    {
      id: 'forest.l2.step.bridge-repair',
      interactionFamily: 'assemble_repair',
      semanticDomain: 'trail_infrastructure',
      icon: '🪵',
      title: 'Repair the creek crossing',
      prompt: 'The crossing is missing a plank and a hand rail.',
      instruction: 'Choose a piece, then choose where it belongs. A drop is the answer; there is no Check Answer button.',
      consequence: 'The bridge stands firmly above the creek.',
      scaffold: 'Look for the shape that matches the open place. Your correct pieces stay put while you retry.',
      worldObjectBefore: 'broken-crossing',
      worldObjectAfter: 'safe-crossing',
      worldAction: worldAction({
        schemaVersion: 1,
        actionId: 'action.forest.l2.repair-crossing',
        family: 'practical_life',
        action: 'help',
        canonicalGoalRefs: ['kr.plants.roots.function.absorb-water'],
        subjectSemanticRefs: ['semantic.forest.crossing.plank', 'semantic.forest.crossing.rail'],
        evidenceClass: 'evaluative',
        retryPolicy: 'reset_for_retry_preserve_first_attempt'
      }),
      assembly: assembly({
        schemaVersion: 1,
        assemblyId: 'assembly.forest.l2.creek-crossing',
        operation: 'repair_restore',
        orderMode: 'unordered',
        parts: [
          { partId: 'part.bridge-plank', semanticRef: 'semantic.forest.crossing.plank' },
          { partId: 'part.bridge-rail', semanticRef: 'semantic.forest.crossing.rail' }
        ],
        slots: [
          { slotId: 'slot.bridge-deck', semanticRef: 'semantic.forest.crossing.deck-gap' },
          { slotId: 'slot.bridge-side', semanticRef: 'semantic.forest.crossing.rail-gap' }
        ],
        requiredAssignments: [
          { partId: 'part.bridge-plank', slotId: 'slot.bridge-deck' },
          { partId: 'part.bridge-rail', slotId: 'slot.bridge-side' }
        ],
        retryPolicy: 'reset_for_retry_preserve_first_attempt'
      })
    },
    {
      id: 'forest.l2.step.channel-connect',
      interactionFamily: 'assemble_repair',
      semanticDomain: 'water_path',
      icon: '🧩',
      title: 'Reconnect the water path',
      prompt: 'Two little channel pieces have come loose, so water cannot reach the roots.',
      instruction: 'Fit both channel pieces into their matching gaps.',
      consequence: 'The channel makes one clear path toward the saplings.',
      scaffold: 'Follow the edge of the water path. A matching gap continues the same route.',
      worldObjectBefore: 'split-water-channel',
      worldObjectAfter: 'connected-water-channel',
      worldAction: worldAction({
        schemaVersion: 1,
        actionId: 'action.forest.l2.connect-channel',
        family: 'practical_life',
        action: 'place',
        canonicalGoalRefs: ['kr.plants.roots.function.absorb-water'],
        subjectSemanticRefs: ['semantic.forest.channel.left', 'semantic.forest.channel.right'],
        targetSemanticRefs: ['semantic.forest.channel.gaps'],
        evidenceClass: 'evaluative',
        retryPolicy: 'reset_for_retry_preserve_first_attempt'
      }),
      assembly: assembly({
        schemaVersion: 1,
        assemblyId: 'assembly.forest.l2.water-channel',
        operation: 'connect_parts',
        orderMode: 'unordered',
        parts: [
          { partId: 'part.channel-left', semanticRef: 'semantic.forest.channel.left' },
          { partId: 'part.channel-right', semanticRef: 'semantic.forest.channel.right' }
        ],
        slots: [
          { slotId: 'slot.channel-upper', semanticRef: 'semantic.forest.channel.upper-gap' },
          { slotId: 'slot.channel-lower', semanticRef: 'semantic.forest.channel.lower-gap' }
        ],
        requiredAssignments: [
          { partId: 'part.channel-left', slotId: 'slot.channel-upper' },
          { partId: 'part.channel-right', slotId: 'slot.channel-lower' }
        ],
        retryPolicy: 'reset_for_retry_preserve_first_attempt'
      })
    },
    {
      id: 'forest.l2.step.water-saplings',
      interactionFamily: 'practical_life',
      semanticDomain: 'plant_care',
      icon: '💧',
      title: 'Water the creek-bank saplings',
      prompt: 'The young plants are still drooping beside the repaired channel.',
      instruction: 'Give the saplings water and watch their leaves lift.',
      consequence: 'Water reaches the soil around the roots.',
      scaffold: 'Roots take in water from the soil. The watering can belongs beside the plant, not on the bridge.',
      worldObjectBefore: 'dry-saplings',
      worldObjectAfter: 'watered-saplings',
      worldAction: worldAction({
        schemaVersion: 1,
        actionId: 'action.forest.l2.water-saplings',
        family: 'practical_life',
        action: 'water',
        canonicalGoalRefs: ['kr.plants.roots.function.absorb-water'],
        subjectSemanticRefs: ['semantic.tool.watering-can'],
        targetSemanticRefs: ['semantic.forest.saplings'],
        stateTransition: {
          beforeStateRef: 'state.forest.saplings.dry',
          afterStateRef: 'state.forest.saplings.watered',
          causalKnowledgeRef: 'kr.plants.roots.function.absorb-water'
        },
        evidenceClass: 'guided_practice',
        retryPolicy: 'not_applicable'
      })
    },
    {
      id: 'forest.l2.step.release-creek',
      interactionFamily: 'cause_effect',
      semanticDomain: 'water_path',
      icon: '🌊',
      title: 'Release the creek flow',
      prompt: 'The route is ready. One last clump of leaves is holding the shallow water back.',
      instruction: 'Clear the blockage and observe what changes downstream.',
      consequence: 'Water moves through the channel and the creek sounds alive again.',
      scaffold: 'Look at the before and after states: blocked water cannot follow the channel; clear water can.',
      worldObjectBefore: 'blocked-creek',
      worldObjectAfter: 'flowing-creek',
      worldAction: worldAction({
        schemaVersion: 1,
        actionId: 'action.forest.l2.release-creek',
        family: 'cause_effect',
        action: 'observe_change',
        canonicalGoalRefs: ['kr.plants.roots.function.absorb-water'],
        subjectSemanticRefs: ['semantic.forest.creek-blockage'],
        stateTransition: {
          beforeStateRef: 'state.forest.creek.blocked',
          afterStateRef: 'state.forest.creek.flowing',
          causalKnowledgeRef: 'kr.plants.roots.function.absorb-water'
        },
        evidenceClass: 'exploration',
        retryPolicy: 'not_applicable'
      })
    }
  ]
};

const level3: ForestWorldDepthAdventure = {
  schemaVersion: 1,
  adventureRef: 'forest.world-depth.l3.grove-return',
  level: 3,
  title: 'Bring Back the Busy Grove',
  worldProblem: 'A windy night has knocked down a small shelter and scattered the feeding place. Butterflies and birds are avoiding the quiet grove.',
  characterSetup: 'Shaitanu wants to decorate the grove without fixing what animals need. Scientu asks what makes a habitat useful. Dheu chooses to restore shelter, food and flowering plants.',
  ending: 'The shelter is repaired, food is in the right place, flowers are growing, and animal visitors return to the grove.',
  nextStateLabel: 'Forest depth complete · next world available',
  persistentChangeId: 'forest-busy-grove-restored',
  sourceEventRefs: ['event.forest.l3.grove-restored'],
  steps: [
    {
      id: 'forest.l3.step.shelter-repair',
      interactionFamily: 'assemble_repair',
      semanticDomain: 'animal_habitat',
      icon: '🏠',
      title: 'Repair the little shelter',
      prompt: 'The roof and perch fell away from the animal shelter.',
      instruction: 'Choose each shelter piece, then place it in the matching gap.',
      consequence: 'The shelter has a roof above and a perch at the front.',
      scaffold: 'Think about what each piece does: the roof covers; the perch gives a place to land.',
      worldObjectBefore: 'broken-grove-shelter',
      worldObjectAfter: 'repaired-grove-shelter',
      worldAction: worldAction({
        schemaVersion: 1,
        actionId: 'action.forest.l3.repair-shelter',
        family: 'practical_life',
        action: 'help',
        canonicalGoalRefs: ['kr.animals.rabbit.home.burrow'],
        subjectSemanticRefs: ['semantic.forest.shelter.roof', 'semantic.forest.shelter.perch'],
        evidenceClass: 'evaluative',
        retryPolicy: 'reset_for_retry_preserve_first_attempt'
      }),
      assembly: assembly({
        schemaVersion: 1,
        assemblyId: 'assembly.forest.l3.grove-shelter',
        operation: 'repair_restore',
        orderMode: 'unordered',
        parts: [
          { partId: 'part.shelter-roof', semanticRef: 'semantic.forest.shelter.roof' },
          { partId: 'part.shelter-perch', semanticRef: 'semantic.forest.shelter.perch' }
        ],
        slots: [
          { slotId: 'slot.shelter-top', semanticRef: 'semantic.forest.shelter.top-gap' },
          { slotId: 'slot.shelter-front', semanticRef: 'semantic.forest.shelter.front-gap' }
        ],
        requiredAssignments: [
          { partId: 'part.shelter-roof', slotId: 'slot.shelter-top' },
          { partId: 'part.shelter-perch', slotId: 'slot.shelter-front' }
        ],
        retryPolicy: 'reset_for_retry_preserve_first_attempt'
      })
    },
    {
      id: 'forest.l3.step.sort-feeding-place',
      interactionFamily: 'practical_life',
      semanticDomain: 'animal_habitat',
      icon: '🧺',
      title: 'Sort the feeding place',
      prompt: 'Leaves, seed food and a shiny wrapper are mixed together after the wind.',
      instruction: 'Put useful food at the feeder and clear litter away from the habitat.',
      consequence: 'The feeding corner is clean and ready for animal visitors.',
      scaffold: 'Food belongs at the feeder; litter does not belong in an animal habitat.',
      worldObjectBefore: 'messy-feeding-corner',
      worldObjectAfter: 'sorted-feeding-corner',
      worldAction: worldAction({
        schemaVersion: 1,
        actionId: 'action.forest.l3.sort-feeding-place',
        family: 'practical_life',
        action: 'sort',
        canonicalGoalRefs: ['kr.animals.rabbit.home.burrow'],
        subjectSemanticRefs: ['semantic.forest.seed-food', 'semantic.forest.leaf-litter', 'semantic.forest.wrapper'],
        targetSemanticRefs: ['semantic.forest.feeder', 'semantic.forest.compost-pile', 'semantic.forest.litter-bag'],
        evidenceClass: 'guided_practice',
        retryPolicy: 'not_applicable'
      })
    },
    {
      id: 'forest.l3.step.feed-visitors',
      interactionFamily: 'practical_life',
      semanticDomain: 'animal_habitat',
      icon: '🐦',
      title: 'Set out the animal food',
      prompt: 'The repaired feeding corner is empty.',
      instruction: 'Place the seed food in the feeder, away from the path.',
      consequence: 'The feeder is ready without putting food under children’s feet.',
      scaffold: 'Use the feeding place you just sorted. Safe placement is part of caring for a habitat.',
      worldObjectBefore: 'empty-feeder',
      worldObjectAfter: 'filled-feeder',
      worldAction: worldAction({
        schemaVersion: 1,
        actionId: 'action.forest.l3.feed-visitors',
        family: 'practical_life',
        action: 'feed',
        canonicalGoalRefs: ['kr.animals.rabbit.home.burrow'],
        subjectSemanticRefs: ['semantic.forest.seed-food'],
        targetSemanticRefs: ['semantic.forest.feeder'],
        evidenceClass: 'guided_practice',
        retryPolicy: 'not_applicable'
      })
    },
    {
      id: 'forest.l3.step.grow-meadow',
      interactionFamily: 'cause_effect',
      semanticDomain: 'plant_care',
      icon: '🦋',
      title: 'Help the flowering patch grow',
      prompt: 'The grove needs plants as well as a shelter and feeding place.',
      instruction: 'Water the planted patch, then observe the flowering grove become active again.',
      consequence: 'Flowers stand up beside the path and butterflies return to the restored grove.',
      scaffold: 'Plants need water to grow; animal visitors use living plants as part of their habitat.',
      worldObjectBefore: 'quiet-dry-grove',
      worldObjectAfter: 'flowering-busy-grove',
      worldAction: worldAction({
        schemaVersion: 1,
        actionId: 'action.forest.l3.grow-meadow',
        family: 'cause_effect',
        action: 'grow',
        canonicalGoalRefs: ['kr.plants.roots.function.absorb-water', 'kr.animals.butterfly.lifecycle.egg-to-butterfly'],
        subjectSemanticRefs: ['semantic.forest.flowering-patch'],
        stateTransition: {
          beforeStateRef: 'state.forest.grove.quiet-dry',
          afterStateRef: 'state.forest.grove.flowering-busy',
          causalKnowledgeRef: 'kr.plants.roots.function.absorb-water'
        },
        evidenceClass: 'exploration',
        retryPolicy: 'not_applicable'
      })
    }
  ]
};

const adventures = [level2, level3] as const;

export function getForestWorldDepthAdventures(): ForestWorldDepthAdventure[] {
  return adventures.map((adventure) => ({
    ...adventure,
    sourceEventRefs: [...adventure.sourceEventRefs],
    steps: adventure.steps.map((step) => ({
      ...step,
      worldAction: validateWorldActionDefinition(step.worldAction),
      ...(step.assembly ? { assembly: validateAssemblyDefinition(step.assembly) } : {})
    }))
  }));
}

export function getForestWorldDepthAdventure(adventureRef: string): ForestWorldDepthAdventure {
  const adventure = getForestWorldDepthAdventures().find((item) => item.adventureRef === adventureRef);
  if (!adventure) throw new Error(`Unknown Forest world-depth adventure ${adventureRef}`);
  return adventure;
}

export function getForestAssemblyProof(): Array<{
  adventureRef: string;
  stepId: string;
  semanticDomain: ForestSemanticDomain;
  definition: AssemblyDefinition;
}> {
  return getForestWorldDepthAdventures().flatMap((adventure) =>
    adventure.steps.flatMap((step) => step.assembly
      ? [{
        adventureRef: adventure.adventureRef,
        stepId: step.id,
        semanticDomain: step.semanticDomain,
        definition: step.assembly
      }]
      : [])
  );
}
