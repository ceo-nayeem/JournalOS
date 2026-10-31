/* JournalOS Control Center — core: auth, data listeners, router, drafts, UI primitives */
(function(){
'use strict';
const C = window.JOURNALOS_SITE;
const ADMIN_EMAILS = ['ceo.nayeemuhammad@gmial.com','ceo.nayeemuhammad@gmail.com'];
const PASS = '12340';
const SKEY = 'journalos.adminUnlocked';
const $ = id => document.getElementById(id);
const A = window.A = { C, PAGES:{}, GROUPS:[], ADMIN_EMAILS, PASS };

/* ---------- state ---------- */
const S = A.S = { user:null, orders:[], users:[], reviews:[], audit:[], cfg:{}, site:{}, loaded:{}, errors:{}, page:'dashboard', sub:'' };
A.DEF_CFG = {
  appName:'JournalOS', tagline:'Write First. Everything Else Second.', signupsEnabled:true,
  maintenance:{enabled:false,message:'JournalOS is briefly down for maintenance. Your journals are safe — please check back shortly.'},
  announcement:{enabled:false,text:'',tone:'info'},
  features:{aiAnalysis:true,semanticSearch:true,askYourLife:true,voice:true,voiceTranscription:true,media:true,advancedInsights:true,export:true},
  defaults:{theme:'system',accent:'brand',dailyReminder:true,dailyReminderTime:'20:00',weeklySummary:true,aiExtraction:true},
  header:{showQuickAdd:true,showAddMood:true,showSearch:true,showThemeMenu:true,showStreak:true,showDownload:true,openOn:'hover',accents:['brand','indigo','rose','emerald']},
  moodLabels:{},moodEmojis:{},entryLimitDefault:0,requirePro:true,pendingMaxDays:14
};
A.DEF_RESTR = {suspended:false,readOnly:false,aiDisabled:false,mediaDisabled:false,exportDisabled:false,entryLimit:0};
A.MOODS = [['happy','Happy','🙂'],['excited','Excited','🤩'],['grateful','Grateful','🥰'],['calm','Calm','😌'],['neutral','Neutral','😐'],['tired','Tired','😴'],['sad','Sad','😔'],['anxious','Anxious','😟'],['stressed','Stressed','😣'],['angry','Angry','😠']];
A.ACCENTS = {brand:['#0F6F6B','#27A898'],indigo:['#4F46E5','#06B6D4'],cyan:['#0A7EA4','#22D3A5'],emerald:['#059669','#34D399'],rose:['#E11D48','#FB7185'],violet:['#7C3AED','#C084FC'],amber:['#D97706','#FBBF24']};

/* ---------- tiny utils ---------- */
const esc = A.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
A.$ = $;
A.clone = o => JSON.parse(JSON.stringify(o == null ? {} : o));
A.merge = function m(a, b){ const o = Array.isArray(a) ? a.slice() : Object.assign({}, a); Object.keys(b || {}).forEach(k => { o[k] = (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a && typeof a[k] === 'object' && !Array.isArray(a[k])) ? m(a[k], b[k]) : b[k]; }); return o; };
A.get = (o, p, d) => { const v = String(p).split('.').reduce((a, k) => (a == null ? undefined : a[k]), o); return v === undefined ? d : v; };
A.set = (o, p, v) => { const k = String(p).split('.'); let x = o; for(let i = 0; i < k.length - 1; i++){ if(x[k[i]] == null || typeof x[k[i]] !== 'object') x[k[i]] = /^\d+$/.test(k[i+1]) ? [] : {}; x = x[k[i]]; } x[k[k.length-1]] = v; };
A.ms = t => !t ? 0 : t.toMillis ? t.toMillis() : (typeof t === 'number' ? t : Date.parse(t) || 0);
A.fmt = (t, o) => { const m = A.ms(t); return m ? new Date(m).toLocaleString('en-GB', o || {day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—'; };
A.day = t => A.fmt(t, {day:'numeric',month:'short',year:'numeric'});
A.ago = t => { const m = A.ms(t); if(!m) return '—'; const s = Math.max(0, (Date.now() - m) / 1000); if(s < 60) return 'just now'; if(s < 3600) return Math.floor(s/60) + 'm ago'; if(s < 86400) return Math.floor(s/3600) + 'h ago'; if(s < 2592000) return Math.floor(s/86400) + 'd ago'; return A.day(m); };
A.money = n => '৳' + Math.round(Number(n) || 0).toLocaleString('en-US');
A.num = n => (Number(n) || 0).toLocaleString('en-US');
A.debounce = (f, w) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => f(...a), w); }; };
A.csv = function(name, rows){
  const q = v => { v = v == null ? '' : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
  const blob = new Blob(['﻿' + rows.map(r => r.map(q).join(',')).join('\n')], {type:'text/csv;charset=utf-8'});
  A.download(name, blob);
};
A.download = function(name, blob){ const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); };
A.copy = function(t){ (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => A.toast('কপি হয়েছে', 'ok'), () => { const x = document.createElement('textarea'); x.value = t; document.body.appendChild(x); x.select(); try{ document.execCommand('copy'); A.toast('কপি হয়েছে', 'ok'); }catch(e){} x.remove(); }); };

/* icons */
const IC = {
  home:'<path d="M3 11l9-8 9 8M5 10v10h14V10"/>', orders:'<path d="M6 2l-2 4v14a2 2 0 002 2h12a2 2 0 002-2V6l-2-4zM4 6h16M9 10a3 3 0 006 0"/>', users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M16 4.5a3.5 3.5 0 010 7M21.5 20c0-2.8-1.7-4.8-4-5.6"/>',
  star:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>', tag:'<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.3"/>', card:'<rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20M6 15h4"/>',
  globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>', brush:'<path d="M18 3l3 3-9 9-3-3zM9 12c-3 0-5 2-5 5 0 2-1 3-2 4 4 1 9 0 9-5"/>', sliders:'<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  db:'<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>', log:'<path d="M5 3h11l3 3v15H5zM9 9h6M9 13h6M9 17h4"/>', shield:'<path d="M12 3l8 3v6c0 5-3.4 8-8 9-4.6-1-8-4-8-9V6z"/>', gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/>',
  chat:'<path d="M21 12a8 8 0 01-11.7 7L3 21l2-5.5A8 8 0 1121 12z"/>', plus:'<path d="M12 5v14M5 12h14"/>', x:'<path d="M6 6l12 12M18 6L6 18"/>', check:'<path d="M5 12l5 5 9-10"/>', trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>', up:'<path d="M12 19V5M5 12l7-7 7 7"/>', down:'<path d="M12 5v14M5 12l7 7 7-7"/>', ext:'<path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"/>', dl:'<path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v3h16v-3"/>', ul:'<path d="M12 21V9m0 0l-4 4m4-4l4 4M4 7V4h16v3"/>', refresh:'<path d="M21 12a9 9 0 11-3-6.7L21 8M21 3v5h-5"/>', eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>', bolt:'<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>', mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>', grip:'<path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01"/>', undo:'<path d="M9 14L4 9l5-5M4 9h10a6 6 0 010 12h-3"/>'
};
const ic = A.ic = (n, cls) => '<svg class="i ' + (cls || '') + '" viewBox="0 0 24 24">' + (IC[n] || IC.gear) + '</svg>';

/* ---------- toast / modal / drawer / popovers ---------- */
A.toast = function(msg, type){
  const t = document.createElement('div'); t.className = 'toast ' + (type || ''); t.textContent = msg; $('toasts').appendChild(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 320); }, type === 'err' ? 6000 : 3200);
};
A.err = (e, m) => { console.error(e); A.toast((m || 'কাজটা হয়নি') + (e && e.code ? ' (' + e.code + ')' : ''), 'err'); };
A.modal = function(html, acts){
  $('modal').innerHTML = html + '<div class="acts" id="mActs"></div>';
  const box = $('mActs'); (acts || []).forEach(a => { const b = document.createElement('button'); b.className = 'btn ' + (a.cls || ''); b.textContent = a.label; b.onclick = () => { const r = a.fn ? a.fn() : null; if(!a.keep) A.closeModal(); return r; }; box.appendChild(b); });
  $('modal').classList.add('show'); $('scrim').classList.add('show');
  const f = $('modal').querySelector('input,textarea,select'); if(f) setTimeout(() => f.focus(), 80);
};
A.closeModal = () => { $('modal').classList.remove('show'); if(!$('drawer').classList.contains('show') && !$('cmdk').classList.contains('show')) $('scrim').classList.remove('show'); };
A.confirm = (title, msg, ok, cls) => new Promise(res => A.modal('<h3>' + esc(title) + '</h3><p>' + esc(msg || '') + '</p>', [{label:'বাতিল', fn:() => res(false)}, {label:ok || 'নিশ্চিত', cls:cls || 'pri', fn:() => res(true)}]));
A.prompt = (title, msg, val) => new Promise(res => { A.modal('<h3>' + esc(title) + '</h3><p>' + esc(msg || '') + '</p><input type="text" id="pmIn" value="' + esc(val || '') + '">', [{label:'বাতিল', fn:() => res(null)}, {label:'ঠিক আছে', cls:'pri', fn:() => res($('pmIn').value)}]); $('pmIn').onkeydown = e => { if(e.key === 'Enter'){ const v = $('pmIn').value; A.closeModal(); res(v); } }; });
A.drawer = function(title, html, actionsHtml){
  $('drawer').innerHTML = '<div class="drawer-h"><h3>' + title + '</h3>' + (actionsHtml || '') + '<button class="icon-btn" onclick="A.closeDrawer()" aria-label="Close">' + ic('x') + '</button></div><div class="drawer-b" id="drawerB">' + html + '</div>';
  $('drawer').classList.add('show'); $('drawer').setAttribute('aria-hidden', 'false'); $('scrim').classList.add('show');
};
A.closeDrawer = () => { $('drawer').classList.remove('show'); $('drawer').setAttribute('aria-hidden', 'true'); S.drawerUid = null; S.drawerOrder = null; if(!$('modal').classList.contains('show')) $('scrim').classList.remove('show'); };
A.closeAll = () => { A.closeDrawer(); A.closeModal(); A.cmdk(false); document.querySelectorAll('.pop.show').forEach(p => p.classList.remove('show')); $('scrim').classList.remove('show'); };
A.pop = function(id){
  const p = $(id), open = !p.classList.contains('show'); document.querySelectorAll('.pop.show').forEach(x => x.classList.remove('show'));
  if(open){ if(id === 'bellPop') paintBell(); if(id === 'mePop') paintMe(); p.classList.add('show'); }
};
document.addEventListener('click', e => { if(!e.target.closest('.relw')) document.querySelectorAll('.pop.show').forEach(p => p.classList.remove('show')); });

