// js/ads.js
//
// AdSense slot filler. Reads window.ADSENSE_CLIENT (set in ads-config.js)
// and only loads AdSense when it's non-empty. Until then, the script
// never inserts the AdSense library, never pushes to <ins> slots, and
// never makes any network request to googlesyndication.com.
//
// Slot markup convention:
//   <aside class="ad-slot" aria-label="Advertisement">
//     <ins class="adsbygoogle"
//          style="display:block"
//          data-ad-slot="auto"
//          data-ad-format="auto"
//          data-full-width-responsive="true"></ins>
//   </aside>
// `data-ad-client` is set programmatically from ADSENSE_CLIENT at boot.

(function () {
  'use strict';

  function initAds() {
    var client = window.ADSENSE_CLIENT;
    if (!client) return; // No ID = no ad code loads at all.

    // 1. Inject AdSense library (once per page). Use crossorigin=anonymous
    //    so the loader doesn't send cookies before consent for EEA users.
    if (!document.getElementById('handle-adsense-loader')) {
      var s = document.createElement('script');
      s.id = 'handle-adsense-loader';
      s.async = true;
      s.crossOrigin = 'anonymous';
      s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' +
              encodeURIComponent(client);
      document.head.appendChild(s);
    }

    // 2. Set data-ad-client on every slot that doesn't have one yet.
    //    (Authored HTML shouldn't hardcode the ID — keep it empty in
    // source so the build doesn't bake the publisher ID into the repo.)
    var slots = document.querySelectorAll('ins.adsbygoogle:not([data-ad-client])');
    for (var i = 0; i < slots.length; i++) {
      slots[i].setAttribute('data-ad-client', client);
    }

    // 3. Tell AdSense to fill the slots.
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      // AdSense library not yet loaded — the deferred loader will retry
      // via the queue below on its own.
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAds);
  } else {
    initAds();
  }
})();