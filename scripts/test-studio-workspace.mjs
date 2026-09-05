import assert from 'node:assert/strict';
import { createStudioWorkspace, readStudioWorkspace, restoreStudioWorkspace, isStudioResponse, studioQuestionSignature, INITIAL_STUDIO_LEARNING } from '../src/experience/studioWorkspace.mjs';
import { createStudioWorkStore, studioWorkKey } from '../src/runtime/studioWorkStore.mjs';
let checks = 0;
function check(name, run) { run(); checks++; console.log(`PASS ${name}`); }
const q = { id: 'test.fraction', revision: 1, interaction: { type: 'equal_parts', version: 1, partCount: 4, categories: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }] }, solution: { type: 'fraction_allocation', fractions: { a: { numerator: 1, denominator: 2 }, b: { numerator: 1, denominator: 2 } } } };
const sequence = { id: 'test.sequence', revision: 1, interaction: { type: 'sequence_order', version: 1, items: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }] }, solution: { type: 'ordered_items', orderedItemIds: ['a', 'b'] } };
const activity = 'studio.test.fraction';
const response = { assignments: ['b', null, 'a', null] };
const workspace = createStudioWorkspace(activity, q, response);
class MemoryStorage {
  data = new Map(); fail = false;
  get length() { return this.data.size; }
  key(i) { return [...this.data.keys()][i] ?? null; }
  getItem(key) { return this.data.get(key) ?? null; }
  setItem(key, value) { if (this.fail) throw new Error('quota'); this.data.set(key, value); }
}
check('valid unfinished work is restored without grading', () => assert.deepEqual(restoreStudioWorkspace(activity, q, workspace), response));
check('serialization round trip', () => assert.deepEqual(readStudioWorkspace(activity, q, JSON.parse(JSON.stringify(workspace))), workspace));
check('source state is cloned', () => { const copy = createStudioWorkspace(activity, q, response); copy.state.assignments[0] = 'a'; assert.equal(response.assignments[0], 'b'); });
check('restored state is cloned', () => { restoreStudioWorkspace(activity, q, workspace).assignments[0] = 'a'; assert.equal(workspace.state.assignments[0], 'b'); });
for (const [name, state] of [ ['sparse', { assignments: Array(4) }], ['missing part', { assignments: ['a'] }], ['extra part', { assignments: ['a','a','b','b',null] }], ['unknown category', { assignments: ['x',null,null,null] }], ['extra authority', { assignments: ['a',null,null,null], correct: true }], ['non-record', []] ]) {
  check(`reject ${name}`, () => { assert.equal(isStudioResponse(q, state), false); assert.throws(() => createStudioWorkspace(activity, q, state)); });
}
check('incorrect but structurally valid sequence retained', () => assert.ok(isStudioResponse(sequence, { orderedItemIds: ['b','a'] })));
for (const state of [{orderedItemIds:['a','a']}, {orderedItemIds:['a','x']}, {orderedItemIds:Array(2)}, {orderedItemIds:['a','b'],correct:true}]) check('reject invalid sequence permutation', () => assert.equal(isStudioResponse(sequence, state), false));
for (const changed of [{...workspace, schemaVersion:1},{...workspace,questionRevision:2},{...workspace,engineKey:'equal_parts@2'},{...workspace,activityId:'studio.other'},{...workspace,mastery:1},{...workspace,state:{assignments:['a']}}]) check('reject stale or contaminated envelope', () => assert.equal(readStudioWorkspace(activity,q,changed),null));
check('same revision changed solution refused', () => { const other=structuredClone(q); other.solution.fractions.a.numerator=2; assert.equal(readStudioWorkspace(activity,other,workspace),null); });
check('same revision changed labels refused', () => { const other=structuredClone(q); other.interaction.categories[0].label='New meaning'; assert.equal(readStudioWorkspace(activity,other,workspace),null); });
check('property insertion order is irrelevant', () => assert.equal(studioQuestionSignature(q),studioQuestionSignature({solution:q.solution,interaction:q.interaction,revision:1,id:q.id})));
check('empty workspace is not a response', () => assert.equal(restoreStudioWorkspace(activity,q,createStudioWorkspace(activity,q,undefined)),undefined));
check('teaching mode and assistance survive', () => { const learning={...INITIAL_STUDIO_LEARNING,mode:'watch',demonstrationSeen:true,stepIndex:1}; assert.deepEqual(readStudioWorkspace(activity,q,createStudioWorkspace(activity,q,response,learning)).learning,learning); });
for (const bad of [{mode:'exam'},{checkCount:-1},{checkCount:Infinity},{stepIndex:4},{checked:true},{mode:'watch'},{demonstrationSeen:'yes'}]) check('reject malformed teaching metadata',()=>assert.throws(()=>createStudioWorkspace(activity,q,response,{...INITIAL_STUDIO_LEARNING,...bad})));
check('checked metadata requires response',()=>assert.throws(()=>createStudioWorkspace(activity,q,null,{...INITIAL_STUDIO_LEARNING,mode:'practice',checked:true,checkCount:1})));
check('future workspace is refused',()=>assert.equal(readStudioWorkspace(activity,q,{...workspace,schemaVersion:99}),null));
check('invalid source identity refused',()=>assert.throws(()=>studioQuestionSignature({...q,revision:0})));
check('oversized source refused',()=>assert.throws(()=>studioQuestionSignature({...q,interaction:{...q.interaction,note:'x'.repeat(17000)}})));
const storage=new MemoryStorage(); storage.setItem('kidsplay.progress.v1','unchanged-evidence');
const a=createStudioWorkStore('child-a',()=>storage), b=createStudioWorkStore('child-b',()=>storage);
check('opening does not write',()=>{assert.equal(a.load(activity).status,'empty');assert.equal(storage.length,1);});
let saved;
check('save then reload through fresh service',()=>{saved=a.save(activity,workspace,null);assert.equal(saved.status,'saved');assert.deepEqual(createStudioWorkStore('child-a',()=>storage).load(activity).workspace,workspace);});
check('owner isolation',()=>assert.equal(b.load(activity).status,'empty'));
check('identical save is idempotent',()=>assert.equal(a.save(activity,workspace,saved.token).status,'unchanged'));
check('stale writer cannot overwrite',()=>assert.equal(a.save(activity,workspace,null).status,'conflict'));
check('different activities do not overwrite',()=>{const id='studio.other';assert.equal(a.save(id,{...workspace,activityId:id},null).status,'saved');assert.deepEqual(a.load(activity).workspace,workspace);});
check('quota failure preserves previous bytes',()=>{storage.fail=true;assert.equal(a.save(activity,{...workspace,state:null},saved.token).status,'unavailable');storage.fail=false;assert.equal(a.load(activity).token,saved.token);});
let cleared;
check('explicit clear writes tombstone',()=>{cleared=a.clear(activity,saved.token);assert.equal(cleared.status,'saved');assert.equal(a.load(activity).status,'empty');});
check('stale callback cannot resurrect cleared work',()=>assert.equal(a.save(activity,workspace,saved.token).status,'conflict'));
check('new edit after clear can save',()=>assert.equal(a.save(activity,workspace,cleared.token).status,'saved'));
check('cannot save another activity envelope',()=>assert.equal(a.save(activity,{...workspace,activityId:'studio.wrong'},a.load(activity).token).status,'invalid'));
check('progress evidence is untouched',()=>assert.equal(storage.getItem('kidsplay.progress.v1'),'unchanged-evidence'));
for(const raw of ['{broken','null',JSON.stringify({version:99}),JSON.stringify({version:1,ownerId:'child-b',activityId:activity,generation:1,workspace})]) check('corrupt or foreign storage is retained',()=>{const s=new MemoryStorage();s.setItem(studioWorkKey('child-a',activity),raw);const store=createStudioWorkStore('child-a',()=>s);assert.equal(store.load(activity).status,'corrupt');assert.equal(store.save(activity,workspace,raw).status,'corrupt');assert.equal(s.getItem(studioWorkKey('child-a',activity)),raw);});
check('unavailable provider is nonthrowing',()=>assert.equal(createStudioWorkStore('a',()=>{throw Error('denied');}).load(activity).status,'unavailable'));
check('missing browser storage is nonthrowing',()=>assert.equal(createStudioWorkStore('a',()=>null).save(activity,workspace,null).status,'unavailable'));
check('invalid owner is refused',()=>assert.throws(()=>createStudioWorkStore('')));
check('bounded cache does not evict',()=>{const s=new MemoryStorage(),store=createStudioWorkStore('a',()=>s);for(let i=0;i<64;i++){const aid=`studio.${i}`;assert.equal(store.save(aid,{...workspace,activityId:aid},null).status,'saved');}assert.equal(store.save(activity,workspace,null).status,'full');assert.equal(s.length,64);});
console.log(JSON.stringify({checks,status:'passed',scope:'workspace admission and storage; not device or child acceptance'}));
