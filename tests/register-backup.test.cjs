const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../app/src/main/assets/core.js');
const asset = {id:'asset-1',name:'Training server',type:'Virtual server',criticality:'High',platform:'Linux',location:'Training lab',owner:'Training team',status:'Unverified',notes:'Synthetic data',updated:'2026-11-24T12:00:00.000Z'};
const finding = {id:'finding-1',title:'Training finding',scope:'Training lab',approval:'TRAINING-001',expires:'2026-12-31',asset:'asset-1',reference:'',evidence:'Synthetic observation',remediation:'Verify original records',severity:'High',status:'Unverified',updated:'2026-11-24T12:00:00.000Z'};
const backup = (kind,records)=>JSON.stringify({format:1,[kind]:records});

test('inventory and findings exports restore data without overwriting existing IDs',()=>{
  for(const [kind,record] of [['assets',asset],['reviews',finding]]) {
    const restored=C.readRegisterBackup(backup(kind,[{...record,unexpected:'drop'}]),kind);
    assert.deepEqual(restored,[record]);
    const current={...record,updated:'2026-11-25T12:00:00.000Z'};
    const next={...record,id:record.id+'-new'};
    const merged=C.mergeRegisterRecords([current],[record,next],kind);
    assert.deepEqual(merged,{records:[current,next],added:1,skipped:1});
    assert.equal(current.updated,'2026-11-25T12:00:00.000Z');
  }
});

test('register imports reject wrong files, invalid dates, duplicate IDs and oversized input',()=>{
  assert.throws(()=>C.readRegisterBackup('{broken','assets'));
  assert.throws(()=>C.readRegisterBackup(backup('reviews',[finding]),'assets'));
  assert.throws(()=>C.readRegisterBackup(backup('assets',[asset,asset]),'assets'));
  assert.throws(()=>C.readRegisterBackup(backup('assets',[{...asset,status:'Invented'}]),'assets'));
  assert.throws(()=>C.readRegisterBackup(backup('assets',[{...asset,updated:'not-a-date'}]),'assets'));
  assert.throws(()=>C.readRegisterBackup(backup('assets',[{...asset,id:'<invalid>'}]),'assets'));
  assert.throws(()=>C.readRegisterBackup(backup('reviews',[{...finding,expires:'2026-02-31'}]),'reviews'));
  assert.throws(()=>C.readRegisterBackup('x'.repeat(2*1024*1024+1),'assets'));
  assert.throws(()=>C.readRegisterBackup(backup('reviews',Array.from({length:1001},(_,i)=>({...finding,id:'finding-'+i}))),'reviews'));
});

test('merging enforces combined capacity and leaves the existing register intact on error',()=>{
  const existing=Array.from({length:2000},(_,i)=>({...asset,id:'asset-'+i}));
  const before=JSON.stringify(existing);
  assert.throws(()=>C.mergeRegisterRecords(existing,[{...asset,id:'extra'}],'assets'));
  assert.equal(JSON.stringify(existing),before);
  const large=Array.from({length:600},(_,i)=>({...asset,id:'large-'+i,notes:'x'.repeat(2000),platform:'x'.repeat(2000)}));
  assert.throws(()=>C.mergeRegisterRecords([],large,'assets'));
});
