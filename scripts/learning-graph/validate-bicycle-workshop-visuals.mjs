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

export function validateBicycleWorkshopVisuals() {
  const art = read('content/asset-generation/bicycle-workshop-ai-art.json');
  const workshopVisuals = read('content/visuals/bicycle-workshop.json');
  const allVisuals = readdirSync(resolve(ROOT, 'content/visuals'))
    .filter((name) => name.endsWith('.json'))
    .sort()
    .flatMap((name) => read(`content/visuals/${name}`));
  const allVisualIds = new Set(allVisuals.map((visual) => visual.id));
  const questions = [
    ...read('content/questions/bicycle-workshop-core.json'),
    ...read('content/questions/bicycle-workshop-play.json'),
    ...read('content/questions/bicycle-workshop-exam-extra.json')
  ];
  const renderer = text('src/presentation/BicycleWorkshopIcon.svelte');
  const visualEntity = text('src/presentation/VisualEntity.svelte');
  const registry = text('src/presentation/visualRegistry.ts');

  invariant(workshopVisuals.length === 12, `Expected 12 dedicated visual registrations, found ${workshopVisuals.length}`);
  invariant(workshopVisuals.every((visual) => visual.id.startsWith('visual.bicycle-workshop.')), 'Dedicated visual IDs must be presentation-namespaced');
  invariant(workshopVisuals.every((visual) => visual.renderer === 'bicycle-workshop-icon'), 'Every dedicated visual must use the original Bicycle Workshop renderer');
  invariant(new Set(workshopVisuals.map((visual) => visual.id)).size === workshopVisuals.length, 'Duplicate dedicated visual ID');
  invariant(!workshopVisuals.some((visual) => visual.id === 'entity.vehicle.bicycle' || visual.id === 'entity.part.bicycle.bell'), 'Graph IDs must not be reused as colliding presentation IDs');

  const dedicatedRefs = [];
  for (const question of questions) {
    for (const item of presentableItems(question)) {
      for (const visualRef of item.visualRefs ?? []) {
        invariant(allVisualIds.has(visualRef), `${question.id}/${item.id}: unresolved visualRef ${visualRef}`);
        if (visualRef.startsWith('visual.bicycle-workshop.')) dedicatedRefs.push(visualRef);
      }
    }
  }
  const dedicatedUsed = new Set(dedicatedRefs);
  invariant(dedicatedRefs.length >= 40, `Expected broad original-art use, found ${dedicatedRefs.length} references`);
  invariant(dedicatedUsed.size >= 10, `Expected at least 10 distinct original part visuals in child activities, found ${dedicatedUsed.size}`);
  for (const required of [
    'visual.bicycle-workshop.bicycle-wheel',
    'visual.bicycle-workshop.bicycle-tyre',
    'visual.bicycle-workshop.bicycle-pedal',
    'visual.bicycle-workshop.bicycle-handlebar',
    'visual.bicycle-workshop.bicycle-brake',
    'visual.bicycle-workshop.bicycle-bell',
    'visual.bicycle-workshop.bicycle-seat',
    'visual.bicycle-workshop.bicycle-carrier',
    'visual.bicycle-workshop.bicycle-chain',
    'visual.bicycle-workshop.bicycle-crank',
    'visual.bicycle-workshop.bicycle-cycling-helmet'
  ]) invariant(dedicatedUsed.has(required), `Original child activities do not consume ${required}`);

  invariant(renderer.includes("icon === 'bicycle'"), 'Original whole-bicycle glyph is missing');
  invariant(renderer.includes("icon === 'pedal'") && renderer.includes("icon === 'brake'") && renderer.includes("icon === 'cycling-helmet'"), 'Required original part glyphs are missing');
  invariant(!/<img\b/i.test(renderer), 'Dedicated renderer must not embed source or external images');
  invariant(!/https?:\/\//i.test(renderer), 'Dedicated renderer must not fetch network art');
  invariant(visualEntity.includes("visual.renderer === 'bicycle-workshop-icon'"), 'VisualEntity does not route the dedicated renderer');
  invariant(registry.includes("'bicycle-workshop-icon'"), 'VisualRenderer type does not admit the dedicated renderer');

  invariant(Object.values(art.inputs).every((value) => value === false), 'A source page, image, text, style, pose or layout reached the art generator');
  invariant(art.outputs.every((output) => output.sourcePixelsUsed === false), 'An output records source-pixel use');
  invariant(art.review.humanSimilarityReview === 'required_before_commercial_release', 'Human visual-similarity review must remain a release gate');

  for (const id of ['bicycle.workshop.identity.001', 'bicycle.workshop.human-power.001']) {
    const question = questions.find((item) => item.id === id);
    invariant(question && question.stimulus === undefined, `${id}: answer-revealing bicycle scene must not appear before the answer`);
  }

  return {
    dedicatedVisualCount: workshopVisuals.length,
    dedicatedReferenceCount: dedicatedRefs.length,
    distinctDedicatedVisualsUsed: dedicatedUsed.size,
    sourceImageInputsUsed: Object.values(art.inputs).some(Boolean),
    humanSimilarityReview: art.review.humanSimilarityReview
  };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    const result = validateBicycleWorkshopVisuals();
    console.log(process.argv.includes('--json') ? JSON.stringify(result) : `Validated ${result.dedicatedVisualCount} original Bicycle Workshop visuals across ${result.dedicatedReferenceCount} child-facing references.`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