/* ---------- Firebase + auth ---------- */
let db, auth;
A.boot = function(){
  prefsApply();
  try{ firebase.initializeApp(C.firebase); auth = firebase.auth(); db = A.db = firebase.firestore(); }
  catch(e){ show('gDeny'); $('denyMsg').textContent = 'Firebase শুরু করা যায়নি: ' + e.message; return; }
  $('btnGoogle').onclick = () => auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()).catch(e => { $('loginErr').textContent = e.message; });
  $('pinGo').onclick = tryPin; $('pinIn').onkeydown = e => { if(e.key === 'Enter') tryPin(); };
  auth.onAuthStateChanged(u => {
    S.user = u;
    if(!u){ stopData(); show('gLogin'); return; }
    const em = (u.email || '').toLowerCase();
    if(!ADMIN_EMAILS.includes(em)){ show('gDeny'); $('denyMsg').textContent = (u.email || 'এই অ্যাকাউন্ট') + ' ব্যাকএন্ড অ্যাডমিন তালিকায় নেই।'; return; }
    if(sessionStorage.getItem(SKEY) === '1') enter(); else { show('gPin'); $('pinWho').textContent = u.email; setTimeout(() => $('pinIn').focus(), 100); }
  });
  window.addEventListener('hashchange', route);
  document.addEventListener('keydown', e => {
    if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k'){ e.preventDefault(); A.cmdk(true); }
    else if(e.key === 'Escape') A.closeAll();
  });
  $('cmdIn').oninput = () => paintCmd();
  $('cmdIn').onkeydown = cmdKey;
};
function show(id){ ['gLoad','gLogin','gDeny','gPin'].forEach(g => $(g).classList.toggle('hide', g !== id)); $('shell').classList.add('hide'); }
function tryPin(){
  if($('pinIn').value.trim() === PASS){ sessionStorage.setItem(SKEY, '1'); $('pinIn').value = ''; enter(); }
  else { $('pinErr').textContent = 'ভুল পাসকোড'; $('pinIn').value = ''; const c = $('gPin').firstElementChild; c.classList.remove('shake'); void c.offsetWidth; c.classList.add('shake'); }
}
A.signOut = () => { sessionStorage.removeItem(SKEY); auth.signOut(); };
A.lock = () => { sessionStorage.removeItem(SKEY); stopData(); show('gPin'); $('pinWho').textContent = (S.user && S.user.email) || ''; setTimeout(() => $('pinIn').focus(), 100); };

