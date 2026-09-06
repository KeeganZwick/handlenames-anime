/* =====================================================================
 *  Cookie consent banner (GDPR / EU user-consent compliance for AdSense)
 *
 *  Behavior:
 *  - On first visit, shows a fixed bottom banner with Accept / Reject /
 *    Customize options.
 *  - Choice is stored in localStorage with a 12-month expiry. Re-visits
 *    within that window do not re-show the banner.
 *  - Body gets a data-cc="accepted|rejected" attribute that controls
 *    ad-slot visibility. Rejected users see no ad placeholders and no
 *    AdSense code is loaded.
 *  - Honors the Global Privacy Control (GPC) browser signal where present.
 *  - A "Cookie settings" link in the footer reopens the banner.
 *  - The banner is non-blocking (always visible) and works on every page
 *    that includes this script.
 *
 *  This script is intentionally framework-free — no React, no Vue, no
 *  build step. Just vanilla DOM. Safe to drop into any HTML page.
 * ===================================================================== */

(function () {
  'use strict';

  var STORAGE_KEY = 'cc-pref-v1';        // bump v# if consent schema changes
  var EXPIRY_DAYS = 365;
  var DEFAULT_LOCALE = (document.documentElement.lang || 'en').toLowerCase().slice(0, 2);

  // --------- i18n string bundle ----------
  // Tiny inline i18n so the banner is readable on every localized page.
  // Falls back to English if the locale isn't matched.
  var STRINGS = {
    en: {
      title: 'Cookies & ads',
      body:  'We use cookies for site analytics and (with your consent) to show ads from Google AdSense. You can change your mind any time via the "Cookie settings" link in the footer.',
      accept:  'Accept all',
      reject:  'Reject non-essential',
      customize: 'Customize',
      save:    'Save preferences',
      analytics: 'Analytics',
      analyticsDesc: 'Anonymous usage stats (page views, errors). Helps us improve the site.',
      ads: 'Personalized ads',
      adsDesc: 'Google AdSense. Lets us keep the site free. You\'ll still see ads if you reject this — they just won\'t be personalized.',
      required: 'Strictly necessary',
      requiredDesc: 'Required for the site to function (cookie consent, local storage of saved names). Always on.',
      settings: 'Cookie settings',
    },
    nl: { title: 'Cookies & advertenties', body: 'We gebruiken cookies voor site-analyse en (met je toestemming) voor advertenties via Google AdSense. Je kunt je keuze altijd wijzigen via de "Cookie-instellingen"-link in de voettekst.', accept: 'Alles accepteren', reject: 'Niet-essentieel weigeren', customize: 'Aanpassen', save: 'Voorkeuren opslaan', analytics: 'Analyse', analyticsDesc: 'Anonieme gebruiksstatistieken (pageviews, fouten). Helpt ons de site te verbeteren.', ads: 'Gepersonaliseerde advertenties', adsDesc: 'Google AdSense. Hiermee houden we de site gratis. Je ziet nog steeds advertenties als je dit weigert — ze worden alleen niet gepersonaliseerd.', required: 'Strikt noodzakelijk', requiredDesc: 'Nodig voor de werking van de site (cookietoestemming, lokale opslag van opgeslagen namen). Altijd aan.', settings: 'Cookie-instellingen' },
    de: { title: 'Cookies & Werbung', body: 'Wir verwenden Cookies für die Seitenanalyse und (mit deiner Zustimmung) für Werbung über Google AdSense. Du kannst deine Entscheidung jederzeit über den "Cookie-Einstellungen"-Link in der Fußzeile ändern.', accept: 'Alle akzeptieren', reject: 'Nicht-essenzielle ablehnen', customize: 'Anpassen', save: 'Einstellungen speichern', analytics: 'Analyse', analyticsDesc: 'Anonyme Nutzungsstatistiken (Seitenaufrufe, Fehler). Hilft uns, die Seite zu verbessern.', ads: 'Personalisierte Werbung', adsDesc: 'Google AdSense. Hält die Seite kostenlos. Du siehst weiterhin Werbung, wenn du dies ablehnst — sie wird nur nicht personalisiert.', required: 'Unbedingt erforderlich', requiredDesc: 'Notwendig für die Funktion der Seite (Cookie-Zustimmung, lokaler Speicher für gespeicherte Namen). Immer aktiv.', settings: 'Cookie-Einstellungen' },
    es: { title: 'Cookies y anuncios', body: 'Usamos cookies para análisis del sitio y (con tu consentimiento) para mostrar anuncios de Google AdSense. Puedes cambiar de opinión en cualquier momento desde el enlace "Configuración de cookies" en el pie de página.', accept: 'Aceptar todo', reject: 'Rechazar no esenciales', customize: 'Personalizar', save: 'Guardar preferencias', analytics: 'Analítica', analyticsDesc: 'Estadísticas anónimas de uso (visitas, errores). Nos ayuda a mejorar el sitio.', ads: 'Anuncios personalizados', adsDesc: 'Google AdSense. Nos permite mantener el sitio gratis. Seguirás viendo anuncios si rechazas esto — simplemente no serán personalizados.', required: 'Estrictamente necesario', requiredDesc: 'Necesario para que el sitio funcione (consentimiento de cookies, almacenamiento local de nombres guardados). Siempre activo.', settings: 'Configuración de cookies' },
    fr: { title: 'Cookies et publicités', body: 'Nous utilisons des cookies pour l\u2019analyse du site et (avec votre consentement) pour afficher des publicités via Google AdSense. Vous pouvez changer d\u2019avis à tout moment via le lien "Paramètres des cookies" en bas de page.', accept: 'Tout accepter', reject: 'Refuser non-essentiels', customize: 'Personnaliser', save: 'Enregistrer les préférences', analytics: 'Analytique', analyticsDesc: 'Statistiques d\u2019usage anonymes (vues, erreurs). Nous aide à améliorer le site.', ads: 'Publicités personnalisées', adsDesc: 'Google AdSense. Nous permet de garder le site gratuit. Vous verrez toujours des publicités si vous refusez — elles ne seront simplement pas personnalisées.', required: 'Strictement nécessaire', requiredDesc: 'Nécessaire au fonctionnement du site (consentement cookies, stockage local des noms enregistrés). Toujours actif.', settings: 'Paramètres des cookies' },
    pt: { title: 'Cookies e anúncios', body: 'Usamos cookies para análise do site e (com seu consentimento) para exibir anúncios do Google AdSense. Você pode mudar de ideia a qualquer momento pelo link "Configurações de cookies" no rodapé.', accept: 'Aceitar tudo', reject: 'Recusar não essenciais', customize: 'Personalizar', save: 'Salvar preferências', analytics: 'Análise', analyticsDesc: 'Estatísticas anônimas de uso (visualizações, erros). Nos ajuda a melhorar o site.', ads: 'Anúncios personalizados', adsDesc: 'Google AdSense. Nos permite manter o site gratuito. Você ainda verá anúncios se recusar — apenas não serão personalizados.', required: 'Estritamente necessário', requiredDesc: 'Necessário para o funcionamento do site (consentimento de cookies, armazenamento local de nomes salvos). Sempre ativo.', settings: 'Configurações de cookies' },
    pl: { title: 'Pliki cookie i reklamy', body: 'Używamy plików cookie do analizy witryny oraz (za Twoją zgodą) do wyświetlania reklam Google AdSense. Zmienić zdanie możesz w dowolnym momencie, klikając link "Ustawienia plików cookie" w stopce.', accept: 'Akceptuj wszystkie', reject: 'Odrzuć nieistotne', customize: 'Dostosuj', save: 'Zapisz preferencje', analytics: 'Analityka', analyticsDesc: 'Anonimowe statystyki użytkowania (wyświetlenia, błędy). Pomagają nam ulepszać witrynę.', ads: 'Spersonalizowane reklamy', adsDesc: 'Google AdSense. Pozwala nam utrzymywać witrynę za darmo. Jeśli odrzucisz, reklamy nadal będą wyświetlane — po prostu nie będą spersonalizowane.', required: 'Ściśle niezbędne', requiredDesc: 'Wymagane do działania witryny (zgoda na pliki cookie, lokalne przechowywanie zapisanych imion). Zawsze włączone.', settings: 'Ustawienia plików cookie' },

    // ---- 14 new UI-only locales (Indonesian, Malay, Vietnamese, Hindi, Urdu, Arabic, Chinese, Korean,
    //      Russian, Ukrainian, Yorùbá, Bengali, Thai, Hungarian) ----
    id: { title: 'Cookie & iklan', body: 'Kami menggunakan cookie untuk analitik situs dan (dengan persetujuan Anda) untuk menampilkan iklan dari Google AdSense. Anda dapat berubah pikiran kapan saja melalui tautan "Pengaturan cookie" di footer.', accept: 'Terima semua', reject: 'Tolak yang non-esensial', customize: 'Sesuaikan', save: 'Simpan preferensi', analytics: 'Analitik', analyticsDesc: 'Statistik penggunaan anonim (tayangan halaman, kesalahan). Membantu kami meningkatkan situs.', ads: 'Iklan yang dipersonalisasi', adsDesc: 'Google AdSense. Membantu kami menjaga situs tetap gratis. Anda tetap akan melihat iklan jika menolak ini \u2014 hanya saja tidak akan dipersonalisasi.', required: 'Sangat diperlukan', requiredDesc: 'Diperlukan agar situs berfungsi (persetujuan cookie, penyimpanan lokal nama yang disimpan). Selalu aktif.', settings: 'Pengaturan cookie' },
    ms: { title: 'Kuki & iklan', body: 'Kami menggunakan kuki untuk analitik tapak dan (dengan kebenaran anda) untuk memaparkan iklan daripada Google AdSense. Anda boleh menukar fikiran pada bila-bila masa melalui pautan "Tetapan kuki" di pengaki.', accept: 'Terima semua', reject: 'Tolak bukan penting', customize: 'Sesuaikan', save: 'Simpan keutamaan', analytics: 'Analitik', analyticsDesc: 'Statistik penggunaan tanpa nama (tonton halaman, ralat). Membantu kami menambah baik tapak.', ads: 'Iklan diperibadikan', adsDesc: 'Google AdSense. Membantu kami mengekalkan tapak secara percuma. Anda masih akan melihat iklan jika menolak ini \u2014 cuma tidak diperibadikan.', required: 'Sangat diperlukan', requiredDesc: 'Diperlukan untuk tapak berfungsi (keizinan kuki, storan tempatan nama yang disimpan). Sentiasa aktif.', settings: 'Tetapan kuki' },
    vi: { title: 'Cookie & qu\u1ea3ng c\u00e1o', body: 'Ch\u00fang t\u00f4i d\u00f9ng cookie \u0111\u1ec3 ph\u00e2n t\u00edch trang v\u00e0 (v\u1edbi s\u1ef1 \u0111\u1ed3ng \u00fd c\u1ee7a b\u1ea1n) \u0111\u1ec3 hi\u1ec3n th\u1ecb qu\u1ea3ng c\u00e1o t\u1eeb Google AdSense. B\u1ea1n c\u00f3 th\u1ec3 thay \u0111\u1ed5i \u00fd ki\u1ebfn b\u1ea5t c\u1ee9 l\u00fac n\u00e0o qua li\u00ean k\u1ebft "C\u00e0i \u0111\u1eb7t cookie" \u1edf ch\u00e2n trang.', accept: 'Ch\u1ea5p nh\u1eadn t\u1ea5t c\u1ea3', reject: 'T\u1eeb ch\u1ed1i kh\u00f4ng c\u1ea7n thi\u1ebft', customize: 'T\u00f9y ch\u1ec9nh', save: 'L\u01b0u t\u00f9y ch\u1ecdn', analytics: 'Ph\u00e2n t\u00edch', analyticsDesc: 'Th\u1ed1ng k\u00ea s\u1eed d\u1ee5ng \u1ea9n danh (l\u01b0\u1ee3t xem trang, l\u1ed7i). Gi\u00fap ch\u00fang t\u00f4i c\u1ea3i thi\u1ec7n trang.', ads: 'Qu\u1ea3ng c\u00e1o c\u00e1 nh\u00e2n h\u00f3a', adsDesc: 'Google AdSense. Gi\u00fap ch\u00fang t\u00f4i gi\u1eef trang mi\u1ec5n ph\u00ed. B\u1ea1n v\u1eabn s\u1ebd th\u1ea5y qu\u1ea3ng c\u00e1o n\u1ebfu t\u1eeb ch\u1ed1i \u2014 ch\u1ec9 l\u00e0 kh\u00f4ng c\u00e1 nh\u00e2n h\u00f3a.', required: 'B\u1eaft bu\u1ed9c', requiredDesc: 'C\u1ea7n thi\u1ebft \u0111\u1ec3 trang ho\u1ea1t \u0111\u1ed9ng (\\u0111\u1ed3ng \u00fd cookie, l\u01b0u tr\u1eef c\u1ee5c b\u1ed9 t\u00ean \u0111\u00e3 l\u01b0u). Lu\u00f4n b\u1eadt.', settings: 'C\u00e0i \u0111\u1eb7t cookie' },
    hi: { title: '\u0915\u0941\u0915\u0940\u091c\u093c \u0914\u0930 \u0935\u093f\u091c\u094d\u091e\u093e\u092a\u0928', body: '\u0939\u092e \u0938\u093e\u0907\u091f \u0935\u093f\u0936\u094d\u0932\u0947\u0937\u0923 \u0915\u0947 \u0932\u093f\u090f \u0915\u0941\u0915\u0940\u091c\u093c \u0914\u0930 (\u0906\u092a\u0915\u0940 \u0938\u0939\u092e\u0924\u093f \u0938\u0947) Google AdSense \u0938\u0947 \u0935\u093f\u091c\u094d\u091e\u093e\u092a\u0928 \u0926\u093f\u0916\u093e\u0928\u0947 \u0915\u0947 \u0932\u093f\u090f \u0909\u092a\u092f\u094b\u0917 \u0915\u0930\u0924\u0947 \u0939\u0948\u0902\u0964 \u0906\u092a \u092b\u093c\u0941\u091f\u0930 \u092e\u0947\u0902 "\u0915\u0941\u0915\u0940 \u0938\u0947\u091f\u093f\u0902\u0917\u094d\u0938" \u0932\u093f\u0902\u0915 \u0915\u0947 \u092e\u093e\u0927\u094d\u092f\u092e \u0938\u0947 \u0915\u092d\u0940 \u092d\u0940 \u0905\u092a\u0928\u093e \u092e\u0928 \u092c\u0926\u0932 \u0938\u0915\u0924\u0947 \u0939\u0948\u0902\u0964', accept: '\u0938\u092d\u0940 \u0938\u094d\u0935\u0940\u0915\u093e\u0930 \u0915\u0930\u0947\u0902', reject: '\u0917\u0948\u0930-\u0906\u0935\u0936\u094d\u092f\u0915 \u0905\u0938\u094d\u0935\u0940\u0915\u093e\u0930 \u0915\u0930\u0947\u0902', customize: '\u0905\u0928\u0941\u0915\u0942\u0932\u093f\u0924 \u0915\u0930\u0947\u0902', save: '\u092a\u094d\u0930\u093e\u0925\u092e\u093f\u0915\u0924\u093e\u090f\u0901 \u0938\u0939\u0947\u091c\u0947\u0902', analytics: '\u0935\u093f\u0936\u094d\u0932\u0947\u0937\u093f\u0915\u0940', analyticsDesc: '\u0905\u0928\u093e\u092e \u0909\u092a\u092f\u094b\u0917 \u0906\u0901\u0915\u0921\u093c\u0947 (\u092a\u0943\u0937\u094d\u0920 \u0926\u0943\u0936\u094d\u092f, \u0924\u094d\u0930\u0941\u091f\u093f\u092f\u093e\u0901)\u0964 \u0939\u092e\u0947\u0902 \u0938\u093e\u0907\u091f \u092c\u0947\u0939\u0924\u0930 \u092c\u0928\u093e\u0928\u0947 \u092e\u0947\u0902 \u092e\u0926\u0926 \u0915\u0930\u0924\u093e \u0939\u0948\u0964', ads: '\u0935\u094d\u092f\u0915\u094d\u0924\u093f\u0917\u0924 \u0935\u093f\u091c\u094d\u091e\u093e\u092a\u0928', adsDesc: 'Google AdSense\u0964 \u0939\u092e\u0947\u0902 \u0938\u093e\u0907\u091f \u092e\u0941\u092b\u093c\u0924 \u0930\u0916\u0928\u0947 \u0926\u0947\u0924\u093e \u0939\u0948\u0964 \u092f\u0926\u093f \u0906\u092a \u0907\u0938\u0947 \u0905\u0938\u094d\u0935\u0940\u0915\u093e\u0930 \u0915\u0930\u0924\u0947 \u0939\u0948\u0902 \u0924\u092c \u092d\u0940 \u0906\u092a \u0935\u093f\u091c\u094d\u091e\u093e\u092a\u0928 \u0926\u0947\u0916\u0947\u0902\u0917\u0947 \u2014 \u092c\u0938 \u0935\u0947 \u0935\u094d\u092f\u0915\u094d\u0924\u093f\u0917\u0924 \u0928\u0939\u0940\u0902 \u0939\u094b\u0902\u0917\u0947\u0964', required: '\u0905\u0928\u093f\u0935\u093e\u0930\u094d\u092f', requiredDesc: '\u0938\u093e\u0907\u091f \u0915\u0947 \u0915\u093e\u092e \u0915\u0930\u0928\u0947 \u0915\u0947 \u0932\u093f\u090f \u0906\u0935\u0936\u094d\u092f\u0915 (\u0915\u0941\u0915\u0940 \u0938\u0939\u092e\u0924\u093f, \u0938\u0939\u0947\u091c\u0947 \u0917\u090f \u0928\u093e\u092e\u094b\u0902 \u0915\u093e \u0938\u094d\u0925\u093e\u0928\u0940\u092f \u092d\u0902\u0921\u093e\u0930\u0923)\u0964 \u0939\u092e\u0947\u0936\u093e \u091a\u093e\u0932\u0942\u0964', settings: '\u0915\u0941\u0915\u0940 \u0938\u0947\u091f\u093f\u0902\u0917\u094d\u0938' },
    ur: { title: '\u06a9\u0648\u06a9\u06cc\u0632 \u0627\u0648\u0631 \u0627\u0634\u062a\u06c1\u0627\u0631\u0627\u062a', body: '\u06c1\u0645 \u0633\u0627\u0626\u0679 \u06a9\u06d2 \u062a\u062c\u0632\u06cc\u0627\u062a \u0627\u0648\u0631 (\u0622\u067e \u06a9\u06cc \u0627\u062c\u0627\u0632\u062a \u0633\u06d2) Google AdSense \u0633\u06d2 \u0627\u0634\u062a\u06c1\u0627\u0631\u0627\u062a \u062f\u06a9\u06be\u0627\u0646\u06d2 \u06a9\u06d2 \u0644\u06cc\u06d2 \u06a9\u0648\u06a9\u06cc\u0632 \u0627\u0633\u062a\u0639\u0645\u0627\u0644 \u06a9\u0631\u062a\u06d2 \u06c1\u06cc\u06ba\u06d4 \u0622\u067e \u0641\u0648\u0679\u0631 \u0645\u06cc\u06ba "\u06a9\u0648\u06a9\u06cc \u062a\u0631\u062a\u06cc\u0628\u0627\u062a" \u0644\u0646\u06a9 \u06a9\u06d2 \u0630\u0631\u06cc\u0639\u06d2 \u06a9\u0633\u06cc \u0628\u06be\u06cc \u0648\u0642\u062a \u0627\u067e\u0646\u0627 \u0627\u0631\u0627\u062f\u06c1 \u0628\u062f\u0644 \u0633\u06a9\u062a\u06d2 \u06c1\u06cc\u06ba\u06d4', accept: '\u0633\u0628 \u0642\u0628\u0648\u0644 \u06a9\u0631\u06cc\u06ba', reject: '\u063a\u06cc\u0631 \u0636\u0631\u0648\u0631\u06cc \u0645\u0633\u062a\u0631\u062f \u06a9\u0631\u06cc\u06ba', customize: '\u062d\u0633\u0628\u0650 \u0636\u0631\u0648\u0631\u062a \u0628\u0646\u0627\u0626\u06cc\u06ba', save: '\u062a\u0631\u062c\u06cc\u062d\u0627\u062a \u0645\u062d\u0641\u0648\u0638 \u06a9\u0631\u06cc\u06ba', analytics: '\u062a\u062c\u0632\u06cc\u0627\u062a', analyticsDesc: '\u06af\u0645\u0646\u0627\u0645 \u0627\u0633\u062a\u0639\u0645\u0627\u0644 \u06a9\u06d2 \u0627\u0639\u062f\u0627\u062f\u0648\u0634\u0645\u0627\u0631 (\u0635\u0641\u062d\u06c1 \u06a9\u06d2 \u0645\u0646\u0627\u0638\u0631\u060c \u063a\u0644\u0637\u06cc\u0627\u06ba)\u06d4 \u0633\u0627\u0626\u0679 \u06a9\u0648 \u0628\u06c1\u062a\u0631 \u0628\u0646\u0627\u0646\u06d2 \u0645\u06cc\u06ba \u0645\u062f\u062f \u06a9\u0631\u062a\u0627 \u06c1\u06d2\u06d4', ads: '\u0630\u0627\u062a\u06cc \u0646\u0648\u0639\u06cc\u062a \u06a9\u06d2 \u0627\u0634\u062a\u06c1\u0627\u0631\u0627\u062a', adsDesc: 'Google AdSense\u06d4 \u0633\u0627\u0626\u0679 \u06a9\u0648 \u0645\u0641\u062a \u0631\u06a9\u06be\u0646\u06d2 \u0645\u06cc\u06ba \u0645\u062f\u062f \u06a9\u0631\u062a\u0627 \u06c1\u06d2\u06d4 \u0627\u06af\u0631 \u0622\u067e \u0627\u0633\u06d2 \u0645\u0633\u062a\u0631\u062f \u06a9\u0631\u062a\u06d2 \u06c1\u06cc\u06ba \u062a\u0648 \u0628\u06be\u06cc \u0622\u067e \u0627\u0634\u062a\u06c1\u0627\u0631\u0627\u062a \u062f\u06cc\u06a9\u06be\u06cc\u06ba \u06af\u06d2 \u2014 \u0628\u0633 \u0648\u06c1 \u0630\u0627\u062a\u06cc \u0646\u0648\u0639\u06cc\u062a \u06a9\u06d2 \u0646\u06c1\u06cc\u06ba \u06c1\u0648\u06ba \u06af\u06d2\u06d4', required: '\u0627\u0646\u062a\u06c1\u0627\u0626\u06cc \u0636\u0631\u0648\u0631\u06cc', requiredDesc: '\u0633\u0627\u0626\u0679 \u06a9\u06d2 \u06a9\u0627\u0645 \u06a9\u0631\u0646\u06d2 \u06a9\u06d2 \u0644\u06cc\u06d2 \u0636\u0631\u0648\u0631\u06cc (\u06a9\u0648\u06a9\u06cc \u0631\u0636\u0627\u0645\u0646\u062f\u06cc\u060c \u0645\u062d\u0641\u0648\u0638 \u06a9\u0631\u062f\u06c1 \u0646\u0627\u0645\u0648\u06ba \u06a9\u0627 \u0645\u0642\u0627\u0645\u06cc \u0627\u0633\u0679\u0648\u0631\u06cc\u062c)\u06d4 \u06c1\u0645\u06cc\u0634\u06c1 \u0622\u0646\u06d4', settings: '\u06a9\u0648\u06a9\u06cc \u062a\u0631\u062a\u06cc\u0628\u0627\u062a' },
    ar: { title: '\u0645\u0644\u0641\u0627\u062a \u062a\u0639\u0631\u064a\u0641 \u0627\u0644\u0627\u0631\u062a\u0628\u0627\u0637 \u0648\u0627\u0644\u0625\u0639\u0644\u0627\u0646\u0627\u062a', body: '\u0646\u0633\u062a\u062e\u062f\u0645 \u0645\u0644\u0641\u0627\u062a \u062a\u0639\u0631\u064a\u0641 \u0627\u0644\u0627\u0631\u062a\u0628\u0627\u0637 \u0644\u062a\u062d\u0644\u064a\u0644 \u0627\u0644\u0645\u0648\u0642\u0639 \u0648(\u0628\u0645\u0648\u0627\u0641\u0642\u062a\u0643) \u0644\u0639\u0631\u0636 \u0625\u0639\u0644\u0627\u0646\u0627\u062a \u0645\u0646 Google AdSense. \u064a\u0645\u0643\u0646\u0643 \u062a\u063a\u064a\u064a\u0631 \u0631\u0623\u064a\u0643 \u0641\u064a \u0623\u064a \u0648\u0642\u062a \u0639\u0628\u0631 \u0631\u0627\u0628\u0637 "\u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0645\u0644\u0641\u0627\u062a \u062a\u0639\u0631\u064a\u0641 \u0627\u0644\u0627\u0631\u062a\u0628\u0627\u0637\" \u0641\u064a \u0627\u0644\u062a\u0630\u064a\u064a\u0644.', accept: '\u0642\u0628\u0648\u0644 \u0627\u0644\u0643\u0644', reject: '\u0631\u0641\u0636 \u063a\u064a\u0631 \u0627\u0644\u0636\u0631\u0648\u0631\u064a', customize: '\u062a\u062e\u0635\u064a\u0635', save: '\u062d\u0641\u0638 \u0627\u0644\u062a\u0641\u0636\u064a\u0644\u0627\u062a', analytics: '\u0627\u0644\u062a\u062d\u0644\u064a\u0644\u0627\u062a', analyticsDesc: '\u0625\u062d\u0635\u0627\u0626\u064a\u0627\u062a \u0627\u0633\u062a\u062e\u062f\u0627\u0645 \u0645\u062c\u0647\u0648\u0644\u0629 (\u0645\u0634\u0627\u0647\u062f\u0627\u062a \u0627\u0644\u0635\u0641\u062d\u0627\u062a\u060c \u0627\u0644\u0623\u062e\u0637\u0627\u0621). \u062a\u0633\u0627\u0639\u062f\u0646\u0627 \u0641\u064a \u062a\u062d\u0633\u064a\u0646 \u0627\u0644\u0645\u0648\u0642\u0639.', ads: '\u0625\u0639\u0644\u0627\u0646\u0627\u062a \u0645\u062e\u0635\u0635\u0629', adsDesc: 'Google AdSense. \u064a\u0633\u0627\u0639\u062f\u0646\u0627 \u0641\u064a \u0625\u0628\u0642\u0627\u0621 \u0627\u0644\u0645\u0648\u0642\u0639 \u0645\u062c\u0627\u0646\u064a\u0627\u064b. \u0633\u062a\u0631\u0649 \u0625\u0639\u0644\u0627\u0646\u0627\u062a \u0625\u0630\u0627 \u0631\u0641\u0636\u062a \u0647\u0630\u0627 \u2014 \u0641\u0642\u0637 \u0644\u0646 \u062a\u0643\u0648\u0646 \u0645\u062e\u0635\u0635\u0629.', required: '\u0636\u0631\u0648\u0631\u064a \u0644\u0644\u063a\u0627\u064a\u0629', requiredDesc: '\u0645\u0637\u0644\u0648\u0628 \u0644\u0639\u0645\u0644 \u0627\u0644\u0645\u0648\u0642\u0639 (\u0645\u0648\u0627\u0641\u0642\u0629 \u0645\u0644\u0641\u0627\u062a \u062a\u0639\u0631\u064a\u0641 \u0627\u0644\u0627\u0631\u062a\u0628\u0627\u0637\u060c \u0627\u0644\u062a\u062e\u0632\u064a\u0646 \u0627\u0644\u0645\u062d\u0644\u064a \u0644\u0644\u0623\u0633\u0645\u0627\u0621 \u0627\u0644\u0645\u062d\u0641\u0648\u0638\u0629). \u062f\u0627\u0626\u0645\u064b\u0627 \u0645\u0641\u0639\u0651\u0644.', settings: '\u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0645\u0644\u0641\u0627\u062a \u062a\u0639\u0631\u064a\u0641 \u0627\u0644\u0627\u0631\u062a\u0628\u0627\u0637' },
    zh: { title: 'Cookie \u8207\u5ee3\u544a', body: '\u6211\u5011\u4f7f\u7528 Cookie \u9032\u884c\u7db2\u7ad9\u5206\u6790,\u4e26(\u5728\u60a8\u540c\u610f\u4e0b)\u986f\u793a\u4f86\u81ea Google AdSense \u7684\u5ee3\u544a\u3002\u60a8\u53ef\u4ee5\u96a8\u6642\u900f\u904e\u9801\u5c3e\u7684\u300cCookie \u8a2d\u5b9a\u300d\u9023\u7d50\u6539\u8b8a\u4e3b\u610f\u3002', accept: '\u5168\u90e8\u63a5\u53d7', reject: '\u62d2\u7d55\u975e\u5fc5\u8981', customize: '\u81ea\u8a02', save: '\u5132\u5b58\u504f\u597d', analytics: '\u5206\u6790', analyticsDesc: '\u533f\u540d\u4f7f\u7528\u7d71\u8a08(\u700f\u89bd\u91cf\u3001\u932f\u8aa4)\u3002\u5354\u52a9\u6211\u5011\u6539\u9032\u7db2\u7ad9\u3002', ads: '\u500b\u4eba\u5316\u5ee3\u544a', adsDesc: 'Google AdSense\u3002\u8b93\u6211\u5011\u80fd\u7dad\u6301\u7db2\u7ad9\u514d\u8cbb\u3002\u5982\u679c\u60a8\u62d2\u7d55\u6b64\u9805,\u4ecd\u6703\u770b\u5230\u5ee3\u544a \u2014 \u53ea\u662f\u4e0d\u6703\u500b\u4eba\u5316\u3002', required: '\u7d55\u5c0d\u5fc5\u8981', requiredDesc: '\u7db2\u7ad9\u904b\u4f5c\u6240\u9700(Cookie \u540c\u610f\u3001\u5132\u5b58\u540d\u7a31\u7684\u672c\u6a5f\u5132\u5b58)\u3002\u6c38\u9060\u555f\u7528\u3002', settings: 'Cookie \u8a2d\u5b9a' },
    ko: { title: '\ucfe0\ud0a4 \ubc0f \uadf8\ub8d8\ub3c4', body: '\ub2f9\uc0ac\ub294 \uc0ac\uc774\ud2b8 \ubd84\uc11d\uc744 \uc704\ud574 \ucfe0\ud0a4\ub97c \uc0ac\uc6a9\ud558\uace0 (\uad8c\ud558\uc758 \ub3d9\uc758 \ud558\uc5d0) Google AdSense\uc758 \uadf8\ub8d8\ub3c4\ub97c \ud45c\uc2dc\ud569\ub2c8\ub2e4. \ud478\ud130\uc758 "\ucfe0\ud0a4 \uc124\uc815" \ub9c1\ud06c\ub97c \ud1b5\ud574 \uc5b4\ub514\uc11c\ub098 \ub9c8\uc74c\uc744 \ubc14\ub018 \uc218 \uc788\uc2b5\ub2c8\ub2e4.', accept: '\ubaa8\ub450 \uc218\ub77d', reject: '\ud544\uc218\uac00 \uc544\ub2cc \uac83 \uac70\ubd80', customize: '\uc0ac\uc6a9\uc790 \uc9c0\uc815', save: '\ud658\uacbd\uc124\uc815 \uc800\uc7a5', analytics: '\ubd84\uc11d', analyticsDesc: '\uc775\uba85 \uc0ac\uc6a9 \ud1b5\uacc4(\ud398\uc774\uc9c0 \uc870\ud68c, \uc624\ub958). \uc0ac\uc774\ud2b8 \개선\uc5d0 \ub3c4\uc6c0.', ads: '\ub9de\ucda4 \uadf8\ub8d8\ub3c4', adsDesc: 'Google AdSense. \uc0ac\uc774\ud2b8\ub97c \ubb34\ub8cc\ub85c \uc720\uc9c0\ud558\ub294 \ub370 \ub3c4\uc6c0. \uc774\ub97c \uac70\ubd80\ud574\ub3c4 \uadf8\ub8d8\ub3c4\ub294 \ud45c\uc2dc\ub429\ub2c8\ub2e4 \u2014 \ub2e8\uc9c0 \ub9de\ucda4\uc774 \uc544\ub2cc \ubc88.', required: '\ud544\uc218', requiredDesc: '\uc0ac\uc774\ud2b8 \uc791\ub3d9\uc5d0 \ud544\uc694(Cookie \ub3d9\uc758, \uc800\uc7a5\ub41c \uc774\ub984\uc758 \ub85c\uceec \uc800\uc7a5\uc18c). \ud558\ub098\ub450 \ucf1c\uc838 \uc788\uc74c.', settings: '\ucfe0\ud0a4 \uc124\uc815' },
    ru: { title: '\u041a\u0443\u043a\u0438 \u0438 \u0440\u0435\u043a\u043b\u0430\u043c\u0430', body: '\u041c\u044b \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u0443\u0435\u043c \u043a\u0443\u043a\u0438 \u0434\u043b\u044f \u0430\u043d\u0430\u043b\u0438\u0442\u0438\u043a\u0438 \u0441\u0430\u0439\u0442\u0430 \u0438 (\u0441 \u0432\u0430\u0448\u0435\u0433\u043e \u0441\u043e\u0433\u043b\u0430\u0441\u0438\u044f) \u0434\u043b\u044f \u043f\u043e\u043a\u0430\u0437\u0430 \u0440\u0435\u043a\u043b\u0430\u043c\u044b \u043e\u0442 Google AdSense. \u0412\u044b \u043c\u043e\u0436\u0435\u0442\u0435 \u043f\u0435\u0440\u0435\u0434\u0443\u043c\u0430\u0442\u044c \u0432 \u043b\u044e\u0431\u043e\u0439 \u043c\u043e\u043c\u0435\u043d\u0442 \u0447\u0435\u0440\u0435\u0437 \u0441\u0441\u044b\u043b\u043a\u0443 "\u041d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438 \u043a\u0443\u043a\u0438" \u0432 \u043f\u043e\u0434\u0432\u0430\u043b\u0435.', accept: '\u041f\u0440\u0438\u043d\u044f\u0442\u044c \u0432\u0441\u0435', reject: '\u041e\u0442\u043a\u043b\u043e\u043d\u0438\u0442\u044c \u043d\u0435\u043e\u0431\u044f\u0437\u0430\u0442\u0435\u043b\u044c\u043d\u044b\u0435', customize: '\u041d\u0430\u0441\u0442\u0440\u043e\u0438\u0442\u044c', save: '\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c \u043d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438', analytics: '\u0410\u043d\u0430\u043b\u0438\u0442\u0438\u043a\u0430', analyticsDesc: '\u0410\u043d\u043e\u043d\u0438\u043c\u043d\u0430\u044f \u0441\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043a\u0430 \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d\u0438\u044f (\u043f\u0440\u043e\u0441\u043c\u043e\u0442\u0440\u044b \u0441\u0442\u0440\u0430\u043d\u0438\u0446, \u043e\u0448\u0438\u0431\u043a\u0438). \u041f\u043e\u043c\u043e\u0433\u0430\u0435\u0442 \u043d\u0430\u043c \u0443\u043b\u0443\u0447\u0448\u0430\u0442\u044c \u0441\u0430\u0439\u0442.', ads: '\u041f\u0435\u0440\u0441\u043e\u043d\u0430\u043b\u0438\u0437\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u0430\u044f \u0440\u0435\u043a\u043b\u0430\u043c\u0430', adsDesc: 'Google AdSense. \u041f\u043e\u043c\u043e\u0433\u0430\u0435\u0442 \u0441\u043e\u0445\u0440\u0430\u043d\u044f\u0442\u044c \u0441\u0430\u0439\u0442 \u0431\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u044b\u043c. \u0420\u0435\u043a\u043b\u0430\u043c\u0430 \u0431\u0443\u0434\u0435\u0442 \u043f\u043e\u043a\u0430\u0437\u044b\u0432\u0430\u0442\u044c\u0441\u044f \u0438 \u043f\u0440\u0438 \u043e\u0442\u043a\u0430\u0437\u0435 \u2014 \u043f\u0440\u043e\u0441\u0442\u043e \u0431\u0435\u0437 \u043f\u0435\u0440\u0441\u043e\u043d\u0430\u043b\u0438\u0437\u0430\u0446\u0438\u0438.', required: '\u0421\u0442\u0440\u043e\u0433\u043e \u043d\u0435\u043e\u0431\u0445\u043e\u0434\u0438\u043c\u044b\u0435', requiredDesc: '\u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044f \u0434\u043b\u044f \u0440\u0430\u0431\u043e\u0442\u044b \u0441\u0430\u0439\u0442\u0430 (\u0441\u043e\u0433\u043b\u0430\u0441\u0438\u0435 \u043d\u0430 \u043a\u0443\u043a\u0438, \u043b\u043e\u043a\u0430\u043b\u044c\u043d\u043e\u0435 \u0445\u0440\u0430\u043d\u0435\u043d\u0438\u0435 \u0441\u043e\u0445\u0440\u0430\u043d\u0451\u043d\u043d\u044b\u0445 \u0438\u043c\u0451\u043d). \u0412\u0441\u0435\u0433\u0434\u0430 \u0432\u043a\u043b\u044e\u0447\u0435\u043d\u043e.', settings: '\u041d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438 \u043a\u0443\u043a\u0438' },
    uk: { title: '\u041a\u0443\u043a\u0456 \u0442\u0430 \u0440\u0435\u043a\u043b\u0430\u043c\u0430', body: '\u041c\u0438 \u0432\u0438\u043a\u043e\u0440\u0438\u0441\u0442\u043e\u0432\u0443\u0454\u043c\u043e \u043a\u0443\u043a\u0456 \u0434\u043b\u044f \u0430\u043d\u0430\u043b\u0456\u0442\u0438\u043a\u0438 \u0441\u0430\u0439\u0442\u0443 \u0442\u0430 (\u0437 \u0432\u0430\u0448\u043e\u0457 \u0437\u0433\u043e\u0434\u0438) \u0434\u043b\u044f \u043f\u043e\u043a\u0430\u0437\u0443 \u0440\u0435\u043a\u043b\u0430\u043c\u0438 \u0432\u0456\u0434 Google AdSense. \u0412\u0438 \u043c\u043e\u0436\u0435\u0442\u0435 \u043f\u0435\u0440\u0435\u0434\u0443\u043c\u0430\u0442\u0438 \u0432 \u0431\u0443\u0434\u044c-\u044f\u043a\u0438\u0439 \u0447\u0430\u0441 \u0447\u0435\u0440\u0435\u0437 \u043f\u043e\u0441\u0438\u043b\u0430\u043d\u043d\u044f "\u041d\u0430\u043b\u0430\u0448\u0442\u0443\u0432\u0430\u043d\u043d\u044f \u043a\u0443\u043a\u0456" \u0432\u043d\u0438\u0437\u0443 \u0441\u0442\u043e\u0440\u0456\u043d\u043a\u0438.', accept: '\u041f\u0440\u0438\u0439\u043d\u044f\u0442\u0438 \u0432\u0441\u0456', reject: '\u0412\u0456\u0434\u0445\u0438\u043b\u0438\u0442\u0438 \u043d\u0435\u043e\u0431\u043e\u0432\u2019\u044f\u0437\u043a\u043e\u0432\u0456', customize: '\u041d\u0430\u043b\u0430\u0448\u0442\u0443\u0432\u0430\u0442\u0438', save: '\u0417\u0431\u0435\u0440\u0435\u0433\u0442\u0438 \u043d\u0430\u043b\u0430\u0448\u0442\u0443\u0432\u0430\u043d\u043d\u044f', analytics: '\u0410\u043d\u0430\u043b\u0456\u0442\u0438\u043a\u0430', analyticsDesc: '\u0410\u043d\u043e\u043d\u0456\u043c\u043d\u0430 \u0441\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043a\u0430 \u0432\u0438\u043a\u043e\u0440\u0438\u0441\u0442\u0430\u043d\u043d\u044f (\u043f\u0435\u0440\u0435\u0433\u043b\u044f\u0434\u0438 \u0441\u0442\u043e\u0440\u0456\u043d\u043e\u043a, \u043f\u043e\u043c\u0438\u043b\u043a\u0438). \u0414\u043e\u043f\u043e\u043c\u0430\u0433\u0430\u0454 \u043d\u0430\u043c \u043f\u043e\u043a\u0440\u0430\u0449\u0443\u0432\u0430\u0442\u0438 \u0441\u0430\u0439\u0442.', ads: '\u041f\u0435\u0440\u0441\u043e\u043d\u0430\u043b\u0456\u0437\u043e\u0432\u0430\u043d\u0430 \u0440\u0435\u043a\u043b\u0430\u043c\u0430', adsDesc: 'Google AdSense. \u0414\u043e\u043f\u043e\u043c\u0430\u0433\u0430\u0454 \u0437\u0431\u0435\u0440\u0456\u0433\u0430\u0442\u0438 \u0441\u0430\u0439\u0442 \u0431\u0435\u0437\u043a\u043e\u0448\u0442\u043e\u0432\u043d\u0438\u043c. \u0420\u0435\u043a\u043b\u0430\u043c\u0430 \u043f\u043e\u043a\u0430\u0437\u0443\u0432\u0430\u0442\u0438\u043c\u0435\u0442\u044c\u0441\u044f \u0439 \u043f\u0440\u0438 \u0432\u0456\u0434\u043c\u043e\u0432\u0456 \u2014 \u043f\u0440\u043e\u0441\u0442\u043e \u0431\u0435\u0437 \u043f\u0435\u0440\u0441\u043e\u043d\u0430\u043b\u0456\u0437\u0430\u0446\u0456\u0457.', required: '\u0421\u0443\u0432\u043e\u0440\u043e \u043d\u0435\u043e\u0431\u0445\u0456\u0434\u043d\u0456', requiredDesc: '\u041f\u043e\u0442\u0440\u0456\u0431\u043d\u043e \u0434\u043b\u044f \u0440\u043e\u0431\u043e\u0442\u0438 \u0441\u0430\u0439\u0442\u0443 (\u0437\u0433\u043e\u0434\u0430 \u043d\u0430 \u043a\u0443\u043a\u0456, \u043b\u043e\u043a\u0430\u043b\u044c\u043d\u0435 \u0441\u0445\u043e\u0432\u0438\u0449\u0435 \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043d\u0438\u0445 \u0456\u043c\u0435\u043d). \u0417\u0430\u0432\u0436\u0434\u0438 \u0443\u0432\u0456\u043c\u043a\u043d\u0435\u043d\u043e.', settings: '\u041d\u0430\u043b\u0430\u0448\u0442\u0443\u0432\u0430\u043d\u043d\u044f \u043a\u0443\u043a\u0456' },
    yo: { title: 'Cookies & aw\u1ecdn ipolowo', body: 'A lo aw\u1ecdn cookies fun itupal\u1eb9 aaye ati (p\u1eb9lu igbanilaaye r\u1eb9) lati fi aw\u1ecdn ipolowo Google AdSense han. O le yi \u1ecdkan r\u1eb9 pada nigbakugba nipas\u1eb9 \u1ecdna asop\u1ecd "Aw\u1ecdn eto cookie" ni isal\u1eb9.', accept: 'Gba gbogbo', reject: 'K\u1ecd ti ko j\u1eb9 dandan', customize: '\u1e62e adani', save: 'Fi aw\u1ecdn ayanf\u1eb9 pam\u1ecd', analytics: 'Itupal\u1eb9', analyticsDesc: 'Aw\u1ecdn i\u1e63iro lilo ailoruk\u1ecd (aw\u1ecdn wo oju-iwe, aw\u1ecdn a\u1e63i\u1e63e). W\u1ecd\u0301n ran wa l\u1ecdw\u1ecd lati dara si aaye naa.', ads: 'Aw\u1ecdn ipolowo ti ara \u1eb9ni', adsDesc: 'Google AdSense. W\u1ecd\u0301n ran wa l\u1ecdw\u1ecd lati pa aaye naa \u1e63e free. Iw\u1ecd yoo tun ri aw\u1ecdn ipolowo ti o ba k\u1ecd eyi \u2014 w\u1ecdn kan kii yoo j\u1eb9 ti ara \u1eb9ni.', required: 'Ti o j\u1eb9 dandan pup\u1ecd', requiredDesc: 'Ti a nilo fun aaye lati \u1e63i\u1e63\u1eb9 (igbanilaaye cookie, ipam\u1ecd agbegbe ti aw\u1ecdn oruk\u1ecd ti a fipam\u1ecd). Nigbagbogbo lori.', settings: 'Aw\u1ecdn eto cookie' },
    bn: { title: '\u0995\u09c1\u0995\u09bf \u0993 \u09ac\u09bf\u099c\u09cd\u099e\u09be\u09aa\u09a8', body: '\u0986\u09ae\u09b0\u09be \u09b8\u09be\u0987\u099f \u09ac\u09bf\u09b6\u09cd\u09b2\u09c7\u09b7\u09a3\u09c7\u09b0 \u099c\u09a8\u09cd\u09af \u0995\u09c1\u0995\u09bf \u098f\u09ac\u0982 (\u0986\u09aa\u09a8\u09be\u09b0 \u09b8\u09ae\u09cd\u09ae\u09a4\u09bf\u09a4\u09c7) Google AdSense-\u098f\u09b0 \u09ac\u09bf\u099c\u09cd\u099e\u09be\u09aa\u09a8 \u09a6\u09c7\u0996\u09be\u09a4\u09c7 \u09ac\u09cd\u09af\u09ac\u09b9\u09be\u09b0 \u0995\u09b0\u09bf\u0964 \u09ab\u09c1\u099f\u09be\u09b0\u09c7\u09b0 "\u0995\u09c1\u0995\u09bf \u09b8\u09c7\u099f\u09bf\u0982\u09b8" \u09b2\u09bf\u0982\u0995\u09c7\u09b0 \u09ae\u09be\u09a7\u09cd\u09af\u09ae\u09c7 \u0986\u09aa\u09a8\u09bf \u09af\u09c7\u0995\u09cb\u09a8\u09cb \u09b8\u09ae\u09df \u09ae\u09a4 \u09ac\u09a6\u09b2\u09be\u09a4\u09c7 \u09aa\u09be\u09b0\u09c7\u09a8\u0964', accept: '\u09b8\u09ac \u0997\u09cd\u09b0\u09b9\u09a3 \u0995\u09b0\u09c1\u09a8', reject: '\u0985\u09aa\u09cd\u09b0\u09df\u09cb\u099c\u09a8\u09c0\u09af\u09bc \u09ac\u09be\u09a4\u09bf\u09b2 \u0995\u09b0\u09c1\u09a8', customize: '\u0995\u09be\u09b8\u09cd\u099f\u09ae\u09be\u0987\u099c \u0995\u09b0\u09c1\u09a8', save: '\u09aa\u099b\u09a8\u09cd\u09a6 \u09b8\u0982\u09b0\u0995\u09cd\u09b7\u09a3 \u0995\u09b0\u09c1\u09a8', analytics: '\u09ac\u09bf\u09b6\u09cd\u09b2\u09c7\u09b7\u09a3', analyticsDesc: '\u09ac\u09c7\u09a8\u09be\u09ae\u09c0 \u09ac\u09cd\u09af\u09ac\u09b9\u09be\u09b0\u09c7\u09b0 \u09aa\u09b0\u09bf\u09b8\u0982\u0996\u09cd\u09af\u09be\u09a8 (\u09aa\u09c3\u09b7\u09cd\u09a0\u09be \u09a6\u09c7\u0996\u09be, \u09a4\u09cd\u09b0\u09c1\u099f\u09bf)\u0964 \u09b8\u09be\u0987\u099f \u0989\u09a8\u09cd\u09a8\u09a4 \u0995\u09b0\u09a4\u09c7 \u09b8\u09be\u09b9\u09be\u09af\u09cd\u09af \u0995\u09b0\u09c7\u0964', ads: '\u09ac\u09cd\u09af\u0995\u09cd\u09a4\u09bf\u0997\u09a4\u0995\u09b0\u09a3\u0995\u09c3\u09a4 \u09ac\u09bf\u099c\u09cd\u099e\u09be\u09aa\u09a8', adsDesc: 'Google AdSense\u0964 \u09b8\u09be\u0987\u099f\u0995\u09c7 \u09ac\u09bf\u09a8\u09be\u09ae\u09c2\u09b2\u09cd\u09af\u09c7 \u09b0\u09be\u0996\u09a4\u09c7 \u09b8\u09be\u09b9\u09be\u09af\u09cd\u09af \u0995\u09b0\u09c7\u0964 \u0986\u09aa\u09a8\u09bf \u098f\u099f\u09bf \u09aa\u09cd\u09b0\u09a4\u09cd\u09af\u09be\u0996\u09cd\u09af\u09be\u09a8 \u0995\u09b0\u09b2\u09c7\u09a8 \u09ac\u09bf\u099c\u09cd\u099e\u09be\u09aa\u09a8 \u09a6\u09c7\u0996\u09ac\u09c7\u09a8 \u2014 \u09b6\u09c1\u09a7\u09c1 \u09ac\u09cd\u09af\u0995\u09cd\u09a4\u09bf\u0997\u09a4\u0995\u09b0\u09a3 \u09b9\u09ac\u09c7 \u09a8\u09be\u0964', required: '\u0985\u09a4\u09cd\u09af\u09be\u09ac\u09b6\u09cd\u09af\u0995', requiredDesc: '\u09b8\u09be\u0987\u099f\u09c7\u09b0 \u0995\u09be\u099c \u0995\u09b0\u09be\u09b0 \u099c\u09a8\u09cd\u09af \u09aa\u09cd\u09b0\u09af\u09bc\u09cb\u099c\u09a8 (\u0995\u09c1\u0995\u09bf \u09b8\u09ae\u09cd\u09ae\u09a4\u09bf, \u09b8\u0982\u09b0\u0995\u09cd\u09b7\u09bf\u09a4 \u09a8\u09be\u09ae\u09c7\u09b0 \u09b8\u09cd\u09a5\u09be\u09a8\u09c0\u09af\u09bc \u09b8\u09cd\u099f\u09cb\u09b0\u09c7\u099c)\u0964 \u09b8\u09b0\u09cd\u09ac\u09a6\u09be \u099a\u09be\u09b2\u09c1\u0964', settings: '\u0995\u09c1\u0995\u09bf \u09b8\u09c7\u099f\u09bf\u0982\u09b8' },
    th: { title: '\u0e04\u0e38\u0e01\u0e01\u0e35\u0e49\u0e41\u0e25\u0e30\u0e42\u0e06\u0e29\u0e13\u0e32', body: '\u0e40\u0e23\u0e32\u0e43\u0e0a\u0e49\u0e04\u0e38\u0e01\u0e01\u0e35\u0e49\u0e40\u0e1e\u0e37\u0e48\u0e2d\u0e27\u0e34\u0e40\u0e04\u0e23\u0e32\u0e30\u0e2b\u0e4c\u0e40\u0e27\u0e47\u0e1a\u0e44\u0e0b\u0e15\u0e4c\u0e41\u0e25\u0e30 (\u0e40\u0e21\u0e37\u0e48\u0e2d\u0e44\u0e14\u0e49\u0e23\u0e31\u0e1a\u0e04\u0e27\u0e32\u0e21\u0e22\u0e34\u0e19\u0e22\u0e2d\u0e21\u0e08\u0e32\u0e01\u0e04\u0e38\u0e13) \u0e40\u0e1e\u0e37\u0e48\u0e2d\u0e41\u0e2a\u0e14\u0e07\u0e42\u0e06\u0e29\u0e13\u0e32\u0e08\u0e32\u0e01 Google AdSense \u0e04\u0e38\u0e13\u0e2a\u0e32\u0e21\u0e32\u0e23\u0e16\u0e40\u0e1b\u0e25\u0e35\u0e48\u0e22\u0e19\u0e43\u0e08\u0e44\u0e14\u0e49\u0e15\u0e25\u0e2d\u0e14\u0e40\u0e27\u0e25\u0e32\u0e1c\u0e48\u0e32\u0e19\u0e25\u0e34\u0e07\u0e01\u0e4c "\u0e01\u0e32\u0e23\u0e15\u0e31\u0e49\u0e07\u0e04\u0e48\u0e32\u0e04\u0e38\u0e01\u0e01\u0e35\u0e49" \u0e17\u0e35\u0e48\u0e2a\u0e48\u0e27\u0e19\u0e17\u0e49\u0e32\u0e22', accept: '\u0e22\u0e2d\u0e21\u0e23\u0e31\u0e1a\u0e17\u0e31\u0e49\u0e07\u0e2b\u0e21\u0e14', reject: '\u0e1b\u0e0f\u0e40\u0e2a\u0e18\u0e17\u0e35\u0e48\u0e44\u0e21\u0e48\u0e08\u0e33\u0e40\u0e1b\u0e47\u0e19', customize: '\u0e1b\u0e23\u0e31\u0e1a\u0e41\u0e15\u0e48\u0e07', save: '\u0e1a\u0e31\u0e19\u0e17\u0e36\u0e01\u0e01\u0e32\u0e23\u0e15\u0e31\u0e49\u0e07\u0e04\u0e48\u0e32', analytics: '\u0e01\u0e32\u0e23\u0e27\u0e34\u0e40\u0e04\u0e23\u0e32\u0e30\u0e2b\u0e4c', analyticsDesc: '\u0e2a\u0e16\u0e34\u0e15\u0e34\u0e01\u0e32\u0e23\u0e43\u0e0a\u0e49\u0e07\u0e32\u0e19\u0e41\u0e1a\u0e1a\u0e44\u0e21\u0e48\u0e23\u0e30\u0e1a\u0e38\u0e15\u0e31\u0e27\u0e15\u0e31\u0e27 (\u0e01\u0e32\u0e23\u0e40\u0e02\u0e49\u0e32\u0e0a\u0e21\u0e2b\u0e19\u0e49\u0e32 \u0e02\u0e49\u0e2d\u0e1c\u0e34\u0e14\u0e1e\u0e25\u0e32\u0e14) \u0e0a\u0e48\u0e27\u0e22\u0e43\u0e2b\u0e49\u0e40\u0e23\u0e32\u0e1b\u0e23\u0e31\u0e1a\u0e1b\u0e23\u0e38\u0e07\u0e40\u0e27\u0e47\u0e1a\u0e44\u0e0b\u0e15\u0e4c', ads: '\u0e42\u0e06\u0e29\u0e13\u0e32\u0e40\u0e09\u0e1e\u0e32\u0e30\u0e1a\u0e38\u0e04\u0e04\u0e25', adsDesc: 'Google AdSense \u0e0a\u0e48\u0e27\u0e22\u0e43\u0e2b\u0e49\u0e40\u0e23\u0e32\u0e23\u0e31\u0e01\u0e29\u0e32\u0e40\u0e27\u0e47\u0e1a\u0e44\u0e0b\u0e15\u0e4c\u0e43\u0e2b\u0e49\u0e1f\u0e23\u0e35 \u0e04\u0e38\u0e13\u0e08\u0e30\u0e22\u0e31\u0e07\u0e40\u0e2b\u0e47\u0e19\u0e42\u0e06\u0e29\u0e13\u0e32\u0e2b\u0e32\u0e01\u0e1b\u0e0f\u0e40\u0e2a\u0e18 \u2014 \u0e40\u0e1e\u0e35\u0e22\u0e07\u0e41\u0e15\u0e48\u0e44\u0e21\u0e48\u0e40\u0e09\u0e1e\u0e32\u0e30\u0e1a\u0e38\u0e04\u0e04\u0e25', required: '\u0e08\u0e33\u0e40\u0e1b\u0e47\u0e19\u0e2d\u0e22\u0e48\u0e32\u0e07\u0e22\u0e34\u0e48\u0e07', requiredDesc: '\u0e08\u0e33\u0e40\u0e1b\u0e47\u0e19\u0e2a\u0e33\u0e2b\u0e23\u0e31\u0e1a\u0e01\u0e32\u0e23\u0e17\u0e33\u0e07\u0e32\u0e19\u0e02\u0e2d\u0e07\u0e40\u0e27\u0e47\u0e1a\u0e44\u0e0b\u0e15\u0e4c (\u0e04\u0e27\u0e32\u0e21\u0e22\u0e34\u0e19\u0e22\u0e2d\u0e21\u0e04\u0e38\u0e01\u0e01\u0e35\u0e49 \u0e17\u0e35\u0e48\u0e08\u0e31\u0e14\u0e40\u0e01\u0e47\u0e1a\u0e0a\u0e37\u0e48\u0e2d\u0e17\u0e35\u0e48\u0e1a\u0e31\u0e19\u0e17\u0e36\u0e01\u0e44\u0e27\u0e49) \u0e40\u0e1b\u0e34\u0e14\u0e43\u0e0a\u0e49\u0e07\u0e32\u0e19\u0e15\u0e25\u0e2d\u0e14', settings: '\u0e01\u0e32\u0e23\u0e15\u0e31\u0e49\u0e07\u0e04\u0e48\u0e32\u0e04\u0e38\u0e01\u0e01\u0e35\u0e49' },
    hu: { title: 'Cookie-k \u00e9s hirdet\u00e9sek', body: 'Cookie-kat haszn\u00e1lunk a webhely elemz\u00e9s\u00e9hez \u00e9s (az \u00d6n hozz\u00e1j\u00e1rul\u00e1s\u00e1val) a Google AdSense hirdet\u00e9seinek megjelen\u00edt\u00e9s\u00e9hez. B\u00e1rmikor meggondolhatja mag\u00e1t a l\u00e1bl\u00e9cben tal\u00e1lhat\u00f3 "Cookie-be\u00e1ll\u00edt\u00e1sok" linken kereszt\u00fcl.', accept: '\u00d6sszes elfogad\u00e1sa', reject: 'Nem k\u00f6telez\u0151 elutas\u00edt\u00e1sa', customize: 'Testreszab\u00e1s', save: 'Be\u00e1ll\u00edt\u00e1sok ment\u00e9se', analytics: 'Analitika', analyticsDesc: 'N\u00e9vtelen haszn\u00e1lati statisztik\u00e1k (l\u00e1togat\u00e1sok, hib\u00e1k). Seg\u00edt a webhely fejleszt\u00e9s\u00e9ben.', ads: 'Szem\u00e9lyre szabott hirdet\u00e9sek', adsDesc: 'Google AdSense. Seg\u00edt ingyenesen tartani a webhelyet. Elutas\u00edt\u00e1s eset\u00e9n is l\u00e1t hirdet\u00e9seket \u2014 csak nem szem\u00e9lyre szabottak.', required: 'Szigor\u00fan sz\u00fcks\u00e9ges', requiredDesc: 'A webhely m\u0171k\u00f6d\u00e9s\u00e9hez sz\u00fcks\u00e9ges (cookie-hozz\u00e1j\u00e1rul\u00e1s, mentett nevek helyi t\u00e1rol\u00e1sa). Mindig bekapcsolva.', settings: 'Cookie-be\u00e1ll\u00edt\u00e1sok' }
  };
  var t = STRINGS[DEFAULT_LOCALE] || STRINGS.en;

  // --------- storage helpers ----------
  function readPref() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var p = JSON.parse(raw);
      if (!p || !p.exp || p.exp < Date.now()) return null;
      return p;
    } catch (e) { return null; }
  }
  function writePref(pref) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        v: 1,
        dec: pref.dec,                  // 'accept' | 'reject' | 'custom'
        cat: pref.cat,                  // { analytics, ads } booleans
        ts: Date.now(),
        exp: Date.now() + EXPIRY_DAYS * 864e5
      }));
    } catch (e) {}
  }
  function applyToBody(pref) {
    var dec = pref.dec, cat = pref.cat;
    var adsOn = (dec === 'accept') || (dec === 'custom' && cat.ads);
    var analyticsOn = (dec === 'accept') || (dec === 'custom' && cat.analytics);
    document.body.dataset.cc = dec;
    document.body.dataset.ccAnalytics = analyticsOn ? '1' : '0';
    document.body.dataset.ccAds = adsOn ? '1' : '0';
  }

  // --------- GPC honor ----------
  // Global Privacy Control sends the header sec-gpc: 1 when the user has
  // GPC enabled in their browser. We treat that as "reject non-essential".
  var gpcOn = (navigator.globalPrivacyControl === true);

  // --------- banner markup ----------
  function buildBanner() {
    var wrap = document.createElement('div');
    wrap.id = 'cc-banner';
    wrap.setAttribute('role', 'region');
    wrap.setAttribute('aria-label', t.title);
    wrap.innerHTML = [
      '<div class="cc-inner">',
      '  <div class="cc-text">',
      '    <h2 class="cc-title">', escape(t.title), '</h2>',
      '    <p class="cc-body">', escape(t.body), '</p>',
      '  </div>',
      '  <div class="cc-actions">',
      '    <button type="button" class="cc-btn cc-btn--primary" data-cc="accept">', escape(t.accept), '</button>',
      '    <button type="button" class="cc-btn cc-btn--ghost" data-cc="reject">', escape(t.reject), '</button>',
      '    <button type="button" class="cc-btn cc-btn--link" data-cc="customize">', escape(t.customize), '</button>',
      '  </div>',
      '</div>',
      '<div class="cc-details" hidden>',
      '  <label class="cc-row">',
      '    <input type="checkbox" data-cat="required" checked disabled>',
      '    <span><strong>', escape(t.required), '</strong><br><span class="cc-row__desc">', escape(t.requiredDesc), '</span></span>',
      '  </label>',
      '  <label class="cc-row">',
      '    <input type="checkbox" data-cat="analytics">',
      '    <span><strong>', escape(t.analytics), '</strong><br><span class="cc-row__desc">', escape(t.analyticsDesc), '</span></span>',
      '  </label>',
      '  <label class="cc-row">',
      '    <input type="checkbox" data-cat="ads">',
      '    <span><strong>', escape(t.ads), '</strong><br><span class="cc-row__desc">', escape(t.adsDesc), '</span></span>',
      '  </label>',
      '  <div class="cc-details__actions">',
      '    <button type="button" class="cc-btn cc-btn--primary" data-cc="save">', escape(t.save), '</button>',
      '  </div>',
      '</div>'
    ].join('\n');
    return wrap;
  }
  function escape(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  // --------- show / hide ----------
  function showBanner(prefillFromPref) {
    if (document.getElementById('cc-banner')) return;
    var b = buildBanner();
    document.body.appendChild(b);
    b.querySelectorAll('[data-cat]:not([data-cat="required"])').forEach(function (input) {
      var cat = input.getAttribute('data-cat');
      if (prefillFromPref) {
        input.checked = prefillFromPref.dec === 'accept' || (prefillFromPref.cat && prefillFromPref.cat[cat]);
      } else {
        input.checked = false;
      }
    });
    b.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-cc]');
      if (!btn) return;
      var act = btn.getAttribute('data-cc');
      if (act === 'accept')  return commit({ dec: 'accept', cat: { analytics: true,  ads: true  } });
      if (act === 'reject')  return commit({ dec: 'reject', cat: { analytics: false, ads: false } });
      if (act === 'customize') {
        var d = b.querySelector('.cc-details');
        d.hidden = !d.hidden;
        return;
      }
      if (act === 'save') {
        var analytics = b.querySelector('[data-cat="analytics"]').checked;
        var ads       = b.querySelector('[data-cat="ads"]').checked;
        return commit({ dec: 'custom', cat: { analytics: analytics, ads: ads } });
      }
    });
  }
  function hideBanner() {
    var b = document.getElementById('cc-banner');
    if (b) b.remove();
  }
  function commit(pref) {
    writePref(pref);
    applyToBody(pref);
    hideBanner();
    // Tell the page that consent changed (useful for ad scripts to lazy-load).
    document.dispatchEvent(new CustomEvent('cookieconsent:change', { detail: pref }));
  }

  // --------- footer "Cookie settings" link ----------
  // The link is static HTML (a footer <a>); we wire it up here.
  function wireSettingsLink() {
    var link = document.querySelector('a[data-cc-settings]');
    if (!link) return;
    link.addEventListener('click', function (e) {
      e.preventDefault();
      var existing = readPref();
      showBanner(existing || { dec: 'custom', cat: { analytics: false, ads: false } });
    });
  }

  // --------- AdSense loader ----------
  // Google AdSense infrastructure is wired up here so that:
  //   1. The ad script only loads after explicit consent (body[data-cc-ads="1"])
  //   2. Each <ins class="adsbygoogle"> slot pushes its request AFTER layout
  //      has settled, so the browser reports a real width (avoids
  //      "No slot size for availableWidth=0" errors on first paint)
  //   3. We listen for the 'cookieconsent:change' event so that consenting
  //      later (e.g. via the footer "Cookie settings" link) retroactively
  //      loads ads.
  //
  // To activate: set window.ADSENSE_CLIENT (e.g. "ca-pub-1234567890123456")
  // in a small <script> BEFORE this file loads, then replace the
  // <span class="ad-slot__note">...</span> placeholder in each page's HTML
  // with a real <ins class="adsbygoogle"> tag.
  function loadAdSense() {
    if (!window.ADSENSE_CLIENT) {
      // AdSense not activated yet. The ad-slot placeholder is hidden
      // (display: none) by default and shown only when consent is on,
      // so an inactive AdSense is invisible to users.
      return;
    }
    if (window.__adsenseLoaded) return;
    window.__adsenseLoaded = true;
    // Inject the AdSense script tag. async = non-blocking.
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(window.ADSENSE_CLIENT);
    s.crossOrigin = 'anonymous';
    document.head.appendChild(s);
    // Push all existing <ins> slots, plus any that appear later.
    function pushAll() {
      var ins = document.querySelectorAll('ins.adsbygoogle[data-adsbygoogle-status="0"]');
      ins.forEach(function (el) {
        try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
      });
    }
    // Defer push to after layout has settled — avoids "No slot size" errors.
    s.addEventListener('load', function () {
      // Two animation frames to be safe (rAF + setTimeout) — recommended
      // by the AdSense help docs for first paint.
      requestAnimationFrame(function () {
        setTimeout(pushAll, 50);
      });
    });
    // Also watch the cookieconsent:change event for late consenters
    document.addEventListener('cookieconsent:change', function (e) {
      if (e.detail && (e.detail.ads || (e.detail.dec === 'accept'))) {
        loadAdSense();
      }
    });
  }
  // Expose for the page bootstrap
  window.loadAdSense = loadAdSense;

  // --------- init ----------
  function init() {
    wireSettingsLink();
    var existing = readPref();

    // If GPC is on and no preference stored, treat as reject.
    if (!existing && gpcOn) {
      commit({ dec: 'reject', cat: { analytics: false, ads: false } });
      return;
    }
    if (existing) {
      applyToBody(existing);
      // If the user previously accepted, load ads now (post-DOMContentLoaded)
      if (document.body.dataset.ccAds === '1') {
        // Tiny delay so layout can settle first
        setTimeout(loadAdSense, 100);
      }
      return;
    }
    // No pref yet — show banner after a tiny delay so the page settles.
    setTimeout(function () { showBanner(null); }, 250);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
