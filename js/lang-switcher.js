/* =====================================================================
 *  Page-aware language switcher for the static LEGAL pages
 *  (Privacy / About / Contact). Those pages are English-only by design
 *  (legal-page accuracy is more important than localization for legal
 *  copy), so when a visitor picks a non-English locale from the
 *  topbar dropdown on a legal page, we send them to the localized
 *  MAIN generator instead — i.e. /de/privacy/ → /de/anime-names/.
 *
 *  This script:
 *    1. Sets the <select> to "en" on legal pages (since they are EN).
 *    2. On change, navigates to the localized main generator in the
 *       chosen locale.
 *    3. Uses the current origin so it works on any deployment.
 *
 *  The MAIN generator (js/generator.js → buildSwitcherScript) has its
 *  own page-aware switcher that navigates between /anime-names/ pages
 *  in each locale; this file is for the legal pages only.
 * ===================================================================== */

(function () {
  'use strict';

  var KNOWN_LOCALES = ['en', 'nl', 'de', 'es', 'fr', 'pt', 'pl'];

  function boot() {
    var sel = document.getElementById('lang-switcher-select');
    if (!sel) return;
    // On legal pages, always show "English" in the dropdown because
    // the legal copy is English-only.
    sel.value = 'en';
    sel.addEventListener('change', function () {
      var target = sel.value;
      if (KNOWN_LOCALES.indexOf(target) === -1) return;
      var origin = window.location.origin;
      // Always send to /anime-names/ (the only localized page) in the
      // chosen locale. Legal pages have no localized versions.
      var targetUrl = (target === 'en')
        ? origin + '/anime-names/'
        : origin + '/' + target + '/anime-names/';
      window.location.href = targetUrl;
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
