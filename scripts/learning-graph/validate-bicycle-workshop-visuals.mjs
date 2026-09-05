import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const read = (path) => JSON.parse(readFileSync(resolve(ROOT, path), 'utf8'));
const text = (path) => readFileSync(resolve(ROOT, path), 'utf8');
const invariant = (condition, message) => { if (!condition) throw new Error(message); };

function presentableItems(question) {
  const interaction = question.interaction;
  if (interaction.type === 'single_choice') return interaction.options ?? [];
  if (interaction.type === 'word_bank_fill') return interaction.wordBank ?? [];
  if (interaction.type === 'drag_to_target') return [...(interaction.items ?? []), ...(interaction.targets ?? [])];
  if (interaction.type === 'word_search') return interaction.terms ?? [];
  if (interaction.type === 'memory_pairs') return interaction.cards ?? [];
  if (interaction.type === 'sequence_order') return interaction.items ?? [];
  return [];
}

function readQuestions() {
  return readdirSync(resolve(ROOT, 'content/curriculum-runtime/bicycle-workshop/questions'))
    .filter((name) => name.endsWith('.json'))
    .sort()
    .flatMap((name) => read(`content/curriculum-runtime/bicycle-workshop/questions/${name}`));
}

export function validateBicycleWorkshopVisuals() {
  const art = read('content/asset-generation/bicycle-workshop-ai-art.json');
  const guide = read('content/experience/bicycle-workshop-guided.json');
  const allVisuals = readdirSync(resolve(ROOT, 'content/visuals'))
    .filter((name) => name.endsWith('.json'))
    .sort()
    .flatMap((name) => read(`content/visuals/${name}`));
  const allVisualIds = new Set(allVisuals.map((visual) => visual.id));
  const allAnimations = readdirSync(resolve(ROOT, 'content/animations'))
    .filter((name) => name.endsWith('.json'))
    .sort()
    .flatMap((name) => read(`content/animations/${name}`));
  const allAnimationIds = new Set(allAnimations.map((animation) => animation.id));
  const questions = readQuestions();
  const viewport = text('src/ui/BicycleWorkshopViewport.svelte');

  const explicitQuestionRefs = [];
  for (const question of questions) {
    for (const item of presentableItems(question)) {
      for (const visualRef of item.visualRefs ?? []) {
        invariant(allVisualIds.has(visualRef), `${question.id}/${item.id}: unresolved visualRef ${visualRef}`);
        explicitQuestionRefs.push(visualRef);
      }
    }
  }

  const guidedVisualRefs = guide.sections.flatMap((section) => section.visualRef ? [section.visualRef] : []);
  const guidedAnimationRefs = guide.sections.flatMap((section) => section.animationRef ? [section.animationRef] : []);
  for (const visualRef of guidedVisualRefs) invariant(allVisualIds.has(visualRef), `Guided chapter has unresolved visualRef ${visualRef}`);
  for (const animationRef of guidedAnimationRefs) invariant(allAnimationIds.has(animationRef), `Guided chapter has unresolved animationRef ${animationRef}`);

  for (const required of [
    'entity.transport.bicycle',
    'entity.bicycle-part.pedal',
    'entity.bicycle-part.brake',
    'entity.bicycle-part.handlebar',
    'entity.safety.helmet',
    'animation.variant.bicycle-workshop-neutral'
  ]) invariant(allVisualIds.has(required), `Missing canonical visual ${required}`);

  const customRendererUsed = allVisuals.some((visual) => visual.renderer === 'bicycle-workshop-icon');
  invariant(customRendererUsed === false, 'Bicycle Workshop must reuse the canonical visual adapter instead of adding a parallel renderer');
  invariant(viewport.includes('SemanticVisualPresenter'), 'Bicycle Workshop does not render through the canonical semantic presenter');
  invariant(!viewport.includes("from '../presentation/VisualEntity.svelte'"), 'Bicycle Workshop bypasses the canonical visual presenter');
  invariant(!viewport.includes("from '../presentation/SemanticAnimation.svelte'"), 'Bicycle Workshop bypasses the canonical animation presenter');

  invariant(Object.values(art.inputs).every((value) => value === false), 'A source page, image, text, style, pose or layout reached the art generator');
  invariant(art.currentPreview?.usesTextbookPixels === false, 'The functional preview must not use textbook pixels');
  invariant(art.review.humanSimilarityReview === 'required_before_commercial_release', 'Human visual-similarity review must remain a release gate');

  const registeredWorkshopVisualCount = allVisuals.filter((visual) =>
    visual.id.startsWith('entity.bicycle-part.')
      || visual.id.startsWith('entity.bicycle-step.')
      || visual.id.startsWith('animation.variant.bicycle-workshop.')
  ).length;

  return {
    registeredWorkshopVisualCount,
    explicitQuestionReferenceCount: explicitQuestionRefs.length,
    guidedVisualCount: guidedVisualRefs.length,
    guidedAnimationCount: guidedAnimationRefs.length,
    customRendererUsed,
    sourceImageInputsUsed: Object.values(art.inputs).some(Boolean),
    humanSimilarityReview: art.review.humanSimilarityReview
  };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    const result = validateBicycleWorkshopVisuals();
    console.log(process.argv.includes('--json') ? JSON.stringify(result) : `Validated ${result.registeredWorkshopVisualCount} canonical Bicycle Workshop visuals with ${result.explicitQuestionReferenceCount} explicit question references.`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
