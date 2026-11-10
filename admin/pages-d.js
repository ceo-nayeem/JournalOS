/* Control Center pages D: Notifications (broadcasts · direct messages · automatic) and the Admin team */
(function(){
'use strict';
const A = window.A, S = A.S, esc = A.esc, ic = A.ic, $ = A.$;

/* ================= NOTIFICATIONS ================= */
const TONES = [['info', 'Info (নীল)'], ['success', 'Success (সবুজ)'], ['warn', 'Warning (হলুদ)'], ['danger', 'Urgent (লাল)']];
const AUDS = [['all', 'সবাই'], ['pro', 'শুধু Pro / অ্যাক্টিভ'], ['free', 'Pro নেই / মেয়াদ শেষ'], ['admins', 'শুধু অ্যাডমিন']];
const EXPIRY = [['[7,3,1]', '৭, ৩ ও ১ দিন আগে (প্রস্তাবিত)'], ['[14,7,3,1]', '১৪, ৭, ৩ ও ১ দিন আগে'], ['[3,1]', '৩ ও ১ দিন আগে'], ['[1]', 'শুধু ১ দিন আগে'], ['[]', 'কোনো রিমাইন্ডার নয়']];
const NT = [['broadcast', 'Broadcasts'], ['direct', 'Direct message'], ['auto', 'Automatic alerts']];
A.ntTab = t => { S.ntTab = t; A.repaint(); };
const list = () => { const c = A.D('cfg'); if(!Array.isArray(c.announcements)) c.announcements = []; return c.announcements; };

A.page('notify', {title:'Notifications', group:'eng', icon:'bolt', editor:true, needs:['cfg', 'users'], render(){
  const t = S.sub && NT.some(x => x[0] === S.sub) ? S.sub : (S.ntTab || 'broadcast'); S.ntTab = t; let b = '';
  if(t === 'broadcast') b = broadcastHtml();
  if(t === 'direct') b = directHtml();
  if(t === 'auto') b = autoHtml();
  return A.errBanner(['cfg']) + A.head('Notifications', 'ইউজারদের অ্যাপের 🔔 নোটিফিকেশন সেন্টারে মেসেজ পাঠাও — সবাইকে, নির্দিষ্ট গ্রুপকে বা একজনকে।') + A.savebar('cfg') + A.tabs(t, NT, 'A.ntTab') + b;
}});

/* ---- broadcasts (stored in appConfig/global.announcements) ---- */
function broadcastHtml(){
  const L = list();
  const cards = L.map((n, i) => {
    const p = 'announcements.' + i + '.';
    const live = n.active !== false && !(n.expiresAt && Date.parse(n.expiresAt + 'T23:59:59') < Date.now());
    return '<div class="rep"><div class="row" style="justify-content:space-between;margin-bottom:10px"><div class="row"><b>' + esc(n.icon || '🔔') + ' ' + esc(n.title || 'Untitled') + '</b>' +
      (live ? A.badge('Live', 'ok') : A.badge(n.active === false ? 'Paused' : 'Expired', '')) + '<span class="sm muted">· ' + esc((AUDS.find(a => a[0] === (n.audience || 'all')) || AUDS[0])[1]) + '</span></div>' +
      '<div class="row"><button class="btn sm" onclick="A.ntMove(' + i + ',-1)" ' + (i ? '' : 'disabled') + '>' + ic('up') + '</button><button class="btn sm" onclick="A.ntMove(' + i + ',1)" ' + (i < L.length - 1 ? '' : 'disabled') + '>' + ic('down') + '</button>' +
      '<label class="sw" title="Active"><input type="checkbox" ' + (n.active !== false ? 'checked' : '') + ' onchange="A.setD(\'cfg\',\'' + p + 'active\',this.checked);A.repaint()"><i></i></label>' +
      '<button class="btn sm bad" onclick="A.ntDel(' + i + ')">' + ic('trash') + '</button></div></div>' +
      '<div class="two">' + A.fld('Icon (emoji)', 'cfg', p + 'icon', {ph:'🎉'}) + A.fld('Title', 'cfg', p + 'title', {ph:'যেমন: নতুন ফিচার এসেছে'}) + '</div>' +
      A.fld('Message', 'cfg', p + 'body', {rows:3, ph:'ইউজার যা পড়বে'}) +
      '<div class="three"><div class="field"><label>Tone</label><select onchange="A.setD(\'cfg\',\'' + p + 'tone\',this.value)">' + TONES.map(x => '<option value="' + x[0] + '"' + ((n.tone || 'info') === x[0] ? ' selected' : '') + '>' + x[1] + '</option>').join('') + '</select></div>' +
      '<div class="field"><label>কাদের জন্য</label><select onchange="A.setD(\'cfg\',\'' + p + 'audience\',this.value);A.repaint()">' + AUDS.map(x => '<option value="' + x[0] + '"' + ((n.audience || 'all') === x[0] ? ' selected' : '') + '>' + x[1] + '</option>').join('') + '</select></div>' +
      A.fld('মেয়াদ শেষ (ঐচ্ছিক)', 'cfg', p + 'expiresAt', {type:'date', hint:'এই তারিখের পর আর দেখাবে না'}) + '</div>' +
      '<div class="two">' + A.fld('Button label (ঐচ্ছিক)', 'cfg', p + 'linkLabel', {ph:'যেমন: প্ল্যান দেখো'}) + A.fld('Button link (ঐচ্ছিক)', 'cfg', p + 'link', {ph:'/checkout/ অথবা https://…', hint:'শুধু / দিয়ে শুরু বা https://'}) + '</div></div>';
  }).join('');
  return '<div class="row" style="margin:0 0 14px"><button class="btn pri" onclick="A.ntAdd()">' + ic('plus') + ' New broadcast</button><span class="sm muted">সেভ করলে লাইভ — ইউজারের বেল-আইকনে আনরিড ব্যাজ সহ দেখা যাবে।</span></div>' +
    (cards || '<div class="card"><div class="muted">এখনো কোনো ব্রডকাস্ট নেই। "New broadcast" চাপো।</div></div>');
}
A.ntAdd = () => { const L = list().slice(); L.unshift({id:'n' + Date.now().toString(36), icon:'🎉', title:'', body:'', tone:'info', audience:'all', active:true, createdAt:new Date().toISOString()}); A.setD('cfg', 'announcements', L); A.repaint(); };
A.ntDel = async i => { if(!await A.confirm('ব্রডকাস্টটা মুছবে?', 'সেভ করার পর ইউজারদের তালিকা থেকেও চলে যাবে।', 'মুছো', 'bad')) return; const L = list().slice(); L.splice(i, 1); A.setD('cfg', 'announcements', L); A.repaint(); };
A.ntMove = (i, d) => { const L = list().slice(), j = i + d; if(j < 0 || j >= L.length) return; [L[i], L[j]] = [L[j], L[i]]; A.setD('cfg', 'announcements', L); A.repaint(); };

/* ---- direct message (stored in userDirectory/{uid}.inbox — only admins can write it) ---- */
const DM = S.dm = {q:'', uid:'', title:'', body:'', tone:'info', icon:'💬', link:'', linkLabel:''};
function dmUser(){ return S.users.find(u => u.uid === DM.uid); }
function directHtml(){
  const u = dmUser(), q = DM.q.toLowerCase();
  const found = !u && q.length > 1 ? S.users.filter(x => (x.email || '').toLowerCase().includes(q) || (x.name || '').toLowerCase().includes(q)).slice(0, 6) : [];
  const inbox = u && Array.isArray(u.inbox) ? u.inbox.slice().reverse() : [];
  return '<div class="grid g2"><div class="card"><h3>নতুন মেসেজ</h3><div class="sub">একজন নির্দিষ্ট ইউজারকে — সে অ্যাপ খুললেই বেল-আইকনে পাবে।</div>' +
    '<div class="field"><label>ইউজার</label>' + (u ? '<div class="row"><b>' + esc(u.name || u.email) + '</b><span class="sm muted">' + esc(u.email || '') + '</span><button class="btn sm" onclick="A.dmPick(\'\')">বদলাও</button></div>'
      : '<input id="dmQ" type="search" placeholder="ইমেইল বা নাম লিখে খোঁজো…" value="' + esc(DM.q) + '" oninput="A.dmQ(this.value)"><div id="dmFound">' + dmFound(found) + '</div>') + '</div>' +
    '<div class="two"><div class="field"><label>Icon</label><input type="text" value="' + esc(DM.icon) + '" oninput="S_dm(\'icon\',this.value)"></div><div class="field"><label>Tone</label><select onchange="S_dm(\'tone\',this.value)">' + TONES.map(x => '<option value="' + x[0] + '"' + (DM.tone === x[0] ? ' selected' : '') + '>' + x[1] + '</option>').join('') + '</select></div></div>' +
    '<div class="field"><label>Title</label><input type="text" value="' + esc(DM.title) + '" maxlength="80" oninput="S_dm(\'title\',this.value)"></div>' +
    '<div class="field"><label>Message</label><textarea rows="4" maxlength="400" oninput="S_dm(\'body\',this.value)">' + esc(DM.body) + '</textarea></div>' +
    '<div class="two"><div class="field"><label>Button label</label><input type="text" value="' + esc(DM.linkLabel) + '" oninput="S_dm(\'linkLabel\',this.value)"></div><div class="field"><label>Button link</label><input type="text" value="' + esc(DM.link) + '" placeholder="/checkout/" oninput="S_dm(\'link\',this.value)"></div></div>' +
    '<div class="row"><button class="btn pri" onclick="A.dmSend()">' + ic('mail') + ' Send</button></div></div>' +
    '<div class="card"><h3>এই ইউজারের ইনবক্স</h3><div class="sub">' + (u ? 'আগে পাঠানো মেসেজ' : 'আগে ইউজার বেছে নাও') + '</div>' +
    (inbox.length ? inbox.map(m => '<div class="srow"><div><div class="t">' + esc(m.icon || '💬') + ' ' + esc(m.title || '') + '</div><div class="d">' + esc(m.body || '') + ' · ' + A.ago(m.at) + '</div></div><button class="btn sm bad" onclick="A.dmDel(\'' + esc(m.id) + '\')">' + ic('trash') + '</button></div>').join('') : '<div class="muted">কিছু নেই।</div>') + '</div></div>';
}
function dmFound(f){ return f.length ? '<div class="card" style="box-shadow:none;margin-top:6px;padding:6px">' + f.map(x => '<div class="srow" style="cursor:pointer" onclick="A.dmPick(\'' + x.uid + '\')"><div><div class="t">' + esc(x.name || 'Unnamed') + '</div><div class="d">' + esc(x.email || '') + '</div></div></div>').join('') + '</div>' : ''; }
window.S_dm = (k, v) => { DM[k] = v; };
A.dmQ = A.debounce(v => { DM.q = v; const el = $('dmFound'); if(el){ const q = v.toLowerCase(); el.innerHTML = dmFound(q.length > 1 ? S.users.filter(x => (x.email || '').toLowerCase().includes(q) || (x.name || '').toLowerCase().includes(q)).slice(0, 6) : []); } }, 150);
A.dmPick = uid => { DM.uid = uid; DM.q = ''; A.repaint(); };
A.dmSend = async function(){
  const u = dmUser(); if(!u) return A.toast('আগে একজন ইউজার বেছে নাও', 'err');
  if(!DM.title.trim() && !DM.body.trim()) return A.toast('টাইটেল বা মেসেজ লেখো', 'err');
  const link = DM.link.trim(); if(link && !/^(\/[^\/]|https:\/\/)/.test(link)) return A.toast('লিংক / বা https:// দিয়ে শুরু হতে হবে', 'err');
  const m = {id:'m' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), icon:(DM.icon || '💬').slice(0, 4), title:DM.title.trim().slice(0, 80), body:DM.body.trim().slice(0, 400), tone:DM.tone, at:new Date().toISOString(), by:S.user.email};
  if(link){ m.link = link; m.linkLabel = (DM.linkLabel || 'Open').trim().slice(0, 30); }
  try{
    await A._db().collection('userDirectory').doc(u.uid).set({inbox:firebase.firestore.FieldValue.arrayUnion(m)}, {merge:true});
    A.audit('notify:direct', u.email || u.uid, m.title); A.toast('মেসেজ পাঠানো হয়েছে');
    DM.title = ''; DM.body = ''; DM.link = ''; DM.linkLabel = ''; A.repaint();
  }catch(e){ A.err(e, 'পাঠানো যায়নি — firestore.rules ডিপ্লয় করেছ?'); }
};
A.dmDel = async function(id){
  const u = dmUser(); if(!u) return; const m = (u.inbox || []).find(x => x.id === id); if(!m) return;
  try{ await A._db().collection('userDirectory').doc(u.uid).update({inbox:firebase.firestore.FieldValue.arrayRemove(m)}); A.audit('notify:direct-del', u.email || u.uid, m.title); A.toast('মুছে ফেলা হয়েছে'); }
  catch(e){ A.err(e); }
};

/* ---- automatic alerts (appConfig/global.notifications) ---- */
function autoHtml(){
  const cur = JSON.stringify(A.get(A.D('cfg'), 'notifications.expiryDays', [7, 3, 1]));
  return '<div class="card"><h3>অটোমেটিক নোটিফিকেশন</h3><div class="sub">এগুলো ইউজারের ডেটা থেকে নিজে নিজেই তৈরি হয় — কোনো সার্ভার বা খরচ লাগে না। এখানে কোনটা চালু থাকবে ঠিক করো।</div>' +
    '<div class="srow"><div><div class="t">সাবস্ক্রিপশন মেয়াদের রিমাইন্ডার</div><div class="d">Pro শেষ হওয়ার আগে কত দিন আগে জানাবে</div></div><select onchange="A.setD(\'cfg\',\'notifications.expiryDays\',JSON.parse(this.value))">' +
      EXPIRY.map(x => '<option value=\'' + x[0] + '\'' + (x[0] === cur ? ' selected' : '') + '>' + x[1] + '</option>').join('') + '</select></div>' +
    A.tog('cfg', 'notifications.nudges', 'লেখার রিমাইন্ডার', '"আজ এখনো লেখোনি" ও স্ট্রিক হারানোর সতর্কতা', true) +
    A.tog('cfg', 'notifications.memories', 'মেমোরি — "এক বছর আগের আজ"', 'আগের বছরের একই দিনের লেখা মনে করিয়ে দেয়', true) +
    A.tog('cfg', 'notifications.milestones', 'মাইলস্টোন', 'স্ট্রিক ও মোট লেখার মাইলস্টোন (৭ দিন, ১০০ লেখা…)', true) +
    A.tog('cfg', 'notifications.whatsNew', 'নতুন ফিচারের খবর', 'অ্যাপে নতুন কী এল তার ছোট নোট', true) +
    '<div class="sub" style="margin-top:12px">সবসময় চালু (বন্ধ করা যায় না): পেমেন্ট ভেরিফাই/রিজেক্ট, প্ল্যান বদল, মেয়াদ শেষ, অ্যাকাউন্ট রিস্ট্রিকশন ও কমপ্লিমেন্টারি অ্যাক্সেসের খবর।</div></div>';
}

/* ================= ADMIN TEAM ================= */
const TM = S.tm = {email:''};
A.page('team', {title:'Admins', group:'sys', icon:'shield', needs:['admins', 'users'], render(){
  const owners = A.ADMIN_EMAILS, sel = S.admins || [], can = !!S.isSuper;
  const row = (email, kind, extra) => { const u = S.users.find(x => (x.email || '').toLowerCase() === email); return '<div class="srow"><div class="cellu"><div class="av">' + esc((u && u.name || email)[0].toUpperCase()) + '</div><div><div class="t">' + esc(u && u.name ? u.name : email) + ' ' + kind + '</div><div class="d">' + esc(email) + (extra || '') + '</div></div></div>' +
    (kind.indexOf('Owner') > -1 ? '' : (can ? '<button class="btn sm bad" onclick="A.tmDel(\'' + esc(email) + '\')">' + ic('trash') + ' Remove</button>' : '')) + '</div>'; };
  const picks = S.users.filter(u => u.email && !owners.includes(u.email.toLowerCase()) && !sel.some(a => a.email === u.email.toLowerCase())).sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email));
  return A.errBanner(['admins']) + A.head('Admins', 'কে কে ব্যাকএন্ডে ঢুকতে পারবে — শুধু এদের কাছেই অ্যাপের মেনুতে "Go to Backend" দেখাবে।') +
    (can ? '' : '<div class="card" style="border-color:var(--warn);margin-bottom:16px"><b>শুধু দেখার অনুমতি।</b> <span class="muted">নতুন অ্যাডমিন যোগ/বাদ দিতে পারে কেবল Owner অ্যাকাউন্ট।</span></div>') +
    '<div class="grid g2"><div class="card"><h3>Owners</h3><div class="sub">সোর্স কোড ও firestore.rules-এ বাঁধা — এখান থেকে বাদ দেওয়া যায় না</div>' + owners.map(e => row(e, A.badge('Owner', 'ok'))).join('') + '</div>' +
    '<div class="card"><h3>Selected admins <span class="muted sm">(' + sel.length + ')</span></h3><div class="sub">Owner যাদের বাছাই করেছে</div>' +
      (sel.length ? sel.map(a => row(a.email, A.badge('Admin', ''), ' · যোগ হয়েছে ' + A.day(a.addedAt) + (a.addedBy ? ' (' + esc(a.addedBy) + ')' : ''))).join('') : '<div class="muted">এখনো কাউকে বাছাই করা হয়নি।</div>') + '</div></div>' +
    '<div class="card" style="margin-top:16px"><h3>নতুন অ্যাডমিন যোগ করো</h3><div class="sub">তাকে ঐ ইমেইলের Google অ্যাকাউন্টে সাইন-ইন করতে হবে। ব্যাকএন্ডের পাসকোডও তাকে দিতে হবে।</div>' +
    '<div class="row" style="flex-wrap:wrap"><div class="field" style="flex:1;min-width:220px;margin:0"><input id="tmE" type="email" placeholder="name@gmail.com" value="' + esc(TM.email) + '" oninput="A.tmSet(this.value)" ' + (can ? '' : 'disabled') + '></div>' +
    '<button class="btn pri" onclick="A.tmAdd()" ' + (can ? '' : 'disabled') + '>' + ic('plus') + ' Add admin</button></div>' +
    (picks.length ? '<div class="field" style="margin-top:10px"><label>অথবা রেজিস্টার্ড ইউজার থেকে বাছাই করো</label><select onchange="if(this.value){A.tmSet(this.value);A.tmAdd()}" ' + (can ? '' : 'disabled') + '><option value="">— ইউজার বেছে নাও —</option>' + picks.map(u => '<option value="' + esc(u.email) + '">' + esc((u.name || 'Unnamed') + ' — ' + u.email) + '</option>').join('') + '</select></div>' : '') + '</div>';
}});
A.tmSet = v => { TM.email = v; };
A.tmAdd = async function(){
  if(!S.isSuper) return A.toast('শুধু Owner অ্যাডমিন যোগ করতে পারে', 'err');
  const em = (TM.email || '').trim().toLowerCase();
  if(!/^[^\s@\/]+@[^\s@\/]+\.[^\s@\/]+$/.test(em)) return A.toast('সঠিক ইমেইল দাও', 'err');
  if(A.ADMIN_EMAILS.includes(em) || (S.admins || []).some(a => a.email === em)) return A.toast('ইনি আগে থেকেই অ্যাডমিন', 'err');
  if(!await A.confirm(em + ' কে অ্যাডমিন বানাবে?', 'সে ব্যাকএন্ডের সব ডেটা (ইউজার, অর্ডার, কনফিগ) দেখতে ও বদলাতে পারবে।', 'অ্যাডমিন বানাও')) return;
  try{ await A._db().collection('admins').doc(em).set({email:em, addedBy:S.user.email, addedAt:new Date().toISOString()}); A.audit('admin:add', em, ''); TM.email = ''; A.toast('অ্যাডমিন যোগ হয়েছে'); }
  catch(e){ A.err(e, 'যোগ হয়নি — firestore.rules ডিপ্লয় করেছ? (admins কালেকশনের রুল লাগবে)'); }
};
A.tmDel = async function(em){
  if(!S.isSuper) return A.toast('শুধু Owner বাদ দিতে পারে', 'err');
  if(!await A.confirm(em + ' কে অ্যাডমিন থেকে বাদ দেবে?', 'সে আর ব্যাকএন্ডে ঢুকতে পারবে না, অ্যাপের মেনুতেও অপশন দেখবে না।', 'বাদ দাও', 'bad')) return;
  try{ await A._db().collection('admins').doc(em).delete(); A.audit('admin:remove', em, ''); A.toast('বাদ দেওয়া হয়েছে'); }
  catch(e){ A.err(e); }
};
})();
