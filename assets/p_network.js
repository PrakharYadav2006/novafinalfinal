/* Screen 2 - Network Explorer (+ Components tab + Zones tab) */
(function () {
  'use strict';
  const LH = window.LH, D = LH.D, esc = LH.esc, $ = LH.$;
  const net = (LH.net = { mode: 'supplier', full: false, f: {}, more: false });
  const ORD = {
    prod: ['P1', 'P2', 'P3'],
    comp: ['M10', 'M20', 'C10', 'C20', 'H10', 'H20', 'B10'],
    t1: ['ORG-247', 'ORG-725', 'ORG-119', 'ORG-922', 'ORG-287', 'ORG-786', 'ORG-103', 'ORG-176'],
    t2: ['ORG-439', 'ORG-942', 'ORG-708', 'ORG-453', 'ORG-728', 'ORG-469', 'ORG-210', 'ORG-849', 'ORG-329', 'ORG-274'],
    t3: ['ORG-455', 'ORG-736', 'ORG-520', 'ORG-873', 'ORG-179', 'ORG-659'],
  };
  const COLS = {
    supplier: [['nd', 10, 92], ['prod', 140, 120], ['comp', 292, 112], ['t1', 450, 178], ['t2', 668, 178], ['t3', 886, 178]],
    component: [['comp', 10, 120], ['t1', 200, 190], ['t2', 440, 190], ['t3', 680, 190]],
    product: [['nd', 10, 100], ['prod', 190, 150], ['comp', 420, 150], ['t1', 640, 200]],
  };
  COLS.risk = COLS.supplier;
  const COLNAME = { nd: '', prod: 'Product', comp: 'Component', t1: 'Tier-1', t2: 'Tier-2', t3: 'Tier-3' };

  function materialSet() {
    const set = new Set();
    const P = LH.propagate(LH.MATERIAL);
    LH.MATERIAL.forEach((i) => set.add(i)); P.tier1.forEach((i) => set.add(i)); Object.keys(P.aff).forEach((i) => set.add(i));
    return set;
  }
  function baseSet() {
    if (net.full) return new Set(LH.supList.map((s) => s.id));
    if (net.mode === 'risk') {
      const hi = LH.supList.filter((s) => s.band === 'High').map((s) => s.id);
      const P = LH.propagate(hi); const set = new Set(hi); P.tier1.forEach((i) => set.add(i)); Object.keys(P.aff).forEach((i) => set.add(i)); return set;
    }
    return materialSet();
  }
  function visibleSups() {
    const f = net.f; const hl = LH.hl(); const set = baseSet();
    if (hl.on) hl.sups.forEach((i) => set.add(i));
    let list = LH.supList.filter((s) => set.has(s.id));
    if (net.mode === 'product') list = list.filter((s) => s.tiern === 1);
    const forced = new Set(hl.on ? hl.sups : []);
    list = list.filter((s) => {
      if (f.tier && String(s.tiern) !== f.tier) return false;
      if (f.risk && s.band !== f.risk) return false;
      if (f.conf && s.conf !== f.conf) return false;
      if (f.zone && s.zone !== f.zone) return false;
      if (f.status && s.status !== f.status) return false;
      if (f.prod && !s.prods.includes(f.prod)) return false;
      if (f.comp && !s.comps.includes(f.comp)) return false;
      return true;
    });
    // when a filter is active, bring suppliers back that sit on the path of a focused object only if no filter excludes them
    void forced;
    return list;
  }

  function layout(sups) {
    const cols = COLS[net.mode]; const colIdx = {}; cols.forEach((c, i) => (colIdx[c[0]] = i));
    const nodes = {}; const lists = {};
    const supIds = new Set(sups.map((s) => s.id));
    const comps = new Set(); sups.forEach((s) => s.comps.forEach((c) => comps.add(c)));
    if (net.f.comp) comps.add(net.f.comp);
    const prods = new Set(); [...comps].forEach((c) => LH.compById[c].prods.forEach((p) => prods.add(p)));
    if (net.mode === 'component') prods.clear();
    lists.nd = net.mode === 'component' ? [] : ['NOVADRIVE'];
    lists.prod = ORD.prod.filter((p) => prods.has(p) && (!net.f.prod || p === net.f.prod));
    lists.comp = ORD.comp.filter((c) => comps.has(c));
    lists.t1 = ORD.t1.filter((i) => supIds.has(i)); lists.t2 = ORD.t2.filter((i) => supIds.has(i)); lists.t3 = ORD.t3.filter((i) => supIds.has(i));
    const rowH = net.mode === 'risk' ? 66 : 58;
    const maxN = Math.max(...cols.map((c) => (lists[c[0]] || []).length), 1);
    const H = Math.max(300, maxN * rowH);
    const top = 44;
    cols.forEach((c) => {
      const arr = lists[c[0]] || [];
      arr.forEach((id, i) => {
        const y = top + (i + 0.5) * (H / arr.length);
        const kind = c[0] === 'nd' ? 'nd' : c[0] === 'prod' ? 'prod' : c[0] === 'comp' ? 'comp' : 'sup';
        nodes[id] = { id, kind, x: c[1], w: c[2], y, h: kind === 'sup' ? (net.mode === 'risk' ? 50 : 42) : kind === 'nd' ? 64 : 38, col: c[0] };
      });
    });
    return { nodes, lists, cols, H: top + H + 16, W: Math.max(...cols.map((c) => c[1] + c[2])) + 10 };
  }

  function edgesFor(L, sups) {
    const E = []; const N = L.nodes; const mode = net.mode;
    const push = (a, b, o) => { if (N[a] && N[b]) E.push(Object.assign({ a, b }, o)); };
    if (mode !== 'component') {
      L.lists.prod.forEach((p) => push('NOVADRIVE', p, { type: 'np', prod: p }));
      L.lists.comp.forEach((c) => LH.compById[c].prods.forEach((p) => push(p, c, { type: 'pc', prod: p, comp: c })));
    }
    L.lists.t1.forEach((t) => D.sup[t].comps.forEach((c) => {
      const sh = LH.compById[c].t1.find((x) => x.id === t);
      push(c, t, { type: 'ct', comp: c, label: sh ? sh.share + '%' : '' });
    }));
    // supplier-to-supplier links, merged by pair
    const pairs = {};
    LH.links.forEach((l) => {
      if (l.buyer === 'NOVADRIVE') return;
      const k = l.buyer + '|' + l.seller; pairs[k] = pairs[k] || { a: l.buyer, b: l.seller, ids: [], comps: new Set(), inf: false };
      pairs[k].ids.push(l.id); l.compsA.forEach((c) => pairs[k].comps.add(c)); if (l.status === 'Inferred') pairs[k].inf = true;
    });
    Object.values(pairs).forEach((p) => push(p.a, p.b, { type: 'ss', ids: p.ids, comps: [...p.comps], inf: p.inf }));
    return E;
  }

  function nodeText(n, s) {
    if (n.kind === 'nd') return '<text x="' + (n.x + n.w / 2) + '" y="' + (n.y - 2) + '" text-anchor="middle" fill="#fff" font-size="13" font-weight="700">NovaDrive</text><text x="' + (n.x + n.w / 2) + '" y="' + (n.y + 14) + '" text-anchor="middle" fill="#bcd1ff" font-size="11">USD 1.56B</text>';
    if (n.kind === 'prod') { const p = LH.prodById[n.id]; return '<text x="' + (n.x + 10) + '" y="' + (n.y - 3) + '" font-size="13" font-weight="700" fill="#153c78">' + p.id + ' ' + esc(p.name) + '</text><text x="' + (n.x + 10) + '" y="' + (n.y + 12) + '" font-size="11.5" fill="#44506a">$' + p.rev + 'm revenue</text>'; }
    if (n.kind === 'comp') { const c = LH.compById[n.id]; return '<text x="' + (n.x + 10) + '" y="' + (n.y - 3) + '" font-size="13" font-weight="700" fill="#0e1a33">' + c.id + '</text><text x="' + (n.x + 10) + '" y="' + (n.y + 12) + '" font-size="11.5" fill="#44506a">' + c.weeks + ' wk qualif.</text>'; }
    const nm = s.short.length > 23 ? s.short.slice(0, 22) + '…' : s.short;
    const mark = { High: '▲ ', Medium: '◆ ', Low: '' }[s.band];
    if (net.mode === 'risk') return '<text x="' + (n.x + 9) + '" y="' + (n.y - 9) + '" font-size="13" font-weight="700" fill="#0e1a33">' + esc(nm) + '</text><text x="' + (n.x + 9) + '" y="' + (n.y + 7) + '" font-size="12" fill="#44506a">' + mark + LH.pct1(s.overall) + ' · ' + s.conf + ' conf.</text>' +
      '<rect x="' + (n.x + 9) + '" y="' + (n.y + 14) + '" width="' + (n.w - 18) + '" height="5" rx="2.5" fill="#eceae3"/><rect x="' + (n.x + 9) + '" y="' + (n.y + 14) + '" width="' + ((n.w - 18) * s.overall / 100) + '" height="5" rx="2.5" fill="' + (s.band === 'High' ? '#b3261e' : s.band === 'Medium' ? '#d29a2b' : '#8a95ad') + '"/>';
    return '<text x="' + (n.x + 9) + '" y="' + (n.y - 3) + '" font-size="13" font-weight="' + (s.band === 'Low' ? 500 : 700) + '" fill="#0e1a33">' + esc(nm) + '</text><text x="' + (n.x + 9) + '" y="' + (n.y + 12) + '" font-size="11.5" fill="' + (s.band === 'High' ? '#b3261e' : s.band === 'Medium' ? '#a9690f' : '#667089') + '">' + mark + LH.pct1(s.overall) + ' · ' + s.conf + '</text>';
  }

  function svgGraph(sups) {
    const L = layout(sups); const E = edgesFor(L, sups); const hl = LH.hl(); const c = LH.ctx;
    const dimOn = hl.on;
    const inHL = (n) => (n.kind === 'sup' ? hl.sups.has(n.id) : n.kind === 'comp' ? hl.comps.has(n.id) : n.kind === 'prod' ? hl.prods.has(n.id) : true);
    let s = '<svg class="net" id="netsvg" viewBox="0 0 ' + L.W + ' ' + L.H + '" width="100%" role="img" aria-label="Supplier network from NovaDrive to Tier-3 suppliers">';
    L.cols.forEach((col) => { if (COLNAME[col[0]]) s += '<text class="col-h" x="' + col[1] + '" y="22">' + COLNAME[col[0]] + '</text>'; });
    // edges
    E.forEach((e) => {
      const a = L.nodes[e.a], b = L.nodes[e.b];
      const x1 = a.x + a.w, y1 = a.y, x2 = b.x, y2 = b.y; const dx = Math.max(24, (x2 - x1) / 2);
      let on = false;
      if (dimOn) {
        if (e.type === 'ss') on = e.ids.some((i) => hl.edges.has(i));
        else if (e.type === 'np') on = hl.prods.has(e.prod);
        else if (e.type === 'pc') on = hl.prods.has(e.prod) && hl.comps.has(e.comp);
        else if (e.type === 'ct') on = hl.comps.has(e.comp) && hl.sups.has(e.b) && (!c.comp && !c.prod ? [...hl.edges].some((id) => LH.linkById[id].buyer === 'NOVADRIVE' && LH.linkById[id].seller === e.b && LH.linkById[id].compsA.includes(e.comp)) : true);
      }
      const cls = 'edge' + (e.inf ? ' inf' : '') + (dimOn ? (on ? ' hl' : ' dim') : '');
      s += '<path class="' + cls + '" d="M' + x1 + ',' + y1 + ' C' + (x1 + dx) + ',' + y1 + ' ' + (x2 - dx) + ',' + y2 + ' ' + x2 + ',' + y2 + '"/>';
      if (e.label && !(dimOn && !on)) s += '<text x="' + (x2 - 8) + '" y="' + (y2 - 5) + '" text-anchor="end" font-size="10.5" fill="#667089">' + e.label + '</text>';
    });
    Object.values(L.nodes).forEach((n) => {
      const sup = n.kind === 'sup' ? D.sup[n.id] : null;
      const cls = 'node ' + (n.kind === 'nd' ? 'fixed' : n.kind === 'prod' ? 'prod' : n.kind === 'comp' ? 'comp' : LH.bandCls(sup.band)) +
        (dimOn && !inHL(n) ? ' dim' : '') + ((c.sup === n.id && n.kind === 'sup') || (c.comp === n.id && n.kind === 'comp') || (c.prod === n.id && n.kind === 'prod') ? ' sel' : '');
      const act = n.kind === 'sup' ? 'netsel' : n.kind === 'comp' ? 'netselc' : n.kind === 'prod' ? 'netselp' : 'netclear';
      s += '<g class="' + cls + '" data-act="' + act + '" data-id="' + n.id + '" data-nodetip="' + (n.kind === 'nd' ? '' : n.id) + '" tabindex="0" role="button" aria-label="' + esc(n.kind === 'sup' ? sup.name + ', ' + sup.band + ' risk ' + LH.pct1(sup.overall) + ', ' + sup.conf + ' confidence' : n.id) + '">' +
        '<rect class="nb" x="' + n.x + '" y="' + (n.y - n.h / 2) + '" width="' + n.w + '" height="' + n.h + '" rx="8"/>' + nodeText(n, sup) + '</g>';
    });
    s += '</svg>';
    return { svg: s, n: Object.keys(L.nodes).length, supN: L.lists.t1.length + L.lists.t2.length + L.lists.t3.length };
  }

  /* ---------- inspector ---------- */
  function tracePath(id) {
    const s = D.sup[id]; const P = LH.propagate([id]);
    const t1 = P.tier1.filter((i) => i !== id);
    const parts = [s.short];
    if (s.tiern === 3) { const mids = P.mids; if (mids.length) parts.push(mids.map(LH.name).join(' + ')); }
    if (t1.length) parts.push(t1.map(LH.name).join(' + '));
    parts.push(P.comps.join('/')); parts.push(P.prods.join('/'));
    return { P, text: parts };
  }
  LH.tracePath = tracePath;
  function inspector() {
    const c = LH.ctx;
    if (c.sup && !c.ev) {
      const s = D.sup[c.sup]; const a = LH.action(s); const tp = tracePath(s.id); const P = tp.P;
      let h = '<div class="crumb">' + LH.tierTxt(s) + ' · ' + s.zone + ' · ' + s.id + '</div><h3>' + esc(s.name) + '</h3><div class="row mt8">' + LH.riskPill(s.band) + LH.confPill(s.conf) + '</div>';
      h += '<div class="kv"><span>Risk</span><span>' + LH.rk(s) + '</span><span>Components</span><span>' + s.comps.map(LH.chipComp).join(' ') + '</span><span>Products</span><span>' + P.prods.map(LH.chipProd).join(' ') + '</span><span>Link status</span><span>' + LH.statusPill(s.status) + '</span>';
      if (s.events.length) h += '<span>Signals</span><span>' + s.events.map((e) => LH.chipEv(e.id)).join(' ') + '</span>';
      h += '</div><h4 class="mb8">Impact trace</h4><div class="small"><b>' + tp.text.map(esc).join(' → ') + '</b></div>';
      h += '<div class="small muted mt8">Annual product revenue of affected products: <b style="color:var(--ink)">' + LH.usd(P.rev) + '</b> (' + P.revPct + '%). ' + LH.help('Product revenue behind this dependency. Not supplier spend, not revenue at risk.') + '</div>';
      h += '<div class="mt8">' + LH.actPill(a) + '</div><div class="btns">' + LH.btn('What happens if this fails?', 'propmodal', { id: s.id }, 'pri') + LH.btn('Why is this risky?', 'sup', { id: s.id }) + LH.btn('Find alternatives', 'alts', { id: s.id }) + LH.btn('Simulate in Scenario Lab', 'whatif', { id: s.id }) + LH.btn('Clear focus', 'clearfocus', {}, 'ghost') + '</div>';
      return h;
    }
    if (c.ev) {
      const e = LH.eventById[c.ev]; const ss = LH.eventSups(c.ev);
      return '<div class="crumb">External signal</div><h3>' + c.ev + ' · ' + esc(e.head) + '</h3><p class="small mt8">' + esc(e.why) + '</p><div class="kv"><span>Matched</span><span>' + (ss.map((s) => LH.chipSup(s.id)).join(' ') || 'None') + '</span></div><div class="btns">' + LH.btn('Open event', 'ev', { id: c.ev }, 'pri') + LH.btn('Clear focus', 'clearfocus', {}, 'ghost') + '</div>';
    }
    if (c.comp) return compInspector(c.comp);
    if (c.prod) {
      const p = LH.prodById[c.prod];
      return '<div class="crumb">Product</div><h3>' + p.id + ' ' + esc(p.name) + '</h3><div class="kv"><span>Annual revenue</span><span>USD ' + p.rev + 'm</span><span>Components</span><span>' + p.comps.map(LH.chipComp).join(' ') + '</span></div><div class="small muted">Highlighted: every supplier whose chain reaches this product. Overall risk scores are network-wide and are not recomputed per product; the list below is filtered to this product.</div><h4 class="mt12 mb8">Suppliers reaching ' + p.id + ' (by risk)</h4>' +
        LH.supList.filter((s) => s.prods.includes(p.id)).slice(0, 8).map((s) => '<div class="small mb8">' + LH.rk(s) + ' ' + LH.chipSup(s.id) + ' <span class="muted">' + LH.tierTxt(s) + '</span></div>').join('') + '<div class="btns">' + LH.btn('Clear focus', 'clearfocus', {}, 'ghost') + '</div>';
    }
    if (c.zone) return '<div class="crumb">Zone</div><h3>' + c.zone + '</h3>' + LH.zoneSups(c.zone).map((s) => '<div class="small mb8">' + LH.rk(s) + ' ' + LH.chipSup(s.id) + '</div>').join('') + '<div class="btns">' + LH.btn('Open zone map', 'zone', { id: c.zone }) + LH.btn('Clear focus', 'clearfocus', {}, 'ghost') + '</div>';
    return '<h3>What depends on what?</h3><p class="small mt8 muted">Click any supplier, component or product to trace who depends on it and what it reaches. Everything else dims.</p><h4 class="mt12 mb8">Start with the material four</h4>' +
      LH.MATERIAL.map((i) => '<div class="small mb8">' + LH.rk(D.sup[i]) + ' ' + LH.chipSup(i) + '</div>').join('') +
      '<div class="small muted mt12">Solid line = confirmed. Dashed amber line = inferred, verification required. Hypotheses (Solace Optics, Alder Bauxite) are not shown as links.</div>';
  }
  function compInspector(id) {
    const cm = LH.compById[id];
    return '<div class="crumb">Component</div><h3>' + cm.id + ' ' + esc(cm.name) + '</h3><div class="kv"><span>Products</span><span>' + cm.prods.map(LH.chipProd).join(' ') + '</span><span>Tier-1</span><span>' + cm.t1.map((t) => LH.chipSup(t.id) + ' ' + t.share + '%').join('<br>') + '</span><span>Qualification</span><span>' + cm.weeks + ' weeks (indicative)</span><span>Revenue context</span><span>' + LH.usd(cm.rev) + '</span></div><div class="small muted">Shares are planning allocations, not purchase history.</div><div class="btns">' + LH.btn('Open Components tab', 'nav', { to: 'network/components/' + id }) + LH.btn('Clear focus', 'clearfocus', {}, 'ghost') + '</div>';
  }

  LH.propModal = (id) => {
    const s = D.sup[id]; const P = LH.propagate([id]);
    const step = (h, b, cls) => '<div class="step ' + (cls || '') + '"><h5>' + h + '</h5>' + b + '</div>';
    let flow = step('Fails', '<b>' + esc(s.short) + '</b><div class="xs muted">' + LH.tierTxt(s) + ' · ' + s.zone + '</div>', 'fail');
    if (P.mids.length) flow += '<span class="arrow">→</span>' + step('Passes through', P.mids.map((i) => esc(LH.name(i))).join(' + '));
    const t1 = P.tier1.filter((i) => i !== id);
    if (t1.length) flow += '<span class="arrow">→</span>' + step('Tier-1 affected', t1.map((i) => esc(LH.name(i))).join(' + '));
    flow += '<span class="arrow">→</span>' + step('Components', P.comps.map((c) => c + ' ' + esc(LH.compById[c].name)).join('<br>'));
    flow += '<span class="arrow">→</span>' + step('Products', P.prods.map((p) => p + ' ' + esc(LH.prodById[p].name)).join('<br>'));
    flow += '<span class="arrow">→</span>' + step('Revenue context', '<b>' + LH.usd(P.rev) + '</b><div class="xs muted">' + P.revPct + '% of annual product revenue. Not supplier spend.</div>');
    let h = '<div class="crumb">What happens if this fails?</div><h2>' + esc(s.name) + '</h2><div class="small muted mt8">Follows confirmed and inferred links in the data from ' + esc(s.short) + ' to NovaDrive.</div><div class="flowrow mt16">' + flow + '</div>';
    h += '<div class="mt16 small">' + (P.noSpare.length ? '<b>No unaffected Tier-1 is disclosed</b> for ' + P.noSpare.join(', ') + '. No backup disclosed.' : 'Another Tier-1 is disclosed for ' + P.comps.join(', ') + ' (planning share only; its capacity to absorb is not shown).') + '</div>';
    h += '<div class="note info">Impact is read from the network, not forecast. Inventory buffers, recovery time and other suppliers\' capacity are not in the data. Use the Scenario Lab to test a duration.</div>';
    h += '<div class="row mt12">' + LH.btn('Run in Scenario Lab', 'whatif', { id }, 'pri') + LH.btn('Find alternatives', 'alts', { id }) + '</div>';
    LH.modal(h, true);
  };

  /* ---------- pages ---------- */
  const optList = (arr, cur, all) => '<option value="">' + all + '</option>' + arr.map((a) => '<option value="' + a[0] + '"' + (cur === a[0] ? ' selected' : '') + '>' + esc(a[1]) + '</option>').join('');
  function filters() {
    const f = net.f;
    const sel = (key, label, opts) => '<label>' + label + '<select data-f="' + key + '" aria-label="' + label + '">' + optList(opts, f[key], 'All') + '</select></label>';
    const zones = [...new Set(LH.supList.map((s) => s.zone))].sort().map((z) => [z, z + (z === 'Z01' ? ' · East Delta' : '')]);
    let h = '<div class="filters network-filters">' +
      sel('prod', 'Product', LH.prods.map((p) => [p.id, p.id + ' ' + p.name])) + sel('comp', 'Component', LH.comps.map((c) => [c.id, c.id + ' ' + c.name])) +
      LH.btn(net.more ? 'Fewer filters' : 'More filters · 5', 'netmore', {}, 'sm ghost') + (Object.values(f).some(Boolean) ? LH.btn('Reset', 'netreset', {}, 'sm ghost') : '') + '</div>';
    if (net.more) h += '<div class="filters mt8 network-filters-advanced">' + sel('tier', 'Tier', [['1', 'Tier-1'], ['2', 'Tier-2'], ['3', 'Tier-3']]) + sel('risk', 'Risk', [['High', 'High'], ['Medium', 'Medium'], ['Low', 'Low']]) + sel('conf', 'Confidence', [['High', 'High'], ['Medium', 'Medium'], ['Low', 'Low']]) + sel('zone', 'Zone', zones) + sel('status', 'Relationship status', [['Confirmed', 'Confirmed'], ['Inferred', 'Inferred (verification required)']]) + '<span class="xs muted" style="align-self:end">Unresolved hypotheses are never drawn as links. See Evidence → Rejected links.</span></div>';
    return h;
  }
  function tabs(cur) {
    return '<div class="tabs" role="tablist">' + [['explorer', 'Network map'], ['components', 'Components'], ['zones', 'Zones']].map((t) => '<button type="button" role="tab" class="' + (cur === t[0] ? 'on' : '') + '" data-act="nettab" data-t="' + t[0] + '">' + t[1] + '</button>').join('') + '</div>';
  }

  LH.pages.network = function (r) {
    const tab = r.a === 'components' ? 'components' : r.a === 'zones' ? 'zones' : 'explorer';
    let h = LH.pageH('Network Explorer', 'Trace who depends on whom — from NovaDrive to upstream sources.');
    h += tabs(tab);
    if (tab === 'components') return h + componentsTab(r.b);
    if (tab === 'zones') return h + zonesTab(r.b);
    const sups = visibleSups();
    h += '<div class="net-tools"><div class="seg" role="group" aria-label="Network level">' +
      [['product', 'Product view'], ['component', 'Component view'], ['supplier', 'Supplier view'], ['risk', 'Risk view']].map((m) => '<button type="button" class="' + (net.mode === m[0] ? 'on' : '') + '" data-act="netmode" data-m="' + m[0] + '">' + m[1] + '</button>').join('') + '</div>' +
      LH.btn(net.full ? 'Show material network only' : 'Show full network (24 suppliers)', 'netfull', {}, 'sm') +
      '<span class="xs muted">' + (net.full ? 'Showing all suppliers' : 'Showing the 4 material vulnerabilities, their Tier-1 customers and what feeds them') + '</span></div>';
    h += filters();
    if (!sups.length) {
      h += '<div class="empty mt16">Nothing matched your filters. ' + LH.btn('Reset filters', 'netreset', {}, 'sm') + '</div>';
      return h;
    }
    const g = svgGraph(sups);
    h += '<div class="net-wrap mt12"><div><div id="netsvg-wrap">' + g.svg + '</div>' +
      '<div class="legend"><span><i></i>Confirmed link</span><span><i class="d"></i>Inferred link: verification required</span><span><i class="r"></i>Impact path</span><span><em style="border-color:#b3261e;background:#fff5f3"></em>High risk</span><span><em style="border-color:#d29a2b;background:#fffaf0"></em>Medium</span><span><em style="border-color:#b5b9c6"></em>Low</span><span class="muted">% on a line = planning allocation, not purchase history</span></div></div>' +
      '<aside class="insp" id="insp">' + inspector() + '</aside></div>';
    return h;
  };

  /* components tab */
  function singleStatus(cm) {
    if (cm.id === 'M10' || cm.id === 'M20') return { t: 'Effectively single', d: 'Two Tier-1s, but one parent (DOC-075) and one qualified die source (DOC-078).', tone: 'red' };
    if (cm.id === 'B10') return { t: 'Shared upstream', d: 'Two Tier-1s (80/20) that share one substrate source, Jade (DOC-079).', tone: 'red' };
    return { t: 'Single disclosed Tier-1', d: 'One Tier-1 at 100% planning allocation. No backup disclosed.', tone: 'amber' };
  }
  LH.singleStatus = singleStatus;
  function componentsTab(sel) {
    const focus = sel || LH.ctx.comp;
    let h = '<div class="panel flat" style="padding:0;border:0;background:none"><p class="muted small mb8">Which parts hold NovaDrive together, who makes them, and where the single points are. “No backup disclosed” means the data shows none, not that none exists.</p></div>';
    h += '<div class="t-wrap panel" style="padding:8px 8px"><table class="t"><thead><tr><th>Component</th><th>Products</th><th>Tier-1 suppliers ' + LH.help('Planning allocation is not purchase history.') + '</th><th>Tier-2 / Tier-3 dependencies</th><th>Single-source status</th><th>Qualification</th><th>Highest risk on this chain</th><th>Alternates ' + LH.help('Shortlisted candidates. Qualification required.') + '</th></tr></thead><tbody>';
    LH.comps.forEach((cm) => {
      const st = singleStatus(cm);
      const top = cm.deps.length ? D.sup[cm.deps[0]] : null;
      const worst = [...cm.t1.map((t) => D.sup[t.id]), ...cm.deps.map((i) => D.sup[i])].sort((a, b) => b.overall - a.overall)[0];
      const al = LH.alts.filter((a) => a.comps.includes(cm.id));
      h += '<tr class="' + (focus === cm.id ? 'sel' : '') + '"><td><div class="sname">' + cm.id + ' · ' + esc(cm.name) + '<small>' + esc(cm.app) + '</small></div><div class="rowbtns">' + LH.btn('Trace in network', 'comp2net', { id: cm.id }, 'sm ghost') + '</div></td>' +
        '<td>' + cm.prods.map(LH.chipProd).join(' ') + '<div class="xs muted mt8">' + LH.usd(cm.rev) + ' annual product revenue</div></td>' +
        '<td>' + cm.t1.map((t) => LH.chipSup(t.id) + ' <span class="num">' + t.share + '%</span>').join('<br>') + '</td>' +
        '<td>' + cm.deps.map((i) => LH.chipSup(i)).join(' ') + '</td>' +
        '<td><span class="pill ' + st.tone + '">' + st.t + '</span><div class="xs muted mt8">' + esc(st.d) + '</div></td>' +
        '<td class="n"><b>' + cm.weeks + ' weeks</b><div class="xs muted">indicative</div></td>' +
        '<td>' + LH.chipSup(worst.id) + '<div class="mt8">' + LH.rk(worst) + ' ' + LH.riskPill(worst.band) + '</div></td>' +
        '<td>' + (al.length ? al.map(LH.chipAlt).join(' ') + '<div class="xs muted mt8">Validation required</div>' : '<span class="xs muted">No qualified candidate identified from the current evidence.</span>') + '</td></tr>';
      void top;
    });
    h += '</tbody></table></div><div class="note info mt12">Tier-2 / Tier-3 dependencies are the suppliers whose chains reach the component. Single-source levels are assumptions (see Methodology). Components H10 and H20 have no Tier-2/3 alternate research yet.</div>';
    return h;
  }

  /* zones tab */
  function zoneBand(z) { const s = LH.zoneSups(z); if (!s.length) return null; return s.some((x) => x.band === 'High') ? 'High' : s.some((x) => x.band === 'Medium') ? 'Medium' : 'Low'; }
  function zonesTab(sel) {
    const G = D.geo; const cur = sel || LH.ctx.zone;
    const col = { High: '#f3c9c4', Medium: '#f6dfb0', Low: '#e3e5ea', none: '#f1efe8' };
    let svg = '<svg viewBox="' + G.vb.join(' ') + '" width="100%" class="zmap" role="img" aria-label="Illustrative zone layout">';
    svg += '<path d="' + G.outline + '" fill="#f6f4ee" stroke="#c9c5b8" stroke-width="2"/>';
    Object.keys(G.zones).forEach((z) => {
      const b = zoneBand(z); const n = LH.zoneSups(z).length;
      svg += '<path class="z' + (cur === z ? ' sel' : '') + '" d="' + G.zones[z].d + '" fill="' + col[b || 'none'] + '" data-act="zonesel" data-id="' + z + '" tabindex="0" role="button" aria-label="Zone ' + z + ', ' + n + ' network sites"/>';
    });
    Object.keys(G.zones).forEach((z) => {
      const g = G.zones[z]; const n = LH.zoneSups(z).length; const b = zoneBand(z);
      svg += '<g pointer-events="none"><text x="' + g.cx + '" y="' + (g.cy - 6) + '" text-anchor="middle" font-size="26" font-weight="700" fill="#0e1a33">' + z + '</text><text x="' + g.cx + '" y="' + (g.cy + 18) + '" text-anchor="middle" font-size="17" fill="#3c4863">' + n + ' site' + (n === 1 ? '' : 's') + (b ? ' · ' + b : '') + '</text>' + (z === 'Z01' ? '<text x="' + g.cx + '" y="' + (g.cy + 38) + '" text-anchor="middle" font-size="15" fill="#b3261e" font-weight="600">⚑ EV-001 watch</text>' : '') + '</g>';
    });
    svg += '</svg>';
    let side = '';
    if (cur) {
      const ss = LH.zoneSups(cur); const zi = D.zidx[cur]; const nn = D.nonnet[cur] || [];
      side += '<h3>Zone ' + cur + (cur === 'Z01' ? ' · East Delta' : '') + '</h3>';
      if (zi) side += '<div class="kv small mt8" style="display:grid;grid-template-columns:130px 1fr;gap:4px 10px"><span class="muted">Physical hazard</span><span>' + zi[0] + '</span><span class="muted">Logistics friction</span><span>' + zi[1] + '</span><span class="muted">Infrastructure</span><span>' + zi[2] + '</span></div>';
      if (cur === 'Z01') side += '<div class="mt8">' + LH.chipEv('EV-001') + ' <span class="small">flood watch · no damage or shutdown confirmed</span></div>';
      side += '<h4 class="mt12 mb8">Network sites here</h4>' + (ss.length ? ss.map((s) => '<div class="mb8"><div class="row">' + LH.chipSup(s.id) + ' <span class="xs muted">' + LH.tierTxt(s) + ' · ' + esc(s.cap || '') + '</span></div><div class="xs muted">Makes: ' + esc(s.comps.join(', ')) + ' · reaches ' + s.prods.join(', ') + ' · ' + LH.rk(s) + ' · ' + s.conf + ' confidence' + (s.status === 'Inferred' ? ' · link inferred' : '') + '</div></div>').join('') : '<div class="xs muted">No network site in this zone.</div>');
      if (nn.length) side += '<h4 class="mt12 mb8">Related entities not in the network</h4>' + nn.map((n) => '<div class="xs mb8"><b>' + esc(n.name) + '</b> (' + esc(n.ref) + '): ' + esc(n.why) + '</div>').join('');
      side += '<div class="btns mt12">' + LH.btn('Highlight in network', 'zone2net', { id: cur }, 'sm') + LH.btn('Clear focus', 'clearfocus', {}, 'sm ghost') + '</div>';
    } else side = '<h3>Pick a zone</h3><p class="small muted mt8">Click a zone to see the suppliers in it, their tier and what they make.</p>';
    return '<div class="net-wrap"><div>' + svg + '<div class="legend"><span><em style="border-color:#e8b3ac;background:#f3c9c4"></em>Contains a High-risk supplier</span><span><em style="border-color:#e8cf95;background:#f6dfb0"></em>Medium at most</span><span><em style="border-color:#c9ccd6;background:#e3e5ea"></em>Low</span></div><div class="note info mt8">Illustrative layout: only Z01 is named in the case data (East Delta). Zones Z02–Z08 are unnamed, so this map shows relative position for orientation, not real geography. The case data does not give coordinates.</div></div><aside class="insp">' + side + '</aside></div>';
  }

  /* ---------- actions ---------- */
  const A = LH.A;
  A.nettab = (d) => LH.go('network/' + d.t);
  A.netmode = (d) => { net.mode = d.m; LH.rerender(); };
  A.netfull = () => { net.full = !net.full; LH.rerender(); };
  A.netmore = () => { net.more = !net.more; LH.rerender(); };
  A.netreset = () => { net.f = {}; LH.rerender(); };
  A.netsel = (d) => { LH.focus('sup', d.id); };
  A.netselc = (d) => { LH.focus('comp', d.id); };
  A.netselp = (d) => { LH.focus('prod', d.id); };
  A.netclear = () => { LH.clearFocus(); };
  A.propmodal = (d) => LH.propModal(d.id);
  A.comp2net = (d) => { LH.focus('comp', d.id); LH.go('network/explorer'); };
  A.zonesel = (d) => { LH.focus('zone', d.id); LH.go('network/zones/' + d.id); };
  A.zone2net = (d) => { LH.focus('zone', d.id); net.full = true; LH.go('network/explorer'); };
  LH.onFocus = () => { const r = LH.cur; if (r && r.page === 'network') LH.rerender(); };
  document.addEventListener('change', (e) => { const s = e.target.closest('select[data-f]'); if (s) { net.f[s.dataset.f] = s.value; LH.rerender(); } });
})();
