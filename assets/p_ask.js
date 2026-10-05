/* Ask Lighthouse - grounded Q&A over the dashboard's own data and logic. NOT a live language model. */
(function () {
  'use strict';
  const LH = window.LH, D = LH.D, esc = LH.esc, A = LH.A, $ = LH.$;
  const NO_ALT = 'No qualified candidate identified from the current evidence.';
  LH.ask = { log: [] };

  const QUICK = [
    'Why is IonPeak high risk?',
    'What products depend on Jade?',
    'What happens if IonPeak fails?',
    'Which risks should we verify?',
    'Which events affect Z01?',
    'Why was EV-004 ignored?',
    'Which alternatives exist for Meridian?',
  ];

  /* ---------- entity extraction ---------- */
  const ALIAS = [];
  LH.supList.forEach((s) => {
    const first = s.short.split(/\s+/)[0].toLowerCase();
    ALIAS.push([s.id.toLowerCase(), s.id]);
    ALIAS.push([s.short.toLowerCase(), s.id]);
    if (first.length >= 4) ALIAS.push([first, s.id]);
  });
  ALIAS.sort((a, b) => b[0].length - a[0].length);
  function findSup(q) {
    const t = q.toLowerCase();
    for (const [k, id] of ALIAS) { if (new RegExp('(^|[^a-z0-9])' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^a-z0-9])').test(t)) return D.sup[id]; }
    const n = t.replace(/[^a-z0-9]/g, '');
    if (n.includes('ionpeak')) return D.sup[LH.KEY.ion];
    return null;
  }
  const findEv = (q) => { const m = q.match(/ev[-\s]?0*(\d{1,3})/i); if (!m) return null; const id = 'EV-' + String(m[1]).padStart(3, '0'); return LH.eventById[id] ? id : 'EV-' + String(m[1]).padStart(3, '0'); };
  const findComp = (q) => { const m = q.match(/\b([mchb]\d{2})\b/i); return m && LH.compById[m[1].toUpperCase()] ? m[1].toUpperCase() : null; };
  const findProd = (q) => { const m = q.match(/\b(p[123])\b/i); return m ? m[1].toUpperCase() : null; };
  const findZone = (q) => { const m = q.match(/\bz0?([1-8])\b/i); return m ? 'Z0' + m[1] : null; };

  /* ---------- answer building ---------- */
  const sec = (t, h) => '<div class="sec"><h5>' + t + '</h5>' + h + '</div>';
  const ul = (a) => '<ul style="margin:0 0 0 18px;padding:0">' + a.map((x) => '<li>' + x + '</li>').join('') + '</ul>';
  const docs = (id, n) => { const d = LH.docsFor(id).slice(0, n || 5); return d.length ? d.map(LH.chipDoc).join(' ') : '<span class="muted">Evidence not available in the current dataset.</span>'; };
  function card(q, parts) {
    return { q, html: (parts.answer ? sec('Answer', parts.answer) : '') + (parts.numbers ? sec('Key numbers', parts.numbers) : '') + (parts.affected ? sec('Affected', parts.affected) : '') +
      (parts.conf ? sec('Confidence', parts.conf) : '') + (parts.evidence ? sec('Evidence', parts.evidence) : '') + (parts.action ? sec('Recommended action', parts.action) : '') + (parts.btns ? '<div class="rowbtns mt12">' + parts.btns + '</div>' : '') };
  }
  const supBtns = (s) => LH.btn('Open Supplier 360', 'sup', { id: s.id }, 'pri') + LH.btn('Trace impact', 'trace', { id: s.id }) + LH.btn('Find alternatives', 'alts', { id: s.id });

  function aWhy(q, s) {
    const act = LH.action(s);
    const dims = LH.DIM.map((d, i) => ({ id: d[0], n: d[1], v: s.d[i] })).sort((a, b) => b.v - a.v);
    return card(q, {
      answer: '<b>' + esc(s.short) + '</b> scores <b>' + LH.pct1(s.overall) + '</b> (' + s.band + ' risk) with <b>' + s.conf + ' confidence</b>. Main driver: ' + esc(s.driver) + '.',
      numbers: ul(dims.slice(0, 3).map((d) => d.id + ' ' + esc(d.n) + ': <b>' + d.v.toFixed(1) + '</b> / 100')) + '<div class="xs muted mt8">Score is network-wide; confidence never changes the risk percentage.</div>',
      affected: 'Components ' + s.comps.map(LH.chipComp).join(' ') + ' · products ' + s.prods.map(LH.chipProd).join(' ') + ' · ' + LH.usd(s.rev) + ' annual product revenue behind this dependency (context, not a loss estimate).',
      conf: LH.confPill(s.conf) + ' <span class="small">' + esc(LH.CONF[s.conf]) + '</span>',
      evidence: docs(s.id),
      action: '<b>' + esc(act.label) + '</b>: ' + esc(act.short), btns: supBtns(s),
    });
  }
  function aProducts(q, s) {
    return card(q, {
      answer: s.prods.length ? '<b>' + esc(s.short) + '</b> sits behind ' + s.prods.map((p) => LH.prodById[p].name + ' (' + p + ')').join(', ') + ' through ' + s.comps.join(', ') + '.' : 'No product dependency is recorded for ' + esc(s.short) + '.',
      numbers: '<b>' + LH.usd(s.rev) + '</b>: Annual NovaDrive product revenue behind the ' + esc(s.short) + ' dependency (' + s.revpct + '% of ' + LH.usd(LH.TOTAL) + '). This is product revenue, not spend or revenue at risk.',
      affected: s.prods.map(LH.chipProd).join(' ') + ' ' + s.comps.map(LH.chipComp).join(' '),
      conf: LH.confPill(s.conf), evidence: docs(s.id), action: esc(LH.action(s).short), btns: supBtns(s),
    });
  }
  function aImpact(q, s) {
    const R = LH.scenario(s.id, 'shutdown', 12, false); const P = R.base;
    return card(q, {
      answer: LH.simBanner() + 'If ' + esc(s.short) + ' stopped supplying, the disruption reaches ' + (P.tier1.length ? P.tier1.map(LH.chipSup).join(' ') : 'no Tier-1 supplier') + ' and components ' + (P.comps.length ? P.comps.map(LH.chipComp).join(' ') : 'none') + '.',
      numbers: ul(['Suppliers touched: <b>' + P.suppliers.length + '</b>', 'Products: <b>' + (P.prods.join(', ') || 'none') + '</b>', 'Annual product revenue context: <b>' + LH.usd(P.rev) + '</b> (' + P.revPct + '%), not a loss estimate', 'Indicative replacement lead time: <b>' + s.weeks + ' weeks</b>']),
      affected: P.noSpare.length ? 'Components with no spare Tier-1 source disclosed: ' + P.noSpare.map(LH.chipComp).join(' ') + ' <span class="muted">(No backup disclosed)</span>' : 'Every affected component keeps at least one Tier-1 source that is not on the path.',
      conf: LH.confPill(s.conf) + ' <span class="small">Simulation follows confirmed links' + (s.status === 'Inferred' ? ' and one inferred link (verification required)' : '') + '; it does not model inventory or recovery.</span>',
      evidence: docs(s.id), action: esc(LH.action(s).short),
      btns: LH.btn('Open in Scenario Lab', 'whatif', { id: s.id }, 'pri') + LH.btn('Trace in network', 'trace', { id: s.id }),
    });
  }
  function aHighLow(q) {
    const xs = LH.supList.filter((s) => s.band === 'High' && s.conf === 'Low');
    return card(q, {
      answer: xs.length ? '<b>' + xs.length + '</b> suppliers score High but have Low confidence. Validate the relationship and missing evidence, then re-score and decide whether to act or monitor.' : 'No supplier currently scores High with Low confidence.',
      numbers: xs.length ? ul(xs.map((s) => LH.chipSup(s.id) + ' ' + LH.pct1(s.overall) + ' · ' + s.tier + ' · ' + esc(s.status === 'Inferred' ? 'Relationship inferred — verification required.' : 'Information gap'))) : '',
      conf: 'Low confidence means key information is missing or the link is inferred. It never changes the risk percentage.',
      evidence: xs.length ? xs.slice(0, 3).map((s) => docs(s.id, 2)).join(' ') : '',
      action: xs.length ? 'VALIDATE EVIDENCE → RE-SCORE → DECIDE.' : '',
      btns: LH.btn('Open Risk view', 'nav', { to: 'risk' }, 'pri'),
    });
  }
  function aIgnored(q, id) {
    const e = LH.eventById[id]; const x = LH.EVX[id];
    if (!e) return card(q, { answer: 'Evidence not available in the current dataset for ' + esc(id) + '. The case file lists events EV-001 to EV-010 (some numbers are absent).', evidence: '<span class="muted">Evidence not available in the current dataset.</span>' });
    if (x.kind === 'matched') return card(q, { answer: id + ' was <b>not ignored</b>. It matched the network: ' + esc(e.why), numbers: 'Status ' + x.status + ' · severity ' + e.sev, action: ul(x.action.map(esc)), btns: LH.btn('Open event', 'ev', { id }, 'pri') });
    return card(q, {
      answer: id + ' (“' + esc(e.head) + '”) was screened out: <b>' + esc(x.label) + '</b>. ' + esc(e.why),
      numbers: 'Entity named in the event: ' + esc(x.entity) + '. It did not change any risk score.',
      conf: 'Events are matched by supplier ID, site or zone, never by similar names.',
      evidence: LH.chip(id, 'evq', { q: id, tab: 'ev' }), action: ul(x.action.map(esc)), btns: LH.btn('Open event', 'ev', { id }, 'pri'),
    });
  }
  function aAlts(q, s) {
    const al = LH.altsFor(s.id);
    if (!al.length) return card(q, { answer: NO_ALT + ' Lighthouse has no shortlisted alternate for ' + esc(s.short) + '.', conf: 'Not assessed does not mean none exist.', action: 'Ask sourcing to run a supplier search for ' + esc(s.short) + '.', btns: LH.btn('Open Sourcing', 'alts', { id: s.id }, 'pri') });
    const gate = (a) => !a.userProvided && ['tech', 'app'].every((k) => ['Strong', 'Partial'].includes(a.ratings[k].r));
    const evidenceBasis = al.some((a) => a.userProvided) ? 'PDF-listed options are user-provided leads, not independently checked; original Phase 2 options are company-claimed and also not independently verified.' : 'Ratings are company-claimed from company pages and are not independently verified.';
    return card(q, {
      answer: al.length + ' shortlisted candidate' + (al.length > 1 ? 's' : '') + ' for ' + esc(s.short) + ': ' + al.map((a) => '<b>' + esc(a.short) + '</b> (' + a.role.toLowerCase() + ')').join(', ') + '. Shortlisted candidate — sourcing and engineering validation required.',
      numbers: ul(al.map((a) => esc(a.short) + ': ' + esc(LH.altTiming(a)) + (a.userProvided ? ' · fit not assessed' : ' · fit gate ' + (gate(a) ? 'passed' : 'not passed')))),
      conf: evidenceBasis + (s.id === LH.KEY.ion ? ' PolarSwitch is a prospective alternative only and has not been assessed.' : ''),
      evidence: al.map((a) => LH.chipAlt(a)).join(' '), action: 'Open validation points with sourcing and engineering before any commitment.',
      btns: LH.btn('Open Sourcing', 'alts', { id: s.id }, 'pri'),
    });
  }
  function aShortest(q) {
    const al = LH.alts.filter((a) => !a.userProvided).slice().sort((a, b) => a.weeks - b.weeks);
    const f = al[0];
    return card(q, {
      answer: 'Among the four researched candidates, the shortest indicative case qualification reference is <b>' + esc(f.short) + '</b> at <b>' + f.weeks + ' weeks</b> (replacing ' + esc(LH.name(f.replaces)) + '). ' + (al.filter((a) => a.weeks === f.weeks).length > 1 ? 'Others tie at that duration. ' : '') + 'PDF-listed candidates do not have candidate-specific timing in the source list.',
      numbers: ul(al.map((a) => esc(a.short) + ' → ' + esc(LH.name(a.replaces)) + ': <b>' + esc(LH.altTiming(a)) + '</b> <span class="xs muted">' + esc(a.weeks_note || '') + '</span>')),
      conf: 'Lead times come from the case component context, not from the candidates. PDF-listed leads have no candidate-specific lead time; CeramTec’s 16 weeks is a parent-component stand-in.',
      evidence: al.map((a) => LH.chipAlt(a)).join(' '), action: 'Start the shortest-lead candidate first if qualification must run in parallel.', btns: LH.btn('Open Sourcing', 'nav', { to: 'sourcing' }, 'pri'),
    });
  }
  function aChoke(q, s) {
    const ds = LH.docsFor(s.id);
    return card(q, {
      answer: s.single_why ? esc(s.single_why) + '.' : 'Evidence for ' + esc(s.short) + ' as a concentration point is limited in the current dataset.',
      numbers: ul(['Components: ' + s.comps.join(', '), 'Tier-1 suppliers reached: ' + s.t1, 'Single-point share: ' + s.single + '%', 'Products: ' + s.prods.join(', ') + ' (' + LH.usd(s.rev) + ')']),
      conf: LH.confPill(s.conf) + ' <span class="small">' + esc(LH.CONF[s.conf]) + '</span>',
      evidence: ds.length ? ds.map(LH.chipDoc).join(' ') : '<span class="muted">Evidence not available in the current dataset.</span>',
      action: esc(LH.action(s).short), btns: LH.btn('Show evidence', 'evq', { q: s.id, tab: 'rel' }, 'pri') + LH.btn('Open Supplier 360', 'sup', { id: s.id }),
    });
  }
  function aSingle(q) {
    const rows = LH.comps.map((c) => ({ c, st: LH.singleStatus(c) }));
    return card(q, {
      answer: 'No component has two independent disclosed sources. “No backup disclosed” means the data shows none, not that none exists.',
      numbers: ul(rows.map((r) => LH.chipComp(r.c.id) + ' ' + esc(r.c.name) + ': <b>' + esc(r.st.t) + '</b>. ' + esc(r.st.d))),
      conf: 'Planning allocation shares are not purchase history.', evidence: '<span class="chip static">DOC-075</span> <span class="chip static">DOC-078</span> <span class="chip static">DOC-079</span>',
      action: 'Treat M10, M20 and B10 as concentrated; ask for confirmed alternates.', btns: LH.btn('Open Components', 'nav', { to: 'network/components' }, 'pri'),
    });
  }
  function aZone(q, z) {
    const ss = LH.zoneSups(z);
    if (!ss.length) return card(q, { answer: 'No network site is recorded in ' + z + '.', evidence: '<span class="muted">Evidence not available in the current dataset.</span>' });
    const P = LH.propagate(ss.map((s) => s.id));
    return card(q, {
      answer: '<b>' + ss.length + '</b> network sites sit in zone ' + z + (z === 'Z01' ? ' (East Delta)' : '') + '. Zone maps are illustrative.' + (z === 'Z01' ? ' EV-001 is a flood <b>watch</b> for this zone. No damage or shutdown is confirmed.' : ''),
      numbers: ul(ss.map((s) => LH.chipSup(s.id) + ' · ' + s.tier + ' · ' + LH.riskPill(s.band) + ' · ' + esc(s.cap))),
      affected: 'Components ' + (P.comps.map(LH.chipComp).join(' ') || 'none') + ' · products ' + (P.prods.map(LH.chipProd).join(' ') || 'none') + ' · ' + LH.usd(P.rev) + ' annual product revenue context (not a loss estimate).',
      conf: 'Zone is a site attribute; link status per supplier is shown in Supplier 360.',
      evidence: z === 'Z01' ? LH.chipEv('EV-001') : '<span class="muted">No matched event.</span>', action: z === 'Z01' ? 'Verify facility continuity, inventory cover and logistics routes at the Z01 sites.' : 'Monitor.',
      btns: LH.btn('Open zone map', 'zone', { id: z }, 'pri') + LH.btn('Simulate zone event', 'whatif', { id: ss[0].id }),
    });
  }
  function aComp(q, id) {
    const c = LH.compById[id]; const st = LH.singleStatus(c);
    return card(q, {
      answer: '<b>' + id + ' ' + esc(c.name) + '</b> feeds ' + c.prods.join(', ') + ' (' + LH.usd(c.rev) + ' annual product revenue). Status: <b>' + esc(st.t) + '</b>. ' + esc(st.d),
      numbers: ul(['Tier-1: ' + c.t1.map((t) => esc(LH.name(t.id)) + ' ' + t.share + '%').join(', '), 'Indicative qualification time: ' + c.weeks + ' weeks', 'Upstream dependencies: ' + (c.deps.length ? c.deps.map(LH.chipSup).join(' ') : 'none disclosed')]),
      conf: 'Allocation is a planning share, not purchase history.', evidence: docs(c.t1[0].id, 4), btns: LH.btn('Open component', 'comp', { id }, 'pri'),
    });
  }
  function aProd(q, id) {
    const p = LH.prodById[id];
    return card(q, {
      answer: '<b>' + id + ' ' + esc(p.name) + '</b> carries ' + LH.usd(p.rev) + ' of annual NovaDrive product revenue and uses ' + p.comps.join(', ') + '.',
      numbers: '<div class="small">This is product revenue (context), not supplier spend.</div>', affected: p.comps.map(LH.chipComp).join(' '),
      btns: LH.btn('Show in network', 'prod', { id }, 'pri'),
    });
  }

  /* ---------- router ---------- */
  function answer(q) {
    const t = q.toLowerCase(); const s = findSup(q); const ev = findEv(q); const c = findComp(q); const z = findZone(q); const p = findProd(q);
    if (ev && /(ignor|why|screen|discard|filtered|drop)/.test(t) && !/matched|affect/.test(t)) return aIgnored(q, ev);
    if (/single[\s-]*source|sole[\s-]*source|single point|no backup/.test(t)) return aSingle(q);
    if (z && /(expos|suppl|site|in |zone|flood|region)/.test(t)) return aZone(q, z);
    if (/low[\s-]*confidence|thin evidence|weak evidence/.test(t) && /(high|risk|score)/.test(t)) return aHighLow(q);
    if (/(shortest|fastest|quickest|least).*(qualif|time|week)|qualification time/.test(t) && !s) return aShortest(q);
    if (s && /(alternat|replac|backup|substitut|second source|other supplier)/.test(t)) return aAlts(q, s);
    if (s && /(fail|shut|stop|disrupt|go down|goes down|lose|outage|what happens|what if)/.test(t)) return aImpact(q, s);
    if (s && /(product|depend|revenue|affect|reach)/.test(t)) return aProducts(q, s);
    if (s && /(evidence|choke|support|prove|proof|why.*(critical|important)|bottleneck)/.test(t)) return aChoke(q, s);
    if (s && /(why|risk|score|high|driver|rank|explain)/.test(t)) return aWhy(q, s);
    if (/alternat/.test(t) && /(qualif|time|week)/.test(t)) return aShortest(q);
    if (ev) return aIgnored(q, ev);
    if (s) return aWhy(q, s);
    if (c) return aComp(q, c);
    if (p) return aProd(q, p);
    if (z) return aZone(q, z);
    if (/(high.?risk|highest|top risk|riskiest)/.test(t)) {
      const top = LH.supList.filter((x) => x.band === 'High');
      return card(q, { answer: top.length + ' suppliers are in the High band (≥ 54.3): ' + top.map((x) => LH.chipSup(x.id) + ' ' + LH.pct1(x.overall)).join(' '), conf: 'Check confidence before acting; see “high risk but low confidence”.', btns: LH.btn('Open Risk view', 'nav', { to: 'risk' }, 'pri') });
    }
    return { q, html: '<div class="sec"><div class="note info">I can’t ground an answer to that from the current dataset. Ask Lighthouse answers a fixed set of question types about suppliers, components, products, events, alternates and zones. Try one of these, or name a supplier, component (M10), product (P3), event (EV-003) or zone (Z01).</div></div>' };
  }

  /* ---------- drawer ---------- */
  function paintLog() {
    const el = $('#asklog'); if (!el) return;
    el.innerHTML = LH.ask.log.map((a) => '<div class="ans"><div class="q">' + esc(a.q) + '</div>' + a.html + '</div>').join('');
    const db = $('#drawer .db'); if (db) db.scrollTop = db.scrollHeight;
  }
  function paintDrawer() {
    const qq = '<div class="qq">' + QUICK.map((q) => '<button type="button" data-act="askq" data-q="' + esc(q) + '">' + esc(q) + '</button>').join('') + '</div>';
    $('#drawer').innerHTML = '<div class="dh"><div style="flex:1"><b id="ask-title" style="font-size:17px">Ask Lighthouse</b><div class="xs muted">Grounded answers from this dashboard’s data. Not a live AI model.</div></div><button type="button" class="btn ghost" data-act="closeask" aria-label="Close">✕</button></div>' +
      '<div class="db"><p class="small muted" style="margin:0 0 4px">Answers use the same scores, links and evidence you see elsewhere, and always show their evidence. If a question can’t be grounded, Lighthouse says so.</p><div class="xs muted">Quick questions</div>' + qq + '<div id="asklog"></div></div>' +
      '<form class="df" id="askform" autocomplete="off"><div class="row"><input id="askin" type="text" placeholder="Ask about a supplier, component, event or zone" aria-label="Ask Lighthouse" style="flex:1;padding:9px 12px;border:1px solid var(--line);border-radius:8px;font:inherit"><button type="submit" class="btn pri">Ask</button></div></form>';
    paintLog();
    $('#askform').addEventListener('submit', (e) => { e.preventDefault(); const i = $('#askin'); if (i.value.trim()) { run(i.value.trim()); i.value = ''; } });
  }
  function run(q) { LH.ask.log.push(answer(q)); paintLog(); }
  let askReturnFocus = null;
  A.ask = (data, trigger) => {
    const d = $('#drawer'); if (!d.dataset.ready) { paintDrawer(); d.dataset.ready = '1'; }
    askReturnFocus = trigger || document.activeElement; d.inert = false; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-labelledby', 'ask-title');
    d.classList.add('on'); d.setAttribute('aria-hidden', 'false'); setTimeout(() => { const i = $('#askin'); if (i) i.focus(); }, 60);
  };
  A.closeask = () => { const d = $('#drawer'); d.classList.remove('on'); d.setAttribute('aria-hidden', 'true'); d.inert = true; if (askReturnFocus && askReturnFocus.isConnected) askReturnFocus.focus(); askReturnFocus = null; };
  A.askq = (d) => { A.ask(); run(d.q); };
  LH.askRun = (q) => { A.ask(); run(q); };
})();
