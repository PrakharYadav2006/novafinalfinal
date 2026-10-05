/* Overview: editorial decision brief. The deeper model stays one click away. */
(function(){'use strict';
const LH=window.LH,D=LH.D,esc=LH.esc,K=LH.KEY;
LH.pages.overview=function(){
 const k=LH.kpi;
 const mat=LH.MATERIAL.map(i=>D.sup[i]).sort((a,b)=>a.rank-b.rank);
 const lead=mat.find(s=>s.id===K.ion)||mat[0];
 const rest=mat.filter(s=>s.id!==lead.id);
 const action=LH.action(lead), alt=LH.altsFor(lead.id)[0];
 let h='<section class="overview-lead"><div class="overview-copy"><div class="eyebrow">PROJECT LIGHTHOUSE <span> / </span> NOVADRIVE</div>'+
  '<h1>Know where<br>the network breaks.</h1><p>Supplier risk, traced to the components and products it can interrupt.</p></div>'+
  '<svg class="net" viewBox="0 0 600 300" preserveAspectRatio="xMaxYMid slice" aria-hidden="true"><path class="l" d="M40 220L150 120L260 190L380 80L520 150M150 120L200 40L380 80M260 190L330 270L520 150M380 80L470 20"/><g class="n"><circle cx="40" cy="220" r="3"/><circle cx="150" cy="120" r="3.5"/><circle cx="260" cy="190" r="3"/><circle cx="380" cy="80" r="4"/><circle cx="520" cy="150" r="3"/><circle cx="200" cy="40" r="2.5"/><circle cx="330" cy="270" r="2.5"/><circle cx="470" cy="20" r="2.5"/></g><path class="run" d="M40 220L150 120L260 190L380 80L520 150"/></svg></section>';
 h+='<section class="priority"><div class="priority-head"><span class="eyebrow">DEPENDENCY IN FOCUS</span><span class="priority-risk">'+LH.pct1(lead.overall)+' <small>risk</small></span></div>'+
  '<div class="priority-body"><div><h2>'+esc(lead.short)+'</h2><p>'+esc(LH.whyMatters(lead))+'</p><div class="priority-meta"><span>'+esc(action.label)+'</span><span>'+lead.conf+' confidence</span></div></div>'+
  '<div class="priority-impact"><span class="eyebrow">NETWORK REACH</span><strong>Aster + Boreal</strong><span>→ M10 / M20</span><span>→ P1 / P2 / P3</span>'+LH.btn('SEARCH ALTERNATE','alts',{id:lead.id},'sm')+'</div></div>'+
  '<div class="priority-foot"><span>'+(alt?alt.weeks+' weeks indicative qualification · '+esc(alt.short)+' shortlisted':'Qualification timing requires review')+'</span><span>Candidate requires engineering validation</span></div></section>';
 h+='<section class="overview-context" aria-label="Network coverage"><div><b>'+k.suppliers+'</b><span>suppliers mapped</span></div><div><b>'+k.confirmed+'</b><span>confirmed links</span></div><div><b>'+k.material+'</b><span>material vulnerabilities</span></div></section>';
 h+='<section class="action-list"><div class="sec-h"><div><div class="eyebrow">NEXT DECISIONS</div><h2>Three more actions to advance.</h2></div><button class="text-action" data-act="nav" data-to="risk">OPEN RISK VIEW <span>↗</span></button></div>';
 h+=rest.map((s,i)=>{const a=LH.action(s);return '<button class="action-row" data-act="sup" data-id="'+s.id+'"><span class="action-index">0'+(i+1)+'</span><span class="action-name">'+esc(s.short)+'</span><span class="action-reason">'+esc(a.short)+'</span><span class="action-next">'+esc(a.label)+' <i>→</i></span></button>';}).join('')+'</section>';
 h+='<section class="overview-latest"><div class="sec-h"><div><div class="eyebrow">SIGNALS TO REVIEW</div><h2>Recent network signals</h2></div>'+LH.btn('ALL EVENTS','nav',{to:'events'},'sm')+'</div><div class="latest-grid">'+
  '<button class="latest-item" data-act="ev" data-id="EV-001"><span class="eyebrow">EV-001 · Z01</span><strong>East Delta flood watch</strong><span>Five sites potentially exposed <i>→</i></span></button>'+
  '<button class="latest-item" data-act="ev" data-id="EV-003"><span class="eyebrow">EV-003 · MERIDIAN</span><strong>Financing pressure</strong><span>Production continues <i>→</i></span></button></div></section>';
 h+='<section class="network-note"><div><div class="eyebrow">A NETWORK INSIGHT</div><h2>Two Tier‑1 suppliers can still depend on the same upstream source.</h2><p>IonPeak sits behind Aster and Boreal, connecting one component dependency to three NovaDrive products.</p>'+LH.btn('FOLLOW THE DEPENDENCY','trace',{id:K.ion})+'</div><div class="network-path"><span>IONPEAK</span><i></i><span>ASTER + BOREAL</span><i></i><span>M10 / M20</span><i></i><span>P1 / P2 / P3</span></div></section>';
 return h;
};
})();
