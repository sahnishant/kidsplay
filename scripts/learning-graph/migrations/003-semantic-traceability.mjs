import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const root = process.cwd(), read = (path) => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
const write = (path, value) => { mkdirSync(dirname(resolve(root, path)), { recursive: true }); writeFileSync(resolve(root, path), `${JSON.stringify(value, null, 2)}\n`); };
const must = (condition, message) => { if (!condition) throw new Error(message); };
const ledgerPath = 'content/learning-graph/migrations/003-semantic-traceability.json';
if (existsSync(resolve(root, ledgerPath))) console.log('003 semantic-traceability: already migrated; no writes');
else {
  must(process.argv.includes('--write'), '003 requires --write on its review branch');
  const modulePath = 'content/learning-graph/modules/bicycle-workshop.json', graph = read(modulePath);
  must(graph.objectiveFile, 'Run objective-authority migration first');
  const nodeFiles = graph.imports.nodeFiles.map((path) => ({ path, data: read(path) }));
  const claimFiles = graph.imports.claimFiles.map((path) => ({ path, data: read(path) }));
  const nodes = nodeFiles.flatMap((file) => file.data.nodes), claims = claimFiles.flatMap((file) => file.data.claims);
  must(nodes.length === 79 && claims.length === 64, 'Unexpected pre-migration graph');
  const originalNodeIds = nodes.map((item) => item.id), originalClaimIds = claims.map((item) => item.id);
  const ontology = read(graph.ontologyFile), objectivePack = read(graph.objectiveFile), objectives = objectivePack.objectives;
  const compatibility = read(graph.compatibilityFile);
  const runtimePath = 'content/curriculum-modules/ncert/2026-27/class-2/english/mridang/chapters/bicycle-workshop-runtime.json', runtime = read(runtimePath);
  const questionPath = 'content/curriculum-runtime/bicycle-workshop/questions/core.json', questions = read(questionPath);
  const review = { status: 'editorial_candidate', authority: 'kidsplay_editorial_review_required', publishable: false };
  const sourceRef = 'source.kidsplay.graph-architecture-review.2026-09-06';
  const provenance = [{ sourceRef, sourceRole: 'user_requested_model_correction_not_external_fact_verification', sourceExpressionCopied: false }];
  const additions = [
    ['concept.body.rider-foot','concept',"rider's foot"],
    ['concept.function.rolling-movement','concept','rolling movement'],
    ['concept.function.carrying-items','concept','carrying suitable items'],
    ['concept.function.rider-visibility','concept','rider visibility'],
    ['concept.condition.helmet-proper-fit','concept','helmet is properly fitted'],
    ['system.bicycle.drivetrain','system','bicycle drivetrain'],
    ['concept.condition.chain-driven-bicycle','concept','conventional chain-driven pedal bicycle'],
    ['concept.condition.tubed-tyre-system','concept','tyre system that uses an inner tube'],
    ['concept.condition.normal-rolling-contact','concept','normal rolling contact with the ground'],
    ['class.vehicle','entity_class','vehicle'],
    ['entity.vehicle.car','entity','car'],
    ['entity.vehicle.bus','entity','bus'],
    ['entity.safety.seatbelt','entity','seat belt'],
    ['entity.safety.traffic-light','entity','traffic light']
  ].map(([id, type, label]) => ({ id, type, labels: { en: label }, revision: 1, scope: 'shared', review: { ...review }, provenance: structuredClone(provenance) }));
  must(additions.every((item) => !nodes.some((node) => node.id === item.id)), 'Duplicate semantic node');
  nodes.push(...additions); nodeFiles.at(-1).data.nodes.push(...additions);
  const part = (name) => `entity.part.bicycle.${name}`, objectiveId = (id) => `objective.${id}`;
  const additionsClaims = [];
  function add(id, subjectRef, predicate, objectRef, legacyObjectives, qualifiers = {}) {
    must(!claims.some((claim) => claim.id === id), `Duplicate claim ${id}`);
    const objectiveRefs = legacyObjectives.map(objectiveId);
    for (const ref of objectiveRefs) {
      const objective = objectives.find((item) => item.id === ref); must(objective, `Unknown objective ${ref}`);
      objective.targetClaimRefs.push(id);
    }
    const claim = { id, revision: 1, subjectRef, predicate, objectRef, polarity: 'positive', authority: { kind: 'canonical' }, scope: { kind: 'shared' }, qualifiers, objectiveRefs, review: { ...review }, provenance: structuredClone(provenance) };
    claims.push(claim); additionsClaims.push(claim); claimFiles.at(-1).data.claims.push(claim);
  }
  add('claim.bicycle.pedal.operated-by.rider-foot', part('pedal'), 'operated_by', 'concept.body.rider-foot', ['bicycle.parts.pedal']);
  add('claim.bicycle.wheel.helps-enable.rolling', part('wheel'), 'helps_enable', 'concept.function.rolling-movement', ['bicycle.parts.wheel'], { conditionRef: 'concept.condition.normal-rolling-contact' });
  add('claim.bicycle.has-property.two-wheels', 'entity.vehicle.bicycle', 'has_property', 'concept.property.two-wheels', ['bicycle.identity','english.vocabulary.bicycle'], { frequency: 'typical' });
  add('claim.bicycle.has-property.human-power', 'entity.vehicle.bicycle', 'has_property', 'concept.property.human-power', ['bicycle.identity'], { contextRef: 'concept.condition.chain-driven-bicycle' });
  add('claim.bicycle.carrier.used-for.carrying', part('carrier'), 'used_for', 'concept.function.carrying-items', ['bicycle.parts.carrier']);
  add('claim.bicycle.handlebar.controls.direction', part('handlebar'), 'controls', 'concept.motion.direction-change', ['bicycle.parts.handlebar','bicycle.control.steering']);
  add('claim.bicycle.brake.used-for.slowing', part('brake'), 'used_for', 'concept.motion.bicycle-slowing', ['bicycle.parts.brake']);
  add('claim.bicycle.light.helps-enable.visibility', part('light'), 'helps_enable', 'concept.function.rider-visibility', ['bicycle.safety.visibility']);
  add('claim.bicycle.reflector.helps-enable.visibility', part('reflector'), 'helps_enable', 'concept.function.rider-visibility', ['bicycle.safety.visibility']);
  add('claim.bicycle.tyre.covers.wheel', part('tyre'), 'covers', part('wheel'), ['bicycle.parts.tyre']);
  add('claim.bicycle.bell.used-for.signalling', part('bell'), 'used_for', 'concept.communication.signal-presence', ['bicycle.parts.bell','bicycle.safety.signal']);
  const runtimeAdditions = [...additionsClaims];
  for (const name of ['rim','spoke','hub','tyre']) add(`claim.bicycle.${name}.part-of.wheel`, part(name), 'part_of', part('wheel'), [name === 'tyre' ? 'bicycle.parts.tyre' : 'bicycle.parts.wheel']);
  add('claim.bicycle.inner-tube.part-of.tyre-system', part('inner-tube'), 'part_of', part('tyre'), ['bicycle.parts.tyre'], { conditionRef: 'concept.condition.tubed-tyre-system' });
  add('claim.bicycle.grip.part-of.handlebar', part('grip'), 'part_of', part('handlebar'), ['bicycle.parts.handlebar']);
  for (const name of ['pedal','crank','chain','rear-sprocket']) add(`claim.bicycle.${name}.belongs-to.drivetrain`, part(name), 'belongs_to_system', 'system.bicycle.drivetrain', ['bicycle.parts.drive'], { conditionRef: 'concept.condition.chain-driven-bicycle' });
  add('claim.bicycle.drivetrain.part-of.bicycle', 'system.bicycle.drivetrain', 'part_of', 'entity.vehicle.bicycle', ['bicycle.parts.drive']);
  add('claim.class.wheeled.subclass-of.vehicle', 'class.vehicle.wheeled', 'subclass_of', 'class.vehicle', ['bicycle.identity']);
  add('claim.class.human-powered.subclass-of.vehicle', 'class.vehicle.human-powered', 'subclass_of', 'class.vehicle', ['bicycle.identity']);

  ontology.revision = 2;
  ontology.semanticVersion = '2.0.0';
  ontology.nodeTypes.push('system');
  const oldInstance = ontology.predicateDefinitions.find((item) => item.id === 'instance_of');
  oldInstance.subjectTypes = ['entity']; oldInstance.objectTypes = ['entity_class']; oldInstance.transitive = false;
  const oldIsA = ontology.predicateDefinitions.find((item) => item.id === 'is_a');
  oldIsA.transitive = false; oldIsA.deprecatedForNewClaims = true;
  const predicate = (id, subjectTypes, objectTypes, qualifiersAllowed = [], extra = {}) => ({ id, subjectTypes, objectTypes, transitive: false, qualifiersAllowed, ...extra });
  ontology.predicateDefinitions.push(
    predicate('contextual_instance_of',['chapter_instance'],['entity']),
    predicate('subclass_of',['entity_class'],['entity_class'],[],{ transitive: true, acyclic: true }),
    predicate('part_of',['part','system'],['part','system','entity'],['conditionRef'],{ acyclic: true }),
    predicate('belongs_to_system',['part'],['system'],['conditionRef']),
    predicate('operated_by',['part'],['concept']), predicate('used_for',['part','entity'],['concept']),
    predicate('controls',['part'],['concept']), predicate('covers',['part'],['part']),
    predicate('helps_enable',['part','entity','concept'],['concept'],['conditionRef']),
    predicate('has_property',['entity','part'],['concept'],['frequency','contextRef']),
    predicate('drives',['concept'],['concept'],['conditionRef'],{ requiredQualifiers: ['conditionRef'] }),
    predicate('helps_protect',['entity'],['concept'],['activity','conditionRef'],{ requiredQualifiers: ['conditionRef'] })
  );
  ontology.qualifierDefinitions.push({ id: 'conditionRef', valueType: 'node_ref' });
  const revised = [];
  for (const claim of claims) {
    const before = structuredClone(claim);
    if (claim.predicate === 'instance_of' && nodes.find((node) => node.id === claim.subjectRef)?.type === 'chapter_instance') claim.predicate = 'contextual_instance_of';
    else if (claim.predicate === 'is_a') claim.predicate = 'instance_of';
    if (['claim.push-pedals.contributes-to.crank-turns','claim.crank-turns.contributes-to.chain-moves','claim.chain-moves.contributes-to.rear-wheel-turns'].includes(claim.id)) {
      claim.predicate = 'drives'; claim.qualifiers = { ...claim.qualifiers, conditionRef: 'concept.condition.chain-driven-bicycle' };
    }
    if (claim.id === 'claim.rear-wheel-turns.contributes-to.bicycle-movement') { claim.predicate = 'helps_enable'; claim.qualifiers = { ...claim.qualifiers, conditionRef: 'concept.condition.normal-rolling-contact' }; }
    if (claim.id === 'claim.cycling-helmet.protects.head') { claim.predicate = 'helps_protect'; claim.qualifiers = { ...claim.qualifiers, conditionRef: 'concept.condition.helmet-proper-fit' }; }
    if (JSON.stringify(before) !== JSON.stringify(claim)) {
      claim.revision += 1;
      claim.provenance.push(...structuredClone(provenance));
      revised.push({ claimId: claim.id, oldRevision: before.revision, newRevision: claim.revision, previousPredicate: before.predicate, predicate: claim.predicate, previousQualifiers: before.qualifiers, qualifiers: claim.qualifiers });
    }
  }
  const exemptions = {
    'concept.word-sense.action': 'Reserved vocabulary metaconcept; not currently an assessed factual claim.',
    'concept.word-sense.object-part': 'Reserved vocabulary metaconcept; not currently an assessed factual claim.',
    'grammar.en.indefinite-article-a-an': 'Curriculum language target linked to a capability, not a factual edge.',
    'phonology.en.short-a': 'Curriculum phonological target linked to a capability, not a factual edge.',
    'lexical.form.en.track': 'Unresolved lexical target remains blocked pending sense review; no meaning is inferred.',
    'entity.vehicle.car': 'Neutral option entity in typed assessment targets; no property claim is inferred from being a distractor.',
    'entity.vehicle.bus': 'Neutral option entity in typed assessment targets; no property claim is inferred from being a distractor.',
    'entity.safety.seatbelt': 'Neutral option entity in a typed assessment target; not a bicycle safety recommendation.',
    'entity.safety.traffic-light': 'Neutral option entity in a typed assessment target; no property claim is inferred.'
  };
  for (const [id, reason] of Object.entries(exemptions)) { const node = nodes.find((item) => item.id === id); must(node, `Unknown exemption ${id}`); node.allowOrphan = true; node.orphanReason = reason; }
  const nodeById = new Map(nodes.map((item) => [item.id, item]));
  for (const claim of runtimeAdditions) {
    runtime.graphClaimRefs.push(claim.id);
    compatibility.projection.entries.push({ id: `v2-${claim.id}`, claimRef: claim.id,
      subject: { id: claim.subjectRef, label: nodeById.get(claim.subjectRef).labels.en }, object: { id: claim.objectRef, label: nodeById.get(claim.objectRef).labels.en },
      meta: { knowledgeLevel: 'basic', skills: ['vocabulary','classification'] } });
  }
  runtime.objectiveRefs = objectives.map((item) => item.id);
  runtime.releaseGates.graphSemanticEditorial = 'required_candidate_functions_and_targets';
  const targets = [
    ['bicycle.workshop.identity.001','claim.bicycle.has-property.two-wheels','bicycle.identity'],
    ['bicycle.workshop.human-power.001','claim.bicycle.has-property.human-power','bicycle.identity'],
    ['bicycle.workshop.part.pedal.001','claim.bicycle.pedal.operated-by.rider-foot','bicycle.parts.pedal'],
    ['bicycle.workshop.part.wheel.001','claim.bicycle.wheel.helps-enable.rolling','bicycle.parts.wheel'],
    ['bicycle.workshop.control.handlebar.001','claim.bicycle.handlebar.controls.direction','bicycle.control.steering'],
    ['bicycle.workshop.control.brake.001','claim.bicycle.brake.used-for.slowing','bicycle.parts.brake'],
    ['bicycle.workshop.signal.bell.001','claim.bicycle.bell.used-for.signalling','bicycle.safety.signal'],
    ['bicycle.workshop.safety.helmet.001','claim.cycling-helmet.protects.head','bicycle.safety.helmet']
  ];
  const optionEntities = { bicycle: 'entity.vehicle.bicycle', tricycle: 'entity.vehicle.tricycle', wheelchair: 'entity.mobility.wheelchair', car: 'entity.vehicle.car', bus: 'entity.vehicle.bus', helmet: 'entity.safety.cycling-helmet', seatbelt: 'entity.safety.seatbelt', 'seat-belt': 'entity.safety.seatbelt', 'traffic-light': 'entity.safety.traffic-light', trafficlight: 'entity.safety.traffic-light' };
  const targetIds = [];
  for (const [questionId, claimId, legacyObjective] of targets) {
    const question = questions.find((item) => item.id === questionId), claim = claims.find((item) => item.id === claimId);
    must(question && claim, `Missing semantic target ${questionId}/${claimId}`);
    const optionNodeRefs = Object.fromEntries(question.interaction.options.map((option) => {
      const id = optionEntities[option.id] ?? part(option.id);
      must(nodeById.has(id), `${questionId}: unresolved option ${option.id}`); return [option.id, id];
    }));
    question.revision += 1; question.evidencePolicy = 'practice_only'; question.authoring.status = 'draft';
    question.knowledgeRefs = [...new Set([...question.knowledgeRefs, claim.id])];
    if (questionId === 'bicycle.workshop.identity.001') question.knowledgeRefs.push('claim.bicycle.has-property.human-power');
    question.semanticTarget = { schemaVersion: 1, kind: 'select_subject', claimRef: claim.id, claimRevision: claim.revision, objectiveRef: objectiveId(legacyObjective),
      query: { predicate: claim.predicate, objectRef: claim.objectRef, qualifiers: structuredClone(claim.qualifiers) }, optionNodeRefs,
      promptBinding: question.prompt.text, feedbackBinding: structuredClone(question.feedback), review: { status: 'editorial_candidate', publishable: false } };
    targetIds.push(questionId);
  }
  const guidePath = 'content/experience/bicycle-workshop-guided.json', guide = read(guidePath);
  const supplements = {
    'claim.bicycle.typically-has-part.pedal': 'claim.bicycle.pedal.operated-by.rider-foot',
    'claim.bicycle.typically-has-part.wheel': 'claim.bicycle.wheel.helps-enable.rolling',
    'claim.bicycle.typically-has-part.brake': 'claim.bicycle.brake.used-for.slowing',
    'claim.bicycle.typically-has-part.handlebar': 'claim.bicycle.handlebar.controls.direction',
    'claim.bicycle.is-a.wheeled-vehicle': 'claim.bicycle.has-property.two-wheels'
  };
  for (const section of guide.sections) for (const beat of section.beats) if (beat.claimRefs) beat.claimRefs = [...new Set([...beat.claimRefs, ...beat.claimRefs.map((ref) => supplements[ref]).filter(Boolean)])];
  graph.assessmentTargetFile = 'content/learning-graph/assessments/bicycle-workshop-targets.json';
  graph.semanticMigrationRef = 'learning-graph.003-semantic-traceability';
  const changes = new Map([[graph.ontologyFile, ontology], [graph.objectiveFile, objectivePack], [graph.compatibilityFile, compatibility], [runtimePath, runtime], [questionPath, questions], [guidePath, guide], [modulePath, graph]]);
  for (const { path, data } of [...nodeFiles, ...claimFiles]) changes.set(path, data);
  changes.set(graph.assessmentTargetFile, { schemaVersion: 1, questionRefs: targetIds, naturalLanguageEntailmentCertified: false, review: { ...review } });
  changes.set('content/source-manifests/kidsplay-graph-architecture-review.json', { schemaVersion: 1, sourceId: sourceRef, kind: 'user_supplied_architecture_review', date: '2026-09-06', purpose: 'Model corrections requested for Bicycle Workshop; not external verification of facts.', contentHandling: { verbatimSourceTextStored: false, sourceArtworkStored: false, runtimePublicationAllowed: false }, editorial: { status: 'candidate', publishable: false } });
  const codeEdits = new Map();
  function replace(path, before, after) {
    const source = codeEdits.get(path) ?? readFileSync(resolve(root, path), 'utf8');
    must(source.includes(before), `${path}: missing semantic migration anchor ${before}`); codeEdits.set(path, source.replace(before, after));
  }
  replace('scripts/learning-graph/canonical-graph.mjs', 'assert(predicate, `${claim.id}: unknown predicate ${claim.predicate}`);', 'assert(predicate, `${claim.id}: unknown predicate ${claim.predicate}`);\n    assert(!predicate.deprecatedForNewClaims, `${claim.id}: deprecated predicate ${claim.predicate}`);\n    for (const key of predicate.requiredQualifiers ?? []) assert(Object.hasOwn(claim.qualifiers ?? {}, key), `${claim.id}: required qualifier ${key} missing`);');
  replace('scripts/learning-graph/canonical-graph.mjs', '  const depthRefs = Object.values(graph.depthBands ?? {}).flat();', '  for (const node of nodes.values()) if (!used.has(node.id)) assert(node.allowOrphan === true && text(node.orphanReason), `${node.id}: unexplained orphan node`);\n  const depthRefs = Object.values(graph.depthBands ?? {}).flat();');
  replace('scripts/learning-graph/objective-projection.mjs', '      subject: entry.subject, relation: claim.predicate, object: entry.object,', '      subject: entry.subject, relation: claim.predicate, object: entry.object,\n      canonicalClaim: { subjectRef: claim.subjectRef, objectRef: claim.objectRef, revision: claim.revision, polarity: claim.polarity, qualifiers: claim.qualifiers, objectiveRefs: claim.objectiveRefs, reviewStatus: claim.review.status, publishable: claim.review.publishable },');
  replace('scripts/learning-graph/validate-bicycle-workshop-production.mjs', "module.graphClaimRefs.length === 29, 'Expected 29 admitted runtime claims'", `module.graphClaimRefs.length === ${runtime.graphClaimRefs.length}, 'Expected ${runtime.graphClaimRefs.length} admitted runtime claims'`);
  replace('scripts/learning-graph/validate-bicycle-workshop-production.mjs', "projection.entries.length === 29, 'Expected 29 runtime projection rows'", `projection.entries.length === ${runtime.graphClaimRefs.length}, 'Expected ${runtime.graphClaimRefs.length} runtime projection rows'`);
  replace('scripts/learning-graph/validate-bicycle-workshop-production.mjs', "question.authoring?.status === 'reviewed'", "(question.authoring?.status === 'reviewed' || (question.authoring?.status === 'draft' && question.evidencePolicy === 'practice_only' && question.semanticTarget))");
  replace('scripts/compile-knowledge.mjs', "  'scripts/learning-graph/objective-projection.mjs',", "  'scripts/learning-graph/objective-projection.mjs',\n  'scripts/learning-graph/question-semantic-targets.mjs',");
  replace('scripts/test-canonical-graph.mjs', 'assert.equal(result.nodeCount, 79);', `assert.equal(result.nodeCount, ${nodes.length});`);
  replace('scripts/test-canonical-graph.mjs', 'assert.equal(result.claimCount, 64);', `assert.equal(result.claimCount, ${claims.length});`);
  replace('tests/canonical-learning-graph.behavior.test.ts', 'preservedNodes: 79, preservedClaims: 64', `preservedNodes: ${nodes.length}, preservedClaims: ${claims.length}`);
  replace('tests/bicycle-workshop-graph-typing.behavior.test.ts', 'nodeCount: 79', `nodeCount: ${nodes.length}`);
  replace('tests/bicycle-workshop-graph-typing.behavior.test.ts', 'claimCount: 64', `claimCount: ${claims.length}`);
  replace('scripts/test-objective-projection.mjs', 'assert.equal(report.projectedClaimCount, 29);', `assert.equal(report.projectedClaimCount, ${runtime.graphClaimRefs.length});`);
  // Product count fixtures move only for this explicit, audited expansion.
  const productionTestPath = 'tests/bicycle-workshop-production.behavior.test.ts';
  let productionTest = readFileSync(resolve(root, productionTestPath), 'utf8');
  productionTest = productionTest.replaceAll('admittedClaimCount: 29', `admittedClaimCount: ${runtime.graphClaimRefs.length}`).replaceAll('projectionRowCount: 29', `projectionRowCount: ${runtime.graphClaimRefs.length}`).replaceAll('graphNodeCount: 79', `graphNodeCount: ${nodes.length}`).replaceAll('graphClaimCount: 64', `graphClaimCount: ${claims.length}`);
  codeEdits.set(productionTestPath, productionTest);
  replace('src/contracts/question.ts', 'export interface BaseQuestion {', "export interface QuestionSemanticTarget {\n  schemaVersion: 1; kind: 'select_subject' | 'select_object';\n  claimRef: string; claimRevision: number; objectiveRef: string;\n  query: { predicate: string; subjectRef?: string; objectRef?: string; qualifiers: Record<string, string> };\n  optionNodeRefs: Record<string, string>; promptBinding: string; feedbackBinding: Feedback;\n  review: { status: 'editorial_candidate'; publishable: false };\n}\n\nexport interface BaseQuestion {\n  /** Build-time semantic traceability; not a second runtime evaluator. */\n  semanticTarget?: QuestionSemanticTarget;");
  const ledger = { migrationId: graph.semanticMigrationRef, sourceGraphRevision: 'd082aa4', preservedNodeIds: originalNodeIds, preservedClaimIds: originalClaimIds, addedNodeIds: additions.map((item) => item.id), addedClaimIds: additionsClaims.map((item) => item.id), revisedClaims: revised, revisedQuestionIds: targetIds, nodeCount: nodes.length, claimCount: claims.length, projectedClaimCount: runtime.graphClaimRefs.length, semanticApprovalGranted: false, sourceHashes: {} };
  for (const path of [modulePath, graph.ontologyFile, questionPath, guidePath]) ledger.sourceHashes[path] = createHash('sha256').update(readFileSync(resolve(root, path))).digest('hex');
  for (const [path, value] of changes) write(path, value);
  for (const [path, source] of codeEdits) writeFileSync(resolve(root, path), source);
  write(ledgerPath, ledger);
  execFileSync(process.execPath, ['scripts/learning-graph/objective-projection.mjs', '--write'], { cwd: root, stdio: 'inherit' });
  console.log(JSON.stringify({ migration: ledger.migrationId, nodes: nodes.length, claims: claims.length, runtimeClaims: runtime.graphClaimRefs.length, semanticTargets: targetIds.length }));
}
