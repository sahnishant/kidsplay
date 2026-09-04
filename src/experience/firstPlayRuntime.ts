import type { EvaluationResult } from '../contracts/runtime';
import {
  firstPlayEvidenceMayAffectMastery,
  type FirstPlayEvidenceClass
} from './firstPlayPolicy';

export type FirstPlayFeedbackMode = 'discovery' | 'celebrate' | 'retry_in_place';

/**
 * Existing evaluators may still provide correctness feedback for guided play,
 * but only explicitly evaluative First Play evidence may reach mastery/knowledge stores.
 */
export function applyFirstPlayEvidencePolicy(
  evidenceClass: FirstPlayEvidenceClass,
  result: EvaluationResult
): EvaluationResult {
  if (firstPlayEvidenceMayAffectMastery(evidenceClass)) return result;
  return {
    ...result,
    masteryEvidence: [],
    knowledgeEvidence: []
  };
}

export function resolveFirstPlayFeedback(
  evidenceClass: FirstPlayEvidenceClass,
  result?: Pick<EvaluationResult, 'correct'>
): FirstPlayFeedbackMode {
  if (evidenceClass === 'exploration') return 'discovery';
  if (!result) throw new Error(`${evidenceClass}: guided/evaluative First Play feedback requires evaluator result`);
  return result.correct ? 'celebrate' : 'retry_in_place';
}
