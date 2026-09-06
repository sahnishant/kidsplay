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
  const stage = text('src/ui/BicycleStoryStage.svelte');
  const stageCss = text('src/ui/bicycleStoryStage.css');
  const bikeAsset = text('src/ui/bicycleStoryBike.svg');
  const mechanism = text('src/presentation/BicycleMechanismDemonstration.svelte');
  const home = text('src/ui/HomeViewport.svelte');

  invariant(guide.mode === 'non_evaluative_guided_learning', 'Guided chapter must remain non-evaluative');
  invariant(guide.sections.length === 7, `Expected seven learning sections, found ${guide.sections.length}`);
  invariant(guide.sections.every((section, index) => section.order === index + 1), 'Guided sections must remain in deterministic order');
  invariant(new Set(guide.sections.map((section) => section.id)).size === guide.sections.length, 'Guided section IDs must be unique');
  invariant(guide.practicePackRef === practicePack.id && guide.chapterCheckPackRef === chapterCheckPack.id, 'Guided chapter points to an unknown assessed pack');
  invariant(guide.evidencePolicy.viewingWritesMastery === false && guide.evidencePolicy.navigationWritesMastery === false, 'Browsing the chapter must not write mastery');
  invariant(guide.sections.some((section) => section.id === 'reading') && guide.sections.some((section) => section.id === 'magic'), 'Guided chapter is missing reading or creative story sections');
  invariant(guide.sections.every((section) => section.animationRef || section.visualRef), 'Every guided section needs canonical visual authority');
  invariant(guide.sections.every((section) => section.storyMode && section.lookPrompt && section.remember && section.childPrompt), 'Every guided section needs story projection plus look, remember and try scaffolds');

  invariant(viewport.includes('BicycleStoryStage') && viewport.includes('data-visual-ref'), 'Guided chapter is not using the canonical interactive story projection');
  invariant(stage.includes('bicycleStoryBike.svg?url'), 'Interactive story projection is missing its original bicycle asset');
  invariant(stage.includes('part-focus') && stage.includes('focusRun') && stage.includes('it will flash'), 'Bicycle part finder must replay an explicit high-salience focus cue');
  invariant(stage.includes('partHitRegions') && stage.includes('selectPart(hit.id)') && stage.includes('selectPart(part.id)'), 'Bicycle picture and label buttons must share the same part-selection behavior');
  invariant(stage.includes('Tap a word or the bicycle part'), 'Bicycle part finder must tell children that the illustration itself is tappable');
  invariant(stageCss.includes('.part-hit') && stageCss.includes('touch-action:manipulation') && stageCss.includes('pointer-events:auto'), 'Bicycle part finder is missing direct touch targets over the illustration');
  invariant(stageCss.includes('.part-focus-outline') && stageCss.includes('part-splash') && stageCss.includes('0 0 0 999px'), 'Bicycle part finder is missing its spotlight/splash treatment');
  invariant(!stage.includes('yellow ring'), 'Legacy low-salience yellow-ring instruction returned');
  invariant(mechanism.includes("bicycleStoryBike.svg?raw") && mechanism.includes('{@html bikeSvg}'), 'Look Inside must render the same colorful Bicycle Workshop asset');
  invariant(bikeAsset.includes('bike-crank') && bikeAsset.includes('bike-pedal-orbit') && bikeAsset.includes('bike-pedal-level'), 'Canonical bicycle asset is missing semantic drivetrain animation groups');
  invariant(mechanism.includes('drivetrainTurning') && mechanism.includes('pedal-counterturn'), 'Pedals must orbit with the crank while counter-rotating to stay level');
  invariant(mechanism.includes('cx="355" cy="280" r="34"') && mechanism.includes('crank-arrow') && mechanism.includes('M355 230 A50 50'), 'Crank focus cue must remain concentric with the canonical 355,280 crank centre');
  invariant(mechanism.includes('mechanism__overlay') && mechanism.includes('mechanism-crank') && mechanism.includes('mechanism-chain') && mechanism.includes('mechanism-wheel'), 'Look Inside must teach mechanics as overlays on the shared colorful bicycle');
  invariant(!mechanism.includes('class="frame"'), 'Look Inside returned to a separate monochrome bicycle drawing');
  invariant(viewport.includes('Previous') && viewport.includes('Next idea') && viewport.includes('Next part'), 'Guided chapter navigation is incomplete');
  invariant(viewport.includes('LOOK') && viewport.includes('LEARN') && viewport.includes('YOUR TURN'), 'Guided chapter pacing cues are incomplete');
  invariant(viewport.includes('Practice') && viewport.includes('Chapter check'), 'Guided chapter completion actions are incomplete');
  invariant(viewport.includes('No score here — just explore.'), 'Non-mastery wording is missing');
  invariant(home.includes("openView('bicycle-workshop')"), 'Practice catalogue does not open the guided chapter');
  invariant(home.includes("onStart('free.english.bicycle-workshop.1')") && home.includes("onStart('free.english.bicycle-workshop.chapter-check.1')"), 'Guided chapter does not launch both assessed packs');

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
