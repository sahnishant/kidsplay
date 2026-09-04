export type SemanticChoicePresentationTier = 'first_play' | 'preschool' | 'early_primary';

export interface SemanticChoiceCandidate {
  semanticRef: string;
  /**
   * Canonical relationship / comparison evidence explaining why this candidate
   * belongs in the declared contrast set. Presentation code must not invent
   * distractors from image availability or string similarity.
   */
  contrastBasisRef: string;
}

export interface SemanticChoicePlan {
  schemaVersion: 1;
  presentationTier: SemanticChoicePresentationTier;
  targetSemanticRef: string;
  candidates: readonly SemanticChoiceCandidate[];
}

export interface OddOneOutCandidate {
  semanticRef: string;
  /** Derived upstream from the declared canonical comparison rule. */
  satisfiesRule: boolean;
}

export interface OddOneOutPlan {
  schemaVersion: 1;
  comparisonDimensionRef: string;
  candidates: readonly OddOneOutCandidate[];
}

export interface ResolvedOddOneOutPlan {
  comparisonDimensionRef: string;
  inlierSemanticRefs: string[];
  oddSemanticRef: string;
}

function assertStableRef(value: string, context: string): void {
  if (!value.trim() || /\s/.test(value)) {
    throw new Error(`${context} must be a non-empty stable ref without whitespace`);
  }
}

function assertUniqueSemanticRefs(values: readonly { semanticRef: string }[], context: string): void {
  const seen = new Set<string>();
  for (const candidate of values) {
    assertStableRef(candidate.semanticRef, `${context}.semanticRef`);
    if (seen.has(candidate.semanticRef)) {
      throw new Error(`${context}: duplicate semantic ref ${candidate.semanticRef}`);
    }
    seen.add(candidate.semanticRef);
  }
}

export function validateSemanticChoicePlan(plan: SemanticChoicePlan): SemanticChoicePlan {
  if (plan.schemaVersion !== 1) throw new Error('Semantic choice plan must use schemaVersion 1');
  assertStableRef(plan.targetSemanticRef, 'targetSemanticRef');

  const maximumChoices = plan.presentationTier === 'first_play' ? 2 : 4;
  const minimumChoices = 2;
  if (plan.candidates.length < minimumChoices || plan.candidates.length > maximumChoices) {
    throw new Error(
      `${plan.presentationTier}: semantic choice requires ${minimumChoices}-${maximumChoices} candidates`
    );
  }

  assertUniqueSemanticRefs(plan.candidates, 'semantic choice candidates');
  if (!plan.candidates.some((candidate) => candidate.semanticRef === plan.targetSemanticRef)) {
    throw new Error('Semantic choice candidates must contain the target semantic ref');
  }

  for (const candidate of plan.candidates) {
    assertStableRef(candidate.contrastBasisRef, `${candidate.semanticRef}.contrastBasisRef`);
  }

  return {
    ...plan,
    candidates: plan.candidates.map((candidate) => ({ ...candidate }))
  };
}

/**
 * Resolves only the structural uniqueness of an odd-one-out set. The caller is
 * responsible for deriving satisfiesRule from canonical semantic knowledge.
 * This function never infers meaning from labels, spelling, images or tags.
 */
export function resolveOddOneOutPlan(plan: OddOneOutPlan): ResolvedOddOneOutPlan {
  if (plan.schemaVersion !== 1) throw new Error('Odd-one-out plan must use schemaVersion 1');
  assertStableRef(plan.comparisonDimensionRef, 'comparisonDimensionRef');
  if (plan.candidates.length !== 4) {
    throw new Error('Odd-one-out V1 requires exactly four candidates');
  }
  assertUniqueSemanticRefs(plan.candidates, 'odd-one-out candidates');

  const inliers = plan.candidates.filter((candidate) => candidate.satisfiesRule);
  const outliers = plan.candidates.filter((candidate) => !candidate.satisfiesRule);
  if (inliers.length !== 3 || outliers.length !== 1) {
    throw new Error(
      `Odd-one-out must have exactly three rule-satisfying candidates and one rule-failing candidate; got ${inliers.length}/${outliers.length}`
    );
  }

  return {
    comparisonDimensionRef: plan.comparisonDimensionRef,
    inlierSemanticRefs: inliers.map((candidate) => candidate.semanticRef),
    oddSemanticRef: outliers[0].semanticRef
  };
}

export function semanticChoiceMaximumChoices(tier: SemanticChoicePresentationTier): number {
  return tier === 'first_play' ? 2 : 4;
}
