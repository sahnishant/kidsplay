export type DiscoveryKind = 'animal_nature' | 'vocabulary_semantic' | 'place' | 'science' | 'field_note';

export interface DiscoveryProjectionRule {
  ruleId: string;
  sourceEventRef: string;
  discoveryId: string;
  kind: DiscoveryKind;
  /** Canonical semantic/knowledge refs used by existing presentation authorities. */
  canonicalRefs: readonly string[];
  /** Optional location/story provenance for child context, not a second truth source. */
  foundAtRef?: string;
}

export interface DiscoveryEntry {
  discoveryId: string;
  kind: DiscoveryKind;
  canonicalRefs: string[];
  sourceEventRef: string;
  foundAtRef?: string;
}

const STABLE_REF = /^[a-z0-9]+(?:[._:#-][a-z0-9]+)*$/i;
const VALID_KINDS = new Set<DiscoveryKind>([
  'animal_nature',
  'vocabulary_semantic',
  'place',
  'science',
  'field_note'
]);

function assertStableRef(value: unknown, context: string): string {
  if (typeof value !== 'string' || !value.trim() || !STABLE_REF.test(value)) {
    throw new Error(`${context} must be a stable ref`);
  }
  return value;
}

export function validateDiscoveryProjectionRules(
  rules: readonly DiscoveryProjectionRule[]
): DiscoveryProjectionRule[] {
  if (!Array.isArray(rules)) throw new Error('Discovery projection rules must be an array');
  const validated = rules.map((rule, index) => {
    const ruleId = assertStableRef(rule.ruleId, `rules[${index}].ruleId`);
    const sourceEventRef = assertStableRef(rule.sourceEventRef, `${ruleId}.sourceEventRef`);
    const discoveryId = assertStableRef(rule.discoveryId, `${ruleId}.discoveryId`);
    if (!VALID_KINDS.has(rule.kind)) throw new Error(`${ruleId}: invalid discovery kind`);
    if (!Array.isArray(rule.canonicalRefs) || rule.canonicalRefs.length === 0) {
      throw new Error(`${ruleId}: canonicalRefs must be non-empty`);
    }
    const canonicalRefs = rule.canonicalRefs.map((ref, refIndex) =>
      assertStableRef(ref, `${ruleId}.canonicalRefs[${refIndex}]`)
    );
    if (new Set(canonicalRefs).size !== canonicalRefs.length) {
      throw new Error(`${ruleId}: duplicate canonical refs`);
    }
    const foundAtRef = rule.foundAtRef === undefined
      ? undefined
      : assertStableRef(rule.foundAtRef, `${ruleId}.foundAtRef`);
    return {
      ruleId,
      sourceEventRef,
      discoveryId,
      kind: rule.kind,
      canonicalRefs,
      ...(foundAtRef ? { foundAtRef } : {})
    };
  });

  const ruleIds = validated.map((rule) => rule.ruleId);
  const discoveryIds = validated.map((rule) => rule.discoveryId);
  if (new Set(ruleIds).size !== ruleIds.length) throw new Error('Discovery projection rules contain duplicate rule ids');
  if (new Set(discoveryIds).size !== discoveryIds.length) {
    throw new Error('Each Discovery Book entry must have exactly one projection rule');
  }
  return validated;
}

/**
 * Pure projection: repeated/replayed source events cannot mint duplicate
 * discoveries because the canonical event-ref set is de-duplicated before
 * rule projection. Nothing is spent, incremented or stored as currency.
 */
export function projectDiscoveries(
  rules: readonly DiscoveryProjectionRule[],
  completedEventRefs: readonly string[]
): DiscoveryEntry[] {
  const validatedRules = validateDiscoveryProjectionRules(rules);
  const completed = new Set(
    completedEventRefs.map((ref, index) => assertStableRef(ref, `completedEventRefs[${index}]`))
  );

  return validatedRules
    .filter((rule) => completed.has(rule.sourceEventRef))
    .map((rule) => ({
      discoveryId: rule.discoveryId,
      kind: rule.kind,
      canonicalRefs: [...rule.canonicalRefs],
      sourceEventRef: rule.sourceEventRef,
      ...(rule.foundAtRef ? { foundAtRef: rule.foundAtRef } : {})
    }))
    .sort((a, b) => a.discoveryId.localeCompare(b.discoveryId));
}
