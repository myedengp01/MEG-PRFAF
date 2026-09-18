/* MEG Universal Claim Management V1.0 — v2026.09.17-14:30.
 * Navigation-only enhancement. Do not modify approval, finance or ledger logic.
 * Must be loaded after PRFAF's existing toolbar markup. Feature branch only.
 */
(function (root) {
  'use strict';
  var DASHBOARD_URL = 'https://myedengp01.github.io/DB-MEG-FORMS/';
  function normalizeDashboardNavigation(doc) {
    if (!doc || typeof doc.querySelector !== 'function') return false;
    var toolbar = doc.querySelector('#app .toolbar');
    if (!toolbar) return false;
    var link = toolbar.querySelector('a.dash-link');
    if (!link) return false; // Never create a duplicate or bypass the existing auth-gated app.
    link.textContent = '← Back to Dashboard';
    link.setAttribute('href', DASHBOARD_URL);
    link.setAttribute('aria-label', 'Back to Dashboard');
    link.removeAttribute('hidden');
    return true;
  }
  root.MEGNormalizePRFAFDashboardNavigation = normalizeDashboardNavigation;
  if (root.document) {
    if (root.document.readyState === 'loading') {
      root.document.addEventListener('DOMContentLoaded', function () {
        normalizeDashboardNavigation(root.document);
      }, { once: true });
    } else {
      normalizeDashboardNavigation(root.document);
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);
