/* Methodology, Help, onboarding and tour */
(function () {
  'use strict';
  const LH = window.LH, D = LH.D, esc = LH.esc, $ = LH.$;

  /* ---------------- Methodology ---------------- */
  LH.pages.methodology = function (r) {
    const at = r.q.at || '';
    const sec = (id, n, t, b) => LH.acc(n, t, b, at === id, id);
    let h = LH.pageH('Methodology', 'How Lighthouse reaches each conclusion. Nothing here is hidden: every number can be traced to the case data or to a stated assumption.');
    h += sec('m-rules', 1, 'Source of truth and data rules',
      '<p class="small">Lighthouse uses the case materials, Phase 2 public-page research and the user-provided alternate-supplier list. It does not invent supply relationships, scores, revenue or qualifications.</p><ol class="small" style="margin:0 0 0 18px;line-height:1.6"><li>The Supplier Universe is a candidate universe, not the verified supply chain.</li><li>Relationships come from relationship evidence only.</li><li>Entities are matched on ORG ID and Site ID, never on similar names.</li><li>Confirmed, Inferred and Unresolved / Hypothesis are kept apart.</li><li>Planning allocation percentages are not purchase history.</li><li>USD 1.56B is annual NovaDrive product revenue behind the IonPeak dependency. It is not supplier spend.</li><li>Z01 is a fictional case zone (East Delta).</li><li>Alternate names and fitment notes from the PDF are research leads, not proof of qualification or the fictional incumbent network.</li><li>Missing information never implies low risk.</li><li>Alternates are shortlisted candidates, not approved replacements.</li><li>Public company information is company-claimed unless independently supported.</li></ol>');
    h += sec('m-net', 2, 'How the network is built',
      '<p class="small">24 suppliers (8 Tier-1, 10 Tier-2, 6 Tier-3) are connected by 32 links: 31 Confirmed by a direct statement (disclosure, qualification register or shipment observation) and 1 Inferred (Verdant → IonPeak, U1). Two hypotheses (Solace Optics → Grove, Alder Bauxite → Quartz) are held outside the network. Nine candidate readings were rejected (R1–R9), for example Ion Peak Trading, a broker that is not IonPeak Semiconductor.</p><div class="row">' + LH.btn('See rejected and unresolved items', 'evq', { q: '', tab: 'rej' }, 'sm') + '</div>');
    h += sec('m-risk', 3, 'How risk is calculated',
      '<p class="small"><b>Overall risk = 20%·D1 + 15%·D2 + 30%·D3 + 15%·D4 + 10%·D5 + 10%·D6.</b> Each dimension is 0–100 (100 = riskiest). The scorecard v2 workbook is the source of truth; Lighthouse re-checks that its numbers equal the workbook.</p><div class="t-wrap"><table class="t"><thead><tr><th>Dimension</th><th>Weight</th><th>How it is computed</th></tr></thead><tbody>' +
      '<tr><td class="sname">D1 Financial &amp; operational health</td><td>20%</td><td class="small">Average of current ratio (lower is riskier), net debt/EBITDA (higher is riskier), on-time shipments 3-month average (lower is riskier) and on-time change since January (more negative is riskier), each scaled between the network minimum and maximum. If financials are missing, only the two on-time sub-scores are used.</td></tr>' +
      '<tr><td class="sname">D2 Location &amp; systemic exposure</td><td>15%</td><td class="small">Average of the physical hazard, logistics friction and infrastructure indices of the facility zone.</td></tr>' +
      '<tr><td class="sname">D3 Network dependence</td><td>30%</td><td class="small">Average of (a) Tier-1 suppliers that fail with it, scaled 1 = 0 to 3 = 100 (Aster and Boreal count as 2: same parent); (b) share of component supply routed through it; (c) single-source level 100 / 50 / 0.</td></tr>' +
      '<tr><td class="sname">D4 Business criticality &amp; substitutability</td><td>15%</td><td class="small">Average of revenue of linked products as % of USD 1,560m, and weeks to qualify a replacement divided by the longest (16).</td></tr>' +
      '<tr><td class="sname">D5 Dynamic external threats</td><td>10%</td><td class="small">Highest matched event severity: zone watch 40, supplier-specific adverse report 60, confirmed disruption 100 (assumed levels).</td></tr>' +
      '<tr><td class="sname">D6 Information gap</td><td>10%</td><td class="small">Average of the assurance gap index (missing = 100) and the share of the 8 indicator fields that are missing × 100.</td></tr></tbody></table></div>' +
      '<p class="small mt8"><b>Bands</b> are relative thirds of the 24 suppliers: High ≥ 54.3, Medium ≥ 41.5, Low below. <b>Confidence</b> is the lower of link evidence (2+ independent source families = High, one = Medium, inferred = Low) and data completeness (High only if all 8 indicator fields are present). Confidence never changes the risk %.</p>');
    h += sec('m-rev', 4, 'How the USD 1.56B is calculated',
      '<p class="small">USD 1,560m = P1 DriveCore 624 + P2 ChargeBridge 520 + P3 StoreLink 416: the annual revenue of the three products that all depend on the IonPeak die source (DOC-078). It is <b>product revenue</b>. It is not supplier spend, not procurement spend and not revenue at risk, because the data holds no supplier spend or purchase history and no loss estimate. Lighthouse shows it only as business context.</p>');
    h += sec('m-act', 5, 'How actions are chosen',
      '<p class="small">The scorecard v2 gives a next step (inferred link → verify the link first; High band + Low confidence → verify data first; High band otherwise → search alternates now; Medium → prepare shortlist; Low → monitor). Lighthouse refines the High band using confidence and live events:</p><ul class="small" style="margin:0 0 0 18px"><li><b>VERIFY FIRST</b>: inferred link, or High risk with Low confidence (Umber, Verdant, Warden, Xenon).</li><li><b>SEARCH ALTERNATE</b>: High risk and High confidence (Jade, IonPeak). No second source is qualified, per DOC-079 and DOC-078.</li><li><b>QUALIFY / VALIDATE</b>: High risk, Medium confidence, no supplier-specific event (Orion). Validate the single-family link while qualification starts.</li><li><b>REVIEW / ACCELERATE</b>: High risk, Medium confidence, with a matched supplier-specific event (Meridian, EV-003).</li><li><b>MONITOR</b>: Medium or Low band with adequate evidence; Medium also means prepare a shortlist.</li></ul><p class="small mt8">The scorecard says “search alternates now” for all four of Jade, IonPeak, Orion and Meridian. Lighthouse keeps that visible under “Why this action?” and uses the confidence level to say whether to search, validate or review first.</p>');
    h += sec('m-ev', 6, 'How events are matched',
      '<p class="small">An event counts only if it names a supplier (exact legal name), a facility or a zone code in the network. EV-001 matches by zone code Z01 (5 sites). EV-003 matches Meridian by exact name. Rejected: EV-002 duplicate (same source family as EV-001), EV-004 different entity (Ion Peak Trading), EV-005 stale (2023), EV-007 administrative move only, EV-009 different company, EV-010 no validated linkage (Gulf Arc). EV-006 and EV-008 are absent from the data.</p>');
    h += sec('m-alt', 7, 'How alternates are judged',
      '<p class="small">Six factors from the handbook: technical capability, application relevance, manufacturing footprint, scale, demonstrated industry presence and qualification. The four researched candidates are rated Strong, Partial or Not shown from company public pages (opened ' + D.accessed + '). PDF-listed suppliers remain shortlist leads: fit and qualification are Not yet assessed unless the source description gives a potential fitment lead. No quantitative score is invented. “Outside Z01” cannot be tested for real companies, so footprint means plant spread.</p>');
    h += sec('m-sim', 8, 'How scenarios are simulated',
      '<p class="small">Choose a supplier, an event type and a duration. Lighthouse follows confirmed and inferred links from the disrupted supplier(s) to Tier-1s, components and products, and sums the annual revenue of the affected products as context. “With qualified alternate” removes disruption at suppliers that have a shortlisted candidate, as a hypothetical. The simulation does not model inventory, recovery speed, spare capacity or lost revenue.</p>');
    h += sec('m-ask', 9, 'How Ask Lighthouse works',
      '<p class="small">Ask Lighthouse is <b>not a live language model</b>. It matches your question to a fixed set of query templates and answers from the same data and logic you see elsewhere, with evidence links. If it cannot ground an answer, it says so.</p>');
    h += sec('m-ass', 10, 'Assumptions and limits', '<div>' + D.assumptions.map((a) => '<div class="ecard"><div class="claim"><b>' + a.id + '</b> · ' + esc(a.t) + '</div><div class="small">' + esc(a.d) + ' <span class="muted">(' + esc(a.src) + ')</span></div></div>').join('') + '</div>');
    return h;
  };
  LH.after.methodology = (r) => { if (r.q.at) { const e = document.getElementById(r.q.at); if (e) e.scrollIntoView({ block: 'start' }); } };

  /* ---------------- Help ---------------- */
  const DEMO = [
    ['Open Overview', 'overview'], ['Point to “Needs Attention”', 'overview'], ['Click IonPeak', 'supplier/ORG-439'], ['Click “Trace impact”', 'network/explorer'],
    ['Show Aster + Boreal, M10/M20, P1/P2/P3', 'network/explorer'], ['Click “Why is this risky?”', 'supplier/ORG-439'], ['Show 65.3% + High confidence', 'supplier/ORG-439'], ['Click EV-001', 'events/EV-001'],
    ['Show Z01 exposure', 'network/zones/Z01'], ['Click “Find alternatives”', 'sourcing/ORG-439'], ['Show Infineon, fit and open validation points', 'sourcing/ORG-439/ALT-INF'], ['Open Evidence, show DOC-078', 'evidence?tab=rel&q=DOC-078'],
    ['Open Scenario Lab, simulate IonPeak disruption', 'scenario/ORG-439'], ['Return to Overview: “Search alternate now.”', 'overview'],
  ];
  LH.pages.help = function () {
    let h = LH.pageH('Help', 'Everything you need to read the product in one minute.');
    h += '<div class="grid"><div class="c7">' + LH.panel('How to read Lighthouse', 'Each level answers one question. Deeper levels stay out of the way until you open them.',
      '<table class="t"><tbody>' + [['1', 'What needs attention?', 'Overview → Needs Attention', 'overview'], ['2', 'Why?', 'Supplier 360 → Why is this risky?', 'risk'], ['3', 'What is affected?', 'Network Explorer → Trace impact', 'network'], ['4', 'What can we do?', 'Sourcing → Find alternatives; Scenario Lab', 'sourcing'], ['5', 'What evidence supports it?', 'Evidence Center → Why should I trust this?', 'evidence'], ['6', 'How is it calculated?', 'Methodology, “How calculated?” panels', 'methodology']].map((x) => '<tr class="clk" data-act="nav" data-to="' + x[3] + '"><td class="n"><b>' + x[0] + '</b></td><td><b>' + x[1] + '</b></td><td class="small muted">' + x[2] + '</td></tr>').join('') + '</tbody></table>') +
      '<div class="mt16">' + LH.panel('Words used here', null, '<dl class="small" style="margin:0">' + [
        ['Risk', 'How much failure of this supplier would matter, 0–100%. From the six-dimension model. Higher is riskier.'],
        ['Confidence', 'How well the evidence supports the assessment. Separate from risk. A high score with low confidence means verify first.'],
        ['Tier-1 / 2 / 3', 'Tier-1 suppliers sell directly to NovaDrive. Tier-2 suppliers sell to a Tier-1. Tier-3 suppliers sell to a Tier-2.'],
        ['Confirmed / Inferred', 'Confirmed: a direct statement names both companies and the component. Inferred: the link is suggested but not stated; verification required.'],
        ['Planning allocation', 'The disclosed share of a component a Tier-1 is planned to supply. Not purchase history.'],
        ['Material vulnerability', 'A supplier whose score is High and whose evidence holds (High or Medium confidence): Jade, IonPeak, Orion, Meridian.'],
        ['Shortlisted candidate', 'A real company that looks capable from public pages. Sourcing and engineering validation required. Not approved.'],
        ['Simulated', 'A what-if. Not an actual event.'],
        ['Z01', 'A fictional case zone, East Delta. Five network sites sit in it.'],
      ].map((x) => '<dt style="font-weight:600;margin-top:8px">' + x[0] + '</dt><dd style="margin:2px 0 0">' + x[1] + '</dd>').join('') + '</dl>') + '</div></div>';
    h += '<div class="c5">' + LH.panel('60–90 second walkthrough', 'The path for a live demo. Each step jumps to the right screen.',
      '<ol class="small" style="margin:0 0 0 18px;line-height:1.9">' + DEMO.map((s) => '<li><button type="button" class="btn ghost sm" data-act="demostep" data-to="' + s[1] + '">' + esc(s[0]) + '</button></li>').join('') + '</ol>') +
      '<div class="mt16">' + LH.panel('Tips', null, '<ul class="small" style="margin:0 0 0 18px"><li>Press <b>/</b> to search from anywhere.</li><li>Click any supplier, component, product or event: the whole product follows it. “Clear focus” resets.</li><li><b>?</b> icons explain a term in one sentence.</li><li>Press <b>Esc</b> to close panels.</li></ul><div class="row mt12">' + LH.btn('Replay welcome', 'welcome', {}, 'sm') + LH.btn('Take the 30-second tour', 'tour', {}, 'sm') + '</div>') + '</div></div></div>';
    return h;
  };
  LH.A.demostep = (d) => LH.go(d.to);

  /* ---------------- Onboarding + tour ---------------- */
  const KEY = 'lh_onboarded_v1';
  LH.welcome = () => {
    LH.modal('<div class="crumb">First visit</div><div class="ob-title">Welcome to Project Lighthouse</div><p style="font-size:18px;color:var(--ink2)">Your CRO cockpit for supplier-network risk.</p><div class="ob-three"><div><b>1</b>Find hidden dependencies.</div><div><b>2</b>Understand material risk.</div><div><b>3</b>Take sourcing action.</div></div><div class="row">' + LH.btn('Start with the risk overview', 'ob-start', {}, 'pri') + LH.btn('Take a 30-second tour', 'ob-tour', {}) + '</div><div class="xs muted mt16">Built on the fictional NovaDrive case data. Nothing is sent anywhere: all data is in this page.</div>');
    $('#overlay').dataset.lock = '1';
  };
  const done = () => { LH.store.set(KEY, '1'); };
  LH.A['ob-start'] = () => { done(); LH.closeModal(); LH.go('overview'); };
  LH.A['ob-tour'] = () => { done(); LH.closeModal(); LH.startTour(); };
  LH.A.welcome = () => LH.welcome();
  LH.A.tour = () => LH.startTour();

  const STEPS = [
    ['#needs', 'Action Queue', 'Start here. Needs Attention lists the suppliers that matter, how risky they are, how sure we are, and the next action.', 'overview'],
    ['#nav-network', 'Network Explorer', 'Trace who depends on whom, from NovaDrive down to Tier-3. Click any node and use “Trace impact”.', null],
    ['#nav-risk', 'Risk & Confidence', 'See risk and confidence side by side. High risk with low confidence means verify first.', null],
    ['#nav-events', 'Events', 'Which external signals really affect NovaDrive, and why the others were ignored.', null],
    ['#nav-sourcing', 'Sourcing', 'Shortlisted alternate suppliers, how they fit, and what still needs validating.', null],
    ['#nav-evidence', 'Evidence', 'Every conclusion traces to source records. Open any document ID.', null],
  ];
  let tourI = 0;
  LH.tourActive = false;
  LH.startTour = () => { LH.closeModal(); LH.tourActive = true; tourI = 0; if (LH.cur.page !== 'overview') { LH.go('overview'); setTimeout(showStep, 80); } else showStep(); };
  function clearTour() { ['#tourhl', '#tourpop'].forEach((s) => { const e = $(s); if (e) e.remove(); }); }
  function showStep() {
    clearTour(); const st = STEPS[tourI]; if (!st) return LH.endTour();
    const el = $(st[0]); if (!el) { tourI++; return showStep(); }
    el.scrollIntoView({ block: 'center' });
    let r = el.getBoundingClientRect();
    if (r.height > window.innerHeight * 0.55) { window.scrollBy(0, r.top - 90); r = el.getBoundingClientRect(); r = { left: r.left, right: r.right, top: r.top, bottom: r.top + 240, width: r.width, height: 240 }; }
    const hl = document.createElement('div'); hl.id = 'tourhl'; hl.className = 'tour-hl';
    hl.style.cssText = 'left:' + (r.left - 5) + 'px;top:' + (r.top - 5) + 'px;width:' + (r.width + 10) + 'px;height:' + (r.height + 10) + 'px';
    document.body.appendChild(hl);
    const pop = document.createElement('div'); pop.id = 'tourpop'; pop.className = 'tour-pop';
    pop.innerHTML = '<div class="xs muted">Step ' + (tourI + 1) + ' of ' + STEPS.length + '</div><h3 style="margin:2px 0 6px;font-family:var(--serif);font-size:19px">' + st[1] + '</h3><p class="small">' + st[2] + '</p><div class="row mt8">' + (tourI > 0 ? LH.btn('Back', 'tour-back', {}, 'sm') : '') + LH.btn(tourI === STEPS.length - 1 ? 'Finish' : 'Next', 'tour-next', {}, 'sm pri') + '<span class="sp"></span>' + LH.btn('Skip tour', 'tour-skip', {}, 'sm ghost') + '</div>';
    document.body.appendChild(pop);
    let x = r.right + 16, y = Math.max(12, r.top); if (x + 340 > window.innerWidth) { x = Math.min(window.innerWidth - 340, Math.max(12, r.left + 24)); y = r.bottom + 14; }
    if (y + 190 > window.innerHeight) y = Math.max(12, window.innerHeight - 200);
    pop.style.left = x + 'px'; pop.style.top = y + 'px';
  }
  LH.endTour = () => { LH.tourActive = false; clearTour(); done(); };
  LH.A['tour-next'] = () => { tourI++; if (tourI >= STEPS.length) LH.endTour(); else showStep(); };
  LH.A['tour-back'] = () => { tourI = Math.max(0, tourI - 1); showStep(); };
  LH.A['tour-skip'] = () => LH.endTour();
  window.addEventListener('resize', () => { if (LH.tourActive) showStep(); });
  LH.maybeWelcome = () => { if (!LH.store.get(KEY)) LH.welcome(); };
})();
