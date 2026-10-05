/* Screen 8 - Evidence Center */
(function () {
  'use strict';
  const LH = window.LH, D = LH.D, esc = LH.esc;
  const evi = (LH.evi = { tab: 'rel', q: '' });
  const TABS = [['rel', 'Relationship evidence'], ['risk', 'Risk inputs'], ['ev', 'Events'], ['alt', 'Alternates'], ['rej', 'Rejected links'], ['ass', 'Assumptions']];
  const strip = (s) => String(s || '').replace(/<[^>]+>/g, ' ');

  function card(o) {
    const kv = o.kv.filter((x) => x[1] != null && x[1] !== '').map((x) => '<span>' + x[0] + '</span><span>' + x[1] + '</span>').join('');
    return { hay: strip(o.hayx || '') + ' ' + strip(o.claim) + ' ' + strip(o.kv.map((x) => x[1]).join(' ')) + ' ' + (o.quote || '') + ' ' + (o.issue || ''),
      html: '<div class="ecard"><div class="claim">' + o.claim + (o.pill ? ' ' + o.pill : '') + '</div><div class="kv">' + kv + '</div>' + (o.quote ? '<details class="mt8"><summary class="small" style="cursor:pointer;color:var(--blue)">Show verbatim quote</summary><div class="quote">' + esc(o.quote).replace(/\n/g, '<br>') + '</div></details>' : '') + (o.issue ? '<div class="issue">Open issue: ' + o.issue + '</div>' : '') + '</div>' };
  }
  const docs = (arr) => arr.map(LH.chipDoc).join(' ') || 'Not shown';

  function relCards() {
    const out = [];
    D.shared.forEach((x) => out.push(card({ claim: '<b>' + x.id + '</b> · ' + esc(x.node), pill: LH.statusPill(x.status.startsWith('Confirmed') ? 'Confirmed' : 'Inferred') + (x.status.includes('Verdant') ? '' : ''), hayx: 'shared dependency choke point ' + x.priority,
      kv: [['Claim', esc(x.why)], ['Source', docs(x.evidence)], ['Date', 'See each record'], ['Component', esc(x.comps)], ['Product', esc(x.products)], ['Evidence type', 'Shared-dependency finding (' + esc(x.priority) + ' priority, analyst view)'], ['Confidence', esc(x.status)]], quote: x.quote, issue: x.id === 'S4' ? 'Verdant → IonPeak is inferred only (U1).' : x.id === 'S5' ? 'No Kestrel → HarborSense record exists: NOT IN DATA, which is not evidence of absence (U4).' : null })));
    LH.links.forEach((l) => {
      const conf = l.status === 'Inferred' ? 'Low (inferred)' : l.fams >= 2 ? 'High (' + l.fams + ' independent source families)' : 'Medium (1 source family)';
      const types = [...new Set(l.directA.map((i) => (D.ev[i] ? D.ev[i].type : null)).filter(Boolean))];
      const s = D.sup[l.seller];
      out.push(card({ claim: '<b>' + l.id + '</b> · ' + esc(LH.name(l.seller)) + ' supplies ' + esc(l.comps) + ' to ' + esc(LH.name(l.buyer)), pill: LH.statusPill(l.status), hayx: 'relationship link ' + l.seller + ' ' + (l.buyer || '') + ' ' + l.status,
        kv: [['Source', docs(l.directA) + (l.contextA.length ? ' <span class="muted">context:</span> ' + docs(l.contextA) : '')], ['Date', esc(l.dates)], ['Entity', esc(s.name) + ' · ' + l.seller + ' · ' + esc(l.site)], ['Component', l.compsA.map(LH.chipComp).join(' ')], ['Product', l.prodsA.map(LH.chipProd).join(' ')], ['Evidence type', esc(types.join('; ') || 'Not shown')], ['Confidence', conf]],
        quote: l.quotes, issue: l.status === 'Inferred' ? 'Relationship inferred — verification required. Customer index mentions M10/M20 applications but does not identify the receiving line or purchase allocation (U1).' : (l.flag && l.flag !== '-' ? esc(l.flag) : (l.fams === 1 ? 'Rests on a single customer disclosure (U6). A second independent source would raise confidence.' : null)) }));
    });
    return out;
  }
  function riskCards() {
    return LH.supList.map((s) => {
      const lab = ['Current ratio', 'Net debt / EBITDA', 'On-time shipments, 3-month avg (%)', 'On-time change, Jan to latest (pts)'];
      const val = (v) => (v == null ? '<b>Not shown</b>' : v);
      return card({ claim: '<b>' + esc(s.short) + '</b> · overall risk ' + LH.pct1(s.overall) + ' (' + s.band + ') · rank ' + s.rank, pill: LH.confPill(s.conf), hayx: 'risk input indicator ' + s.id + ' ' + s.site + ' ' + s.zone,
        kv: [['Claim', 'D1 ' + s.d[0] + ' · D2 ' + s.d[1] + ' · D3 ' + s.d[2] + ' · D4 ' + s.d[3] + ' · D5 ' + s.d[4] + ' · D6 ' + s.d[5] + ' → ' + LH.pct1(s.overall_raw) + ' ' + LH.help('20%·D1 + 15%·D2 + 30%·D3 + 15%·D4 + 10%·D5 + 10%·D6')], ['Source', 'Case workbook: Supplier business Indicators, Components Context, Business Context. Scorecard v2.'], ['Date', 'Not shown (indicator sheet carries no date)'], ['Entity', esc(s.name) + ' · ' + s.id + ' · ' + s.site + ' · ' + s.zone], ['Component', s.comps.map(LH.chipComp).join(' ')], ['Product', s.prods.map(LH.chipProd).join(' ')],
          ['Indicators', s.subs.map((x, i) => lab[i] + ': ' + val(x[1])).join('<br>') + '<br>Assurance gap: ' + (s.ass == null ? '<b>Not shown</b>' : s.ass) + '<br>Zone indices (hazard / logistics / infrastructure): ' + s.idx.join(' / ')], ['Evidence type', 'Case indicator data'], ['Confidence', s.conf + ' (' + LH.CONF[s.conf] + ')']],
        issue: s.missing_fields.length ? s.missing_fields.length + ' of 8 indicator fields not shown: ' + esc(s.missing_fields.join(', ')) + '. Requires validation.' : null });
    });
  }
  function evCards() {
    return D.events.map((e) => {
      const x = LH.EVX[e.id]; const ss = LH.eventSups(e.id); const P = ss.length ? LH.propagate(ss.map((s) => s.id)) : null;
      return card({ claim: '<b>' + e.id + '</b> · ' + esc(e.head), pill: x.kind === 'matched' ? '<span class="pill blue">Matched</span>' : '<span class="pill neutral">Ignored: ' + esc(x.label) + '</span>', hayx: 'event signal ' + e.fam,
        kv: [['Claim', esc(e.detail)], ['Source', 'Risk Event Flags, source family ' + esc(e.fam)], ['Date', esc(e.date)], ['Entity', esc(x.entity)], ['Component', P ? P.comps.map(LH.chipComp).join(' ') : 'None'], ['Product', P ? P.prods.map(LH.chipProd).join(' ') : 'None'], ['Evidence type', 'External event feed (case data)'], ['Confidence', x.kind === 'matched' ? 'Matched by ' + (e.id === 'EV-001' ? 'zone code' : 'exact name') + '; decision: ' + esc(e.decision) : esc(e.decision)]],
        issue: esc(e.verify) + (e.verify === 'None.' ? '' : '') }) ;
    });
  }
  function altCards() {
    const out = [];
    LH.alts.forEach((a) => {
      D.factors.forEach((f) => {
        const r = a.ratings[f.k];
        const srcs = r.src.map((i) => LH.srcById[i]).filter(Boolean);
        const claimText = a.userProvided ? 'Not yet assessed. Supplied list description: ' + r.note : r.note;
        out.push(card({ claim: '<b>' + esc(a.name) + '</b> · ' + (a.userProvided ? 'Fitment lead' : f.n + ': ' + r.r), pill: '<span class="pill amber">' + (a.userProvided ? 'Shortlisted · qualification required' : 'Claimed') + '</span>', hayx: 'alternate candidate ' + a.id + ' ' + srcs.map((s) => s.url + ' ' + s.co).join(' '),
          kv: [['Claim', esc(claimText)], ['Source', srcs.length ? srcs.map((s) => '<button type="button" class="chip" data-act="src" data-id="' + s.id + '">' + s.id + '</button> ' + (s.url ? LH.link(s.url, s.title) : esc(s.title))).join('<br>') : 'Not shown'], ['Date', a.providedProfile ? 'Provided by user · alternatesuppliersproper.pdf · page ' + esc(a.providedProfile.page) : a.userProvided ? 'Provided by user · PDF page ' + a.sourcePage : srcs.length ? srcs.map((s) => esc(s.pagedate || 'No page date shown')).join('; ') + ' · opened ' + D.accessed : 'Not shown'], ['Entity', esc(a.name) + ' (candidate for ' + esc(LH.name(a.replaces)) + ')'], ['Component', a.comps.map(LH.chipComp).join(' ')], ['Product', LH.prodsOfComps(a.comps).map(LH.chipProd).join(' ')], ['Evidence type', a.providedProfile ? 'User-provided PDF claim; independently unverified' : a.userProvided ? 'User-provided document; not independently verified' : 'Claimed (company page). Independent: none checked'], ['Confidence', a.userProvided ? 'Not assessed' : r.r]],
          issue: a.userProvided ? 'Listed as an alternate only. Fit, plant, capacity and qualification require validation.' : (r.r === 'Not shown' ? 'Not shown on the pages read. That means ask, not “they do not have it”.' : esc(a.open[0])) }));
      });
      if (a.providedProfile) {
        const p = a.providedProfile;
        out.push(card({ claim: '<b>' + esc(a.name) + '</b> · supplied capability dossier', pill: '<span class="pill amber">PDF claim · unverified</span>', hayx: 'PDF supplier dossier ' + a.name + ' ' + p.url,
          kv: [['Claim', esc(p.capability)], ['Application relevance', esc(p.application)], ['Manufacturing footprint', esc(p.footprint)], ['Scale', esc(p.scale)], ['Industry presence', esc(p.industry)], ['Qualification', esc(p.qualification)], ['Source', 'alternatesuppliersproper.pdf · page ' + esc(p.page) + ' · URL listed: ' + LH.link(p.url, p.url)], ['Entity', esc(a.name) + ' (candidate for ' + esc(LH.name(a.replaces)) + ')'], ['Evidence type', 'User-provided supplier claims; independently unverified'], ['Status', 'Shortlisted alternate · qualification required']],
          issue: 'These source statements are not proof of NovaDrive fit, certification scope, qualified status, plant suitability, available capacity or a production award.' }));
      }
      out.push(card({ claim: '<b>' + esc(a.name) + '</b> · financial context', pill: '<span class="pill amber">' + (a.userProvided ? 'Not provided' : 'Claimed') + '</span>', hayx: 'alternate financials ' + a.id,
        kv: [['Claim', esc(a.financials)], ['Source', a.userProvided ? 'Not provided in Alternate suppliers list.pdf' : srcFor(a, ['TTM-3', 'INF-5', 'CER-4', 'TOR-3', 'SCH-2'])], ['Entity', esc(a.name)], ['Evidence type', a.userProvided ? 'Financial information not included in supplied document' : 'Claimed (company page or results summary)'], ['Confidence', a.userProvided ? 'Not assessed' : 'Not independently checked']], issue: a.userProvided ? 'Not provided in the supplied list.' : 'Balance sheet not checked.' }));
    });
    return out;
  }
  function srcFor(a, ids) { const s = LH.srcById[ids.find((i) => LH.srcById[i] && LH.srcById[i].co === a.short) || '']; return s ? '<button type="button" class="chip" data-act="src" data-id="' + s.id + '">' + s.id + '</button> ' + LH.link(s.url, s.title) : 'Not shown'; }
  function rejCards() {
    const out = [];
    D.rejected.forEach((r) => out.push(card({ claim: '<b>' + r.id + '</b> · ' + esc(r.item), pill: '<span class="pill neutral">Rejected: ' + esc(r.cls) + '</span>', hayx: 'rejected link',
      kv: [['Claim', 'Not accepted as a supply link'], ['Source', docs(r.evidence)], ['Why not', esc(r.why)], ['Evidence type', 'Rejected reading'], ['Confidence', 'Not used in the network']], quote: r.quote })));
    D.unresolved.forEach((u) => out.push(card({ claim: '<b>' + u.id + '</b> · ' + esc(u.item), pill: '<span class="pill ' + (u.status === 'Inferred' ? 'st-inf' : 'st-unr') + '">' + esc(u.status) + '</span>', hayx: 'unresolved hypothesis ' + u.status,
      kv: [['Claim', esc(u.says)], ['Source', docs(u.evidence)], ['Would settle it', esc(u.settle === '-' ? 'Not applicable' : u.settle)], ['Evidence type', esc(u.status)], ['Confidence', u.status === 'Inferred' ? 'Low' : 'Not placed in the network']], issue: u.status === 'Inferred' ? 'Relationship inferred — verification required.' : u.status === 'Hypothesis' ? 'Hypothesis only. Do not assert a confirmed supply relationship.' : null })));
    return out;
  }
  function assCards() {
    return D.assumptions.map((a) => card({ claim: '<b>' + a.id + '</b> · ' + esc(a.t), hayx: 'assumption method',
      kv: [['Claim', esc(a.d)], ['Source', esc(a.src)], ['Evidence type', 'Assumption or method choice'], ['Confidence', 'Documented, editable in the scorecard workbook']] }));
  }
  const BUILD = { rel: relCards, risk: riskCards, ev: evCards, alt: altCards, rej: rejCards, ass: assCards };

  function filtered(tab) {
    const q = evi.q.trim().toLowerCase(); const toks = q ? q.split(/\s+/) : [];
    return BUILD[tab]().filter((c) => { const h = c.hay.toLowerCase(); return toks.every((t) => h.includes(t)); });
  }
  function body() {
    const items = filtered(evi.tab);
    let h = '';
    const rec = D.ev[evi.q.trim().toUpperCase()];
    if (rec && evi.tab === 'rel') {
      const id = evi.q.trim().toUpperCase();
      h += '<div class="ecard" style="border-color:var(--blue)"><div class="claim">Source record · ' + esc(id) + ' · ' + esc(rec.title) + '</div><div class="kv"><span>Type</span><span>' + esc(rec.type) + '</span><span>Date</span><span>' + esc(rec.date) + '</span><span>Source family</span><span>' + esc(rec.fam) + '</span><span>Status</span><span>' + esc(rec.status) + '</span></div><div class="quote">“' + esc(rec.detail) + '”</div></div>';
    }
    h += '<div class="small muted mb8">' + items.length + ' result' + (items.length === 1 ? '' : 's') + (evi.q ? ' for “' + esc(evi.q) + '”' : '') + '</div>';
    h += items.length ? items.map((c) => c.html).join('') : '<div class="empty">Nothing matched your search. Try a supplier, component, product, event, document ID, ORG ID or source.</div>';
    return h;
  }
  function tabsHTML() {
    return '<div class="tabs" role="tablist">' + TABS.map((t) => '<button type="button" role="tab" class="' + (evi.tab === t[0] ? 'on' : '') + '" data-act="evtab" data-t="' + t[0] + '">' + t[1] + ' <span class="xs muted">' + filtered(t[0]).length + '</span></button>').join('') + '</div>';
  }

  LH.pages.evidence = function (r) {
    if (r.q.tab) evi.tab = BUILD[r.q.tab] ? r.q.tab : 'rel';
    if (r.q.q != null) evi.q = r.q.q;
    let h = LH.pageH('Evidence Center', 'See why Lighthouse believes each important conclusion.');
    h += '<div class="panel flat"><label class="sr" for="evq">Search evidence</label><div class="search" style="max-width:none"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="9" r="6"/><path d="M14 14l4 4"/></svg><input id="evq" type="search" value="' + esc(evi.q) + '" placeholder="Search by supplier, component, product, event, document, ORG ID or source" autocomplete="off"></div>' +
      '<div class="xs muted mt8">Try <button type="button" class="chip" data-act="evset" data-q="DOC-078">DOC-078</button> <button type="button" class="chip" data-act="evset" data-q="Jade">Jade</button> <button type="button" class="chip" data-act="evset" data-q="ORG-439">ORG-439</button> <button type="button" class="chip" data-act="evset" data-q="C20">C20</button> <button type="button" class="chip" data-act="evset" data-q="Infineon">Infineon</button> <button type="button" class="chip" data-act="evset" data-q="">Clear</button></div></div>';
    h += '<div id="evtabs">' + tabsHTML() + '</div><div id="evbody">' + body() + '</div>';
    h += '<div class="note info mt16">Internal links are labelled Confirmed, Inferred or Unresolved. Alternate evidence is identified by source: public-page research is company-claimed, and new supplier-list entries are user-provided leads. Neither is independently verified. No URL, date or quote here is generated: each comes from the case data, supplied list or a page opened on ' + D.accessed + '.</div>';
    return h;
  };
  function refresh() { document.getElementById('evtabs').innerHTML = tabsHTML(); document.getElementById('evbody').innerHTML = body(); }
  const A = LH.A;
  A.evtab = (d) => { evi.tab = d.t; refresh(); };
  A.evset = (d) => { evi.q = d.q; const i = document.getElementById('evq'); if (i) i.value = d.q; refresh(); };
  document.addEventListener('input', (e) => { if (e.target.id === 'evq') { evi.q = e.target.value; refresh(); } });
})();
