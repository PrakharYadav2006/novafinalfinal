/* LIGHTHOUSE - UI kit, shell, router, search, tooltips, modal, cross-filter context. */
(function () {
  'use strict';
  const LH = window.LH, D = LH.D;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  LH.esc = esc;
  LH.pages = {}; LH.after = {}; LH.A = {}; LH.ctx = {}; LH.ui = {};
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  LH.$ = $; LH.$$ = $$;
  const store = {
    get(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* storage blocked: fine */ } },
  };
  LH.store = store;

  /* ---------- small renderers ---------- */
  const dataAttrs = (d) => Object.keys(d || {}).map((k) => ' data-' + k + '="' + esc(d[k]) + '"').join('');
  LH.btn = (label, act, data, cls) => '<button type="button" class="btn ' + (cls || '') + '" data-act="' + act + '"' + dataAttrs(data) + '>' + label + '</button>';
  LH.chip = (label, act, data, cls) => '<button type="button" class="chip ' + (cls || '') + '" data-act="' + act + '"' + dataAttrs(data) + '>' + label + '</button>';
  LH.help = (text, title) => '<span class="help" tabindex="0" role="img" aria-label="Help: ' + esc(text) + '" data-tip="' + esc(text) + '"' + (title ? ' data-tt="' + esc(title) + '"' : '') + '>?</span>';
  LH.bandCls = (b) => ({ High: 'high', Medium: 'medium', Low: 'low' }[b] || 'low');
  LH.riskPill = (b) => '<span class="pill r-' + LH.bandCls(b) + '"><span aria-hidden="true">' + ({ High: '▲', Medium: '◆', Low: '●' }[b]) + '</span>' + b + ' risk</span>';
  LH.confPill = (c) => '<span class="pill c-' + c.toLowerCase() + '"><span class="dots" aria-hidden="true">' + ({ High: '●●●', Medium: '●●○', Low: '●○○' }[c]) + '</span>' + c + ' confidence</span>';
  LH.statusPill = (st) => st === 'Confirmed' ? '<span class="pill st-conf">✓ Confirmed</span>' : st === 'Inferred' ? '<span class="pill st-inf">◌ Inferred</span>' : '<span class="pill st-unr">? ' + esc(st) + '</span>';
  LH.rk = (s) => '<span class="rk r-' + LH.bandCls(s.band) + '">' + LH.pct1(s.overall) + '</span>';
  LH.actPill = (a) => '<span class="act ' + a.tone + '">' + esc(a.label) + '</span>';
  LH.chipSup = (id) => LH.chip(esc(LH.name(id)), 'sup', { id });
  LH.chipComp = (id) => LH.chip(id, 'comp', { id });
  LH.chipProd = (id) => LH.chip(id, 'prod', { id });
  LH.chipEv = (id) => LH.chip(id, 'ev', { id }, 'tag-ev');
  LH.chipDoc = (id) => LH.chip(id, 'doc', { id });
  LH.chipAlt = (a) => LH.chip(esc(a.short), 'alt', { id: a.id });
  LH.tierTxt = (s) => 'Tier-' + s.tiern;
  LH.panel = (title, sub, body, cls, help) => '<section class="panel ' + (cls || '') + '"><div class="ph"><h2>' + title + '</h2>' + (help ? LH.help(help) : '') + '</div>' + (sub ? '<div class="sub">' + sub + '</div>' : '') + body + '</section>';
  LH.pageH = (title, sub, crumb) => '<div class="page-h">' + (crumb ? '<div class="crumb">' + crumb + '</div>' : '') + '<h1>' + title + '</h1><p>' + sub + '</p></div>';
  LH.acc = (n, title, body, open, id) => '<details class="acc" ' + (id ? 'id="' + id + '" ' : '') + (open ? 'open' : '') + '><summary><span class="n">' + n + '</span>' + title + '<span class="chev">›</span></summary><div class="body">' + body + '</div></details>';
  LH.adv = (title, body, open) => '<details class="adv" ' + (open ? 'open' : '') + '><summary>' + title + '</summary><div class="body">' + body + '</div></details>';
  LH.bar = (v, cls) => '<div class="bar ' + (cls || '') + '"><i style="width:' + Math.max(0, Math.min(100, v)) + '%"></i></div>';
  LH.empty = (msg) => '<div class="empty">' + esc(msg) + '</div>';
  LH.simBanner = () => '<div class="note sim">SIMULATED SCENARIO — NOT AN ACTUAL EVENT</div>';
  LH.altDisclaimer = () => '<span class="disc">Shortlisted candidate — sourcing and engineering validation required.</span>';
  LH.altTiming = (a) => a.userProvided ? 'Candidate-specific qualification time not provided. Case component reference: ' + a.weeks + ' weeks.' : a.weeks + ' weeks indicative';
  LH.rate = (r) => '<span class="rate ' + (r === 'Not shown' ? 'NS' : r) + '"><i></i>' + r + '</span>';
  LH.link = (url, label) => '<a href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' + esc(label) + ' ↗</a>';

  /* ---------- tooltips ---------- */
  const tip = $('#tip');
  function showTip(el, ev) {
    let html = '';
    if (el.dataset.tip) html = (el.dataset.tt ? '<b>' + esc(el.dataset.tt) + '</b>' : '') + esc(el.dataset.tip);
    else if (el.dataset.nodetip) html = LH.nodeTip(el.dataset.nodetip);
    if (!html) return;
    tip.innerHTML = html; tip.classList.add('on');
    const r = el.getBoundingClientRect();
    const pt = el.dataset.nodetip && ev ? { x: ev.clientX, y: ev.clientY } : { x: r.left + r.width / 2, y: r.bottom };
    const w = tip.offsetWidth, hgt = tip.offsetHeight;
    let x = Math.min(window.innerWidth - w - 10, Math.max(10, pt.x - w / 2)); let y = pt.y + 14;
    if (y + hgt > window.innerHeight - 10) y = pt.y - hgt - 22;
    tip.style.left = x + 'px'; tip.style.top = y + 'px';
  }
  function hideTip() { tip.classList.remove('on'); }
  document.addEventListener('mouseover', (e) => { const el = e.target.closest('[data-tip],[data-nodetip]'); if (el) showTip(el, e); });
  document.addEventListener('mousemove', (e) => { const el = e.target.closest('[data-nodetip]'); if (el && tip.classList.contains('on')) showTip(el, e); });
  document.addEventListener('mouseout', (e) => { if (e.target.closest('[data-tip],[data-nodetip]')) hideTip(); });
  document.addEventListener('focusin', (e) => { const el = e.target.closest('[data-tip]'); if (el) showTip(el); });
  document.addEventListener('focusout', hideTip);
  LH.nodeTip = (id) => {
    const s = D.sup[id];
    if (s) {
      return '<b>' + esc(s.name) + '</b><div class="tr"><span>Tier</span><span>' + LH.tierTxt(s) + ' · ' + s.zone + '</span><span>Risk</span><span>' + LH.pct1(s.overall) + ' (' + s.band + ')</span><span>Confidence</span><span>' + s.conf + '</span><span>Components</span><span>' + esc(s.comps.join(', ')) + '</span><span>Products</span><span>' + esc(s.prods.join(', ')) + '</span></div>';
    }
    if (LH.compById[id]) { const c = LH.compById[id]; return '<b>' + c.id + ' ' + esc(c.name) + '</b><div class="tr"><span>Products</span><span>' + c.prods.join(', ') + '</span><span>Tier-1</span><span>' + c.t1.map((t) => LH.name(t.id) + ' ' + t.share + '%').join(', ') + '</span><span>Qualification</span><span>' + c.weeks + ' weeks (indicative)</span></div><div style="margin-top:4px;color:#9fb2da">Planning allocation is not purchase history.</div>'; }
    if (LH.prodById[id]) { const p = LH.prodById[id]; return '<b>' + p.id + ' ' + esc(p.name) + '</b><div class="tr"><span>Annual revenue</span><span>USD ' + p.rev + 'm</span><span>Components</span><span>' + p.comps.join(', ') + '</span></div>'; }
    return '';
  };

  /* ---------- modal ---------- */
  let modalReturnFocus = null;
  LH.modal = (html, wide) => {
    const o = $('#overlay');
    modalReturnFocus = document.activeElement;
    const titleId = 'modal-title-' + Date.now();
    const content = html.replace(/<h2(\s|>)/i, '<h2 id="' + titleId + '"$1');
    o.innerHTML = '<div class="modal ' + (wide ? 'wide' : '') + '" role="dialog" aria-modal="true" aria-labelledby="' + titleId + '"><button type="button" class="btn ghost close" data-act="closemodal" aria-label="Close">✕</button>' + content + '</div>';
    o.inert = false; o.setAttribute('aria-hidden', 'false'); o.classList.add('on'); o.dataset.lock = '';
    const m = $('.modal', o); m.scrollTop = 0; setTimeout(() => $('.close', m).focus(), 0);
  };
  LH.closeModal = () => { const o = $('#overlay'); o.classList.remove('on'); o.setAttribute('aria-hidden', 'true'); o.inert = true; o.innerHTML = ''; if (modalReturnFocus && modalReturnFocus.isConnected) modalReturnFocus.focus(); modalReturnFocus = null; };
  $('#overlay').addEventListener('click', (e) => { if (e.target.id === 'overlay' && !$('#overlay').dataset.lock) LH.closeModal(); });
  document.addEventListener('keydown', (e) => {
    const o = $('#overlay');
    const d = $('#drawer');
    if (d.classList.contains('on') && e.key === 'Tab') {
      const els = $$('button:not([disabled]),a[href],input,select,textarea,[tabindex]:not([tabindex="-1"])', d).filter((x) => x.offsetParent !== null);
      if (els.length) { const first = els[0], last = els[els.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } }
    }
    if (o.classList.contains('on') && e.key === 'Tab') {
      const els = $$('button:not([disabled]),a[href],input,select,textarea,[tabindex]:not([tabindex="-1"])', o).filter((x) => x.offsetParent !== null);
      if (els.length) { const first = els[0], last = els[els.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } }
    }
    if (e.key === 'Escape') { if (LH.tourActive) LH.endTour(true); else if (o.classList.contains('on')) LH.closeModal(); else if ($('#drawer').classList.contains('on')) LH.A.closeask(); else hideSearch(); }
  });

  LH.docModal = (id) => {
    const r = D.ev[id];
    if (!r) { LH.modal('<h2>' + esc(id) + '</h2><div class="note empty">Evidence not available in the current dataset.</div>'); return; }
    const used = LH.links.filter((l) => l.directA.includes(id) || l.contextA.includes(id));
    const shared = D.shared.filter((x) => x.evidence.includes(id));
    const rej = D.rejected.filter((x) => x.evidence.includes(id)).concat(D.unresolved.filter((x) => x.evidence.includes(id)));
    let h = '<div class="crumb">Evidence record</div><h2>' + esc(id) + ' · ' + esc(r.title) + '</h2>';
    h += '<div class="row mt8">' + '<span class="pill neutral">' + esc(r.type) + '</span><span class="pill neutral">' + esc(r.date) + '</span><span class="pill ' + (r.status.startsWith('Current') ? 'green' : 'neutral') + '">' + esc(r.status) + '</span><span class="pill neutral">Source family ' + esc(r.fam) + '</span></div>';
    h += '<div class="quote mt12">“' + esc(r.detail) + '”</div><div class="xs muted">Verbatim from the case Relationship Evidence sheet.</div>';
    if (used.length) h += '<h4 class="mt16 mb8">What this record supports</h4>' + used.map((l) => '<div class="small mb8"><b>' + esc(l.id) + '</b> · ' + esc(LH.name(l.seller)) + ' → ' + esc(LH.name(l.buyer)) + ' · ' + esc(l.comps) + ' ' + LH.statusPill(l.status) + '</div>').join('');
    if (shared.length) h += '<h4 class="mt16 mb8">Used in shared-dependency findings</h4>' + shared.map((x) => '<div class="small mb8"><b>' + x.id + '</b> · ' + esc(x.node) + '</div>').join('');
    if (rej.length) h += '<h4 class="mt16 mb8">Rejected or unresolved readings</h4>' + rej.map((x) => '<div class="small mb8"><b>' + x.id + '</b> · ' + esc(x.item) + '</div>').join('');
    h += '<div class="row mt16">' + LH.btn('Open in Evidence Center', 'evq', { q: id }, 'pri') + '</div>';
    LH.modal(h);
  };
  LH.srcModal = (id) => {
    const s = LH.srcById[id]; if (!s) return;
    const supplied = !s.url;
    LH.modal('<div class="crumb">' + (supplied ? 'Source document · ' : 'External source · ') + esc(s.co) + '</div><h2>' + esc(s.title) + '</h2><div class="row mt8"><span class="pill amber">' + esc(s.type) + (supplied ? '' : ' (not independently verified)') + '</span><span class="pill neutral">' + (supplied ? esc(s.accessed) : 'Opened ' + esc(s.accessed)) + '</span><span class="pill neutral">Page date: ' + esc(s.pagedate || 'None shown') + '</span></div><p class="mt12">' + esc(s.supports) + '</p>' + (supplied ? '' : '<p>' + LH.link(s.url, s.url) + '</p><div class="note info">Public company information is company-claimed unless independently supported. This page is evidence about a real company; it is not proof about the fictional incumbent network.</div>'));
  };

  /* ---------- cross-filter context ---------- */
  LH.focus = (kind, id) => {
    const c = {}; c[kind] = id;
    if (kind === 'ev') { const ss = LH.eventSups(id); if (ss.length === 1) c.sup = ss[0].id; }
    LH.ctx = c; LH.renderCtx(); if (LH.onFocus) LH.onFocus();
  };
  LH.clearFocus = () => { LH.ctx = {}; LH.renderCtx(); if (LH.onFocus) LH.onFocus(); };
  LH.hl = () => {
    const c = LH.ctx; const out = { sups: new Set(), comps: new Set(), prods: new Set(), edges: new Set(), on: false, failed: [] };
    const addProp = (failed) => {
      const P = LH.propagate(failed); out.on = true; out.failed = failed;
      failed.forEach((f) => out.sups.add(f)); P.suppliers.forEach((x) => out.sups.add(x)); Object.keys(P.aff).forEach((x) => out.sups.add(x));
      P.comps.forEach((x) => out.comps.add(x)); P.prods.forEach((x) => out.prods.add(x)); P.edges.forEach((x) => out.edges.add(x));
      failed.forEach((f) => D.sup[f].comps.forEach((x) => out.comps.add(x)));
    };
    if (c.ev) { const f = LH.eventSups(c.ev).map((s) => s.id); if (f.length) addProp(f); }
    else if (c.sup) addProp([c.sup]);
    else if (c.zone) addProp(LH.zoneSups(c.zone).map((s) => s.id));
    else if (c.comp) {
      out.on = true; out.comps.add(c.comp); LH.compById[c.comp].prods.forEach((p) => out.prods.add(p));
      LH.supList.forEach((s) => { if (s.comps.includes(c.comp)) out.sups.add(s.id); });
      LH.links.forEach((l) => { if (l.compsA.includes(c.comp)) out.edges.add(l.id); });
    } else if (c.prod) {
      out.on = true; out.prods.add(c.prod); LH.compsOfProd(c.prod).forEach((x) => out.comps.add(x));
      LH.supList.forEach((s) => { if (s.prods.includes(c.prod)) out.sups.add(s.id); });
      LH.links.forEach((l) => { if (l.prodsA.includes(c.prod)) out.edges.add(l.id); });
    }
    return out;
  };
  LH.renderCtx = () => {
    const c = LH.ctx; const el = $('#ctxbar'); const keys = Object.keys(c);
    if (!keys.length) { el.innerHTML = ''; return; }
    let h = '<div class="ctx"><span class="lbl">Focus</span>';
    if (c.ev) {
      const e = LH.eventById[c.ev]; const ss = LH.eventSups(c.ev);
      h += '<b>' + c.ev + ' · ' + esc(e.head) + '</b>';
      if (ss.length) {
        const P = LH.propagate(ss.map((s) => s.id));
        h += '<span class="muted">Matched</span>' + ss.map((s) => LH.chipSup(s.id)).join('');
        h += '<span class="muted">Components</span>' + P.comps.map(LH.chipComp).join('') + '<span class="muted">Products</span>' + P.prods.map(LH.chipProd).join('');
        const al = [...new Set(ss.flatMap((s) => LH.altsFor(s.id)))]; if (al.length) h += '<span class="muted">Alternates</span>' + al.map(LH.chipAlt).join('');
      } else h += '<span class="muted">Not matched to any supplier: ' + esc(LH.EVX[c.ev].label || 'ignored') + '</span>';
    } else if (c.sup) {
      const s = D.sup[c.sup]; const P = LH.propagate([c.sup]);
      h += '<b>' + esc(s.short) + '</b> ' + LH.rk(s) + ' ' + LH.riskPill(s.band) + ' ' + LH.confPill(s.conf);
      h += '<span class="muted">Components</span>' + s.comps.map(LH.chipComp).join('') + '<span class="muted">Products</span>' + P.prods.map(LH.chipProd).join('');
      if (s.events.length) h += '<span class="muted">Signals</span>' + s.events.map((e) => LH.chipEv(e.id)).join('');
      const al = LH.altsFor(s.id); if (al.length) h += '<span class="muted">Alternates</span>' + al.map(LH.chipAlt).join('');
      const docs = LH.docsFor(s.id).slice(0, 3); if (docs.length) h += '<span class="muted">Evidence</span>' + docs.map(LH.chipDoc).join('');
    } else if (c.comp) {
      const cm = LH.compById[c.comp];
      h += '<b>' + c.comp + ' ' + esc(cm.name) + '</b><span class="muted">Products</span>' + cm.prods.map(LH.chipProd).join('') + '<span class="muted">Tier-1</span>' + cm.t1.map((t) => LH.chipSup(t.id)).join('');
      const al = LH.alts.filter((a) => a.comps.includes(c.comp)); if (al.length) h += '<span class="muted">Alternates</span>' + al.map(LH.chipAlt).join('');
    } else if (c.prod) {
      const p = LH.prodById[c.prod];
      h += '<b>' + p.id + ' ' + esc(p.name) + '</b> <span class="muted">USD ' + p.rev + 'm annual product revenue</span><span class="muted">Components</span>' + p.comps.map(LH.chipComp).join('');
    } else if (c.zone) {
      h += '<b>Zone ' + c.zone + (c.zone === 'Z01' ? ' · East Delta' : '') + '</b><span class="muted">Network sites</span>' + LH.zoneSups(c.zone).map((s) => LH.chipSup(s.id)).join('');
    }
    h += '<button type="button" class="btn sm ghost x" data-act="clearfocus">Clear focus ✕</button></div>';
    el.innerHTML = h;
  };

  /* ---------- nav ---------- */
  const ICON = {
    overview: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="2.5" y="2.5" width="6" height="6" rx="1"/><rect x="11.5" y="2.5" width="6" height="6" rx="1"/><rect x="2.5" y="11.5" width="6" height="6" rx="1"/><rect x="11.5" y="11.5" width="6" height="6" rx="1"/></svg>',
    network: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="4" cy="10" r="2"/><circle cx="16" cy="4" r="2"/><circle cx="16" cy="16" r="2"/><path d="M6 9.2L14 5M6 10.8L14 15"/></svg>',
    risk: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M10 2.5l8 14H2z"/><path d="M10 8v4M10 14.2v.3"/></svg>',
    events: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M5 14V9a5 5 0 0110 0v5l1.5 2h-13z"/><path d="M8.5 18h3"/></svg>',
    sourcing: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="8.5" cy="8.5" r="5.5"/><path d="M12.5 12.5L18 18"/></svg>',
    scenario: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M7.5 2.5h5M8.5 2.5v5l-5 8.5a1 1 0 00.9 1.5h11.2a1 1 0 00.9-1.5l-5-8.5v-5"/></svg>',
    evidence: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M5 2.5h7l3.5 3.5v11.5H5z"/><path d="M12 2.5V6h3.5M7.5 10h5M7.5 13h5"/></svg>',
    method: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 4h14M3 10h14M3 16h9"/></svg>',
    help: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="10" cy="10" r="7.5"/><path d="M7.8 8a2.3 2.3 0 114 1.5c-.8.8-1.8 1.1-1.8 2.3M10 14.4v.2"/></svg>',
  };
  const NAV = [['overview', 'Overview'], ['network', 'Network'], ['risk', 'Risk'], ['events', 'Events'], ['sourcing', 'Sourcing'], ['scenario', 'Scenario Lab'], ['evidence', 'Evidence']];
  LH.renderNav = (cur) => {
    $('#nav').innerHTML = '<div class="brand"><b>LIGHTHOUSE</b><span>NOVADRIVE</span></div>' +
      NAV.map((n) => '<button type="button" class="nav-i ' + (cur === n[0] ? 'on' : '') + '" data-act="nav" data-to="' + n[0] + '" id="nav-' + n[0] + '"' + (cur === n[0] ? ' aria-current="page"' : '') + '>' + ICON[n[0]] + n[1] + '</button>').join('') +
      '<div class="nav-sp"></div><div class="nav-foot">' +
      '<button type="button" class="nav-i ' + (cur === 'methodology' ? 'on' : '') + '" data-act="nav" data-to="methodology">' + ICON.method + 'Methodology</button>' +
      '<button type="button" class="nav-i ' + (cur === 'help' ? 'on' : '') + '" data-act="nav" data-to="help">' + ICON.help + 'Help</button>' +
      '<div class="upd">Last updated<br><b style="color:#dfe6f5">' + esc(D.built) + '</b><br>Case data cut-off not stated (U11)</div></div>';
  };

  /* ---------- router ---------- */
  LH.parse = () => {
    const h = (location.hash || '#/overview').replace(/^#\/?/, '');
    const [path, qs] = h.split('?');
    const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
    const q = {}; (qs || '').split('&').filter(Boolean).forEach((p) => { const [k, v] = p.split('='); q[k] = decodeURIComponent(v || ''); });
    return { page: parts[0] || 'overview', a: parts[1], b: parts[2], q };
  };
  LH.go = (path) => { const h = '#/' + path; if (location.hash === h) LH.render(); else location.hash = h; };
  LH.render = (keepScroll) => {
    const r = LH.parse(); const fn = LH.pages[r.page] ? r.page : 'overview';
    LH.cur = r; const y = window.scrollY; tip.classList.remove('on');
    LH.renderNav(fn);
    $('#view').innerHTML = LH.pages[fn](r);
    if (LH.after[fn]) LH.after[fn](r);
    LH.renderCtx();
    if (keepScroll) window.scrollTo(0, y); else window.scrollTo(0, 0);
    document.title = 'Lighthouse · ' + ({ overview: 'Overview', network: 'Network', supplier: 'Supplier 360', risk: 'Risk', events: 'Events', sourcing: 'Sourcing', scenario: 'Scenario Lab', evidence: 'Evidence', methodology: 'Methodology', help: 'Help' }[fn] || '');
  };
  LH.rerender = () => LH.render(true);
  window.addEventListener('hashchange', () => { hideSearch(); LH.render(); });

  /* ---------- actions ---------- */
  const A = LH.A;
  A.nav = (d) => LH.go(d.to);
  A.sup = (d) => { LH.focus('sup', d.id); LH.go('supplier/' + d.id); };
  A.comp = (d) => { LH.focus('comp', d.id); if (!['network'].includes(LH.cur.page)) LH.go('network/components/' + d.id); else LH.rerender(); };
  A.prod = (d) => { LH.focus('prod', d.id); if (!['network'].includes(LH.cur.page)) LH.go('network'); else LH.rerender(); };
  A.ev = (d) => { LH.focus('ev', d.id); LH.go('events/' + d.id); };
  A.doc = (d) => LH.docModal(d.id);
  A.src = (d) => LH.srcModal(d.id);
  A.alt = (d) => { const a = LH.altById[d.id]; LH.focus('sup', a.replaces); LH.go('sourcing/' + a.replaces + '/' + d.id); };
  A.zone = (d) => { LH.focus('zone', d.id); LH.go('network/zones/' + d.id); };
  A.evq = (d) => { LH.closeModal(); LH.go('evidence?tab=' + (d.tab || 'rel') + '&q=' + encodeURIComponent(d.q)); };
  A.clearfocus = () => { LH.clearFocus(); LH.rerender(); };
  A.closemodal = () => LH.closeModal();
  A.sq = (d) => { const i = $('#q'); i.value = d.q; i.focus(); doSearch(); };
  A.trace = (d) => { LH.focus('sup', d.id); LH.net.mode = LH.net.mode === 'product' || LH.net.mode === 'component' ? LH.net.mode : 'supplier'; LH.net.full = true; LH.net.trace = d.id; LH.go('network/explorer'); };
  A.whatif = (d) => { LH.focus('sup', d.id); LH.go('scenario/' + d.id); };
  A.alts = (d) => { LH.focus('sup', d.id); LH.go('sourcing/' + d.id); };
  A.toggle = (d, el) => { const t = document.getElementById(d.target); if (t) { t.hidden = !t.hidden; if (el && d.label) el.textContent = t.hidden ? d.label : d.label2; } };
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-act]'); if (!t) return;
    const fn = A[t.dataset.act]; if (!fn) { console.warn('No action', t.dataset.act); return; }
    e.stopPropagation(); fn(t.dataset, t, e);
  });
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role="button"][data-act]')) { e.preventDefault(); e.target.click(); }
  });

  /* ---------- search ---------- */
  let SIDX = null, sSel = -1, sRes = [];
  function hideSearch() { $('#sres').classList.remove('on'); $('#q').setAttribute('aria-expanded', 'false'); $('#q').removeAttribute('aria-activedescendant'); sSel = -1; }
  function doSearch() {
    SIDX = SIDX || LH.searchIndex();
    const q = $('#q').value.trim().toLowerCase(); const box = $('#sres');
    if (!q) { hideSearch(); return; }
    const toks = q.split(/\s+/);
    const sc = SIDX.map((it) => {
      if (!toks.every((t) => it.hay.includes(t))) return null;
      let s = 0; const lab = it.label.toLowerCase();
      if (it.id.toLowerCase() === q || lab === q) s += 100; if (lab.startsWith(q) || it.id.toLowerCase().startsWith(q)) s += 50; if (lab.includes(q)) s += 20;
      s += { Supplier: 6, Component: 5, Product: 5, Event: 4, Alternate: 3, Zone: 2, Document: 1 }[it.type];
      return { it, s };
    }).filter(Boolean).sort((a, b) => b.s - a.s);
    const order = ['Supplier', 'Component', 'Product', 'Event', 'Alternate', 'Zone', 'Document'];
    sRes = []; let html = '';
    order.forEach((ty) => {
      const g = sc.filter((x) => x.it.type === ty).slice(0, ty === 'Document' ? 5 : 6);
      if (!g.length) return; html += '<div class="grp">' + ty + '</div>';
      g.forEach((x) => { html += '<div class="it" id="search-option-' + sRes.length + '" role="option" aria-selected="false" data-i="' + sRes.length + '"><b>' + esc(x.it.label) + '</b><span>' + esc(x.it.sub) + '</span></div>'; sRes.push(x.it); });
    });
    if (!sRes.length) html = '<div class="none">Nothing matched “' + esc($('#q').value) + '”. Try a supplier name, ORG ID, component (M10), product (P3) or event (EV-003).</div>';
    box.innerHTML = html; box.classList.add('on'); $('#q').setAttribute('aria-expanded', 'true'); sSel = sRes.length ? 0 : -1; paintSel();
  }
  function paintSel() { $$('#sres .it').forEach((e, i) => { e.classList.toggle('sel', i === sSel); e.setAttribute('aria-selected', i === sSel ? 'true' : 'false'); }); if (sSel >= 0) $('#q').setAttribute('aria-activedescendant', 'search-option-' + sSel); else $('#q').removeAttribute('aria-activedescendant'); }
  function pick(i) {
    const it = sRes[i]; if (!it) return; hideSearch(); $('#q').value = ''; $('#q').blur();
    const [k, id] = it.go;
    if (k === 'supplier') A.sup({ id }); else if (k === 'component') A.comp({ id }); else if (k === 'product') A.prod({ id }); else if (k === 'event') A.ev({ id });
    else if (k === 'doc') LH.go('evidence?tab=rel&q=' + encodeURIComponent(id)); else if (k === 'alt') A.alt({ id }); else if (k === 'zone') A.zone({ id });
  }
  $('#q').addEventListener('input', doSearch);
  $('#q').addEventListener('focus', () => { if ($('#q').value) doSearch(); });
  $('#q').addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); sSel = Math.min(sRes.length - 1, sSel + 1); paintSel(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sSel = Math.max(0, sSel - 1); paintSel(); }
    else if (e.key === 'Enter') { e.preventDefault(); pick(sSel < 0 ? 0 : sSel); }
  });
  $('#q').setAttribute('aria-controls', 'sres'); $('#q').setAttribute('aria-expanded', 'false'); $('#q').setAttribute('role', 'combobox');
  $('#sres').setAttribute('role', 'listbox'); $('#sres').setAttribute('aria-label', 'Search suggestions');
  $('#sres').addEventListener('mousedown', (e) => { const it = e.target.closest('.it'); if (it) { e.preventDefault(); pick(+it.dataset.i); } });
  document.addEventListener('click', (e) => { if (!e.target.closest('.search')) hideSearch(); });
  document.addEventListener('keydown', (e) => { if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); $('#q').focus(); } });
})();