function enter(){
  ['gLoad','gLogin','gDeny','gPin'].forEach(g => $(g).classList.add('hide')); $('shell').classList.remove('hide');
  $('meName').textContent = (S.user.displayName || S.user.email || 'Admin').split(' ')[0];
  $('meAv').innerHTML = S.user.photoURL ? '<img referrerpolicy="no-referrer" src="' + esc(S.user.photoURL) + '" alt="">' : esc((S.user.email || 'A')[0].toUpperCase());
  buildNav(); startData(); route();
}

/* ---------- live data ---------- */
let unsubs = [];
function stopData(){ unsubs.forEach(u => { try{ u(); }catch(e){} }); unsubs = []; }
const refresh = A.debounce(() => { paintBadges(); const p = A.PAGES[S.page]; if(p && !p.editor && !S.typing) paintPage(true); if(S.drawerUid && A.reopenUser) A.reopenUser(true); }, 120);
function listen(key, q, map){
  unsubs.push(q.onSnapshot(snap => { S.loaded[key] = true; delete S.errors[key]; map(snap); refresh(); }, err => { S.loaded[key] = true; S.errors[key] = err.code || err.message; console.warn(key, err); refresh(); }));
}
function startData(){
  stopData();
  listen('orders', db.collection('orders'), s => { S.orders = s.docs.map(d => ({id:d.id, ...d.data()})).sort((a, b) => A.ms(b.createdAt) - A.ms(a.createdAt)); });
  listen('users', db.collection('userDirectory'), s => { S.users = s.docs.map(d => ({uid:d.id, ...d.data()})); });
  listen('reviews', db.collection('reviews'), s => { S.reviews = s.docs.map(d => ({id:d.id, ...d.data()})).sort((a, b) => A.ms(b.createdAt) - A.ms(a.createdAt)); });
  listen('audit', db.collection('adminAudit').orderBy('at', 'desc').limit(400), s => { S.audit = s.docs.map(d => ({id:d.id, ...d.data()})); });
  unsubs.push(db.collection('appConfig').doc('global').onSnapshot(s => { S.loaded.cfg = true; S.cfgSaved = A.merge(A.DEF_CFG, s.exists ? s.data() : {}); if(!S.drafts.cfg || !isDirty('cfg')) S.drafts.cfg = A.clone(S.cfgSaved); refresh(); paintSavebars(); }, e => { S.loaded.cfg = true; S.errors.cfg = e.code; }));
  unsubs.push(db.collection('siteConfig').doc('site').onSnapshot(s => { S.loaded.site = true; S.siteSaved = s.exists ? s.data() : {}; if(!S.drafts.site || !isDirty('site')) S.drafts.site = A.siteDefaults(A.clone(S.siteSaved)); refresh(); paintSavebars(); }, e => { S.loaded.site = true; S.errors.site = e.code; }));
}
S.drafts = {}; S.cfgSaved = A.clone(A.DEF_CFG); S.siteSaved = {};
A.siteDefaults = function(d){
  d.name = d.name || C.name; d.tagline = d.tagline || C.tagline; d.currency = d.currency || C.currency;
  d.support = Object.assign({email:C.support.email}, d.support || {});
  if(!Array.isArray(d.plans) || !d.plans.length) d.plans = C.plans.map(p => Object.assign({active:true}, p));
  d.payment = d.payment || {}; ['bkash','nagad'].forEach(k => { d.payment[k] = Object.assign({enabled:true}, C.payment[k], d.payment[k] || {}); });
  d.landing = d.landing || {}; const L = d.landing;
  ['hero','features','how','pricing','reviews','faq','final','footer','seo','announce','social','sections'].forEach(k => { L[k] = L[k] || {}; });
  L.faq = Array.isArray(L.faq) ? L.faq : []; L.how = Array.isArray(L.how) ? L.how : []; L.planFeatures = Array.isArray(L.planFeatures) ? L.planFeatures : [];
  return d;
};
const saved = k => k === 'cfg' ? S.cfgSaved : A.siteDefaults(A.clone(S.siteSaved));
function isDirty(k){ return JSON.stringify(S.drafts[k] || {}) !== JSON.stringify(saved(k)); }
A.isDirty = isDirty;
S.drafts.cfg = A.clone(A.DEF_CFG); S.drafts.site = A.siteDefaults({});
A.D = k => S.drafts[k];
A.setD = function(scope, path, val){ A.set(S.drafts[scope], path, val); paintSavebars(); };
A.save = async function(scope){
  try{
    if(scope === 'cfg'){
      await db.collection('appConfig').doc('global').set({...S.drafts.cfg, updatedAt:new Date().toISOString(), updatedBy:S.user.email}, {merge:true});
    } else {
      // site config also needs pendingMaxDays mirrored for the public pages
      await db.collection('siteConfig').doc('site').set({...S.drafts.site, updatedAt:new Date().toISOString(), updatedBy:S.user.email});
    }
    A.audit(scope === 'cfg' ? 'config:save' : 'site:save', scope === 'cfg' ? 'appConfig/global' : 'siteConfig/site', '');
    S.cfgSaved = scope === 'cfg' ? A.clone(S.drafts.cfg) : S.cfgSaved; if(scope === 'site') S.siteSaved = A.clone(S.drafts.site);
    paintSavebars(); A.toast('সেভ হয়েছে — লাইভ হয়ে গেছে', 'ok');
    const f = document.getElementById('prevFrame'); if(f) setTimeout(() => { try{ f.contentWindow.sessionStorage.removeItem('jos_cms_reloaded'); }catch(e){} f.contentWindow.location.reload(); }, 600);
  }catch(e){ A.err(e, 'সেভ হয়নি — firestore.rules ডিপ্লয় করেছ?'); }
};
A.discard = function(scope){ S.drafts[scope] = scope === 'cfg' ? A.clone(S.cfgSaved) : A.siteDefaults(A.clone(S.siteSaved)); paintPage(); };
A.savebar = scope => '<div class="savebar" data-sb="' + scope + '"><span class="sbt"></span><span class="sp"></span><button class="btn sm" onclick="A.discard(\'' + scope + '\')">' + ic('undo') + ' Discard</button><button class="btn sm pri" onclick="A.save(\'' + scope + '\')">' + ic('check') + ' Save & publish</button></div>';
function paintSavebars(){ document.querySelectorAll('[data-sb]').forEach(el => { const d = isDirty(el.dataset.sb); el.classList.toggle('dirty', d); el.querySelector('.sbt').innerHTML = d ? '<b style="color:var(--warn)">● Unsaved changes</b>' : '<span class="muted">✓ সব সেভ করা আছে</span>'; }); }
A.paintSavebars = paintSavebars;
A.audit = function(action, target, detail){ return db.collection('adminAudit').add({action, target:target || '', detail:String(detail || '').slice(0, 300), by:S.user.email, at:new Date().toISOString()}).catch(() => {}); };

