/* Packaged, offline UI. No remote scripts, analytics, or network calls. */
(() => {
  'use strict';
  const C = window.Centinell, $ = id => document.getElementById(id), e = C.esc;
  const KEY = 'centinellia.workspace.v1';
  let cases = [], loadError = false, currentIndicators = [], indicatorText = '', hashText = '', currentHash = null, toastTimer;
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
    const active = cases.filter(c => c.status !== 'Closed');
    return heading('DFIR FIELD COMPANION', 'Clarity for every investigation.', 'A focused workspace for the facts that matter.', newButton) +
      `<section class="hero"><div><span class="hero-label">YOUR INVESTIGATION. YOUR DEVICE.</span><h2>Turn observations<br>into a clear case record.</h2><p>Document the timeline, organize your findings, and work through a response guide. Every conclusion stays in your hands.</p><a class="small-link" href="#playbooks">Explore response guides ↗</a></div><div class="hero-visual" aria-hidden="true"><div class="shield"><div>C</div></div></div></section>
      <section class="stats" aria-label="Workspace totals"><div class="stat"><span class="label">Active cases</span><strong>${active.length.toString().padStart(2,'0')}</strong><span class="footnote">Open &amp; in progress</span></div><div class="stat"><span class="label">High priority</span><strong class="gold">${active.filter(c => ['High','Critical'].includes(c.priority)).length.toString().padStart(2,'0')}</strong><span class="footnote">High &amp; critical cases</span></div><div class="stat"><span class="label">Observations</span><strong class="mint">${cases.reduce((n,c) => n+c.notes.length,0).toString().padStart(2,'0')}</strong><span class="footnote">Across all case records</span></div></section>
      <div class="grid-two"><section class="panel"><div class="section-top"><h2>Recent cases</h2><a class="small-link" href="#cases">View all ↗</a></div>${cases.length ? [...cases].sort((a,b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0,3).map(caseRow).join('') : emptyCases()}</section><section class="panel"><div class="section-top"><h2>At your fingertips</h2></div><a class="quick-action" href="#tools/ioc"><span class="symbol">⌘</span><span><strong>Extract indicators</strong><small>Review URLs, IPs, domains &amp; hashes</small></span><span class="arrow">↗</span></a><a class="quick-action" href="#tools/hash"><span class="symbol">#</span><span><strong>Verify a SHA-256</strong><small>Calculate a text or file fingerprint</small></span><span class="arrow">↗</span></a><a class="quick-action" href="#playbooks"><span class="symbol">≡</span><span><strong>Follow a response guide</strong><small>Four practical investigation checklists</small></span><span class="arrow">↗</span></a><a class="quick-action" href="#settings"><span class="symbol">↓</span><span><strong>Back up your workspace</strong><small>Export case records as JSON</small></span><span class="arrow">↗</span></a></section></div>
      <div class="notice"><strong>Built for analyst judgment.</strong> This version provides local tools and written response guides. It does not connect to an AI model or monitor your device.</div>`;
  }
  function caseList() {
    return heading('CASE REGISTER','Keep the full picture.','Your observations, organized by investigation.',newButton)+
      '<div class="filters"><label>Search cases<input id="case-search" type="search" placeholder="Search title, ID, or category"></label><label>Status<select id="status-filter"><option value="all">All statuses</option>'+C.statuses.map(s => `<option>${s}</option>`).join('')+'</select></label></div><section class="panel" id="case-list">'+(cases.length ? cases.map(caseRow).join('') : emptyCases())+'</section>';
  }
  function detail(id) {
    const c = cases.find(c => c.id === id); if (!c) return heading('CASE REGISTER','Case not found.','Return to the case register to select an existing record.')+'<a class="small-link" href="#cases">Back to case register</a>';
    return heading('CASE '+shortId(c.id),e(c.title),e(c.category)+' · Opened '+date(c.createdAt),`<button data-action="export-case" data-id="${e(c.id)}">Export report ↓</button>`)+
      `<div class="grid-two"><div><section class="panel"><div class="section-top"><h2>Case observations</h2><span class="badge ${c.priority.toLowerCase()}">${c.priority}</span></div><form id="note-form" data-id="${e(c.id)}"><label>Add an observation<textarea id="note-text" rows="4" maxlength="10000" required placeholder="What did you observe? Include the source, event time, and what remains unverified."></textarea></label><button class="primary" type="submit">Save observation</button></form>${c.notes.length ? [...c.notes].reverse().map(n => `<article class="note"><div class="meta">Recorded ${date(n.at)} · UTC ${e(n.at)}</div><p>${e(n.text)}</p></article>`).join('') : '<p class="muted">No observations recorded yet.</p>'}</section></div><div><section class="panel"><h2>Case details</h2><label>Status<select id="case-status" data-id="${e(c.id)}">${C.statuses.map(s => `<option${s===c.status?' selected':''}>${s}</option>`).join('')}</select></label><label>Priority<select id="detail-priority" data-id="${e(c.id)}">${C.priorities.map(s => `<option${s===c.priority?' selected':''}>${s}</option>`).join('')}</select></label><p class="meta">Last updated<br>${e(c.updatedAt)} (UTC)</p></section><section class="panel"><h2>Response checklists</h2><p class="muted">Checklists are saved with this case.</p>${C.guides.map(g => `<a class="quick-action" href="#guide/${g.id}/${e(c.id)}"><span><strong>${g.title}</strong><small>${c.checks?.[g.id]?.filter(Boolean).length || 0} / ${g.steps.length} steps recorded</small></span><span class="arrow">↗</span></a>`).join('')}</section><button class="danger ghost" data-action="delete-case" data-id="${e(c.id)}">Delete case</button></div></div>`;
  }
  function playbooks() {
    return heading('RESPONSE GUIDES','A deliberate next step.','Practical checklists to support a documented response.')+'<div class="guide-grid">'+C.guides.map(g => `<article class="guide-card"><span class="tag">${g.tag}</span><h2>${g.title}</h2><p class="muted">${g.summary}</p><button data-action="open-guide" data-id="${g.id}">Open guide ↗</button></article>`).join('')+'</div><div class="notice">These are general reference guides. Use your organization’s approved response procedures and authorized evidence collection tools.</div>';
  }
  function guideView(guideId, caseId) {
    const g = C.guides.find(g => g.id === guideId); if (!g) return playbooks();
    const c = cases.find(c => c.id === caseId);
    return heading(g.tag,g.title,g.summary)+`<section class="panel"><label>Save checklist progress to a case<select id="guide-case" data-guide="${g.id}"><option value="">Read without saving progress</option>${cases.map(record => `<option value="${e(record.id)}"${record.id===caseId?' selected':''}>${e(record.title)}</option>`).join('')}</select></label>${c ? `<p class="muted">${c.checks?.[g.id]?.filter(Boolean).length || 0} of ${g.steps.length} steps recorded for ${e(c.title)}.</p>` : '<p class="muted">Select a case to record completed steps.</p>'}${g.steps.map((s,i) => c ? `<label class="check-row"><input type="checkbox" data-guide="${g.id}" data-case="${e(c.id)}" data-step="${i}"${c.checks?.[g.id]?.[i]?' checked':''}><span>${e(s)}</span></label>` : `<div class="step"><b>${String(i+1).padStart(2,'0')}</b><p>${e(s)}</p></div>`).join('')}</section>${c ? `<a class="small-link" href="#case/${e(c.id)}">← Back to case</a>` : '<a class="small-link" href="#playbooks">← All response guides</a>'}`;
  }
  function hashResult() {
    return currentHash ? `<div class="hash-result"><small>${e(currentHash.name)}${currentHash.size !== undefined ? ' · '+Number(currentHash.size).toLocaleString()+' bytes' : ''}</small><span class="eyebrow">SHA-256</span><code>${e(currentHash.sha256)}</code></div><label>Compare with an expected SHA-256<input id="expected-hash" maxlength="64" placeholder="Paste a 64-character hexadecimal hash" autocomplete="off" spellcheck="false"></label><p id="hash-comparison" class="muted" role="status"></p><div class="button-row"><button data-action="export-hash">Export hash record ↓</button></div>` : '';
  }
  function caseAttach() {
    return cases.length ? `<label>Attach findings to a case<select id="attach-case">${cases.map(c => `<option value="${e(c.id)}">${e(c.title)}</option>`).join('')}</select></label><button data-action="attach-findings">Save findings as an observation</button>` : '<p class="muted">Open a case to attach findings to its record.</p>';
  }
  function tools(mode) {
    const isHash = mode === 'hash';
    return heading('LOCAL ANALYSIS TOOLS','Work with the evidence.','Selected content is processed on your device.')+
      `<div class="tool-tabs"><button data-action="tool-ioc" aria-pressed="${!isHash}">Indicator extraction</button><button data-action="tool-hash" aria-pressed="${isHash}">SHA-256 hashing</button></div>`+
      (isHash ? `<section class="panel"><h2>Calculate a fingerprint</h2><p class="muted">A hash helps compare exact bytes. It does not establish whether a file is safe.</p><label>Text to hash<textarea id="hash-text" rows="4" maxlength="100000" placeholder="Enter text. Spaces and line breaks affect the hash.">${e(hashText)}</textarea></label><div class="button-row"><button class="primary" data-action="hash-text">Hash text</button><button data-action="hash-file" id="hash-file-button">Choose a file</button></div><p class="muted">Files are read locally and are never executed by this app.</p><div id="hash-result">${hashResult()}</div></section>${currentHash ? '<section class="panel">'+caseAttach()+'</section>' : ''}` :
      `<section class="panel"><h2>Find indicators in text</h2><p class="muted">Extract IPv4 addresses, domains, URLs, email addresses, and common hash formats. Defanged forms such as hxxps and [.] are normalized.</p><label>Observations or log excerpt<textarea id="ioc-text" rows="7" maxlength="100000" spellcheck="false" placeholder="Paste a log excerpt, message, or analyst observation.">${e(indicatorText)}</textarea></label><div class="button-row"><button class="primary" data-action="extract">Extract indicators</button><button data-action="sample-ioc">Try a training example</button></div></section><section class="panel"><div class="section-top"><h2>Extracted indicators</h2><span class="badge">${currentIndicators.length} found</span></div><p class="muted">Extraction identifies patterns. These results are unverified and do not indicate malicious activity. Supports IPv4; IPv6 is not extracted in this version.</p>${currentIndicators.length ? currentIndicators.map(i => `<div class="indicator"><span>${e(i.type)}</span><code>${e(i.value)}</code></div>`).join('')+'<div class="button-row"><button data-action="export-ioc">Export JSON ↓</button></div><br>'+caseAttach() : '<p class="muted">Paste text above and run extraction to review the results.</p>'}</section>`);
  }
  function settings() {
    return heading('WORKSPACE SETTINGS','Your data stays close.','Manage your records and understand how this version works.')+
      `<section class="panel"><h2>Backups &amp; portability</h2><p class="muted">Cases are saved in this app’s local storage. Uninstalling the app or clearing app data removes them. Exported files are readable text and may contain sensitive information.</p><div class="button-row"><button class="primary" data-action="backup">Export workspace JSON ↓</button><button data-action="import">Import backup</button></div><p class="muted">Import adds new case IDs. Existing case IDs are kept as they are. Maximum backup size: 2 MB.</p></section>
      <section class="panel"><h2>Privacy at a glance</h2><ul class="privacy-list"><li>No account, advertising, analytics, or app network connection.</li><li>Case titles, observations, priorities, and checklists stay in app-local storage. They are not separately encrypted by this app.</li><li>File hashing reads only the file you select and keeps the fingerprint in memory until you attach or export it. The source file is not copied into the workspace.</li><li>Exporting creates a file at a location you choose, which may be managed by a cloud storage provider.</li><li>Back up records before uninstalling, clearing storage, or changing devices.</li></ul></section>
      <section class="panel"><h2>About CENTINELLia</h2><p class="muted">Version 1.0.0 · DFIR Field Companion<br>Beacon of the Eagle LLC · Centinell Suite Defense project</p><p class="muted">This release offers analyst tools and written response guides. It has no AI model connection, automated threat detection, device scanning, tamper-evident audit log, or chain-of-custody system. Observations and extracted indicators require human verification.</p><p class="muted">Support: centinellsuite@gmail.com</p></section><section class="panel"><h2>Remove local records</h2><p class="muted">Deleting this workspace removes all saved cases from this app. Previously exported files are managed separately.</p><button class="danger" data-action="clear">Delete all local cases</button></section>`;
  }
  function render() {
    const parts = (location.hash.slice(1) || 'overview').split('/');
    const view = parts[0];
    const navView = view === 'case' ? 'cases' : view === 'guide' ? 'playbooks' : view;
    document.querySelectorAll('nav a').forEach(a => { if(a.dataset.view===navView) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current'); });
    $('breadcrumb').textContent = {overview:'Overview',cases:'Case register',case:'Case detail',tools:'Analysis tools',playbooks:'Response guides',guide:'Response guide',settings:'Settings'}[view] || 'Overview';
    const content = view==='cases'?caseList():view==='case'?detail(parts[1]):view==='tools'?tools(parts[1]):view==='playbooks'?playbooks():view==='guide'?guideView(parts[1],parts[2]):view==='settings'?settings():overview();
    $('main').innerHTML = (loadError ? '<div class="notice"><strong>Records could not be loaded.</strong> New saves are paused to protect the stored data. Open Settings to export the raw stored data or reset this workspace.</div>' : '') + content;
    document.title = 'CENTINELLia · '+$('breadcrumb').textContent;
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
  document.addEventListener('click', async event => {
    const button=event.target.closest('[data-action]'); if(!button) return;
    const action=button.dataset.action, id=button.dataset.id;
    if(action==='new-case') { $('case-form').reset(); $('case-dialog').showModal(); $('case-title').focus(); }
    else if(action==='close-dialog') $('case-dialog').close();
    else if(action==='export-case') { const c=cases.find(c=>c.id===id); if(c) download('CENTINELLia-case-'+shortId(c.id)+'.txt','text/plain',C.report(c)); }
    else if(action==='delete-case') confirmAction('Delete this case?','Its observations and checklist progress will be removed from this device. Export a report or backup first if you need to retain it.',()=>{if(persist(cases.filter(c=>c.id!==id))) {location.hash='#cases';render();toast('Case deleted.');}});
    else if(action==='open-guide') location.hash='#guide/'+id;
    else if(action==='tool-ioc') location.hash='#tools/ioc';
    else if(action==='tool-hash') location.hash='#tools/hash';
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
  document.addEventListener('submit', event => {
    if(event.target.id!=='note-form') return;
    event.preventDefault();const id=event.target.dataset.id, value=$('note-text').value.trim(), c=cases.find(c=>c.id===id);
    if(!value) {toast('Enter an observation.',true);return;}
    if(c?.notes.length>=500) {toast('This case has reached its observation limit.',true);return;}
    if(update(id,c=>c.notes.push({id:C.id(),at:new Date().toISOString(),text:value}))) {render();toast('Observation saved.');}
  });
  document.addEventListener('change', event => {
    const el=event.target;
    if(el.id==='status-filter') filterCases();
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
