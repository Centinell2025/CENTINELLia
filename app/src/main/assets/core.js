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
      notes: observation.trim() ? [{ id: id(), at: now, text: text(observation, 10000).trim() }] : [], checks: {} };
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
    if (data?.format !== 'centinellia-backup' || data.version !== 1 || !Array.isArray(data.cases) || data.cases.length > 300) throw Error('Unsupported CENTINELLia backup.');
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
      return { id: c.id, title: c.title, priority: c.priority, category: c.category, status: c.status, createdAt: c.createdAt, updatedAt: c.updatedAt, notes, checks };
    });
  }
  function backup(cases) { return JSON.stringify({format:'centinellia-backup',version:1,exportedAt:new Date().toISOString(),cases}, null, 2); }
  function report(c) {
    const lines = ['CENTINELLia — Case report', 'Beacon of the Eagle LLC', '', 'Case: ' + c.title, 'ID: ' + c.id, 'Priority: ' + c.priority, 'Status: ' + c.status, 'Category: ' + c.category, 'Opened (UTC): ' + c.createdAt, 'Updated (UTC): ' + c.updatedAt, '', 'OBSERVATIONS'];
    if (!c.notes.length) lines.push('No observations recorded.');
    c.notes.forEach(n => lines.push(n.at + '\n' + n.text + '\n'));
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
  const api = { priorities, statuses, categories, guides, id, esc, createCase, extractIndicators, validateBackup, backup, report };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Centinell = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
