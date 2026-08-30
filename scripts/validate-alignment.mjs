import { readdirSync, readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const readJson = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const errors = [];

const sourceRegistry = readJson('content/alignment-sources/registry.json');
const profileRegistry = readJson('content/learning-profiles/registry.json');
const taxonomy = readJson('content/taxonomies/learning.json');
const memberships = readdirSync(new URL('content/profile-memberships/', root))
  .filter((name) => name.endsWith('.json'))
  .sort()
  .map((name) => ({ name, value: readJson(`content/profile-memberships/${name}`) }));

const allowedSourceTypes = new Set([
  'editorial_prototype',
  'official_syllabus',
  'official_assessment',
  'official_reference'
]);
const allowedSourceStatuses = new Set(['internal', 'candidate', 'reviewed']);
const allowedAlignmentStatuses = new Set(['prototype_unverified', 'reviewed']);
const allowedFits = new Set(taxonomy.placementFits ?? []);
const officialSourceTypes = new Set(['official_syllabus', 'official_assessment', 'official_reference']);

const isDate = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(parsed) && new Date(parsed).toISOString().slice(0, 10) === value;
};
const hasText = (value) => typeof value === 'string' && value.trim().length > 0;
const isAcademicYear = (value) => {
  if (typeof value !== 'string' || !/^(\d{4})-(\d{2})$/.test(value)) return false;
  const [, startYearText, endYearText] = value.match(/^(\d{4})-(\d{2})$/) ?? [];
  const startYear = Number(startYearText);
  const expectedEnd = String((startYear + 1) % 100).padStart(2, '0');
  return endYearText === expectedEnd;
};
const sourceById = new Map();

