/* JournalOS site helpers — shared by landing, checkout, payment. No build step. */
(function(){
  const C = window.JOURNALOS_SITE;
  const S = window.JOS = { C };

  /* ---- CMS: the admin backend (/admin/) publishes siteConfig/site. We merge a
     cached copy synchronously (no flash), then refresh it from Firestore and
     reload ONCE if it changed. If anything fails the built-in defaults remain. ---- */
  const CMS_KEY = 'jos_site_cfg_v1';
  S.cms = {};
  function mergeCms(cfg){
    if(!cfg || typeof cfg !== 'object') return;
    S.cms = cfg;
    if(cfg.name) C.name = cfg.name;
    if(cfg.tagline) C.tagline = cfg.tagline;
    if(cfg.currency) C.currency = cfg.currency;
    if(cfg.support && cfg.support.email) C.support = Object.assign({}, C.support, cfg.support);
    if(Array.isArray(cfg.plans) && cfg.plans.length){
      const pl = cfg.plans.filter(p => p && p.id && p.active !== false && +p.months >= 1 && +p.price > 0).map(p => ({ id:String(p.id), label:p.label || p.labelEn || p.id, labelEn:p.labelEn || p.label || p.id, months:+p.months, price:+p.price, best:!!p.best }));
      if(pl.length) C.plans = pl;
    }
    if(cfg.payment && typeof cfg.payment === 'object'){
      Object.keys(cfg.payment).forEach(k => {
        const m = cfg.payment[k]; if(!m || !C.payment[k]) return;
        if(m.enabled === false) { delete C.payment[k]; return; }
        C.payment[k] = Object.assign({}, C.payment[k], m);
      });
    }
    if(cfg.pendingMaxDays) C.pendingMaxDays = +cfg.pendingMaxDays;
  }
  try{ mergeCms(JSON.parse(localStorage.getItem(CMS_KEY) || 'null')); }catch(e){}

  /* ---- tiny helpers ---- */
  S.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const BN = '০১২৩৪৫৬৭৮৯';
  S.bn = n => String(n).replace(/\d/g, d => BN[d]);
  S.money = n => C.currency + S.bn(Number(n).toLocaleString('en-US'));
  S.plan = id => C.plans.find(p => p.id === id) || null;
  S.perMonth = p => Math.round(p.price / p.months);
  S.savePct = p => { const base = C.plans.find(x => x.months === 1); return base && p.months > 1 ? Math.round((1 - p.price / (base.price * p.months)) * 100) : 0; };
  S.q = k => new URLSearchParams(location.search).get(k);
  /* ---- who may buy? (used by /checkout/ and /payment/) ---- */
  S.isOwner = u => !!u && (C.adminEmails || []).includes(String(u.email || '').toLowerCase());
  S.subStatus = function(orders){
    const now = Date.now(), cap = (C.pendingMaxDays || 14) * 86400000;
    const ms = v => !v ? now : (typeof v.toMillis === 'function' ? v.toMillis() : (typeof v === 'number' ? v : (isNaN(Date.parse(v)) ? now : Date.parse(v))));
    const add = (t, n) => { const d = new Date(t); d.setMonth(d.getMonth() + n); return d.getTime(); };
    const all = orders.map(o => Object.assign({}, o, {_t: ms(o.createdAt)})).sort((a, b) => a._t - b._t);
    let cursor = 0, covering = null;
    all.forEach(o => {
      if(o.status === 'rejected') return;
      if(o.status !== 'verified' && now - o._t > cap) return;
      const start = Math.max(o._t, cursor), end = add(start, o.months || 1); cursor = end;
      if(!covering && now >= start && now < end) covering = {status: o.status === 'verified' ? 'active' : 'pending'};
    });
    return covering ? {status: covering.status, until: cursor, daysLeft: Math.max(0, Math.ceil((cursor - now) / 86400000))} : {status: 'none'};
  };
  /* kind: 'ok' (may buy) | 'admin' | 'active' (already has Pro) | 'trashed'. A failed lookup never blocks a real customer. */
  S.accessCheck = async function(user){
    if(S.isOwner(user)) return {kind: 'admin'};
    try{
      const [dir, ord] = await Promise.all([S.db.collection('userDirectory').doc(user.uid).get(), S.db.collection('orders').where('uid', '==', user.uid).get()]);
      const d = dir.exists ? dir.data() : {};
      if(d.trashed) return {kind: 'trashed'};
      const until = d.complimentaryUntil ? Date.parse(d.complimentaryUntil + 'T23:59:59') : 0;
      if(d.complimentary && (!until || until > Date.now())) return {kind: 'active', source: 'comp', until};
      const sub = S.subStatus(ord.docs.map(x => x.data())), win = C.renewWindowDays == null ? 5 : C.renewWindowDays;
      if(sub.status === 'pending') return {kind: 'active', source: 'pending', until: sub.until};
      if(sub.status === 'active' && sub.daysLeft > win) return {kind: 'active', source: 'pro', until: sub.until};
    }catch(e){}
    return {kind: 'ok'};
  };
  S.blockCardHtml = function(r){
    const until = r.until ? new Date(r.until).toLocaleDateString('bn-BD', {day: 'numeric', month: 'long', year: 'numeric'}) : '';
    const T = {
      admin: ['এটা মূল অ্যাডমিন অ্যাকাউন্ট', 'এই অ্যাকাউন্টে সব ফিচার সবসময় চালু। কোনো প্ল্যান কেনার দরকার নেই।'],
      active: ['আপনার Pro আগে থেকেই চালু আছে', (r.source === 'pending' ? 'আপনার আগের পেমেন্ট ভেরিফাইয়ের অপেক্ষায় আছে, তাই নতুন করে পেমেন্ট করা যাবে না।' : 'এই Gmail-এ Pro প্ল্যান চালু আছে' + (until ? ' (মেয়াদ: ' + until + ')' : '') + '। তাই নতুন করে পেমেন্ট করা যাবে না।') + ' মেয়াদ শেষের কাছাকাছি এলে রিনিউ করতে পারবেন।'],
      trashed: ['এই অ্যাকাউন্টটি এখন পাওয়া যাচ্ছে না', 'অ্যাকাউন্টটি সরিয়ে রাখা হয়েছে, তাই পেমেন্ট করা যাবে না। ভুল মনে হলে সাপোর্টে যোগাযোগ করুন।']
    }[r.kind];
    return '<div class="card blockcard' + (r.kind === 'admin' ? ' info' : '') + '" role="alert"><h2>' + S.esc(T[0]) + '</h2><p>' + S.esc(T[1]) + '</p><div style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn btn-primary" href="' + C.appUrl + '">অ্যাপে যাও</a><button class="btn btn-ghost" type="button" data-out>অন্য অ্যাকাউন্টে সাইন-ইন</button></div></div>';
  };


  /* ---- theme (same key the app uses, so light/dark follows you into /app/) ---- */
  function applyTheme(){
    let m = 'system'; try{ m = localStorage.getItem('journalos_theme_cache') || 'system'; }catch(e){}
    const dark = m === 'dark' || (m === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    const t = document.querySelector('meta[name="theme-color"]'); if(t) t.content = dark ? '#051617' : '#F3F7F5';
  }
  S.toggleTheme = function(){
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    try{ localStorage.setItem('journalos_theme_cache', dark ? 'light' : 'dark'); }catch(e){}
    applyTheme();
  };
  applyTheme();
  try{ matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme); }catch(e){}

  /* ---- Firebase (compat SDK, same version as the app) ---- */
  S.fbReady = typeof firebase !== 'undefined';
  if(S.fbReady){
    if(!firebase.apps.length) firebase.initializeApp(C.firebase);
    S.auth = firebase.auth();
    S.db = firebase.firestore();
  }
  if(S.db){
    S.db.collection('siteConfig').doc('site').get().then(snap => {
      const data = snap.exists ? snap.data() : {};
      const fresh = JSON.stringify(data), old = localStorage.getItem(CMS_KEY);
      if((old || '{}') !== fresh && !(old === null && fresh === '{}')){
        try{ localStorage.setItem(CMS_KEY, fresh); }catch(e){}
        if(!sessionStorage.getItem('jos_cms_reloaded')){ try{ sessionStorage.setItem('jos_cms_reloaded', '1'); }catch(e){} location.reload(); }
      } else { try{ sessionStorage.removeItem('jos_cms_reloaded'); }catch(e){} }
    }).catch(() => {});
  }
  S.onUser = function(cb){
    if(!S.auth){ cb(null); return; }
    S.auth.onAuthStateChanged(cb);
  };
  S.googleSignIn = function(){
    const p = new firebase.auth.GoogleAuthProvider();
    return S.auth.signInWithPopup(p);
  };

  /* ---- toast ---- */
  S.toast = function(msg, type){
    let r = document.getElementById('toasts');
    if(!r){ r = document.createElement('div'); r.id = 'toasts'; r.setAttribute('role','status'); r.setAttribute('aria-live','polite'); document.body.appendChild(r); }
    const t = document.createElement('div'); t.className = 'toast ' + (type || ''); t.textContent = msg; r.appendChild(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 250); }, 4200);
  };

  S.copy = function(text, btn){
    const done = () => { S.toast('কপি হয়েছে', 'ok'); if(btn){ const o = btn.textContent; btn.textContent = '✓'; setTimeout(() => btn.textContent = o, 1200); } };
    if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, () => S.toast('কপি হয়নি — নিজে সিলেক্ট করে কপি করো'));
    else { const t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select(); try{ document.execCommand('copy'); done(); }catch(e){} t.remove(); }
  };

  /* data-cms="a.b" → text, data-cms-html → html (admin text is escaped), data-sec="x" → hidden when disabled */
  S.applyCms = function(){
    const L = (S.cms && S.cms.landing) || {};
    const get = (o, path) => path.split('.').reduce((a, k) => (a && a[k] != null ? a[k] : undefined), o);
    document.querySelectorAll('[data-cms]').forEach(el => { const v = get(L, el.dataset.cms); if(typeof v === 'string' && v.trim()) el.textContent = v; });
    document.querySelectorAll('[data-cms-href]').forEach(el => { const v = get(L, el.dataset.cmsHref); if(typeof v === 'string' && v.trim()) el.setAttribute('href', v); });
    document.querySelectorAll('[data-sec]').forEach(el => { if(L.sections && L.sections[el.dataset.sec] === false) el.style.display = 'none'; });
    document.querySelectorAll('[data-nav]').forEach(el => { if(L.sections && L.sections[el.dataset.nav] === false) el.style.display = 'none'; });
    if(L.seo){ if(L.seo.title) document.title = L.seo.title; const d = document.querySelector('meta[name="description"]'); if(d && L.seo.description) d.content = L.seo.description; }
    document.querySelectorAll('.brand span, .site-brand').forEach(el => { if(C.name) el.textContent = C.name; });
    if(L.announce && L.announce.enabled && L.announce.text){
      const b = document.createElement('div'); b.className = 'cms-announce'; b.setAttribute('role','status');
      b.innerHTML = '<span>' + S.esc(L.announce.text) + '</span>' + (L.announce.link ? ' <a href="' + S.esc(L.announce.link) + '">' + S.esc(L.announce.linkLabel || 'আরও জানো') + ' →</a>' : '');
      document.body.insertBefore(b, document.body.firstChild);
    }
  };

  /* installed old PWA opened at "/" → straight into the app */
  try{
    if(document.documentElement.hasAttribute('data-redirect-standalone') && (navigator.standalone || matchMedia('(display-mode: standalone)').matches)) location.replace(C.appUrl);
  }catch(e){}
})();
