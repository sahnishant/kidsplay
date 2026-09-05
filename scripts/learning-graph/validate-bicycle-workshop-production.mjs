import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const read = (path) => JSON.parse(readFileSync(resolve(ROOT, path), 'utf8'));
const readText = (path) => readFileSync(resolve(ROOT, path), 'utf8');
const invariant = (condition, message) => { if (!condition) throw new Error(message); };
const listJson = (directory) => {
  const root = resolve(ROOT, directory);
  if (!existsSync(root)) return [];
  return readdirSync(root).sort().flatMap((name) => {
    const path = join(root, name);
    return statSync(path).isDirectory() ? listJson(`${directory}/${name}`) : path.endsWith('.json') ? [path] : [];
  });
};
const collectArrays = (directory) => listJson(directory).flatMap((path) => {
  const value = JSON.parse(readFileSync(path, 'utf8'));
  return Array.isArray(value) ? value : [];
});
const questionItems = (question) => {
  const interaction = question.interaction;
  if (interaction.type === 'single_choice') return interaction.options ?? [];
  if (interaction.type === 'word_bank_fill') return interaction.wordBank ?? [];
  if (interaction.type === 'drag_to_target') return [...(interaction.items ?? []), ...(interaction.targets ?? [])];
  if (interaction.type === 'word_search') return interaction.terms ?? [];
  if (interaction.type === 'memory_pairs') return interaction.cards ?? [];
  if (interaction.type === 'sequence_order') return interaction.items ?? [];
  return [];
};
const walk = (value, callback, path = '$') => {
  if (Array.isArray(value)) return value.forEach((item, index) => walk(item, callback, `${path}[${index}]`));
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    callback(key, child, `${path}.${key}`);
    walk(child, callback, `${path}.${key}`);
  }
};
const unique = (values, label) => {
  const result = new Set(values);
  invariant(result.size === values.length, `${label} contains duplicates`);
  return result;
};

