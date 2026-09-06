import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCanonicalGraph, validateCanonicalGraph } from './canonical-graph.mjs';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const readJson = (path) => JSON.parse(readFileSync(resolve(ROOT, path), 'utf8'));
const readText = (path) => readFileSync(resolve(ROOT, path), 'utf8');
const invariant = (condition, message) => { if (!condition) throw new Error(message); };
const collectArrays = (directory) => readdirSync(resolve(ROOT, directory))
  .filter((name) => name.endsWith('.json')).sort()
  .flatMap((name) => { const value = readJson(`${directory}/${name}`); return Array.isArray(value) ? value : []; });

export function validateBicycleWorkshopGuidedExperience() {
  const guide = readJson('content/experience/bicycle-workshop-guided.json');
  const module = readJson('content/curriculum-modules/ncert/2026-27/class-2/english/mridang/chapters/bicycle-workshop-runtime.json');
  const graph = loadCanonicalGraph({ root: ROOT });
  validateCanonicalGraph(graph);
  const claimIds = new Set(graph.claims.map((claim) => claim.id));
  const admittedClaims = new Set(module.graphClaimRefs);
  const admittedCapabilities = new Set(module.capabilityRefs);
  const visualIds = new Set(collectArrays('content/visuals').map((visual) => visual.id));
  const animationIds = new Set(collectArrays('content/animations').map((animation) => animation.id));
  const component = readText('src/ui/BicycleWorkshopViewport.svelte');
  const stage = readText('src/ui/BicycleStoryStage.svelte');
  const home = readText('src/ui/HomeViewport.svelte');

  invariant(guide.moduleRef === module.moduleId, 'Guided experience is not bound to the chapter module');
  invariant(guide.mode === 'non_evaluative_guided_learning', 'Guided experience must remain non-evaluative');
  invariant(guide.practicePackRef === module.deliveryRefs.practicePackRef, 'Guided practice link does not match module authority');
  invariant(guide.chapterCheckPackRef === module.deliveryRefs.chapterCheckPackRef, 'Guided chapter-check link does not match module authority');
  invariant(guide.evidencePolicy.viewingWritesMastery === false && guide.evidencePolicy.navigationWritesMastery === false, 'Browsing the guide cannot write mastery');
  invariant(guide.evidencePolicy.practiceUsesCanonicalEvaluator === true && guide.evidencePolicy.chapterCheckUsesCanonicalEvaluator === true, 'Assessed surfaces must use the canonical evaluator');
  invariant(guide.storyBoundary?.mechanicsSection === 'kidsplay_explanation_only' && guide.storyBoundary?.mechanicsWritesMastery === false, 'Mechanics enrichment must remain explanation-only');

  invariant(guide.sections.length === 7, `Expected seven guided sections, found ${guide.sections.length}`);
  invariant(module.sections.length === guide.sections.length, 'Module and guide section counts differ');
  invariant(guide.sections.every((section, index) => section.order === index + 1), 'Guided section order must be contiguous');
  invariant(JSON.stringify(guide.sections.map((section) => section.id)) === JSON.stringify(module.sections.map((section) => section.id)), 'Guided and module section order differ');

  let tracedBeatCount = 0, structuredBeatCount = 0, lookPromptCount = 0, memoryHookCount = 0;
  const sourceIdentity = /my bicycle|mridang|bemr101|ncert|cbse/i;
  for (const section of guide.sections) {
    invariant(Boolean(section.animationRef) !== Boolean(section.visualRef), `${section.id}: provide exactly one visual or animation authority`);
    if (section.animationRef) invariant(animationIds.has(section.animationRef), `${section.id}: unknown animation ${section.animationRef}`);
    if (section.visualRef) invariant(visualIds.has(section.visualRef), `${section.id}: unknown visual ${section.visualRef}`);
    invariant(typeof section.storyMode === 'string' && section.storyMode, `${section.id}: interactive story projection mode required`);
    invariant(typeof section.lookPrompt === 'string' && section.lookPrompt.trim(), `${section.id}: lookPrompt required`);
    invariant(typeof section.remember === 'string' && section.remember.trim(), `${section.id}: remember hook required`);
    invariant(typeof section.childPrompt === 'string' && section.childPrompt.trim(), `${section.id}: childPrompt required`);
    invariant(!sourceIdentity.test(`${section.title} ${section.lookPrompt} ${section.remember} ${section.childPrompt}`), `${section.id}: source identity leaked into child copy`);
    invariant(Array.isArray(section.beats) && section.beats.length > 0, `${section.id}: explanation beat required`);
    lookPromptCount++; memoryHookCount++;

    for (const beat of section.beats) {
      const refs = [...(beat.claimRefs ?? []), ...(beat.capabilityRefs ?? [])];
      invariant(refs.length > 0, `${section.id}/${beat.id}: beat is not graph/capability traced`);
      invariant(typeof beat.label === 'string' && beat.label.trim() && typeof beat.text === 'string' && beat.text.trim(), `${section.id}/${beat.id}: child explanation required`);
      invariant(!sourceIdentity.test(`${beat.label} ${beat.text}`), `${section.id}/${beat.id}: source identity leaked into explanation`);
      const examples = beat.examples ?? [], sequence = beat.sequence ?? [];
      if (examples.length) invariant(examples.length >= 2 && examples.every((value) => typeof value === 'string' && value.trim()), `${section.id}/${beat.id}: examples must form a useful non-empty set`);
      if (sequence.length) invariant(sequence.length >= 2 && sequence.every((value) => typeof value === 'string' && value.trim()), `${section.id}/${beat.id}: sequence must contain non-empty steps`);
      if (examples.length || sequence.length) structuredBeatCount++;
      for (const claimRef of beat.claimRefs ?? []) {
        invariant(claimIds.has(claimRef), `${section.id}/${beat.id}: unknown claim ${claimRef}`);
        invariant(admittedClaims.has(claimRef), `${section.id}/${beat.id}: claim ${claimRef} is outside runtime module scope`);
        invariant(!claimRef.startsWith('claim.chapter.'), `${section.id}/${beat.id}: chapter-local poem claim entered generic explanation`);
      }
      for (const capabilityRef of beat.capabilityRefs ?? []) invariant(admittedCapabilities.has(capabilityRef), `${section.id}/${beat.id}: capability ${capabilityRef} is outside module scope`);
      tracedBeatCount++;
    }
  }

  invariant(tracedBeatCount >= 15, `Guided experience is too thin: ${tracedBeatCount} traced beats`);
  invariant(structuredBeatCount >= 12, `Guided experience needs more concrete examples/sequences: ${structuredBeatCount}`);
  invariant(component.includes("bicycle-workshop-guided.json"), 'Viewport does not consume the guided content authority');
  invariant(component.includes('BicycleStoryStage') && component.includes('data-visual-ref'), 'Viewport does not project canonical media authority through the interactive story stage');
  invariant(stage.includes('bicycleStoryBike.svg?url'), 'Interactive story stage does not use its original inspectable bicycle asset');
  invariant(!component.includes("from '../presentation/VisualEntity.svelte'") && !component.includes("from '../presentation/SemanticAnimation.svelte'"), 'Viewport bypasses the approved story projection boundary');
  invariant(component.includes('Next idea') && component.includes('YOUR TURN') && component.includes('REMEMBER') && component.includes('LOOK') && component.includes('LEARN'), 'Viewport does not provide paced look-learn-try teaching');
  invariant(component.includes('aria-live="polite"'), 'Changing teaching ideas are not announced accessibly');
  invariant(component.includes('onPractice') && component.includes('onChapterCheck'), 'Viewport does not launch both assessed surfaces');
  invariant(!/recordAttempt|evaluate\(|localProgress|saveProgress|knowledgeEvidence/.test(`${component}\n${stage}`), 'Guided story surface must not write or evaluate mastery');
  invariant(!sourceIdentity.test(`${component}\n${stage}`), 'Source identity leaked into the child story surface');

  invariant(home.includes("'bicycle-workshop'") && home.includes("openView('bicycle-workshop')"), 'Home does not open the Bicycle Workshop view');
  invariant(home.includes("free.english.bicycle-workshop.1") && home.includes("free.english.bicycle-workshop.chapter-check.1"), 'Home does not launch both assessed Bicycle packs');
  invariant(home.includes("!entry.id.startsWith('free.english.bicycle-workshop.')"), 'Raw pack cards were not collapsed into the coherent chapter entry');

  return {
    experienceId: guide.experienceId,
    sectionCount: guide.sections.length,
    tracedBeatCount,
    structuredBeatCount,
    lookPromptCount,
    memoryHookCount,
    claimTraceCount: guide.sections.flatMap((section) => section.beats).reduce((sum, beat) => sum + (beat.claimRefs?.length ?? 0), 0),
    capabilityTraceCount: guide.sections.flatMap((section) => section.beats).reduce((sum, beat) => sum + (beat.capabilityRefs?.length ?? 0), 0),
    semanticPresenter: 'BicycleStoryStage',
    nonEvaluative: true,
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
