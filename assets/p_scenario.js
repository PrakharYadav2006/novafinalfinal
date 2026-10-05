/* Screen 7 - Scenario Lab */
(function () {
  'use strict';
  const LH = window.LH, D = LH.D, esc = LH.esc;
  const sc = (LH.sc = { sup: 'ORG-439', type: 'shutdown', weeks: 8, ran: false, view: 'without' });
  const WEEKS = [2, 4, 8, 12, 16, 26];

  function flow(R, S) {
    const step = (h, b, cls) => '<div class="step ' + (cls || '') + '"><h5>' + h + '</h5>' + b + '</div>';
    const failedLive = R.failedLive || R.failed;
    let f = step(S.type === 'regional' ? 'Zone disrupted (' + S.s.zone + ')' : 'Disrupted', failedLive.length ? failedLive.map((i) => '<b>' + esc(LH.name(i)) + '</b>').join('<br>') : '<b>None left uncovered</b>', failedLive.length ? 'fail' : 'nxt');
    if (R.mids.length) f += '<span class="arrow">↓</span>' + step('Passes through', R.mids.map((i) => esc(LH.name(i))).join(' + '));
    const t1 = R.tier1.filter((i) => !failedLive.includes(i));
    if (t1.length) f += '<span class="arrow">↓</span>' + step('Tier-1 affected', t1.map((i) => esc(LH.name(i))).join(' + '));
    f += '<span class="arrow">↓</span>' + step('Components', R.comps.length ? R.comps.join(' / ') : 'None') + '<span class="arrow">↓</span>' + step('Products', R.prods.length ? R.prods.join(' / ') : 'None', R.prods.length ? '' : 'nxt');
    return '<div class="flowrow">' + f + '</div>';
  }

  function qualGap(S) {
    const w = S.lead, d = S.weeks; const n = S.failed.length;
    const reduction = Math.max(0, d - w);
    let t = '<b>' + w + ' weeks to qualify</b> against an <b>' + d + '-week disruption.</b> ';
    t += 'No alternate is qualified today, so all ' + d + ' weeks remain uncovered. ';
    t += reduction ? 'Starting on day 1 could shorten exposure by at most ' + reduction + ' weeks.' : 'Starting on day 1 cannot reduce exposure; qualification must begin before the disruption.';
    void n;
    return t;
  }

  function mitigation(S) {
    const withAlts = S.failed.filter((f) => LH.altsFor(f).length);
    const none = S.failed.filter((f) => !LH.altsFor(f).length);
    const out = [];
    if (S.type === 'financial') out.push('Review financial exposure and open orders with the supplier. Bring second-source validation forward.');
    else if (S.type === 'regional') out.push('Verify facility continuity at each disrupted site, then inventory cover and logistics routes. No damage is assumed.');
    else out.push('Confirm inventory cover and open orders with the affected Tier-1s. Inventory is not in the data, so this must come from the business.');
    if (withAlts.length) out.push('Validate and qualify the listed candidates before any disruption: ' + withAlts.map((f) => LH.altsFor(f).map((a) => a.short + ' for ' + LH.name(f)).join(', ')).join('; ') + '. Sourcing and engineering validation required.');
    if (none.length) out.push('No qualified candidate identified from the current evidence for: ' + none.map(LH.name).join(', ') + (none.some((f) => D.sup[f].conf === 'Low') ? '. For low-confidence suppliers, verify the data first.' : '.'));
    return out;
  }

  function results() {
    const S = LH.scenario(sc.supplier || sc.sup, sc.type, sc.weeks, sc.view === 'with');
    const B = S.base, Aa = S.alt; const R = S.r; const withAlt = sc.view === 'with'; const hasAlt = S.covered.length > 0;
    const t = (b, l, cls, sub) => '<div class="res ' + (cls || '') + '"><b class="num">' + b + '</b><span>' + l + '</span>' + (sub ? '<div class="xs muted mt8">' + sub + '</div>' : '') + '</div>';
    let h = LH.simBanner();
    h += '<div class="row mb8"><h2>' + esc(S.s.short) + ' · ' + LH.EVENT_TYPES.find((x) => x.id === sc.type).label + ' · ' + sc.weeks + ' weeks</h2></div>';
    h += '<div class="seg mb8" role="group" aria-label="Alternate comparison"><button type="button" class="' + (!withAlt ? 'on' : '') + '" data-act="scview" data-v="without">Compare without alternate</button><button type="button" class="' + (withAlt ? 'on' : '') + '" data-act="scview" data-v="with">Compare with qualified alternate</button></div>';
    if (withAlt && !hasAlt) h += '<div class="note empty">No qualified candidate identified from the current evidence for the disrupted supplier(s), so there is no “with alternate” case to show. The view below is unchanged.</div>';
    if (withAlt && hasAlt) h += '<div class="note warn"><b>Hypothetical:</b> assumes ' + S.covered.map((f) => { const al = LH.altsFor(f); return (al.find((a) => a.role.startsWith('Primary')) || al[0]).short; }).join(', ') + ' is already qualified and can carry the volume. Neither is established: these are shortlisted candidates, and capacity is not shown.</div>';
    h += '<div class="scenario-impact"><div><b>' + R.tier1.length + '</b><span>Tier-1s affected</span></div><div><b>' + R.prods.length + '</b><span>Products exposed</span></div><div><b>' + S.lead + '<small> weeks</small></b><span>Indicative qualification</span></div></div>';
    h += '<div class="scenario-exposure"><span>Products represent <b>' + LH.usd(R.rev) + '</b> annual revenue context</span><small>Not supplier spend or revenue at risk</small></div>';
    h += '<h3 class="mt24 mb8">How the disruption travels</h3>' + flow(R, S);
    h += '<div class="qualification-gap"><span class="eyebrow">QUALIFICATION GAP</span><p>' + qualGap(S) + '</p></div>';
    if (R.comps.length) h += '<div class="small mt8">' + (R.noSpare.length ? '<b>No unaffected Tier-1 is disclosed</b> for ' + R.noSpare.join(', ') + '. No backup disclosed.' : 'A different Tier-1 is disclosed for ' + R.comps.map((c) => c + ' (' + R.spare[c].map((x) => LH.name(x.id) + ' ' + x.share + '%').join(', ') + ')').join('; ') + ': planning shares only, capacity to absorb not shown.') + '</div>';
    // existing alternate
    h += '<h3 class="mt24 mb8">Available mitigation</h3>';
    const alts = S.failed.flatMap((f) => LH.altsFor(f));
    h += alts.length ? alts.map((a) => '<div class="alert-card" role="button" tabindex="0" data-act="alt" data-id="' + a.id + '" style="cursor:pointer"><div class="row"><b style="font-size:16px">' + esc(a.name) + '</b><span class="pill neutral">' + (a.userProvided ? 'SHORTLISTED ALTERNATE' : a.role) + '</span><span class="sp"></span><span class="small muted">for ' + esc(LH.name(a.replaces)) + '</span></div><div class="small mt8">' + esc(LH.altTiming(a)) + (a.id === 'ALT-INF' ? ' · <b>Not a drop-in swap</b>' : '') + '</div><div class="mt8">' + LH.altDisclaimer() + '</div></div>').join('') : '<div class="note empty">No candidate identified from the current evidence.</div>';
    h += '<h3 class="mt16 mb8">Recommended mitigation</h3><ul class="small" style="margin:0 0 0 18px;padding:0">' + mitigation(S).map((x) => '<li class="mb8">' + esc(x) + '</li>').join('') + '</ul>';
    // comparison table
    const cmpRow = (l, a, b) => '<tr><td>' + l + '</td><td class="n">' + a + '</td><td class="n">' + b + '</td></tr>';
    h += LH.adv('Before and after a qualified alternate', '<div class="t-wrap"><table class="t"><thead><tr><th></th><th>Without alternate (today)</th><th>With qualified alternate (hypothetical)</th></tr></thead><tbody>' +
      cmpRow('Suppliers affected', B.suppliers.length, hasAlt ? Aa.suppliers.length : 'n/a') + cmpRow('Tier-1s affected', B.tier1.length, hasAlt ? Aa.tier1.length : 'n/a') +
      cmpRow('Components affected', B.comps.join(', ') || 'None', hasAlt ? (Aa.comps.join(', ') || 'None') : 'n/a') + cmpRow('Products affected', B.prods.join(', ') || 'None', hasAlt ? (Aa.prods.join(', ') || 'None') : 'n/a') +
      cmpRow('Revenue context', LH.usd(B.rev), hasAlt ? LH.usd(Aa.rev) : 'n/a') + cmpRow('Components with no unaffected source', B.noSpare.join(', ') || 'None', hasAlt ? (Aa.noSpare.join(', ') || 'None') : 'n/a') + '</tbody></table></div><div class="xs muted mt8">Rule-based simulation. It follows confirmed and inferred links; inventory, recovery speed and spare capacity are not modeled.</div>');
    h += '<div class="rowbtns mt12">' + LH.btn('Trace in network', 'trace', { id: S.s.id }) + LH.btn('Find alternatives', 'alts', { id: S.s.id }) + LH.btn('Back to Overview', 'nav', { to: 'overview' }, 'ghost') + '</div>';
    return h;
  }

  LH.pages.scenario = function (r) {
    if (r.a && D.sup[r.a]) { sc.sup = r.a; sc.ran = true; sc.view = 'without'; }
    const sup = sc.sup;
    let h = LH.pageH('Scenario Lab', 'Test what could happen before a disruption happens.');
    h += LH.simBanner();
    h += '<div class="panel"><div class="sc-form">' +
      '<label>Supplier<select id="sc-sup">' + LH.supList.map((s) => '<option value="' + s.id + '"' + (s.id === sup ? ' selected' : '') + '>' + esc(s.short) + ' (' + LH.tierTxt(s) + ', ' + s.zone + ')</option>').join('') + '</select></label>' +
      '<label>Event type<select id="sc-type">' + LH.EVENT_TYPES.map((t) => '<option value="' + t.id + '"' + (t.id === sc.type ? ' selected' : '') + '>' + t.label + '</option>').join('') + '</select></label>' +
      '<label>Duration<select id="sc-weeks">' + WEEKS.map((w) => '<option value="' + w + '"' + (w === sc.weeks ? ' selected' : '') + '>' + w + ' weeks</option>').join('') + '</select></label>' +
      LH.btn('Run scenario', 'runsc', {}, 'pri') + '</div><div class="xs muted mt8" id="sc-hint">' + esc(LH.EVENT_TYPES.find((t) => t.id === sc.type).hint) + '</div></div>';
    h += '<div class="mt16" id="sc-out">' + (sc.ran ? results() : '<div class="empty">Choose a supplier, an event type and a duration, then press <b>Run scenario</b>.<br><span class="small">Example: IonPeak · Site shutdown · 8 weeks.</span></div>') + '</div>';
    return h;
  };
  const A = LH.A;
  function readForm() { sc.sup = document.getElementById('sc-sup').value; sc.type = document.getElementById('sc-type').value; sc.weeks = +document.getElementById('sc-weeks').value; sc.supplier = null; }
  A.runsc = () => { readForm(); sc.ran = true; sc.view = 'without'; LH.focus('sup', sc.sup); document.getElementById('sc-out').innerHTML = results(); document.getElementById('sc-out').scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  A.scview = (d) => { sc.view = d.v; document.getElementById('sc-out').innerHTML = results(); };
  document.addEventListener('change', (e) => { if (e.target.id === 'sc-type') document.getElementById('sc-hint').textContent = LH.EVENT_TYPES.find((t) => t.id === e.target.value).hint; });
})();
