import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const modulePath = 'content/curriculum-modules/ncert/2026-27/class-2/english/mridang/chapters/my-bicycle.json';
const sourcePath = 'content/source-manifests/ncert-mridang-class2-english-2026-27.json';
const claimsPath = 'content/learning-graph/claims/mridang-my-bicycle.json';
const mediaPath = 'content/media-bindings/mridang/my-bicycle.json';
const assessmentPath = 'content/module-assessments/mridang/my-bicycle.json';

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf8')) as T;
}

function validate(): Record<string, unknown> {
  const output = execFileSync(process.execPath, [
    'scripts/learning-graph/validate-curriculum-module.mjs', modulePath, '--json'
  ], { cwd: process.cwd(), encoding: 'utf8' });
  return JSON.parse(output.trim()) as Record<string, unknown>;
}

describe('Mridang My Bicycle curriculum Learning Graph pilot', () => {
  it('validates the bounded module and preserves the all-rights-reserved runtime boundary', () => {
    const result = validate();
    expect(result).toMatchObject({
      rightsStatus: 'all_rights_reserved',
      runtimeEligible: false,
      assessmentTargetCount: 9,
      blockedLexicalTargets: ['track']
    });

    const source = readJson<any>(sourcePath);
    expect(source.files[0]).toMatchObject({
      sha256: 'ed3d9b6b69d1dc74462eb9b7a95cd29f5ef90ba04b496c33d08e1b743bcc3785',
      bytes: 1306355,
      includedInRepository: false,
      runtimeBundled: false
    });
    expect(source.contentHandling).toMatchObject({
      verbatimSourceTextStored: false,
      sourceArtworkStored: false,
      pageImagesStored: false,
      runtimePublicationAllowed: false
    });
  });

  it('separates reusable truth from poem-local context', () => {
    const module = readJson<any>(modulePath);
    const claims = readJson<any>(claimsPath).claims as any[];
    const byId = new Map(claims.map((claim) => [claim.id, claim]));

    for (const id of module.sharedClaimRefs) {
      expect(byId.get(id)).toMatchObject({ authority: { kind: 'canonical' }, scope: { kind: 'shared' } });
    }
    for (const id of module.localClaimRefs) {
      expect(byId.get(id).authority.kind).not.toBe('canonical');
      expect(byId.get(id).scope.moduleRef).toBe(module.moduleId);
    }
  });

  it('targets English capabilities without silently granting supporting or chapter-context mastery', () => {
    const blueprint = readJson<any>(assessmentPath);
    for (const target of blueprint.targets) {
      expect(target.evidencePolicy.supportingClaims).toBe('none');
      expect(target.evidencePolicy.contextClaims).toBe('none');
      if (target.mode === 'non_evaluative') {
        expect(Object.values(target.evidencePolicy).every((value) => value === 'none')).toBe(true);
      }
    }

    const comprehension = blueprint.targets.find((target: any) => target.id === 'target.my-bicycle.comprehension.colour-retrieval');
    expect(comprehension.targetCapabilityRefs).toEqual(['capability.english.reading.literal-retrieval']);
    expect(comprehension.contextClaimRefs).toEqual(['claim.chapter.my-bicycle.bicycle-colour-red']);
    expect(comprehension.evidencePolicy.contextClaims).toBe('none');
  });

  it('keeps answer-revealing teaching media out of pre-answer assessment', () => {
    const media = readJson<any>(mediaPath).bindings as any[];
    const blueprint = readJson<any>(assessmentPath);
    const byId = new Map(media.map((binding) => [binding.id, binding]));

    const revealing = media.filter((binding) => binding.answerDisclosure === 'complete');
    expect(revealing.length).toBeGreaterThan(0);
    expect(revealing.every((binding) => binding.assessmentUse.preAnswerAllowed === false)).toBe(true);

    for (const target of blueprint.targets.filter((item: any) => item.preAnswerMedia)) {
      for (const ref of target.mediaBindingRefs) {
        expect(byId.get(ref)).toMatchObject({
          purpose: 'neutral_assessment_stimulus',
          answerDisclosure: 'none',
          assessmentUse: { preAnswerAllowed: true }
        });
      }
    }
  });

  it('stores semantic targets rather than copied poem or exercise wording', () => {
    const serialized = [modulePath, claimsPath, mediaPath, assessmentPath]
      .map((path) => readFileSync(resolve(process.cwd(), path), 'utf8'))
      .join('\n');

    expect(serialized).not.toMatch(/\"(?:sourceText|poemText|exerciseText|questionText|prompt)\"\s*:/);
    expect(serialized).not.toMatch(/\.(?:png|jpg|jpeg|svg|mp3|wav|ogg)\b/i);
  });
});
