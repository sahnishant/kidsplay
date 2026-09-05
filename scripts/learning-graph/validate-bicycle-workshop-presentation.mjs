import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const read = (path) => JSON.parse(readFileSync(resolve(ROOT, path), 'utf8'));
const source = (path) => readFileSync(resolve(ROOT, path), 'utf8');
const invariant = (condition, message) => { if (!condition) throw new Error(message); };

function arrays(directory) {
  return readdirSync(resolve(ROOT, directory))
    .filter((name) => name.endsWith('.json'))
    .sort()
    .flatMap((name) => {
      const value = read(`${directory}/${name}`);
      return Array.isArray(value) ? value : [];
    });
}

export function validateBicycleWorkshopPresentation() {
  const presentation = read('content/curriculum-presentations/bicycle-workshop.json');
  const module = read('content/curriculum-modules/ncert/2026-27/class-2/english/mridang/chapters/bicycle-workshop-runtime.json');
  const graph = read('content/learning-graph/modules/bicycle-workshop.json');
  const importedClaims = graph.imports.claimFiles.flatMap((path) => read(path).claims ?? []);
  const claimIds = new Set([...importedClaims, ...graph.edges].map((claim) => claim.id));
  const admittedClaims = new Set(module.graphClaimRefs);
  const capabilities = new Set(module.capabilityRefs);
  const visualIds = new Set(arrays('content/visuals').map((visual) => visual.id));
  const animationIds = new Set(arrays('content/animations').map((animation) => animation.id));
  const packs = readdirSync(resolve(ROOT, 'content/packs'))
    .filter((name) => name.endsWith('.json'))
    .map((name) => read(`content/packs/${name}`));
  const packIds = new Set(packs.map((pack) => pack.id));
  const appSource = source('src/App.svelte');
  const homeSource = source('src/ui/HomeViewport.svelte');
  const viewportSource = source('src/ui/CurriculumChapterViewport.svelte');

  invariant(presentation.moduleRef === module.moduleId, 'Presentation/module mismatch');
  invariant(presentation.childTitle === 'Bicycle Workshop', 'Independent child title required');
  invariant(presentation.sourceExpression.copied === false, 'Presentation may not copy source expression');
  invariant(presentation.sourceExpression.sourceTextShown === false, 'Presentation may not display source text');
  invariant(presentation.sourceExpression.sourceArtworkShown === false, 'Presentation may not display source artwork');
  invariant(packIds.has(presentation.practicePackRef), 'Unknown practice pack');
  invariant(packIds.has(presentation.chapterCheckPackRef), 'Unknown chapter-check pack');
  invariant(presentation.beats.length === 6, `Expected six teaching beats, found ${presentation.beats.length}`);
  invariant(presentation.beats.every((beat, index) => beat.order === index + 1), 'Teaching beat order must be contiguous');

  for (const beat of presentation.beats) {
    invariant(beat.exposureEvidence === 'none', `${beat.id}: viewing an explanation must not write mastery`);
    invariant(typeof beat.body === 'string' && beat.body.length >= 25, `${beat.id}: independently authored explanation is too thin`);
    invariant(!/my bicycle/i.test(`${beat.title} ${beat.body}`), `${beat.id}: source chapter title leaked into child expression`);
    for (const ref of beat.claimRefs) {
      invariant(claimIds.has(ref), `${beat.id}: unknown graph claim ${ref}`);
      invariant(admittedClaims.has(ref), `${beat.id}: explanation uses claim outside the admitted runtime module ${ref}`);
      invariant(!ref.startsWith('claim.chapter.'), `${beat.id}: source-context claim leaked into generic explanation`);
    }
    for (const ref of beat.capabilityRefs) invariant(capabilities.has(ref), `${beat.id}: unknown capability ${ref}`);
    if (beat.visual.kind === 'entity') invariant(visualIds.has(beat.visual.visualRef), `${beat.id}: unknown visual ${beat.visual.visualRef}`);
    if (beat.visual.kind === 'animation') invariant(animationIds.has(beat.visual.animationRef), `${beat.id}: unknown animation ${beat.visual.animationRef}`);
    if (beat.visual.kind === 'grid') {
      invariant(beat.visual.visualRefs.length === beat.visual.labels.length, `${beat.id}: visual-grid labels do not align`);
      for (const ref of beat.visual.visualRefs) invariant(visualIds.has(ref), `${beat.id}: unknown grid visual ${ref}`);
    }
    if (beat.visual.kind === 'tokens') invariant(beat.visual.tokens.length >= 3, `${beat.id}: token presentation is too small`);
  }
  invariant(presentation.completion.masteryEvidence === 'none', 'Chapter browsing must not manufacture mastery');

  invariant(appSource.includes('getBicycleWorkshopPresentation'), 'App does not load the curriculum presentation');
  invariant(appSource.includes("enterAppSessionLayer('curriculum:bicycle-workshop'"), 'App back-navigation boundary missing');
  invariant(appSource.includes('onStartPractice={startSession}') && appSource.includes('onStartCheck={startSession}'), 'Practice/check do not reuse canonical sessions');
  invariant(homeSource.includes("entry.id === 'free.english.bicycle-workshop.1'"), 'Workshop catalogue entry does not open the guided journey');
  invariant(viewportSource.includes('SemanticAnimation') && viewportSource.includes('VisualEntity'), 'Chapter viewport does not consume semantic media');
  invariant(viewportSource.includes('onStartPractice') && viewportSource.includes('onStartCheck'), 'Chapter viewport does not expose practice and check');

  return {
    presentationId: presentation.presentationId,
    beatCount: presentation.beats.length,
    explainedClaimCount: new Set(presentation.beats.flatMap((beat) => beat.claimRefs)).size,
    capabilityCount: new Set(presentation.beats.flatMap((beat) => beat.capabilityRefs)).size,
    practicePackRef: presentation.practicePackRef,
    chapterCheckPackRef: presentation.chapterCheckPackRef,
    browsingMasteryEvidence: presentation.completion.masteryEvidence
  };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    const result = validateBicycleWorkshopPresentation();
    console.log(process.argv.includes('--json') ? JSON.stringify(result) : `Validated ${result.presentationId}: ${result.beatCount} guided teaching beats.`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