/* ---------- derived data ---------- */
A.sub = function(uid){
  const now = Date.now(), cap = (S.cfgSaved.pendingMaxDays || 14) * 86400000;
  const os = S.orders.filter(o => o.uid === uid).sort((a, b) => A.ms(a.createdAt) - A.ms(b.createdAt));
  let cursor = 0, cover = null, last = null;
  os.forEach(o => { if(o.status === 'rejected') return; const t = A.ms(o.createdAt); if(o.status !== 'verified' && now - t > cap) return; const st = Math.max(t, cursor); const d = new Date(st); d.setMonth(d.getMonth() + (o.months || 1)); cursor = d.getTime(); last = o; if(!cover && now >= st && now < cursor) cover = o; });
  if(cover) return {status:cover.status === 'verified' ? 'active' : 'pending', until:cursor, orders:os};
  return {status:last ? 'expired' : 'none', until:cursor, orders:os};
};
A.userStatus = function(u){
  const r = Object.assign({}, A.DEF_RESTR, u.restrictions || {});
  if(r.suspended) return 'suspended';
  if(ADMIN_EMAILS.includes((u.email || '').toLowerCase())) return 'admin';
  if(u.complimentary && (!u.complimentaryUntil || Date.parse(u.complimentaryUntil + 'T23:59:59') > Date.now())) return 'comp';
  return A.sub(u.uid).status;
};
A.stBadge = s => ({active:'<span class="badge ok">Pro</span>', pending:'<span class="badge warn">Pending Pro</span>', expired:'<span class="badge mute">Expired</span>', none:'<span class="badge mute">Free</span>', comp:'<span class="badge">Complimentary</span>', admin:'<span class="badge">Admin</span>', suspended:'<span class="badge bad">Suspended</span>', verified:'<span class="badge ok">verified</span>', rejected:'<span class="badge bad">rejected</span>'}[s] || '<span class="badge mute">' + esc(s) + '</span>');

