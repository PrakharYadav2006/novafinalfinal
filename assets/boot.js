/* Boot: render first screen, open onboarding on first visit only. */
(function () {
  'use strict';
  const LH = window.LH, A = LH.A;
  // entering Evidence from the nav always starts clean
  const nav = A.nav;
  A.nav = (d) => { if (d.to === 'evidence' && LH.evi) { LH.evi.tab = 'rel'; LH.evi.q = ''; } nav(d); };
  try { LH.render(); } catch (e) { console.error(e); document.getElementById('view').innerHTML = '<div class="empty">Lighthouse could not start. Reload the page.</div>'; }
  if (LH.maybeWelcome) LH.maybeWelcome();
})();
