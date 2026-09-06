import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Bicycle Workshop mechanism teaching imported from #268', () => {
  it('teaches pedal, crank, chain and rear-wheel motion progressively instead of leaking the full chain', () => {
    const viewport = readFileSync(resolve(process.cwd(), 'src/ui/BicycleWorkshopViewport.svelte'), 'utf8');
    const mechanism = readFileSync(resolve(process.cwd(), 'src/presentation/BicycleMechanismDemonstration.svelte'), 'utf8');
    const guide = JSON.parse(readFileSync(resolve(process.cwd(), 'content/experience/bicycle-workshop-guided.json'), 'utf8')) as {
      sections: Array<{ id: string; lookPrompt: string; sourceLayer?: string; writesMastery?: boolean; beats: Array<{ id: string; text: string }> }>;
    };
    const movement = guide.sections.find((section) => section.id === 'movement');
    const drive = movement?.beats.find((item) => item.id === 'movement-chain');

    expect(viewport).toContain("import('../presentation/BicycleMechanismDemonstration.svelte')");
    expect(viewport).toContain("section.id==='movement'");
    expect(viewport).toContain("beat.sequence?.length && section.id!=='movement'");
    expect(viewport).toContain("beat.id==='braking-chain'?'brake':'drive'");

    expect(movement?.sourceLayer).toBe('kidsplay_enrichment');
    expect(movement?.writesMastery).toBe(false);
    expect(movement?.lookPrompt).toContain('pedal where the foot pushes');
    expect(movement?.lookPrompt).toContain('crank arm attached to it');
    expect(drive?.text).toContain('The pedal is attached to the crank arm');

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

  it('keeps braking separate, accessible, reduced-motion safe and non-evaluative', () => {
    const mechanism = readFileSync(resolve(process.cwd(), 'src/presentation/BicycleMechanismDemonstration.svelte'), 'utf8');
    const guide = JSON.parse(readFileSync(resolve(process.cwd(), 'content/experience/bicycle-workshop-guided.json'), 'utf8')) as {
      sections: Array<{ id: string; beats: Array<{ id: string; sequence?: string[] }> }>;
    };
    const movement = guide.sections.find((section) => section.id === 'movement');
    const braking = movement?.beats.find((item) => item.id === 'braking-chain');

    expect(braking?.sequence).toEqual(['Squeeze brake lever', 'Brake engages', 'Bicycle slows']);
    expect(mechanism).toContain("title: 'BRAKE LEVER'");
    expect(mechanism).toContain("title: 'BRAKE'");
    expect(mechanism).toContain("title: 'BICYCLE SLOWS'");
    expect(mechanism).toContain('aria-live="polite"');
    expect(mechanism).toContain('@media(prefers-reduced-motion:reduce)');
    expect(mechanism).toContain('min-height:44px');
    expect(mechanism).not.toMatch(/recordAttempt|knowledgeEvidence|saveProgress|localProgress/);
  });
});
