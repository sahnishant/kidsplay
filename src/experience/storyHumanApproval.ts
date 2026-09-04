import approvalJson from '../../content/stories/v1-human-approval.json';
import type { StoryManifest } from './storiesContract';

interface StoryHumanApprovalV1 {
  schemaVersion: 1;
  approvalId: 'kidsplay.stories.human-approval.v1';
  sourceManifestGitBlobSha: string;
  approvedAt: string;
  approvedBy: string;
  manuscriptEditorialApproved: true;
  bedtimeCxApproved: true;
  offlineDeviceAcceptanceApproved: true;
  approvedStoryIds: string[];
}

function loadStoryHumanApproval(): StoryHumanApprovalV1 {
  const approval = approvalJson as StoryHumanApprovalV1;
  if (
    approval.schemaVersion !== 1
    || approval.approvalId !== 'kidsplay.stories.human-approval.v1'
    || !/^[a-f0-9]{40}$/.test(approval.sourceManifestGitBlobSha)
    || approval.manuscriptEditorialApproved !== true
    || approval.bedtimeCxApproved !== true
    || approval.offlineDeviceAcceptanceApproved !== true
    || !Array.isArray(approval.approvedStoryIds)
    || new Set(approval.approvedStoryIds).size !== approval.approvedStoryIds.length
  ) {
    throw new Error('Stories V1 HUMAN approval record is invalid');
  }
  return approval;
}

export const STORY_V1_HUMAN_APPROVAL = loadStoryHumanApproval();
const APPROVED_STORY_IDS = new Set(STORY_V1_HUMAN_APPROVAL.approvedStoryIds);

export function isStoryV1HumanApproved(storyId: string): boolean {
  return APPROVED_STORY_IDS.has(storyId);
}

export function applyStoryV1HumanApproval(manifest: StoryManifest): StoryManifest {
  return isStoryV1HumanApproved(manifest.storyId)
    ? { ...manifest, editorialStatus: 'reviewed' }
    : manifest;
}
