/* Screen 5 - External Risk Intelligence (events) */
(function () {
  'use strict';
  const LH = window.LH, D = LH.D, esc = LH.esc;

  function facts(id) {
    const e = LH.eventById[id]; const x = LH.EVX[id]; const ss = LH.eventSups(id);
    const P = ss.length ? LH.propagate(ss.map((s) => s.id)) : null;
    return { e, x, ss, P };
  }

  function detail(id) {
    const { e, x, ss, P } = facts(id);
    const matched = x.kind === 'matched';
    const row = (k, v) => '<span>' + k + '</span><span>' + v + '</span>';
    let h = '<div class="row"><h2>' + id + ' · ' + esc(e.head) + '</h2></div>';
    h += '<div class="row mt8"><span class="pill ' + (x.tone === 'red' ? 'red' : x.tone === 'amber' ? 'amber' : 'neutral') + '">' + (matched ? '⚑ ' : '○ ') + x.status + '</span>' +
      (matched ? '<span class="pill blue">Matched to the network</span>' : '<span class="pill neutral">Ignored: ' + esc(x.label) + '</span>') + '<span class="pill neutral">' + esc(e.date) + '</span></div>';
    h += '<div class="ecard mt12" style="border:0;padding:0"><div class="kv" style="grid-template-columns:150px 1fr">' +
      row('Event', esc(e.detail)) + row('Entity / zone', esc(x.entity)) +
      row('Matched supplier', ss.length ? ss.map((s) => LH.chipSup(s.id)).join(' ') + (id === 'EV-001' ? ' <span class="xs muted">(Verdant: link inferred)</span>' : '') : (id === 'EV-007' ? 'Jade, head office only (not the production site)' : 'None')) +
      row('Matched facility', ss.length ? ss.map((s) => esc(s.site)).join(', ') : 'None') +
      row('Affected component', P ? P.comps.map((c) => LH.chipComp(c)).join(' ') + ' <span class="xs muted">through the suppliers above</span>' : 'None') +
      row('Affected products', P ? P.prods.map(LH.chipProd).join(' ') + ' <span class="xs muted">' + LH.usd(P.rev) + ' annual product revenue (context, not a loss estimate)</span>' : 'None') +
      row('Severity', matched ? '<b>' + e.sev + '</b> / 100 <span class="muted">(' + (id === 'EV-001' ? 'zone-level watch' : 'supplier-specific adverse report') + '; level is an assumption)</span>' : '0 <span class="muted">(not scored)</span>') +
      row('Reason', esc(e.why)) +
      row('Recommended action', '<ul style="margin:0 0 0 18px;padding:0">' + x.action.map((a) => '<li>' + esc(a) + '</li>').join('') + '</ul>') + '</div></div>';
    if (id === 'EV-001') h += '<div class="note info">This is a <b>watch</b>. No factory damage or shutdown is confirmed. Do not read it as a confirmed outage.</div>';
    if (id === 'EV-003') h += '<div class="note info">Production continues. The signal is a financing-pressure report, not a stoppage.</div>';
    h += '<div class="rowbtns mt12">';
    if (matched) h += LH.btn('Trace in network', 'evtrace', { id }, 'pri') + LH.btn('Simulate', 'evsim', { id }) + LH.btn('Find alternatives', 'evalts', { id });
    h += LH.btn('View evidence', 'evq', { q: id, tab: 'ev' }) + '</div>';
    h += LH.adv('Source record', '<div class="small">Source family <b>' + esc(e.fam) + '</b>. Original text: “' + esc(e.detail) + '”</div>');
    return h;
  }

  function hero(id, cls) {
    const { e, x, ss, P } = facts(id); const sel = (LH.cur.a || 'EV-001') === id;
    return '<div class="alert-card ' + cls + '" role="button" tabindex="0" data-act="ev" data-id="' + id + '" style="' + (sel ? 'border-color:var(--blue);box-shadow:0 0 0 2px var(--blue-soft)' : '') + '"><div class="id">' + id + ' · ' + x.status + ' · severity ' + e.sev + '</div><b style="font-size:17px">' + esc(e.head) + '</b>' +
      '<div class="small mt8">' + (id === 'EV-001' ? 'Zone Z01 · ' + ss.length + ' network sites potentially exposed' : 'Matched supplier: Meridian Dielectrics · feeds C20 → P1, P2') + '</div>' +
      '<div class="row mt8">' + ss.map((s) => '<span class="chip static">' + esc(s.short.split(' ')[0]) + '</span>').join('') + '</div>' +
      '<div class="small muted mt8">Action: <b style="color:var(--ink)">' + esc(x.action.slice(0, 2).join(' · ')) + '</b></div></div>';
  }

  LH.pages.events = function (r) {
    const sel = LH.eventById[r.a] ? r.a : 'EV-001';
    LH.cur.a = sel;
    let h = LH.pageH('External Risk Intelligence', 'Which external events can actually affect NovaDrive?');
    h += '<div class="event-rail"><span>Signal</span><i>→</i><span>Verified match</span><i>→</i><span>Network impact</span><i>→</i><span>Recommended action</span></div>';
    h += '<div class="grid mt16"><div class="c6">' + hero('EV-001', '') + '</div><div class="c6">' + hero('EV-003', 'red') + '</div></div>';
    h += '<div class="panel mt16" id="evdetail">' + detail(sel) + '</div>';
    // ignored
    const ign = D.events.filter((e) => LH.EVX[e.id].kind === 'ignored');
    h += '<div class="mt24">' + LH.adv('Ignored signals · ' + ign.length, '<p class="small muted">Signal quality matters as much as volume. None of these changes a supplier risk score. Events match by supplier ID, site or zone, never by similar names.</p>' +
      '<div class="t-wrap"><table class="t"><thead><tr><th>Event</th><th>Headline</th><th>Why it was ignored</th><th>Reason</th></tr></thead><tbody>' +
      ign.map((e) => '<tr class="clk ' + (sel === e.id ? 'sel' : '') + '" data-act="ev" data-id="' + e.id + '" role="button" tabindex="0"><td class="n"><b>' + e.id + '</b><div class="xs muted">' + e.date + '</div></td><td>' + esc(e.head) + '</td><td><span class="pill neutral">' + esc(LH.EVX[e.id].label) + '</span></td><td class="small">' + esc(e.why) + '</td></tr>').join('') + '</tbody></table></div>', '', 'Events are matched by supplier ID, site or zone, never by similar names. Duplicates, stale items, administrative changes and different-company events do not raise any risk score.') + '</div>';
    h += '<div class="mt16">' + LH.btn('Back to Overview', 'nav', { to: 'overview' }, 'ghost') + '</div>';
    return h;
  };
  LH.after.events = () => { /* nothing */ };

  const A = LH.A;
  A.evtrace = (d) => { LH.focus('ev', d.id); LH.net.full = false; LH.go('network/explorer'); };
  A.evsim = (d) => { const ss = LH.eventSups(d.id); if (d.id === 'EV-001') { LH.sc.type = 'regional'; LH.go('scenario/' + 'ORG-439'); } else { LH.sc.type = 'financial'; LH.go('scenario/' + ss[0].id); } };
  A.evalts = (d) => { const ss = LH.eventSups(d.id); const withAlt = ss.find((s) => LH.altsFor(s.id).length) || ss[0]; LH.focus('ev', d.id); LH.go('sourcing/' + withAlt.id); };
})();
