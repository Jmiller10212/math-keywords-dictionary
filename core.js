export const SCHEMA_VERSION = 2;
export const SEED_REVISION = "formulas-and-geometry-1";
export const normalize = s => s.normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase();
export const key = e => e.type + ':' + normalize(e.term);
const fields = ['id','type','term','definition','category','example','clue','caveat','notation','symbols','whenToUse','notes'];
export function validate(data) {
 if (!data || typeof data !== 'object' || Array.isArray(data) || ![1,2].includes(data.schemaVersion) || !Array.isArray(data.entries)) throw Error('Expected schemaVersion: 1 or 2 and an entries array.');
 if (data.entries.length > 10000) throw Error('Limit: 10,000 entries.');
 const ids = new Set(), terms = new Set();
 return data.entries.map((raw,i) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw Error(`Entry ${i+1} must be an object.`);
  const e = {};
  for (const f of fields) { const v = raw[f] ?? ''; if (typeof v !== 'string' || v.length > (f === 'id' ? 100 : 4000)) throw Error(`Entry ${i+1}: invalid ${f}.`); e[f] = v.trim(); }
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(e.id) || !['vocabulary','keyword','formula'].includes(e.type) || !e.term || !e.definition || !e.category) throw Error(`Entry ${i+1}: id, valid type, term, definition and category are required.`);
  if (e.type === 'formula' && (!e.notation || !e.symbols || !e.whenToUse || !e.example)) throw Error(`Entry ${i+1}: formulas need notation, symbol meanings, when to use it and a worked example.`);
  if (e.type === 'keyword' && (!e.clue || !e.caveat)) throw Error(`Entry ${i+1}: keywords need an operation clue and caveat.`);
  if (ids.has(e.id) || terms.has(key(e))) throw Error(`Entry ${i+1}: duplicate ID or term within its entry type.`);
  ids.add(e.id); terms.add(key(e)); return e;
 });
}
export const envelope = entries => ({schemaVersion:SCHEMA_VERSION, seedRevision:SEED_REVISION, exportedAt:new Date().toISOString(), entries});
export function planImport(current,incoming,mode) {
 if (!['merge','replace'].includes(mode)) throw Error('Invalid import mode.');
 if (mode === 'replace') return {entries:incoming, added:incoming.filter(e=>!current.some(c=>c.id===e.id)).length, updated:incoming.filter(e=>current.some(c=>c.id===e.id && JSON.stringify(c)!==JSON.stringify(e))).length, removed:current.filter(c=>!incoming.some(e=>e.id===c.id)).length, conflicts:[], unchanged:incoming.filter(e=>current.some(c=>JSON.stringify(c)===JSON.stringify(e))).length};
 const entries = current.map(e=>({...e})); const conflicts=[]; let added=0,updated=0,unchanged=0;
 for (const e of incoming) {
  const byId=entries.findIndex(c=>c.id===e.id), byTerm=entries.findIndex(c=>key(c)===key(e));
  if ((byTerm>=0 && byTerm!==byId) || (byId>=0 && key(entries[byId])!==key(e))) {conflicts.push(e.term);continue;}
  if (byId>=0) {if(JSON.stringify(entries[byId])===JSON.stringify(e)) unchanged++; else {entries[byId]=e;updated++;}} else {entries.push(e);added++;}
 }
 return {entries,added,updated,unchanged,removed:0,conflicts};
}
