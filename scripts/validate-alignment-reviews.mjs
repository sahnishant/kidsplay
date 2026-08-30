import { readdirSync, readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const readJson = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const errors = [];
const hasText = (value) => typeof value === 'string' && value.trim().length > 0;
const isDate = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(parsed) && new Date(parsed).toISOString().slice(0, 10) === value;
};

const sourceRegistry = readJson('content/alignment-sources/registry.json');
const sourceById = new Map((sourceRegistry.sources ?? []).map((source) => [source.id, source]));
const membershipByProfile = new Map(
  readdirSync(new URL('content/profile-memberships/', root))
    .filter((name) => name.endsWith('.json'))
    .map((name) => readJson(`content/profile-memberships/${name}`))
    .map((membership) => [membership.profileRef, membership])
);
const reviewFiles = readdirSync(new URL('content/alignment-reviews/', root))
  .filter((name) => name.endsWith('.json'))
  .sort();

const allowedStatuses = new Set(['partial', 'completed']);
const allowedEvidenceTypes = new Set(['official_scope', 'assessment_format', 'direct_fact', 'direct_skill']);
const rowEvidenceTypes = new Set(['direct_fact', 'direct_skill']);
const allowedDecisions = new Set(['keep', 'remove', 'refit']);
const allowedTemporalBases = new Set(['current_year', 'historical_class2']);
const allowedFitBases = new Set(['editorial_retained', 'source_supported']);
const officialSourceTypes = new Set(['official_syllabus', 'official_assessment', 'official_reference']);

for (const fileName of reviewFiles) {
  const review = readJson(`content/alignment-reviews/${fileName}`);
  const prefix = review.profileRef ?? fileName;
  const membership = membershipByProfile.get(review.profileRef);

  if (review.schemaVersion !== 1) errors.push(`${prefix}: schemaVersion must be 1`);
  if (!hasText(review.profileRef)) errors.push(`${fileName}: profileRef is required`);
  if (!membership) errors.push(`${prefix}: review references unknown profile membership`);
  if (!allowedStatuses.has(review.status)) errors.push(`${prefix}: unsupported review status ${review.status}`);
  if (!isDate(review.reviewedAt)) errors.push(`${prefix}: reviewedAt must be YYYY-MM-DD`);

  const memberByRow = new Map((membership?.members ?? []).map((member) => [member.rowId, member]));
  const currentAcademicYear = membership?.provenance?.academicYear;
  let hasCurrentYearScopeEvidence = false;

  for (const [index, evidence] of (review.scopeEvidence ?? []).entries()) {
    const evidencePrefix = `${prefix}/scopeEvidence[${index}]`;
    const source = sourceById.get(evidence.sourceRef);
    if (!source) errors.push(`${evidencePrefix}: unknown sourceRef ${evidence.sourceRef}`);
    else {
      if (!officialSourceTypes.has(source.type) || source.status !== 'reviewed') {
        errors.push(`${evidencePrefix}: evidence source must be a reviewed official source`);
      }
      if (hasText(currentAcademicYear) && source.academicYear === currentAcademicYear) {
        hasCurrentYearScopeEvidence = true;
      }
    }
    if (!allowedEvidenceTypes.has(evidence.evidenceType)) {
      errors.push(`${evidencePrefix}: unsupported evidenceType ${evidence.evidenceType}`);
    }
    if (rowEvidenceTypes.has(evidence.evidenceType)) {
      errors.push(`${evidencePrefix}: row evidence type belongs in rowEvidence`);
    }
    if (!hasText(evidence.locator)) errors.push(`${evidencePrefix}: locator is required`);
    if (!hasText(evidence.note)) errors.push(`${evidencePrefix}: note is required`);
  }

  const seenRows = new Set();
  for (const [index, evidence] of (review.rowEvidence ?? []).entries()) {
    const evidencePrefix = `${prefix}/rowEvidence[${index}]`;
    const source = sourceById.get(evidence.sourceRef);
    if (!hasText(evidence.rowId)) errors.push(`${evidencePrefix}: rowId is required`);
    if (seenRows.has(evidence.rowId)) errors.push(`${prefix}: duplicate reviewed row ${evidence.rowId}`);
    seenRows.add(evidence.rowId);
    if (!memberByRow.has(evidence.rowId)) errors.push(`${evidencePrefix}: rowId is not in the profile membership`);
    if (!source) errors.push(`${evidencePrefix}: unknown sourceRef ${evidence.sourceRef}`);
    else if (!officialSourceTypes.has(source.type) || source.status !== 'reviewed') {
      errors.push(`${evidencePrefix}: evidence source must be a reviewed official source`);
    }
    if (!rowEvidenceTypes.has(evidence.evidenceType)) {
      errors.push(`${evidencePrefix}: evidenceType must be direct_fact or direct_skill`);
    }
    if (!allowedDecisions.has(evidence.decision)) errors.push(`${evidencePrefix}: unsupported decision ${evidence.decision}`);
    if (!allowedTemporalBases.has(evidence.temporalBasis)) {
      errors.push(`${evidencePrefix}: temporalBasis must be current_year or historical_class2`);
    }
    if ((evidence.decision === 'keep' || evidence.decision === 'refit') && !allowedFitBases.has(evidence.fitBasis)) {
      errors.push(`${evidencePrefix}: fitBasis must be editorial_retained or source_supported`);
    }
    if (evidence.decision === 'remove' && evidence.fitBasis !== undefined) {
      errors.push(`${evidencePrefix}: remove evidence must not declare fitBasis`);
    }
    if (!hasText(evidence.locator)) errors.push(`${evidencePrefix}: locator is required`);
    if (!hasText(evidence.note)) errors.push(`${evidencePrefix}: note is required`);

    if (source && evidence.temporalBasis === 'current_year') {
      if (!hasText(currentAcademicYear)) {
        errors.push(`${evidencePrefix}: current_year evidence requires profile academicYear`);
      } else if (source.academicYear !== currentAcademicYear) {
        errors.push(`${evidencePrefix}: current_year evidence source year ${source.academicYear ?? 'none'} must match profile year ${currentAcademicYear}`);
      }
    }

    if (source && evidence.temporalBasis === 'historical_class2') {
      if (source.type !== 'official_assessment') {
        errors.push(`${evidencePrefix}: historical_class2 evidence must come from an official assessment`);
      }
      if (!hasText(source.academicYear) || source.academicYear === currentAcademicYear) {
        errors.push(`${evidencePrefix}: historical_class2 evidence must come from a different named academic year`);
      }
      if (!hasCurrentYearScopeEvidence) {
        errors.push(`${evidencePrefix}: historical_class2 evidence requires current-year official scope evidence in the same review`);
      }
    }

    const member = memberByRow.get(evidence.rowId);
    if (evidence.decision === 'keep' && evidence.fit !== member?.fit) {
      errors.push(`${evidencePrefix}: keep evidence fit ${evidence.fit} must match membership fit ${member?.fit}`);
    }
    if ((evidence.decision === 'keep' || evidence.decision === 'refit') && !hasText(evidence.fit)) {
      errors.push(`${evidencePrefix}: ${evidence.decision} evidence requires fit`);
    }
  }

  if (review.status === 'completed' && membership && seenRows.size !== memberByRow.size) {
    errors.push(`${prefix}: completed review must contain row evidence for every membership row`);
  }
}

if (errors.length) {
  console.error(`Alignment review validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Alignment review OK: ${reviewFiles.length} review file(s) with validated official evidence references, temporal basis and fit basis.`);
}
