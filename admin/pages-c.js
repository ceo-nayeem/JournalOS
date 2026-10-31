/* Control Center pages C: App settings · Data · Audit · System · Appearance */
(function(){
'use strict';
const A = window.A, S = A.S, esc = A.esc, ic = A.ic, $ = A.$;

/* ================= APP SETTINGS ================= */
const FEATS = {aiAnalysis:['AI analysis', 'দৈনিক/সাপ্তাহিক সারাংশ, Insights ও Life extraction'], semanticSearch:['Semantic search', 'অর্থ ধরে খোঁজা'], askYourLife:['Ask Your Life', 'জার্নালকে প্রশ্ন করার চ্যাট'], voice:['Voice recording', 'মাইক দিয়ে রেকর্ড'], voiceTranscription:['Voice transcription', 'অডিও থেকে লেখা'], media:['Media attachments', 'ছবি, অডিও, ভিডিও'], advancedInsights:['Advanced insights', 'গভীর বিশ্লেষণ ও রিভিউ'], export:['Data export', 'ব্যাকআপ ও এক্সপোর্ট']};
const CT = [['access', 'Access & maintenance'], ['notices', 'In-app notice'], ['features', 'Feature switches'], ['defaults', 'New-user defaults'], ['header', 'Header & menus'], ['moods', 'Moods']];
A.cfgTab = t => { S.cfgTab = t; A.repaint(); };
A.page('appcfg', {title:'App settings', group:'app', icon:'sliders', editor:true, needs:['cfg'], render(){
  const t = S.sub && CT.some(x => x[0] === S.sub) ? S.sub : (S.cfgTab || 'access'); S.cfgTab = t; const c = A.D('cfg'); let b = '';
  if(t === 'access') b = '<div class="card"><h3>Access</h3>' + A.tog('cfg', 'signupsEnabled', 'Allow new sign-ups', 'বন্ধ করলে নতুন কেউ প্রথমবার সাইন-ইন করে ঢুকতে পারবে না (পুরনোরা পারবে)।') + A.tog('cfg', 'requirePro', 'Require Pro (paywall)', 'বন্ধ করলে সবাই বিনা পেমেন্টে ঢুকতে পারবে।') + A.numRow('cfg', 'entryLimitDefault', 'Default entry cap', '0 = সীমাহীন। ইউজার-ভিত্তিক সীমা এটাকে ওভাররাইড করে।') + '</div>' +
    '<div class="card" style="margin-top:14px;' + (c.maintenance.enabled ? 'border-color:var(--warn)' : '') + '"><h3>Maintenance mode</h3><div class="sub">অ্যাডমিন বাদে সবাই নোটিশ স্ক্রিন দেখবে</div>' + A.tog('cfg', 'maintenance.enabled', 'Maintenance ON', '', false) + A.fld('Message', 'cfg', 'maintenance.message', {rows:3}) + '</div>';
  if(t === 'notices') b = '<div class="card"><h3>In-app announcement banner</h3><div class="sub">অ্যাপের ভেতরে সব ইউজার দেখবে</div>' + A.tog('cfg', 'announcement.enabled', 'Show banner', '', false) + A.fld('Text', 'cfg', 'announcement.text', {rows:3}) + A.selRow('cfg', 'announcement.tone', 'Tone', '', [['info', 'Info (blue)'], ['success', 'Success (green)'], ['warning', 'Warning (amber)']], 'info') + '</div>';
  if(t === 'features') b = '<div class="card"><h3>Feature switches</h3><div class="sub">বন্ধ করলে সবার জন্য ফিচার চলে যায় — লাইভ</div>' + Object.keys(FEATS).map(k => A.tog('cfg', 'features.' + k, FEATS[k][0], FEATS[k][1], true)).join('') + '</div>';
  if(t === 'defaults') b = '<div class="card"><h3>New-user defaults</h3><div class="sub">নতুন ইউজারের প্রাথমিক সেটিংস (সে নিজে বদলালে তার পছন্দই চলবে)</div>' + A.selRow('cfg', 'defaults.theme', 'Theme', '', [['system', 'Follow device'], ['light', 'Light'], ['dark', 'Dark']], 'system') + A.selRow('cfg', 'defaults.accent', 'Accent colour', '', Object.keys(A.ACCENTS).map(k => [k, k]), 'brand') + A.tog('cfg', 'defaults.dailyReminder', 'Daily reminder', '', true) + '<div class="srow"><div><div class="t">Reminder time</div></div><input type="time" value="' + esc(c.defaults.dailyReminderTime || '20:00') + '" onchange="A.setD(\'cfg\',\'defaults.dailyReminderTime\',this.value)" style="width:auto"></div>' + A.tog('cfg', 'defaults.weeklySummary', 'Weekly summary', '', true) + A.tog('cfg', 'defaults.aiExtraction', 'AI life-extraction', '', true) + '</div>';
  if(t === 'header') b = '<div class="card"><h3>Top bar & menus</h3><div class="sub">অ্যাপের হেডারের কোন অংশ দেখাবে</div>' + [['showQuickAdd', '+ button (New Journal / Add Mood)'], ['showAddMood', '"Add Mood" option'], ['showSearch', 'Search icon'], ['showThemeMenu', 'Theme menu'], ['showStreak', 'Day-streak chip'], ['showDownload', '"Download the app" in profile menu']].map(([k, l]) => A.tog('cfg', 'header.' + k, l, '', true)).join('') + A.selRow('cfg', 'header.openOn', 'Menus open on', '', [['hover', 'Hover'], ['click', 'Click']], 'hover') +
    '<div class="srow"><div><div class="t">Theme-menu colours (4)</div><div class="d">যেগুলো থিম মেনুতে দেখাবে</div></div><div class="row">' + [0, 1, 2, 3].map(i => '<select onchange="A.setD(\'cfg\',\'header.accents.' + i + '\',this.value)" style="width:auto">' + Object.keys(A.ACCENTS).map(k => '<option ' + (((c.header.accents || [])[i] || '') === k ? 'selected' : '') + '>' + k + '</option>').join('') + '</select>').join('') + '</div></div></div>';
  if(t === 'moods') b = '<div class="card"><h3>Mood types</h3><div class="sub">ডিফল্ট নাম ও ইমোজি (ইউজার নিজের ইমোজি বেছে নিলে সেটাই চলবে)</div><div class="mood-g">' + A.MOODS.map(([id, l, e]) => '<div><input maxlength="8" value="' + esc((c.moodEmojis || {})[id] || e) + '" oninput="A.setD(\'cfg\',\'moodEmojis.' + id + '\',this.value.trim())"><input maxlength="24" value="' + esc((c.moodLabels || {})[id] || l) + '" oninput="A.setD(\'cfg\',\'moodLabels.' + id + '\',this.value)"><span class="muted sm mono">' + id + '</span></div>').join('') + '</div></div>';
  return A.errBanner(['cfg']) + A.head('App settings', 'অ্যাপের আচরণ, ফিচার, ডিফল্ট ও হেডার — সব লাইভ কন্ট্রোল।') + A.savebar('cfg') + A.tabs(t, CT, 'A.cfgTab') + '<div style="margin-top:16px">' + b + '</div>';
}});

/* ================= DATA CENTER ================= */
A.page('data', {title:'Data center', group:'sys', icon:'db', needs:['orders', 'users', 'reviews'], render(){
  const card = (l, n, t) => '<div class="card kpi"><div class="l">' + l + '</div><div class="v">' + A.num(n) + '</div><div class="d">' + t + '</div></div>';
  return A.errBanner(['orders', 'users', 'reviews', 'audit']) + A.head('Data center', 'এক্সপোর্ট, ব্যাকআপ, রিস্টোর ও ক্লিনআপ।') +
  '<div class="grid g4">' + card('userDirectory', S.users.length, 'documents') + card('orders', S.orders.length, 'documents') + card('reviews', S.reviews.length, 'documents') + card('adminAudit', S.audit.length, 'latest loaded') + '</div>' +
  '<div class="grid g2" style="margin-top:16px"><div class="card"><h3>Export</h3><div class="sub">CSV/JSON ডাউনলোড</div><div class="row"><button class="btn" onclick="A.exportUsers()">' + ic('dl') + ' Users CSV</button><button class="btn" onclick="A.exportOrders()">' + ic('dl') + ' Orders CSV</button><button class="btn" onclick="A.exportReviews()">' + ic('dl') + ' Reviews CSV</button><button class="btn pri" onclick="A.backup()">' + ic('db') + ' Full backup (JSON)</button></div></div>' +
  '<div class="card"><h3>Restore settings</h3><div class="sub">ব্যাকআপ JSON থেকে সেটিংস ড্রাফটে লোড হয় — রিভিউ করে Save দিতে হয়</div><input type="file" accept="application/json" id="restF" onchange="A.restore(this.files[0])"></div></div>' +
  '<div class="card" style="margin-top:16px"><h3>User data inspector</h3><div class="sub">ইমেইল বা UID দিয়ে ইউজার খুঁজে তার সংরক্ষিত ডেটা দেখো</div><div class="row"><input type="search" id="insQ" placeholder="email / name / uid" style="max-width:320px" onkeydown="if(event.key===\'Enter\')A.inspect()"><button class="btn pri" onclick="A.inspect()">' + ic('eye') + ' Inspect</button></div></div>' +
  '<div class="card danger-z" style="margin-top:16px"><h3>Cleanup (danger zone)</h3><div class="sub">মুছলে ফেরত আসে না — আগে ব্যাকআপ নাও</div><div class="row"><button class="btn bad" onclick="A.purge(\'rejected\')">Delete rejected orders (' + S.orders.filter(o => o.status === 'rejected').length + ')</button><button class="btn bad" onclick="A.purge(\'reviews\')">Delete unpublished reviews (' + S.reviews.filter(r => !r.approved).length + ')</button><button class="btn bad" onclick="A.purge(\'ghosts\')">Remove directory rows without email (' + S.users.filter(u => !u.email).length + ')</button></div></div>';
}});
A.exportReviews = () => A.csv('reviews.csv', [['id', 'name', 'rating', 'text', 'published', 'created']].concat(S.reviews.map(r => [r.id, r.name, r.rating, r.text, r.approved, new Date(A.ms(r.createdAt)).toISOString()])));
A.backup = function(){ A.download('journalos-backup-' + new Date().toISOString().slice(0, 10) + '.json', new Blob([JSON.stringify({exportedAt:new Date().toISOString(), appConfig:S.cfgSaved, siteConfig:S.siteSaved, users:S.users, orders:S.orders, reviews:S.reviews}, null, 2)], {type:'application/json'})); A.audit('data:backup', '', ''); };
A.restore = function(f){ if(!f) return; const r = new FileReader(); r.onload = () => { try{ const j = JSON.parse(r.result); if(j.appConfig) S.drafts.cfg = A.merge(A.DEF_CFG, j.appConfig); if(j.siteConfig) S.drafts.site = A.siteDefaults(A.clone(j.siteConfig)); A.paintSavebars(); A.toast('ড্রাফটে লোড হয়েছে — App settings / Website পেজে গিয়ে Save করো', 'ok'); A.go('appcfg'); }catch(e){ A.err(e, 'ফাইল পড়া যায়নি'); } }; r.readAsText(f); };
A.inspect = function(){ const q = ($('insQ').value || '').trim().toLowerCase(); const u = S.users.find(x => x.uid === q || (x.email || '').toLowerCase() === q || (x.email || '').toLowerCase().includes(q) || (x.name || '').toLowerCase().includes(q)); if(!u) return A.toast('ইউজার পাওয়া যায়নি', 'err'); A.openUser(u.uid); setTimeout(() => A.uPeek(u.uid), 120); };
A.purge = async function(w){
  const L = {rejected:[S.orders.filter(o => o.status === 'rejected'), 'orders'], reviews:[S.reviews.filter(r => !r.approved), 'reviews'], ghosts:[S.users.filter(u => !u.email), 'userDirectory']}[w], items = L[0];
  if(!items.length) return A.toast('মোছার কিছু নেই'); if(!await A.confirm(items.length + 'টি ডকুমেন্ট মুছবে?', 'এটা ফেরত আনা যাবে না।', 'মুছে ফেলো', 'bad')) return;
  try{ for(let i = 0; i < items.length; i += 400){ const b = A._db().batch(); items.slice(i, i + 400).forEach(x => b.delete(A._db().collection(L[1]).doc(x.id || x.uid))); await b.commit(); } A.audit('data:purge', w, items.length + ' docs'); A.toast('মোছা হয়েছে', 'ok'); }catch(e){ A.err(e); }
};

/* ================= AUDIT ================= */
const AF = S.af = {q:'', a:'all'};
function auditRows(){ const q = AF.q.toLowerCase(); return S.audit.filter(a => (AF.a === 'all' || (a.action || '').startsWith(AF.a)) && (!q || [a.action, a.target, a.detail, a.by].some(x => String(x || '').toLowerCase().includes(q)))); }
function auditTable(){ const r = auditRows(); return r.length ? '<table><thead><tr><th>When</th><th>Action</th><th>Target</th><th>Detail</th><th>By</th></tr></thead><tbody>' + r.map(a => '<tr><td class="sm muted" style="white-space:nowrap">' + A.fmt(a.at) + '</td><td><span class="badge mono">' + esc(a.action) + '</span></td><td>' + esc(a.target) + '</td><td class="sm muted">' + esc(a.detail) + '</td><td class="sm">' + esc(a.by) + '</td></tr>').join('') + '</tbody></table>' : '<div class="empty"><b>কিছু নেই</b></div>'; }
A.page('audit', {title:'Audit log', group:'sys', icon:'log', needs:['audit'], render(){
  const kinds = [...new Set(S.audit.map(a => (a.action || '').split(':')[0]))];
  return A.errBanner(['audit']) + A.head('Audit log', 'অ্যাডমিন হিসেবে কে কখন কী বদলেছে — মোছা যায় না।', '<button class="btn" onclick="A.csv(\'audit.csv\',[[\'at\',\'action\',\'target\',\'detail\',\'by\']].concat(A.S.audit.map(a=>[a.at,a.action,a.target,a.detail,a.by])))">' + ic('dl') + ' CSV</button>') +
  '<div class="tools"><div class="search">' + ic('log') + '<input type="search" placeholder="খোঁজো…" value="' + esc(AF.q) + '" oninput="A.auQ(this.value)"></div><select onchange="A.auA(this.value)"><option value="all">All actions</option>' + kinds.map(k => '<option ' + (AF.a === k ? 'selected' : '') + '>' + esc(k) + '</option>').join('') + '</select></div><div class="tbl-w" id="auT">' + auditTable() + '</div>';
}});
A.auQ = A.debounce(v => { AF.q = v; $('auT').innerHTML = auditTable(); }, 150);
A.auA = v => { AF.a = v; $('auT').innerHTML = auditTable(); };

/* ================= SYSTEM ================= */
A.page('system', {title:'System & security', group:'sys', icon:'shield', render(){
  const c = A.C.firebase;
  return A.head('System & security', 'হেলথ চেক, অ্যাডমিন অ্যাক্সেস ও সিকিউরিটি তথ্য।', '<button class="btn pri" onclick="A.health()">' + ic('refresh') + ' Run health check</button>') +
  '<div class="grid g2"><div class="card"><h3>Health check</h3><div class="sub">Firestore পড়া/লেখা পরীক্ষা</div><div id="hcBox"><div class="muted">"Run health check" চাপো।</div></div></div>' +
  '<div class="card"><h3>Admin access</h3><div class="sub">কে ব্যাকএন্ডে ঢুকতে পারে</div>' + A.ADMIN_EMAILS.map(e => '<div class="list-i"><div class="sp mono sm">' + esc(e) + '</div>' + (e === (S.user.email || '').toLowerCase() ? A.badge('you', 'ok') : '') + '</div>').join('') +
    '<p class="sm muted" style="margin-top:12px">অ্যাডমিন তালিকা বদলাতে <code>admin/core.js</code> (ADMIN_EMAILS), <code>app/index.html</code> ও <code>firestore.rules</code> তিন জায়গায় একই ইমেইল দাও। Passcode: <code>admin/core.js</code> → <code>PASS</code>।</p><div class="row"><button class="btn" onclick="A.lock()">' + ic('shield') + ' Lock now</button></div></div></div>' +
  '<div class="grid g2" style="margin-top:16px"><div class="card"><h3>Environment</h3><dl class="kv"><dt>Project</dt><dd class="mono">' + esc(c.projectId) + '</dd><dt>Auth domain</dt><dd class="mono">' + esc(c.authDomain) + '</dd><dt>Signed in</dt><dd>' + esc(S.user.email) + '</dd><dt>Online</dt><dd>' + (navigator.onLine ? 'yes' : 'no') + '</dd><dt>Docs loaded</dt><dd>' + S.users.length + ' users · ' + S.orders.length + ' orders · ' + S.reviews.length + ' reviews</dd></dl></div>' +
  '<div class="card"><h3>Rules checklist</h3><div class="sub">firestore.rules ডিপ্লয় করার পর এগুলো সবুজ হবে</div><ul style="padding-left:18px;color:var(--ink2)"><li><code>siteConfig</code> — পাবলিক read, অ্যাডমিন write</li><li><code>userDirectory</code> / <code>orders</code> / <code>reviews</code> — অ্যাডমিন read-write</li><li><code>adminAudit</code> — অ্যাডমিন create-only</li></ul><p class="sm muted">Firebase Console → Firestore → Rules এ রিপোর <code>firestore.rules</code> ফাইলটা পেস্ট করে Publish দাও।</p></div></div>';
}});
A.health = async function(){
  const box = $('hcBox'); box.innerHTML = '<div class="skel"></div>'; const db = A._db(), out = [];
  const t = async (n, f) => { const s = performance.now(); try{ await f(); out.push([n, true, Math.round(performance.now() - s) + ' ms']); }catch(e){ out.push([n, false, e.code || e.message]); } };
  await t('Read appConfig/global', () => db.collection('appConfig').doc('global').get());
  await t('Read siteConfig/site', () => db.collection('siteConfig').doc('site').get());
  await t('List userDirectory', () => db.collection('userDirectory').limit(1).get());
  await t('List orders', () => db.collection('orders').limit(1).get());
  await t('List reviews', () => db.collection('reviews').limit(1).get());
  await t('Read adminAudit', () => db.collection('adminAudit').limit(1).get());
  await t('Write adminAudit (admin write test)', () => db.collection('adminAudit').add({action:'health:ping', target:'', detail:'', by:S.user.email, at:new Date().toISOString()}));
  box.innerHTML = out.map(r => '<div class="list-i"><span>' + (r[1] ? '✅' : '❌') + '</span><div class="sp">' + esc(r[0]) + '</div><span class="sm ' + (r[1] ? 'muted' : 'down') + '">' + esc(r[2]) + '</span></div>').join('');
};

/* ================= APPEARANCE ================= */
A.page('prefs', {title:'Backend appearance', group:'sys', icon:'gear', render(){
  const p = A.prefs(), th = p.theme || 'dark';
  const opt = (k, v, l) => '<button class="' + ((p[k] || (k === 'theme' ? 'dark' : 'comfortable')) === v ? 'on' : '') + '" onclick="A.prefSet(\'' + k + '\',\'' + v + '\');A.repaint()">' + l + '</button>';
  return A.head('Backend appearance', 'এই কন্ট্রোল সেন্টারের নিজস্ব থিম — অ্যাপ বা ওয়েবসাইটের ডিজাইনে প্রভাব ফেলে না। শুধু এই ব্রাউজারে সেভ হয়।') +
  '<div class="grid g2"><div class="card"><h3>Theme</h3><div class="pill-opt" style="margin-bottom:14px">' + opt('theme', 'dark', 'Dark') + opt('theme', 'light', 'Light') + opt('theme', 'system', 'System') + '</div><h3>Density</h3><div class="pill-opt">' + opt('dens', 'comfortable', 'Comfortable') + opt('dens', 'compact', 'Compact') + '</div></div>' +
  '<div class="card"><h3>Accent</h3><div class="swatches" style="margin-bottom:14px">' + Object.keys(A.ACCENTS).map(k => '<button class="swatch" title="' + k + '" style="background:linear-gradient(135deg,' + A.ACCENTS[k][0] + ',' + A.ACCENTS[k][1] + ')" onclick="A.prefSet(\'a\',\'' + A.ACCENTS[k][0] + '\');A.prefSet(\'a2\',\'' + A.ACCENTS[k][1] + '\')"></button>').join('') + '</div><div class="row"><label class="row sm">Primary <input type="color" value="' + (p.a || '#7f7cff') + '" onchange="A.prefSet(\'a\',this.value)"></label><label class="row sm">Secondary <input type="color" value="' + (p.a2 || '#38d3f0') + '" onchange="A.prefSet(\'a2\',this.value)"></label><button class="btn sm" onclick="A.prefSet(\'a\',\'\');A.prefSet(\'a2\',\'\')">Reset</button></div>' + '<div class="srow" style="margin-top:14px"><div><div class="t">Collapsed sidebar</div></div><label class="sw"><input type="checkbox" ' + (p.mini ? 'checked' : '') + ' onchange="A.prefSet(\'mini\',this.checked?1:0)"><i></i></label></div></div></div>';
}});
})();
