/* Screen 3 - Supplier 360 */
(function () {
  'use strict';
  const LH = window.LH, D = LH.D, esc = LH.esc;
  const DIM = [
    ['D1', 'Financial & operational health', 'How financially and operationally healthy is the supplier itself?'],
    ['D2', 'Location & systemic exposure', 'How exposed is its location to hazards, logistics friction and infrastructure failure?'],
    ['D3', 'Network dependence', 'How many Tier-1 suppliers fail together with it, and is there a second source?'],
    ['D4', 'Business criticality & substitutability', 'How much product revenue sits behind it, and how long would a replacement take?'],
    ['D5', 'Dynamic external threats', 'Is a matched external event active?'],
    ['D6', 'Information gap', 'How much of the data needed to judge this supplier is missing?'],
  ];
  LH.DIM = DIM;
  const W = D.meta.weights;
  const f1 = (x) => (Math.round(x * 10) / 10).toFixed(1);

  LH.driverExplain = function (s, i) {
    const v = s.d[i];
    let h = '<b>' + DIM[i][0] + ' = ' + f1(v) + ' / 100</b> <span class="muted">(100 = riskiest)</span>';
    if (i === 0) {
      const ok = s.subs.filter((x) => x[2] != null);
      h += '<ul>' + s.subs.map((x) => '<li>' + esc(x[0]) + ': ' + (x[1] == null ? '<b>Not shown</b> (not provided in the case data)' : '<b>' + x[1] + '</b> → ' + f1(x[2]) + ' <span class="muted">(' + x[3] + ')</span>') + '</li>').join('') + '</ul>';
      h += '<div class="xs muted">D1 is the average of the ' + ok.length + ' available sub-scores, each scaled between the lowest and highest value in the network.' + (ok.length < 4 ? ' Financials are missing, so D1 uses the two on-time sub-scores only. Missing data is penalised in D6, not treated as healthy.' : '') + '</div>';
    } else if (i === 1) {
      h += '<ul><li>Physical hazard index: <b>' + s.idx[0] + '</b></li><li>Logistics friction index: <b>' + s.idx[1] + '</b></li><li>Infrastructure index: <b>' + s.idx[2] + '</b></li></ul><div class="xs muted">D2 is the average of the three indices for zone ' + s.zone + (s.zone === 'Z01' ? ' (East Delta)' : '') + ', used as given. Zone Z01 has the highest values in the network.</div>';
    } else if (i === 2) {
      const a = (s.t1 - 1) / 2 * 100;
      h += '<ul><li>Tier-1 suppliers that fail together with it: <b>' + s.t1 + '</b> → ' + f1(a) + ' (1 = 0, 3 = 100' + (s.parent_pair ? '; Aster and Boreal count as 2 because they share a parent' : '') + ')</li>' +
        '<li>Share of component supply routed through it: <b>' + s.exposed + '%</b> <span class="muted">(planning allocation, not purchase history)</span></li>' +
        '<li>Single-source level: <b>' + s.single + '</b> <span class="muted">(100 = no alternative in the data, 50 = not stated or one parent, 0 = second independent Tier-1)</span><br><span class="muted">' + esc(s.single_why) + '</span></li></ul><div class="xs muted">D3 is the average of the three. It carries the highest weight (30%) because the case is about hidden upstream dependencies.</div>';
    } else if (i === 3) {
      h += '<ul><li>Product revenue behind it: <b>' + LH.usd(s.rev) + '</b> = ' + f1(s.rev / LH.TOTAL * 100) + '% of USD 1,560m (products ' + s.prods.join(', ') + ')</li><li>Weeks to qualify a replacement: <b>' + s.weeks + '</b> of the 16-week maximum → ' + f1(s.weeks / 16 * 100) + '</li></ul><div class="xs muted">D4 is the average of the two. Revenue is product revenue, not supplier spend.</div>';
    } else if (i === 4) {
      h += s.events.length ? '<ul>' + s.events.map((e) => '<li>' + LH.chipEv(e.id) + ' severity <b>' + e.sev + '</b> · ' + esc(LH.eventById[e.id].head) + '</li>').join('') + '</ul><div class="xs muted">D5 uses the highest matched severity. Severity levels (40 zone watch, 60 supplier-specific report, 100 confirmed disruption) are assumptions.</div>' : '<ul><li>No matched external event.</li></ul><div class="xs muted">Duplicates, stale items and different-company events are excluded. “No event” means no <i>matched</i> event, not that nothing can happen.</div>';
    } else {
      const miss = s.missing_fields;
      h += '<ul><li>Assurance gap index: <b>' + (s.ass == null ? 'Not shown (scored 100)' : s.ass) + '</b></li><li>Indicator fields missing: <b>' + miss.length + ' of 8</b> → ' + f1(miss.length / 8 * 100) + (miss.length ? '<br><span class="muted">' + esc(miss.join(', ')) + '</span>' : '') + '</li></ul><div class="xs muted">D6 is the average of the two. Missing information raises risk; it never lowers it. Link evidence strength is not scored here: it shows only in Confidence.</div>';
    }
    return h;
  };

  const kv = (a, b) => '<div class="res" style="padding:10px 14px"><span>' + a + '</span><div style="font-weight:600;font-size:16px;margin-top:2px">' + b + '</div></div>';

  LH.pages.supplier = function (r) {
    const s = D.sup[r.a];
    if (!s) return LH.pageH('Supplier 360', 'Supplier not found.') + LH.empty('No supplier matches “' + (r.a || '') + '”. Use the search above.');
    const a = LH.action(s); const P = LH.propagate([s.id]); const alts = LH.altsFor(s.id);
    const t1n = P.tier1.filter((i) => i !== s.id);
    let h = '<div class="crumb"><a href="#/risk">Risk</a> › Supplier 360</div>';
    h += '<div class="panel" style="padding:22px 26px"><div class="row" style="align-items:flex-start;gap:20px"><div style="flex:1;min-width:260px"><h1>' + esc(s.name) + '</h1><div class="muted small mt8">' + LH.tierTxt(s) + ' · ' + s.id + ' · ' + s.site + ' · Zone ' + s.zone + (s.zone === 'Z01' ? ' (East Delta)' : '') + ' · ' + esc(s.cap || '') + '</div><div class="row mt12">' + LH.statusPill(s.status) + LH.riskPill(s.band) + LH.confPill(s.conf) + LH.help(LH.CONF[s.conf], s.conf + ' confidence') + '</div></div>' +
      '<div style="text-align:right"><div class="muted xs">Overall risk (rank ' + s.rank + ' of 24)</div><div class="hero-n num" style="color:' + (s.band === 'High' ? 'var(--red)' : s.band === 'Medium' ? 'var(--amber)' : 'var(--ink)') + '">' + LH.pct1(s.overall) + '</div></div></div>' +
      '<hr class="l"><div class="supplier-action"><div><span class="muted small">Recommended action</span><h2>' + esc(a.label) + '</h2><p>' + esc(a.short) + '</p></div>' + LH.btn(a.label === 'VERIFY FIRST' || a.label === 'VERIFY DATA' ? 'Review evidence' : 'Open sourcing options', a.label === 'VERIFY FIRST' || a.label === 'VERIFY DATA' ? 'evq' : 'alts', a.label === 'VERIFY FIRST' || a.label === 'VERIFY DATA' ? { q: s.id } : { id: s.id }, 'pri') + '</div>' +
      '<div class="row mt8">' + LH.btn('Why this action?', 'toggle', { target: 'whyact', label: 'Why this action?', label2: 'Hide' }, 'sm ghost') + '</div><div id="whyact" hidden class="whybox mt8">' + esc(a.why) + '<div class="small muted mt8">Scorecard v2 next step: “' + esc(s.next) + '”. Lighthouse action rules are listed in Methodology.</div></div>' +
      '<details class="adv supplier-more"><summary>Explore network, impact and simulation</summary><div class="body"><div class="rowbtns">' + LH.btn('View network', 'viewnet', { id: s.id }) + LH.btn('Trace impact', 'trace', { id: s.id }) + LH.btn('What happens if this fails?', 'propmodal', { id: s.id }) + LH.btn('Simulate disruption', 'whatif', { id: s.id }) + '</div></div></details></div>';

    h += '<div class="mt16">';
    // 1 why this matters
    const impactLine = (label, value) => '<div><span>' + label + '</span><b>' + value + '</b></div>';
    h += LH.acc(1, 'Why this matters', '<p style="font-size:16.5px;max-width:820px">' + esc(LH.whyMatters2(s)) + '</p><div class="supplier-scope">' +
      impactLine('Affected Tier-1s', t1n.length ? t1n.map((i) => LH.chipSup(i)).join(' ') : (s.tiern === 1 ? 'Itself (Tier-1)' : 'None')) +
      impactLine('Products', P.prods.map(LH.chipProd).join(' ') || 'None') + impactLine('Qualification', s.weeks + ' weeks indicative') +
      impactLine('Zone', s.zone + (s.zone === 'Z01' ? ' · East Delta · hazard 82' : ' · hazard ' + s.idx[0])) +
      '</div><div class="row mt12"><span class="muted small">Why should I trust this?</span> ' + (LH.docsFor(s.id).slice(0, 4).map(LH.chipDoc).join(' ') || '<span class="xs muted">Evidence not available in the current dataset.</span>') + LH.btn('View evidence', 'evq', { q: s.id }, 'sm') + '</div>', true);

    // 2 network position
    const sellRows = LH.sellLinks(s.id);
    const buyRows = LH.buyLinks(s.id);
    h += LH.acc(2, 'Network position', '<div class="grid" style="gap:16px"><div class="c6"><h4 class="mb8">What depends on this supplier?</h4>' +
      (sellRows.length ? sellRows.map((l) => '<div class="small mb8"><b>' + esc(LH.name(l.buyer)) + '</b> · ' + esc(l.comps) + ' · ' + LH.statusPill(l.status) + ' <span class="muted">' + l.id + ' · ' + l.fams + ' source ' + (l.fams === 1 ? 'family' : 'families') + '</span>' + (l.status === 'Inferred' ? '<div class="xs" style="color:var(--amber)">Relationship inferred — verification required.</div>' : '') + '</div>').join('') : LH.empty('No downstream link in the data.')) +
      '</div><div class="c6"><h4 class="mb8">Who supplies it?</h4>' +
      (buyRows.length ? buyRows.map((l) => '<div class="small mb8">' + LH.chipSup(l.seller) + ' · ' + esc(l.comps) + ' · ' + LH.statusPill(l.status) + ' <span class="muted">' + l.id + '</span></div>').join('') : '<div class="note empty">' + (s.tiern === 3 ? 'No supplier to this Tier-3 is described in the data (U5). Deeper tiers are not assumed.' : s.tiern === 1 ? 'Tier-1: see its Tier-2 suppliers in the network map.' : 'None in the data.') + '</div>') + '</div></div>' +
      (s.parent_pair ? '<div class="note info">Aster and Boreal are consolidated under one parent, CommonSpan Holdings (DOC-075), so they count as one alternative. ' + LH.chipDoc('DOC-075') + '</div>' : '') +
      '<div class="row mt8">' + LH.btn('Open in Network Explorer', 'viewnet', { id: s.id }, 'sm') + '</div>', false);

    // 3 business exposure
    const compRows = s.comps.map((c) => {
      const cm = LH.compById[c]; const t = cm.t1.find((x) => x.id === s.id);
      return '<tr><td>' + LH.chipComp(c) + ' ' + esc(cm.name) + '</td><td>' + cm.prods.map(LH.chipProd).join(' ') + '</td><td class="n">' + (t ? t.share + '% planning allocation' : '<span class="muted">Upstream of ' + cm.t1.map((x) => esc(LH.name(x.id))).join(' + ') + '</span>') + '</td><td class="n">' + cm.weeks + ' wk</td><td class="n">' + LH.usd(cm.rev) + '</td></tr>';
    }).join('');
    h += LH.acc(3, 'Business exposure', '<div class="t-wrap"><table class="t"><thead><tr><th>Component</th><th>Products</th><th>Planning allocation ' + LH.help('Planning allocation is not purchase history.') + '</th><th>Qualification</th><th>Revenue context ' + LH.help('Annual product revenue of the products using this component. Not supplier spend.') + '</th></tr></thead><tbody>' + compRows + '</tbody></table></div>' +
      '<div class="res-grid mt12" style="grid-template-columns:repeat(3,minmax(0,1fr))">' + kv('Products reached', P.prods.join(', ')) + kv('Annual product revenue behind it', '<b>' + LH.usd(P.rev) + '</b> (' + P.revPct + '%)') + kv('Single-source status', esc(s.single_why)) + '</div>' +
      '<div class="small muted mt8">' + (P.noSpare.length ? 'No backup disclosed for ' + P.noSpare.join(', ') + '. ' : '') + 'The data holds no supplier spend or inventory, so revenue is context, not exposure.</div><div class="row mt12">' + LH.btn('What happens if this fails?', 'propmodal', { id: s.id }, 'pri') + '</div>', false);

    // 4 risk drivers
    const sel = LH.drvSel[s.id] != null ? LH.drvSel[s.id] : -1;
    h += LH.acc(4, 'Why is this risky? ' + LH.help('Six dimensions, each 0–100 (100 = riskiest). Click a bar to see exactly why it is high or low.'), '<div id="drivers">' + drivers(s, sel) + '</div>' +
      LH.adv('How calculated?', 'Overall risk = 20% × D1 + 15% × D2 + 30% × D3 + 15% × D4 + 10% × D5 + 10% × D6<br><b>= ' + s.d.map((x, i) => '(' + W['D' + (i + 1)] + '% × ' + f1(x) + ')').join(' + ') + ' = ' + LH.pct1(s.overall_raw) + '</b><div class="xs muted mt8">Matches scorecard v2. Band: High ≥ 54.3, Medium ≥ 41.5, Low below (relative thirds of the 24 suppliers). Confidence never changes this percentage.</div>'), false);

    // 5 events
    const rel = { 'ORG-453': 'EV-007', 'ORG-439': 'EV-004', 'ORG-922': 'EV-009' }[s.id];
    h += LH.acc(5, 'Does any event affect it?', (s.events.length ? s.events.map((e) => { const ev = LH.eventById[e.id]; return '<div class="alert-card" role="button" tabindex="0" data-act="ev" data-id="' + e.id + '"><div class="id">' + e.id + ' · severity ' + e.sev + '</div><b>' + esc(ev.head) + '</b><div class="small">' + esc(ev.why) + '</div><div class="small muted mt8">Verify: ' + esc(ev.verify) + '</div></div>'; }).join('') : '<div class="note empty">No matched external event.</div>') +
      (rel ? '<div class="small mt8">Related, but ignored: ' + LH.chipEv(rel) + ' <b>' + esc(LH.EVX[rel].label) + '</b>. ' + esc(LH.eventById[rel].why) + '</div>' : ''), false);

    // 6 alternatives
    h += LH.acc(6, 'What could replace this source?', alts.length ? alts.map((x) => '<div class="mb8"><div class="row"><b>' + esc(x.name) + '</b> <span class="pill neutral">' + (x.userProvided ? 'SHORTLISTED ALTERNATE · QUALIFICATION REQUIRED' : x.role) + '</span> ' + LH.chipAlt(x) + '</div><div class="small mt8">' + esc(x.target) + ' · ' + esc(LH.altTiming(x)) + '</div><div class="mt8">' + LH.altDisclaimer() + '</div></div>').join('') + LH.btn('Compare and review evidence', 'alts', { id: s.id }, 'pri') : '<div class="note empty">No alternate is listed for this supplier in the provided addendum. Any alternate search and qualification still requires sourcing and engineering review.</div>', false);

    // 7 open questions
    const q = [];
    if (s.open_note) q.push('<b>' + s.open_note.ref + ':</b> ' + esc(s.open_note.text) + ' <span class="muted">Would settle it: ' + esc(s.open_note.settle) + '</span>');
    if (s.missing_fields.length) q.push('<b>Missing data:</b> ' + s.missing_fields.length + ' of 8 indicator fields are Not shown: ' + esc(s.missing_fields.join(', ')) + '. Requires validation.');
    if (sellRows.some((l) => l.fams === 1)) q.push('<b>Single-disclosure link:</b> ' + sellRows.filter((l) => l.fams === 1).map((l) => l.id).join(', ') + ' rest on one source family each (U6). A second independent source would raise confidence.');
    q.push('<b>Volumes:</b> actual order volumes and supplier spend are not in the data. Allocations are planning shares (U7).');
    alts.forEach((x) => x.open.slice(0, 3).forEach((o) => q.push('<b>' + esc(x.short) + ':</b> ' + esc(o))));
    h += LH.acc(7, 'What still needs validation?', '<ul style="margin:0 0 0 18px;padding:0">' + q.map((x) => '<li class="mb8 small">' + x + '</li>').join('') + '</ul>', false);

    // 8 evidence
    const L8 = sellRows;
    h += LH.acc(8, 'Why should I trust this?', (L8.length ? L8.map((l) => '<div class="ecard"><div class="claim">' + esc(LH.name(l.seller)) + ' supplies ' + esc(l.comps) + ' to ' + esc(LH.name(l.buyer)) + ' ' + LH.statusPill(l.status) + '</div><div class="small">' + l.directA.map(LH.chipDoc).join(' ') + ' <span class="muted">' + l.fams + ' independent source ' + (l.fams === 1 ? 'family' : 'families') + ' · ' + esc(l.dates) + '</span></div>' + (l.quotes ? '<details class="mt8"><summary class="small" style="cursor:pointer;color:var(--blue)">Show verbatim quotes</summary><div class="quote">' + esc(l.quotes).replace(/\n/g, '<br>') + '</div></details>' : '') + '</div>').join('') : '<div class="note empty">Evidence not available in the current dataset.</div>') +
      (s.sole ? '<div class="ecard"><div class="claim">“No second source qualified” statement</div>' + LH.chipDoc(s.sole) + '<div class="quote">“' + esc(D.ev[s.sole].detail) + '”</div></div>' : '') +
      '<div class="row">' + LH.btn('Open in Evidence Center', 'evq', { q: s.id }) + '</div>', false);
    h += '</div>';
    return h;
  };
  LH.drvSel = {};
  function drivers(s, sel) {
    return DIM.map((d, i) => {
      const v = s.d[i]; const cls = v >= 70 ? 'high' : v >= 40 ? 'med' : 'low';
      return '<div class="drv ' + (sel === i ? 'on' : '') + '" role="button" tabindex="0" data-act="drv" data-s="' + s.id + '" data-i="' + i + '"><div class="nm">' + d[0] + ' ' + d[1] + ' <small>(' + W[d[0]] + '%)</small></div>' + LH.bar(v, cls) + '<div class="v">' + f1(v) + '</div></div>' + (sel === i ? '<div class="drv-x">' + LH.driverExplain(s, i) + '</div>' : '');
    }).join('');
  }
  LH.A.drv = (d) => { const s = D.sup[d.s]; const i = +d.i; LH.drvSel[d.s] = LH.drvSel[d.s] === i ? -1 : i; document.getElementById('drivers').innerHTML = drivers(s, LH.drvSel[d.s]); };
})();
