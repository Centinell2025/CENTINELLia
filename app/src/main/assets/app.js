/* Packaged, offline UI. No remote scripts, analytics, or network calls. */
(() => {
  'use strict';
  const C = window.Centinell, $ = id => document.getElementById(id), e = C.esc;
  const KEY = 'centinellia.workspace.v1';
  let cases = [], loadError = false, currentIndicators = [], indicatorText = '', hashText = '', currentHash = null, toastTimer;
  let aiVerified = false;
  let aiReady = false, aiChecked = false, aiBusy = false, aiQuestion = '', aiReply = '', aiReplyQuestion = '', aiCaseId = '', aiInclude = false;
  let textLabInput = '', textLabOutput = '';
  try { const raw = localStorage.getItem(KEY); if (raw) cases = C.validateBackup(raw); }
  catch (_) { loadError = true; }
  const date = iso => new Date(iso).toLocaleString(undefined, {dateStyle:'medium', timeStyle:'short'});
  const shortId = id => id.slice(0, 8).toUpperCase();
  function toast(message, error = false) {
    $('toast').textContent = message; $('toast').className = error ? 'error' : ''; $('toast').hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { $('toast').hidden = true; }, 5500);
  }
  function persist(next) {
    if (loadError) { toast('Existing records could not be loaded. Export stored data from Settings before resetting.', true); return false; }
    try {
      const data = C.backup(next);
      if (next.length > 300 || new TextEncoder().encode(data).length > 2 * 1024 * 1024) throw Error('The workspace is full. Export a backup before removing older cases.');
      C.validateBackup(data);
      localStorage.setItem(KEY, data); cases = next; return true;
    } catch (err) { toast(err.message || 'Could not save. Check available device storage.', true); return false; }
  }
  function update(id, fn) {
    const next = JSON.parse(JSON.stringify(cases));
    const record = next.find(c => c.id === id);
    if (!record) return false;
    fn(record); record.updatedAt = new Date().toISOString(); return persist(next);
  }
  function download(filename, type, content) {
    if (window.CentinellDevice) { window.CentinellDevice.exportText(filename, type, content); return; }
    const url = URL.createObjectURL(new Blob([content], {type}));
    const a = document.createElement('a'); a.href = url; a.download = filename;
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast('Export downloaded. Keep it in a safe location.');
  }
  function confirmAction(title, description, action) {
    $('confirm-title').textContent = title; $('confirm-text').textContent = description;
    $('confirm-cancel').onclick = () => $('confirm-dialog').close();
    $('confirm-accept').onclick = () => { $('confirm-dialog').close(); action(); };
    $('confirm-dialog').showModal();
  }
  function heading(eyebrow, title, description, button = '') {
    return `<div class="page-heading"><div><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p class="muted">${description}</p></div>${button}</div>`;
  }
  const newButton = '<button class="primary" data-action="new-case">New case <span>+</span></button>';
  function caseRow(c) {
    return `<a class="case-row" href="#case/${e(c.id)}"><div class="row-title"><h3>${e(c.title)}</h3><span class="badge ${c.priority.toLowerCase()}">${c.priority}</span></div><div class="meta">${shortId(c.id)} &nbsp;·&nbsp; ${e(c.category)}<br>${c.status} &nbsp;·&nbsp; Updated ${date(c.updatedAt)}</div></a>`;
  }
  function emptyCases() {
    return '<div class="empty"><span class="empty-symbol">▣</span><h3>Your next investigation starts here.</h3><p class="muted">Open a case to keep observations, response checklists, and findings together.</p><button data-action="new-case">Open your first case</button></div>';
  }
  function overview() {
    const s=C.stats(cases), active=cases.filter(c=>c.status!=='Closed');
    return heading('SECURITY INTELLIGENCE COMMAND','Intelligence command center','Local operational metrics · Human-supervised analysis · Beacon of the Eagle LLC',newButton)+
      `<section class="hero"><div><span class="hero-label">CENTINELL SUITE DEFENSE · FIELD INTELLIGENCE</span><h2>Investigate. Verify. Respond.</h2><p>Access your forensic workspace, developer diagnostics and AI consultation. All displayed case metrics come from local records.</p><div class="button-row"><a class="case-tabs" href="#assistant">✦ Open AI intelligence</a><a class="small-link" href="#tools/diagnostics">Developer diagnostics</a></div></div><div class="hero-visual"><div class="shield"><div>✦</div></div></div></section>`+
      `<section class="stats metrics-four" aria-label="Workspace totals"><div class="stat"><span class="label">Active cases</span><strong>${s.active}</strong><span class="footnote">Open and in progress</span></div><div class="stat"><span class="label">Evidence records</span><strong>${s.evidence}</strong><span class="footnote">Metadata and fingerprints</span></div><div class="stat"><span class="label">Timeline events</span><strong>${s.events}</strong><span class="footnote">Documented in UTC</span></div><div class="stat"><span class="label">High priority</span><strong class="gold">${active.filter(c=>['High','Critical'].includes(c.priority)).length}</strong><span class="footnote">High and critical cases</span></div></section>
      <section class="panel"><div class="section-top"><h2>Operational modules</h2><span class="badge">Local workspace</span></div><div class="guide-grid">${utilityCatalog.map(v=>`<a class="guide-card" href="#tools/${v[0]}"><h3>${e(v[1])}</h3><p class="muted">${e(v[2])}</p></a>`).join('')}<a class="guide-card" href="#defense"><h3>White Hat Defense Center</h3><p class="muted">Authorized assessments, findings and remediation.</p></a><a class="guide-card" href="#infrastructure"><h3>00 · Endpoint &amp; server infrastructure</h3><p class="muted">Register authorized phones, servers, clusters and cloud assets.</p></a><a class="guide-card" href="#cases"><h3>01 · Digital forensics</h3><p class="muted">Cases, evidence metadata and chronology.</p></a><a class="guide-card" href="#tools/ioc"><h3>02 · Indicator intelligence</h3><p class="muted">Extract patterns from authorized records.</p></a><a class="guide-card" href="#tools/diagnostics"><h3>03 · Developer diagnostics</h3><p class="muted">JSON validation and log severity summary.</p></a><a class="guide-card" href="#assistant"><h3>04 · AI consultation</h3><p class="muted">Human-reviewed technical guidance.</p></a><a class="guide-card" href="#reports"><h3>05 · Risk &amp; reporting</h3><p class="muted">Case priorities and exportable reports.</p></a><a class="guide-card" href="#playbooks"><h3>06 · Response procedures</h3><p class="muted">Document response checklist progress.</p></a></div></section><div class="grid-two"><section class="panel"><div class="section-top"><h2>Recent investigations</h2><a class="small-link" href="#cases">View all cases</a></div>${cases.length?[...cases].sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)).slice(0,4).map(caseRow).join(''):emptyCases()}</section><section class="panel"><div class="section-top"><h2>Investigation tools</h2></div><a class="quick-action" href="#tools/ioc"><span class="symbol">⌘</span><span><strong>Extract indicators</strong><small>Review URLs, IPs, domains, and hashes</small></span></a><a class="quick-action" href="#tools/hash"><span class="symbol">#</span><span><strong>Calculate a SHA-256</strong><small>Compare text or file fingerprints</small></span></a><a class="quick-action" href="#assistant"><span class="symbol">✦</span><span><strong>Consult the AI assistant</strong><small>Check connection and choose case context</small></span></a><a class="quick-action" href="#reports"><span class="symbol">▤</span><span><strong>Prepare a case report</strong><small>Observations, evidence, and chronology</small></span></a></section></div><div class="grid-two"><section class="panel"><div class="section-top"><h2>Priority snapshot</h2><a class="small-link" href="#reports">Full analytics</a></div>${priorityChart(s.priorities)}</section><section class="panel"><h2>Keep the record complete</h2><p class="muted">Add evidence metadata and timeline events inside each case. Keep observations distinct from conclusions and track what still needs verification.</p><div class="button-row"><a class="small-link" href="#playbooks">Response guides</a><a class="small-link" href="#settings">Workspace backup</a></div>${!cases.length?'<br><button data-action="training-case">Load a labeled training example</button>':''}</section></div><div class="notice">Core tools run locally. AI consultation sends only the question and any case context you explicitly choose to include, after the AI service is connected.</div>`;
  }
  function caseList() {
    return heading('CASE REGISTER','Keep the full picture.','Your observations, organized by investigation.',newButton)+
      '<div class="filters"><label>Search cases<input id="case-search" type="search" placeholder="Search title, ID, or category"></label><label>Status<select id="status-filter"><option value="all">All statuses</option>'+C.statuses.map(s => `<option>${s}</option>`).join('')+'</select></label></div><section class="panel" id="case-list">'+(cases.length ? cases.map(caseRow).join('') : emptyCases())+'</section>';
  }
  function detail(id, tab = 'notes') {
    const c = cases.find(c => c.id === id); if (!c) return heading('CASE REGISTER','Case not found.','Return to the case register to select an existing record.')+'<a class="small-link" href="#cases">Back to case register</a>';
    const tabs=`<nav class="case-tabs" aria-label="Case sections">${[['notes','Observations'],['evidence','Evidence ('+(c.evidence?.length||0)+')'],['timeline','Timeline ('+(c.timeline?.length||0)+')']].map(([key,label])=>`<a href="#case/${e(c.id)}/${key}"${key===tab?' aria-current="page"':''}>${label}</a>`).join('')}</nav>`;
    const top=heading('CASE '+shortId(c.id),e(c.title),e(c.category)+' · Opened '+date(c.createdAt),`<button data-action="export-case" data-id="${e(c.id)}">Export report</button>`)+tabs;
    if(tab==='evidence')return top+evidenceView(c);
    if(tab==='timeline')return top+timelineView(c);
    return top+
      `<div class="grid-two"><div><section class="panel"><div class="section-top"><h2>Case observations</h2><span class="badge ${c.priority.toLowerCase()}">${c.priority}</span></div><form id="note-form" data-id="${e(c.id)}"><label>Add an observation<textarea id="note-text" rows="4" maxlength="10000" required placeholder="What did you observe? Include the source, event time, and what remains unverified."></textarea></label><button class="primary" type="submit">Save observation</button></form>${c.notes.length ? [...c.notes].reverse().map(n => `<article class="note"><div class="meta">Recorded ${date(n.at)} · UTC ${e(n.at)}</div><p>${e(n.text)}</p></article>`).join('') : '<p class="muted">No observations recorded yet.</p>'}</section></div><div><section class="panel"><h2>Case details</h2><label>Status<select id="case-status" data-id="${e(c.id)}">${C.statuses.map(s => `<option${s===c.status?' selected':''}>${s}</option>`).join('')}</select></label><label>Priority<select id="detail-priority" data-id="${e(c.id)}">${C.priorities.map(s => `<option${s===c.priority?' selected':''}>${s}</option>`).join('')}</select></label><p class="meta">Last updated<br>${e(c.updatedAt)} (UTC)</p></section><section class="panel"><h2>Response checklists</h2><p class="muted">Checklists are saved with this case.</p>${C.guides.map(g => `<a class="quick-action" href="#guide/${g.id}/${e(c.id)}"><span><strong>${g.title}</strong><small>${c.checks?.[g.id]?.filter(Boolean).length || 0} / ${g.steps.length} steps recorded</small></span><span class="arrow"></span></a>`).join('')}</section><button class="danger ghost" data-action="delete-case" data-id="${e(c.id)}">Delete case</button></div></div>`;
  }
  function evidenceView(c) {
    return `<div class="grid-two"><section class="panel"><h2>Evidence inventory</h2><p class="muted">Record metadata and fingerprints. Original files stay outside this workspace.</p>${(c.evidence||[]).length?c.evidence.map(item=>`<article class="evidence-card"><div class="row-title"><h3>${e(item.label)}</h3><span class="badge">${e(item.type)}</span></div><p class="meta">Source: ${e(item.source||'Not recorded')}<br>Custodian: ${e(item.custodian||'Not recorded')}<br>Acquired (UTC): ${e(item.acquiredAt||'Not recorded')}<br>Recorded (UTC): ${e(item.recordedAt)}</p>${item.sha256?'<code>SHA-256: '+e(item.sha256)+'</code>':''}<p class="muted">${e(item.notes)}</p><button class="danger ghost" data-action="remove-evidence" data-id="${e(c.id)}" data-item="${e(item.id)}">Remove record</button></article>`).join(''):'<div class="empty"><h3>No evidence metadata yet.</h3><p class="muted">Add a source, custodian, acquisition time, and SHA-256 when available.</p></div>'}<div class="notice">This is a working inventory. It does not provide tamper-evident chain-of-custody records.</div></section><section class="panel"><h2>Add evidence metadata</h2><form id="evidence-form" data-id="${e(c.id)}"><label>Evidence label<input id="evidence-label" required maxlength="120" placeholder="e.g. Authentication log export"></label><label>Type<select id="evidence-type">${C.evidenceTypes.map(s=>'<option>'+s+'</option>').join('')}</select></label><label>Source or reference location<input id="evidence-source" maxlength="300" placeholder="System, approved repository, or reference ID"></label><label>Custodian<input id="evidence-custodian" maxlength="120" placeholder="Person or team responsible"></label><label>Acquisition time (UTC, if known)<input id="evidence-time" type="datetime-local"></label><label>SHA-256 (optional)<input id="evidence-hash" maxlength="64" spellcheck="false" placeholder="64 hexadecimal characters"></label><label>Notes<textarea id="evidence-notes" maxlength="3000" rows="3"></textarea></label><button class="primary" type="submit">Save evidence record</button></form></section></div>`;
  }
  function timelineView(c) {
    return `<div class="grid-two"><section class="panel"><h2>Event chronology</h2><p class="muted">Ordered by event time in UTC. Recorded time is kept separately.</p>${(c.timeline||[]).length?[...c.timeline].sort((a,b)=>a.at.localeCompare(b.at)).map(item=>`<article class="timeline-entry"><div class="meta">${e(item.at)}</div><h3>${e(item.title)}</h3><span class="badge">${e(item.verification)}</span><p>${e(item.details)}</p><div class="meta">Source: ${e(item.source||'Not recorded')}<br>Recorded: ${e(item.recordedAt)}</div><button class="danger ghost" data-action="remove-event" data-id="${e(c.id)}" data-item="${e(item.id)}">Remove event</button></article>`).join(''):'<div class="empty"><h3>Build the event sequence.</h3><p class="muted">Separate what was reported from what you observed or confirmed.</p></div>'}</section><section class="panel"><h2>Add a timeline event</h2><form id="event-form" data-id="${e(c.id)}"><label>Event title<input id="event-title" required maxlength="160" placeholder="e.g. First unusual sign-in reported"></label><label>Event time (UTC)<input id="event-time" type="datetime-local" value="${new Date().toISOString().slice(0,16)}" required></label><label>Verification<select id="event-verification">${C.verifications.map(s=>'<option>'+s+'</option>').join('')}</select></label><label>Source<input id="event-source" maxlength="300" placeholder="Log, report, ticket, or analyst"></label><label>Details<textarea id="event-details" maxlength="5000" rows="5"></textarea></label><button class="primary" type="submit">Save timeline event</button></form></section></div>`;
  }
  function priorityChart(data) {
    const max=Math.max(1,...data.map(item=>item.count));
    return `<svg class="priority-chart" viewBox="0 0 520 240" role="img" aria-labelledby="priority-chart-title"><title id="priority-chart-title">Active cases by priority: ${data.map(i=>i.label+' '+i.count).join(', ')}</title>${data.map((item,i)=>`<text x="0" y="${36+i*54}">${item.label}</text><rect class="chart-track" x="100" y="${18+i*54}" width="350" height="22" rx="7"/><rect class="chart-bar chart-${item.label.toLowerCase()}" x="100" y="${18+i*54}" width="${350*item.count/max}" height="22" rx="7"/><text x="470" y="${36+i*54}">${item.count}</text>`).join('')}</svg>`;
  }
  function reports() {
    const s=C.stats(cases);
    return heading('REPORTS & ANALYTICS','From records to a clear briefing.','Counts are calculated from the cases saved in this workspace.',cases.length?'<button data-action="export-register">Export case register CSV</button>':'')+`<section class="stats metrics-four"><div class="stat"><span class="label">Total cases</span><strong>${s.total}</strong></div><div class="stat"><span class="label">Active cases</span><strong>${s.active}</strong></div><div class="stat"><span class="label">Evidence records</span><strong>${s.evidence}</strong></div><div class="stat"><span class="label">Timeline events</span><strong>${s.events}</strong></div></section><div class="grid-two"><section class="panel"><h2>Active cases by priority</h2>${priorityChart(s.priorities)}</section><section class="panel"><h2>Case status</h2>${s.statuses.map(item=>`<div class="status-summary"><span>${item.label}</span><strong>${item.count}</strong></div>`).join('')}<p class="muted">${s.notes} recorded observations across all cases.</p></section></div><section class="panel"><h2>Case report builder</h2><p class="muted">Include observations, evidence metadata, event chronology, and response-checklist progress.</p>${cases.length?`<label>Select a case<select id="report-case">${cases.map(c=>`<option value="${e(c.id)}">${e(c.title)}</option>`).join('')}</select></label><div class="button-row"><button class="primary" data-action="report-preview">Preview report</button><button data-action="report-txt">Export TXT</button><button data-action="report-json">Export case JSON</button><button data-action="print-report">Print / save PDF</button></div><div id="report-output"></div>`:'<p class="muted">Create a case to build its report.</p><button data-action="new-case">Create a case</button>'}</section>`;
  }
  function assistant() {
    const native=!!window.CentinellDevice, portable=location.protocol==='file:'||location.hostname.endsWith('.github.io');
    const status=native||portable?'Available in the secure web workspace':aiBusy?'Consultation in progress':!aiChecked?'Connection not checked':aiReady?(aiVerified?'Connected':'Configured · ready to test'):'Connection required';
    return heading('AI ANALYST ASSISTANT','A second perspective. Your decision.','Ask questions, review a case summary, and identify points that need verification.')+`<section class="panel"><div class="section-top"><h2>Consultation workspace</h2><span class="badge">${status}</span></div>${native||portable?`<p class="muted">AI consultation uses the secure web workspace. Records from this device are not copied automatically. Choose what to share after opening it.</p><button class="primary" data-action="open-web-assistant">Open secure AI workspace</button>`:`<p class="muted">The AI service must be connected before questions can be sent. Your question, and any case context you explicitly include, will be sent to the configured AI provider. Original files are not attached.</p><button data-action="ai-check"${aiBusy?' disabled':''}>Check connection</button><form id="ai-form"><label>Case reference (optional)<select id="ai-case"><option value="">No case selected</option>${cases.map(c=>`<option value="${e(c.id)}"${c.id===aiCaseId?' selected':''}>${e(c.title)}</option>`).join('')}</select></label><label class="check-row ai-consent"><input type="checkbox" id="ai-include"${aiInclude?' checked':''}><span>Include the selected case report with this question.</span></label><label>Your question<textarea id="ai-question" maxlength="4000" rows="5" required placeholder="e.g. Which gaps should I verify before concluding that data left the system?">${e(aiQuestion)}</textarea></label><button class="primary" type="submit"${!aiReady||aiBusy?' disabled':''}>${aiBusy?'Consulting…':'Send question'}</button></form>${!aiReady?'<div class="notice"><strong>Setup is pending.</strong> The workspace owner needs to activate the AI service. No simulated answer is shown.</div>':''}`}</section>${aiReply?`<section class="panel"><h2>AI response · requires analyst review</h2><div class="ai-response">${e(aiReply)}</div><p class="muted">Verify the response against original records. AI output is not an established finding.</p>${aiCaseId?'<button data-action="save-ai-reply">Save unverified response to selected case</button>':''}</section>`:''}<section class="panel"><h2>Useful questions to investigate</h2><div class="prompt-grid">${['Summarize the confirmed facts and unresolved questions.','Which evidence is missing from this timeline?','Distinguish local export activity from confirmed external transfer.','Draft a concise incident briefing using only the recorded facts.'].map((prompt,i)=>`<button class="ghost prompt-card" data-action="ai-prompt" data-prompt="${i}">${prompt}</button>`).join('')}</div></section>`;
  }
  function moreWorkspace(){return heading('WORKSPACE','Everything in one place.','Open reports, response guides, or workspace settings.')+'<div class="guide-grid"><a class="guide-card" href="#defense"><h2>White Hat Defense</h2><p class="muted">Manage authorized findings and retests.</p></a><a class="guide-card" href="#infrastructure"><h2>Infrastructure</h2><p class="muted">Mobile devices, servers and cloud inventory.</p></a><a class="guide-card" href="#reports"><h2>Reports & analytics</h2><p class="muted">Review counts and build complete case reports.</p></a><a class="guide-card" href="#playbooks"><h2>Response guides</h2><p class="muted">Practical checklists saved with each case.</p></a><a class="guide-card" href="#settings"><h2>Workspace settings</h2><p class="muted">Back up, import, and manage local data.</p></a></div>';}
  function playbooks() {
    return heading('RESPONSE GUIDES','A deliberate next step.','Practical checklists to support a documented response.')+'<div class="guide-grid">'+C.guides.map(g => `<article class="guide-card"><span class="tag">${g.tag}</span><h2>${g.title}</h2><p class="muted">${g.summary}</p><button data-action="open-guide" data-id="${g.id}">Open guide </button></article>`).join('')+'</div><div class="notice">These are general reference guides. Use your organization’s approved response procedures and authorized evidence collection tools.</div>';
  }
  function guideView(guideId, caseId) {
    const g = C.guides.find(g => g.id === guideId); if (!g) return playbooks();
    const c = cases.find(c => c.id === caseId);
    return heading(g.tag,g.title,g.summary)+`<section class="panel"><label>Save checklist progress to a case<select id="guide-case" data-guide="${g.id}"><option value="">Read without saving progress</option>${cases.map(record => `<option value="${e(record.id)}"${record.id===caseId?' selected':''}>${e(record.title)}</option>`).join('')}</select></label>${c ? `<p class="muted">${c.checks?.[g.id]?.filter(Boolean).length || 0} of ${g.steps.length} steps recorded for ${e(c.title)}.</p>` : '<p class="muted">Select a case to record completed steps.</p>'}${g.steps.map((s,i) => c ? `<label class="check-row"><input type="checkbox" data-guide="${g.id}" data-case="${e(c.id)}" data-step="${i}"${c.checks?.[g.id]?.[i]?' checked':''}><span>${e(s)}</span></label>` : `<div class="step"><b>${String(i+1).padStart(2,'0')}</b><p>${e(s)}</p></div>`).join('')}</section>${c ? `<a class="small-link" href="#case/${e(c.id)}"> Back to case</a>` : '<a class="small-link" href="#playbooks"> All response guides</a>'}`;
  }
  function hashResult() {
    return currentHash ? `<div class="hash-result"><small>${e(currentHash.name)}${currentHash.size !== undefined ? ' · '+Number(currentHash.size).toLocaleString()+' bytes' : ''}</small><span class="eyebrow">SHA-256</span><code>${e(currentHash.sha256)}</code></div><label>Compare with an expected SHA-256<input id="expected-hash" maxlength="64" placeholder="Paste a 64-character hexadecimal hash" autocomplete="off" spellcheck="false"></label><p id="hash-comparison" class="muted" role="status"></p><div class="button-row"><button data-action="export-hash">Export hash record </button></div>` : '';
  }
  function caseAttach() {
    return cases.length ? `<label>Attach findings to a case<select id="attach-case">${cases.map(c => `<option value="${e(c.id)}">${e(c.title)}</option>`).join('')}</select></label><button data-action="attach-findings">Save findings as an observation</button>` : '<p class="muted">Open a case to attach findings to its record.</p>';
  }

  const utilityCatalog=[
    ['network','IPv4 & subnet calculator','Calculate network boundaries and address counts without scanning.'],
    ['headers','HTTP security headers','Review pasted response headers for baseline controls.'],
    ['cve','CVE reference validator','Validate and deduplicate advisory identifiers; does not query a vulnerability feed.'],
    ['timeline','UTC timestamp normalizer','Convert timestamps with explicit time zones to UTC.'],
    ['compare','Text evidence comparison','Compare two sets of evidence lines locally.'],
    ['capacity','Telemetry capacity planner','Estimate storage requirements for enterprise event ingestion.']
  ];
  let utilityResult='';
  function utilityView(mode){
    const item=utilityCatalog.find(v=>v[0]===mode);
    const fields={
      network:'<label>IPv4 CIDR<input id="utility-a" placeholder="192.0.2.15/24" maxlength="32"></label>',
      headers:'<label>Paste HTTP response headers<textarea id="utility-a" rows="9" maxlength="100000"></textarea></label>',
      cve:'<label>Paste CVE references<textarea id="utility-a" rows="8" maxlength="100000"></textarea></label>',
      timeline:'<label>One ISO timestamp per line, with Z or UTC offset<textarea id="utility-a" rows="8" maxlength="100000" placeholder="2026-11-24T12:00:00-05:00"></textarea></label>',
      compare:'<label>Baseline lines<textarea id="utility-a" rows="6" maxlength="50000"></textarea></label><label>Observed lines<textarea id="utility-b" rows="6" maxlength="50000"></textarea></label>',
      capacity:'<div class="form-grid"><label>Events per second<input id="utility-a" type="number" min="1" max="1000000000" value="10000"></label><label>Average bytes per event<input id="utility-b" type="number" min="1" max="10000000" value="1000"></label><label>Retention days<input id="utility-days" type="number" min="1" max="3650" value="90"></label></div>'
    };
    return heading('ENTERPRISE DEFENSIVE TOOLKIT',item[1],item[2])+toolTabs(mode)+'<section class="panel">'+fields[mode]+'<div class="button-row"><button class="primary" data-action="utility-run" data-id="'+mode+'">Analyze</button><button data-action="utility-export">Export TXT</button></div><pre class="report-preview" id="utility-result" role="status">Results appear here.</pre></section>';
  }
  function runUtility(mode){
    const a=$('utility-a').value.trim(), b=$('utility-b')?.value||'';
    if(!a)throw Error('Enter input first.');
    if(mode==='network'){
      const m=a.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\/(\d{1,2})$/);
      if(!m||m.slice(1,5).some(v=>Number(v)>255)||Number(m[5])>32)throw Error('Enter valid IPv4 CIDR.');
      const p=Number(m[5]), ip=m.slice(1,5).reduce((n,v)=>n*256+Number(v),0), size=2**(32-p), start=Math.floor(ip/size)*size;
      const fmt=n=>[24,16,8,0].map(s=>(n>>>s)&255).join('.');
      return 'Network: '+fmt(start)+'/'+p+'\nLast address: '+fmt(start+size-1)+'\nTotal addresses: '+size+'\nConventional usable hosts: '+(p<=30?size-2:size)+'\nNo network traffic was generated.';
    }
    if(mode==='headers'){
      const map=new Map();for(const l of a.split(/\r?\n/)){const i=l.indexOf(':');if(i>0)map.set(l.slice(0,i).trim().toLowerCase(),l.slice(i+1).trim());}
      const keys=['strict-transport-security','content-security-policy','x-content-type-options','x-frame-options','referrer-policy','permissions-policy'];
      return keys.map(k=>k+': '+(map.has(k)?'PRESENT — '+map.get(k):'NOT FOUND')).join('\n')+'\nPresence alone does not establish correct configuration. Evaluate application context; CSP frame-ancestors can replace X-Frame-Options.';
    }
    if(mode==='cve'){
      const found=[...new Set(a.toUpperCase().match(/\bCVE-\d{4}-\d{4,}\b/g)||[])];
      return 'Syntactically matching identifiers: '+found.length+'\n'+found.join('\n')+'\nExistence, severity and affected versions require authoritative advisory verification.';
    }
    if(mode==='timeline'){
      return a.split(/\r?\n/).filter(Boolean).map(v=>{v=v.trim();const t=Date.parse(v);return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}.*(?:Z|[+-]\d{2}:\d{2})$/i.test(v)&&Number.isFinite(t)?v+' -> '+new Date(t).toISOString():v+' -> INVALID / missing explicit zone';}).join('\n');
    }
    if(mode==='compare'){
      const A=new Set(a.split(/\r?\n/)),B=new Set(b.split(/\r?\n/).filter(Boolean)),added=[...B].filter(v=>!A.has(v)),removed=[...A].filter(v=>!B.has(v));
      return 'Added unique lines: '+added.length+'\n'+added.join('\n')+'\nRemoved unique lines: '+removed.length+'\n'+removed.join('\n')+'\nOrder and duplicate counts are not compared.';
    }
    if(mode==='capacity'){
      const vals=[Number(a),Number(b),Number($('utility-days').value)];
      if(vals.some((v,i)=>!Number.isInteger(v)||v<1||v>[1e9,1e7,3650][i]))throw Error('Enter valid positive integers within field limits.');
      const daily=vals[0]*vals[1]*86400,total=daily*vals[2];
      return 'Events per day: '+(vals[0]*86400).toLocaleString('en-US')+'\nRaw GB/day: '+(daily/1e9).toFixed(2)+'\nRaw TB for retention: '+(total/1e12).toFixed(2)+'\nIllustrative 3-copy raw TB: '+(3*total/1e12).toFixed(2)+'\nExcludes indexes, compression, overhead and backups. Estimate, not a benchmark.';
    }
    throw Error('Unknown utility.');
  }

  function tools(mode) {
    if(utilityCatalog.some(v=>v[0]===mode)){utilityResult='';return utilityView(mode);}
    const isHash = mode === 'hash';
    if(mode==='diagnostics')return heading('DEVELOPER DIAGNOSTICS','Inspect authorized data locally.','JSON syntax and keyword-based log severity counts. No input is executed or transmitted.')+toolTabs('diagnostics')+`<section class="panel"><label>JSON or log excerpt<textarea id="diagnostic-input" rows="9" maxlength="100000" spellcheck="false"></textarea></label><div class="button-row"><button data-action="diagnostic-json">Validate JSON</button><button data-action="diagnostic-log">Summarize logs</button></div><pre id="diagnostic-output" class="report-preview" role="status">Results appear here.</pre></section>`;
    if(mode==='text') return heading('LOCAL TEXT LAB','Inspect text without executing it.','Decode or normalize text locally, then review any extracted indicators.')+toolTabs('text')+`<section class="panel"><label>Input text<textarea id="text-lab-input" maxlength="50000" rows="7" spellcheck="false">${e(textLabInput)}</textarea></label><div class="button-row"><button data-action="text-transform" data-mode="base64-decode">Decode Base64</button><button data-action="text-transform" data-mode="base64-encode">Encode Base64</button><button data-action="text-transform" data-mode="url-decode">Decode URL encoding</button><button data-action="text-transform" data-mode="normalize">Normalize line endings</button></div><label>Result<textarea id="text-lab-output" rows="7" readonly spellcheck="false">${e(textLabOutput)}</textarea></label><div class="button-row"><button data-action="text-to-ioc">Review result as indicators</button><button data-action="export-text-result">Export result TXT</button></div><p class="muted">Text is displayed literally. No decoded commands, scripts, links, or files are executed.</p></section>`;
    return heading('LOCAL ANALYSIS TOOLS','Work with the evidence.','Selected content is processed on your device.')+
      toolTabs(isHash?'hash':'ioc')+
      (isHash ? `<section class="panel"><h2>Calculate a fingerprint</h2><p class="muted">A hash helps compare exact bytes. It does not establish whether a file is safe.</p><label>Text to hash<textarea id="hash-text" rows="4" maxlength="100000" placeholder="Enter text. Spaces and line breaks affect the hash.">${e(hashText)}</textarea></label><div class="button-row"><button class="primary" data-action="hash-text">Hash text</button><button data-action="hash-file" id="hash-file-button">Choose a file</button></div><p class="muted">Files are read locally and are never executed by this app.</p><div id="hash-result">${hashResult()}</div></section>${currentHash ? '<section class="panel">'+caseAttach()+'</section>' : ''}` :
      `<section class="panel"><h2>Find indicators in text</h2><p class="muted">Extract IPv4 addresses, domains, URLs, email addresses, and common hash formats. Defanged forms such as hxxps and [.] are normalized.</p><label>Observations or log excerpt<textarea id="ioc-text" rows="7" maxlength="100000" spellcheck="false" placeholder="Paste a log excerpt, message, or analyst observation.">${e(indicatorText)}</textarea></label><div class="button-row"><button class="primary" data-action="extract">Extract indicators</button><button data-action="sample-ioc">Try a training example</button></div></section><section class="panel"><div class="section-top"><h2>Extracted indicators</h2><span class="badge">${currentIndicators.length} found</span></div><p class="muted">Extraction identifies patterns. These results are unverified and do not indicate malicious activity. Supports IPv4; IPv6 is not extracted in this version.</p>${currentIndicators.length ? currentIndicators.map(i => `<div class="indicator"><span>${e(i.type)}</span><code>${e(i.value)}</code></div>`).join('')+'<div class="button-row"><button data-action="export-ioc">Export JSON </button></div><br>'+caseAttach() : '<p class="muted">Paste text above and run extraction to review the results.</p>'}</section>`);
  }
  function toolTabs(active){return `<div class="tool-tabs"><button data-action="tool-ioc" aria-pressed="${active==='ioc'}">Indicator extraction</button><button data-action="tool-hash" aria-pressed="${active==='hash'}">SHA-256 hashing</button><button data-action="tool-text" aria-pressed="${active==='text'}">Text lab</button><button data-action="tool-diagnostics" aria-pressed="${active==='diagnostics'}">Developer diagnostics</button>${utilityCatalog.map(v=>`<a class="small-link" href="#tools/${v[0]}" aria-current="${active===v[0]?'page':'false'}">${e(v[1])}</a>`).join('')}</div>`;}
  function settings() {
    return heading('WORKSPACE SETTINGS','Your data stays close.','Manage your records and understand how this version works.')+
      `<section class="panel"><h2>Backups &amp; portability</h2><p class="muted">Cases are saved in this app’s local storage. Uninstalling the app or clearing app data removes them. Exported files are readable text and may contain sensitive information.</p><div class="button-row"><button class="primary" data-action="backup">Export workspace JSON </button><button data-action="import">Import backup</button></div><p class="muted">Import adds new case IDs. Existing case IDs are kept as they are. Maximum backup size: 2 MB.</p></section>
      <section class="panel"><h2>Privacy at a glance</h2><ul class="privacy-list"><li>Core tools need no account and include no advertising or analytics. The hosted AI workspace requires its separate secure connection.</li><li>Case records, evidence metadata, and timelines stay in local storage. They are not separately encrypted by this app. AI context is sent only when explicitly selected for a consultation.</li><li>File hashing reads only the file you select and keeps the fingerprint in memory until you attach or export it. The source file is not copied into the workspace.</li><li>Exporting creates a file at a location you choose, which may be managed by a cloud storage provider.</li><li>Back up records before uninstalling, clearing storage, or changing devices.</li></ul></section>
      <section class="panel"><h2>About CENTINELL AI 1</h2><p class="muted">Version 1.2.0 · Enterprise pilot<br>Beacon of the Eagle LLC · Centinell Suite Defense project</p><p class="muted">This release includes evidence metadata, event timelines, reports, and an optional AI consultation workspace. AI responses require a configured provider and human review. The app does not scan devices, detect malware, or establish a tamper-evident chain of custody.</p><p class="muted">Support: centinellsuite@gmail.com</p></section><section class="panel"><h2>Remove local records</h2><p class="muted">Deleting this workspace removes all saved cases from this app. Previously exported files are managed separately.</p><button class="danger" data-action="clear">Delete all local cases</button></section>`;
  }

  const ASSET_KEY='centinellia.infrastructure.v1', assetTypes=['Android phone','iPhone / iPad','Workstation','Physical server','Virtual server','Cloud instance','Server cluster','Network appliance','Storage system'];
  let assets=[], assetReadError=false, assetFilter='', assetEdit='';
  function validAsset(a){return a&&typeof a.id==='string'&&a.id.length<=80&&assetTypes.includes(a.type)&&['Unverified','Operational','Degraded','Offline'].includes(a.status)&&['Low','Medium','High','Critical'].includes(a.criticality)&&['name','platform','location','owner','notes','updated'].every(k=>typeof a[k]==='string'&&a[k].length<2001)&&a.name.trim();}
  try{const raw=localStorage.getItem(ASSET_KEY);if(raw){const data=JSON.parse(raw);if(!Array.isArray(data)||data.length>2000||!data.every(validAsset)||new Set(data.map(a=>a.id)).size!==data.length)throw Error();assets=data;}}catch(_){assetReadError=true;}
  function storeAssets(next){if(assetReadError){toast('Infrastructure records could not be loaded. Export the raw backup before repair.',true);return false;}try{const raw=JSON.stringify(next);if(next.length>2000||new TextEncoder().encode(raw).length>2*1024*1024)throw Error('Inventory capacity reached (2,000 records or 2 MB).');localStorage.setItem(ASSET_KEY,raw);assets=next;return true;}catch(err){toast(err.message,true);return false;}}
  function infrastructure(){
    const a=assets.find(x=>x.id===assetEdit), q=assetFilter.toLowerCase(), filtered=assets.filter(x=>[x.name,x.type,x.platform,x.location,x.owner,x.status].some(v=>v.toLowerCase().includes(q)));
    const opts=(values,selected)=>values.map(v=>'<option'+(v===selected?' selected':'')+'>'+e(v)+'</option>').join('');
    return heading('INFRASTRUCTURE OPERATIONS','Endpoint & server inventory','Authorized assets from mobile devices to enterprise infrastructure. Status is manually recorded, not live telemetry.')+
    '<section class="stats metrics-four"><div class="stat"><span class="label">Registered assets</span><strong>'+assets.length+'</strong></div><div class="stat"><span class="label">Mobile devices</span><strong>'+assets.filter(x=>['Android phone','iPhone / iPad'].includes(x.type)).length+'</strong></div><div class="stat"><span class="label">Servers & clusters</span><strong>'+assets.filter(x=>['Physical server','Virtual server','Cloud instance','Server cluster'].includes(x.type)).length+'</strong></div><div class="stat"><span class="label">Critical assets</span><strong>'+assets.filter(x=>x.criticality==='Critical').length+'</strong></div></section>'+
    (assetReadError?'<div class="notice">Inventory could not be loaded. Editing is disabled to preserve stored data.</div>':'')+
    '<div class="grid-two"><section class="panel"><h2>'+(a?'Edit asset':'Register asset')+'</h2><form id="asset-form"><label>Asset name<input id="asset-name" maxlength="120" required value="'+e(a?.name||'')+'"></label><div class="form-grid"><label>Device class<select id="asset-type">'+opts(assetTypes,a?.type||'Android phone')+'</select></label><label>Criticality<select id="asset-critical">'+opts(['Low','Medium','High','Critical'],a?.criticality||'Medium')+'</select></label><label>OS / platform<input id="asset-platform" maxlength="120" placeholder="Android, iOS, Linux, Windows Server…" value="'+e(a?.platform||'')+'"></label><label>Site / zone<input id="asset-location" maxlength="120" value="'+e(a?.location||'')+'"></label><label>Responsible team<input id="asset-owner" maxlength="120" value="'+e(a?.owner||'')+'"></label><label>Recorded status<select id="asset-status">'+opts(['Unverified','Operational','Degraded','Offline'],a?.status||'Unverified')+'</select></label></div><label>Technical notes<textarea id="asset-notes" rows="3" maxlength="1500">'+e(a?.notes||'')+'</textarea></label><div class="button-row"><button class="primary" type="submit"'+(assetReadError?' disabled':'')+'>Save asset</button><button type="button" data-action="asset-cancel">Clear form</button></div></form></section><section class="panel"><h2>Device readiness</h2><p class="muted">Use these checks as operational guidance; the app cannot verify remote systems automatically.</p><div class="evidence-card"><h3>Mobile endpoints</h3><p>OS updates, screen lock, encryption, app permissions and approved MDM enrollment.</p></div><div class="evidence-card"><h3>Enterprise servers</h3><p>Patch baseline, access controls, backups, CPU/memory/storage telemetry, log forwarding and recovery tests.</p></div><div class="button-row"><a class="small-link" href="#tools/diagnostics">Analyze logs / JSON</a><a class="small-link" href="#assistant">Consult AI</a></div></section></div>'+
    '<section class="panel"><div class="section-top"><h2>Asset register</h2><span class="badge">'+filtered.length+' / '+assets.length+'</span></div><form id="asset-filter-form"><label>Filter inventory<input id="asset-filter" maxlength="120" value="'+e(assetFilter)+'" placeholder="Device, OS, team, status…"></label><div class="button-row"><button type="submit">Filter</button><button type="button" data-action="asset-reset-filter">Show all</button><button type="button" data-action="asset-export">Export inventory JSON</button></div></form><div>'+ (filtered.length?filtered.map(x=>'<article class="evidence-card"><div class="row-title"><h3>'+e(x.name)+'</h3><span class="badge">'+e(x.status)+'</span></div><p class="meta">'+e(x.type)+' · '+e(x.platform||'Platform not recorded')+' · '+e(x.criticality)+' priority<br>'+e(x.location||'No site')+' · '+e(x.owner||'No team')+'<br>Recorded: '+e(x.updated)+'</p><p class="muted">'+e(x.notes)+'</p><div class="button-row"><button data-action="asset-edit" data-id="'+e(x.id)+'">Edit</button><button class="danger" data-action="asset-delete" data-id="'+e(x.id)+'">Remove</button></div></article>').join(''):'<p class="muted">No matching assets. Register your first authorized device.</p>')+'</div></section>';
  }


  const REVIEW_KEY='centinellia.defensive.reviews.v1';
  let reviews=[],reviewBroken=false,reviewEdit='';
  const reviewLevels=['Low','Medium','High','Critical'], reviewStates=['Unverified','Confirmed','Remediation planned','Retest pending','Resolved'];
  function validReview(x){return x&&['id','title','scope','approval','expires','asset','reference','evidence','remediation','updated'].every(k=>typeof x[k]==='string'&&x[k].length<=2000)&&x.title.trim()&&x.scope.trim()&&x.approval.trim()&&/^\d{4}-\d{2}-\d{2}$/.test(x.expires)&&Number.isFinite(Date.parse(x.expires+'T23:59:59Z'))&&reviewLevels.includes(x.severity)&&reviewStates.includes(x.status);}
  try{const raw=localStorage.getItem(REVIEW_KEY);if(raw){const x=JSON.parse(raw);if(!Array.isArray(x)||x.length>1000||!x.every(validReview)||new Set(x.map(v=>v.id)).size!==x.length)throw Error();reviews=x;}}catch(_){reviewBroken=true;}
  function saveReviews(next){if(reviewBroken){toast('Stored reviews could not be loaded. Export before repairing.',true);return false;}try{const raw=JSON.stringify(next);if(next.length>1000||new TextEncoder().encode(raw).length>2*1024*1024)throw Error('Local review limit reached. Export records.');localStorage.setItem(REVIEW_KEY,raw);reviews=next;return true;}catch(err){toast(err.message,true);return false;}}
  function defensiveReview(){
    const a=reviews.find(x=>x.id===reviewEdit), options=(xs,v)=>xs.map(x=>'<option'+(x===v?' selected':'')+'>'+e(x)+'</option>').join(''), expired=x=>Date.parse(x.expires+'T23:59:59Z')<Date.now();
    const field=(id,label,max=120)=>'<label>'+label+'<input id="review-'+id+'" maxlength="'+max+'" value="'+e(a?.[id]||'')+'"'+(['title','scope','approval'].includes(id)?' required':'')+'></label>';
    const area=(id,label)=>'<label>'+label+'<textarea id="review-'+id+'" rows="3" maxlength="1500">'+e(a?.[id]||'')+'</textarea></label>';
    return heading('AUTHORIZED SECURITY ASSESSMENTS','White Hat Defense Center','Document approved scope, defensive findings, remediation and retest status. No scanning or exploitation is performed.')+
    '<section class="stats metrics-four"><div class="stat"><span class="label">Findings</span><strong>'+reviews.length+'</strong></div><div class="stat"><span class="label">Open high / critical</span><strong>'+reviews.filter(x=>x.status!=='Resolved'&&['High','Critical'].includes(x.severity)).length+'</strong></div><div class="stat"><span class="label">Retest pending</span><strong>'+reviews.filter(x=>x.status==='Retest pending').length+'</strong></div><div class="stat"><span class="label">Expired scopes</span><strong>'+reviews.filter(expired).length+'</strong></div></section>'+
    '<div class="grid-two"><section class="panel"><h2>'+(a?'Edit finding':'Register defensive finding')+'</h2><form id="review-form">'+field('title','Finding title')+field('scope','Authorized scope',500)+field('approval','Written authorization reference',200)+'<label>Authorization expires (UTC date)<input type="date" id="review-expires" required value="'+e(a?.expires||'')+'"></label>'+field('asset','Asset reference')+field('reference','CVE / advisory reference (optional)')+'<div class="form-grid"><label>Severity<select id="review-severity">'+options(reviewLevels,a?.severity||'Medium')+'</select></label><label>Verification status<select id="review-status">'+options(reviewStates,a?.status||'Unverified')+'</select></label></div>'+area('evidence','Evidence reference / observed facts')+area('remediation','Remediation and retest notes')+'<div class="button-row"><button class="primary" type="submit"'+(reviewBroken?' disabled':'')+'>Save finding</button><button type="button" data-action="review-clear">Clear form</button></div></form></section><section class="panel"><h2>Defensive workflow</h2><p>1. Confirm written authorization and permitted assets.</p><p>2. Record observations from approved tools and verify evidence.</p><p>3. Prioritize fixes with the asset owner.</p><p>4. Retest under valid authorization and document results.</p><p class="muted">A recorded authorization reference is not proof of permission. Severity is analyst-assigned. Expired scopes must not be used for active testing.</p><div class="button-row"><a class="small-link" href="#infrastructure">Asset inventory</a><a class="small-link" href="#tools/diagnostics">Log diagnostics</a><a class="small-link" href="#assistant">AI consultation</a></div></section></div>'+
    '<section class="panel"><div class="section-top"><h2>Findings register</h2><button data-action="review-export">Export JSON</button></div>'+(reviews.length?reviews.map(x=>'<article class="evidence-card"><div class="row-title"><h3>'+e(x.title)+'</h3><span class="badge '+x.severity.toLowerCase()+'">'+e(x.severity)+'</span></div><p class="meta">'+e(x.status)+' · '+e(x.asset||'No asset')+' · '+e(x.reference||'No advisory')+'<br>Scope: '+e(x.scope)+' · Approval: '+e(x.approval)+' · '+(expired(x)?'EXPIRED':'Recorded expiry')+': '+e(x.expires)+' UTC</p><p>'+e(x.evidence)+'</p><p class="muted">'+e(x.remediation)+'</p><div class="button-row"><button data-action="review-edit" data-id="'+e(x.id)+'">Edit</button><button class="danger" data-action="review-delete" data-id="'+e(x.id)+'">Remove</button></div></article>').join(''):'<p class="muted">No findings recorded.</p>')+'</section>';
  }

  function render() {
    const parts = (location.hash.slice(1) || 'overview').split('/');
    const view = parts[0];
    const navView = view === 'case' ? 'cases' : view === 'guide' ? 'playbooks' : view;
    document.querySelectorAll('nav a[data-view]').forEach(a => { if(a.dataset.view===navView || (a.closest('.mobile-nav') && a.dataset.view==='workspace' && ['reports','playbooks','settings','infrastructure','defense'].includes(navView))) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current'); });
    $('breadcrumb').textContent = {overview:'Overview',cases:'Case register',case:'Case detail',tools:'Analysis tools',playbooks:'Response guides',guide:'Response guide',settings:'Settings',reports:'Reports & analytics',assistant:'AI assistant',workspace:'Workspace',infrastructure:'Infrastructure',defense:'White Hat Defense'}[view] || 'Overview';
    const content = view==='defense'?defensiveReview():view==='infrastructure'?infrastructure():view==='cases'?caseList():view==='case'?detail(parts[1],parts[2]):view==='tools'?tools(parts[1]):view==='playbooks'?playbooks():view==='guide'?guideView(parts[1],parts[2]):view==='settings'?settings():view==='reports'?reports():view==='assistant'?assistant():view==='workspace'?moreWorkspace():overview();
    $('main').innerHTML = (loadError ? '<div class="notice"><strong>Records could not be loaded.</strong> New saves are paused to protect the stored data. Open Settings to export the raw stored data or reset this workspace.</div>' : '') + content;
    document.title = 'CENTINELL AI 1 · '+$('breadcrumb').textContent;
  }
  function filterCases() {
    const query = $('case-search').value.toLowerCase(), status = $('status-filter').value;
    const filtered = cases.filter(c => (status==='all'||c.status===status) && [c.title,c.id,c.category].some(s => s.toLowerCase().includes(query)));
    $('case-list').innerHTML = filtered.length ? filtered.map(caseRow).join('') : '<p class="muted">No cases match these filters.</p>';
  }
  function importBackup(raw) {
    try {
      const incoming = C.validateBackup(raw), known = new Set(cases.map(c => c.id));
      const additions = incoming.filter(c => !known.has(c.id));
      if (persist([...cases,...additions])) { render(); toast(`${additions.length} cases imported. ${incoming.length-additions.length} existing IDs skipped.`); }
    } catch(err) { toast(err.message, true); }
  }
  window.CentinellNativeResult = (type, data) => {
    if (type==='error') { toast(data.message, true); const btn=$('hash-file-button'); if(btn) btn.disabled=false; }
    if (type==='cancelled') { const btn=$('hash-file-button'); if(btn) btn.disabled=false; }
    if (type==='saved') toast('Export saved to your selected location.');
    if (type==='hash') { currentHash=data; location.hash='#tools/hash'; render(); toast('SHA-256 calculated on this device.'); }
    if (type==='import') importBackup(data.text);
  };
  async function checkAI() {
    if(window.CentinellDevice||location.protocol==='file:'||location.hostname.endsWith('.github.io'))return;
    try{const response=await fetch('/api/ai/status',{credentials:'same-origin',cache:'no-store'});if(!response.ok)throw Error();const data=await response.json();aiReady=data.configured===true;aiChecked=true;if(location.hash.startsWith('#assistant'))render();toast(aiReady?'AI service is configured. Send a question to test it.':'AI setup is still required.');}
    catch(_){aiReady=false;aiChecked=true;if(location.hash.startsWith('#assistant'))render();toast('The AI connection is unavailable. Core tools remain local.',true);}
  }
  function showReport(){const c=cases.find(c=>c.id===$('report-case')?.value);if(!c)return null;$('report-output').innerHTML='<h3 class="report-heading">'+e(c.title)+'</h3><pre class="report-preview">'+e(C.report(c))+'</pre>';return c;}
  document.addEventListener('click', async event => {
    const button=event.target.closest('[data-action]'); if(!button) return;
    const action=button.dataset.action, id=button.dataset.id;
    if(action==='review-clear'){reviewEdit='';render();}
    else if(action==='review-edit'){reviewEdit=id;render();$('review-title')?.focus();}
    else if(action==='review-delete'){confirmAction('Remove finding?','This removes the local record only.',()=>{if(saveReviews(reviews.filter(x=>x.id!==id))){reviewEdit='';render();}});}
    else if(action==='review-export'){download('CENTINELL-AI-1-findings.json','application/json',reviewBroken?(localStorage.getItem(REVIEW_KEY)||''):JSON.stringify({format:1,reviews},null,2));}
    else if(action==='asset-cancel'){assetEdit='';render();}
    else if(action==='asset-reset-filter'){assetFilter='';render();}
    else if(action==='asset-edit'){assetEdit=id;render();$('asset-name')?.focus();}
    else if(action==='asset-delete'){confirmAction('Remove asset?','This removes only the inventory record, not the device.',()=>{if(storeAssets(assets.filter(a=>a.id!==id))){assetEdit='';render();}});}
    else if(action==='asset-export'){download('CENTINELL-AI-1-infrastructure.json','application/json',assetReadError?(localStorage.getItem(ASSET_KEY)||''):JSON.stringify({format:1,assets},null,2));}
    else if(action==='new-case') { $('case-form').reset(); $('case-dialog').showModal(); $('case-title').focus(); }
    else if(action==='close-dialog') $('case-dialog').close();
    else if(action==='export-case') { const c=cases.find(c=>c.id===id); if(c) download('CENTINELL-AI-1-case-'+shortId(c.id)+'.txt','text/plain',C.report(c)); }
    else if(action==='delete-case') confirmAction('Delete this case?','Its observations and checklist progress will be removed from this device. Export a report or backup first if you need to retain it.',()=>{if(persist(cases.filter(c=>c.id!==id))) {location.hash='#cases';render();toast('Case deleted.');}});
    else if(action==='open-guide') location.hash='#guide/'+id;
    else if(action==='tool-ioc') location.hash='#tools/ioc';
    else if(action==='tool-hash') location.hash='#tools/hash';
    else if(action==='tool-text') location.hash='#tools/text';
    else if(action==='utility-run'){try{utilityResult=runUtility(id);$('utility-result').textContent=utilityResult;}catch(err){utilityResult='';$('utility-result').textContent=err.message;}}
    else if(action==='utility-export'){if(utilityResult)download('CENTINELL-AI-1-analysis.txt','text/plain',utilityResult);else toast('Run an analysis first.',true);}
    else if(action==='tool-diagnostics') location.hash='#tools/diagnostics';
    else if(action==='diagnostic-json'||action==='diagnostic-log'){
      const input=$('diagnostic-input').value, output=$('diagnostic-output');
      if(!input.trim()){output.textContent='Enter data first.';return;}
      if(action==='diagnostic-json'){try{const value=JSON.parse(input);output.textContent='Valid JSON.\n'+JSON.stringify(value,null,2).slice(0,100000);}catch(err){output.textContent='Invalid JSON: '+err.message;}}
      else{const lines=input.split(/\r?\n/).filter(l=>l.trim());const levels={Critical:0,Error:0,Warning:0,Info:0,Other:0};for(const line of lines){const level=/\b(critical|fatal|emergency)\b/i.test(line)?'Critical':/\b(error|err)\b/i.test(line)?'Error':/\b(warn|warning)\b/i.test(line)?'Warning':/\b(info|notice)\b/i.test(line)?'Info':'Other';levels[level]++;}output.textContent='Nonempty lines: '+lines.length+'\n'+Object.entries(levels).map(([k,v])=>k+': '+v).join('\n')+'\nKeyword classification only; not proof of an incident.';}
    }
    else if(action==='training-case') {
      const c=C.createCase('Training — suspicious sign-in review','High','Account compromise','SYNTHETIC TRAINING DATA. A documentation IP (192.0.2.44) appears in a fictional authentication log. No compromise is established.');
      c.evidence.push(C.createEvidence({label:'Training fixture: abc',type:'File',source:'Synthetic demonstration fixture; UTF-8 content abc',custodian:'Training analyst',sha256:'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',notes:'Demonstration fingerprint only. Not original incident evidence.'}));
      c.timeline.push(C.createEvent({title:'Synthetic sign-in event reported',at:new Date(Date.now()-600000).toISOString().slice(0,16),verification:'Unverified',source:'Fictional training log',details:'Use the original records to verify any real incident.'}));
      if(persist([...cases,c])){location.hash='#case/'+c.id+'/evidence';render();toast('Labeled training case created.');}
    }
    else if(action==='remove-evidence'||action==='remove-event') {
      const item=button.dataset.item,field=action==='remove-evidence'?'evidence':'timeline';
      confirmAction('Remove this record?','This removes the selected working record from this case. Export a report first if you need to keep it.',()=>{if(update(id,c=>{c[field]=c[field].filter(x=>x.id!==item);})){render();toast('Record removed.');}});
    }
    else if(action==='export-register')download('CENTINELL-AI-1-case-register.csv','text/plain',C.csv(cases));
    else if(action==='report-preview')showReport();
    else if(action==='report-txt'){const c=showReport();if(c)download('CENTINELL-AI-1-case-'+shortId(c.id)+'.txt','text/plain',C.report(c));}
    else if(action==='report-json'){const c=showReport();if(c)download('CENTINELL-AI-1-case-'+shortId(c.id)+'.json','application/json',C.backup([c]));}
    else if(action==='print-report'){if(showReport()){if(window.CentinellDevice?.printReport)window.CentinellDevice.printReport();else window.print();}}
    else if(action==='text-transform'){
      textLabInput=$('text-lab-input').value;
      try{
        if(button.dataset.mode==='base64-decode'){const raw=atob(textLabInput.replace(/\s/g,''));textLabOutput=new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(raw,c=>c.charCodeAt(0)));}
        else if(button.dataset.mode==='base64-encode'){const bytes=new TextEncoder().encode(textLabInput);let raw='';for(let i=0;i<bytes.length;i+=16384)raw+=String.fromCharCode(...bytes.subarray(i,i+16384));textLabOutput=btoa(raw);}
        else if(button.dataset.mode==='url-decode')textLabOutput=decodeURIComponent(textLabInput);
        else textLabOutput=textLabInput.replace(/\r\n?/g,'\n');
        render();toast('Text transformed locally.');
      }catch(_){toast('Input is not valid for that operation. Base64 decoding expects UTF-8 text.',true);}
    }
    else if(action==='text-to-ioc'){indicatorText=textLabOutput;currentIndicators=C.extractIndicators(indicatorText);location.hash='#tools/ioc';render();}
    else if(action==='export-text-result')download('CENTINELLia-text-result.txt','text/plain',textLabOutput);
    else if(action==='ai-check')await checkAI();
    else if(action==='open-web-assistant'){if(window.CentinellDevice?.openAssistant)window.CentinellDevice.openAssistant();else location.href='https://centinellia-field-companion.centinellsuite.chatgpt.site/#assistant';}
    else if(action==='ai-prompt'){
      const prompts=['Summarize the confirmed facts and unresolved questions.','Which evidence is missing from this timeline?','Distinguish local export activity from confirmed external transfer.','Draft a concise incident briefing using only the recorded facts.'];
      aiQuestion=prompts[Number(button.dataset.prompt)]||'';render();$('ai-question')?.focus();
    }
    else if(action==='save-ai-reply'&&aiReply&&aiCaseId){
      const record=cases.find(c=>c.id===aiCaseId);if(!record||record.notes.length>=500){toast('Select an available case with room for an observation.',true);return;}
      const value='AI-GENERATED RESPONSE — UNVERIFIED\nQuestion: '+aiReplyQuestion+'\n\n'+aiReply;
      if(value.length>10000){toast('Response is too long for one observation. Export the case separately.',true);return;}
      if(update(aiCaseId,c=>c.notes.push({id:C.id(),at:new Date().toISOString(),text:value})))toast('Unverified AI response saved to the case.');
    }
    else if(action==='sample-ioc') { $('ioc-text').value='TRAINING EXAMPLE — fictional documentation indicators only.\nReview hxxps://portal[.]example[.]com/signin and 192.0.2.44.\nReported sender: analyst@example.org.\nDo not infer maliciousness from these patterns.'; indicatorText=$('ioc-text').value; }
    else if(action==='extract') { indicatorText=$('ioc-text').value;currentIndicators=C.extractIndicators(indicatorText);render();toast(currentIndicators.length+' unique patterns extracted; review before use.'); }
    else if(action==='hash-text') {
      hashText=$('hash-text').value;
      try { const bytes=new TextEncoder().encode(hashText); const digest=await crypto.subtle.digest('SHA-256',bytes);currentHash={name:'UTF-8 text',size:bytes.length,sha256:[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('')};render(); }
      catch(_) {toast('Hashing is unavailable in this browser. Use the Android app or a local secure preview.',true);}
    }
    else if(action==='hash-file') {
      if(window.CentinellDevice) {button.disabled=true;toast('Choose a file. Large files may take time to hash.');window.CentinellDevice.hashFile();}
      else {$('file-input').value='';$('file-input').click();}
    }
    else if(action==='export-hash' && currentHash) download('CENTINELLia-sha256.json','application/json',JSON.stringify({...currentHash,calculatedAt:new Date().toISOString()},null,2));
    else if(action==='export-ioc') download('CENTINELLia-indicators.json','application/json',JSON.stringify({verification:'unverified',extractedAt:new Date().toISOString(),indicators:currentIndicators},null,2));
    else if(action==='attach-findings') {
      const target=$('attach-case')?.value; if(!target) return;
      const value=location.hash.includes('/hash') ? (currentHash ? 'SHA-256 calculated locally\nFile/text: '+currentHash.name+'\nBytes: '+currentHash.size+'\nSHA-256: '+currentHash.sha256 : '') : 'Extracted patterns — UNVERIFIED\n'+currentIndicators.map(i=>i.type+': '+i.value).join('\n');
      if(!value) return;
      if(value.length>10000) {toast('Too many findings for one observation. Export JSON instead.',true);return;}
      const record=cases.find(c=>c.id===target);if(record?.notes.length>=500){toast('This case has reached its observation limit.',true);return;}
      if(update(target,c=>c.notes.push({id:C.id(),at:new Date().toISOString(),text:value}))) toast('Findings saved to the selected case.');
    }
    else if(action==='backup') download('CENTINELLia-backup-'+new Date().toISOString().slice(0,10)+'.json','application/json',loadError?(localStorage.getItem(KEY)||''):C.backup(cases));
    else if(action==='import') { if(window.CentinellDevice) window.CentinellDevice.importBackup(); else {$('backup-input').value='';$('backup-input').click();} }
    else if(action==='clear') confirmAction('Delete all local cases?','This removes every saved case from this app. Export a workspace backup before continuing. Previously exported files will remain.',()=>{
      try {localStorage.removeItem(KEY);cases=[];loadError=false;render();toast('Local workspace cleared.');}catch(_){toast('Could not clear local storage.',true);}
    });
  });
  $('case-form').addEventListener('submit', event => {
    event.preventDefault();
    try { const c=C.createCase($('case-title').value,$('case-priority').value,$('case-category').value,$('case-observation').value); if(persist([...cases,c])) {$('case-dialog').close();location.hash='#case/'+c.id;render();toast('Case created.');} }
    catch(err){toast(err.message,true);}
  });
  document.addEventListener('submit', async event => {
    if(event.target.id==='review-form'){event.preventDefault();const x={id:reviewEdit||C.id(),updated:new Date().toISOString()};for(const k of ['title','scope','approval','expires','asset','reference','evidence','remediation','severity','status'])x[k]=$('review-'+k).value.trim();if(!validReview(x)){toast('Complete required fields.',true);return;}if(saveReviews(reviewEdit?reviews.map(v=>v.id===reviewEdit?x:v):[...reviews,x])){reviewEdit='';render();toast('Finding saved locally.');}return;}
    if(event.target.id==='asset-filter-form'){event.preventDefault();assetFilter=$('asset-filter').value;render();return;}
    if(event.target.id==='asset-form'){event.preventDefault();const a={id:assetEdit||C.id(),name:$('asset-name').value.trim(),type:$('asset-type').value,criticality:$('asset-critical').value,platform:$('asset-platform').value.trim(),location:$('asset-location').value.trim(),owner:$('asset-owner').value.trim(),status:$('asset-status').value,notes:$('asset-notes').value.trim(),updated:new Date().toISOString()};if(!validAsset(a)){toast('Invalid asset record.',true);return;}const next=assetEdit?assets.map(x=>x.id===assetEdit?a:x):[...assets,a];if(storeAssets(next)){assetEdit='';assetFilter='';render();toast('Asset saved locally.');}return;}
    if(event.target.id==='evidence-form') {
      event.preventDefault();const id=event.target.dataset.id,record=cases.find(c=>c.id===id);
      if(record?.evidence.length>=200){toast('This case has reached its evidence-record limit.',true);return;}
      try{const item=C.createEvidence({label:$('evidence-label').value,type:$('evidence-type').value,source:$('evidence-source').value,custodian:$('evidence-custodian').value,sha256:$('evidence-hash').value,acquiredAt:$('evidence-time').value,notes:$('evidence-notes').value});if(update(id,c=>c.evidence.push(item))){render();toast('Evidence metadata saved.');}}catch(err){toast(err.message,true);}return;
    }
    if(event.target.id==='event-form') {
      event.preventDefault();const id=event.target.dataset.id,record=cases.find(c=>c.id===id);
      if(record?.timeline.length>=500){toast('This case has reached its timeline-event limit.',true);return;}
      try{const item=C.createEvent({title:$('event-title').value,at:$('event-time').value,verification:$('event-verification').value,source:$('event-source').value,details:$('event-details').value});if(update(id,c=>c.timeline.push(item))){render();toast('Timeline event saved.');}}catch(err){toast(err.message,true);}return;
    }
    if(event.target.id==='ai-form') {
      event.preventDefault();if(!aiReady||aiBusy){toast('Connect the AI service before sending a question.',true);return;}
      aiQuestion=$('ai-question').value.trim();aiCaseId=$('ai-case').value;aiInclude=$('ai-include').checked;
      if(!aiQuestion){toast('Enter a question.',true);return;}
      const selected=cases.find(c=>c.id===aiCaseId);if(aiInclude&&!selected){toast('Select a case before including its report.',true);return;}
      const question=aiQuestion,context=aiInclude?C.report(selected).slice(0,12000):'';
      aiBusy=true;render();
      try{const response=await fetch('/api/ai/consult',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({question,context})});const data=await response.json();if(!response.ok||typeof data.answer!=='string')throw Error(data.error||'The AI service could not complete this consultation.');aiReply=data.answer;aiReplyQuestion=question;aiVerified=true;toast('Response received. Review it against the evidence.');}
      catch(err){toast(err.message||'The AI consultation could not be completed.',true);}
      finally{aiBusy=false;if(location.hash.startsWith('#assistant'))render();}return;
    }
    if(event.target.id!=='note-form') return;
    event.preventDefault();const id=event.target.dataset.id, value=$('note-text').value.trim(), c=cases.find(c=>c.id===id);
    if(!value) {toast('Enter an observation.',true);return;}
    if(c?.notes.length>=500) {toast('This case has reached its observation limit.',true);return;}
    if(update(id,c=>c.notes.push({id:C.id(),at:new Date().toISOString(),text:value}))) {render();toast('Observation saved.');}
  });
  document.addEventListener('change', event => {
    const el=event.target;
    if(el.id==='status-filter') filterCases();
    if(el.id==='ai-case')aiCaseId=el.value;
    if(el.id==='ai-include')aiInclude=el.checked;
    if(el.id==='case-status'||el.id==='detail-priority') {
      const field=el.id==='case-status'?'status':'priority';if(update(el.dataset.id,c=>{c[field]=el.value;})){render();toast('Case updated.');}else render();
    }
    if(el.id==='guide-case') location.hash='#guide/'+el.dataset.guide+(el.value?'/'+el.value:'');
    if(el.matches('input[type=checkbox][data-step]')) {
      if(update(el.dataset.case,c=>{if(!c.checks[el.dataset.guide])c.checks[el.dataset.guide]=Array(6).fill(false);c.checks[el.dataset.guide][Number(el.dataset.step)]=el.checked;})) render();else el.checked=!el.checked;
    }
  });
  document.addEventListener('input', event => {
    if(event.target.id==='case-search') filterCases();
    if(event.target.id==='ioc-text') indicatorText=event.target.value;
    if(event.target.id==='hash-text') hashText=event.target.value;
    if(event.target.id==='ai-question')aiQuestion=event.target.value;
    if(event.target.id==='text-lab-input')textLabInput=event.target.value;
    if(event.target.id==='expected-hash') {
      const expected=event.target.value.trim().toLowerCase();
      $('hash-comparison').textContent=!expected?'':!/^[a-f0-9]{64}$/.test(expected)?'Enter a complete 64-character SHA-256.':expected===currentHash?.sha256?'Match — both fingerprints are identical.':'No match — the fingerprints are different.';
    }
  });
  $('file-input').addEventListener('change', async event => {
    const file=event.target.files[0];if(!file)return;
    if(file.size>50*1024*1024){toast('Use the Android app for files larger than 50 MB.',true);return;}
    try {const digest=await crypto.subtle.digest('SHA-256',await file.arrayBuffer());currentHash={name:file.name,size:file.size,sha256:[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('')};render();toast('File hash calculated.');}
    catch(_){toast('Unable to read or hash the selected file.',true);}
  });
  $('backup-input').addEventListener('change',async event=>{
    const file=event.target.files[0];if(!file)return;if(file.size>2*1024*1024){toast('Backup exceeds 2 MB.',true);return;}
    try{importBackup(await file.text());}catch(_){toast('Unable to read the selected backup.',true);}
  });
  window.addEventListener('hashchange',()=>{render();window.scrollTo(0,0);$('main').focus({preventScroll:true});});
  render();
})();
