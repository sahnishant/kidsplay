import { readdirSync, readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const readJson = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const readText = (path) => readFileSync(new URL(path, root), 'utf8');
const jsonArrays = (dir) => readdirSync(new URL(dir, root))
  .filter((name) => name.endsWith('.json'))
  .sort()
  .flatMap((name) => {
    const value = readJson(`${dir}${name}`);
    return Array.isArray(value) ? value : [];
  });

const visuals = jsonArrays('content/visuals/');
const compositions = jsonArrays('content/animations/');
const scenes = jsonArrays('content/scenes/');
const questions = jsonArrays('content/questions/');
const assetRegistry = readJson('content/assets/registry.json');

const visualIds = new Set(visuals.map((visual) => visual.id).filter(Boolean));
const animationsById = new Map(compositions.map((composition) => [composition.id, composition]));
const scenesById = new Map(scenes.map((scene) => [scene.id, scene]));
const assetBackedVisualRefs = new Set(
  (assetRegistry.assets ?? []).flatMap((asset) => Array.isArray(asset.visualRefs) ? asset.visualRefs : [])
);

const compositionVisualRefs = new Set();
const unresolvedCompositionRefs = [];
const staticFallbackFailures = [];
const identities = new Map();

for (const composition of compositions) {
  const states = identities.get(composition.semanticRef) ?? [];
  states.push(composition.id);
  identities.set(composition.semanticRef, states);

  const refs = [composition.subject?.variantRef, ...(composition.parts ?? []).map((part) => part.visualRef)]
    .filter(Boolean);
  for (const visualRef of refs) {
    compositionVisualRefs.add(visualRef);
    if (!visualIds.has(visualRef)) unresolvedCompositionRefs.push(`${composition.id}: ${visualRef}`);
  }

  const staticMeaningful = typeof composition.ariaLabel === 'string' && composition.ariaLabel.trim().length > 0 &&
    typeof composition.subject?.variantRef === 'string' && composition.subject.variantRef.length > 0 &&
    Array.isArray(composition.parts) && composition.parts.every((part) =>
      Boolean(part.visualRef) !== Boolean(typeof part.text === 'string' && part.text.trim().length > 0)
    );
  if (!staticMeaningful) staticFallbackFailures.push(composition.id);
}

const composedScenes = scenes.filter((scene) => typeof scene.animationRef === 'string' && scene.animationRef.length > 0);
const usedAnimationIds = new Set(composedScenes.map((scene) => scene.animationRef));
const unresolvedSceneAnimations = [];
const sceneThemeMismatches = [];
for (const scene of composedScenes) {
  const animation = animationsById.get(scene.animationRef);
  if (!animation) unresolvedSceneAnimations.push(`${scene.id}: ${scene.animationRef}`);
  else if (scene.theme !== animation.theme) sceneThemeMismatches.push(`${scene.id}: ${scene.theme} != ${animation.theme}`);
}

const presentableItems = (question) => {
  const interaction = question?.interaction;
  if (!interaction) return [];
  if (interaction.type === 'single_choice') return interaction.options ?? [];
  if (interaction.type === 'word_bank_fill') return interaction.wordBank ?? [];
  if (interaction.type === 'drag_to_target') return [...(interaction.items ?? []), ...(interaction.targets ?? [])];
  if (interaction.type === 'word_search') return interaction.terms ?? [];
  if (interaction.type === 'memory_pairs') return interaction.cards ?? [];
  if (interaction.type === 'sequence_order') return interaction.items ?? [];
  if (interaction.type === 'hotspot') return interaction.board?.regions ?? [];
  return [];
};

const questionVisualRefs = new Set();
const unresolvedQuestionVisualRefs = [];
const unknownExplicitScenes = [];
for (const question of questions) {
  if (question.stimulus?.type === 'scene' && !scenesById.has(question.stimulus.sceneId)) {
    unknownExplicitScenes.push(`${question.id}: ${question.stimulus.sceneId}`);
  }
  for (const item of presentableItems(question)) {
    for (const visualRef of item.visualRefs ?? []) {
      questionVisualRefs.add(visualRef);
      if (!visualIds.has(visualRef)) unresolvedQuestionVisualRefs.push(`${question.id}/${item.id}: ${visualRef}`);
    }
  }
}

const childFacingCompositionVisualRefs = new Set();
for (const composition of compositions) {
  if (!usedAnimationIds.has(composition.id)) continue;
  childFacingCompositionVisualRefs.add(composition.subject.variantRef);
  for (const part of composition.parts ?? []) {
    if (part.visualRef) childFacingCompositionVisualRefs.add(part.visualRef);
  }
}
const childFacingUsedVisualRefs = new Set([...questionVisualRefs, ...childFacingCompositionVisualRefs]);

const policyFailures = [];
const questionSceneSource = readText('src/presentation/questionScene.ts');
const explicitStimulusIndex = questionSceneSource.indexOf("question.stimulus?.type === 'scene'");
const inferredGuardIndex = questionSceneSource.indexOf('!allowInferredScene');
if (explicitStimulusIndex < 0 || inferredGuardIndex < 0 || explicitStimulusIndex > inferredGuardIndex) {
  policyFailures.push('questionScene: explicit authored scene precedence / inferred-assessment suppression contract missing');
}

const sessionSource = readText('src/ui/SessionViewport.svelte');
const reinforcementBlock = sessionSource.match(/let reinforcementSceneId = \$derived\(([\s\S]*?)\);/m)?.[1] ?? '';
if (!reinforcementBlock.includes('sessionState.submitted')) {
  policyFailures.push('SessionViewport: inferred reinforcement is not explicitly gated on a committed response');
}
if (!reinforcementBlock.includes('sections.length === 0')) {
  policyFailures.push('SessionViewport: inferred reinforcement is not explicitly suppressed for structured assessment sections');
}

const semanticAnimationSource = readText('src/presentation/SemanticAnimation.svelte');
if (!semanticAnimationSource.includes('@media (prefers-reduced-motion: reduce)') ||
    !semanticAnimationSource.includes('animation: none !important')) {
  policyFailures.push('SemanticAnimation: reduced-motion animation suppression contract missing');
}

const multipleStateIdentities = [...identities.entries()]
  .filter(([, stateIds]) => stateIds.length > 1)
  .sort(([left], [right]) => left.localeCompare(right));
const unusedCompositionIds = compositions
  .map((composition) => composition.id)
  .filter((id) => !usedAnimationIds.has(id))
  .sort();
const wholeObjectCompositionRefs = [...compositionVisualRefs].filter((ref) => assetBackedVisualRefs.has(ref)).sort();
const inlineCompositionRefs = [...compositionVisualRefs].filter((ref) => !assetBackedVisualRefs.has(ref)).sort();

const safetyFailures = [
  ...unresolvedCompositionRefs,
  ...unresolvedSceneAnimations,
  ...sceneThemeMismatches,
  ...unresolvedQuestionVisualRefs,
  ...unknownExplicitScenes,
  ...unusedCompositionIds.map((id) => `${id}: authored semantic composition has no child-facing scene owner`),
  ...staticFallbackFailures.map((id) => `${id}: missing static/reduced-motion meaning`),
  ...policyFailures
];

const report = {
  registeredSemanticVisuals: visualIds.size,
  childFacingUsedVisuals: childFacingUsedVisualRefs.size,
  authoredCompositions: compositions.length,
  composedChildFacingScenes: composedScenes.length,
  usedCompositions: usedAnimationIds.size,
  unusedAuthoredCompositions: unusedCompositionIds.length,
  semanticIdentities: identities.size,
  identitiesWithMultipleStates: multipleStateIdentities.length,
  staticReducedMotionMeaningfulCompositions: compositions.length - staticFallbackFailures.length,
  unresolvedCompositionVisualRefs: unresolvedCompositionRefs.length,
  unresolvedSceneAnimationRefs: unresolvedSceneAnimations.length,
  sceneThemeMismatches: sceneThemeMismatches.length,
  unresolvedQuestionVisualRefs: unresolvedQuestionVisualRefs.length,
  unknownExplicitQuestionScenes: unknownExplicitScenes.length,
  assessmentPresentationPolicyFailures: policyFailures.length,
  wholeObjectAssetCompositionRefs: wholeObjectCompositionRefs.length,
  inlineRendererCompositionRefs: inlineCompositionRefs.length,
  safetyFailures: safetyFailures.length
};

console.log('# Semantic animation coverage and safety report');
console.log(`Registered semantic visuals: ${report.registeredSemanticVisuals}`);
console.log(`Child-facing used visual refs: ${report.childFacingUsedVisuals}`);
console.log(`Authored semantic compositions: ${report.authoredCompositions}`);
console.log(`Composed child-facing scenes: ${report.composedChildFacingScenes}`);
console.log(`Used compositions: ${report.usedCompositions}/${report.authoredCompositions}`);
console.log(`Semantic identities: ${report.semanticIdentities}; multi-state identities: ${report.identitiesWithMultipleStates}`);
console.log(`Static/reduced-motion meaningful compositions: ${report.staticReducedMotionMeaningfulCompositions}/${report.authoredCompositions}`);
console.log(`Composition refs by capability: ${report.wholeObjectAssetCompositionRefs} asset-backed whole-object / ${report.inlineRendererCompositionRefs} inline-renderer refs`);
console.log(`Assessment/presentation policy failures: ${report.assessmentPresentationPolicyFailures}`);
console.log(`Total safety/reference failures: ${report.safetyFailures}`);

console.log('\n## Architecture breadth vs shipped child-facing breadth');
console.log(`- authored compositions: ${report.authoredCompositions}`);
console.log(`- compositions referenced by child-facing scenes: ${report.usedCompositions}`);
console.log(`- authored but not yet scene-integrated: ${report.unusedAuthoredCompositions}`);
if (unusedCompositionIds.length) console.log(`- pending integration ids: ${unusedCompositionIds.join(', ')}`);

console.log('\n## Multi-state semantic identities');
if (!multipleStateIdentities.length) console.log('- none');
for (const [semanticRef, stateIds] of multipleStateIdentities) {
  console.log(`- ${semanticRef}: ${stateIds.length} state(s) — ${stateIds.sort().join(', ')}`);
}

console.log('\n## Safety/reference diagnostics');
if (!safetyFailures.length) console.log('- none');
for (const failure of safetyFailures.sort()) console.log(`- ${failure}`);

if (process.argv.includes('--json')) console.log(`\n${JSON.stringify(report, null, 2)}`);
if (safetyFailures.length) process.exitCode = 1;
