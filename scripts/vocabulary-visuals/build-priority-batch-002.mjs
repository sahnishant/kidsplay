import { readFileSync, writeFileSync } from 'node:fs';

const root = new URL('../../', import.meta.url);
const readJson = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const outputUrl = new URL('content/vocabulary-visuals/batches/__generated-priority-batch-002.json', root);

const gap = readJson('content/vocabulary-visuals/__generated-priority-gap-pre-batch-002.json');
if (gap?.schemaVersion !== 1 || gap?.issueRef !== 88 || gap?.status !== 'generated_review_queue_pre_batch_002') {
  throw new Error('Batch 002 requires the frozen deterministic #88 pre-batch review queue');
}
const gapByLemma = new Map((gap.items ?? []).map((item) => [item.lemma, item]));

const reviewedKnowledge = readJson('content/knowledge/english-vocabulary-primary-reviewed.json');
const reviewedEntries = (Array.isArray(reviewedKnowledge) ? reviewedKnowledge : [reviewedKnowledge])
  .flatMap((source) => source.entries ?? []);
const reviewedByLemma = new Map(reviewedEntries.map((entry) => [entry.id, entry]));

const items = [];
const addItem = (lemma, partOfSpeech, senseKey, strategy, sceneTemplate = null, parameters = null, motionPolicy = 'none', answerSafety = 'post_answer_only', reviewSource = 'single_candidate_priority_gap') => {
  const item = { lemma, senseKey, partOfSpeech, strategy, maturity: 'V1', motionPolicy, answerSafety, reviewSource };
  if (sceneTemplate) item.sceneTemplate = sceneTemplate;
  if (parameters) item.parameters = parameters;
  items.push(item);
};

const addGap = (lemma, strategy, sceneTemplate = null, parameters = null, motionPolicy = 'none', answerSafety = 'post_answer_only') => {
  const candidate = gapByLemma.get(lemma);
  if (!candidate) throw new Error(`${lemma}: reviewed batch catalog entry is absent from the frozen #88 priority gap`);
  if (candidate.polysemyRisk !== 'low' || candidate.candidateSenseCount !== 1 || candidate.candidateIds?.length !== 1) {
    throw new Error(`${lemma}: batch-002 exact-sense admission requires exactly one pinned candidate identifier`);
  }
  const senseKey = String(candidate.candidateIds[0]);
  if (!senseKey.startsWith(`${lemma}#`)) throw new Error(`${lemma}: candidate identifier is not an explicit lemma sense key`);
  addItem(lemma, candidate.partOfSpeech, senseKey, strategy, sceneTemplate, parameters, motionPolicy, answerSafety);
};

const addHumanReviewed = (lemma, expectedSenseKey, strategy, sceneTemplate = null, parameters = null, motionPolicy = 'none', answerSafety = 'post_answer_only') => {
  const entry = reviewedByLemma.get(lemma);
  const curation = entry?.meta?.curation;
  if (!entry || curation?.status !== 'reviewed' || curation?.candidateId !== expectedSenseKey || curation?.sourceGlossCopied !== false) {
    throw new Error(`${lemma}: human-reviewed visual strategy must resolve to the exact #51 sense without copied source gloss`);
  }
  const partOfSpeech = expectedSenseKey.includes('#v#') ? 'verb' : expectedSenseKey.includes('#a#') ? 'adjective' : 'noun';
  addItem(lemma, partOfSpeech, expectedSenseKey, strategy, sceneTemplate, parameters, motionPolicy, answerSafety, 'human_reviewed_primary_meaning');
};

// Only use the existing generic building place template where a building/facility is a faithful static cue.
const SAFE_BUILDING_PLACE_LEMMAS = ['hotel', 'museum', 'restaurant', 'airport', 'factory', 'cafe', 'nursery'];
for (const lemma of SAFE_BUILDING_PLACE_LEMMAS) addGap(lemma, 'place_scene', 'place', { placeKind: lemma });

const ROLE_LEMMAS = [
  'artist', 'mayor', 'singer', 'employee', 'actress', 'tourist', 'creator', 'poet', 'scientist',
  'physician', 'sheriff', 'warrior', 'farmer', 'consultant', 'surgeon', 'athlete', 'voter', 'seller', 'researcher',
  'historian', 'landlord', 'economist', 'dentist', 'blogger', 'composer', 'explorer', 'supplier', 'teammate', 'barber',
  'competitor', 'narrator', 'roommate', 'princess'
];
for (const lemma of ROLE_LEMMAS) addGap(lemma, 'person_role', 'person-role', { role: lemma }, 'optional_meaningful');

for (const lemma of ['june', 'january', 'december', 'february']) {
  addGap(lemma, 'sequence_scene', 'sequence', { relation: 'month-in-calendar', position: lemma });
}
addGap('friday', 'sequence_scene', 'sequence', { relation: 'day-of-week', position: 'friday' });
addGap('weekend', 'sequence_scene', 'sequence', { relation: 'end-of-week' });
addGap('autumn', 'sequence_scene', 'sequence', { relation: 'season-in-year', position: 'autumn' });
addGap('eighth', 'sequence_scene', 'sequence', { position: 'eighth' });
addGap('overnight', 'sequence_scene', 'sequence', { timeRelation: 'through-the-night' });
addGap('noon', 'sequence_scene', 'sequence', { dayPeriod: 'noon' });
for (const [lemma, quantity] of [['forty', 40], ['fifteen', 15], ['thirteen', 13], ['fourteen', 14], ['seventeen', 17], ['eighteen', 18]]) {
  addGap(lemma, 'quantity_scene', 'quantity-comparison', { quantity });
}

