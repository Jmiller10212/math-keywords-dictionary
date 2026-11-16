import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validate,envelope,planImport} from '../core.js';
const seed=JSON.parse(readFileSync(new URL('../seed.json',import.meta.url)));
const entries=validate(seed), a=entries[0];
test('starter entries and JSON round trip',()=>{assert.equal(entries.length,49);assert.deepEqual(validate(JSON.parse(JSON.stringify(envelope(entries)))),entries);});
test('reject malformed, future schema, missing fields, and unsafe IDs',()=>{for(const value of [null,[],{schemaVersion:3,entries:[]},{schemaVersion:1,entries:[null]},envelope([{...a,id:'../bad'}]),envelope([{...a,term:''}]),envelope([{...a,definition:4}]),envelope([{...a,term:'a'.repeat(4001)}])])assert.throws(()=>validate(value));});
test('duplicate detection normalizes whitespace and case',()=>{assert.throws(()=>validate(envelope([a,{...a,id:'new',term:'  ESTIMATE  '}])));assert.throws(()=>validate(envelope([a,{...a,term:'new'}])));});
test('keywords need caveats; same term across types allowed',()=>{assert.throws(()=>validate(envelope([{...a,type:'keyword'}])));assert.equal(entries.filter(e=>e.term==='difference').length,2);});
test('merge adds and updates stable IDs without deleting existing entries',()=>{const update={...a,example:'Changed example'};const added={...a,id:'new',term:'New'};const plan=planImport(entries,[update,added],'merge');assert.equal(plan.added,1);assert.equal(plan.updated,1);assert.equal(plan.entries.length,50);assert.equal(plan.removed,0);validate(envelope(plan.entries));});
test('merge blocks ambiguous IDs and duplicate terms',()=>{assert.equal(planImport(entries,[{...a,id:'new'}],'merge').conflicts.length,1);assert.equal(planImport(entries,[{...a,term:'Renamed'}],'merge').conflicts.length,1);});
test('replace supports empty libraries and reports removals',()=>{const p=planImport(entries,[],'replace');assert.equal(p.removed,49);assert.deepEqual(p.entries,[]);});
test('untrusted text stays plain data and extra properties are stripped',()=>{const e=validate(envelope([{...a,example:'<img src=x onerror=alert(1)>',unexpected:'ignored'}]))[0];assert.equal(e.example,'<img src=x onerror=alert(1)>');assert.equal(e.unexpected,undefined);});

test('formula validation, legacy exports and formula import plans',()=>{
 const formula=entries.find(e=>e.type==='formula');
 assert.equal(entries.filter(e=>e.type==='formula').length,11);
 for(const field of ['notation','symbols','whenToUse','example'])assert.throws(()=>validate(envelope([{...formula,[field]:''}])));
 const legacy={schemaVersion:1,entries:seed.entries.filter(e=>e.type!=='formula')};
 assert.equal(validate(legacy).length,38);
 const update={...formula,notes:'Updated note'};
 assert.equal(planImport(entries,[update],'merge').updated,1);
 assert.equal(planImport(entries,[{...formula,id:'another'}],'merge').conflicts.length,1);
 assert.equal(planImport(entries,[formula],'replace').removed,48);
});
