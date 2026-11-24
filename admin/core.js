/* JournalOS Control Center — core: auth, data listeners, router, drafts, UI primitives */
(function(){
'use strict';
const C = window.JOURNALOS_SITE;
const ADMIN_EMAILS = ['ceo.nayeemuhammad@gmail.com'];
const PASS = '12340';
const SKEY = 'journalos.adminUnlocked';
const $ = id => document.getElementById(id);
const A = window.A = { C, PAGES:{}, GROUPS:[], ADMIN_EMAILS, PASS };

/* ---------- state ---------- */
const S = A.S = { user:null, orders:[], users:[], reviews:[], audit:[], admins:[], cfg:{}, site:{}, loaded:{}, errors:{}, page:'dashboard', sub:'' };
A.DEF_CFG = {
  appName:'JournalOS', tagline:'Write First. Everything Else Second.', signupsEnabled:true,
  maintenance:{enabled:false,message:'JournalOS is briefly down for maintenance. Your journals are safe — please check back shortly.'},
  announcement:{enabled:false,text:'',tone:'info'},
  features:{aiAnalysis:true,semanticSearch:true,askYourLife:true,voice:true,voiceTranscription:true,media:true,advancedInsights:true,export:true,books:true},
  defaults:{theme:'system',accent:'brand',dailyReminder:true,dailyReminderTime:'20:00',weeklySummary:true,aiExtraction:true},
  header:{showQuickAdd:true,showAddMood:true,showSearch:true,showThemeMenu:true,showStreak:true,showDownload:true,openOn:'hover',accents:['brand','indigo','rose','emerald']},
  moodLabels:{},moodEmojis:{},entryLimitDefault:0,maxBooks:0,requirePro:true,pendingMaxDays:14,
  announcements:[],
  notifications:{expiryDays:[7,3,1],nudges:true,memories:true,whatsNew:true,milestones:true}
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
  auth.onAuthStateChanged(async u => {
    S.user = u;
    if(!u){ stopData(); show('gLogin'); return; }
    const em = (u.email || '').toLowerCase();
    // Only the owner account (ADMIN_EMAILS) may enter the Control Center.
  S.isSuper = ADMIN_EMAILS.includes(em); const ok = S.isSuper;
  if(!ok){ show('gDeny'); $('denyMsg').textContent = (u.email || 'এই অ্যাকাউন্ট') + ' ব্যাকএন্ড অ্যাডমিন তালিকায় নেই।'; return; }
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
  unsubs.push(db.collection('appConfig').doc('global').onSnapshot(s => { S.loaded.cfg = true; const wasDirty = !!S.drafts.cfg && isDirty('cfg'); S.cfgSaved = A.merge(A.DEF_CFG, s.exists ? s.data() : {}); if(!S.drafts.cfg || !wasDirty) S.drafts.cfg = A.clone(S.cfgSaved); refresh(); paintSavebars(); }, e => { S.loaded.cfg = true; S.errors.cfg = e.code; }));
  unsubs.push(db.collection('siteConfig').doc('site').onSnapshot(s => { S.loaded.site = true; const wasDirty = !!S.drafts.site && isDirty('site'); S.siteSaved = s.exists ? s.data() : {}; if(!S.drafts.site || !wasDirty) S.drafts.site = A.siteDefaults(A.clone(S.siteSaved)); refresh(); paintSavebars(); }, e => { S.loaded.site = true; S.errors.site = e.code; }));
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
  if(ADMIN_EMAILS.includes((u.email || '').toLowerCase())) return 'admin'; if(u.trashed) return 'trashed'; if(r.suspended) return 'suspended';
  if(u.complimentary && (!u.complimentaryUntil || Date.parse(u.complimentaryUntil + 'T23:59:59') > Date.now())) return 'comp';
  return A.sub(u.uid).status;
};
A.ADMIN_EMAILS = ADMIN_EMAILS; A.stBadge = s => ({active:'<span class="badge ok">Pro</span>', pending:'<span class="badge warn">Pending Pro</span>', expired:'<span class="badge mute">Expired</span>', none:'<span class="badge mute">Free</span>', comp:'<span class="badge">Complimentary</span>', admin:'<span class="badge">Admin</span>', trashed:'<span class=\"badge bad\">In Trash</span>', suspended:'<span class="badge bad">Suspended</span>', verified:'<span class="badge ok">verified</span>', rejected:'<span class="badge bad">rejected</span>'}[s] || '<span class="badge mute">' + esc(s) + '</span>');

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

/* JournalOS UI kit — replaces native <select>, <input type=date|time> with themed popovers (bottom sheets on phones).
   Progressive enhancement: the native control stays in the DOM (hidden), so every existing onchange / .value / label keeps working. */
(function(){
  if(window.UK) return; const UK = window.UK = {};
  const SKIP = '[multiple],[data-native],.fmt-size,.uk-native';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const el = (t, c, h) => { const e = document.createElement(t); if(c) e.className = c; if(h != null) e.innerHTML = h; return e; };
  const narrow = () => { try{ return matchMedia('(max-width:640px)').matches; }catch(e){ return false; } };
  const p2 = n => String(n).padStart(2, '0');
  const CARET = '<svg class="uk-car" width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M2 3.5l3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const CALIC = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M8 3v4M16 3v4M3.5 10h17"/></svg>';
  const CLKIC = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
  let pop, scrim, cur = null;

  function ensure(){
    if(pop) return;
    pop = el('div', 'uk-pop'); pop.hidden = true; pop.setAttribute('role', 'dialog');
    scrim = el('div', 'uk-scrim'); scrim.hidden = true; scrim.onclick = close;
    document.body.append(scrim, pop);
    document.addEventListener('click', e => { if(cur && !e.composedPath().some(n => n === pop || n === cur.trig)) close(); });
    document.addEventListener('keydown', e => { if(cur && e.key === 'Escape'){ e.stopPropagation(); const t = cur.trig; close(); t.focus(); } }, true);
    document.addEventListener('scroll', e => { if(cur && !pop.contains(e.target) && !narrow()) close(); }, true);
    addEventListener('resize', place);
  }
  function open(trig, title, body, cls, onClose){
    ensure(); close();
    pop.className = 'uk-pop ' + (cls || ''); pop.innerHTML = ''; 
    const h = el('div', 'uk-ph', `<b>${esc(title)}</b>`); const x = el('button', 'uk-x', '✕'); x.type = 'button'; x.setAttribute('aria-label', 'Close'); x.onclick = () => { close(); trig.focus(); }; h.append(x);
    pop.append(h, body); pop.hidden = false; scrim.hidden = false; cur = {trig, onClose}; trig.setAttribute('aria-expanded', 'true'); place();
  }
  function close(){ if(!cur) return; const c = cur; pop.hidden = true; scrim.hidden = true; c.trig.setAttribute('aria-expanded', 'false'); cur = null; if(c.onClose) c.onClose(); }
  function place(){
    if(!cur) return;
    if(narrow()){ pop.style.left = pop.style.top = ''; return; }
    const r = cur.trig.getBoundingClientRect(); pop.style.minWidth = Math.round(r.width) + 'px';
    const w = pop.offsetWidth, h = pop.offsetHeight; let top = r.bottom + 6;
    if(top + h > innerHeight - 8 && r.top - h - 6 > 8) top = r.top - h - 6;
    pop.style.left = Math.min(Math.max(8, r.left), Math.max(8, innerWidth - w - 8)) + 'px'; pop.style.top = Math.max(8, top) + 'px';
  }
  function wrapProp(node, proto, prop, after){
    const d = Object.getOwnPropertyDescriptor(proto, prop); if(!d || !d.set) return;
    Object.defineProperty(node, prop, { configurable: true, get(){ return d.get.call(node); }, set(v){ d.set.call(node, v); after(); } });
  }
  function fire(node){ node.dispatchEvent(new Event('input', {bubbles: true})); node.dispatchEvent(new Event('change', {bubbles: true})); }
  function makeTrigger(node, icon){
    const b = el('button', 'uk-sel'); b.type = 'button'; b.setAttribute('aria-haspopup', 'dialog'); b.setAttribute('aria-expanded', 'false');
    const lab = node.getAttribute('aria-label') || (node.id && (document.querySelector('label[for="' + node.id + '"]') || {}).textContent) || '';
    b.setAttribute('aria-label', lab || node.title || 'Choose'); b.dataset.title = lab || 'Choose';
    if(node.offsetHeight && node.offsetHeight <= 32) b.classList.add('sm');
    const par = node.parentElement; if(par && par.clientWidth && node.offsetWidth >= par.clientWidth * .9) b.classList.add('block');
    b.style.maxWidth = node.style.maxWidth; b.style.width = node.style.width;
    node.before(b); node.classList.add('uk-hide'); node.tabIndex = -1; node.setAttribute('aria-hidden', 'true');
    node.addEventListener('focus', () => b.focus());
    return b;
  }
  /* ---------- select ---------- */
  function enhanceSelect(s){
    if(s.__uk || s.matches(SKIP) || s.size > 1) return; s.__uk = 1;
    const b = makeTrigger(s);
    const sync = () => { const o = s.options[s.selectedIndex]; b.innerHTML = `<span class="uk-t">${esc(o ? o.text : '')}</span>${CARET}`; b.disabled = s.disabled; b.classList.toggle('ph', !o || o.value === ''); };
    sync(); s.addEventListener('change', sync);
    new MutationObserver(sync).observe(s, {childList: true, subtree: true, attributes: true, attributeFilter: ['disabled', 'label']});
    wrapProp(s, HTMLSelectElement.prototype, 'value', sync); wrapProp(s, HTMLSelectElement.prototype, 'selectedIndex', sync);
    b.onclick = () => cur && cur.trig === b ? close() : openSelect(s, b);
    b.onkeydown = e => { if(e.key === 'ArrowDown' || e.key === 'ArrowUp'){ e.preventDefault(); openSelect(s, b); } };
  }
  function openSelect(s, b){
    const opt = o => `<button type="button" role="option" class="uk-opt${o.selected ? ' on' : ''}" data-i="${o.index}" data-s="${esc(o.text.toLowerCase())}" aria-selected="${o.selected}" ${o.disabled ? 'disabled' : ''}><span>${esc(o.text) || '—'}</span><i class="uk-ck" aria-hidden="true">✓</i></button>`;
    const list = el('div', 'uk-list'); list.setAttribute('role', 'listbox');
    list.innerHTML = [...s.children].map(c => c.tagName === 'OPTGROUP' ? `<div class="uk-grp">${esc(c.label)}</div>` + [...c.children].map(opt).join('') : opt(c)).join('');
    const body = el('div', 'uk-body');
    if(s.options.length > 10){ const f = el('input', 'uk-find'); f.type = 'search'; f.placeholder = 'Search'; f.setAttribute('aria-label', 'Search options'); f.oninput = () => { const q = f.value.toLowerCase(); list.querySelectorAll('.uk-opt').forEach(o => { o.hidden = !!q && !o.dataset.s.includes(q); }); }; body.append(f); }
    body.append(list);
    list.onclick = e => { const o = e.target.closest('.uk-opt'); if(!o) return; s.selectedIndex = +o.dataset.i; fire(s); close(); b.focus(); };
    list.onkeydown = e => {
      const items = [...list.querySelectorAll('.uk-opt:not([hidden]):not([disabled])')], i = items.indexOf(document.activeElement);
      if(e.key === 'ArrowDown'){ e.preventDefault(); (items[i + 1] || items[0]).focus(); } else if(e.key === 'ArrowUp'){ e.preventDefault(); (items[i - 1] || items[items.length - 1]).focus(); }
      else if(e.key === 'Home'){ e.preventDefault(); items[0].focus(); } else if(e.key === 'End'){ e.preventDefault(); items[items.length - 1].focus(); }
    };
    open(b, b.dataset.title, body, 'sel');
    const on = list.querySelector('.uk-opt.on') || list.querySelector('.uk-opt'); if(on){ on.focus({preventScroll: true}); on.scrollIntoView({block: 'nearest'}); }
  }
  /* ---------- date ---------- */
  const fmtD = v => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || ''); return m ? new Intl.DateTimeFormat(undefined, {day: 'numeric', month: 'short', year: 'numeric'}).format(new Date(+m[1], +m[2] - 1, +m[3])) : ''; };
  const todayISO = () => { const t = new Date(); return t.getFullYear() + '-' + p2(t.getMonth() + 1) + '-' + p2(t.getDate()); };
  function enhanceDate(i){
    if(i.__uk || i.matches('[data-native]')) return; i.__uk = 1;
    const b = makeTrigger(i); b.classList.add('uk-date');
    const sync = () => { const t = fmtD(i.value); b.innerHTML = `${CALIC}<span class="uk-t">${esc(t || i.placeholder || 'Select date')}</span>`; b.classList.toggle('ph', !t); b.disabled = i.disabled; };
    sync(); i.addEventListener('change', sync); new MutationObserver(sync).observe(i, {attributes: true, attributeFilter: ['disabled', 'value']}); wrapProp(i, HTMLInputElement.prototype, 'value', sync);
    b.onclick = () => cur && cur.trig === b ? close() : openDate(i, b);
  }
  function openDate(i, b){
    const base = /^\d{4}-\d{2}-\d{2}$/.test(i.value) ? i.value : (i.max && todayISO() > i.max ? i.max : todayISO());
    const st = {y: +base.slice(0, 4), m: +base.slice(5, 7) - 1}, body = el('div', 'uk-body');
    const draw = () => {
      const first = new Date(st.y, st.m, 1).getDay(), n = new Date(st.y, st.m + 1, 0).getDate(), t = todayISO();
      let g = ['S','M','T','W','T','F','S'].map(d => `<i class="uk-wd">${d}</i>`).join('') + '<i></i>'.repeat(first);
      for(let d = 1; d <= n; d++){
        const iso = st.y + '-' + p2(st.m + 1) + '-' + p2(d), dis = (i.min && iso < i.min) || (i.max && iso > i.max);
        g += `<button type="button" class="uk-cd${iso === i.value ? ' sel' : ''}${iso === t ? ' today' : ''}" data-d="${iso}" aria-pressed="${iso === i.value}" ${dis ? 'disabled' : ''}>${d}</button>`;
      }
      body.innerHTML = `<div class="uk-ch"><button type="button" aria-label="Previous year" data-n="-12">«</button><button type="button" aria-label="Previous month" data-n="-1">‹</button><b>${esc(new Intl.DateTimeFormat(undefined, {month: 'long', year: 'numeric'}).format(new Date(st.y, st.m, 1)))}</b><button type="button" aria-label="Next month" data-n="1">›</button><button type="button" aria-label="Next year" data-n="12">»</button></div><div class="uk-cg">${g}</div><div class="uk-cf"><button type="button" data-a="today" ${(i.min && t < i.min) || (i.max && t > i.max) ? 'disabled' : ''}>Today</button>${i.value && !i.required ? '<button type="button" data-a="clear">Clear</button>' : ''}</div>`;
    };
    body.onclick = e => {
      const x = e.target.closest('button'); if(!x || x.disabled) return;
      if(x.dataset.n){ const d = new Date(st.y, st.m + +x.dataset.n, 1); st.y = d.getFullYear(); st.m = d.getMonth(); draw(); return; }
      const v = x.dataset.d || (x.dataset.a === 'today' ? todayISO() : x.dataset.a === 'clear' ? '' : null); if(v === null) return;
      i.value = v; fire(i); close(); b.focus();
    };
    draw(); open(b, b.dataset.title === 'Choose' ? 'Select date' : b.dataset.title, body, 'cal');
    const f = body.querySelector('.uk-cd.sel') || body.querySelector('.uk-cd.today') || body.querySelector('.uk-cd'); if(f) f.focus({preventScroll: true});
  }
  /* ---------- time ---------- */
  const fmtT = v => { const m = /^(\d{2}):(\d{2})/.exec(v || ''); return m ? new Intl.DateTimeFormat(undefined, {hour: 'numeric', minute: '2-digit'}).format(new Date(2000, 0, 1, +m[1], +m[2])) : ''; };
  function enhanceTime(i){
    if(i.__uk || i.matches('[data-native]')) return; i.__uk = 1;
    const b = makeTrigger(i); b.classList.add('uk-date');
    const sync = () => { const t = fmtT(i.value); b.innerHTML = `${CLKIC}<span class="uk-t">${esc(t || 'Select time')}</span>`; b.classList.toggle('ph', !t); b.disabled = i.disabled; };
    sync(); i.addEventListener('change', sync); wrapProp(i, HTMLInputElement.prototype, 'value', sync);
    b.onclick = () => cur && cur.trig === b ? close() : openTime(i, b);
  }
  function openTime(i, b){
    const m = /^(\d{2}):(\d{2})/.exec(i.value || '') || [0, '08', '00'], h24 = +m[1], st = {h: h24 % 12 || 12, mi: +m[2], pm: h24 >= 12};
    const mins = [...new Set([0,5,10,15,20,25,30,35,40,45,50,55, st.mi])].sort((a, c) => a - c), body = el('div', 'uk-body');
    const col = (key, items, on) => `<div class="uk-tc" role="listbox" aria-label="${key}">${items.map(([v, t]) => `<button type="button" role="option" class="uk-tv${on(v) ? ' on' : ''}" data-k="${key}" data-v="${v}" aria-selected="${on(v)}">${t}</button>`).join('')}</div>`;
    const draw = () => { body.innerHTML = `<div class="uk-tw">${col('Hour', Array.from({length: 12}, (_, k) => [k + 1, k + 1]), v => v === st.h)}${col('Minute', mins.map(v => [v, p2(v)]), v => v === st.mi)}${col('Period', [[0, 'AM'], [1, 'PM']], v => !!v === st.pm)}</div><div class="uk-cf"><button type="button" class="uk-done" data-a="done">Done</button></div>`; body.querySelectorAll('.uk-tv.on').forEach(o => o.scrollIntoView({block: 'center'})); };
    body.onclick = e => {
      const x = e.target.closest('button'); if(!x) return;
      if(x.dataset.a === 'done'){ i.value = p2((st.h % 12) + (st.pm ? 12 : 0)) + ':' + p2(st.mi); fire(i); close(); b.focus(); return; }
      const v = +x.dataset.v; if(x.dataset.k === 'Hour') st.h = v; else if(x.dataset.k === 'Minute') st.mi = v; else st.pm = !!v;
      const tops = [...body.querySelectorAll('.uk-tc')].map(c => c.scrollTop); draw(); body.querySelectorAll('.uk-tc').forEach((c, k) => { c.scrollTop = tops[k]; });
    };
    draw(); open(b, b.dataset.title === 'Choose' ? 'Select time' : b.dataset.title, body, 'tim');
  }
  /* ---------- scan ---------- */
  const SEL = 'select,input[type=date],input[type=time]';
  function enhance(n){
    if(n.tagName === 'SELECT') enhanceSelect(n); else if(n.tagName === 'INPUT' && n.type === 'date') enhanceDate(n); else if(n.tagName === 'INPUT' && n.type === 'time') enhanceTime(n);
  }
  function scan(root){ if(root.nodeType !== 1) return; if(root.matches(SEL)) enhance(root); root.querySelectorAll(SEL).forEach(enhance); }

  /* ---------- filter bar engine (one compact bar of pills; each pill opens a popover / bottom sheet) ---------- */
  const IC = UK.ic = {
    date: CALIC, time: CLKIC,
    mood: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8.5 14.5a4.5 4.5 0 007 0M9 9.5h.01M15 9.5h.01"/></svg>',
    tag: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1"/></svg>',
    more: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/></svg>',
    sort: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 4v16M3.5 16.5L7 20l3.5-3.5M17 20V4M13.5 7.5L17 4l3.5 3.5"/></svg>',
    filter: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 5h18l-7 8v6l-4-2v-4z"/></svg>',
    search: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>'
  };
  const FB = UK.fb = {defs: {}, cur: null};
  FB.html = id => {
    const d = FB.defs[id], ps = d.pills(), dirty = d.dirty && d.dirty();
    return `<div class="fb" id="${id}"><div class="fb-in">${d.lead ? d.lead() : ''}<div class="fb-pills">${ps.map(p => `<button type="button" class="fb-pill${p.on ? ' on' : ''}" data-k="${p.k}" ${p.tgl ? `aria-pressed="${!!p.on}" onclick="UK.fb.tgl('${id}','${p.k}')"` : `aria-haspopup="dialog" aria-expanded="false" onclick="UK.fb.toggle('${id}','${p.k}')"`}>${p.ic || ''}<span class="fb-t">${p.t}</span>${p.n ? `<b class="fb-n">${p.n}</b>` : ''}${p.tgl ? '' : CARET}</button>`).join('')}${dirty ? `<button type="button" class="fb-reset" onclick="UK.fb.reset('${id}')">Reset</button>` : ''}${d.meta ? `<span class="fb-meta" role="status">${d.meta()}</span>` : ''}</div></div></div>`;
  };
  FB.search = (ph, val, oninput, attrs) => `<div class="fb-search">${IC.search}<input type="search" ${attrs || ''} value="${esc(val)}" placeholder="${esc(ph)}" aria-label="${esc(ph)}" autocomplete="off" enterkeyhint="search" oninput="${oninput}" oncompositionstart="this.dataset.c='1'" oncompositionend="this.dataset.c='0';${oninput}"></div>`;
  FB.toggle = (id, k) => {
    const bar = document.getElementById(id), t = bar && bar.querySelector('.fb-pill[data-k="' + k + '"]'); if(!t) return;
    if(cur && cur.trig === t){ close(); return; }
    const d = FB.defs[id], body = el('div', 'uk-body'); body.innerHTML = d.pop(k);
    open(t, (d.titles && d.titles[k]) || k, body, 'fbp ' + ((d.cls && d.cls[k]) || ''), () => { FB.cur = null; });
    FB.cur = {id, k};
  };
  FB.tgl = (id, k) => { close(); FB.defs[id].apply(k); };
  FB.reset = id => { close(); FB.defs[id].reset(); };
  FB.pick = btn => { const c = FB.cur; if(!c) return; const d = FB.defs[c.id], k = btn.dataset.k || c.k; if(!btn.dataset.keep) close(); d.apply(k, btn.dataset.v); };
  FB.refresh = id => {
    const bar = document.getElementById(id); if(!bar) return; const was = FB.cur && FB.cur.id === id ? FB.cur.k : null;
    bar.outerHTML = FB.html(id);
    if(was && cur){ const t = document.querySelector('#' + id + ' .fb-pill[data-k="' + was + '"]'), b = pop.querySelector('.uk-body'); if(t && b){ cur.trig = t; t.setAttribute('aria-expanded', 'true'); b.innerHTML = FB.defs[id].pop(was); place(); } }
  };
  const on1 = (v, cv) => String(v) === String(cv);
  FB.opts = (items, cv, k, keep) => `<div class="uk-list" role="menu">${items.map(([v, t, n]) => `<button type="button" role="menuitemradio" aria-checked="${on1(v, cv)}" class="uk-opt${on1(v, cv) ? ' on' : ''}" data-v="${esc(v)}" ${k ? `data-k="${k}"` : ''} ${keep ? 'data-keep="1"' : ''} onclick="UK.fb.pick(this)"><span>${t}</span>${n != null ? `<small class="fb-cnt">${n}</small>` : ''}<i class="uk-ck" aria-hidden="true">✓</i></button>`).join('')}</div>`;
  FB.chips = (items, isOn, k, keep) => `<div class="fb-chips">${items.map(([v, t]) => `<button type="button" class="fb-chip${isOn(v) ? ' on' : ''}" aria-pressed="${!!isOn(v)}" data-v="${esc(v)}" data-k="${k}" ${keep ? 'data-keep="1"' : ''} onclick="UK.fb.pick(this)">${t}</button>`).join('')}</div>`;
  FB.moods = (items, isOn, k) => `<div class="fb-moods">${items.map(([v, e, t]) => `<button type="button" class="fb-mood${isOn(v) ? ' on' : ''}" aria-pressed="${!!isOn(v)}" data-v="${esc(v)}" data-k="${k}" data-keep="1" onclick="UK.fb.pick(this)"><span class="em">${e}</span><span>${esc(t)}</span></button>`).join('')}</div>`;
  FB.sw = (isOn, label, k, v) => `<button type="button" class="uk-opt fb-row" role="switch" aria-checked="${!!isOn}" data-k="${k}" data-v="${v}" data-keep="1" onclick="UK.fb.pick(this)"><span>${label}</span><i class="sw"></i></button>`;
  const rc = {y: 0, m: 0, from: '', to: ''};
  const rcBody = () => {
    const first = new Date(rc.y, rc.m, 1).getDay(), n = new Date(rc.y, rc.m + 1, 0).getDate(), t = todayISO();
    let g = ['S','M','T','W','T','F','S'].map(d => `<i class="uk-wd">${d}</i>`).join('') + '<i></i>'.repeat(first);
    for(let d = 1; d <= n; d++){ const iso = rc.y + '-' + p2(rc.m + 1) + '-' + p2(d), sel = iso === rc.from || iso === rc.to, mid = rc.from && rc.to && iso > rc.from && iso < rc.to; g += `<button type="button" class="uk-cd${sel ? ' sel' : ''}${mid ? ' mid' : ''}${iso === t ? ' today' : ''}" aria-pressed="${sel}" onclick="UK.fb.rcPick('${iso}')">${d}</button>`; }
    return `<div class="uk-ch"><button type="button" aria-label="Previous year" onclick="UK.fb.rcNav(-12)">«</button><button type="button" aria-label="Previous month" onclick="UK.fb.rcNav(-1)">‹</button><b>${esc(new Intl.DateTimeFormat(undefined, {month: 'long', year: 'numeric'}).format(new Date(rc.y, rc.m, 1)))}</b><button type="button" aria-label="Next month" onclick="UK.fb.rcNav(1)">›</button><button type="button" aria-label="Next year" onclick="UK.fb.rcNav(12)">»</button></div><div class="uk-cg">${g}</div><div class="uk-hint" role="status">${rc.from && !rc.to ? 'Now pick the end date' : 'Custom range: pick a start, then an end date'}</div>`;
  };
  FB.range = (from, to) => { const b = /^\d{4}-\d{2}-\d{2}$/.test(from || '') ? from : todayISO(); rc.y = +b.slice(0, 4); rc.m = +b.slice(5, 7) - 1; rc.from = from || ''; rc.to = to || ''; return `<div class="fb-rc">${rcBody()}</div>`; };
  const rcPaint = () => { const e = pop && pop.querySelector('.fb-rc'); if(e) e.innerHTML = rcBody(); };
  FB.rcNav = n => { const d = new Date(rc.y, rc.m + n, 1); rc.y = d.getFullYear(); rc.m = d.getMonth(); rcPaint(); };
  FB.rcPick = iso => {
    if(!rc.from || rc.to){ rc.from = iso; rc.to = ''; rcPaint(); return; }
    const a = iso < rc.from ? iso : rc.from, b = iso < rc.from ? rc.from : iso, c = FB.cur; close(); if(c && FB.defs[c.id].range) FB.defs[c.id].range(a, b);
  };
  UK.scan = scan; UK.close = close; UK.open = open; UK.cur = () => cur;
  function start(){ scan(document.body); new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(scan))).observe(document.body, {childList: true, subtree: true}); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