for (const lemma of ['huge', 'tiny', 'vast']) addGap(lemma, 'attribute_contrast', 'attribute-contrast', { dimension: 'size', target: lemma });
addGap('nearby', 'spatial_relation', 'spatial-relation', { relation: 'near' });
addGap('solar', 'diagrammatic', 'simple-diagram', { diagramKind: 'sun-related' });
for (const lemma of ['weekly', 'monthly']) addGap(lemma, 'sequence_scene', 'sequence', { relation: lemma });
addGap('swift', 'attribute_contrast', 'attribute-contrast', { dimension: 'speed', target: 'fast' }, 'optional_meaningful');
for (const lemma of ['yellow', 'pink', 'orange']) addGap(lemma, 'attribute_contrast', 'attribute-contrast', { dimension: 'color', target: lemma });

// These exact senses are audited, but the current generic visual grammar would be weak or misleading.
// Record them as textual-only rather than inflating visual breadth.
const TEXTUAL_ONLY = [
  'district', 'beach', 'valley', 'kitchen', 'campus', 'highway', 'bedroom', 'cave', 'classroom', 'zoo', 'pond',
  'hometown', 'backyard', 'corridor', 'isle', 'gateway', 'porch', 'cemetery', 'employer',
  'urgent', 'affordable', 'wealthy', 'balanced', 'elderly', 'teenage', 'alike', 'skilled', 'cruel', 'worrying',
  'respected', 'selfish', 'mighty', 'passionate', 'magnificent', 'enjoyable', 'optional', 'awesome', 'excellent',
  'expensive', 'incredible'
];
for (const lemma of TEXTUAL_ONLY) addGap(lemma, 'textual_only', null, null, 'none', 'neutral_safe');

// #51 supplies exact human-reviewed senses for these otherwise-polysemous priority lemmas.
// Weak visual mappings stay V1/textual or renderer-only; only the semantically faithful subset is staged for runtime proof.
addHumanReviewed('ask', 'ask#v#2', 'textual_only', null, null, 'none', 'neutral_safe');
addHumanReviewed('find', 'find#v#3', 'textual_only', null, null, 'none', 'neutral_safe');
addHumanReviewed('floor', 'floor#n#1', 'textual_only', null, null, 'none', 'neutral_safe');
addHumanReviewed('guide', 'guide#n#2', 'textual_only', null, null, 'none', 'neutral_safe');
addHumanReviewed('environment', 'environment#n#2', 'textual_only', null, null, 'none', 'neutral_safe');
addHumanReviewed('minute', 'minute#n#1', 'textual_only', null, null, 'none', 'neutral_safe');
addHumanReviewed('notice', 'notice#n#1', 'textual_only', null, null, 'none', 'neutral_safe');

addHumanReviewed('fast', 'fast#a#1', 'attribute_contrast', 'attribute-contrast', { dimension: 'speed', target: 'fast', contrast: 'slow' }, 'recommended_meaningful');
addHumanReviewed('full', 'full#a#1', 'attribute_contrast', 'attribute-contrast', { dimension: 'fill-level', target: 'full', contrast: 'empty' });
addHumanReviewed('library', 'library#n#3', 'place_scene', 'place', { placeKind: 'library' });

const senseKeys = items.map((item) => item.senseKey);
if (new Set(senseKeys).size !== senseKeys.length) throw new Error('Batch 002 contains duplicate sense keys');
if (items.length < 100) throw new Error(`Batch 002 must materially expand breadth; got ${items.length} items`);
const sceneGrammarItems = items.filter((item) => item.sceneTemplate).length;
const textualOnlyItems = items.filter((item) => item.strategy === 'textual_only').length;
const humanReviewedItems = items.filter((item) => item.reviewSource === 'human_reviewed_primary_meaning').length;
if (sceneGrammarItems / items.length < 0.6) throw new Error('Batch 002 must reuse existing scene grammar for a clear majority of reviewed senses');

const output = {
  schemaVersion: 1,
  id: 'vocabulary.visual-strategy.priority-batch-002',
  issueRef: 88,
  parentIssueRef: 76,
  status: 'reviewed_visual_strategy',
  reviewBasis: {
    priorityGapWorkflowRunId: 33460230062,
    priorityGapHeadSha: '5935ade40ff336b87fe918790ee49ee72b1bdb70',
    priorityGapArtifactSha256: '8394977189090d3dab939e76ed1e252d197352f70988ae4f226432a12e21b130',
    rule: 'Single-candidate queue rows use their exact pinned candidate identifier. Ten otherwise-polysemous rows use exact #51 human-reviewed candidate ids. No source gloss is copied. Existing renderer meaning was reviewed conservatively; weak generic pictures are textual-only.'
  },
  policy: {
    bareLemmaMappingAllowed: false,
    definitionsIncluded: false,
    sourceGlossesIncluded: false,
    profilePlacementInferred: false,
    assessmentAnswerRevealAllowed: false,
    humanEditorialDefinitionApprovalInferredFromVisualReview: false
  },
  summary: {
    items: items.length,
    sceneGrammarItems,
    textualOnlyItems,
    humanReviewedSenseItems: humanReviewedItems,
    runtimeProofCandidates: 3,
    directVisualItems: 0,
    newAssetBlockers: 0
  },
  items
};

writeFileSync(outputUrl, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(`Built #88 reviewed batch 002: ${items.length} exact sense strategy item(s); faithful scene-grammar reuse ${sceneGrammarItems}/${items.length}; textual-only ${textualOnlyItems}; human-reviewed exact senses ${humanReviewedItems}; runtime proof candidates 3.`);
