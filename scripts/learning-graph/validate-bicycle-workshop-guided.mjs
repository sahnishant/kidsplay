import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const readJson = (path) => JSON.parse(readFileSync(resolve(ROOT, path), 'utf8'));
const readText = (path) => readFileSync(resolve(ROOT, path), 'utf8');
const invariant = (condition, message) => { if (!condition) throw new Error(message); };
const collectArrays = (directory) => readdirSync(resolve(ROOT, directory))
  .filter((name) => name.endsWith('.json'))
  .sort()
  .flatMap((name) => {
    const value = readJson(`${directory}/${name}`);
    return Array.isArray(value) ? value : [];
  });

export function validateBicycleWorkshopGuidedExperience() {
  const guide = readJson('content/experience/bicycle-workshop-guided.json');
  const module = readJson('content/curriculum-modules/ncert/2026-27/class-2/english/mridang/chapters/bicycle-workshop-runtime.json');
  const graph = readJson('content/learning-graph/modules/bicycle-workshop.json');
  const importedClaims = graph.imports.claimFiles.flatMap((path) => readJson(path).claims ?? []);
  const claimIds = new Set([...importedClaims.map((claim) => claim.id), ...graph.edges.map((edge) => edge.id)]);
  const admittedClaims = new Set(module.graphClaimRefs);
  const admittedCapabilities = new Set(module.capabilityRefs);
  const visualIds = new Set(collectArrays('content/visuals').map((visual) => visual.id));
  const animationIds = new Set(collectArrays('content/animations').map((animation) => animation.id));
  const component = readText('src/ui/BicycleWorkshopViewport.svelte');
  const home = readText('src/ui/HomeViewport.svelte');

  invariant(guide.moduleRef === module.moduleId, 'Guided experience is not bound to the chapter module');
  invariant(guide.mode === 'non_evaluative_guided_learning', 'Guided experience must remain non-evaluative');
  invariant(guide.practicePackRef === module.deliveryRefs.practicePackRef, 'Guided practice link does not match module authority');
  invariant(guide.chapterCheckPackRef === module.deliveryRefs.chapterCheckPackRef, 'Guided chapter-check link does not match module authority');
  invariant(guide.evidencePolicy.viewingWritesMastery === false, 'Viewing the guide cannot write mastery');
  invariant(guide.evidencePolicy.navigationWritesMastery === false, 'Navigating the guide cannot write mastery');
  invariant(guide.evidencePolicy.practiceUsesCanonicalEvaluator === true, 'Practice must use the canonical evaluator');
  invariant(guide.evidencePolicy.chapterCheckUsesCanonicalEvaluator === true, 'Chapter check must use the canonical evaluator');

  invariant(guide.sections.length === 7, `Expected seven guided sections, found ${guide.sections.length}`);
  invariant(module.sections.length === guide.sections.length, 'Module and guide section counts differ');
  invariant(guide.sections.every((section, index) => section.order === index + 1), 'Guided section order must be contiguous');
  invariant(JSON.stringify(guide.sections.map((section) => section.id)) === JSON.stringify(module.sections.map((section) => section.id)), 'Guided and module section order differ');

  let tracedBeatCount = 0;
  const sourceIdentity = /my bicycle|mridang|bemr101|ncert|cbse/i;
  for (const section of guide.sections) {
    invariant(Boolean(section.animationRef) !== Boolean(section.visualRef), `${section.id}: provide exactly one visual or animation authority`);
    if (section.animationRef) invariant(animationIds.has(section.animationRef), `${section.id}: unknown animation ${section.animationRef}`);
    if (section.visualRef) invariant(visualIds.has(section.visualRef), `${section.id}: unknown visual ${section.visualRef}`);
    invariant(typeof section.childPrompt === 'string' && section.childPrompt.trim(), `${section.id}: childPrompt required`);
    invariant(!sourceIdentity.test(`${section.title} ${section.childPrompt}`), `${section.id}: protected source identity leaked into child copy`);
    invariant(Array.isArray(section.beats) && section.beats.length > 0, `${section.id}: at least one explanation beat is required`);

    for (const beat of section.beats) {
      const refs = [...(beat.claimRefs ?? []), ...(beat.capabilityRefs ?? [])];
      invariant(refs.length > 0, `${section.id}/${beat.id}: explanation beat is not graph/capability traced`);
      invariant(typeof beat.text === 'string' && beat.text.trim(), `${section.id}/${beat.id}: child explanation required`);
      invariant(!sourceIdentity.test(beat.text), `${section.id}/${beat.id}: source identity leaked into explanation`);
      for (const claimRef of beat.claimRefs ?? []) {
        invariant(claimIds.has(claimRef), `${section.id}/${beat.id}: unknown claim ${claimRef}`);
        invariant(admittedClaims.has(claimRef), `${section.id}/${beat.id}: claim ${claimRef} is outside runtime module scope`);
        invariant(!claimRef.startsWith('claim.chapter.'), `${section.id}/${beat.id}: chapter-local poem claim entered generic explanation`);
      }
      for (const capabilityRef of beat.capabilityRefs ?? []) {
        invariant(admittedCapabilities.has(capabilityRef), `${section.id}/${beat.id}: capability ${capabilityRef} is outside module scope`);
      }
      tracedBeatCount += 1;
    }
  }

  invariant(tracedBeatCount >= 15, `Guided experience is too thin: ${tracedBeatCount} traced beats`);
  invariant(component.includes("bicycle-workshop-guided.json"), 'Viewport does not consume the guided content authority');
  invariant(component.includes('SemanticVisualPresenter'), 'Viewport does not consume the canonical semantic media presenter');
  invariant(component.includes('animationVisualPresentation') && component.includes('resolveItemVisualPresentation'), 'Viewport does not resolve both animation and entity visual authorities');
  invariant(!component.includes("from '../presentation/VisualEntity.svelte'"), 'Viewport bypasses the canonical semantic presenter with a direct entity renderer');
  invariant(!component.includes("from '../presentation/SemanticAnimation.svelte'"), 'Viewport bypasses the canonical semantic presenter with a direct animation renderer');
  invariant(component.includes('onPractice') && component.includes('onChapterCheck'), 'Viewport does not launch both assessed surfaces');
  invariant(!/recordAttempt|evaluate\(|localProgress|saveProgress|knowledgeEvidence/.test(component), 'Guided viewport must not write or evaluate mastery');
  invariant(!sourceIdentity.test(component), 'Source identity leaked into the child viewport');

  invariant(home.includes("'bicycle-workshop'"), 'Home does not register the Bicycle Workshop view');
  invariant(home.includes("openView('bicycle-workshop')"), 'Home does not open the guided chapter');
  invariant(home.includes("free.english.bicycle-workshop.1"), 'Home does not launch chapter practice');
  invariant(home.includes("free.english.bicycle-workshop.chapter-check.1"), 'Home does not launch the chapter check');
  invariant(home.includes("!entry.id.startsWith('free.english.bicycle-workshop.')"), 'Raw pack cards were not collapsed into the coherent chapter entry');

  return {
    experienceId: guide.experienceId,
    sectionCount: guide.sections.length,
    tracedBeatCount,
    claimTraceCount: guide.sections.flatMap((section) => section.beats).reduce((sum, beat) => sum + (beat.claimRefs?.length ?? 0), 0),
    capabilityTraceCount: guide.sections.flatMap((section) => section.beats).reduce((sum, beat) => sum + (beat.capabilityRefs?.length ?? 0), 0),
    semanticPresenter: 'SemanticVisualPresenter',
    nonEvaluative: guide.evidencePolicy.viewingWritesMastery === false,
    homeIntegrated: true
  };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    const result = validateBicycleWorkshopGuidedExperience();
    console.log(process.argv.includes('--json') ? JSON.stringify(result) : `Validated ${result.experienceId}: ${result.sectionCount} sections and ${result.tracedBeatCount} traced teaching beats.`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
