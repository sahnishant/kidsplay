import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

type GuideBeat={id:string;examples?:string[];claimRefs?:string[];capabilityRefs?:string[]};
type GuideSection={id:string;sourceLayer?:string;evidenceRole?:string;writesMastery?:boolean;storyMode?:string;beats:GuideBeat[]};
type Guide={schemaVersion:number;storyBoundary:{primarySpine:string;mechanicsSection:string;mechanicsWritesMastery:boolean;creativeSection:string};sections:GuideSection[]};
const root=process.cwd();
const guide=JSON.parse(readFileSync(resolve(root,'content/experience/bicycle-workshop-guided.json'),'utf8')) as Guide;
const viewport=readFileSync(resolve(root,'src/ui/BicycleWorkshopViewport.svelte'),'utf8');
const stage=readFileSync(resolve(root,'src/ui/BicycleStoryStage.svelte'),'utf8');
const mechanism=readFileSync(resolve(root,'src/presentation/BicycleMechanismDemonstration.svelte'),'utf8');
const shellCss=readFileSync(resolve(root,'src/ui/bicycleWorkshop.css'),'utf8');
const stageCss=readFileSync(resolve(root,'src/ui/bicycleStoryStage.css'),'utf8');
const bundleBudget=readFileSync(resolve(root,'scripts/validate-bundle-budget.mjs'),'utf8');
function section(id:string){const value=guide.sections.find((item)=>item.id===id);if(!value)throw new Error(`Missing Bicycle story section ${id}`);return value}
function beat(parent:GuideSection,id:string){const value=parent.beats.find((item)=>item.id===id);if(!value)throw new Error(`Missing Bicycle story beat ${parent.id}/${id}`);return value}

describe('Bicycle Workshop story and animation v2',()=>{
  it('uses the chapter-shaped story spine with explicit enrichment and creative boundaries',()=>{
    expect(guide.schemaVersion).toBe(2);
    expect(guide.sections.map((item)=>item.id)).toEqual(['meet','parts','movement','sounds','magic','reading','safety']);
    expect(guide.storyBoundary).toEqual({primarySpine:'chapter_topic_and_skill_inventory',mechanicsSection:'kidsplay_explanation_only',mechanicsWritesMastery:false,creativeSection:'non_evaluative_expression'});
    expect(section('movement')).toMatchObject({storyMode:'mechanics',sourceLayer:'kidsplay_enrichment',evidenceRole:'explanation_only',writesMastery:false});
    expect(section('magic')).toMatchObject({storyMode:'magic',sourceLayer:'creative_extension',evidenceRole:'non_evaluative_expression',writesMastery:false});
  });

  it('keeps the primary bicycle vocabulary to the seven visible part words',()=>{
    const vocabulary=beat(section('parts'),'parts-seven').examples;
    expect(vocabulary).toEqual(['seat','pedal','wheel','bell','handle','carrier','brake']);
    expect(vocabulary).not.toContain('crank');expect(vocabulary).not.toContain('chain');
  });

  it('uses crank and chain only inside the optional look-inside explanation',()=>{
    expect(beat(section('movement'),'movement-chain').claimRefs).toEqual([
      'claim.push-pedals.contributes-to.crank-turns','claim.crank-turns.contributes-to.chain-moves','claim.chain-moves.contributes-to.rear-wheel-turns','claim.rear-wheel-turns.contributes-to.bicycle-movement'
    ]);
    expect(guide.sections.filter((item)=>item.id!=='movement').flatMap((item)=>item.beats).flatMap((item)=>item.examples??[]).some((item)=>/crank|chain/i.test(item))).toBe(false);
  });

  it('makes the bicycle dominant and keeps the seven word controls off the teaching object',()=>{
    expect(viewport).toContain("import('./BicycleStoryStage.svelte')");
    expect(viewport).toContain('StoryStage=module.default');
    expect(viewport).toContain('<StoryStage');
    expect(shellCss).toContain('min-height:clamp(330px,45dvh,455px)');
    expect(stage).toContain("import './bicycleStoryStage.css'");
    expect(stage).toContain('class="bike-canvas"');
    expect(stage).toContain('class="part-choices"');
    expect(stage).not.toContain('class="hotspots"');
    expect(stage).toContain('Seven bicycle part labels');
    expect(stage).toContain('aria-pressed={selectedPart===part.id}');
    expect(stage).toContain('find the yellow ring');
    expect(stageCss).toContain('aspect-ratio:760/420');
    expect(stageCss).toContain('min-height:44px');
    for(const label of ['Seat','Pedal','Wheel','Bell','Handle','Carrier','Brake']) expect(stage).toContain(`label:'${label}'`);
  });

  it('uses the imported #268 progressive mechanism instead of retaining duplicate answer-revealing motion code',()=>{
    expect(viewport).toContain("import('../presentation/BicycleMechanismDemonstration.svelte')");
    expect(viewport).toContain("beat.id==='braking-chain'?'brake':'drive'");
    expect(viewport).toContain("beat.sequence?.length && section.id!=='movement'");
    for(const token of ["title: 'PEDAL'","title: 'CRANK'","title: 'CHAIN'","title: 'BACK WHEEL'","title: 'BRAKE LEVER'","title: 'BICYCLE SLOWS'"]) expect(mechanism).toContain(token);
    expect(mechanism).toContain('visibleSteps = $derived(steps.slice(0, stepIndex + 1))');
    expect(mechanism).toContain('PEDAL</b> = where the foot pushes');
    expect(mechanism).toContain('CRANK</b> = the arm that turns');
    expect(mechanism).toContain('prefers-reduced-motion:reduce');
    expect(stage).not.toContain('Play slowly');
    expect(stage).not.toContain('class="motion"');
    expect(stageCss).not.toContain('@keyframes chain-travel');
  });

  it('makes every child instruction correspond to a real non-scored interaction',()=>{
    expect(stage).toContain("mode==='meet'||mode==='sounds'");
    expect(stage).toContain('🔔 Tap the bell');
    expect(stage).toContain("const safetyItems=['Helmet','Brakes','Tyres'] as const");
    expect(stage).toContain('aria-label="Pre-ride checks"');
    expect(stage).toContain("safetyMask===7?'✓ Ready to ride!'");
    expect(`${viewport}\n${stage}\n${mechanism}`).not.toMatch(/recordAttempt|knowledgeEvidence|saveProgress|localProgress/);
  });

  it('keeps imagination non-evaluative while making the magic bicycle genuinely playable',()=>{
    const magic=section('magic');
    expect(magic.beats.every((item)=>item.capabilityRefs?.includes('capability.english.creative.imagine-draw-speak'))).toBe(true);
    expect(magic.beats.every((item)=>(item.claimRefs??[]).length===0)).toBe(true);
    for(const place of ['Cloud garden','Moonlit hill','My own place']) expect(stage).toContain(place);
    expect(stage).toContain('Choose a magic bicycle destination');
    expect(stage).toContain('No score here. Pick a place or invent a different one.');
  });

  it('keeps both Bicycle interaction surfaces behind strict lazy-route budgets',()=>{
    expect(bundleBudget).toContain("prefix: 'BicycleStoryStage-'");
    expect(bundleBudget).toContain("prefix: 'BicycleMechanismDemonstration-'");
    expect(bundleBudget).toContain("maxJsGzipBytes: 4 * 1024, maxCssBytes: 5 * 1024");
    expect(bundleBudget).toContain("maxJsGzipBytes: 4.5 * 1024, maxCssBytes: 6.5 * 1024");
  });
});
