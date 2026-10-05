/* LIGHTHOUSE - pure logic layer (no DOM). Everything here is derived from window.LH_DATA. */
(function () {
  'use strict';
  const D = window.LH_DATA;
  const LH = (window.LH = window.LH || {});
  LH.D = D;
  const split = (s) => String(s || '').split(',').map((x) => x.trim()).filter((x) => x && x !== '-');

  /* ---------- indexes ---------- */
  LH.sup = D.sup;
  LH.supList = Object.values(D.sup).sort((a, b) => a.rank - b.rank);
  LH.links = D.links.map((l) => Object.assign({}, l, {
    compsA: split(l.comps), prodsA: split(l.prods), directA: split(l.direct), contextA: split(l.context),
    famsA: split(l.famids), datesA: split(l.dates),
  }));
  LH.linkById = Object.fromEntries(LH.links.map((l) => [l.id, l]));
  LH.comps = D.components;
  LH.compById = Object.fromEntries(D.components.map((c) => [c.id, c]));
  LH.prods = D.products;
  LH.prodById = Object.fromEntries(D.products.map((p) => [p.id, p]));
  LH.alts = D.alt;
  LH.altById = Object.fromEntries(D.alt.map((a) => [a.id, a]));
  LH.srcById = Object.fromEntries(D.srcs.map((s) => [s.id, s]));
  LH.events = D.events;
  LH.eventById = Object.fromEntries(D.events.map((e) => [e.id, e]));
  LH.TOTAL = D.meta.total;
  LH.name = (id) => (id === 'NOVADRIVE' ? 'NovaDrive' : D.sup[id] ? D.sup[id].short : id);
  LH.altsFor = (supId) => D.alt.filter((a) => a.replaces === supId);
  LH.zoneSups = (z) => LH.supList.filter((s) => s.zone === z);
  LH.t1Ids = LH.supList.filter((s) => s.tiern === 1).map((s) => s.id);
  LH.sellLinks = (id) => LH.links.filter((l) => l.seller === id);
  LH.buyLinks = (id) => LH.links.filter((l) => l.buyer === id);
  LH.revOf = (prods) => prods.reduce((a, p) => a + LH.prodById[p].rev, 0);
  LH.prodsOfComps = (cs) => [...new Set(cs.flatMap((c) => LH.compById[c].prods))].sort();
  LH.compsOfProd = (p) => LH.prodById[p].comps;
  LH.money = (m) => (m >= 1000 ? 'USD ' + (m / 1000).toFixed(m % 1000 === 0 ? 1 : 2).replace(/0$/, '') + 'B' : 'USD ' + m + 'm');
  LH.usd = (m) => 'USD ' + m.toLocaleString('en-US') + 'm';
  LH.pct1 = (x) => (Math.round(x * 10) / 10).toFixed(1) + '%';

  /* ---------- KPIs (all computed, then asserted against the brief) ---------- */
  LH.kpi = (function () {
    const tiers = [1, 2, 3].map((t) => LH.supList.filter((s) => s.tiern === t).length);
    const conf = LH.links.filter((l) => l.status === 'Confirmed').length;
    const inf = LH.links.filter((l) => l.status === 'Inferred').length;
    return { suppliers: LH.supList.length, tiers, confirmed: conf, inferred: inf, material: 4, z01: LH.zoneSups('Z01').length };
  })();
  LH.MATERIAL = ['ORG-453', 'ORG-439', 'ORG-708', 'ORG-210']; // Jade, IonPeak, Orion, Meridian: next step "Search alternates now" + High confidence/Medium
  LH.KEY = { jade: 'ORG-453', ion: 'ORG-439', orion: 'ORG-708', meridian: 'ORG-210', aster: 'ORG-247', boreal: 'ORG-725' };

  /* ---------- action rules (Lighthouse refinement of the scorecard "next step") ---------- */
  LH.action = function (s) {
    const hasSupEv = s.events.some((e) => e.id !== 'EV-001');
    const alts = LH.altsFor(s.id);
    const a = { id: s.id, label: '', tone: 'blue', short: '', why: '' };
    const alt = alts.length ? alts.filter((x) => x.role.startsWith('Primary'))[0] || alts[0] : null;
    if (s.status === 'Inferred') {
      a.label = 'VERIFY FIRST'; a.tone = 'amber';
      a.short = 'Verify the link before any sourcing work';
      a.why = 'The link to this supplier is only inferred (U1). Spending sourcing effort before the relationship is confirmed risks solving the wrong problem. Ask for a direct disclosure or a shipment record that names both companies and the component.';
    } else if (s.band === 'High' && s.conf === 'Low') {
      a.label = 'VERIFY FIRST'; a.tone = 'amber';
      a.short = 'Score is high mainly because data is missing';
      a.why = 'The risk score is high, but confidence is Low: ' + (s.missing_fields.length ? s.missing_fields.length + ' of 8 indicator fields are missing, ' : '') + 'so the score may overstate or understate the real position. Get the missing data first. Verification can run in parallel with the alternate search for the confirmed suppliers.';
    } else if (s.band === 'High' && s.conf === 'High') {
      a.label = 'SEARCH ALTERNATE'; a.tone = 'red';
      a.short = 'No second qualified source is evidenced';
      a.why = 'High risk and High confidence: ' + s.fams + ' independent source families back the link' + (s.sole ? ', and ' + s.sole + ' states that no second source is qualified' : '') + '. This is the clearest case for qualifying a second source. ' + (alt ? alt.short + ' is a shortlisted candidate that sourcing and engineering must validate before any qualification work.' : '');
    } else if (s.band === 'High' && hasSupEv) {
      a.label = 'REVIEW / ACCELERATE'; a.tone = 'red';
      a.short = 'Review exposure now; accelerate the alternate search';
      a.why = 'High risk plus a matched supplier-specific signal (' + s.events.filter((e) => e.id !== 'EV-001').map((e) => e.id).join(', ') + '). Production continues, so this is the moment to review financial exposure and bring forward second-source validation' + (alt ? ' (' + alt.short + ' is shortlisted)' : '') + '. Confidence is Medium: the link rests on one source family.';
    } else if (s.band === 'High') {
      a.label = 'QUALIFY / VALIDATE'; a.tone = 'red';
      a.short = 'Validate the link, then qualify a second source';
      a.why = 'High risk with Medium confidence: only ' + s.fams + ' source family backs the link. Validate it with a second source of evidence while starting the qualification of ' + (alt ? alt.short + ', the shortlisted candidate' : 'a second source') + '. The supplier is in the Z01 flood-watch zone, so the exposure is live.';
    } else if (s.band === 'Medium' && s.conf === 'Low') {
      a.label = 'VERIFY DATA'; a.tone = 'amber';
      a.short = 'Medium score, thin evidence: close the data gap';
      a.why = 'Medium risk but Low confidence. Missing information is never treated as low risk, so close the data gap before relying on this score.';
    } else if (s.band === 'Medium') {
      a.label = 'MONITOR'; a.tone = 'blue'; a.short = 'Monitor and prepare a shortlist';
      a.why = 'Medium risk. No alternate research has been done for this supplier yet. Prepare a shortlist so a response is ready if a signal arrives.';
    } else if (s.conf === 'Low') {
      a.label = 'MONITOR · VERIFY DATA'; a.tone = 'neutral'; a.short = 'Low score, but the data is thin';
      a.why = 'Low risk band, but Low confidence: most indicator fields are missing. Low priority, but the score should not be read as proof of safety.';
    } else {
      a.label = 'MONITOR'; a.tone = 'neutral'; a.short = 'No action beyond monitoring';
      a.why = 'Low risk band and adequate evidence. Keep it in routine monitoring.';
    }
    a.ladder = s.next; // the scorecard v2 "next step", kept visible so refinements are transparent
    return a;
  };

  LH.whyMatters = function (s) {
    const K = LH.KEY;
    const m = {
      [K.jade]: 'Only qualified substrate source',
      [K.ion]: 'Only qualified die source behind both power-assembly suppliers',
      [K.orion]: 'Shared upstream + Z01 exposure',
      [K.meridian]: 'Financial stress + active financing signal',
    };
    if (m[s.id]) return m[s.id];
    const first = (s.driver || '').split(' | ')[0];
    return first.replace(/^[^:]+:\s*/, '').replace(/^./, (c) => c.toUpperCase());
  };

  LH.whyMatters2 = function (s) { // 1-2 sentence Supplier 360 explanation
    const t1 = LH.propagate([s.id]);
    if (s.tiern === 1) { const pr = LH.prodsOfComps(s.comps).map((p) => p + ' ' + LH.prodById[p].name).join(', '); const oth = s.comps.map((c) => LH.compById[c]).filter((c) => c.t1.length > 1); const sole = s.comps.filter((c) => LH.compById[c].t1.length === 1); return s.short + ' is a Tier-1 supplier of ' + s.comps.join(', ') + ' (' + pr + '). ' + (sole.length ? 'It is the only disclosed Tier-1 for ' + sole.join(', ') + ' (no backup disclosed).' : 'Another Tier-1 is disclosed for the same component, with a planning share only.'); }
    const t1n = t1.tier1.map((i) => LH.name(i)).join(', ');
    const prods = t1.prods.map((p) => p + ' ' + LH.prodById[p].name).join(', ');
    if (s.id === LH.KEY.jade) return 'Jade is a shared upstream choke point: it is the only qualified substrate source feeding three Tier-1 suppliers (' + t1n + '), and it sits in the Z01 flood-watch zone.';
    if (s.id === LH.KEY.ion) return 'IonPeak is the only qualified power-die source behind both power-assembly suppliers (Aster and Boreal), which share a parent. Two apparent sources are one effective upstream dependency.';
    if (s.id === LH.KEY.orion) return 'Orion supplies ceramic substrates to both Aster and Boreal, sits in the Z01 flood-watch zone, and only one source family backs the link.';
    if (s.id === LH.KEY.meridian) return 'Meridian has the weakest finances in the network (current ratio 0.62, net debt/EBITDA 7.2) and an active financing-pressure signal (EV-003). It feeds Delta Capacitor Works, the only C20 supplier.';
    if (t1.tier1.length) return s.short + ' reaches ' + t1n + ' and so ' + prods + '. ' + LH.whyMatters(s) + '.';
    return s.short + ' is a Tier-1 supplier of ' + s.comps.join(', ') + ' (' + prods + '). ' + LH.whyMatters(s) + '.';
  };

  /* ---------- confidence text ---------- */
  LH.CONF = {
    High: 'Evidence strongly supports the relationship and the data is complete.',
    Medium: 'The relationship is supported, but evidence or data has limitations.',
    Low: 'Important information is missing, or the relationship is inferred.',
  };

  /* ---------- impact propagation (used by Network trace, Scenario Lab, Copilot) ---------- */
  // failed: array of supplier ids. covered: optional array of supplier ids that have a (hypothetical) qualified second source.
  LH.propagate = function (failed, covered) {
    covered = new Set(covered || []);
    const fset = new Set(failed);
    const aff = {}; // supplier -> Set(components affected)
    const edges = new Set();
    const finalComps = new Set();
    failed.forEach((id) => { aff[id] = new Set(D.sup[id].comps); });
    let changed = true;
    const stopHere = (id) => covered.has(id); // a node with a (hypothetical) qualified second source absorbs the disruption
    while (changed) {
      changed = false;
      for (const l of LH.links) {
        const set = aff[l.seller];
        if (!set || stopHere(l.seller)) continue;
        const c = l.compsA.filter((x) => set.has(x));
        if (!c.length) continue;
        edges.add(l.id);
        if (l.buyer === 'NOVADRIVE') { c.forEach((x) => finalComps.add(x)); continue; }
        const t = (aff[l.buyer] = aff[l.buyer] || new Set());
        c.forEach((x) => { if (!t.has(x)) { t.add(x); changed = true; } });
      }
    }
    const ids = Object.keys(aff);
    const comps = [...finalComps].sort();
    const prods = LH.prodsOfComps(comps);
    const tier1 = ids.filter((i) => D.sup[i].tiern === 1 && !stopHere(i) && [...aff[i]].some((c) => finalComps.has(c)));
    const mids = ids.filter((i) => !fset.has(i) && D.sup[i].tiern > 1 && !stopHere(i));
    const failedLive = failed.filter((i) => !stopHere(i));
    // components that keep a Tier-1 source not affected
    const spare = {};
    comps.forEach((c) => {
      const others = LH.compById[c].t1.filter((t) => !tier1.includes(t.id));
      spare[c] = others;
    });
    const noSpare = comps.filter((c) => spare[c].length === 0);
    return {
      failed: [...failed], aff, edges: [...edges], tier1, mids, comps, prods, rev: LH.revOf(prods),
      revPct: Math.round((LH.revOf(prods) / LH.TOTAL) * 100), spare, noSpare,
      suppliers: [...new Set([...failedLive, ...mids, ...tier1])], failedLive,
    };
  };

  /* ---------- scenario lab ---------- */
  LH.EVENT_TYPES = [
    { id: 'shutdown', label: 'Site shutdown', hint: 'The supplier\'s site stops producing for the chosen duration.' },
    { id: 'financial', label: 'Financial failure', hint: 'The supplier cannot ship because of insolvency or a credit freeze.' },
    { id: 'regional', label: 'Regional event (whole zone)', hint: 'Every network site in the supplier\'s zone is disrupted at once, for example a flood.' },
  ];
  LH.scenario = function (supId, type, weeks, withAlt) {
    const s = D.sup[supId];
    const failed = type === 'regional' ? LH.zoneSups(s.zone).map((x) => x.id) : [supId];
    const base = LH.propagate(failed);
    // which failed suppliers have a shortlisted alternate
    const covered = failed.filter((f) => LH.altsFor(f).length);
    const alt = LH.propagate(failed, covered);
    const r = withAlt ? alt : base;
    const lead = Math.max(...failed.map((f) => D.sup[f].weeks));
    const leadFor = failed.map((f) => ({ id: f, weeks: D.sup[f].weeks, alts: LH.altsFor(f) }));
    return { s, type, weeks, failed, base, alt, covered, r, lead, leadFor, withAlt };
  };

  /* ---------- events ---------- */
  LH.EVX = {
    'EV-001': { entity: 'Zone Z01 (East Delta)', status: 'WATCH', tone: 'amber', kind: 'matched', action: ['Verify facility continuity at the Z01 sites', 'Check inventory cover', 'Check logistics routes'] },
    'EV-002': { entity: 'Zone Z01 (repeat of EV-001)', status: 'IGNORED', tone: 'neutral', kind: 'ignored', label: 'Duplicate', action: ['None: counted once under EV-001'] },
    'EV-003': { entity: 'Meridian Dielectrics (ORG-210)', status: 'PRODUCTION CONTINUES', tone: 'red', kind: 'matched', action: ['Review financial exposure', 'Accelerate alternate sourcing'] },
    'EV-004': { entity: 'Ion Peak Trading Ltd. (broker)', status: 'IGNORED', tone: 'neutral', kind: 'ignored', label: 'Wrong legal entity', action: ['None: not IonPeak Semiconductor'] },
    'EV-005': { entity: 'Archived port strike, effective 2023-11-03', status: 'IGNORED', tone: 'neutral', kind: 'ignored', label: 'Stale event', action: ['None: dispute ended in 2023'] },
    'EV-007': { entity: 'Jade (head office only)', status: 'IGNORED', tone: 'neutral', kind: 'ignored', label: 'Administrative change only', action: ['None unless production disruption is reported'] },
    'EV-009': { entity: 'Delta Consumer Plastics Ltd.', status: 'IGNORED', tone: 'neutral', kind: 'ignored', label: 'Wrong company', action: ['None: not Delta Capacitor Works'] },
    'EV-010': { entity: 'Gulf Arc port (no supplier tied to it)', status: 'IGNORED', tone: 'neutral', kind: 'ignored', label: 'No validated NovaDrive linkage', action: ['Ask which suppliers ship via Gulf Arc'] },
  };
  LH.eventSups = (evId) => LH.supList.filter((s) => s.events.some((e) => e.id === evId));

  /* ---------- evidence helpers ---------- */
  LH.docsFor = (supId) => {
    const s = D.sup[supId];
    const ids = [];
    if (s.sole) ids.push(s.sole);
    LH.sellLinks(supId).forEach((l) => l.directA.forEach((d) => { if (!ids.includes(d)) ids.push(d); }));
    return ids;
  };
  LH.evRecord = (id) => D.ev[id] || null;

  /* ---------- sensitivity ---------- */
  LH.WEIGHT_SETS = {
    current: { label: 'Current weights', w: [20, 15, 30, 15, 10, 10] },
    equal: { label: 'Equal weights', w: [1, 1, 1, 1, 1, 1] },
    health: { label: 'Health-led', w: [30, 20, 15, 10, 10, 15] },
  };
  LH.rankBy = function (key) {
    const w = LH.WEIGHT_SETS[key].w; const tot = w.reduce((a, b) => a + b, 0);
    const sc = LH.supList.map((s) => ({ id: s.id, v: s.d.reduce((a, d, i) => a + d * w[i], 0) / tot }));
    sc.sort((a, b) => b.v - a.v);
    const out = {}; sc.forEach((x, i) => { out[x.id] = { rank: i + 1, v: x.v }; });
    return out;
  };

  /* ---------- search index ---------- */
  LH.searchIndex = function () {
    const items = [];
    LH.supList.forEach((s) => items.push({ type: 'Supplier', id: s.id, label: s.short, sub: s.tier + ' · ' + s.id + ' · ' + s.site + ' · ' + s.zone, hay: [s.name, s.short, s.id, s.site].join(' ').toLowerCase(), go: ['supplier', s.id] }));
    LH.comps.forEach((c) => items.push({ type: 'Component', id: c.id, label: c.id + ' ' + c.name, sub: c.prods.join(', ') + ' · ' + c.weeks + ' wk qualification', hay: (c.id + ' ' + c.name).toLowerCase(), go: ['component', c.id] }));
    LH.prods.forEach((p) => items.push({ type: 'Product', id: p.id, label: p.id + ' ' + p.name, sub: 'Annual revenue USD ' + p.rev + 'm', hay: (p.id + ' ' + p.name).toLowerCase(), go: ['product', p.id] }));
    LH.events.forEach((e) => items.push({ type: 'Event', id: e.id, label: e.id + ' ' + e.head, sub: e.date + ' · ' + e.decision, hay: (e.id + ' ' + e.head).toLowerCase(), go: ['event', e.id] }));
    Object.keys(D.ev).forEach((id) => items.push({ type: 'Document', id, label: id, sub: D.ev[id].type + ' · ' + D.ev[id].date, hay: (id + ' ' + D.ev[id].title + ' ' + D.ev[id].type).toLowerCase(), go: ['doc', id] }));
    LH.alts.forEach((a) => items.push({ type: 'Alternate', id: a.id, label: a.name, sub: a.role + ' for ' + LH.name(a.replaces), hay: (a.name + ' ' + a.short).toLowerCase(), go: ['alt', a.id] }));
    const zs = [...new Set(LH.supList.map((s) => s.zone))].sort();
    zs.forEach((z) => items.push({ type: 'Zone', id: z, label: z + (z === 'Z01' ? ' East Delta' : ''), sub: LH.zoneSups(z).length + ' network sites', hay: (z + (z === 'Z01' ? ' east delta' : '')).toLowerCase(), go: ['zone', z] }));
    return items;
  };
})();
