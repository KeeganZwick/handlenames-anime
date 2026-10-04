// js/ads-config.js
//
// ONE config point for AdSense activation. This file is the ONLY place
// to edit when you want ads to go live. Nothing else.
//
// ACTIVATE (one-time, on the day your AdSense account is approved):
//   1. Find the AdSense dashboard. Settings → Account information
//   2. Copy your ca-pub-XXXXXXXXXXXXXXXX ID
//   3. Paste it between the quotes on the ADSENSE_CLIENT line below
//   4. (Optional) Flip USE_GOOGLE_CMP to true once a Google-certified
//      CMP is wired up (see cookie-consent.js for the gate behaviour)
//   5. Push. All <ins class="adsbygoogle"> slots across the site
//      auto-fill. No HTML to edit, no other JS file to touch.
//
// Until step 3 happens, ADSENSE_CLIENT is "" (empty string). In that
// state, the ads.js loader returns early and NEVER injects the AdSense
// script. Ad slots render as empty zero-height containers, invisible.

window.ADSENSE_CLIENT = "";       // e.g. "ca-pub-1234567890123456" — leave "" until AdSense is approved
window.USE_GOOGLE_CMP = false;    // set true only after a Google-certified CMP is integrated