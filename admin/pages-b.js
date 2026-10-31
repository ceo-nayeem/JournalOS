/* Control Center pages B: Plans · Payments · Website editor · Brand kit */
(function(){
'use strict';
const A = window.A, S = A.S, esc = A.esc, ic = A.ic, $ = A.$;

/* ================= PLANS ================= */
function planCard(p, i, n){
  const per = p.months > 0 ? Math.round(p.price / p.months) : 0;
  return '<div class="rep"><div class="row" style="justify-content:space-between;margin-bottom:10px"><div class="row"><b>#' + (i + 1) + '</b>' + (p.best ? A.badge('Best value', 'ok') : '') + (p.active === false ? A.badge('Hidden', 'warn') : '') + '<span class="sm muted">≈ ' + A.money(per) + '/month</span></div>' +
    '<div class="row"><button class="btn sm" ' + (i ? '' : 'disabled') + ' onclick="A.plMove(' + i + ',-1)">' + ic('up') + '</button><button class="btn sm" ' + (i < n - 1 ? '' : 'disabled') + ' onclick="A.plMove(' + i + ',1)">' + ic('down') + '</button><button class="btn sm bad" onclick="A.plDel(' + i + ')">' + ic('trash') + '</button></div></div>' +
    '<div class="two">' + A.fld('Label (বাংলা)', 'site', 'plans.' + i + '.label') + A.fld('Label (English)', 'site', 'plans.' + i + '.labelEn') + '</div>' +
    '<div class="three">' + A.fld('Months (1–24)', 'site', 'plans.' + i + '.months', {type:'number', min:1, max:24}) + A.fld('Price ৳ (1–5000)', 'site', 'plans.' + i + '.price', {type:'number', min:1, max:5000}) + A.fld('Plan ID', 'site', 'plans.' + i + '.id', {hint:'ইউআরএল-এ ব্যবহার হয়'}) + '</div>' +
    '<div class="row">' + '<label class="row sm"><label class="sw"><input type="checkbox" ' + (p.best ? 'checked' : '') + ' onchange="A.plBest(' + i + ',this.checked)"><i></i></label> Highlight as best</label>' + '<label class="row sm"><label class="sw"><input type="checkbox" ' + (p.active !== false ? 'checked' : '') + ' onchange="A.setD(\'site\',\'plans.' + i + '.active\',this.checked);A.repaint()"><i></i></label> Visible on site</label></div></div>';
}
A.page('plans', {title:'Pricing & plans', group:'com', icon:'tag', editor:true, needs:['site'], render(){
  const d = A.D('site'), L = d.landing;
  return A.errBanner(['site']) + A.head('Pricing & plans', 'প্ল্যান যোগ/বাদ, দাম ও মেয়াদ বদলাও। ল্যান্ডিং, checkout ও payment পেজ — সবখানে একসাথে বদলে যায়।', '<button class="btn pri" onclick="A.plAdd()">' + ic('plus') + ' Add plan</button>') + A.savebar('site').replace('A.save(\'site\')', 'A.savePlans()') +
  '<div class="split"><div>' + d.plans.map((p, i) => planCard(p, i, d.plans.length)).join('') +
  '<div class="card" style="margin-top:14px"><h3>প্ল্যানের ফিচার তালিকা</h3><div class="sub">প্রতিটা প্ল্যান কার্ডে একই তালিকা দেখায় · প্রতি লাইনে একটা। খালি রাখলে ডিফল্ট।</div><textarea rows="6" onchange="A.setD(\'site\',\'landing.planFeatures\',this.value.split(\'\\n\').map(s=>s.trim()).filter(Boolean))">' + esc((L.planFeatures || []).join('\n')) + '</textarea><div class="row" style="margin-top:8px"><button class="btn sm" onclick="A.loadDefaults(\'planFeatures\')">ডিফল্টগুলো এডিটে আনো</button></div></div></div>' +
  '<div class="preview"><div class="bar2"><i></i><i></i><i></i>&nbsp; লাইভ প্রিভিউ — সেভ করলে রিফ্রেশ হয়</div><iframe id="prevFrame" src="/#pricing" title="Preview"></iframe></div></div>';
}});
A.plAdd = function(){ const d = A.D('site'); d.plans.push({id:'plan' + (d.plans.length + 1), label:'নতুন প্ল্যান', labelEn:'New plan', months:1, price:199, active:true}); A.paintSavebars(); A.repaint(); };
A.plDel = async function(i){ const d = A.D('site'); if(d.plans.length < 2) return A.toast('কমপক্ষে একটা প্ল্যান লাগবে', 'err'); if(!await A.confirm('প্ল্যান মুছবে?', d.plans[i].labelEn + ' — আগের অর্ডারে কোনো প্রভাব পড়বে না।', 'মুছো', 'bad')) return; d.plans.splice(i, 1); A.paintSavebars(); A.repaint(); };
A.plMove = function(i, dlt){ const p = A.D('site').plans, j = i + dlt; if(j < 0 || j >= p.length) return; [p[i], p[j]] = [p[j], p[i]]; A.paintSavebars(); A.repaint(); };
A.plBest = function(i, on){ A.D('site').plans.forEach((p, k) => { p.best = on && k === i; }); A.paintSavebars(); A.repaint(); };
A.savePlans = function(){
  const ps = A.D('site').plans, ids = new Set();
  for(const p of ps){
    p.id = String(p.id || p.labelEn || '').trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-|-$/g, '') || 'plan'; if(ids.has(p.id)) p.id += '-' + (ids.size + 1); ids.add(p.id);
    p.months = Math.round(+p.months); p.price = Math.round(+p.price);
    if(!(p.months >= 1 && p.months <= 24)) return A.toast('"' + p.labelEn + '": মেয়াদ ১–২৪ মাসের মধ্যে হতে হবে', 'err');
    if(!(p.price >= 1 && p.price <= 5000)) return A.toast('"' + p.labelEn + '": দাম ১–৫০০০ ৳ এর মধ্যে হতে হবে (সিকিউরিটি রুল)', 'err');
  }
  if(!ps.some(p => p.active !== false)) return A.toast('অন্তত একটা প্ল্যান Visible রাখো', 'err');
  A.save('site');
};
const _fetchLanding = (() => { let p; return () => p || (p = fetch('/', {cache:'no-store'}).then(r => r.text())); })();
A.loadDefaults = async function(what){
  try{
    const html = await _fetchLanding(), L = A.D('site').landing;
    if(what === 'faq'){ const doc = new DOMParser().parseFromString(html, 'text/html'); L.faq = [...doc.querySelectorAll('#faq details')].map(x => ({q:x.querySelector('summary').textContent, a:x.querySelector('p').textContent})); }
    if(what === 'how'){ const doc = new DOMParser().parseFromString(html, 'text/html'); L.how = [...doc.querySelectorAll('#how li')].map(x => ({t:x.querySelector('h4').textContent, d:x.querySelector('p').textContent})); }
    if(what === 'planFeatures'){ const m = html.match(/const feats0 = (\[[\s\S]*?\]);/); L.planFeatures = m ? (new Function('return ' + m[1]))() : []; }
    A.paintSavebars(); A.repaint(); A.toast('ডিফল্ট লোড হয়েছে — এখন এডিট করো', 'ok');
  }catch(e){ A.err(e, 'ডিফল্ট লোড হয়নি'); }
};

/* ================= PAYMENTS ================= */
A.page('payments', {title:'Payments & access', group:'com', icon:'card', editor:true, needs:['site', 'cfg'], render(){
  const d = A.D('site');
  const meth = (k, name, col) => { const m = d.payment[k]; return '<div class="card" style="border-top:3px solid ' + col + '"><div class="row"><h3 style="margin:0">' + name + '</h3><span style="flex:1"></span><label class="sw"><input type="checkbox" ' + (m.enabled !== false ? 'checked' : '') + ' onchange="A.setD(\'site\',\'payment.' + k + '.enabled\',this.checked)"><i></i></label></div><div class="sub">Checkout-এ দেখাবে কি না</div>' +
    A.fld('Receiving number', 'site', 'payment.' + k + '.number', {ph:'01XXXXXXXXX', hint:'ইউজার এই নম্বরে Send Money করবে'}) + A.fld('Account type / instruction', 'site', 'payment.' + k + '.kind', {ph:'Personal — Send Money'}) + '</div>'; };
  return A.errBanner(['site', 'cfg']) + A.head('Payments & access', 'পেমেন্ট নম্বর, পেমেন্ট ছাড়া অ্যাক্সেসের নিয়ম ও Pending-Pro মেয়াদ।') + A.savebar('site') + A.savebar('cfg') +
  '<div class="grid g2">' + meth('bkash', 'bKash', '#E2136E') + meth('nagad', 'Nagad', '#F6921E') + '</div>' +
  '<div class="card" style="margin-top:16px"><h3>Access rules</h3><div class="sub">অ্যাপের paywall ও pending নীতি</div>' + A.tog('cfg', 'requirePro', 'Require Pro (paywall)', 'বন্ধ করলে পেমেন্ট ছাড়াই সবাই অ্যাপ ব্যবহার করতে পারবে।') +
    A.numRow('cfg', 'pendingMaxDays', 'Pending-Pro validity (days)', 'ভেরিফাই না হলে pending অর্ডার কত দিন পর্যন্ত Pro খোলা রাখবে।', {min:1, max:90, def:14}) +
    '<div class="sm muted" style="margin-top:10px">নতুন bKash/Nagad ছাড়া অন্য মেথড যোগ করতে firestore.rules-এ <code>method in [...]</code> বদলাতে হবে।</div></div>';
}});
(function(){ const sv = A.save; A.save = function(scope){ if(scope === 'cfg') A.D('site').pendingMaxDays = A.D('cfg').pendingMaxDays; return sv(scope); }; })();

/* ================= WEBSITE EDITOR ================= */
const ST = S.siteTab = 'hero';
const TABS = [['hero', 'Hero'], ['sections', 'Sections & text'], ['how', 'How it works'], ['faq', 'FAQ'], ['footer', 'Footer & links'], ['announce', 'Announcement bar'], ['seo', 'SEO']];
function repeater(arr, path, kind){
  const rows = (A.D('site').landing[arr] || []).map((x, i) => '<div class="rep"><button class="btn sm bad x" onclick="A.repDel(\'' + arr + '\',' + i + ')">' + ic('trash') + '</button><div class="row" style="margin-bottom:8px"><button class="btn sm" ' + (i ? '' : 'disabled') + ' onclick="A.repMove(\'' + arr + '\',' + i + ',-1)">' + ic('up') + '</button><button class="btn sm" onclick="A.repMove(\'' + arr + '\',' + i + ',1)">' + ic('down') + '</button><b>#' + (i + 1) + '</b></div>' +
    (kind === 'faq' ? A.fld('প্রশ্ন', 'site', path + '.' + i + '.q') + A.fld('উত্তর', 'site', path + '.' + i + '.a', {rows:3}) : A.fld('ধাপের নাম', 'site', path + '.' + i + '.t') + A.fld('বিবরণ', 'site', path + '.' + i + '.d', {rows:2})) + '</div>').join('');
  return rows || '<div class="empty"><b>ডিফল্ট ব্যবহার হচ্ছে</b>কাস্টমাইজ করতে "ডিফল্ট এডিটে আনো" বা "যোগ করো" চাপো।</div>';
}
A.repAdd = function(arr){ A.D('site').landing[arr].push(arr === 'faq' ? {q:'', a:''} : {t:'', d:''}); A.paintSavebars(); A.repaint(); };
A.repDel = function(arr, i){ A.D('site').landing[arr].splice(i, 1); A.paintSavebars(); A.repaint(); };
A.repMove = function(arr, i, d){ const a = A.D('site').landing[arr], j = i + d; if(j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; A.paintSavebars(); A.repaint(); };
A.siteTab = t => { S.siteTab = t; A.repaint(); };
A.page('site', {title:'Website (landing)', group:'web', icon:'globe', editor:true, needs:['site'], render(){
  const t = S.siteTab || 'hero', P = 'landing.';
  let body = '';
  if(t === 'hero') body = '<div class="card"><h3>Hero</h3><div class="sub">পেজের একদম উপরের অংশ</div>' + A.fld('Headline — line 1', 'site', P + 'hero.l1', {ph:'লিখে ফেলো।'}) + A.fld('Headline — line 2 (রঙিন)', 'site', P + 'hero.l2', {ph:'বাকিটা JournalOS।'}) + A.fld('Sub-text', 'site', P + 'hero.sub', {rows:3}) + A.fld('Meta line (ছোট লেখা)', 'site', P + 'hero.meta') + '<div class="two">' + A.fld('Button 1 text', 'site', P + 'hero.cta1') + A.fld('Button 2 text', 'site', P + 'hero.cta2') + '</div><div class="hint muted sm">খালি রাখলে ডিফল্ট লেখা থাকবে।</div></div>';
  if(t === 'sections') body = '<div class="card"><h3>Show / hide sections</h3><div class="sub">বন্ধ করলে সেকশন ও মেনু লিংক দুটোই লুকায়</div>' + [['features', 'Features'], ['how', 'How it works'], ['pricing', 'Pricing'], ['reviews', 'Reviews'], ['faq', 'FAQ']].map(([k, l]) => A.tog('site', P + 'sections.' + k, l, '', true)).join('') + '</div>' +
    '<div class="card" style="margin-top:14px"><h3>Section headings</h3>' + [['features', 'Features'], ['how', 'How it works'], ['pricing', 'Pricing'], ['reviews', 'Reviews'], ['faq', 'FAQ']].map(([k, l]) => '<div class="' + (k === 'how' || k === 'faq' ? '' : 'two') + '">' + A.fld(l + ' — heading', 'site', P + k + '.h') + (k === 'how' || k === 'faq' ? '' : A.fld(l + ' — sub-text', 'site', P + k + '.p')) + '</div>').join('') + '<div class="two">' + A.fld('Final banner — heading', 'site', P + 'final.h') + A.fld('Final banner — button', 'site', P + 'final.cta') + '</div></div>';
  if(t === 'how') body = '<div class="row" style="margin-bottom:12px"><button class="btn" onclick="A.loadDefaults(\'how\')">ডিফল্ট এডিটে আনো</button><button class="btn pri" onclick="A.repAdd(\'how\')">' + ic('plus') + ' ধাপ যোগ</button></div>' + repeater('how', P + 'how', 'how');
  if(t === 'faq') body = '<div class="row" style="margin-bottom:12px"><button class="btn" onclick="A.loadDefaults(\'faq\')">ডিফল্ট এডিটে আনো</button><button class="btn pri" onclick="A.repAdd(\'faq\')">' + ic('plus') + ' প্রশ্ন যোগ</button></div>' + repeater('faq', P + 'faq', 'faq');
  if(t === 'footer') body = '<div class="card"><h3>Footer & contact</h3>' + A.fld('Footer text', 'site', P + 'footer.text') + A.fld('Support email', 'site', 'support.email', {type:'email'}) + '<h4 style="margin:10px 0">Social links</h4><div class="two">' + ['facebook', 'instagram', 'youtube', 'twitter', 'github', 'telegram'].map(k => A.fld(k, 'site', P + 'social.' + k, {type:'url', ph:'https://…'})).join('') + '</div></div>';
  if(t === 'announce') body = '<div class="card"><h3>Announcement bar</h3><div class="sub">সব পাবলিক পেজের (landing/checkout/payment) একদম উপরে রঙিন বার</div>' + A.tog('site', P + 'announce.enabled', 'Show bar', 'অফার বা নোটিশ দেখাতে', false) + A.fld('Text', 'site', P + 'announce.text', {ph:'🎉 ঈদ অফার — ১২ মাসে বিশেষ ছাড়!'}) + '<div class="two">' + A.fld('Link (ঐচ্ছিক)', 'site', P + 'announce.link', {ph:'/#pricing'}) + A.fld('Link label', 'site', P + 'announce.linkLabel', {ph:'দেখো'}) + '</div></div>';
  if(t === 'seo') body = '<div class="card"><h3>SEO & sharing</h3>' + A.fld('Page title', 'site', P + 'seo.title', {ph:'JournalOS — প্রাইভেট AI জার্নাল'}) + A.fld('Meta description', 'site', P + 'seo.description', {rows:3, hint:'১৫৫ অক্ষরের মধ্যে রাখলে ভালো'}) + '</div>';
  return A.errBanner(['site']) + A.head('Website editor', 'ল্যান্ডিং পেজের লেখা, সেকশন, FAQ, ফুটার, অ্যানাউন্সমেন্ট — কোড ছাড়াই। সেভ করলেই লাইভ।', '<a class="btn" href="/" target="_blank">' + ic('ext') + ' Open site</a>') + A.savebar('site') +
  A.tabs(t, TABS, 'A.siteTab') + '<div class="split" style="margin-top:16px"><div>' + body + '</div><div class="preview"><div class="bar2"><i></i><i></i><i></i>&nbsp; লাইভ প্রিভিউ</div><iframe id="prevFrame" src="/" title="Preview"></iframe></div></div>';
}});

/* ================= BRAND KIT ================= */
A.brandName = function(v){ A.setD('site', 'name', v); A.setD('cfg', 'appName', v); };
A.brandTag = function(v){ A.setD('site', 'tagline', v); A.setD('cfg', 'tagline', v); };
A.accentPick = function(k){ A.setD('cfg', 'defaults.accent', k); A.repaint(); };
A.page('brand', {title:'Brand kit & theme', group:'app', icon:'brush', editor:true, needs:['site', 'cfg'], render(){
  const d = A.D('site'), c = A.D('cfg'), cur = c.defaults.accent || 'brand', ac = A.ACCENTS[cur] || A.ACCENTS.brand;
  return A.errBanner(['site', 'cfg']) + A.head('Brand kit & theme', 'নাম, ট্যাগলাইন ও ডিফল্ট রঙ — অ্যাপ ও ওয়েবসাইট দুটোতেই প্রয়োগ হয়। ব্যাকএন্ডের নিজের থিম আলাদা (Appearance পেজ)।') + A.savebar('cfg').replace('A.save(\'cfg\')', 'A.saveBrand()') +
  '<div class="grid g2"><div class="card"><h3>Identity</h3><div class="field"><label>Brand name</label><input type="text" maxlength="40" value="' + esc(d.name) + '" oninput="A.brandName(this.value)"></div><div class="field"><label>Tagline</label><input type="text" maxlength="90" value="' + esc(d.tagline) + '" oninput="A.brandTag(this.value)"></div>' + A.fld('Currency symbol', 'site', 'currency', {hint:'যেমন ৳'}) +
    '<div class="sm muted">লোগো বদলাতে রিপোর <code>assets/logo.png</code> ও <code>app/icon-*.png</code> ফাইল রিপ্লেস করো।</div></div>' +
  '<div class="card"><h3>Default accent colour</h3><div class="sub">নতুন ইউজারদের ডিফল্ট রঙ (ইউজার নিজে বদলাতে পারে)</div><div class="swatches">' + Object.keys(A.ACCENTS).map(k => '<button class="swatch ' + (k === cur ? 'on' : '') + '" title="' + k + '" style="background:linear-gradient(135deg,' + A.ACCENTS[k][0] + ',' + A.ACCENTS[k][1] + ')" onclick="A.accentPick(\'' + k + '\')"></button>').join('') + '</div>' +
    '<div class="card" style="margin-top:16px;background:linear-gradient(135deg,' + ac[0] + ',' + ac[1] + ');color:#fff;border:none"><b style="font-size:18px">' + esc(d.name) + '</b><div style="opacity:.9">' + esc(d.tagline) + '</div><div class="row" style="margin-top:12px"><span class="badge" style="background:rgba(255,255,255,.22);color:#fff">Preview</span></div></div>' +
    A.selRow('cfg', 'defaults.theme', 'Default theme', 'প্রথমবার ঢুকলে', [['system', 'Follow device'], ['light', 'Light'], ['dark', 'Dark']], 'system') + '</div></div>';
}});
A.saveBrand = function(){ A.D('site').pendingMaxDays = A.D('cfg').pendingMaxDays; A.save('cfg'); if(A.isDirty('site')) A.save('site'); };
})();