/* ---------- nav / router ---------- */
A.group = (id, label) => A.GROUPS.push({id, label});
A.page = (key, def) => { A.PAGES[key] = Object.assign({key}, def); };
function buildNav(){
  $('nav').innerHTML = A.GROUPS.map(g => '<div class="nav-g">' + esc(g.label) + '</div>' + Object.values(A.PAGES).filter(p => p.group === g.id && !p.hidden).map(p =>
    '<a href="#/' + p.key + '" data-k="' + p.key + '" title="' + esc(p.title) + '">' + ic(p.icon) + '<span>' + esc(p.title) + '</span>' + (p.badge ? '<em class="bd hide" data-bd="' + p.key + '"></em>' : '') + '</a>').join('')).join('');
  $('nav').querySelectorAll('.bd').forEach(b => { b.style.fontStyle = 'normal'; });
}
function paintBadges(){
  const pend = S.orders.filter(o => o.status === 'pending').length, rv = S.reviews.filter(r => !r.approved).length;
  const set = (k, n, w) => { const e = document.querySelector('[data-bd="' + k + '"]'); if(e){ e.textContent = n; e.classList.toggle('hide', !n); e.classList.toggle('warn', !!w); } };
  set('orders', pend, true); set('reviews', rv, true); set('users', S.users.length, false);
  const n = pend + rv; const d = $('bellDot'); d.textContent = n; d.classList.toggle('hide', !n);
}
function route(){
  const h = (location.hash || '#/dashboard').replace(/^#\//, '').split('/'); const k = A.PAGES[h[0]] ? h[0] : 'dashboard';
  S.page = k; S.sub = h[1] || ''; S.typing = false; paintPage(); A.closeAll();
  document.querySelectorAll('#nav a').forEach(a => a.classList.toggle('on', a.dataset.k === k));
  const p = A.PAGES[k]; const g = A.GROUPS.find(x => x.id === p.group); $('crTitle').textContent = p.title; $('crGroup').textContent = g ? g.label : '';
  document.title = p.title + ' · Control Center'; $('shell').classList.remove('open'); window.scrollTo({top:0});
}
function paintPage(keepScroll){
  const p = A.PAGES[S.page]; if(!p) return; const y = window.scrollY;
  if(p.needs && p.needs.some(k => !S.loaded[k])){ $('page').innerHTML = '<div class="grid g4">' + '<div class="card"><div class="skel" style="width:50%"></div><div class="skel" style="margin-top:14px;height:30px"></div></div>'.repeat(4) + '</div>'; return; }
  $('page').innerHTML = p.render(); paintSavebars(); if(p.after) p.after(); if(keepScroll) window.scrollTo({top:y});
}
A.go = (k, sub) => { location.hash = '#/' + k + (sub ? '/' + sub : ''); };
A.repaint = () => paintPage(true);
A.head = (title, sub, actions) => '<div class="ph-h"><div><h1>' + title + '</h1>' + (sub ? '<p>' + sub + '</p>' : '') + '</div><div class="sp"></div><div class="row">' + (actions || '') + '</div></div>';
A.errBanner = keys => { const bad = keys.filter(k => S.errors[k]); return bad.length ? '<div class="card" style="border-color:var(--bad);margin-bottom:16px"><b style="color:var(--bad)">⚠ ডেটা পড়া যায়নি: ' + bad.map(k => esc(k) + ' (' + esc(S.errors[k]) + ')').join(', ') + '</b><div class="sm muted" style="margin-top:4px">firestore.rules নতুন ভার্সনে ডিপ্লয় করা আছে কিনা এবং সাইন-ইন করা ইমেইল অ্যাডমিন তালিকায় আছে কিনা দেখো (System → Health)।</div></div>' : ''; };
A.toggleSide = () => $('shell').classList.toggle('open');
A.toggleMini = () => { const m = $('shell').classList.toggle('mini'); prefSet('mini', m ? 1 : 0); };

/* ---------- form builders (bound to drafts) ---------- */
A.fld = function(label, scope, path, o){
  o = o || {}; const v = A.get(S.drafts[scope], path, o.def != null ? o.def : ''); const on = 'oninput="A.setD(\'' + scope + '\',\'' + path + '\',' + (o.type === 'number' ? 'this.value===\'\'?0:+this.value' : 'this.value') + ')"';
  const id = 'f_' + scope + '_' + path.replace(/\W/g, '_');
  const inp = o.rows ? '<textarea id="' + id + '" rows="' + o.rows + '" placeholder="' + esc(o.ph || '') + '" ' + on + '>' + esc(v) + '</textarea>' : '<input id="' + id + '" type="' + (o.type || 'text') + '" ' + (o.min != null ? 'min="' + o.min + '"' : '') + (o.max != null ? ' max="' + o.max + '"' : '') + ' value="' + esc(v) + '" placeholder="' + esc(o.ph || '') + '" ' + on + '>';
  return '<div class="field"><label for="' + id + '">' + label + '</label>' + inp + (o.hint ? '<span class="hint">' + o.hint + '</span>' : '') + '</div>';
};
A.tog = (scope, path, label, desc, def) => '<div class="srow"><div><div class="t">' + label + '</div>' + (desc ? '<div class="d">' + desc + '</div>' : '') + '</div><label class="sw"><input type="checkbox" ' + (A.get(S.drafts[scope], path, def !== false) ? 'checked' : '') + ' onchange="A.setD(\'' + scope + '\',\'' + path + '\',this.checked)"><i></i></label></div>';
A.selRow = (scope, path, label, desc, opts, def) => '<div class="srow"><div><div class="t">' + label + '</div>' + (desc ? '<div class="d">' + desc + '</div>' : '') + '</div><select onchange="A.setD(\'' + scope + '\',\'' + path + '\',this.value)">' + opts.map(o => { const [v, l] = Array.isArray(o) ? o : [o, o]; return '<option value="' + esc(v) + '" ' + (String(A.get(S.drafts[scope], path, def)) === String(v) ? 'selected' : '') + '>' + esc(l) + '</option>'; }).join('') + '</select></div>';
A.numRow = (scope, path, label, desc, o) => '<div class="srow"><div><div class="t">' + label + '</div>' + (desc ? '<div class="d">' + desc + '</div>' : '') + '</div><input type="number" min="' + ((o && o.min) || 0) + '" ' + (o && o.max ? 'max="' + o.max + '"' : '') + ' value="' + esc(A.get(S.drafts[scope], path, (o && o.def) || 0)) + '" oninput="A.setD(\'' + scope + '\',\'' + path + '\',+this.value||0)" style="max-width:130px"></div>';
A.tabs = (cur, items, fn) => '<div class="tabs" role="tablist">' + items.map(([k, l, n]) => '<button role="tab" class="' + (k === cur ? 'on' : '') + '" onclick="' + fn + '(\'' + k + '\')">' + esc(l) + (n != null ? '<span class="n">' + n + '</span>' : '') + '</button>').join('') + '</div>';
A.badge = (t, c) => '<span class="badge ' + (c || '') + '">' + esc(t) + '</span>';

/* ---------- backend preferences ---------- */
const PK = 'jos_admin_prefs';
function prefs(){ try{ return JSON.parse(localStorage.getItem(PK) || '{}'); }catch(e){ return {}; } }
function prefSet(k, v){ const p = prefs(); p[k] = v; try{ localStorage.setItem(PK, JSON.stringify(p)); }catch(e){} }
A.prefs = prefs; A.prefSet = (k, v) => { prefSet(k, v); prefsApply(); };
function prefsApply(){
  const p = prefs(), r = document.documentElement;
  const t = p.theme || 'dark'; r.setAttribute('data-theme', t === 'system' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : t);
  r.setAttribute('data-dens', p.dens || 'comfortable');
  if(p.a) r.style.setProperty('--a', p.a); else r.style.removeProperty('--a');
  if(p.a2) r.style.setProperty('--a2', p.a2); else r.style.removeProperty('--a2');
  if(p.a){ r.style.setProperty('--asoft', p.a + '22'); r.style.setProperty('--aglow', p.a + '66'); } else { r.style.removeProperty('--asoft'); r.style.removeProperty('--aglow'); }
  const sh = $('shell'); if(sh) sh.classList.toggle('mini', !!p.mini);
}
A.prefsApply = prefsApply;
A.toggleTheme = () => { A.prefSet('theme', document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'); };

/* ---------- popovers content ---------- */
function paintBell(){
  const pend = S.orders.filter(o => o.status === 'pending').slice(0, 5), rv = S.reviews.filter(r => !r.approved).slice(0, 4);
  $('bellPop').style.minWidth = '320px';
  $('bellPop').innerHTML = '<div class="ph">Needs attention</div>' + (!pend.length && !rv.length ? '<div class="ph">সব ঠিক আছে 🎉</div>' : '') +
    pend.map(o => '<button onclick="A.go(\'orders\')">' + ic('card') + '<span><b>' + esc(o.name || o.email) + '</b> · ' + A.money(o.amount) + '<br><span class="sm muted">pending order · ' + A.ago(o.createdAt) + '</span></span></button>').join('') +
    rv.map(r => '<button onclick="A.go(\'reviews\')">' + ic('star') + '<span><b>' + esc(r.name) + '</b> · ' + '★'.repeat(r.rating | 0) + '<br><span class="sm muted">review waiting</span></span></button>').join('');
}
function paintMe(){
  $('mePop').innerHTML = '<div class="ph">' + esc(S.user.email) + '</div><a href="/" target="_blank">' + ic('globe') + ' View website</a><a href="/app/" target="_blank">' + ic('ext') + ' Open app</a><button onclick="A.go(\'prefs\')">' + ic('brush') + ' Backend appearance</button><hr><button onclick="A.lock()">' + ic('shield') + ' Lock now</button><button onclick="A.signOut()">' + ic('x') + ' Sign out</button>';
}

/* ---------- command palette ---------- */
let cmdItems = [], cmdSel = 0;
A.cmdk = function(open){
  const m = $('cmdk'); if(open === false){ m.classList.remove('show'); if(!$('drawer').classList.contains('show') && !$('modal').classList.contains('show')) $('scrim').classList.remove('show'); return; }
  m.classList.add('show'); $('scrim').classList.add('show'); $('cmdIn').value = ''; paintCmd(); setTimeout(() => $('cmdIn').focus(), 60);
};
function cmdList(q){
  const L = []; Object.values(A.PAGES).filter(p => !p.hidden).forEach(p => L.push({t:p.title, s:'Go to page', i:p.icon, f:() => A.go(p.key)}));
  [['Verify all pending orders','check',() => A.verifyAllPending && A.verifyAllPending()],['Export users (CSV)','dl',() => A.exportUsers && A.exportUsers()],['Export orders (CSV)','dl',() => A.exportOrders && A.exportOrders()],
   ['Toggle maintenance mode','bolt',() => { A.go('appcfg', 'access'); }],['Open website','globe',() => window.open('/', '_blank')],['Open app','ext',() => window.open('/app/', '_blank')],['Lock backend','shield',() => A.lock()],['Toggle light/dark','brush',() => A.toggleTheme()]].forEach(([t, i, f]) => L.push({t, s:'Action', i, f}));
  if(q && q.length > 1){ const ql = q.toLowerCase(); S.users.filter(u => (u.email || '').toLowerCase().includes(ql) || (u.name || '').toLowerCase().includes(ql)).slice(0, 5).forEach(u => L.push({t:u.name || u.email, s:'User · ' + (u.email || ''), i:'users', f:() => { A.go('users'); setTimeout(() => A.openUser(u.uid), 80); }}));
    S.orders.filter(o => [o.email, o.name, o.txnId, o.phone].some(x => String(x || '').toLowerCase().includes(ql))).slice(0, 5).forEach(o => L.push({t:(o.name || o.email) + ' · ' + A.money(o.amount), s:'Order · ' + (o.txnId || ''), i:'orders', f:() => { A.go('orders'); setTimeout(() => A.openOrder(o.id), 80); }})); }
  return L.filter(x => !q || (x.t + ' ' + x.s).toLowerCase().includes(q.toLowerCase())).slice(0, 14);
}
function paintCmd(){ cmdItems = cmdList($('cmdIn').value.trim()); cmdSel = 0; renderCmd(); }
function renderCmd(){ $('cmdL').innerHTML = cmdItems.map((x, i) => '<button class="' + (i === cmdSel ? 'sel' : '') + '" onclick="A.runCmd(' + i + ')">' + ic(x.i) + '<span>' + esc(x.t) + '</span><small>' + esc(x.s) + '</small></button>').join('') || '<div class="empty">কিছু পাওয়া যায়নি</div>'; }
A.runCmd = i => { const x = cmdItems[i]; A.cmdk(false); if(x) x.f(); };
function cmdKey(e){ if(e.key === 'ArrowDown'){ e.preventDefault(); cmdSel = Math.min(cmdItems.length - 1, cmdSel + 1); renderCmd(); } else if(e.key === 'ArrowUp'){ e.preventDefault(); cmdSel = Math.max(0, cmdSel - 1); renderCmd(); } else if(e.key === 'Enter'){ e.preventDefault(); A.runCmd(cmdSel); } }

/* ---------- charts ---------- */
A.bars = function(vals, labels, fmt){
  const W = 560, H = 190, p = 26, max = Math.max(1, ...vals), bw = (W - p * 2) / vals.length;
  return '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none"><defs><linearGradient id="bg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--a2)"/><stop offset="1" stop-color="var(--a)"/></linearGradient></defs>' +
    [0, .5, 1].map(f => '<line x1="' + p + '" x2="' + (W - p) + '" y1="' + (H - 24 - f * (H - 50)) + '" y2="' + (H - 24 - f * (H - 50)) + '" stroke="var(--line)"/>').join('') +
    vals.map((v, i) => { const h = v / max * (H - 50); return '<rect class="bar" style="animation-delay:' + i * 40 + 'ms" x="' + (p + i * bw + bw * .18) + '" y="' + (H - 24 - h) + '" width="' + (bw * .64) + '" height="' + Math.max(h, 1) + '" rx="6" fill="url(#bg1)"><title>' + esc(labels[i]) + ': ' + (fmt ? fmt(v) : v) + '</title></rect><text x="' + (p + i * bw + bw / 2) + '" y="' + (H - 8) + '" text-anchor="middle">' + esc(labels[i]) + '</text>'; }).join('') + '</svg>';
};
A.spark = function(vals){
  const W = 560, H = 190, p = 14, max = Math.max(1, ...vals), st = (W - p * 2) / Math.max(1, vals.length - 1);
  const pts = vals.map((v, i) => [p + i * st, H - 26 - v / max * (H - 56)]);
  const d = pts.map((q, i) => (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join(' ');
  return '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none"><defs><linearGradient id="lg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--a)" stop-opacity=".35"/><stop offset="1" stop-color="var(--a)" stop-opacity="0"/></linearGradient></defs><path d="' + d + ' L' + pts[pts.length - 1][0] + ' ' + (H - 26) + ' L' + p + ' ' + (H - 26) + 'Z" fill="url(#lg1)"/><path class="line-a" d="' + d + '" fill="none" stroke="var(--a2)" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/></svg>';
};
A._db = () => db;
})();
