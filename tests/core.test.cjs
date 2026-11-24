const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../app/src/main/assets/core.js');
test('case backup preserves analyst text, UTC timestamps and checklist progress', () => {
  const c=C.createCase('Training case','High','Phishing','Observed message; maliciousness unverified.');
  c.checks.phishing=[true,false,false,false,false,false];
  const restored=C.validateBackup(C.backup([c]));
  assert.equal(restored[0].notes[0].text,c.notes[0].text);
  assert.equal(restored[0].createdAt,c.createdAt);
  assert.deepEqual(restored[0].checks.phishing,c.checks.phishing);
  assert.match(C.report(restored[0]),/\[x\] Record the reported message/);
  assert.match(C.report(restored[0]),/require verification/);
});
test('extraction normalizes defanged indicators, deduplicates, and rejects invalid IPv4', () => {
  const result=C.extractIndicators('hxxps://portal[.]example[.]org/path 192.0.2.1 192.0.2.1 999.2.3.4 01.2.3.4 analyst@example.org');
  assert.equal(result.filter(i=>i.type==='IPv4').length,1);
  assert.equal(result.find(i=>i.type==='IPv4').value,'192.0.2.1');
  assert.equal(result.find(i=>i.type==='URL').value,'https://portal.example.org/path');
  assert.ok(result.some(i=>i.type==='Email'&&i.value==='analyst@example.org'));
});
test('extracted hashes are bounded, typed and normalized', () => {
  const result=C.extractIndicators('A'.repeat(64)+' '+'b'.repeat(40)+' '+'C'.repeat(32)+' '+'D'.repeat(65));
  assert.equal(result.filter(i=>['SHA-256','SHA-1','MD5'].includes(i.type)).length,3);
  assert.equal(result.find(i=>i.type==='SHA-256').value,'a'.repeat(64));
  assert.ok(C.extractIndicators(Array.from({length:700},(_,i)=>'host'+i+'.example.com').join(' ')).length<=500);
});
test('malformed and duplicate backups cannot overwrite records', () => {
  const c=C.createCase('Training case','Medium','General investigation','');
  assert.throws(()=>C.validateBackup('not json'));
  assert.throws(()=>C.validateBackup(JSON.stringify({format:'centinellia-backup',version:99,cases:[]})));
  assert.throws(()=>C.validateBackup(C.backup([c,c])));
  assert.throws(()=>C.validateBackup(C.backup([{...c,status:'Unknown'}])));
  assert.throws(()=>C.validateBackup(C.backup([{...c,notes:[{id:'n',at:'bad date',text:'x'}]}])));
  assert.throws(()=>C.validateBackup('x'.repeat(2*1024*1024+1)));
});
test('backup import drops unexpected properties, and markup stays text when displayed', () => {
  const c=C.createCase('<img src=x onerror=alert(1)>','Low','General investigation','<script>bad()</script>');
  const restored=C.validateBackup(C.backup([{...c,unexpected:'drop',__proto__:{polluted:true}}]));
  assert.equal(restored[0].unexpected,undefined);
  assert.equal({}.polluted,undefined);
  assert.equal(C.esc(restored[0].title),'&lt;img src=x onerror=alert(1)&gt;');
});
test('v1 backups migrate without losing observations and v2 preserves evidence and UTC chronology',()=>{
  const c=C.createCase('Training migration','High','Account compromise','Legacy observation');
  const old={...c};delete old.evidence;delete old.timeline;
  const migrated=C.validateBackup(JSON.stringify({format:'centinellia-backup',version:1,cases:[old]}))[0];
  assert.equal(migrated.notes[0].text,'Legacy observation');assert.deepEqual(migrated.evidence,[]);assert.deepEqual(migrated.timeline,[]);
  c.evidence.push(C.createEvidence({label:'Training log',type:'Log',source:'Training source',custodian:'Training analyst',sha256:'a'.repeat(64),acquiredAt:'2026-11-24T14:30',notes:'Fictional metadata'}));
  c.timeline.push(C.createEvent({title:'Later event',at:'2026-11-24T15:00',verification:'Observed',source:'Training source',details:'Later'}));
  c.timeline.push(C.createEvent({title:'Earlier event',at:'2026-11-24T14:00',verification:'Unverified',source:'Training report',details:'Earlier'}));
  const restored=C.validateBackup(C.backup([c]))[0];assert.deepEqual(restored.evidence,c.evidence);assert.deepEqual(restored.timeline,c.timeline);
  const report=C.report(restored);assert.ok(report.includes('Acquired (UTC): 2026-11-24T14:30:00.000Z'));assert.ok(report.indexOf('Earlier event')<report.indexOf('Later event'));assert.ok(report.includes('Verification: Unverified'));
  assert.equal(JSON.parse(C.backup([c])).version,2);
});
test('invalid dates, hashes and duplicate evidence IDs are rejected before import',()=>{
  assert.throws(()=>C.utc('2026-02-31T12:00'));
  assert.throws(()=>C.createEvidence({label:'Evidence',type:'File',sha256:'a'.repeat(65)}));
  assert.throws(()=>C.createEvent({title:'Event',at:'',verification:'Confirmed'}));
  const c=C.createCase('Training case','Medium','General investigation','');
  const item=C.createEvidence({label:'Evidence',type:'File',sha256:''});c.evidence=[item,item];
  assert.throws(()=>C.validateBackup(C.backup([c])));
});
test('CSV escapes spreadsheet formulas and operational metrics reflect actual records',()=>{
  const c=C.createCase('=HYPERLINK("https://example.org")','Critical','General investigation','one observation');
  c.evidence.push(C.createEvidence({label:'Training item',type:'Other',sha256:''}));
  assert.ok(C.csv([c]).includes("'=HYPERLINK"));
  const s=C.stats([c]);assert.equal(s.active,1);assert.equal(s.evidence,1);assert.equal(s.events,0);assert.equal(s.notes,1);assert.equal(s.priorities.find(p=>p.label==='Critical').count,1);
  c.status='Closed';assert.equal(C.stats([c]).active,0);assert.equal(C.stats([c]).priorities.find(p=>p.label==='Critical').count,0);
});
