import type { Question } from '../contracts/question';
import { getEngineRetryCapability, type EngineRetryCapability } from './engineRegistry';

export interface RetryPolicy {
  capability: EngineRetryCapability;
  retryAllowed: boolean;
  scaffoldAllowed: boolean;
}

export function isAssessmentRetryMode(mode: string): boolean {
  return mode === 'goal_mock' || mode === 'goal_pattern_mock';
}

export function resolveRetryPolicy(question: Question, mode: string): RetryPolicy {
  const capability = getEngineRetryCapability(question);
  const assessmentMode = isAssessmentRetryMode(mode);
  const retryAllowed = !assessmentMode && capability !== 'explanation_only';
  return {
    capability,
    retryAllowed,
    scaffoldAllowed: retryAllowed
  };
}