export function validateBicycleWorkshopProduction() {
  const policy = read('content/source-policies/mridang-my-bicycle-independent-expression.json');
  const art = read('content/asset-generation/bicycle-workshop-ai-art.json');
  const prompts = read('content/asset-generation/bicycle-workshop-ai-prompts.json');
  const module = read('content/curriculum-modules/ncert/2026-27/class-2/english/mridang/chapters/bicycle-workshop-runtime.json');
  const graph = read('content/learning-graph/modules/bicycle-workshop.json');
  const projection = read('content/knowledge/bicycle-workshop-runtime-projection.json');
  const practicePack = read('content/curriculum-runtime/bicycle-workshop/packs/practice.json');
  const readingPack = read('content/curriculum-runtime/bicycle-workshop/packs/reading.json');
  const chapterCheckPack = read('content/curriculum-runtime/bicycle-workshop/packs/chapter-check.json');
  const chapterCheckBlueprint = read('content/module-assessments/bicycle-workshop-chapter-check.json');
  const questions = collectArrays('content/curriculum-runtime/bicycle-workshop/questions');
  const eagerGlobalQuestionFiles = listJson('content/questions').filter((path) => path.includes('bicycle-workshop'));
  const eagerGlobalPackFiles = listJson('content/packs').filter((path) => path.includes('bicycle-workshop'));
  const runtimeSource = readText('src/experience/bicycleWorkshopRuntime.ts');
  const appSource = readText('src/App.svelte');

  invariant(policy.legalPosture.basis === 'independent_expression_not_fair_dealing', 'Commercial runtime must use independent expression');
  invariant(policy.legalPosture.fairDealingReliedUponForCommercialRuntime === false, 'Fair-dealing reliance must remain false');
  for (const key of ['verbatimCreativeTextAllowed','poemLinesAllowed','exerciseWordingAllowed','sourceDefinitionsAllowed']) {
    invariant(policy.textPolicy[key] === false, `Text boundary weakened: ${key}`);
  }
  for (const key of ['sourceImageInputToGeneratorAllowed','sourcePageInputToGeneratorAllowed','sourceTextInputToImageGeneratorAllowed','imageToImageAllowed','tracingAllowed','poseMatchAllowed','compositionMatchAllowed','layoutMatchAllowed','paletteMatchAllowed','styleImitationAllowed','sourceCharactersOrBrandingAllowed']) {
    invariant(policy.visualPolicy[key] === false, `Visual boundary weakened: ${key}`);
  }
  invariant(policy.visualPolicy.originalCompositionRequired && policy.visualPolicy.graphOnlyPromptRequired, 'Graph-only original visual composition is required');
  invariant(Object.values(art.inputs).every((value) => value === false), 'Source material or style reference was supplied to the visual generator');
  invariant(art.generationStatus === 'prompt_specification_ready_final_assets_not_yet_generated', 'Final AI-art status must remain explicit');
  invariant(art.currentPreview?.usesTextbookPixels === false && art.currentPreview?.isFinalAIAssetPack === false, 'Functional preview must not masquerade as final AI art');
  invariant(prompts.generationMode === 'text_to_image_from_learning_graph_only', 'AI-art prompts must be graph-only');
  invariant(prompts.globalDirection?.sourceReference === 'none', 'AI-art prompt set must not use a source reference');
  invariant(Array.isArray(prompts.assets) && prompts.assets.length === 6, 'Expected six final AI-art briefs');
  for (const asset of prompts.assets) {
    invariant(!/my bicycle|mridang|bemr101|ncert|cbse/i.test(asset.prompt), `${asset.assetId}: source identity leaked into generation prompt`);
    invariant(Array.isArray(asset.semanticRefs) && asset.semanticRefs.length > 0, `${asset.assetId}: semanticRefs required`);
  }

  invariant(module.moduleType === 'independently_authored_curriculum_companion', 'Wrong module type');
  invariant(module.childTitle === 'Bicycle Workshop', 'Independent child title is required');
  invariant(module.sections.length === 7 && module.sections.every((section, index) => section.order === index + 1), 'Seven ordered learning sections are required');
  invariant(module.sections.some((section) => section.id === 'reading'), 'Reading-comprehension section is missing');
  invariant(module.delivery.catalogVisible && module.delivery.offline, 'Companion must be visible and offline');
  invariant(module.delivery.usesCanonicalEvaluator && module.delivery.usesCanonicalProgressStore, 'Canonical evaluator/progress are required');
  invariant(!module.delivery.newEvaluator && !module.delivery.newProgressStore, 'Duplicate evaluator/progress store is forbidden');
  invariant(!module.rightsAndExpression.sourceTextIncluded && !module.rightsAndExpression.sourceArtworkIncluded && !module.rightsAndExpression.sourceLayoutIncluded && !module.rightsAndExpression.sourceNarrationIncluded, 'Protected source expression leaked into runtime module');
  invariant(module.deliveryRefs.practicePackRef === practicePack.id, 'Practice pack is not linked from the module');
  invariant(module.deliveryRefs.readingPackRef === readingPack.id, 'Reading pack is not linked from the module');
  invariant(module.deliveryRefs.chapterCheckPackRef === chapterCheckPack.id, 'Chapter-check pack is not linked from the module');
  invariant(module.deliveryRefs.chapterCheckBlueprintRef === chapterCheckBlueprint.blueprintId, 'Chapter-check blueprint is not linked from the module');
  invariant(module.deliveryRefs.visualGenerationRecordRef === art.generationRecordId, 'Visual-generation record is not linked from the module');
  invariant(module.deliveryRefs.visualPromptSetRef === prompts.promptSetId, 'Visual prompt set is not linked from the module');

  const importedNodes = graph.imports.nodeFiles.flatMap((path) => read(path).nodes ?? []);
  const importedClaims = graph.imports.claimFiles.flatMap((path) => read(path).claims ?? []);
  const nodeIds = new Set([...importedNodes, ...graph.nodes].map((node) => node.id));
  const claimIds = new Set([...importedClaims, ...graph.edges].map((claim) => claim.id));
  invariant(nodeIds.size >= 75, `Graph too small: ${nodeIds.size} nodes`);
  invariant(claimIds.size >= 60, `Graph too small: ${claimIds.size} claims`);
  for (const edge of graph.edges) {
    invariant(nodeIds.has(edge.from), `${edge.id}: unknown source node ${edge.from}`);
    invariant(nodeIds.has(edge.to), `${edge.id}: unknown target node ${edge.to}`);
    invariant(Array.isArray(edge.conceptIds) && edge.conceptIds.length > 0, `${edge.id}: conceptIds required`);
  }
  for (const process of graph.processes) {
    for (const ref of [...(process.orderedEdgeRefs ?? []), ...(process.parallelEdgeRefs ?? [])]) invariant(claimIds.has(ref), `${process.id}: unknown edge ${ref}`);
  }
  for (const misconception of graph.misconceptions) for (const ref of misconception.repairWith) invariant(claimIds.has(ref), `${misconception.id}: unknown repair claim ${ref}`);
  invariant(module.graphClaimRefs.length === 29, 'Expected 29 admitted runtime claims');
  for (const ref of module.graphClaimRefs) {
    invariant(claimIds.has(ref), `Runtime module has unknown claim ${ref}`);
    invariant(!ref.startsWith('claim.chapter.'), `Chapter-local claim leaked into runtime mastery: ${ref}`);
  }

  const projectionById = new Map(projection.entries.map((row) => [row.rowId, row]));
  invariant(projection.canonicalSource.kind === 'learning_graph', 'Runtime projection must name Learning Graph authority');
  invariant(projection.entries.length === 29, 'Expected 29 runtime projection rows');
  for (const row of projection.entries) {
    invariant(row.rowId === row.graphClaimRef, `${row.rowId}: graph identity changed in projection`);
    invariant(claimIds.has(row.graphClaimRef), `${row.rowId}: unknown graph claim`);
    invariant(row.meta?.runtimeProjection === true && row.meta?.canonicalAuthority === 'learning_graph', `${row.rowId}: projection authority missing`);
  }

  invariant(questions.length === 32, `Expected 32 questions, found ${questions.length}`);
  const questionById = new Map(questions.map((question) => [question.id, question]));
  invariant(questionById.size === questions.length, 'Bicycle Workshop question IDs must be unique');
  const families = new Set(questions.map((question) => question.interaction.type));
  for (const family of ['single_choice','word_bank_fill','drag_to_target','sequence_order','memory_pairs','word_search']) invariant(families.has(family), `Missing activity family ${family}`);
  for (const question of questions) {
    invariant(question.authoring?.source === 'kidsplay-independent-curriculum-companion' && question.authoring?.status === 'reviewed', `${question.id}: wrong authoring authority`);
    invariant(!/my bicycle/i.test(question.prompt?.text ?? ''), `${question.id}: source chapter title leaked into child prompt`);
    for (const ref of question.knowledgeRefs ?? []) {
      invariant(projectionById.has(ref), `${question.id}: unknown runtime knowledge ref ${ref}`);
      invariant(!ref.startsWith('claim.chapter.'), `${question.id}: chapter-context claim used as mastery`);
    }
    if (question.id.startsWith('bicycle.workshop.reading.')) {
      invariant(!question.knowledgeRefs?.length, `${question.id}: reading comprehension must not grant supporting bicycle knowledge`);
    }
    for (const item of questionItems(question)) for (const visualRef of item.visualRefs ?? []) invariant(typeof visualRef === 'string' && visualRef.length > 0, `${question.id}/${item.id}: invalid visualRef`);
    walk(question, (key, value, path) => {
      invariant(!['sourceText','poemText','exerciseText','sourceArtwork','sourceImage'].includes(key), `${question.id}: prohibited field at ${path}`);
      if (typeof value === 'string') {
        invariant(!value.includes('bemr101.pdf'), `${question.id}: source file leaked into runtime`);
        invariant(!/https?:\/\//i.test(value), `${question.id}: network URL in offline question`);
      }
    });
  }

  invariant(practicePack.id === module.questionPackRef && practicePack.kind === 'learning_pack', 'Module/practice-pack mismatch');
  invariant(practicePack.status === 'reviewed' && practicePack.catalogVisible && practicePack.access?.type === 'free', 'Practice pack must be reviewed, visible and free');
  invariant(practicePack.questionRefs.length === 28 && unique(practicePack.questionRefs, 'Practice pack').size === 28, 'Practice pack must contain 28 direct questions');
  invariant(JSON.stringify(practicePack.includePackRefs) === JSON.stringify([readingPack.id]), 'Practice pack must compose exactly the reading slice');
  invariant(readingPack.catalogVisible === false && readingPack.questionRefs.length === 4, 'Reading slice must be hidden and contain four questions');
  for (const ref of [...practicePack.questionRefs, ...readingPack.questionRefs]) invariant(questionById.has(ref), `Practice composition has unknown question ${ref}`);
  invariant(new Set([...practicePack.questionRefs, ...readingPack.questionRefs]).size === 32, 'Practice composition must expose 32 unique questions');
  invariant(practicePack.authoring.sourceTextCopied === false && practicePack.authoring.sourceArtworkCopied === false, 'Practice-pack copy boundary weakened');

  invariant(chapterCheckPack.questionRefs.length === 8 && unique(chapterCheckPack.questionRefs, 'Chapter-check pack').size === 8, 'Chapter check must contain eight unique questions');
  for (const ref of chapterCheckPack.questionRefs) invariant(questionById.has(ref), `Chapter check has unknown question ${ref}`);
  invariant(chapterCheckPack.assessmentScope?.blueprintRef === chapterCheckBlueprint.blueprintId, 'Chapter check does not name its blueprint');
  invariant(chapterCheckBlueprint.packRef === chapterCheckPack.id, 'Chapter-check blueprint/pack mismatch');
  invariant(chapterCheckBlueprint.totalQuestions === 8 && chapterCheckBlueprint.totalMarks === 8, 'Chapter check must be an eight-question, eight-mark blueprint');
  const blueprintQuestionRefs = chapterCheckBlueprint.sections.flatMap((section) => section.questionRefs);
  invariant(JSON.stringify(blueprintQuestionRefs) === JSON.stringify(chapterCheckPack.questionRefs), 'Chapter-check section order must equal the fixed pack order');
  invariant(chapterCheckBlueprint.officialPaperClaimed === false && chapterCheckBlueprint.sourcePassageReproduced === false && chapterCheckBlueprint.sourceExerciseWordingReproduced === false, 'Chapter-check rights boundary weakened');

  invariant(eagerGlobalQuestionFiles.length === 0, `Chapter questions leaked into eager global bank: ${eagerGlobalQuestionFiles.join(', ')}`);
  invariant(eagerGlobalPackFiles.length === 0, `Chapter packs leaked into eager global catalogue: ${eagerGlobalPackFiles.join(', ')}`);
  invariant(runtimeSource.includes("../../content/curriculum-runtime/bicycle-workshop/questions/core.json"), 'Lazy runtime does not own the chapter question bank');
  invariant(runtimeSource.includes('createBicycleWorkshopSession'), 'Lazy runtime has no session factory');
  invariant(!runtimeSource.includes("from '../content'\n") && !runtimeSource.includes("from '../content';\n"), 'Lazy runtime must not import global content at runtime');
  invariant(appSource.includes("import('./experience/bicycleWorkshopRuntime')"), 'Application does not dynamically import the chapter runtime');
  invariant(!appSource.includes("import { createBicycleWorkshopSession"), 'Application statically imports the chapter runtime');

  const visualIds = new Set(collectArrays('content/visuals').map((visual) => visual.id));
  const animations = collectArrays('content/animations');
  const animationIds = new Set(animations.map((animation) => animation.id));
  const scenes = collectArrays('content/scenes');
  const sceneIds = new Set(scenes.map((scene) => scene.id));
  for (const ref of module.sceneRefs) invariant(sceneIds.has(ref), `Unknown scene ${ref}`);
  for (const scene of scenes.filter((item) => item.id.startsWith('scene.bicycle-workshop.'))) invariant(animationIds.has(scene.animationRef), `${scene.id}: unknown animation`);
  for (const animation of animations.filter((item) => item.id.startsWith('animation.bicycle-workshop.'))) {
    invariant(visualIds.has(animation.subject.variantRef), `${animation.id}: unknown subject visual`);
    for (const part of animation.parts ?? []) if (part.visualRef) invariant(visualIds.has(part.visualRef), `${animation.id}/${part.id}: unknown visual`);
  }
  for (const question of questions) {
    for (const item of questionItems(question)) {
      for (const visualRef of item.visualRefs ?? []) invariant(visualIds.has(visualRef), `${question.id}/${item.id}: unknown visual ${visualRef}`);
    }
  }

  return {
    moduleId: module.moduleId,
    sectionCount: module.sections.length,
    graphNodeCount: nodeIds.size,
    graphClaimCount: claimIds.size,
    admittedClaimCount: module.graphClaimRefs.length,
    projectionRowCount: projection.entries.length,
    questionCount: questions.length,
    practiceQuestionCount: new Set([...practicePack.questionRefs, ...readingPack.questionRefs]).size,
    chapterCheckQuestionCount: chapterCheckPack.questionRefs.length,
    activityFamilies: [...families].sort(),
    sceneCount: module.sceneRefs.length,
    aiArtBriefCount: prompts.assets.length,
    sourceImagesUsedForGeneration: art.inputs.sourceIllustrationProvidedToGenerator,
    finalAiArtStatus: art.generationStatus,
    eagerGlobalQuestionCount: eagerGlobalQuestionFiles.length,
    eagerGlobalPackCount: eagerGlobalPackFiles.length
  };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    const result = validateBicycleWorkshopProduction();
    console.log(process.argv.includes('--json') ? JSON.stringify(result) : `Validated ${result.moduleId}: ${result.questionCount} lazy questions, ${result.chapterCheckQuestionCount}-question chapter check, ${result.activityFamilies.length} activity families.`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
