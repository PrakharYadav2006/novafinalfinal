/* Screen 4 - Risk Intelligence */
(function () {
  'use strict';
  const LH = window.LH, D = LH.D, esc = LH.esc;
  const ui = (LH.riskUI = { ws: 'current', prod: '', conf: '', band: '', tier: '' });
  const W = D.meta.weights;

  function quad(s) {
    const hiR = s.band === 'High', hiC = s.conf !== 'Low';
    return hiR && hiC ? 'ACT NOW' : hiR ? 'VERIFY FIRST' : hiC ? 'MONITOR' : 'LOW PRIORITY';
  }
  LH.quad = quad;

  function matrix() {
    const Wd = 860, Ht = 470, x0 = 70, x1 = Wd - 70, y0 = 40, y1 = Ht - 48;
    const yv = (v) => y1 - (v - 12) / (84 - 12) * (y1 - y0);
    const colX = { Low: x0 + (x1 - x0) * 0.17, Medium: x0 + (x1 - x0) * 0.5, High: x0 + (x1 - x0) * 0.83 };
    const split = x0 + (x1 - x0) / 3; const yCut = yv(54.3);
    let s = '<svg id="mxsvg" viewBox="0 0 ' + Wd + ' ' + Ht + '" width="100%" role="img" aria-label="Risk by confidence matrix">';
    s += '<rect x="' + x0 + '" y="' + y0 + '" width="' + (split - x0) + '" height="' + (yCut - y0) + '" fill="#fbf1dc" opacity=".55"/>';
    s += '<rect x="' + split + '" y="' + y0 + '" width="' + (x1 - split) + '" height="' + (yCut - y0) + '" fill="#fcebe8" opacity=".6"/>';
    s += '<rect x="' + x0 + '" y="' + yCut + '" width="' + (split - x0) + '" height="' + (y1 - yCut) + '" fill="#f1efe8"/>';
    s += '<rect x="' + split + '" y="' + yCut + '" width="' + (x1 - split) + '" height="' + (y1 - yCut) + '" fill="#f7f6f2"/>';
    s += '<rect x="' + x0 + '" y="' + y0 + '" width="' + (x1 - x0) + '" height="' + (y1 - y0) + '" fill="none" stroke="#e3e0d8"/>';
    s += '<line x1="' + split + '" x2="' + split + '" y1="' + y0 + '" y2="' + y1 + '" stroke="#c9c5b8" stroke-dasharray="4 4"/><line x1="' + x0 + '" x2="' + x1 + '" y1="' + yCut + '" y2="' + yCut + '" stroke="#c9c5b8" stroke-dasharray="4 4"/>';
    const ql = (t, x, y, anc, sub) => '<text class="qlabel" x="' + x + '" y="' + y + '" text-anchor="' + anc + '" fill="#3c4863" font-size="13" font-weight="700" letter-spacing="1.4">' + t + '</text><text x="' + x + '" y="' + (y + 15) + '" text-anchor="' + anc + '" fill="#667089" font-size="11.5">' + sub + '</text>';
    s += ql('VERIFY FIRST', x0 + 10, y0 + 20, 'start', 'High score, thin evidence') + ql('ACT NOW', x1 - 10, y0 + 20, 'end', 'High score, evidence holds') + ql('LOW PRIORITY', x0 + 10, y1 - 22, 'start', 'Lower score, thin data: re-check, not safe') + ql('MONITOR', x1 - 10, y1 - 22, 'end', 'Lower score, evidence holds');
    [20, 30, 40, 50, 60, 70, 80].forEach((v) => { s += '<text x="' + (x0 - 8) + '" y="' + (yv(v) + 4) + '" text-anchor="end" font-size="12" fill="#667089">' + v + '%</text><line x1="' + x0 + '" x2="' + (x0 + 5) + '" y1="' + yv(v) + '" y2="' + yv(v) + '" stroke="#c9c5b8"/>'; });
    s += '<text x="' + (x1 - 8) + '" y="' + (yCut - 5) + '" text-anchor="end" font-size="11" fill="#667089">High band starts at 54.3%</text>';
    ['Low', 'Medium', 'High'].forEach((c) => { s += '<text x="' + colX[c] + '" y="' + (Ht - 26) + '" text-anchor="middle" font-size="13" font-weight="600" fill="#0e1a33">' + c + ' confidence</text>'; });
    s += '<text x="' + ((x0 + x1) / 2) + '" y="' + (Ht - 6) + '" text-anchor="middle" font-size="12" fill="#667089">Evidence confidence →</text><text transform="translate(16 ' + ((y0 + y1) / 2) + ') rotate(-90)" text-anchor="middle" font-size="12" fill="#667089">Overall risk →</text>';
    // points: beeswarm within each confidence column
    const placed = { Low: [], Medium: [], High: [] };
    const vis = LH.supList.filter(rowFilter);
    const pts = [];
    vis.slice().sort((a, b) => b.overall - a.overall).forEach((sp) => {
      const arr = placed[sp.conf]; const y = yv(sp.overall); let off = 0;
      const clash = (o) => arr.some((p) => Math.abs(p.y - y) < 24 && Math.abs(p.o - o) < 92);
      const okx = (o) => colX[sp.conf] + o >= x0 + 16 && colX[sp.conf] + o <= x1 - 84;
      const cands = [0, 100, -100, 200, -200, 300, -300].filter(okx);
      off = cands.find((o) => !clash(o)); if (off === undefined) off = cands[0] || 0;
      arr.push({ y, o: off }); pts.push({ s: sp, x: colX[sp.conf] + off, y });
    });
    pts.forEach((p) => {
      const sp = p.s; const fill = sp.band === 'High' ? '#b3261e' : sp.band === 'Medium' ? '#d29a2b' : '#8a95ad';
      const isSel = LH.ctx.sup === sp.id;
      s += '<g class="mxp" data-act="sup" data-id="' + sp.id + '" data-nodetip="' + sp.id + '" tabindex="0" role="button" aria-label="' + esc(sp.short + ', ' + sp.overall + '%, ' + sp.conf + ' confidence') + '" style="cursor:pointer">' + (isSel ? '<circle cx="' + p.x + '" cy="' + p.y + '" r="14" fill="none" stroke="#1d4f9c" stroke-width="3"/>' : '') +
        '<circle cx="' + p.x + '" cy="' + p.y + '" r="8" fill="' + fill + '" stroke="#fff" stroke-width="2"/><text x="' + (p.x + 12) + '" y="' + (p.y + 4) + '" font-size="12" fill="#0e1a33" font-weight="' + (sp.band === 'High' ? 700 : 500) + '">' + esc(sp.short.split(' ')[0]) + '</text></g>';
    });
    s += '</svg>';
    return s;
  }
  function rowFilter(s) {
    if (ui.prod && !s.prods.includes(ui.prod)) return false;
    if (ui.conf && s.conf !== ui.conf) return false;
    if (ui.band && s.band !== ui.band) return false;
    if (ui.tier && String(s.tiern) !== ui.tier) return false;
    return true;
  }
  function primaryDriver(s) {
    const seg = s.driver.split(' | ')[0]; const m = seg.match(/^([^:]+):\s*(.*)$/);
    return m ? { l: m[1], d: m[2] } : { l: seg, d: '' };
  }

  function sensitivity() {
    const cur = LH.rankBy('current'); const sel = LH.rankBy(ui.ws);
    const sets = Object.keys(LH.WEIGHT_SETS).map((k) => [k, LH.rankBy(k)]);
    const mat = LH.MATERIAL.map((i) => ({ id: i, worst: Math.max(...sets.map((x) => x[1][i].rank)) }));
    const worst = Math.max(...mat.map((m) => m.worst));
    let h = '<div class="note warn"><b>Analytical scenario — not case-provided official weights.</b> The case does not prescribe weights. This tests whether the recommendation survives other reasonable weightings.</div>';
    h += '<div class="seg mt8" role="group" aria-label="Weight set">' + Object.keys(LH.WEIGHT_SETS).map((k) => '<button type="button" class="' + (ui.ws === k ? 'on' : '') + '" data-act="rws" data-k="' + k + '">' + LH.WEIGHT_SETS[k].label + '</button>').join('') + '</div>';
    const w = LH.WEIGHT_SETS[ui.ws].w; const tot = w.reduce((a, b) => a + b, 0);
    h += '<div class="xs muted mt8">Weights D1–D6: ' + w.map((x, i) => 'D' + (i + 1) + ' ' + (Math.round(x / tot * 1000) / 10) + '%').join(' · ') + '</div>';
    h += '<div class="statement" style="border-color:var(--blue);font-size:17px">All four material vulnerabilities stay in the top ' + worst + ' of 24 under every weight set. ' + LH.help('A supplier whose rank barely moves is high under any reasonable weighting. A big move means its position depends on the weights.') + '</div>';
    h += '<div class="t-wrap"><table class="t"><thead><tr><th>Supplier</th><th>Rank: current weights</th><th>Rank: ' + LH.WEIGHT_SETS[ui.ws].label + '</th><th>Movement</th></tr></thead><tbody>' +
      LH.supList.slice(0, 14).map((s) => { const m = cur[s.id].rank - sel[s.id].rank; return '<tr class="clk ' + (LH.MATERIAL.includes(s.id) ? 'sel' : '') + '" data-act="sup" data-id="' + s.id + '"><td class="sname">' + esc(s.short) + '</td><td class="n">' + cur[s.id].rank + '</td><td class="n">' + sel[s.id].rank + '</td><td>' + (m === 0 ? '— no change' : m > 0 ? '▲ up ' + m : '▼ down ' + -m) + '</td></tr>'; }).join('') + '</tbody></table></div><div class="xs muted mt8">Top 14 by current weights shown. Highlighted rows are the four material vulnerabilities. Rankings under the three sets match scorecard v2 (Sensitivity sheet).</div>';
    return h;
  }

  LH.pages.risk = function () {
    if (LH.ctx.prod && !ui.prod) ui.prod = LH.ctx.prod;
    const rows = LH.supList.filter(rowFilter);
    const cnt = { High: 0, Medium: 0, Low: 0 }; LH.supList.forEach((s) => cnt[s.conf]++);
    let h = LH.pageH('Risk Intelligence', 'Prioritise where supplier failure matters most — and distinguish risk from uncertainty.');
    // filters
    h += '<div class="net-tools"><div class="seg" role="group" aria-label="Product filter">' + [['', 'All products']].concat(LH.prods.map((p) => [p.id, p.id + ' ' + p.name])).map((p) => '<button type="button" class="' + (ui.prod === p[0] ? 'on' : '') + '" data-act="rprod" data-p="' + p[0] + '">' + p[1] + '</button>').join('') + '</div>' +
      '<div class="filters"><label>Tier<select data-rf="tier"><option value="">All</option>' + [1, 2, 3].map((t) => '<option value="' + t + '"' + (ui.tier === String(t) ? ' selected' : '') + '>Tier-' + t + '</option>').join('') + '</select></label><label>Risk<select data-rf="band"><option value="">All</option>' + ['High', 'Medium', 'Low'].map((t) => '<option' + (ui.band === t ? ' selected' : '') + '>' + t + '</option>').join('') + '</select></label><label>Confidence<select data-rf="conf"><option value="">All</option>' + ['High', 'Medium', 'Low'].map((t) => '<option' + (ui.conf === t ? ' selected' : '') + '>' + t + '</option>').join('') + '</select></label></div></div>';
    if (ui.prod) h += '<div class="note info">Showing suppliers that reach <b>' + ui.prod + ' ' + esc(LH.prodById[ui.prod].name) + '</b>. Overall risk scores are network-wide and are not recomputed for a single product, so the ranking stays valid; only the list is filtered.</div>';

    h += '<div class="grid">';
    h += '<div class="c8">' + LH.panel('Risk × confidence', 'Each dot is a supplier. Click one to open Supplier 360.', rows.length ? '<div id="mx">' + matrix() + '</div><div class="xs muted mt8">' + ['ACT NOW', 'VERIFY FIRST', 'MONITOR', 'LOW PRIORITY'].map((q) => '<b>' + q + '</b> ' + rows.filter((s) => quad(s) === q).length).join(' · ') + '</div>' : LH.empty('Nothing matched your filters.'), '', 'Risk is how much failure would matter. Confidence is how well the evidence supports the assessment. A high score with low confidence means verify first, not ignore.') + '</div>';
    h += '<div class="c4">' + LH.panel('How confident are we?', null,
      '<div class="conf-summary">' + ['High', 'Medium', 'Low'].map((c) => '<button type="button" class="conf-item ' + (ui.conf === c ? 'on' : '') + '" data-act="rconf" data-c="' + c + '"><b>' + cnt[c] + '</b><span>' + c + ' confidence</span></button>').join('') + '</div>' +
      '<div class="small muted mt8">Confidence is separate from risk. Missing information is never treated as low risk.</div>', '', 'Confidence = the lower of link evidence (2+ independent source families = High, one = Medium, inferred = Low) and data completeness (High only if all 8 indicator fields are present).') + '</div>';
    h += '</div>';

    const table = (list) => list.length ? '<div class="t-wrap"><table class="t"><thead><tr><th>Rank</th><th>Supplier</th><th>Tier</th><th>Risk</th><th>Confidence</th><th>Primary driver</th><th>Action</th></tr></thead><tbody>' +
        list.map((s) => { const pd = primaryDriver(s); const a = LH.action(s); return '<tr class="clk ' + (LH.ctx.sup === s.id ? 'sel' : '') + '" data-act="sup" data-id="' + s.id + '" role="button" tabindex="0"><td class="n"><b>' + s.rank + '</b></td><td class="sname">' + esc(s.short) + '<small>' + s.zone + ' · ' + s.site + (s.status === 'Inferred' ? ' · inferred' : '') + '</small></td><td class="n">Tier-' + s.tiern + '</td><td class="n">' + LH.rk(s) + '<div class="xs muted">' + s.band + '</div></td><td>' + LH.confPill(s.conf) + '</td><td class="small"><b>' + esc(pd.l) + '</b><div class="xs muted">' + esc(pd.d.slice(0, 110)) + '</div></td><td>' + LH.actPill(a) + '</td></tr>'; }).join('') + '</tbody></table></div>' : LH.empty('Nothing matched your filters.');
    const materialRows = rows.filter((s) => LH.MATERIAL.includes(s.id));
    h += '<div class="mt24">' + LH.panel('Material vulnerabilities', 'Four recommended actions · click a supplier for the evidence and impact path.', table(materialRows)) +
      LH.adv('Full risk ranking · ' + rows.length + ' suppliers', '<p class="small muted">Latest scorecard v2 values. Click any row for Supplier 360.</p>' + table(rows)) + '</div>';

    h += LH.adv('Why this score?', '<p>Overall risk = <b>20%·D1 + 15%·D2 + 30%·D3 + 15%·D4 + 10%·D5 + 10%·D6</b>. Each dimension runs 0–100 (100 = riskiest).</p><div class="t-wrap"><table class="t"><thead><tr><th>Dimension</th><th>Weight</th><th>In plain words</th></tr></thead><tbody>' + LH.DIM.map((d) => '<tr><td class="sname">' + d[0] + ' ' + d[1] + '</td><td class="n">' + W[d[0]] + '%</td><td class="small">' + d[2] + '</td></tr>').join('') + '</tbody></table></div><p class="small mt8"><b>Network dependence gets the highest weight (30%)</b> because the case is about hidden upstream dependencies. Own health is next (20%). The information gap was cut from 15% to 10% so that missing data cannot outrank suppliers with proven single-source evidence.</p><div class="row">' + LH.btn('Full methodology', 'nav', { to: 'methodology' }, 'sm') + '</div>');
    h += LH.adv('Test model assumptions', '<div id="sens">' + sensitivity() + '</div>');
    return h;
  };
  const A = LH.A;
  A.rprod = (d) => { ui.prod = d.p; LH.rerender(); };
  A.rconf = (d) => { ui.conf = ui.conf === d.c ? '' : d.c; LH.rerender(); };
  A.rws = (d) => { ui.ws = d.k; document.getElementById('sens').innerHTML = sensitivity(); };
  document.addEventListener('change', (e) => { const s = e.target.closest('select[data-rf]'); if (s) { ui[s.dataset.rf] = s.value; LH.rerender(); } });
})();
