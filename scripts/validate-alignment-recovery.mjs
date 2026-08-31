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
const isAcademicYear = (value) => typeof value === 'string' && /^\d{4}-\d{2}$/.test(value);

function officialSofUrl(value) {
  if (!hasText(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'sofworld.org';
  } catch {
    return false;
  }
}

const profileRegistry = readJson('content/learning-profiles/registry.json');
const profileIds = new Set((profileRegistry.profiles ?? []).map((profile) => profile.id));
const sourceRegistry = readJson('content/alignment-sources/registry.json');
const sourceById = new Map((sourceRegistry.sources ?? []).map((source) => [source.id, source]));
const recoveryDirectory = new URL('content/alignment-recovery/', root);
const recoveryFiles = readdirSync(recoveryDirectory)
  .filter((name) => name.endsWith('.json'))
  .sort();

const allowedStatuses = new Set([
  'candidate',
  'blocked_uninspectable',
  'blocked_year_unbound',
  'rejected_wrong_olympiad',
  'saturated_no_official_artifact',
  'recovered'
]);
const allowedDiscoveryBases = new Set([
  'adjacent_official_fids',
  'official_search_result',
  'official_domain_search',
  'official_legacy_artifact',
  'official_page_link'
]);

let leadCount = 0;
let recoveredCount = 0;

for (const fileName of recoveryFiles) {
  const recovery = readJson(`content/alignment-recovery/${fileName}`);
  const prefix = recovery.profileRef ?? fileName;

  if (recovery.schemaVersion !== 1) errors.push(`${prefix}: schemaVersion must be 1`);
  if (!hasText(recovery.profileRef) || !profileIds.has(recovery.profileRef)) {
    errors.push(`${prefix}: profileRef must identify a registered learning profile`);
  }
  if (!isDate(recovery.checkedOn)) errors.push(`${prefix}: checkedOn must be YYYY-MM-DD`);
  if (!Array.isArray(recovery.leads) || recovery.leads.length === 0) {
    errors.push(`${prefix}: leads must be a non-empty array`);
    continue;
  }

  const seenIds = new Set();
  const seenCandidateUrls = new Set();
  for (const [index, lead] of recovery.leads.entries()) {
    leadCount += 1;
    const leadPrefix = `${prefix}/leads[${index}]`;

    if (!hasText(lead.id)) errors.push(`${leadPrefix}: id is required`);
    else if (seenIds.has(lead.id)) errors.push(`${prefix}: duplicate recovery lead id ${lead.id}`);
    else seenIds.add(lead.id);

    if (!allowedStatuses.has(lead.status)) {
      errors.push(`${leadPrefix}: unsupported status ${lead.status}`);
    }
    if (!allowedDiscoveryBases.has(lead.discoveryBasis)) {
      errors.push(`${leadPrefix}: unsupported discoveryBasis ${lead.discoveryBasis}`);
    }
    if (typeof lead.evidenceEligible !== 'boolean') {
      errors.push(`${leadPrefix}: evidenceEligible must be boolean`);
    }
    if (!hasText(lead.note)) errors.push(`${leadPrefix}: note is required`);

    if (lead.candidateUrl !== null && lead.candidateUrl !== undefined) {
      if (!officialSofUrl(lead.candidateUrl)) {
        errors.push(`${leadPrefix}: candidateUrl must be an https://sofworld.org URL or null`);
      } else if (seenCandidateUrls.has(lead.candidateUrl)) {
        errors.push(`${prefix}: duplicate candidateUrl ${lead.candidateUrl}`);
      } else {
        seenCandidateUrls.add(lead.candidateUrl);
      }
    }

    if (!Array.isArray(lead.officialContextUrls)) {
      errors.push(`${leadPrefix}: officialContextUrls must be an array`);
    } else {
      for (const [contextIndex, contextUrl] of lead.officialContextUrls.entries()) {
        if (!officialSofUrl(contextUrl)) {
          errors.push(`${leadPrefix}/officialContextUrls[${contextIndex}]: must be an https://sofworld.org URL`);
        }
      }
    }

    if (lead.status === 'blocked_year_unbound') {
      if (lead.academicYear !== null) {
        errors.push(`${leadPrefix}: blocked_year_unbound must keep academicYear null`);
      }
    } else if (!isAcademicYear(lead.academicYear)) {
      errors.push(`${leadPrefix}: academicYear must be YYYY-YY unless the lead is blocked_year_unbound`);
    }

    if (lead.status === 'recovered') {
      recoveredCount += 1;
      if (lead.evidenceEligible !== true) {
        errors.push(`${leadPrefix}: recovered source must set evidenceEligible=true`);
      }
      if (!hasText(lead.sourceRef)) {
        errors.push(`${leadPrefix}: recovered source requires sourceRef`);
      } else {
        const source = sourceById.get(lead.sourceRef);
        if (!source) {
          errors.push(`${leadPrefix}: sourceRef ${lead.sourceRef} is not registered`);
        } else {
          if (source.type !== 'official_assessment' || source.status !== 'reviewed') {
            errors.push(`${leadPrefix}: recovered exact-evidence sourceRef must be a reviewed official_assessment`);
          }
          if (!isAcademicYear(source.academicYear)) {
            errors.push(`${leadPrefix}: recovered sourceRef must have a named academicYear`);
          }
          if (isAcademicYear(lead.academicYear) && source.academicYear !== lead.academicYear) {
            errors.push(`${leadPrefix}: sourceRef academicYear ${source.academicYear ?? 'none'} must match lead ${lead.academicYear}`);
          }
          if (!officialSofUrl(source.url)) {
            errors.push(`${leadPrefix}: recovered sourceRef must resolve to an official SOF URL`);
          }
          if (hasText(lead.candidateUrl) && source.url !== lead.candidateUrl) {
            errors.push(`${leadPrefix}: recovered sourceRef URL must match candidateUrl exactly`);
          }
        }
      }
    } else {
      if (lead.evidenceEligible !== false) {
        errors.push(`${leadPrefix}: non-recovered lead must set evidenceEligible=false`);
      }
      if (lead.sourceRef !== undefined) {
        errors.push(`${leadPrefix}: non-recovered lead must not declare sourceRef`);
      }
    }
  }
}

if (errors.length) {
  console.error(`Alignment recovery validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(
    `Alignment recovery OK: ${recoveryFiles.length} registry file(s), ${leadCount} lead(s), ` +
    `${recoveredCount} recovered official assessment source(s); non-recovered leads remain ineligible for row evidence.`
  );
}
