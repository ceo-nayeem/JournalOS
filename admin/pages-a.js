/* Control Center pages A: Dashboard · Orders · Users · Reviews */
(function(){
'use strict';
const A = window.A, S = A.S, esc = A.esc, ic = A.ic, $ = A.$;
A.group('ov', 'Overview'); A.group('com', 'Commerce'); A.group('ppl', 'People'); A.group('web', 'Website'); A.group('app', 'App & Brand'); A.group('sys', 'Data & System');

/* ================= DASHBOARD ================= */
A.page('dashboard', {title:'Dashboard', group:'ov', icon:'home', needs:['orders','users'], render(){
  const now = Date.now(), D = 86400000, verified = S.orders.filter(o => o.status === 'verified');
  const rev = verified.reduce((s, o) => s + (+o.amount || 0), 0);
  const m0 = new Date(); m0.setDate(1); m0.setHours(0, 0, 0, 0);
  const revMonth = verified.filter(o => A.ms(o.createdAt) >= m0.getTime()).reduce((s, o) => s + (+o.amount || 0), 0);
  const pend = S.orders.filter(o => o.status === 'pending'), pendAmt = pend.reduce((s, o) => s + (+o.amount || 0), 0);
  const new7 = S.users.filter(u => now - A.ms(u.createdAt) < 7 * D).length, active7 = S.users.filter(u => now - A.ms(u.lastSeenAt) < 7 * D).length;
  const stat = S.users.map(u => A.userStatus(u)), pro = stat.filter(s => s === 'active' || s === 'comp').length, pendPro = stat.filter(s => s === 'pending').length;
  const entries = S.users.reduce((s, u) => s + ((u.stats && u.stats.entries) || 0), 0);
  const sign = []; const sl = []; for(let i = 13; i >= 0; i--){ const a = new Date(); a.setHours(0, 0, 0, 0); a.setDate(a.getDate() - i); const b = a.getTime() + D; sign.push(S.users.filter(u => { const t = A.ms(u.createdAt); return t >= a.getTime() && t < b; }).length); sl.push(a.getDate()); }
  const rv = [], rl = []; for(let i = 5; i >= 0; i--){ const a = new Date(); a.setDate(1); a.setHours(0, 0, 0, 0); a.setMonth(a.getMonth() - i); const b = new Date(a); b.setMonth(b.getMonth() + 1); rv.push(verified.filter(o => { const t = A.ms(o.createdAt); return t >= a.getTime() && t < b.getTime(); }).reduce((s, o) => s + (+o.amount || 0), 0)); rl.push(a.toLocaleString('en', {month:'short'})); }
  const c = S.cfgSaved, kpi = (l, v, d, ico, col) => '<div class="card kpi" style="--k:' + (col || 'var(--a)') + '"><div class="l">' + ic(ico) + l + '</div><div class="v">' + v + '</div><div class="d">' + d + '</div></div>';
  const stRow = (l, on, good) => '<div class="srow"><div class="t">' + l + '</div>' + A.badge(on ? 'ON' : 'OFF', on === good ? 'ok' : 'warn') + '</div>';
  return A.errBanner(['orders', 'users', 'reviews']) + A.head('Welcome back 👋', 'আজকের পুরো ছবি এক নজরে — সব ডেটা লাইভ।', '<button class="btn" onclick="A.go(\'orders\')">' + ic('orders') + ' Orders</button><button class="btn pri" onclick="A.go(\'site\')">' + ic('globe') + ' Edit website</button>') +
  '<div class="grid g4">' +
    kpi('Total users', A.num(S.users.length), '+' + new7 + ' this week · ' + active7 + ' active 7d', 'users') +
    kpi('Pro members', A.num(pro), A.num(pendPro) + ' pending-Pro', 'bolt', 'var(--ok)') +
    kpi('Revenue (verified)', A.money(rev), A.money(revMonth) + ' this month', 'card', 'var(--a2)') +
    kpi('Pending orders', A.num(pend.length), A.money(pendAmt) + ' awaiting', 'orders', 'var(--warn)') +
  '</div><div class="grid g-a" style="margin-top:16px">' +
    '<div class="card glow"><h3>Revenue — last 6 months</h3><div class="sub">শুধু verified অর্ডার</div>' + A.bars(rv, rl, A.money) + '</div>' +
    '<div class="card"><h3>System status</h3><div class="sub">লাইভ কনফিগ</div>' + stRow('Maintenance mode', c.maintenance.enabled, false) + stRow('New sign-ups', c.signupsEnabled, true) + stRow('Paywall (require Pro)', c.requirePro, true) + stRow('Announcement banner', c.announcement.enabled, false) +
      '<div class="srow"><div class="t">Journal entries</div><b>' + A.num(entries) + '</b></div></div>' +
  '</div><div class="grid g2" style="margin-top:16px">' +
    '<div class="card"><h3>New sign-ups — last 14 days</h3><div class="sub">দিন অনুযায়ী</div>' + A.bars(sign, sl) + '</div>' +
    '<div class="card"><div class="row"><h3 style="margin:0">Recent orders</h3><span style="flex:1"></span><a href="#/orders">সব দেখো →</a></div><div style="margin-top:8px">' +
      (S.orders.slice(0, 6).map(o => '<div class="list-i"><div class="av">' + esc((o.name || o.email || '?')[0].toUpperCase()) + '</div><div class="sp"><b>' + esc(o.name || o.email) + '</b><div class="sm muted">' + esc(o.planLabel || '') + ' · ' + A.ago(o.createdAt) + '</div></div><b>' + A.money(o.amount) + '</b>' + A.stBadge(o.status) + '</div>').join('') || '<div class="empty">এখনো কোনো অর্ডার নেই</div>') + '</div></div>' +
  '</div><div class="grid g2" style="margin-top:16px">' +
    '<div class="card"><div class="row"><h3 style="margin:0"><span class="pulse"></span> Live activity</h3><span style="flex:1"></span><a href="#/audit">অডিট লগ →</a></div><div style="margin-top:8px">' +
      (S.audit.slice(0, 7).map(a => '<div class="list-i"><div class="sp"><b class="mono sm">' + esc(a.action) + '</b> <span class="muted sm">' + esc(a.target || '') + '</span></div><span class="sm muted">' + A.ago(a.at) + '</span></div>').join('') || '<div class="empty">এখনো কিছু হয়নি</div>') + '</div></div>' +
    '<div class="card"><h3>Quick actions</h3><div class="sub">দ্রুত কাজ</div><div class="row">' +
      '<button class="btn" onclick="A.go(\'appcfg\',\'access\')">' + ic('bolt') + ' Maintenance</button><button class="btn" onclick="A.go(\'plans\')">' + ic('tag') + ' Edit prices</button><button class="btn" onclick="A.go(\'reviews\')">' + ic('star') + ' Reviews (' + S.reviews.filter(r => !r.approved).length + ')</button><button class="btn" onclick="A.exportUsers()">' + ic('dl') + ' Users CSV</button><button class="btn" onclick="A.go(\'brand\')">' + ic('brush') + ' Brand kit</button><button class="btn" onclick="A.go(\'data\')">' + ic('db') + ' Backup</button></div></div>' +
  '</div>';
}});

/* ================= ORDERS ================= */
const OF = S.of = {f:'pending', q:'', m:'all', sel:new Set()};
function ordRows(){
  const q = OF.q.trim().toLowerCase(), cnt = {}; S.orders.forEach(o => { const k = (o.txnId || '').toUpperCase(); if(k) cnt[k] = (cnt[k] || 0) + 1; });
  return S.orders.filter(o => (OF.f === 'all' || o.status === OF.f) && (OF.m === 'all' || o.method === OF.m) && (!q || [o.email, o.name, o.phone, o.txnId, o.senderNumber, o.id, o.planLabel].some(x => String(x || '').toLowerCase().includes(q)))).map(o => Object.assign({}, o, {_dup:cnt[(o.txnId || '').toUpperCase()] > 1}));
}
function ordTable(){
  const rows = ordRows(); if(!rows.length) return '<div class="empty"><b>কিছু নেই</b>' + (S.orders.length ? 'এই ফিল্টারে কোনো অর্ডার নেই।' : 'এখনো কোনো অর্ডার আসেনি।') + '</div>';
  return '<table><thead><tr><th style="width:34px"><input type="checkbox" onchange="A.ordAll(this.checked)"></th><th>Customer</th><th>Plan</th><th>Amount</th><th>Payment</th><th>Status</th><th>When</th><th></th></tr></thead><tbody>' + rows.map(o => '<tr class="clk" onclick="A.openOrder(\'' + o.id + '\')"><td onclick="event.stopPropagation()"><input type="checkbox" ' + (OF.sel.has(o.id) ? 'checked' : '') + ' onchange="A.ordSel(\'' + o.id + '\',this.checked)"></td>' +
    '<td><div class="cellu"><div class="av">' + esc((o.name || o.email || '?')[0].toUpperCase()) + '</div><div><div class="nm">' + esc(o.name || '—') + '</div><div class="em">' + esc(o.email || '') + '</div></div></div></td><td>' + esc(o.planLabel || o.planId || '') + '</td><td><b>' + A.money(o.amount) + '</b></td>' +
    '<td><div>' + esc((o.method || '').toUpperCase()) + ' ' + (o._dup ? '<span class="badge bad">⚠ dup</span>' : '') + '</div><div class="em mono">' + esc(o.txnId || '') + '</div></td><td>' + A.stBadge(o.status) + '</td><td class="sm muted">' + A.ago(o.createdAt) + '</td>' +
    '<td onclick="event.stopPropagation()"><div class="row" style="flex-wrap:nowrap">' + (o.status !== 'verified' ? '<button class="btn sm ok" onclick="A.setOrder(\'' + o.id + '\',\'verified\')">' + ic('check') + '</button>' : '') + (o.status !== 'rejected' ? '<button class="btn sm bad" onclick="A.setOrder(\'' + o.id + '\',\'rejected\')">' + ic('x') + '</button>' : '') + '</div></td></tr>').join('') + '</tbody></table>';
}
A.page('orders', {title:'Orders & payments', group:'com', icon:'orders', badge:true, needs:['orders'], render(){
  const n = s => S.orders.filter(o => o.status === s).length;
  return A.errBanner(['orders']) + A.head('Orders & payments', 'bKash / Nagad পেমেন্ট ভেরিফাই করো। Pending অর্ডারও ইউজারকে Pro অ্যাক্সেস দেয় — তাই দ্রুত যাচাই করো।', '<button class="btn" onclick="A.exportOrders()">' + ic('dl') + ' CSV</button><button class="btn pri" onclick="A.verifyAllPending()">' + ic('check') + ' Verify all pending</button>') +
  A.tabs(OF.f, [['pending', 'Pending', n('pending')], ['verified', 'Verified', n('verified')], ['rejected', 'Rejected', n('rejected')], ['all', 'All', S.orders.length]], 'A.ordF') +
  '<div class="tools" style="margin-top:14px"><div class="search">' + ic('orders') + '<input type="search" placeholder="নাম, ইমেইল, TrxID, ফোন…" value="' + esc(OF.q) + '" oninput="A.ordQ(this.value)"></div><select onchange="A.ordM(this.value)"><option value="all">All methods</option><option value="bkash" ' + (OF.m === 'bkash' ? 'selected' : '') + '>bKash</option><option value="nagad" ' + (OF.m === 'nagad' ? 'selected' : '') + '>Nagad</option></select></div>' +
  '<div class="tbl-w" id="ordT">' + ordTable() + '</div><div id="ordBulk"></div>';
}});
A.ordF = f => { OF.f = f; OF.sel.clear(); A.repaint(); };
A.ordM = m => { OF.m = m; A.repaint(); };
A.ordQ = A.debounce(v => { OF.q = v; $('ordT').innerHTML = ordTable(); }, 150);
A.ordSel = (id, on) => { on ? OF.sel.add(id) : OF.sel.delete(id); bulkBar(); };
A.ordAll = on => { OF.sel.clear(); if(on) ordRows().forEach(o => OF.sel.add(o.id)); $('ordT').innerHTML = ordTable(); bulkBar(); };
function bulkBar(){ const b = $('ordBulk'); if(!b) return; b.innerHTML = OF.sel.size ? '<div class="bulk"><b>' + OF.sel.size + ' selected</b><button class="btn sm ok" onclick="A.bulkOrd(\'verified\')">Verify</button><button class="btn sm bad" onclick="A.bulkOrd(\'rejected\')">Reject</button><button class="btn sm" onclick="A.bulkOrd(\'pending\')">Set pending</button><button class="btn sm" onclick="OF_clear()">Clear</button></div>' : ''; }
window.OF_clear = () => { OF.sel.clear(); A.repaint(); };
A.setOrder = async function(id, status, note){
  const o = S.orders.find(x => x.id === id); if(!o) return;
  if(status === 'rejected' && note == null){ note = await A.prompt('Reject-এর কারণ', 'ইউজার এটা দেখতে পারে (ঐচ্ছিক)', o.note || ''); if(note === null) return; }
  try{ await A._db().collection('orders').doc(id).update({status, note:note != null ? note : (o.note || ''), reviewedBy:S.user.email, reviewedAt:firebase.firestore.FieldValue.serverTimestamp()}); A.audit('order:' + status, o.email || id, (o.planLabel || '') + ' ' + (o.amount || '') + '৳ ' + (o.txnId || '')); A.toast('Order → ' + status, 'ok'); }
  catch(e){ A.err(e, 'আপডেট হয়নি'); }
};
A.bulkOrd = async function(status){
  const ids = [...OF.sel]; let note = '';
  if(status === 'rejected'){ note = await A.prompt('Reject-এর কারণ', ids.length + 'টি অর্ডারের জন্য', ''); if(note === null) return; }
  else if(!await A.confirm(ids.length + 'টি অর্ডার → ' + status, 'নিশ্চিত?', 'হ্যাঁ')) return;
  try{ const b = A._db().batch(); ids.forEach(id => b.update(A._db().collection('orders').doc(id), {status, note, reviewedBy:S.user.email, reviewedAt:firebase.firestore.FieldValue.serverTimestamp()})); await b.commit(); A.audit('order:bulk-' + status, ids.length + ' orders', ''); OF.sel.clear(); A.toast(ids.length + 'টি আপডেট হয়েছে', 'ok'); }
  catch(e){ A.err(e); }
};
A.verifyAllPending = async function(){
  const ids = S.orders.filter(o => o.status === 'pending').map(o => o.id); if(!ids.length) return A.toast('কোনো pending নেই');
  if(!await A.confirm('সব ' + ids.length + 'টা pending verify করবে?', 'শুধু TrxID মিলিয়ে দেখার পরেই এটা করো।', 'সব Verify', 'ok')) return;
  OF.sel = new Set(ids); await A.bulkOrd('verified');
};
A.exportOrders = () => A.csv('orders-' + new Date().toISOString().slice(0, 10) + '.csv', [['id', 'name', 'email', 'phone', 'plan', 'months', 'amount', 'method', 'sender', 'trxid', 'status', 'created', 'note']].concat(S.orders.map(o => [o.id, o.name, o.email, o.phone, o.planLabel, o.months, o.amount, o.method, o.senderNumber, o.txnId, o.status, new Date(A.ms(o.createdAt)).toISOString(), o.note])));
A.openOrder = function(id){
  const o = S.orders.find(x => x.id === id); if(!o) return; S.drawerOrder = id;
  const u = S.users.find(x => x.uid === o.uid), dup = S.orders.filter(x => x.id !== o.id && (x.txnId || '').toUpperCase() === (o.txnId || '').toUpperCase() && o.txnId);
  A.drawer('Order <span class="mono sm muted">' + esc(o.id.slice(0, 8)) + '</span>',
    '<div class="row" style="margin-bottom:16px">' + A.stBadge(o.status) + (dup.length ? '<span class="badge bad">⚠ TrxID ' + (dup.length + 1) + ' বার ব্যবহৃত</span>' : '') + '</div>' +
    '<dl class="kv"><dt>Customer</dt><dd><b>' + esc(o.name) + '</b></dd><dt>Email</dt><dd>' + esc(o.email) + '</dd><dt>Phone</dt><dd>' + esc(o.phone) + '</dd><dt>Plan</dt><dd>' + esc(o.planLabel) + ' · ' + o.months + ' mo</dd><dt>Amount</dt><dd><b>' + A.money(o.amount) + '</b></dd><dt>Method</dt><dd>' + esc((o.method || '').toUpperCase()) + '</dd><dt>Sender no.</dt><dd class="mono">' + esc(o.senderNumber) + '</dd><dt>TrxID</dt><dd class="mono">' + esc(o.txnId) + ' <button class="btn sm" onclick="A.copy(\'' + esc(o.txnId) + '\')">copy</button></dd><dt>Placed</dt><dd>' + A.fmt(o.createdAt) + '</dd>' + (o.reviewedBy ? '<dt>Reviewed</dt><dd>' + esc(o.reviewedBy) + ' · ' + A.fmt(o.reviewedAt) + '</dd>' : '') + (o.note ? '<dt>Note</dt><dd>' + esc(o.note) + '</dd>' : '') + '</dl>' +
    '<div class="row" style="margin:20px 0"><button class="btn ok" onclick="A.setOrder(\'' + id + '\',\'verified\')">' + ic('check') + ' Verify</button><button class="btn bad" onclick="A.setOrder(\'' + id + '\',\'rejected\')">' + ic('x') + ' Reject</button><button class="btn" onclick="A.setOrder(\'' + id + '\',\'pending\')">' + ic('undo') + ' Pending</button></div>' +
    (u ? '<div class="card" style="box-shadow:none"><div class="cellu"><div class="av">' + esc((u.name || u.email || '?')[0].toUpperCase()) + '</div><div class="sp" style="flex:1"><b>' + esc(u.name || u.email) + '</b><div class="sm muted">' + (u.stats ? u.stats.entries + ' entries' : '') + ' · last seen ' + A.ago(u.lastSeenAt) + '</div></div><button class="btn sm" onclick="A.openUser(\'' + u.uid + '\')">Open user</button></div></div>' : '') +
    '<div class="row" style="margin-top:20px"><button class="btn bad sm" onclick="A.delOrder(\'' + id + '\')">' + ic('trash') + ' Delete order</button></div>');
};
A.delOrder = async function(id){ if(!await A.confirm('অর্ডার মুছবে?', 'এটা আর ফেরত আনা যাবে না। ইউজারের Pro মেয়াদ থেকেও এই অর্ডার বাদ যাবে।', 'মুছে ফেলো', 'bad')) return; try{ await A._db().collection('orders').doc(id).delete(); A.audit('order:delete', id, ''); A.closeDrawer(); A.toast('মোছা হয়েছে', 'ok'); }catch(e){ A.err(e); } };

/* ================= USERS ================= */
const UF = S.uf = {q:'', st:'all', sort:'recent', sel:new Set(), page:0};
const PER = 25;
function userRows(){
  const q = UF.q.trim().toLowerCase();
  let r = S.users.map(u => Object.assign({}, u, {_st:A.userStatus(u)})).filter(u => {
    if(q && ![u.email, u.name, u.uid, u.note, (u.tags || []).join(' ')].some(x => String(x || '').toLowerCase().includes(q))) return false;
    if(UF.st === 'all') return true; if(UF.st === 'restricted') return Object.entries(Object.assign({}, A.DEF_RESTR, u.restrictions || {})).some(([k, v]) => v && v !== 0 && k !== 'entryLimit') || (u.restrictions && u.restrictions.entryLimit > 0);
    if(UF.st === 'pro') return u._st === 'active' || u._st === 'comp'; if(UF.st === 'tagged') return (u.tags || []).length > 0; return u._st === UF.st;
  });
  const key = {recent:u => -A.ms(u.createdAt), seen:u => -A.ms(u.lastSeenAt), entries:u => -((u.stats && u.stats.entries) || 0), name:u => (u.name || u.email || '').toLowerCase()}[UF.sort];
  return r.sort((a, b) => key(a) > key(b) ? 1 : key(a) < key(b) ? -1 : 0);
}
function userTable(){
  const all = userRows(), pages = Math.max(1, Math.ceil(all.length / PER)); UF.page = Math.min(UF.page, pages - 1); const rows = all.slice(UF.page * PER, UF.page * PER + PER);
  if(!rows.length) return '<div class="empty"><b>কোনো ইউজার নেই</b>ফিল্টার বদলে দেখো।</div>';
  return '<table><thead><tr><th style="width:34px"><input type="checkbox" onchange="A.usrAll(this.checked)"></th><th>User</th><th>Plan</th><th>Entries</th><th>Last seen</th><th>Joined</th><th>Flags</th></tr></thead><tbody>' + rows.map(u => {
    const r = Object.assign({}, A.DEF_RESTR, u.restrictions || {}), fl = []; if(r.readOnly) fl.push('read-only'); if(r.aiDisabled) fl.push('no-AI'); if(r.mediaDisabled) fl.push('no-media'); if(r.exportDisabled) fl.push('no-export'); if(r.entryLimit) fl.push('cap ' + r.entryLimit); if(u.role && u.role !== 'user') fl.push(u.role);
    return '<tr class="clk" onclick="A.openUser(\'' + u.uid + '\')"><td onclick="event.stopPropagation()"><input type="checkbox" ' + (UF.sel.has(u.uid) ? 'checked' : '') + ' onchange="A.usrSel(\'' + u.uid + '\',this.checked)"></td><td><div class="cellu"><div class="av">' + (u.photoURL ? '<img referrerpolicy="no-referrer" src="' + esc(u.photoURL) + '" alt="">' : esc((u.name || u.email || '?')[0].toUpperCase())) + '</div><div style="min-width:0"><div class="nm">' + esc(u.name || 'Unnamed') + '</div><div class="em">' + esc(u.email || '') + '</div></div></div></td><td>' + A.stBadge(u._st) + '</td><td>' + A.num((u.stats && u.stats.entries) || 0) + '</td><td class="sm muted">' + A.ago(u.lastSeenAt) + '</td><td class="sm muted">' + A.day(u.createdAt) + '</td><td>' + fl.map(f => '<span class="badge warn">' + esc(f) + '</span> ').join('') + (u.tags || []).map(t => '<span class="badge">#' + esc(t) + '</span> ').join('') + '</td></tr>'; }).join('') + '</tbody></table>' +
    '<div class="pager"><span>' + all.length + ' users · page ' + (UF.page + 1) + '/' + pages + '</span><span class="row"><button class="btn sm" ' + (UF.page ? '' : 'disabled') + ' onclick="A.usrPg(-1)">←</button><button class="btn sm" ' + (UF.page < pages - 1 ? '' : 'disabled') + ' onclick="A.usrPg(1)">→</button></span></div>';
}
A.page('users', {title:'Users', group:'ppl', icon:'users', badge:true, needs:['users'], render(){
  const c = k => S.users.filter(u => { const s = A.userStatus(u); return k === 'pro' ? (s === 'active' || s === 'comp') : s === k; }).length;
  return A.errBanner(['users']) + A.head('User management', 'প্রতিটা ইউজারের অ্যাক্সেস, সীমা, Pro, রোল, ট্যাগ ও নোট — সব এখান থেকে।', '<button class="btn" onclick="A.exportUsers()">' + ic('dl') + ' CSV</button><button class="btn" onclick="A.copy(location.origin+\'/checkout/\')">' + ic('ext') + ' Copy signup link</button>') +
  A.tabs(UF.st, [['all', 'All', S.users.length], ['pro', 'Pro', c('pro')], ['pending', 'Pending', c('pending')], ['none', 'Free', c('none')], ['expired', 'Expired', c('expired')], ['suspended', 'Suspended', c('suspended')], ['restricted', 'Restricted'], ['tagged', 'Tagged']], 'A.usrF') +
  '<div class="tools" style="margin-top:14px"><div class="search">' + ic('users') + '<input type="search" placeholder="নাম, ইমেইল, UID, ট্যাগ, নোট…" value="' + esc(UF.q) + '" oninput="A.usrQ(this.value)"></div><select onchange="A.usrS(this.value)"><option value="recent">Newest</option><option value="seen" ' + (UF.sort === 'seen' ? 'selected' : '') + '>Last seen</option><option value="entries" ' + (UF.sort === 'entries' ? 'selected' : '') + '>Most entries</option><option value="name" ' + (UF.sort === 'name' ? 'selected' : '') + '>Name</option></select></div>' +
  '<div class="tbl-w" id="usrT">' + userTable() + '</div><div id="usrBulk"></div>';
}});
A.usrF = f => { UF.st = f; UF.page = 0; UF.sel.clear(); A.repaint(); };
A.usrS = s => { UF.sort = s; A.repaint(); };
A.usrQ = A.debounce(v => { UF.q = v; UF.page = 0; $('usrT').innerHTML = userTable(); }, 150);
A.usrPg = d => { UF.page += d; $('usrT').innerHTML = userTable(); };
A.usrSel = (id, on) => { on ? UF.sel.add(id) : UF.sel.delete(id); ubulk(); };
A.usrAll = on => { UF.sel.clear(); if(on) userRows().slice(UF.page * PER, UF.page * PER + PER).forEach(u => UF.sel.add(u.uid)); $('usrT').innerHTML = userTable(); ubulk(); };
function ubulk(){ const b = $('usrBulk'); if(!b) return; b.innerHTML = UF.sel.size ? '<div class="bulk"><b>' + UF.sel.size + ' selected</b><button class="btn sm" onclick="A.bulkUsr(\'suspend\')">Suspend</button><button class="btn sm" onclick="A.bulkUsr(\'unsuspend\')">Unsuspend</button><button class="btn sm" onclick="A.bulkUsr(\'comp\')">Give Pro (30d)</button><button class="btn sm" onclick="A.bulkUsr(\'readonly\')">Read-only</button><button class="btn sm" onclick="A.bulkUsr(\'reset\')">Reset limits</button><button class="btn sm" onclick="A.bulkUsr(\'tag\')">+ Tag</button></div>' : ''; }
A.bulkUsr = async function(act){
  const ids = [...UF.sel]; let tag = ''; if(act === 'tag'){ tag = (await A.prompt('ট্যাগ', 'সবার জন্য যোগ হবে', '') || '').trim(); if(!tag) return; } else if(!await A.confirm(ids.length + ' জন ইউজার → ' + act, 'নিশ্চিত?', 'হ্যাঁ')) return;
  try{
    const b = A._db().batch();
    ids.forEach(uid => { const u = S.users.find(x => x.uid === uid) || {}, r = Object.assign({}, A.DEF_RESTR, u.restrictions || {}); let p = {};
      if(act === 'suspend') p = {restrictions:Object.assign(r, {suspended:true})}; if(act === 'unsuspend') p = {restrictions:Object.assign(r, {suspended:false})}; if(act === 'readonly') p = {restrictions:Object.assign(r, {readOnly:true})}; if(act === 'reset') p = {restrictions:Object.assign({}, A.DEF_RESTR)};
      if(act === 'comp') p = {complimentary:true, complimentaryUntil:new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)}; if(act === 'tag') p = {tags:[...new Set((u.tags || []).concat(tag))]};
      b.set(A._db().collection('userDirectory').doc(uid), p, {merge:true}); });
    await b.commit(); A.audit('user:bulk-' + act, ids.length + ' users', tag); UF.sel.clear(); A.toast('হয়েছে', 'ok'); A.repaint();
  }catch(e){ A.err(e); }
};
A.exportUsers = () => A.csv('users-' + new Date().toISOString().slice(0, 10) + '.csv', [['uid', 'name', 'email', 'status', 'role', 'entries', 'words', 'sign_ins', 'joined', 'last_seen', 'tags', 'note']].concat(S.users.map(u => [u.uid, u.name, u.email, A.userStatus(u), u.role || 'user', u.stats && u.stats.entries, u.stats && u.stats.words, u.signInCount, u.createdAt, u.lastSeenAt, (u.tags || []).join('|'), u.note])));

function userHtml(u){
  const r = Object.assign({}, A.DEF_RESTR, u.restrictions || {}), st = A.userStatus(u), sub = A.sub(u.uid), id = esc(u.uid);
  const T = (k, l, d) => '<div class="srow"><div><div class="t">' + l + '</div><div class="d">' + d + '</div></div><label class="sw"><input type="checkbox" ' + (r[k] ? 'checked' : '') + ' onchange="A.uRestr(\'' + id + '\',\'' + k + '\',this.checked)"><i></i></label></div>';
  return '<div class="cellu" style="margin-bottom:16px"><div class="av" style="width:56px;height:56px;font-size:20px">' + (u.photoURL ? '<img referrerpolicy="no-referrer" src="' + esc(u.photoURL) + '" alt="">' : esc((u.name || u.email || '?')[0].toUpperCase())) + '</div><div><h3 style="font-size:18px">' + esc(u.name || 'Unnamed') + '</h3><div class="muted">' + esc(u.email || '') + '</div><div class="mono sm muted">' + id + '</div></div></div>' +
  '<div class="row" style="margin-bottom:16px">' + A.stBadge(st) + (sub.until && sub.status !== 'none' ? '<span class="badge mute">Pro until ' + A.day(sub.until) + '</span>' : '') + '</div>' +
  '<div class="grid g3" style="gap:10px;margin-bottom:18px">' + [['Entries', (u.stats && u.stats.entries) || 0], ['Words', A.num(u.stats && u.stats.words)], ['Sign-ins', u.signInCount || 0]].map(x => '<div class="card" style="padding:12px;box-shadow:none"><div class="muted sm">' + x[0] + '</div><b style="font-size:20px">' + x[1] + '</b></div>').join('') + '</div>' +
  '<dl class="kv" style="margin-bottom:18px"><dt>Joined</dt><dd>' + A.fmt(u.createdAt) + '</dd><dt>Last seen</dt><dd>' + A.fmt(u.lastSeenAt) + '</dd></dl>' +
  '<h4 style="margin:6px 0">Pro access</h4><div class="srow"><div><div class="t">Complimentary Pro</div><div class="d">পেমেন্ট ছাড়াই Pro (গিফট / পুরনো ইউজার)</div></div><label class="sw"><input type="checkbox" ' + (u.complimentary ? 'checked' : '') + ' onchange="A.uField(\'' + id + '\',\'complimentary\',this.checked)"><i></i></label></div>' +
  '<div class="srow"><div><div class="t">Valid until</div><div class="d">খালি = মেয়াদ নেই</div></div><div class="row"><input type="date" value="' + esc(u.complimentaryUntil || '') + '" onchange="A.uField(\'' + id + '\',\'complimentaryUntil\',this.value)"><button class="btn sm" onclick="A.uComp(\'' + id + '\',30)">+30d</button><button class="btn sm" onclick="A.uComp(\'' + id + '\',365)">+1y</button></div></div>' +
  '<h4 style="margin:18px 0 6px">Restrictions</h4>' + T('suspended', 'Suspend account', 'অ্যাপ পুরো বন্ধ, শুধু নোটিশ দেখবে') + T('readOnly', 'Read-only', 'পড়তে পারবে, লিখতে/মুছতে পারবে না') + T('aiDisabled', 'Disable AI', 'Gemini, semantic search, Ask Your Life বন্ধ') + T('mediaDisabled', 'Disable media', 'ছবি/অডিও/ভিডিও ও ভয়েস বন্ধ') + T('exportDisabled', 'Disable export', 'ডেটা এক্সপোর্ট বন্ধ') +
  '<div class="srow"><div><div class="t">Entry limit</div><div class="d">0 = সীমাহীন</div></div><input type="number" min="0" value="' + (r.entryLimit || 0) + '" style="max-width:110px" onchange="A.uRestr(\'' + id + '\',\'entryLimit\',Math.max(0,parseInt(this.value,10)||0))"></div>' +
  '<h4 style="margin:18px 0 6px">Role & tags</h4><div class="srow"><div><div class="t">Role label</div></div><select onchange="A.uField(\'' + id + '\',\'role\',this.value)">' + ['user', 'moderator', 'admin', 'tester', 'vip'].map(x => '<option ' + ((u.role || 'user') === x ? 'selected' : '') + '>' + x + '</option>').join('') + '</select></div>' +
  '<div style="margin:8px 0">' + (u.tags || []).map((t, i) => '<span class="chip">#' + esc(t) + '<button onclick="A.uTagDel(\'' + id + '\',' + i + ')">×</button></span>').join('') + '<button class="btn sm" onclick="A.uTagAdd(\'' + id + '\')">' + ic('plus') + ' tag</button></div>' +
  '<div class="field" style="margin-top:12px"><label>Internal note</label><textarea rows="3" placeholder="শুধু অ্যাডমিন দেখবে…" onchange="A.uField(\'' + id + '\',\'note\',this.value)">' + esc(u.note || '') + '</textarea></div>' +
  '<h4 style="margin:18px 0 6px">Orders (' + sub.orders.length + ')</h4>' + (sub.orders.map(o => '<div class="list-i"><div class="sp"><b>' + esc(o.planLabel) + '</b> · ' + A.money(o.amount) + '<div class="sm muted">' + A.fmt(o.createdAt) + '</div></div>' + A.stBadge(o.status) + '<button class="btn sm" onclick="A.openOrder(\'' + o.id + '\')">open</button></div>').join('') || '<div class="muted sm">কোনো অর্ডার নেই</div>') +
  '<div class="row" style="margin-top:22px"><button class="btn sm" onclick="A.uReset(\'' + id + '\')">' + ic('undo') + ' Reset restrictions</button><button class="btn sm" onclick="A.uPeek(\'' + id + '\')">' + ic('eye') + ' Inspect data</button><button class="btn sm bad" onclick="A.uRemove(\'' + id + '\')">' + ic('trash') + ' Remove</button></div><div id="peekBox" style="margin-top:16px"></div>';
}
A.openUser = function(uid){ const u = S.users.find(x => x.uid === uid); if(!u) return; S.drawerUid = uid; A.drawer(esc(u.name || u.email || 'User'), userHtml(u)); };
A.reopenUser = function(){ const u = S.users.find(x => x.uid === S.drawerUid); const b = $('drawerB'); if(u && b){ const y = b.scrollTop, pk = $('peekBox') ? $('peekBox').innerHTML : ''; b.innerHTML = userHtml(u); b.scrollTop = y; if($('peekBox')) $('peekBox').innerHTML = pk; } };
const uref = uid => A._db().collection('userDirectory').doc(uid);
A.uRestr = async function(uid, k, v){ const u = S.users.find(x => x.uid === uid) || {}; try{ await uref(uid).set({restrictions:Object.assign({}, A.DEF_RESTR, u.restrictions || {}, {[k]:v}), restrictedAt:new Date().toISOString(), restrictedBy:S.user.email}, {merge:true}); A.audit('restriction:' + k, u.email || uid, String(v)); A.toast('Saved', 'ok'); }catch(e){ A.err(e); } };
A.uField = async function(uid, f, v){ const u = S.users.find(x => x.uid === uid) || {}; try{ await uref(uid).set({[f]:v}, {merge:true}); A.audit('user:' + f, u.email || uid, String(v).slice(0, 100)); A.toast('Saved', 'ok'); }catch(e){ A.err(e); } };
A.uComp = async function(uid, days){ const u = S.users.find(x => x.uid === uid) || {}; const base = Math.max(Date.now(), u.complimentaryUntil ? Date.parse(u.complimentaryUntil) : 0); try{ await uref(uid).set({complimentary:true, complimentaryUntil:new Date(base + days * 86400000).toISOString().slice(0, 10)}, {merge:true}); A.audit('user:grant-pro', u.email || uid, '+' + days + 'd'); A.toast('Pro দেওয়া হয়েছে', 'ok'); }catch(e){ A.err(e); } };
A.uTagAdd = async function(uid){ const t = (await A.prompt('নতুন ট্যাগ', 'যেমন: beta, vip, tester', '') || '').trim().replace(/^#/, ''); if(!t) return; const u = S.users.find(x => x.uid === uid) || {}; A.uField(uid, 'tags', [...new Set((u.tags || []).concat(t))]); };
A.uTagDel = function(uid, i){ const u = S.users.find(x => x.uid === uid) || {}; const t = (u.tags || []).slice(); t.splice(i, 1); A.uField(uid, 'tags', t); };
A.uReset = async function(uid){ if(!await A.confirm('সব রেস্ট্রিকশন তুলে নেবে?', 'ইউজার আবার পুরো অ্যাপ ব্যবহার করতে পারবে।', 'রিসেট')) return; try{ await uref(uid).set({restrictions:Object.assign({}, A.DEF_RESTR)}, {merge:true}); A.audit('restriction:reset', uid, ''); A.toast('Reset', 'ok'); }catch(e){ A.err(e); } };
A.uRemove = async function(uid){ if(!await A.confirm('ডিরেক্টরি থেকে সরাবে?', 'শুধু এই তালিকার সারি মুছবে — ইউজারের জার্নাল ডেটা মুছবে না। পরের সাইন-ইনে সে আবার যোগ হবে।', 'সরাও', 'bad')) return; try{ await uref(uid).delete(); A.audit('user:remove-row', uid, ''); A.closeDrawer(); A.toast('সরানো হয়েছে', 'ok'); }catch(e){ A.err(e); } };
A.uPeek = async function(uid){
  const box = $('peekBox'); box.innerHTML = '<div class="skel"></div>';
  try{ const base = A._db().collection('users').doc(uid); const [doc, en, me] = await Promise.all([base.get(), base.collection('entries').orderBy('date', 'desc').limit(25).get(), base.collection('media').limit(20).get()]);
    box.innerHTML = '<div class="card" style="box-shadow:none"><b>Stored data</b><div class="sm muted">entries (latest 25 shown) · media ' + me.size + (me.size >= 20 ? '+' : '') + '</div>' + en.docs.map(d => { const e = d.data(); return '<div class="list-i"><div class="sp"><b>' + esc(e.title || '(no title)') + '</b><div class="sm muted">' + esc(e.date || '') + ' · ' + esc(e.mood || '') + (e.archived ? ' · archived' : '') + '</div></div></div>'; }).join('') + '<div class="sm muted" style="margin-top:8px">Settings keys: ' + esc(Object.keys((doc.exists && doc.data().settings) || {}).join(', ') || '—') + '</div></div>';
  }catch(e){ box.innerHTML = '<div class="badge bad">পড়া যায়নি: ' + esc(e.code || e.message) + ' — firestore.rules-এ অ্যাডমিন read আছে কিনা দেখো</div>'; }
};

/* ================= REVIEWS ================= */
const RF = S.rf = {f:'pending'};
A.page('reviews', {title:'Reviews', group:'ppl', icon:'star', badge:true, needs:['reviews'], render(){
  const list = S.reviews.filter(r => RF.f === 'all' || (RF.f === 'pending' ? !r.approved : r.approved));
  return A.errBanner(['reviews']) + A.head('Reviews & testimonials', 'ল্যান্ডিং পেজে শুধু Published রিভিউ দেখায়।', '<button class="btn pri" onclick="A.addReview()">' + ic('plus') + ' Add testimonial</button>') +
  A.tabs(RF.f, [['pending', 'Waiting', S.reviews.filter(r => !r.approved).length], ['published', 'Published', S.reviews.filter(r => r.approved).length], ['all', 'All', S.reviews.length]], 'A.rvF') +
  '<div class="grid g2" style="margin-top:16px">' + (list.map(r => '<div class="card"><div class="row"><b style="color:var(--warn);letter-spacing:2px">' + '★'.repeat(r.rating | 0) + '<span style="opacity:.25">' + '★'.repeat(5 - (r.rating | 0)) + '</span></b><span style="flex:1"></span>' + (r.approved ? A.badge('Published', 'ok') : A.badge('Waiting', 'warn')) + '</div><p style="margin:10px 0">' + esc(r.text) + '</p><div class="row"><span class="sm muted">— ' + esc(r.name) + ' · ' + A.ago(r.createdAt) + '</span><span style="flex:1"></span>' +
    (r.approved ? '<button class="btn sm" onclick="A.rvSet(\'' + r.id + '\',false)">Unpublish</button>' : '<button class="btn sm ok" onclick="A.rvSet(\'' + r.id + '\',true)">' + ic('check') + ' Publish</button>') + '<button class="btn sm" onclick="A.rvEdit(\'' + r.id + '\')">Edit</button><button class="btn sm bad" onclick="A.rvDel(\'' + r.id + '\')">' + ic('trash') + '</button></div></div>').join('') || '<div class="card empty" style="grid-column:1/-1"><b>কিছু নেই</b>এখানে রিভিউ আসবে।</div>') + '</div>';
}});
A.rvF = f => { RF.f = f; A.repaint(); };
A.rvSet = async function(id, v){ try{ await A._db().collection('reviews').doc(id).update({approved:v}); A.audit(v ? 'review:publish' : 'review:unpublish', id, ''); A.toast(v ? 'Published' : 'Unpublished', 'ok'); }catch(e){ A.err(e); } };
A.rvDel = async function(id){ if(!await A.confirm('রিভিউ মুছবে?', '', 'মুছো', 'bad')) return; try{ await A._db().collection('reviews').doc(id).delete(); A.audit('review:delete', id, ''); A.toast('মোছা হয়েছে', 'ok'); }catch(e){ A.err(e); } };
A.rvEdit = function(id){ const r = S.reviews.find(x => x.id === id); if(!r) return; A.modal('<h3>Edit review</h3><div class="field"><label>Name</label><input id="rvN" value="' + esc(r.name) + '" maxlength="40"></div><div class="field"><label>Rating</label><select id="rvR">' + [5, 4, 3, 2, 1].map(n => '<option ' + (n === r.rating ? 'selected' : '') + '>' + n + '</option>').join('') + '</select></div><div class="field"><label>Text</label><textarea id="rvT" maxlength="320" rows="4">' + esc(r.text) + '</textarea></div>', [{label:'বাতিল'}, {label:'Save', cls:'pri', fn:async () => { try{ await A._db().collection('reviews').doc(id).update({name:$('rvN').value.slice(0, 40), rating:+$('rvR').value, text:$('rvT').value.slice(0, 320)}); A.audit('review:edit', id, ''); A.toast('Saved', 'ok'); }catch(e){ A.err(e); } }}]); };
A.addReview = function(){ A.modal('<h3>Add testimonial</h3><p>নিজে যোগ করা টেস্টিমোনিয়াল — আসল ইউজারের অনুমতি নিয়ে দাও।</p><div class="field"><label>Name</label><input id="rvN" maxlength="40"></div><div class="field"><label>Rating</label><select id="rvR"><option>5</option><option>4</option><option>3</option></select></div><div class="field"><label>Text (10–320)</label><textarea id="rvT" maxlength="320" rows="4"></textarea></div>', [{label:'বাতিল'}, {label:'Publish', cls:'pri', fn:async () => { const t = $('rvT').value.trim(), n = $('rvN').value.trim(); if(t.length < 10 || !n) return A.toast('নাম ও কমপক্ষে ১০ অক্ষরের টেক্সট দাও', 'err'); try{ const ref = await A._db().collection('reviews').add({uid:S.user.uid, name:n.slice(0, 40), rating:+$('rvR').value, text:t.slice(0, 320), approved:false, createdAt:firebase.firestore.FieldValue.serverTimestamp()}); await ref.update({approved:true}); A.audit('review:add', ref.id, ''); A.toast('Published', 'ok'); }catch(e){ A.err(e); } }}]); };
})();