for (const source of sourceRegistry.sources ?? []) {
  const prefix = source.id ?? '<alignment source>';
  if (!hasText(source.id)) {
    errors.push('Alignment source contains an empty id');
    continue;
  }
  if (sourceById.has(source.id)) errors.push(`Duplicate alignment source id ${source.id}`);
  sourceById.set(source.id, source);

  if (!allowedSourceTypes.has(source.type)) errors.push(`${prefix}: unsupported source type ${source.type}`);
  if (!allowedSourceStatuses.has(source.status)) errors.push(`${prefix}: unsupported source status ${source.status}`);
  if (!hasText(source.authority)) errors.push(`${prefix}: authority is required`);
  if (!hasText(source.title)) errors.push(`${prefix}: title is required`);
  if (!hasText(source.versionLabel)) errors.push(`${prefix}: versionLabel is required`);
  if (source.academicYear !== null && !isAcademicYear(source.academicYear)) {
    errors.push(`${prefix}: academicYear must be YYYY-YY or null`);
  }
  if (source.retrievedOn !== null && !isDate(source.retrievedOn)) errors.push(`${prefix}: retrievedOn must be YYYY-MM-DD or null`);

  if (source.status === 'reviewed') {
    if (!officialSourceTypes.has(source.type)) errors.push(`${prefix}: reviewed source must be an official source type`);
    if (!hasText(source.url) || !/^https:\/\//.test(source.url)) errors.push(`${prefix}: reviewed source requires an https URL`);
    if (!isDate(source.retrievedOn)) errors.push(`${prefix}: reviewed source requires retrievedOn`);
  }
}

const profiles = profileRegistry.profiles ?? [];
const profileById = new Map();
for (const profile of profiles) {
  const prefix = profile.id ?? '<profile>';
  if (!hasText(profile.id)) {
    errors.push('Profile contains an empty id');
    continue;
  }
  if (profileById.has(profile.id)) errors.push(`Duplicate profile id ${profile.id}`);
  profileById.set(profile.id, profile);

  if (!allowedAlignmentStatuses.has(profile.alignmentStatus)) {
    errors.push(`${prefix}: unsupported alignmentStatus ${profile.alignmentStatus}`);
  }

  const alignment = profile.alignment;
  if (!alignment || typeof alignment !== 'object') {
    errors.push(`${prefix}: alignment metadata is required`);
    continue;
  }

  if (!Array.isArray(alignment.sourceRefs) || alignment.sourceRefs.length === 0) {
    errors.push(`${prefix}: alignment.sourceRefs must contain at least one source`);
  }
  const resolvedSources = [];
  for (const sourceRef of alignment.sourceRefs ?? []) {
    const source = sourceById.get(sourceRef);
    if (!source) errors.push(`${prefix}: unknown alignment source ${sourceRef}`);
    else resolvedSources.push(source);
  }

  if (!hasText(alignment.versionLabel)) errors.push(`${prefix}: alignment.versionLabel is required`);
  if (alignment.academicYear !== null && alignment.academicYear !== undefined && !isAcademicYear(alignment.academicYear)) {
    errors.push(`${prefix}: alignment.academicYear must be YYYY-YY or null`);
  }
  if (alignment.reviewedAt !== null && !isDate(alignment.reviewedAt)) errors.push(`${prefix}: alignment.reviewedAt must be YYYY-MM-DD or null`);
  if (alignment.effectiveFrom !== null && !isDate(alignment.effectiveFrom)) errors.push(`${prefix}: alignment.effectiveFrom must be YYYY-MM-DD or null`);
  if (alignment.effectiveTo !== null && !isDate(alignment.effectiveTo)) errors.push(`${prefix}: alignment.effectiveTo must be YYYY-MM-DD or null`);
  if (alignment.effectiveFrom && alignment.effectiveTo && alignment.effectiveFrom > alignment.effectiveTo) {
    errors.push(`${prefix}: alignment effectiveFrom must not be after effectiveTo`);
  }

  if (profile.alignmentStatus === 'reviewed') {
    if (!isDate(alignment.reviewedAt)) errors.push(`${prefix}: reviewed alignment requires reviewedAt`);
    const hasApplicability = isAcademicYear(alignment.academicYear) || (isDate(alignment.effectiveFrom) && isDate(alignment.effectiveTo));
    if (!hasApplicability) errors.push(`${prefix}: reviewed alignment requires academicYear or effective date range`);
    const hasReviewedOfficialSource = resolvedSources.some(
      (source) => officialSourceTypes.has(source.type) && source.status === 'reviewed'
    );
    if (!hasReviewedOfficialSource) errors.push(`${prefix}: reviewed alignment requires a reviewed official source`);
  }
}

const membershipProfileRefs = new Set();
for (const { name, value: membership } of memberships) {
  const prefix = membership.profileRef ?? name;
  if (!hasText(membership.profileRef)) {
    errors.push(`${name}: profileRef is required`);
    continue;
  }
  if (membershipProfileRefs.has(membership.profileRef)) errors.push(`Duplicate membership collection for ${membership.profileRef}`);
  membershipProfileRefs.add(membership.profileRef);
  if (!profileById.has(membership.profileRef)) errors.push(`${prefix}: membership references unknown profile`);

  const provenance = membership.provenance;
  if (!provenance || typeof provenance !== 'object') {
    errors.push(`${prefix}: membership provenance is required`);
    continue;
  }
  if (!allowedAlignmentStatuses.has(provenance.status)) errors.push(`${prefix}: unsupported provenance status ${provenance.status}`);
  if (!Array.isArray(provenance.sourceRefs) || provenance.sourceRefs.length === 0) {
    errors.push(`${prefix}: provenance.sourceRefs must contain at least one source`);
  }
  const resolvedSources = [];
  for (const sourceRef of provenance.sourceRefs ?? []) {
    const source = sourceById.get(sourceRef);
    if (!source) errors.push(`${prefix}: unknown provenance source ${sourceRef}`);
    else resolvedSources.push(source);
  }
  if (!hasText(provenance.versionLabel)) errors.push(`${prefix}: provenance.versionLabel is required`);
  if (!hasText(provenance.placementBasis)) errors.push(`${prefix}: provenance.placementBasis is required`);
  if (provenance.academicYear !== null && provenance.academicYear !== undefined && !isAcademicYear(provenance.academicYear)) {
    errors.push(`${prefix}: provenance.academicYear must be YYYY-YY or null`);
  }
  if (provenance.reviewedAt !== null && !isDate(provenance.reviewedAt)) errors.push(`${prefix}: provenance.reviewedAt must be YYYY-MM-DD or null`);
  if (provenance.effectiveFrom !== null && !isDate(provenance.effectiveFrom)) errors.push(`${prefix}: provenance.effectiveFrom must be YYYY-MM-DD or null`);
  if (provenance.effectiveTo !== null && !isDate(provenance.effectiveTo)) errors.push(`${prefix}: provenance.effectiveTo must be YYYY-MM-DD or null`);

  if (provenance.status === 'reviewed') {
    if (!isDate(provenance.reviewedAt)) errors.push(`${prefix}: reviewed membership requires reviewedAt`);
    const hasApplicability = isAcademicYear(provenance.academicYear) || (isDate(provenance.effectiveFrom) && isDate(provenance.effectiveTo));
    if (!hasApplicability) errors.push(`${prefix}: reviewed membership requires academicYear or effective date range`);
    const hasReviewedOfficialSource = resolvedSources.some(
      (source) => officialSourceTypes.has(source.type) && source.status === 'reviewed'
    );
    if (!hasReviewedOfficialSource) errors.push(`${prefix}: reviewed membership requires a reviewed official source`);
  }

  const seenRows = new Set();
  for (const member of membership.members ?? []) {
    if (!hasText(member.rowId)) {
      errors.push(`${prefix}: membership contains an empty rowId`);
      continue;
    }
    if (seenRows.has(member.rowId)) errors.push(`${prefix}: duplicate membership rowId ${member.rowId}`);
    seenRows.add(member.rowId);
    if (!allowedFits.has(member.fit)) errors.push(`${prefix}/${member.rowId}: unsupported fit ${member.fit}`);
    for (const sourceRef of member.sourceRefs ?? []) {
      if (!sourceById.has(sourceRef)) errors.push(`${prefix}/${member.rowId}: unknown member source ${sourceRef}`);
    }
  }
}

if (errors.length) {
  console.error(`Alignment validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  const reviewedProfiles = profiles.filter((profile) => profile.alignmentStatus === 'reviewed').length;
  const reviewedMemberships = memberships.filter(({ value }) => value.provenance?.status === 'reviewed').length;
  console.log(
    `Alignment OK: ${sourceById.size} source(s), ${profiles.length} profile(s) (${reviewedProfiles} reviewed scope), ` +
    `${memberships.length} membership collection(s) (${reviewedMemberships} reviewed row mappings).`
  );
}
