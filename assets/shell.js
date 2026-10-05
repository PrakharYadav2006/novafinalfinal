/* Shell: six primary destinations, quiet secondary utilities, first-load intro, per-page motif hook. */
(function(){'use strict';
const LH=window.LH,$=LH.$;
const P=[['overview','Overview'],['network','Network'],['risk','Risk'],['events','Events'],['sourcing','Sourcing'],['scenario','Scenario']];
const S=[['evidence','Evidence'],['methodology','Methodology'],['help','Help']];
const it=(n,cur)=>'<button type="button" class="nav-i '+(cur===n[0]?'on':'')+'" data-act="nav" data-to="'+n[0]+'"'+(cur===n[0]?' aria-current="page"':'')+'>'+n[1]+'</button>';
LH.renderNav=(cur)=>{if(cur==='supplier')cur='';$('#nav').innerHTML='<div class="brand"><b>LIGHTHOUSE</b><span>NOVADRIVE</span></div>'+P.map(n=>it(n,cur)).join('')+'<div class="nav-sp"></div><div class="nav-foot">'+S.map(n=>it(n,cur)).join('')+'</div>';};
const r=LH.render;LH.render=function(k){r(k);document.body.dataset.page=LH.cur.page;};
if(!sessionStorage.getItem('lh-intro')){try{sessionStorage.setItem('lh-intro','1');}catch(e){}
 const d=document.createElement('div');d.id='intro';
 d.innerHTML='<svg width="220" height="90" viewBox="0 0 220 90"><path class="l" d="M10 60L60 25L115 50L170 18L210 45M60 25L90 80L115 50M170 18L190 75"/><circle class="n" cx="10" cy="60" r="3"/><circle class="n" cx="60" cy="25" r="3"/><circle class="n" cx="115" cy="50" r="3"/><circle class="n" cx="170" cy="18" r="3"/><circle class="n" cx="210" cy="45" r="3"/><circle class="n" cx="90" cy="80" r="3"/><path class="run" d="M10 60L60 25L115 50L170 18L210 45"/></svg><b>PROJECT LIGHTHOUSE</b>';
 document.body.appendChild(d);setTimeout(()=>d.classList.add('out'),900);setTimeout(()=>d.remove(),1300);}
})();
