/* JournalOS site helpers — shared by landing, checkout, payment. No build step. */
(function(){
  const C = window.JOURNALOS_SITE;
  const S = window.JOS = { C };

  /* ---- tiny helpers ---- */
  S.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const BN = '০১২৩৪৫৬৭৮৯';
  S.bn = n => String(n).replace(/\d/g, d => BN[d]);
  S.money = n => C.currency + S.bn(Number(n).toLocaleString('en-US'));
  S.plan = id => C.plans.find(p => p.id === id) || null;
  S.perMonth = p => Math.round(p.price / p.months);
  S.savePct = p => { const base = C.plans.find(x => x.months === 1); return base && p.months > 1 ? Math.round((1 - p.price / (base.price * p.months)) * 100) : 0; };
  S.q = k => new URLSearchParams(location.search).get(k);

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

  /* installed old PWA opened at "/" → straight into the app */
  try{
    if(document.documentElement.hasAttribute('data-redirect-standalone') && (navigator.standalone || matchMedia('(display-mode: standalone)').matches)) location.replace(C.appUrl);
  }catch(e){}
})();
