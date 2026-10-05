/* Screen 6 - Alternate Supplier Intelligence */
(function () {
  'use strict';
  const LH = window.LH, D = LH.D, esc = LH.esc;
  const st = (LH.src = { cmpA: null, cmpB: null });
  const PRIMARY = ['ORG-453', 'ORG-439', 'ORG-708', 'ORG-210'];

  const tally = (a) => { const t = { Strong: 0, Partial: 0, 'Not shown': 0 }; Object.values(a.ratings).forEach((x) => t[x.r]++); return t; };
  // gate: technical capability and application relevance must both be at least Partial
  LH.gate = (a) => {
    if (a.userProvided) return { ok: false, text: 'Not yet assessed. The supplied list names this candidate and describes it as an alternate; exact fit and qualification require validation.' };
    const t = a.ratings.tech.r, p = a.ratings.app.r;
    const ok = t !== 'Not shown' && p !== 'Not shown';
    return { ok, text: ok ? 'Passes the fit gate: technical capability and application relevance are both at least Partial.' : (t === 'Not shown' ? 'Excluded because exact technical capability was not sufficiently demonstrated.' : 'Excluded because application relevance was not sufficiently demonstrated.') };
  };

  function srcList(a) {
    const ids = [...new Set(Object.values(a.ratings).flatMap((r) => r.src))];
    return ids.map((i) => LH.srcById[i]).filter(Boolean);
  }

  function card(a) {
    const g = LH.gate(a); const t = tally(a); const sup = D.sup[a.replaces];
    const evidenceLabel = a.userProvided ? 'User-provided list' : 'Company-claimed';
    const evidenceHelp = a.userProvided ? 'Candidate and fitment details are from the PDF supplied by the user. The list is a research lead; capabilities, qualification, capacity and awards were not independently checked.' : 'Every rating comes from the company\'s own public pages, opened on ' + D.accessed + '. No independent source (certificate database, filing, customer announcement) was checked.';
    let h = '<div class="altcard ' + (st.cmpA === a.id || st.cmpB === a.id ? 'sel' : '') + '" id="' + a.id + '"><div class="row"><h3 style="font-size:19px;font-family:var(--serif)">' + esc(a.name) + '</h3><span class="pill neutral">' + (a.userProvided ? 'SHORTLISTED ALTERNATE' : a.role) + '</span>' + (a.userProvided ? '<span class="pill amber">QUALIFICATION REQUIRED</span>' : '') + '<span class="pill amber">Evidence: ' + evidenceLabel + ' ' + LH.help(evidenceHelp, 'Evidence basis') + '</span><span class="sp"></span>' + LH.btn(st.cmpA === a.id || st.cmpB === a.id ? 'In comparison ✓' : 'Add to comparison', 'cmpadd', { id: a.id }, 'sm') + '</div>';
    h += '<div class="small mt8"><b>Target component:</b> ' + esc(a.target) + ' · <b>Replaces:</b> ' + LH.chipSup(a.replaces) + ' <span class="muted">(' + LH.pct1(sup.overall) + ', ' + sup.conf + ' confidence)</span></div>';
    if (a.userProvided && a.site) h += '<div class="small mt8">Supplier website listed in PDF: ' + LH.link(a.site, a.site) + '</div>';
    h += '<div class="mt8">' + LH.altDisclaimer() + '</div>';
    if (a.userProvided) h += '<div class="note info mt8"><b>' + (a.ratings.tech.r === 'Not shown' ? 'Not yet assessed.' : 'Potential fit — validation required.') + '</b> The PDF lists this supplier for the incumbent. ' + (a.ratings.tech.r === 'Not shown' ? 'It does not provide a fitment rationale.' : 'Its description is a lead only: ' + esc(a.ratings.tech.note)) + '</div>';
    else h += '<div class="row mt8 small"><span class="muted">Fit on six factors:</span><span class="pill green">' + t.Strong + ' Strong</span><span class="pill amber">' + t.Partial + ' Partial</span><span class="pill neutral">' + t['Not shown'] + ' Not shown</span>' + LH.help('Counts of ratings, not a score. Ratings are not weighted or ranked into a number.', 'How to read this') + '</div>';
    h += '<div class="t-wrap mt8"><table class="cmp"><tbody>' + D.factors.map((f) => { const r = a.ratings[f.k]; return '<tr><td>' + f.n + '</td><td style="width:120px">' + LH.rate(a.userProvided ? 'Not shown' : r.r) + '</td><td class="small">' + esc(a.userProvided ? (f.k === 'tech' || f.k === 'app' ? r.note : 'Not assessed in the supplied list.') : r.note) + (r.src.length ? ' <span class="xs">' + r.src.map((s) => '<button type="button" class="chip" data-act="src" data-id="' + s + '">' + s + '</button>').join(' ') + '</span>' : '') + '</td></tr>'; }).join('') + '</tbody></table></div>';
    h += '<div class="note ' + (g.ok ? 'info' : 'warn') + '">' + esc(g.text) + '</div>';
    h += '<div class="small"><b>Qualification timing:</b> ' + esc(LH.altTiming(a)) + ' <span class="muted">' + esc(a.weeks_note) + '</span></div>';
    h += '<div class="small mt8"><b>How it would work:</b> ' + esc(a.how) + '</div>';
    h += '<div class="val"><h4>Open validation points · Validate before qualification</h4><ul>' + a.open.map((o) => '<li>' + esc(o) + '</li>').join('') + '</ul></div>';
    h += '<div class="rowbtns mt12">' + LH.btn('View alternate evidence', 'evq', { q: a.short, tab: 'alt' }, 'sm') + '</div>';
    h += '<details class="adv"><summary>' + (a.userProvided ? 'Financials and source document' : 'Financials and sources (company-claimed)') + '</summary><div class="body"><p class="small">' + esc(a.financials) + '</p>' + srcList(a).map((s) => '<div class="small mb8"><button type="button" class="chip" data-act="src" data-id="' + s.id + '">' + s.id + '</button> ' + (s.url ? LH.link(s.url, s.title) : esc(s.title)) + ' <span class="muted">· ' + esc(s.pagedate || 'no page date shown') + ' · ' + esc(s.accessed) + ' · ' + esc(s.type) + '</span></div>').join('') + (a.derived ? '<div class="note warn">Lighthouse-derived ratings: Phase 2 assessed this candidate in prose; the six ratings are derived from that prose.</div>' : '') + '</div></details>';
    if (a.providedProfile) {
      const p = a.providedProfile;
      h += LH.adv('Updated PDF profile · supplier claims not independently verified', '<div class="note warn">The statements below are reproduced from the supplied dossier. They are not independently verified, do not establish fit or qualification for NovaDrive, and do not reserve capacity.</div><div class="pdf-profile">' + [['Technical capability', p.capability], ['Application relevance', p.application], ['Manufacturing footprint', p.footprint], ['Scale', p.scale], ['Industry presence', p.industry], ['Qualification', p.qualification]].map((x) => '<div><b>' + x[0] + '</b><span>' + esc(x[1]) + '</span></div>').join('') + '</div><div class="small mt8">Source: alternatesuppliersproper.pdf, page ' + esc(p.page) + '. URL listed in the PDF: ' + LH.link(p.url, p.url) + '</div>');
    }
    h += '</div>';
    return h;
  }

  function compare() {
    const A = LH.altById[st.cmpA], B = LH.altById[st.cmpB];
    const opts = (cur) => LH.alts.map((a) => '<option value="' + a.id + '"' + (cur === a.id ? ' selected' : '') + '>' + esc(a.name) + ' (for ' + esc(LH.name(a.replaces)) + ')</option>').join('');
    let h = '<div class="row mb8"><label class="small muted">Compare <select data-cmp="A" style="font:inherit;padding:6px 8px;border:1px solid var(--line);border-radius:7px">' + opts(st.cmpA) + '</select></label><label class="small muted">with <select data-cmp="B" style="font:inherit;padding:6px 8px;border:1px solid var(--line);border-radius:7px">' + opts(st.cmpB) + '</select></label></div>';
    if (A.id === B.id) return h + LH.empty('Pick two different candidates to compare.');
    h += '<div class="t-wrap"><table class="cmp"><thead><tr><th></th><th>' + esc(A.name) + '<div class="xs muted" style="text-transform:none;letter-spacing:0">for ' + esc(LH.name(A.replaces)) + ' · ' + esc(A.role) + '</div></th><th>' + esc(B.name) + '<div class="xs muted" style="text-transform:none;letter-spacing:0">for ' + esc(LH.name(B.replaces)) + ' · ' + esc(B.role) + '</div></th></tr></thead><tbody>';
    D.factors.forEach((f) => { h += '<tr><td>' + f.n + '</td>' + [A, B].map((x) => '<td>' + (x.userProvided ? 'Not assessed' : LH.rate(x.ratings[f.k].r)) + '<div class="xs muted mt8">' + esc(x.userProvided ? (f.k === 'tech' || f.k === 'app' ? x.ratings[f.k].note : 'Not assessed in supplied list.') : x.ratings[f.k].note) + '</div></td>').join('') + '</tr>'; });
    h += '<tr><td>Qualification timing</td>' + [A, B].map((x) => '<td>' + esc(LH.altTiming(x)) + '</td>').join('') + '</tr>';
    h += '<tr><td>Evidence</td>' + [A, B].map((x) => '<td>' + (x.userProvided ? 'User-provided list; not independently verified' : 'Company-claimed, not independently verified') + '</td>').join('') + '</tr>';
    h += '<tr><td>Open questions</td>' + [A, B].map((x) => '<td><ul style="margin:0 0 0 16px;padding:0" class="small">' + x.open.map((o) => '<li>' + esc(o) + '</li>').join('') + '</ul></td>').join('') + '</tr></tbody></table></div><div class="mt8">' + LH.altDisclaimer() + '</div>';
    return h;
  }

  LH.pages.sourcing = function (r) {
    let supId = r.a && D.sup[r.a] ? r.a : (LH.ctx.sup && D.sup[LH.ctx.sup] ? LH.ctx.sup : 'ORG-453');
    const selAlt = r.b || null;
    const alts = LH.altsFor(supId); const s = D.sup[supId];
    if (!st.cmpA) { st.cmpA = 'ALT-TTM'; st.cmpB = 'ALT-SCH'; }
    if (alts.length >= 2 && !alts.find((a) => a.id === st.cmpA)) { st.cmpA = alts[0].id; st.cmpB = alts[1].id; }
    else if (alts.length === 1 && selAlt) { /* keep */ }
    if (selAlt && LH.altById[selAlt] && st.cmpA !== selAlt && st.cmpB !== selAlt && alts.length < 2) { st.cmpA = selAlt; }
    const step = alts.length ? (selAlt ? 4 : 2) : 1;
    let h = LH.pageH('Alternate Supplier Intelligence', 'Identify credible secondary sources for material vulnerabilities.');
    h += '<div class="sourcing-rail"><span class="on">01 <b>Choose source</b></span><i>→</i><span class="' + (step >= 2 ? 'on' : '') + '">02 <b>Assess fit</b></span><i>→</i><span>03 <b>Validate & qualify</b></span></div>';
    // selector: primary candidates
    h += '<div class="source-select mb16">' + PRIMARY.map((id) => {
      const p = D.sup[id]; const a = LH.altsFor(id).filter((x) => x.role.startsWith('Primary'))[0];
      return '<button type="button" class="source-select-item ' + (supId === id ? 'on' : '') + '" data-act="srcsel" data-id="' + id + '"><span>' + esc(p.short.split(' ')[0]) + ' <small>' + LH.pct1(p.overall) + '</small></span><b>' + esc(a.name) + '</b></button>';
    }).join('') + '</div>';
    h += '<div class="row mb16"><label class="small muted">Or search another supplier: <select data-srcsup style="font:inherit;padding:6px 8px;border:1px solid var(--line);border-radius:7px;max-width:260px">' + LH.supList.map((x) => '<option value="' + x.id + '"' + (x.id === supId ? ' selected' : '') + '>' + esc(x.short) + (LH.altsFor(x.id).length ? '' : ' (no candidate yet)') + '</option>').join('') + '</select></label></div>';
    const coverage = LH.supList.slice().sort((x, y) => x.rank - y.rank);
    h += '<div class="mt8">' + LH.adv('All suppliers · 24 of 24 coverage', '<p class="small muted">Ordered by risk rank. Every candidate is a shortlist lead; qualification and capacity are not established.</p><div class="t-wrap"><table class="t"><thead><tr><th>Supplier</th><th>Material</th><th>Tier</th><th>Risk</th><th>Confidence</th><th>Primary alternate</th><th>Status</th><th></th></tr></thead><tbody>' + coverage.map((x) => { const xs = LH.altsFor(x.id); const primary = xs.find((q) => q.role.startsWith('Primary')) || xs[0]; return '<tr><td class="sname">' + esc(x.short) + '</td><td>' + x.comps.map(LH.chipComp).join(' ') + '</td><td>' + LH.tierTxt(x) + '</td><td>' + LH.rk(x) + ' ' + LH.riskPill(x.band) + '</td><td>' + LH.confPill(x.conf) + '</td><td>' + (primary ? esc(primary.short) : '—') + '</td><td>' + (primary ? (primary.userProvided ? 'Shortlisted · qualification required' : 'Candidate · qualification required') : 'No candidate listed') + '</td><td>' + LH.btn('View alternate', 'srcsel', { id: x.id }, 'sm') + (primary ? ' ' + LH.btn('Evidence', 'evq', { q: primary.short, tab: 'alt' }, 'sm ghost') : '') + '</td></tr>'; }).join('') + '</tbody></table></div>') + '</div>';
    // incumbent summary
    const a0 = LH.action(s);
    h += '<div class="panel flat"><div class="row"><div><div class="xs muted">What needs replacing</div><b style="font-size:18px">' + esc(s.name) + '</b> ' + LH.rk(s) + ' ' + LH.riskPill(s.band) + ' ' + LH.confPill(s.conf) + '</div><span class="sp"></span>' + LH.actPill(a0) + LH.btn('Supplier 360', 'sup', { id: supId }, 'sm') + '</div><div class="small mt8">' + esc(LH.whyMatters2(s)) + '</div><div class="row mt8 small muted">Components ' + s.comps.map(LH.chipComp).join(' ') + ' · qualification ' + s.weeks + ' weeks indicative · ' + LH.help('Alternates are shortlisted candidates for sourcing to validate, not approved replacements.') + '</div></div>';
    if (!alts.length) {
      h += '<div class="note empty mt16">No alternate is listed for this supplier in the provided addendum.<br><span class="small">Any alternate search and qualification still requires sourcing and engineering review.</span></div>';
    } else {
      h += '<h2 class="mt24 mb8">What could replace this source?</h2><div class="candidate-stack">' + alts.map((a, i) => i === 0 ? card(a) : LH.adv('Backup candidate · ' + esc(a.name), card(a))).join('') + '</div>';
      if (supId === 'ORG-439') h += '<div class="note warn mt16"><b>PolarSwitch</b> — prospective only, not assessed. ' + esc(D.prospect.text) + ' ' + LH.chipDoc('DOC-078') + '</div>';
      if (supId === 'ORG-439') h += '<div class="note info"><b>Why not just another module assembler?</b> Aster and Boreal share one parent (DOC-075) and the same IonPeak die family (DOC-078). A different assembler does not provide independent die supply. The fix has to be an independent die maker. ' + LH.chipDoc('DOC-075') + ' ' + LH.chipDoc('DOC-078') + '</div>';
    }
    // fit logic + compare
    const notReady = LH.alts.filter((a) => !a.userProvided && !LH.gate(a).ok).length;
    h += '<div class="mt24">' + LH.adv('How alternates are judged', '<p class="small">Fit is separate from risk. Ratings are based on public-page research only. Entries from the supplied PDF are shortlist leads: technical fit, application fit, qualification and capacity are not yet assessed.</p><div class="t-wrap"><table class="t"><thead><tr><th>Candidate</th><th>Technical</th><th>Application</th><th>Status</th></tr></thead><tbody>' +
      LH.alts.map((a) => { const g = LH.gate(a); return '<tr><td class="sname">' + esc(a.name) + '<small>for ' + esc(LH.name(a.replaces)) + '</small></td><td>' + (a.userProvided ? 'Not assessed' : LH.rate(a.ratings.tech.r)) + '</td><td>' + (a.userProvided ? 'Not assessed' : LH.rate(a.ratings.app.r)) + '</td><td>' + (a.userProvided ? '<span class="pill amber">Shortlisted · qualification required</span>' : g.ok ? '<span class="pill green">Fit evidence found</span>' : '<span class="pill amber">Needs validation</span>') + '</td></tr>'; }).join('') + '</tbody></table></div><div class="xs muted mt8">' + notReady + ' researched candidates need more evidence to meet the fit gate. All candidates remain unqualified until sourcing and engineering validate them. PolarSwitch remains an unassessed prospect.</div>') + '</div>';
    h += '<div class="mt16" id="cmpbox">' + LH.adv('Compare candidates side by side', '<div id="cmpbody">' + compare() + '</div>') + '</div>';
    h += '<div class="mt16">' + LH.adv('Questions for sourcing and engineering', '<ol class="small" style="margin:0 0 0 18px"><li>Can you make our exact item?</li><li>Which plant would make it, and is it outside our exposed zones with independent inputs?</li><li>What spare capacity do you have?</li><li>How long would qualification really take? Indicative case times: 12 weeks for C10 and B10, 16 for M10/M20, 8 for C20.</li></ol>') + '</div>';
    return h;
  };

  const A = LH.A;
  A.srcsel = (d) => { LH.focus('sup', d.id); LH.go('sourcing/' + d.id); };
  A.cmpadd = (d) => { if (st.cmpA === d.id || st.cmpB === d.id) return; st.cmpB = st.cmpA; st.cmpA = d.id; LH.rerender(); const b = document.getElementById('cmpbox'); if (b) b.scrollIntoView({ behavior: 'smooth', block: 'center' }); };
  document.addEventListener('change', (e) => {
    const c = e.target.closest('select[data-cmp]'); if (c) { st['cmp' + c.dataset.cmp] = c.value; document.getElementById('cmpbody').innerHTML = compare(); return; }
    const s = e.target.closest('select[data-srcsup]'); if (s) A.srcsel({ id: s.value });
  });
})();
