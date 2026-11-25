(function (root) {
  'use strict';
  const priorities = ['Low', 'Medium', 'High', 'Critical'];
  const statuses = ['Open', 'In progress', 'Closed'];
  const categories = ['General investigation', 'Phishing', 'Account compromise', 'Malware triage', 'Data exposure'];
  const guides = [
    { id: 'phishing', title: 'Phishing review', tag: 'EMAIL SECURITY', summary: 'Preserve the message. Validate the context.', steps: ['Record the reported message, sender, recipient, and UTC time.', 'Preserve an original copy and full headers using authorized tools.', 'Compare the visible sender, reply-to address, links, and authentication results.', 'Record any attachment hashes without opening or executing the attachment.', 'Document whether a link was opened or credentials were entered.', 'Escalate verified exposure through your organization’s response process.'] },
    { id: 'account', title: 'Account compromise', tag: 'IDENTITY', summary: 'Establish the timeline before drawing conclusions.', steps: ['Record the account, detection source, and report time in UTC.', 'Preserve available authentication logs through authorized access.', 'Compare sign-in times, locations, devices, and MFA events with expected activity.', 'Record observations separately from unverified assumptions.', 'Coordinate authorized session revocation and credential resets if exposure is confirmed.', 'Document containment, recovery, and follow-up ownership.'] },
    { id: 'malware', title: 'Malware triage', tag: 'ENDPOINT', summary: 'Document evidence and coordinate containment.', steps: ['Record the host, user, detection time, and alert source.', 'Coordinate isolation with the authorized incident owner.', 'Preserve relevant evidence following your organization’s procedure.', 'Record file metadata and calculate SHA-256; do not execute suspicious files.', 'Document observed processes, persistence, and network indicators using approved tools.', 'Escalate findings, preserve the timeline, and document recovery decisions.'] },
    { id: 'exposure', title: 'Data exposure', tag: 'DATA PROTECTION', summary: 'Distinguish access from confirmed transfer.', steps: ['Record the dataset, systems, suspected period, and source of the report.', 'Preserve relevant access and audit logs using authorized methods.', 'Identify the user, service, or process associated with each observed event.', 'Separate local export activity from evidence of external transfer.', 'Coordinate access restrictions and escalation with the incident owner.', 'Document confirmed scope, unresolved questions, and required follow-up.'] }
  ];
  function text(value, limit) { return typeof value === 'string' ? value.slice(0, limit) : ''; }
  function id() { return root.crypto?.randomUUID ? root.crypto.randomUUID() : 'c-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12); }
  function esc(value) { return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
  function timestamp(value) { return typeof value === 'string' && Number.isFinite(Date.parse(value)); }
  function createCase(title, priority, category, observation) {
    title = text(title, 120).trim();
    if (!title) throw Error('Enter a case title.');
    if (!priorities.includes(priority) || !categories.includes(category)) throw Error('Invalid case details.');
    const now = new Date().toISOString();
    return { id: id(), title, priority, category, status: 'Open', createdAt: now, updatedAt: now,
      notes: observation.trim() ? [{ id: id(), at: now, text: text(observation, 10000).trim() }] : [], checks: {}, evidence: [], timeline: [] };
  }
  const evidenceTypes = ['File','Email','Log','Device','Image','Other'];
  const verifications = ['Unverified','Observed','Confirmed'];
  function utc(value) {
    if (!value) return null;
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw Error('Enter a complete UTC date and time.');
    const parsed = new Date(value+':00Z');
    if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0,16)!==value) throw Error('Enter a valid UTC date and time.');
    return parsed.toISOString();
  }
  function createEvidence(fields) {
    const label=text(fields.label,120).trim(), sha256=text(fields.sha256,64).trim().toLowerCase();
    if(!label) throw Error('Enter an evidence label.');
    if(!evidenceTypes.includes(fields.type)) throw Error('Select an evidence type.');
    if(fields.sha256 && !/^[a-f0-9]{64}$/i.test(fields.sha256.trim())) throw Error('Enter a complete 64-character SHA-256, or leave it empty.');
    return {id:id(),label,type:fields.type,source:text(fields.source,300).trim(),custodian:text(fields.custodian,120).trim(),sha256,acquiredAt:utc(fields.acquiredAt),recordedAt:new Date().toISOString(),notes:text(fields.notes,3000).trim()};
  }
  function createEvent(fields) {
    const title=text(fields.title,160).trim();
    if(!title) throw Error('Enter an event title.');
    if(!verifications.includes(fields.verification)) throw Error('Select a verification state.');
    const at=utc(fields.at);if(!at) throw Error('Enter the event time in UTC.');
    return {id:id(),title,at,recordedAt:new Date().toISOString(),verification:fields.verification,source:text(fields.source,300).trim(),details:text(fields.details,5000).trim()};
  }
  function extractIndicators(input) {
    const source = text(input, 100000).replace(/hxxps/gi, 'https').replace(/hxxp/gi, 'http').replace(/\[\.\]|\(\.\)/g, '.').replace(/\[:\]/g, ':');
    const values = new Map();
    const add = (type, value) => { if (values.size < 500) values.set(type + ':' + value, { type, value }); };
    for (const match of source.matchAll(/\bhttps?:\/\/[^\s<>"'\]\[{}]+/gi)) {
      const raw = match[0].replace(/[),.;!?]+$/, '');
      try { const parsed = new URL(raw); if (parsed.hostname && !parsed.username && !parsed.password) add('URL', parsed.href); } catch (_) { /* Not a URL. */ }
    }
    for (const match of source.matchAll(/\b(?:[a-fA-F0-9]{64}|[a-fA-F0-9]{40}|[a-fA-F0-9]{32})\b/g)) add({32:'MD5',40:'SHA-1',64:'SHA-256'}[match[0].length], match[0].toLowerCase());
    for (const match of source.matchAll(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g)) {
      if (match[0].split('.').every(octet => Number(octet) <= 255 && (octet === '0' || !octet.startsWith('0')))) add('IPv4', match[0]);
    }
    for (const match of source.matchAll(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,63}\b/gi)) add('Email', match[0].toLowerCase());
    for (const match of source.matchAll(/\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}\b/gi)) add('Domain', match[0].toLowerCase());
    return [...values.values()];
  }
  function validateBackup(raw) {
    if (typeof raw !== 'string' || new TextEncoder().encode(raw).length > 2 * 1024 * 1024) throw Error('Backup exceeds 2 MB.');
    let data;
    try { data = JSON.parse(raw); } catch (_) { throw Error('This is not a valid JSON backup.'); }
    if (data?.format !== 'centinellia-backup' || ![1,2].includes(data.version) || !Array.isArray(data.cases) || data.cases.length > 300) throw Error('Unsupported CENTINELLia backup.');
    const ids = new Set();
    return data.cases.map(c => {
      if (!c || typeof c.id !== 'string' || !/^[a-zA-Z0-9-]{1,100}$/.test(c.id) || ids.has(c.id) || typeof c.title !== 'string' || !c.title.trim() || c.title.length > 120 || !priorities.includes(c.priority) || !statuses.includes(c.status) || !categories.includes(c.category) || !timestamp(c.createdAt) || !timestamp(c.updatedAt) || !Array.isArray(c.notes) || c.notes.length > 500) throw Error('The backup contains an invalid case.');
      ids.add(c.id);
      const notes = c.notes.map(n => {
        if (!n || typeof n.id !== 'string' || !timestamp(n.at) || typeof n.text !== 'string' || n.text.length > 10000) throw Error('The backup contains an invalid note.');
        return { id: text(n.id, 100), at: n.at, text: n.text };
      });
      const checks = {};
      for (const guide of guides) checks[guide.id] = guide.steps.map((_, i) => c.checks?.[guide.id]?.[i] === true);
      const evidence = c.evidence === undefined ? [] : c.evidence;
      const timeline = c.timeline === undefined ? [] : c.timeline;
      if(!Array.isArray(evidence)||evidence.length>200||!Array.isArray(timeline)||timeline.length>500) throw Error('The backup contains an invalid evidence register or timeline.');
      const validId=value=>typeof value==='string'&&/^[a-zA-Z0-9-]{1,100}$/.test(value);
      const evidenceIds=new Set(), eventIds=new Set();
      const cleanEvidence=evidence.map(item=>{
        if(!item||!validId(item.id)||evidenceIds.has(item.id)||typeof item.label!=='string'||!item.label.trim()||item.label.length>120||!evidenceTypes.includes(item.type)||typeof item.sha256!=='string'||(item.sha256!==''&&!/^[a-f0-9]{64}$/i.test(item.sha256))||!timestamp(item.recordedAt)||(item.acquiredAt!==null&&!timestamp(item.acquiredAt))||typeof item.notes!=='string'||item.notes.length>3000||typeof item.source!=='string'||item.source.length>300||typeof item.custodian!=='string'||item.custodian.length>120) throw Error('The backup contains invalid evidence metadata.');
        evidenceIds.add(item.id);return {id:item.id,label:item.label,type:item.type,source:item.source,custodian:item.custodian,sha256:item.sha256.toLowerCase(),acquiredAt:item.acquiredAt,recordedAt:item.recordedAt,notes:item.notes};
      });
      const cleanTimeline=timeline.map(item=>{
        if(!item||!validId(item.id)||eventIds.has(item.id)||typeof item.title!=='string'||!item.title.trim()||item.title.length>160||!timestamp(item.at)||!timestamp(item.recordedAt)||!verifications.includes(item.verification)||typeof item.source!=='string'||item.source.length>300||typeof item.details!=='string'||item.details.length>5000) throw Error('The backup contains an invalid timeline event.');
        eventIds.add(item.id);return {id:item.id,title:item.title,at:item.at,recordedAt:item.recordedAt,verification:item.verification,source:item.source,details:item.details};
      });
      return { id: c.id, title: c.title, priority: c.priority, category: c.category, status: c.status, createdAt: c.createdAt, updatedAt: c.updatedAt, notes, checks, evidence:cleanEvidence, timeline:cleanTimeline };
    });
  }
  function backup(cases) { return JSON.stringify({format:'centinellia-backup',version:2,exportedAt:new Date().toISOString(),cases}, null, 2); }
  function report(c) {
    const lines = ['CENTINELLia — Case report', 'Beacon of the Eagle LLC', '', 'Case: ' + c.title, 'ID: ' + c.id, 'Priority: ' + c.priority, 'Status: ' + c.status, 'Category: ' + c.category, 'Opened (UTC): ' + c.createdAt, 'Updated (UTC): ' + c.updatedAt, '', 'OBSERVATIONS'];
    if (!c.notes.length) lines.push('No observations recorded.');
    c.notes.forEach(n => lines.push(n.at + '\n' + n.text + '\n'));
    lines.push('', 'EVIDENCE INVENTORY');
    if(!c.evidence?.length) lines.push('No evidence metadata recorded.');
    (c.evidence||[]).forEach(item=>lines.push('Evidence: '+item.label+' ['+item.type+']','ID: '+item.id,'Source/location: '+(item.source||'Not recorded'),'Custodian: '+(item.custodian||'Not recorded'),'Acquired (UTC): '+(item.acquiredAt||'Not recorded'),'Recorded (UTC): '+item.recordedAt,'SHA-256: '+(item.sha256||'Not recorded'),item.notes,''));
    lines.push('', 'EVENT TIMELINE');
    if(!c.timeline?.length) lines.push('No timeline events recorded.');
    [...(c.timeline||[])].sort((a,b)=>a.at.localeCompare(b.at)).forEach(item=>lines.push(item.at+' — '+item.title,'Verification: '+item.verification,'Source: '+(item.source||'Not recorded'),'Recorded (UTC): '+item.recordedAt,item.details,''));
    lines.push('', 'RESPONSE CHECKLISTS');
    for (const guide of guides) {
      if (c.checks?.[guide.id]?.some(Boolean)) {
        lines.push(guide.title);
        guide.steps.forEach((step, i) => lines.push((c.checks[guide.id][i] ? '[x] ' : '[ ] ') + step));
      }
    }
    lines.push('', 'Analyst observations require verification. This workspace does not establish chain of custody, detect threats, or provide automated AI analysis.', 'Exported (UTC): ' + new Date().toISOString());
    return lines.join('\n');
  }
  function csv(cases) {
    const cell=value=>{let s=String(value??'');if(/^[\s]*[=+@-]/.test(s)||/^[\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
    const rows=[['Case ID','Title','Priority','Status','Category','Observations','Evidence records','Timeline events','Updated UTC'],...cases.map(c=>[c.id,c.title,c.priority,c.status,c.category,c.notes.length,c.evidence?.length||0,c.timeline?.length||0,c.updatedAt])];
    return rows.map(row=>row.map(cell).join(',')).join('\r\n');
  }
  function stats(cases) {return {total:cases.length,active:cases.filter(c=>c.status!=='Closed').length,evidence:cases.reduce((n,c)=>n+(c.evidence?.length||0),0),events:cases.reduce((n,c)=>n+(c.timeline?.length||0),0),notes:cases.reduce((n,c)=>n+c.notes.length,0),priorities:priorities.map(priority=>({label:priority,count:cases.filter(c=>c.priority===priority&&c.status!=='Closed').length})),statuses:statuses.map(status=>({label:status,count:cases.filter(c=>c.status===status).length}))};}
  const registerSchemas = {
    assets: {limit:2000, fields:['id','name','type','criticality','platform','location','owner','status','notes','updated']},
    reviews: {limit:1000, fields:['id','title','scope','approval','expires','asset','reference','evidence','remediation','severity','status','updated']}
  };
  function validRegisterRecord(record, kind) {
    const schema=registerSchemas[kind];
    if(!schema || !record || !schema.fields.every(key=>typeof record[key]==='string'&&record[key].length<=2000) || !/^[a-zA-Z0-9-]{1,80}$/.test(record.id) || !timestamp(record.updated)) return false;
    if(kind==='assets') return !!record.name.trim() && ['Android phone','iPhone / iPad','Workstation','Physical server','Virtual server','Cloud instance','Server cluster','Network appliance','Storage system'].includes(record.type) && ['Low','Medium','High','Critical'].includes(record.criticality) && ['Unverified','Operational','Degraded','Offline'].includes(record.status);
    const expiry=new Date(record.expires+'T00:00:00Z');
    return !!record.title.trim() && !!record.scope.trim() && !!record.approval.trim() && /^\d{4}-\d{2}-\d{2}$/.test(record.expires) && Number.isFinite(expiry.getTime()) && expiry.toISOString().slice(0,10)===record.expires && ['Low','Medium','High','Critical'].includes(record.severity) && ['Unverified','Confirmed','Remediation planned','Retest pending','Resolved'].includes(record.status);
  }
  function registerRecords(records, kind) {
    const schema=registerSchemas[kind], ids=new Set();
    if(!schema || !Array.isArray(records) || records.length>schema.limit) throw Error('Unsupported register or record limit exceeded.');
    return records.map(record=>{
      if(!validRegisterRecord(record,kind) || ids.has(record.id)) throw Error('The backup contains invalid or duplicate register records.');
      ids.add(record.id);
      return Object.fromEntries(schema.fields.map(key=>[key,record[key]]));
    });
  }
  function readRegisterBackup(raw, kind) {
    if(typeof raw!=='string' || new TextEncoder().encode(raw).length>2*1024*1024) throw Error('Backup exceeds 2 MB.');
    let data;try{data=JSON.parse(raw);}catch(_){throw Error('This is not a valid JSON backup.');}
    if(!data || data.format!==1 || !registerSchemas[kind] || !Array.isArray(data[kind])) throw Error('Choose the matching inventory or findings JSON export.');
    return registerRecords(data[kind],kind);
  }
  function mergeRegisterRecords(existing, incoming, kind) {
    const current=registerRecords(existing,kind), additions=registerRecords(incoming,kind), known=new Set(current.map(record=>record.id));
    const fresh=additions.filter(record=>!known.has(record.id)), records=registerRecords([...current,...fresh],kind);
    if(new TextEncoder().encode(JSON.stringify(records)).length>2*1024*1024) throw Error('Combined register exceeds 2 MB. Export or remove older records first.');
    return {records,added:fresh.length,skipped:additions.length-fresh.length};
  }
  const api = { priorities, statuses, categories, guides, evidenceTypes, verifications, utc, id, esc, createCase, createEvidence, createEvent, extractIndicators, validateBackup, backup, report, csv, stats, validRegisterRecord, readRegisterBackup, mergeRegisterRecords };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Centinell = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
