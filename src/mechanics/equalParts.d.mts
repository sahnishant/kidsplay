import type { EqualPartsQuestion } from '../contracts/question';
export interface EqualPartsResponse { assignments: Array<string | null>; }
export interface EqualPartsDiagnostic {
  status: 'invalid_response' | 'incomplete' | 'mismatch' | 'correct';
  correct: boolean;
  counts: Record<string, number>;
  targets: Record<string, number>;
  unassigned: number;
}
export function validateEqualPartsQuestion(question: unknown): string[];
export function assertEqualPartsQuestion(question: unknown): asserts question is EqualPartsQuestion;
export function equalPartsTargetCounts(question: EqualPartsQuestion): Record<string, number>;
export function isEqualPartsResponse(question: EqualPartsQuestion, response: unknown): response is EqualPartsResponse;
export function evaluateEqualParts(question: EqualPartsQuestion, response: unknown): EqualPartsDiagnostic;
export function createEqualPartsState(question: EqualPartsQuestion, saved?: unknown): EqualPartsResponse;
export function equalPartSector(index: number, count: number): { path: string; labelX: number; labelY: number };
