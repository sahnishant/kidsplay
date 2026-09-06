import type { StudioWorkspace } from '../experience/studioWorkspace.mjs';
export const STUDIO_WORK_PREFIX: string;
export interface StudioStorage { readonly length: number; key(index: number): string | null; getItem(key: string): string | null; setItem(key: string, value: string): void; }
export type StudioWorkStatus = 'empty' | 'ready' | 'saved' | 'unchanged' | 'unavailable' | 'corrupt' | 'conflict' | 'full' | 'invalid';
export interface StudioWorkLoad { status: StudioWorkStatus; token: string | null; workspace: unknown; }
export interface StudioWorkSave { status: StudioWorkStatus; token: string | null; }
export interface StudioWorkStore {
  load(activityId: string): StudioWorkLoad;
  save(activityId: string, workspace: StudioWorkspace | null, expectedToken: string | null): StudioWorkSave;
  clear(activityId: string, expectedToken: string | null): StudioWorkSave;
}
export function studioWorkKey(ownerId: string, activityId: string): string;
export function browserStudioStorage(): StudioStorage | null;
export function createStudioWorkStore(ownerId: string, storageProvider?: () => StudioStorage | null): StudioWorkStore;
