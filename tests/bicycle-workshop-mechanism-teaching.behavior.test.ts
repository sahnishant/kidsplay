import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Bicycle Workshop mechanism teaching', () => {
  it('teaches pedal, crank, chain and rear-wheel motion progressively instead of leaking the full chain', () => {
    const viewport = readFileSync(resolve(process.cwd(), 'src/ui/BicycleWorkshopViewport.svelte'), 'utf8');
    const mechanism = readFileSync(resolve(process.cwd(), 'src/presentation/BicycleMechanismDemonstration.svelte'), 'utf8');

    expect(viewport).toContain('BicycleMechanismDemonstration');
    expect(viewport).toContain("section.id === 'movement'");
    expect(viewport).toContain("beat.sequence?.length && section.id !== 'movement'");

    expect(mechanism).toContain("title: 'PEDAL'");
    expect(mechanism).toContain("title: 'CRANK'");
    expect(mechanism).toContain("title: 'CHAIN'");
    expect(mechanism).toContain("title: 'BACK WHEEL'");
    expect(mechanism).toContain('The pedal is the small platform at the end of the crank arm.');
    expect(mechanism).toContain('The crank turns around its centre.');
    expect(mechanism).toContain('PEDAL</b> = where the foot pushes');
    expect(mechanism).toContain('CRANK</b> = the arm that turns');
    expect(mechanism).toContain('visibleSteps = $derived(steps.slice(0, stepIndex + 1))');
    expect(mechanism).toContain("action: 'Push the pedal'");
  });

  it('also gives the braking idea its own lever-to-brake-to-slow visual and reduced-motion fallback', () => {
    const mechanism = readFileSync(resolve(process.cwd(), 'src/presentation/BicycleMechanismDemonstration.svelte'), 'utf8');

    expect(mechanism).toContain("title: 'BRAKE LEVER'");
    expect(mechanism).toContain("title: 'BRAKE'");
    expect(mechanism).toContain("title: 'BICYCLE SLOWS'");
    expect(mechanism).toContain('@media(prefers-reduced-motion:reduce)');
    expect(mechanism).not.toMatch(/recordAttempt|knowledgeEvidence|saveProgress|localProgress/);
  });
});
