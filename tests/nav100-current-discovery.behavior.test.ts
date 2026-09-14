import { describe, expect, it } from 'vitest';
import { loadCurrentExperienceDiscovery } from '../src/experienceDiscovery';

describe('NAV100 current discovery catalogue', () => {
  it('lazily projects current canonical owners without test-only identities', async () => {
    const discovery = await loadCurrentExperienceDiscovery();
    const ids = discovery.map((item) => item.canonicalId);

    expect(ids).toContain('experience.bicycle-workshop.guided.v1');
    expect(ids).toContain('learn.earth');
    expect(ids).toContain('studio.fractions.equal-shares');
    expect(ids).toContain('phonics.sound-trail.v1');
    expect(ids).toContain('story.dheu.moonlit-leaf');
    expect(ids).toContain('forest.world-depth.l2.creek-rescue');
    expect(ids.some((id) => id.startsWith('synthetic.nav100.test.'))).toBe(false);
    expect(ids).toEqual([...ids].sort((left, right) => left.localeCompare(right)));
  });
});
