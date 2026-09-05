import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const read = (path) => JSON.parse(readFileSync(resolve(ROOT, path), 'utf8'));
const text = (path) => readFileSync(resolve(ROOT, path), 'utf8');
const invariant = (condition, message) => { if (!condition) throw new Error(message); };

export function validateBicycleWorkshopPresentation() {
  const guide = read('content/experience/bicycle-workshop-guided.json');
  const practicePack = read('content/curriculum-runtime/bicycle-workshop/packs/practice.json');
  const chapterCheckPack = read('content/curriculum-runtime/bicycle-workshop/packs/chapter-check.json');
  const viewport = text('src/ui/BicycleWorkshopViewport.svelte');
  const home = text('src/ui/HomeViewport.svelte');

  invariant(guide.mode === 'non_evaluative_guided_learning', 'Guided chapter must remain non-evaluative');
  invariant(guide.sections.length === 7, `Expected seven learning sections, found ${guide.sections.length}`);
  invariant(guide.sections.every((section, index) => section.order === index + 1), 'Guided sections must remain in deterministic order');
  invariant(new Set(guide.sections.map((section) => section.id)).size === guide.sections.length, 'Guided section IDs must be unique');
  invariant(guide.practicePackRef === practicePack.id, 'Guided chapter points to an unknown practice pack');
  invariant(guide.chapterCheckPackRef === chapterCheckPack.id, 'Guided chapter points to an unknown chapter-check pack');
  invariant(guide.evidencePolicy.viewingWritesMastery === false, 'Viewing a chapter page must not write mastery');
  invariant(guide.evidencePolicy.navigationWritesMastery === false, 'Navigating chapter pages must not write mastery');
  invariant(guide.sections.some((section) => section.id === 'reading'), 'Guided chapter is missing its reading section');
  invariant(guide.sections.every((section) => section.animationRef || section.visualRef), 'Every guided section needs a visible semantic presentation');
  invariant(guide.sections.every((section) => section.lookPrompt && section.remember && section.childPrompt), 'Every guided section needs look, remember and try scaffolds');

  invariant(viewport.includes('SemanticVisualPresenter'), 'Guided chapter is not using the canonical visual presenter');
  invariant(viewport.includes('Previous') && viewport.includes('Next idea') && viewport.includes('Next part'), 'Guided chapter navigation is incomplete');
  invariant(viewport.includes('LOOK') && viewport.includes('LEARN') && viewport.includes('YOUR TURN'), 'Guided chapter pacing cues are incomplete');
  invariant(viewport.includes('Practice') && viewport.includes('Chapter check'), 'Guided chapter completion actions are incomplete');
  invariant(viewport.includes('No score here — just explore.'), 'Non-mastery wording is missing');
  invariant(home.includes("openView('bicycle-workshop')"), 'Practice catalogue does not open the guided chapter');
  invariant(home.includes("onStart('free.english.bicycle-workshop.1')"), 'Guided chapter does not launch the lazy practice pack');
  invariant(home.includes("onStart('free.english.bicycle-workshop.chapter-check.1')"), 'Guided chapter does not launch the lazy chapter check');

  return {
    experienceId: guide.experienceId,
    sectionCount: guide.sections.length,
    practicePackRef: guide.practicePackRef,
    chapterCheckPackRef: guide.chapterCheckPackRef,
    browsingMasteryEvidence: 'none'
  };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    const result = validateBicycleWorkshopPresentation();
    console.log(process.argv.includes('--json') ? JSON.stringify(result) : `Validated ${result.experienceId}: ${result.sectionCount} guided learning sections.`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
