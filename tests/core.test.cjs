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
  assert.throws(()=>C.validateBackup(JSON.stringify({format:'centinellia-backup',version:2,cases:[]})));
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
