/* =====================================================================
 *  Japanese Name Generator (Anime/Weeb Audience)
 *  Four sub-generators: Animal/Cute | English-Japanese Fusion |
 *  Realistic | Shrine/Temple
 *  Target audience: anime fans, OC creators, fan-persona builders.
 *  All name data is hand-curated from public, IP-safe sources.
 *  See ATTRIBUTIONS.md for licenses.
 * ===================================================================== */

const JapaneseNameGenerator = (() => {
  'use strict';

  // ----- Data caches (populated by init() or setData()) -----
  const DATA = {
    animalsNature: null,
    coolWords: null,
    fusionEnglish: null,
    fusionSpanish: null,
    fusionFrench: null,
    fusionPortuguese: null,
    fusionGerman: null,
    fusionDutch: null,
    fusionPolish: null,
    givenNames: null,
    surnames: null,
    shrines: null,
    mythology: null,
    martial: null,
    vocabNames: null,
  };

  // ----- Pick the right fusion source-language pool -----
  // Falls back to English if the requested language isn't loaded. This is
  // the safe-default behavior for Hindi/Tagalog UI locales as well —
  // they get the English word bank because there's no Hindi/Tagalog
  // fusion option in the UI at all.
  const resolveFusionPool = (language) => {
    switch (language) {
      case 'spanish':    return DATA.fusionSpanish   || DATA.fusionEnglish;
      case 'french':     return DATA.fusionFrench    || DATA.fusionEnglish;
      case 'portuguese': return DATA.fusionPortuguese|| DATA.fusionEnglish;
      case 'german':     return DATA.fusionGerman    || DATA.fusionEnglish;
      case 'dutch':      return DATA.fusionDutch     || DATA.fusionEnglish;
      case 'polish':     return DATA.fusionPolish    || DATA.fusionEnglish;
      case 'english':
      default:           return DATA.fusionEnglish;
    }
  };

  // ----- Utility: pick random element -----
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // ----- Utility: pick N unique elements (or N if duplicates allowed) -----
  const pickN = (arr, n) => {
    const copy = [...arr];
    const out = [];
    for (let i = 0; i < n && copy.length > 0; i++) {
      const idx = Math.floor(Math.random() * copy.length);
      out.push(copy.splice(idx, 1)[0]);
    }
    return out;
  };

  // ----- Utility: capitalize first letter -----
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  // ----- Utility: light phonotactic check (avoid clunky duplications) -----
  // Rejects fusions where a syllable is awkwardly repeated, e.g. "MochiMochi"
  const isPhoneticallyOK = (a, b) => {
    if (!a || !b) return true;
    const aEnd = a.slice(-2).toLowerCase();
    const bStart = b.slice(0, 2).toLowerCase();
    if (aEnd === bStart) return false;          // "NekoKage" -> "ko"+"ko" overlap
    return true;
  };

  // ----- Utility: format output for a fusion (camel/space/hyphen/underscore) -----
  const formatFusion = (left, right, style) => {
    const L = cap(left.toLowerCase());
    const R = cap(right.toLowerCase());
    switch (style) {
      case 'camel':   return L + R;                 // CuteNeko
      case 'lower':   return (L + R).toLowerCase();  // cuteneko
      case 'space':   return L + ' ' + R;            // Cute Neko
      case 'hyphen':  return L + '-' + R;            // Cute-Neko
      case 'under':   return L + '_' + R;            // Cute_Neko
      case 'pipe':    return L + ' | ' + R;          // Cute | Neko
      default:        return L + R;
    }
  };

  // =====================================================================
  //  1. Cute Animal/Nature-Themed Names
  //  Vibe: pets, OCs, fun handles, kawaii usernames.
  //  Output: single Japanese word, optionally + cute suffix (-chan, -maru).
  // =====================================================================
  // Helper: localize a word's English meaning to the current page locale.
  // Available to all generators (was previously scoped only to generateFusion).
  const _pageLocaleRaw = (typeof document !== 'undefined' && document.documentElement && document.documentElement.lang) || 'en';
  const _pageLocale = _pageLocaleRaw.split('-')[0];
  // Read MYTHOLOGY_I18N dynamically (it's lazy-loaded when the Mythology tab
  // is opened). Capturing it once at module load would always be null because
  // the lazy load hasn't run yet. Read on every call.
  const _getFigureMeanings = () => (typeof window !== 'undefined' && window.MYTHOLOGY_I18N && window.MYTHOLOGY_I18N.figure_meanings) || null;
  const _getLegacyFigureMeanings = () => (typeof window !== 'undefined' && window.MYTHOLOGY_I18N && window.MYTHOLOGY_I18N[_pageLocale] && window.MYTHOLOGY_I18N[_pageLocale].figure_meanings) || null;
  // _i18nMeanings (FUSION_I18N.meanings) is inlined into the HTML at build
  // time, so it IS available at module load and can be captured once.
  const _i18nMeanings = (typeof window !== 'undefined' && window.FUSION_I18N && window.FUSION_I18N.meanings) || null;
  const _localizeMeaning = (enMeaning) => {
    if (!enMeaning) return enMeaning;
    // First try the mythology figure_meanings map (covers long descriptive strings).
    // Read dynamically because MYTHOLOGY_I18N is lazy-loaded.
    const figMeanings = _getFigureMeanings();
    if (figMeanings && figMeanings[_pageLocale] && figMeanings[_pageLocale][enMeaning]) {
      return figMeanings[_pageLocale][enMeaning];
    }
    // Then try the general meanings map
    if (_i18nMeanings && _i18nMeanings[_pageLocale] && _i18nMeanings[_pageLocale][enMeaning]) {
      return _i18nMeanings[_pageLocale][enMeaning];
    }
    // Legacy nested figure_meanings
    const legacyFig = _getLegacyFigureMeanings();
    if (legacyFig && legacyFig[enMeaning]) {
      return legacyFig[enMeaning];
    }
    return enMeaning;
  };
  // Per-locale "and" separator for compound meanings (e.g. "X + Y" or "X 和 Y")
  // Used when joining multiple kanji-meaning fragments in a single card.
  const _MEANING_AND = {
    en: '+', nl: '+', de: '+', es: '+', fr: '+', pt: '+', pl: '+',
    ar: ' + ', id: '+', ms: '+', vi: '+', hi: '+', ur: ' + ',
    zh: ' + ', ko: '+', ru: '+', uk: '+', yo: '+', bn: '+',
    th: '+', hu: ' + ',
  };
  const _GIVEN_NAME_LABEL = {
    en: 'given name', nl: 'voornaam', de: 'Vorname', es: 'nombre de pila',
    fr: 'prénom', pt: 'nome próprio', pl: 'imię',
    ar: 'الاسم المعطى', id: 'nama pemberian', ms: 'nama yang diberikan',
    vi: 'tên đã cho', hi: 'दिया गया नाम', ur: 'دیا گیا نام',
    zh: '给定名字', ko: '주어진 이름',
    ru: 'данное имя', uk: 'дане ім\'я', yo: 'orúkọ tí a fún',
    bn: 'প্রদত্ত নাম', th: 'ชื่อที่กำหนด', hu: 'adott név',
  };
  const _SHRINE_INSPIRED_LABEL = {
    en: 'Shrine-inspired', nl: 'Heiligdom-geïnspireerd', de: 'Schrein-inspiriert',
    es: 'Inspirado en santuario', fr: 'Inspiré du sanctuaire',
    pt: 'Inspirado em santuário', pl: 'Zainspirowane świątynią',
    ar: 'مستوحى من المعبد', id: 'Terinspirasi kuil', ms: 'Terinspirasi kuil',
    vi: 'Lấy cảm hứng từ đền', hi: 'मंदिर से प्रेरित', ur: 'مندر سے متاثر',
    zh: '受神社启发', ko: '신사에서 영감',
    ru: 'Вдохновлено святилищем', uk: 'Натхненний храмом', yo: 'láti inú ilé ìjọ́sìn',
    bn: 'মন্দির দ্বারা অনুপ্রাণিত', th: 'แรงบันดาลใจจากศาลเจ้า',
    hu: 'Szentély ihlette',
  };
  // Smart compound-meaning localizer: handles "X + Y", "X / Y", "X + Y (Z)" structures.
  // Splits on '+' first (concatenated fragments), then on ' / ' (alternative
  // translations like "cool sound / refreshing tone"). Localizes each piece and
  // rejoins with the per-locale separator. Preserves parenthetical glosses.
  // Important: only emit a translated result if EVERY fragment has a translation,
  // otherwise fall back to the original English to avoid mid-sentence
  // language mixing (e.g. "bamboo + forest" partially translated).
  const _localizeCompoundMeaning = (enMeaning) => {
    if (!enMeaning) return enMeaning;
    const sep = _MEANING_AND[_pageLocale] || '+';
    // Quick path: try the full string first (handles pre-translated entries)
    const direct = _localizeMeaning(enMeaning);
    if (direct !== enMeaning) return direct;
    // No full-string match. First split on '/' (alternative translations, with
    // or without surrounding spaces) — pick the alternative whose
    // dict-translation differs from its key (i.e. the one that has been
    // localized). If any alternative has a translation, use that.
    if (enMeaning.indexOf('/') !== -1) {
      const alts = enMeaning.split(/\s*\/\s*/).map((a) => a.trim());
      if (alts.length >= 2) {
        const altTrans = alts.map((a) => _localizeMeaning(a));
        const localizedAlt = altTrans.findIndex((t, i) => t !== alts[i]);
        if (localizedAlt !== -1) {
          // Found a localized alternative. Return it directly.
          return altTrans[localizedAlt];
        }
        // No alt translated, fall through to '+' splitting
      }
    }
    // No ' / ' or no translated alternative — split on '+' and localize each piece
    if (enMeaning.indexOf('+') === -1) return enMeaning; // single term, no dictionary hit
    const parts = enMeaning.split(/\s*\+\s*/).map((p) => p.trim()).filter(Boolean);
    if (parts.length < 2) return enMeaning;
    const translated = parts.map((p) => _localizeMeaning(p));
    // Only use the translated result if EVERY part was translated
    // (avoids mid-sentence language mixing)
    if (translated.some((t, i) => t === parts[i])) return enMeaning;
    return translated.join(' ' + sep.trim() + ' ');
  };
  // Expose for debugging / templates
  // (kept private by convention; used via closure below)

  const generateAnimal = (opts = {}) => {
    const {
      count = 8,
      suffixes = ['none', 'chan', 'maru', 'pon'],
      includeEnglish = false,
    } = opts;

    // Pool now includes animals/nature + vocabulary-as-names (for the cute/gentle
    // entries that double as given names like Midori, Aoi, Sora, Yume, etc.)
    const pool = [
      ...DATA.animalsNature.words,
      ...DATA.vocabNames.words.filter(w => w.tags.includes('cute') || w.tags.includes('nature') || w.tags.includes('light')),
    ];
    const selected = pickN(pool, count);
    const englishPool = DATA.fusionEnglish.words.filter(w => w.tags.includes('cute'));

    return selected.map((w) => {
      const suf = pick(suffixes);
      let romaji = w.romaji;
      switch (suf) {
        case 'chan': romaji = w.romaji + '-chan'; break;
        case 'maru': romaji = w.romaji + '-maru'; break;
        case 'pon':  romaji = w.romaji + '-pon';  break;
        case 'none':
        default: break;
      }
      // Optional: a small fraction get a cute English prefix fusion
      if (includeEnglish && Math.random() < 0.3) {
        const eng = pick(englishPool);
        if (isPhoneticallyOK(eng.word, w.romaji)) {
          romaji = formatFusion(eng.word, w.romaji, 'camel');
        }
      }
      return {
        type: 'animal',
        romaji,
        hiragana: w.hiragana,
        kanji:   w.kanji,
        meaning: _localizeCompoundMeaning(w.meaning),
        tags:    w.tags,
      };
    });
  };

  // =====================================================================
  //  2. English-Japanese Fusion Names
  //  Style: "CuteNeko", "ShadowKitsune", "StarYuki"
  // =====================================================================
  //  2. Fusion (multilingual) — pairs a word from a chosen source language
  //  with the same Japanese word bank used by every other generator.
  //  language: 'english' (default) | 'spanish' | 'french' | 'portuguese' | 'german' | 'dutch'
  //  order:    'lang-first' (source-lang prefix) | 'japanese-first'
  //  style:    'camel' | 'lower' | 'space' | 'hyphen' | 'under' | 'pipe'
  //  vibeFilter: 'all' | 'cute' | 'cool' | 'dark' | 'strong' | 'elegant'
  // =====================================================================
  const generateFusion = (opts = {}) => {
    const {
      count = 8,
      style = 'camel',
      englishFirst = true,        // backwards-compat alias for `order`
      order = null,               // 'lang-first' | 'japanese-first'  (overrides englishFirst)
      language = 'english',       // 'english' | 'spanish' | 'french' | 'portuguese' | 'german' | 'dutch' | 'polish'
      userWord = '',              // when set (non-empty after trim), used as the source word for ALL pairings
      vibeFilter = 'all',
    } = opts;

    // Resolve the source-language pool. If the requested language isn't loaded
    // (e.g. deployment missing a file), fall back to English.
    const sourcePool = resolveFusionPool(language);
    const rawLangLabel = (sourcePool && sourcePool._meta && sourcePool._meta.language_label) || 'English';
    // Localize the language label to the current page locale. The build script
    // injects window.FUSION_I18N = { language_labels: { en: {German:'Deutsch', ...} } }
    // for every page; if the injection is missing (e.g. running standalone),
    // fall back to the English label.
    const pageLocaleRaw = (typeof document !== 'undefined' && document.documentElement && document.documentElement.lang) || 'en';
    // Normalize: strip region (e.g. 'pt-BR' -> 'pt', 'zh-TW' -> 'zh')
    const pageLocale = pageLocaleRaw.split('-')[0];
    const i18nLabels = (typeof window !== 'undefined' && window.FUSION_I18N && window.FUSION_I18N.language_labels) || null;
    const i18nMeanings = (typeof window !== 'undefined' && window.FUSION_I18N && window.FUSION_I18N.meanings) || null;
    const langLabel = (i18nLabels && i18nLabels[pageLocale] && i18nLabels[pageLocale][rawLangLabel]) || rawLangLabel;
    // Helper: localize a Japanese word's English meaning to the current page
    // locale. Falls back to the English original when the meaning isn't in the
    // translation map (covers compound/specialized meanings).
    const localizeMeaning = (enMeaning) => {
      if (!enMeaning) return enMeaning;
      if (i18nMeanings && i18nMeanings[pageLocale] && i18nMeanings[pageLocale][enMeaning]) {
        return i18nMeanings[pageLocale][enMeaning];
      }
      return enMeaning;
    };

    // The "source-language first" vs "japanese first" toggle
    const sourceFirst = (order === 'japanese-first') ? false : (order === 'lang-first' ? true : englishFirst);

    // Japanese pool — pull from animals/nature, cool, vocab-as-names.
    // Mythology + martial have their own dedicated tab now.
    const allJapanese = [
      ...DATA.animalsNature.words,
      ...DATA.coolWords.words,
      ...DATA.vocabNames.words,
    ];
    const japanesePool = (vibeFilter === 'all')
      ? allJapanese
      : allJapanese.filter(w => {
          if (vibeFilter === 'cute')    return w.tags.includes('cute') || w.tags.includes('gentle') || w.tags.includes('nature');
          if (vibeFilter === 'cool')    return w.tags.includes('cool') || w.tags.includes('epic');
          if (vibeFilter === 'dark')    return w.tags.includes('dark') || w.tags.includes('mysterious');
          if (vibeFilter === 'strong')  return w.tags.includes('strong') || w.tags.includes('epic');
          if (vibeFilter === 'elegant') return w.tags.includes('elegant') || w.tags.includes('vocab') || w.tags.includes('light');
          return true;
        });

    const sourceWords = sourcePool.words;

    // Sanitize the user's word: trim, allow letters (incl. accented) + hyphens, max 24 chars.
    // If empty after sanitization, fall back to random generation.
    const sanitizeUserWord = (raw) => {
      if (!raw) return '';
      const trimmed = String(raw).trim();
      if (trimmed.length === 0 || trimmed.length > 24) return '';
      if (/\s/.test(trimmed)) return '';   // single word only — no spaces
      if (!/^[\p{L}\-]+$/u.test(trimmed)) return '';   // letters (incl. unicode) + hyphens only
      return trimmed;
    };
    const safeUserWord = sanitizeUserWord(userWord);
    const usingUserWord = safeUserWord.length > 0;

    const out = [];
    let attempts = 0;
    const maxAttempts = count * 50;  // bumped to 50x so user-typed words (which can clash with many Japanese) get more tries
    let lastAttempted = null;
    while (out.length < count && attempts < maxAttempts) {
      attempts++;
      const e = usingUserWord
        ? { word: safeUserWord, _userTyped: true }
        : pick(sourceWords);
      const j = pick(japanesePool);
      const left  = sourceFirst ? e.word  : j.romaji;
      const right = sourceFirst ? j.romaji : e.word;
      lastAttempted = { e, j, left, right };
      if (!isPhoneticallyOK(left, right)) continue;
      // Compute BOTH orderings now so the per-card swap is instant.
      const leftLF  = e.word;        // source word
      const rightLF = j.romaji;      // japanese word
      const leftJF  = j.romaji;
      const rightJF = e.word;
      out.push({
        type: 'fusion',
        // Default: source-language-first ("ShadowKitsune")
        romaji: formatFusion(leftLF, rightLF, style),
        // Pre-rendered alternative orderings for the per-card swap button
        _langFirst:        formatFusion(leftLF, rightLF, style),
        _japaneseFirst:    formatFusion(leftJF, rightJF, style),
        _order: 'lang-first',
        // Kanji/hiragana follow the active ordering
        kanji:   sourceFirst ? j.kanji   : null,
        hiragana:sourceFirst ? j.hiragana: null,
        _kanjiLangFirst:    j.kanji,
        _kanjiJapaneseFirst:null,
        _hiraLangFirst:     j.hiragana,
        _hiraJapaneseFirst: null,
        meaning: sourceFirst
          ? `${e.word}${e._userTyped ? '' : ' (' + langLabel + ')'} ${_MEANING_AND[_pageLocale] || '+'} ${_localizeCompoundMeaning(j.meaning)}`
          : `${_localizeCompoundMeaning(j.meaning)} ${_MEANING_AND[_pageLocale] || '+'} ${e.word}${e._userTyped ? '' : ' (' + langLabel + ')'}`,
        tags: [...(e.tags || []), ...(j.tags || [])],
        sourceLang: language,
        userTyped: !!e._userTyped,
      });
    }
    // Fallback: if the phonetic check rejected ALL pairings (can happen with a user-typed
    // word that clashes with every random Japanese word), return the last attempted pair
    // bypassing the check rather than returning 0 results.
    if (out.length === 0 && lastAttempted) {
      const { e, j, left, right } = lastAttempted;
      const leftLF  = e.word;
      const rightLF = j.romaji;
      const leftJF  = j.romaji;
      const rightJF = e.word;
      out.push({
        type: 'fusion',
        romaji: formatFusion(leftLF, rightLF, style),
        _langFirst:        formatFusion(leftLF, rightLF, style),
        _japaneseFirst:    formatFusion(leftJF, rightJF, style),
        _order: 'lang-first',
        kanji:   sourceFirst ? j.kanji   : null,
        hiragana:sourceFirst ? j.hiragana: null,
        _kanjiLangFirst:    j.kanji,
        _kanjiJapaneseFirst:null,
        _hiraLangFirst:     j.hiragana,
        _hiraJapaneseFirst: null,
        meaning: sourceFirst
          ? `${e.word}${e._userTyped ? '' : ' (' + langLabel + ')'} ${_MEANING_AND[_pageLocale] || '+'} ${_localizeCompoundMeaning(j.meaning)}`
          : `${_localizeCompoundMeaning(j.meaning)} ${_MEANING_AND[_pageLocale] || '+'} ${e.word}${e._userTyped ? '' : ' (' + langLabel + ')'}`,
        tags: [...(e.tags || []), ...(j.tags || [])],
        sourceLang: language,
        userTyped: !!e._userTyped,
      });
    }
    return out;
  };

  // =====================================================================
  //  3. Normal / Realistic Japanese Names
  //  Real given names + real surnames in Japanese order (surname + given).
  // =====================================================================
  const generateRealistic = (opts = {}) => {
    const {
      count = 8,
      gender = 'any',        // 'male' | 'female' | 'neutral' | 'any'
      order  = 'japanese',   // 'japanese' (surname first) | 'western' (given first)
      includeMeaning = true,
    } = opts;

    // Build the gender-aware name pool
    // Now pulls from BOTH the curated given-names list AND the vocabulary-as-names
    // list, so realistic output covers common names + nature/virtue words commonly
    // used as given names (Midori, Aoi, Sora, etc.).
    const gn = DATA.givenNames;
    const vocab = DATA.vocabNames.words;
    // Vocab-as-names are gender-neutral by default; only include once for 'any'
    const vocabAsNames = vocab.filter(w => w.tags.includes('vocab')).map(w => ({
      romaji: w.romaji, kanji: w.kanji, hiragana: w.hiragana, meaning: w.meaning, _vocab: true,
    }));
    let namePool = [];
    if (gender === 'male' || gender === 'any') namePool = namePool.concat(gn.male);
    if (gender === 'female' || gender === 'any') namePool = namePool.concat(gn.female);
    if (gender === 'neutral' || gender === 'any') namePool = namePool.concat(gn.neutral);
    if (gender === 'any') namePool = namePool.concat(vocabAsNames);
    if (namePool.length === 0) namePool = [...gn.neutral];

    const surnamePool = DATA.surnames.surnames;

    return pickN(namePool.filter(n => !n._alias_of), count).map((given) => {
      const surname = pick(surnamePool);
      const fullJapanese = `${surname.kanji} ${given.kanji}`;
      const fullWestern  = `${given.kanji} ${surname.kanji}`;
      // Localize each part of the meaning, then do the all-or-nothing check on
      // the COMBINED output. This prevents mid-sentence language mixing when
      // one part's fragments all translate and the other's don't.
      const sep = _MEANING_AND[_pageLocale] || '+';
      let meaning = null;
      if (includeMeaning) {
        const sLocal = _localizeCompoundMeaning(surname.meaning);
        const gLocal = _localizeCompoundMeaning(given.meaning);
        // If either side fell back to the original English, the whole combined
        // meaning falls back too (no mixing). Otherwise join the translated parts.
        if (sLocal === surname.meaning || gLocal === given.meaning) {
          meaning = `${surname.meaning} ${sep} ${given.meaning}`;
        } else {
          meaning = `${sLocal} ${sep} ${gLocal}`;
        }
      }
      return {
        type: 'realistic',
        romaji: order === 'japanese'
          ? `${cap(surname.romaji)} ${cap(given.romaji)}`
          : `${cap(given.romaji)} ${cap(surname.romaji)}`,
        hiragana: order === 'japanese'
          ? `${surname.hiragana} ${given.hiragana}`
          : `${given.hiragana} ${surname.hiragana}`,
        kanji:   order === 'japanese' ? fullJapanese : fullWestern,
        meaning,
        tags: [...(given.tags || []), ...(surname.tags || [])],
        givenName: given,
        surname,
        order,
      };
    });
  };

  // =====================================================================
  //  4. Shrine / Temple-Inspired Names
  //  Real shrine/temple names used as a surname or as a standalone name.
  //  Frame clearly as "shrine-inspired" in the UI copy.
  // =====================================================================
  const generateShrine = (opts = {}) => {
    const {
      count = 8,
      mode = 'standalone',   // 'standalone' (use shrine as-is) | 'with_given' (shrine as surname)
      withGivenGender = 'any',
    } = opts;

    const shrinePool = DATA.shrines.shrines;
    const shrines = pickN(shrinePool, count);

    if (mode === 'standalone') {
      return shrines.map((s) => ({
        type: 'shrine',
        romaji: cap(s.romaji),
        hiragana: s.hiragana,
        kanji:   s.kanji,
        meaning: `${s.type === 'shrine' ? 'Shinto shrine' : 'Buddhist temple'} in ${s.location} — ${s.significance}`,
        tags:    ['shrine', 'real', 'cultural'],
        source:  s,
      }));
    }

    // mode === 'with_given' : pair as a surname
    const gn = DATA.givenNames;
    let givenPool = [];
    if (withGivenGender === 'male' || withGivenGender === 'any') givenPool = givenPool.concat(gn.male);
    if (withGivenGender === 'female' || withGivenGender === 'any') givenPool = givenPool.concat(gn.female);
    if (withGivenGender === 'neutral' || withGivenGender === 'any') givenPool = givenPool.concat(gn.neutral);
    if (givenPool.length === 0) givenPool = [...gn.neutral];

    return shrines.map((s) => {
      const given = pick(givenPool);
      // All-or-nothing: the Shrine with_given template is mostly English
      // (Shrine-inspired label, s.significance, s.location, given-name label)
      // plus the localized given.meaning fragments. To avoid mid-sentence
      // language mixing, we require EVERY label to have a translation AND
      // the given.meaning fragments to all translate; otherwise the whole
      // meaning falls back to the original English form.
      const sep = _MEANING_AND[_pageLocale] || '+';
      const shLabel = _SHRINE_INSPIRED_LABEL[_pageLocale] || 'Shrine-inspired';
      const gnLabel = _GIVEN_NAME_LABEL[_pageLocale] || 'given name';
      const gLocal = _localizeCompoundMeaning(given.meaning);
      const allLabelsTranslated =
        _SHRINE_INSPIRED_LABEL[_pageLocale] && _GIVEN_NAME_LABEL[_pageLocale];
      const gTranslated = gLocal !== given.meaning;
      let meaning;
      if (allLabelsTranslated && gTranslated) {
        meaning = `${shLabel}: ${s.significance} (${s.location}) ${sep} ${gnLabel} ${gLocal}`;
      } else {
        // Fall back to fully English (no mixing)
        meaning = `Shrine-inspired: ${s.significance} (${s.location}) + given name ${given.meaning}`;
      }
      return {
        type: 'shrine',
        romaji: `${cap(s.romaji)} ${cap(given.romaji)}`,
        hiragana: `${s.hiragana} ${given.hiragana}`,
        kanji:   `${s.kanji} ${given.kanji}`,
        meaning,
        tags:    ['shrine', 'real', 'cultural', 'with-given'],
        source:  s,
        given,
      };
    });
  };

  // =====================================================================
  //  4. Mythology (merged) — shrine / figure / martial sources combined
  //  The Mythology tab lets the user pick one of three sources, and
  //  optionally pair the result with a real given name.
  //  source: 'shrine' | 'figure' | 'martial'
  //  mode:   'standalone' | 'with_given'
  // =====================================================================
  const generateMythology = (opts = {}) => {
    const {
      count = 8,
      source = 'shrine',       // 'shrine' | 'figure' | 'martial'
      mode = 'standalone',     // 'standalone' | 'with_given'
      withGivenGender = 'any',
    } = opts;

    // Pick the right pool and the meaning formatter
    let pool, kindLabel, formatMeaning;
    if (source === 'shrine') {
      pool = DATA.shrines.shrines;
      kindLabel = 'shrine';
      // Use mythology i18n map if available, else English.
      // Use _pageLocale (module-scope) so this works from any generator function.
      const mythI18n = (typeof window !== 'undefined' && window.MYTHOLOGY_I18N) || null;
      const mLoc = mythI18n ? (mythI18n[_pageLocale] || mythI18n.en) : null;
      // Per-locale "in" preposition; if missing, fall back to the English form
      // to avoid mixing the label "Shinto-Schrein" with English "in" in a German card.
      const inPrep = (mLoc && mLoc.in && mLoc.in !== 'in') ? mLoc.in : 'in';
      // Per-locale significance translations (if any). Used to localize the
      // second half of the shrine meaning line ("— Water deity, fertility").
      const sigTr = (mLoc && mLoc.shrine_significance) || {};
      formatMeaning = (s) => {
        // Always build the FULL English reference first; we only swap in
        // localized pieces when EVERY part is available, so we never produce
        // a sentence that's half-localized and half-English.
        const english = `Shinto shrine in ${s.location} — ${s.significance}`;
        if (_pageLocale === 'en') return english;
        // For non-en: only localize if we have BOTH the shrine/temple label
        // AND the localized "in" preposition AND the localized significance.
        // Otherwise return the original English to keep the meaning consistent.
        const hasLabel = mLoc && (mLoc.shrine || mLoc.temple);
        const localSign = sigTr[s.significance];
        if (!hasLabel || !inPrep || !localSign) return english;
        const localType = s.type === 'shrine' ? (mLoc.shrine || 'Shinto shrine') : (mLoc.temple || 'Buddhist temple');
        return `${localType} ${inPrep} ${s.location} — ${localSign}`;
      };
    } else if (source === 'figure') {
      pool = DATA.mythology.figures;
      kindLabel = 'figure';
      formatMeaning = (f) => _localizeMeaning(f.meaning);
    } else if (source === 'martial') {
      pool = DATA.martial.terms;
      kindLabel = 'martial';
      formatMeaning = (t) => _localizeMeaning(t.meaning);
    } else {
      throw new Error(`Unknown mythology source: ${source}`);
    }

    const items = pickN(pool, count);

    if (mode === 'standalone') {
      return items.map((item) => ({
        type: 'mythology',
        subkind: kindLabel,
        romaji: cap(item.romaji),
        hiragana: item.hiragana,
        kanji:   item.kanji,
        meaning: formatMeaning(item),
        tags:    item.tags || [kindLabel],
        source:  item,
      }));
    }

    // mode === 'with_given' : pair as a surname
    // Build the given-name pool, including vocabulary-as-names
    const gn = DATA.givenNames;
    const vocab = DATA.vocabNames.words;
    const vocabAsNames = vocab.filter(w => w.tags.includes('vocab')).map(w => ({
      romaji: w.romaji, kanji: w.kanji, hiragana: w.hiragana, meaning: w.meaning, tags: w.tags, _vocab: true,
    }));
    let givenPool = [];
    if (withGivenGender === 'male'   || withGivenGender === 'any') givenPool = givenPool.concat(gn.male);
    if (withGivenGender === 'female' || withGivenGender === 'any') givenPool = givenPool.concat(gn.female);
    if (withGivenGender === 'neutral' || withGivenGender === 'any') givenPool = givenPool.concat(gn.neutral);
    if (withGivenGender === 'any') givenPool = givenPool.concat(vocabAsNames);
    if (givenPool.length === 0) givenPool = [...gn.neutral];

    return items.map((item) => {
      const given = pick(givenPool);
      // All-or-nothing: formatMeaning(item) returns either the localized
      // figure description or the original English; _localizeCompoundMeaning
      // does the same for the given name's fragments. If either falls back
      // to English, the whole combined meaning falls back too — no mixing.
      const sep = _MEANING_AND[_pageLocale] || '+';
      const fLocal = formatMeaning(item);
      const gLocal = _localizeCompoundMeaning(given.meaning || '');
      const gnLabel = _GIVEN_NAME_LABEL[_pageLocale] || 'given name';
      // For the fallback, build the ORIGINAL English meaning from raw fields.
      // For shrine: use the hardcoded English template (item.meaning is undefined).
      // For figure/martial: use item.meaning directly.
      const englishFigureMeaning = (source === 'shrine')
        ? `Shinto shrine in ${item.location} — ${item.significance}`
        : item.meaning;
      // Was the figure meaning actually localized? fLocal === englishFigureMeaning
      // means we fell back to English (no localization possible).
      const fWasEnglish = (fLocal === englishFigureMeaning);
      const gWasEnglish = (gLocal === (given.meaning || ''));
      let meaning;
      if (!fWasEnglish && !gWasEnglish) {
        meaning = `${fLocal} ${sep} ${gnLabel} ${gLocal}`.trim();
      } else {
        // Fall back to the fully English form to avoid mid-sentence mixing
        const originalG = given.meaning || '';
        meaning = originalG
          ? `${englishFigureMeaning} ${sep} given name ${originalG}`.trim()
          : englishFigureMeaning;
      }
      return {
        type: 'mythology',
        subkind: kindLabel,
        romaji: `${cap(item.romaji)} ${cap(given.romaji)}`,
        hiragana: `${item.hiragana} ${given.hiragana}`,
        kanji: (item.kanji && given.kanji) ? `${item.kanji} ${given.kanji}` : null,
        meaning,
        tags: [...(item.tags || []), 'with-given'],
        source: item,
        given,
      };
    });
  };

  // =====================================================================
  //  Master entry: which generator to run
  // =====================================================================
  const generate = (kind, opts) => {
    switch (kind) {
      case 'animal':    return generateAnimal(opts);
      case 'fusion':    return generateFusion(opts);
      case 'irl':       return generateRealistic(opts);   // renamed from 'realistic'
      case 'realistic': return generateRealistic(opts);   // backwards-compat alias
      case 'mythology': return generateMythology(opts);   // merged shrine + figure + martial
      case 'shrine':    return generateShrine(opts);      // backwards-compat alias
      default:
        throw new Error(`Unknown generator kind: ${kind}`);
    }
  };

  // =====================================================================
  //  Saved names (localStorage)
  // =====================================================================
  const STORAGE_KEY = 'ghn_japanese_names_saved_v1';

  const getSaved = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch (_) { return []; }
  };

  const addSaved = (name) => {
    const cur = getSaved();
    // de-dupe by romaji
    if (cur.some(n => n.romaji === name.romaji)) return cur;
    cur.unshift({ ...name, savedAt: Date.now() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cur));
    return cur;
  };

  const removeSaved = (romaji) => {
    const cur = getSaved().filter(n => n.romaji !== romaji);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cur));
    return cur;
  };

  const clearSaved = () => {
    localStorage.removeItem(STORAGE_KEY);
    return [];
  };

  // =====================================================================
  //  Copy to clipboard helper
  // =====================================================================
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_) {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (e) { return false; }
      document.body.removeChild(ta);
      return true;
    }
  };

  // =====================================================================
  //  Data loader — call once before generate()
  // =====================================================================
  const setData = (partial) => {
    Object.assign(DATA, partial);
  };

  const loadDataFromUrls = async (baseUrl = './data/') => {
    // TIER 1: data needed immediately (first paint, Cute/IRL tab works on load).
    // Tiers 2+ are deferred until the corresponding tab is opened — this is
    // the main "25KB unused on initial load" win from PageSpeed.
    const tier1 = await Promise.all([
      fetch(baseUrl + 'animals-nature.json').then(r => r.json()),
      fetch(baseUrl + 'cool-words.json').then(r => r.json()),
      fetch(baseUrl + 'fusion-english.json').then(r => r.json()),
      fetch(baseUrl + 'fusion-spanish.json').then(r => r.json()).catch(() => null),
      fetch(baseUrl + 'fusion-french.json').then(r => r.json()).catch(() => null),
      fetch(baseUrl + 'fusion-portuguese.json').then(r => r.json()).catch(() => null),
      fetch(baseUrl + 'fusion-german.json').then(r => r.json()).catch(() => null),
      fetch(baseUrl + 'fusion-dutch.json').then(r => r.json()).catch(() => null),
      fetch(baseUrl + 'fusion-polish.json').then(r => r.json()).catch(() => null),
      fetch(baseUrl + 'given-names.json').then(r => r.json()),
      fetch(baseUrl + 'surnames.json').then(r => r.json()),
      fetch(baseUrl + 'vocabulary-names.json').then(r => r.json()),
    ]);
    setData({
      animalsNature: tier1[0],
      coolWords: tier1[1],
      fusionEnglish: tier1[2],
      fusionSpanish:   tier1[3],
      fusionFrench:    tier1[4],
      fusionPortuguese:tier1[5],
      fusionGerman:    tier1[6],
      fusionDutch:     tier1[7],
      fusionPolish:    tier1[8],
      givenNames: tier1[9],
      surnames: tier1[10],
      vocabNames: tier1[11],
    });
    return DATA;
  };

  // loadMythology: lazy-loads the mythology + martial + shrines + i18n data
  // only when the user actually clicks the Mythology tab. Saves ~170KB on
  // first paint (mythology.json ~16KB + martial.json ~12KB + shrines.json
  // ~16KB + mythology_i18n.json ~125KB = ~170KB).
  let _mythologyLoadingPromise = null;
  const loadMythology = async (baseUrl = './data/') => {
    if (DATA.mythology && DATA.martial && DATA.shrines && window.MYTHOLOGY_I18N) return DATA;
    if (_mythologyLoadingPromise) return _mythologyLoadingPromise;
    _mythologyLoadingPromise = Promise.all([
      fetch(baseUrl + 'mythology.json').then(r => r.json()),
      fetch(baseUrl + 'martial.json').then(r => r.json()),
      fetch(baseUrl + 'shrines.json').then(r => r.json()),
      fetch(baseUrl + 'mythology_i18n.min.json').then(r => r.json()),
    ]).then(([myth, mart, shr, i18n]) => {
      setData({ mythology: myth, martial: mart, shrines: shr });
      window.MYTHOLOGY_I18N = i18n;
      return DATA;
    });
    return _mythologyLoadingPromise;
  };

  // =====================================================================
  //  Public API
  // =====================================================================
  return {
    generate,
    generateAnimal,
    generateFusion,
    generateRealistic,
    generateShrine,
    generateMythology,
    getSaved,
    addSaved,
    removeSaved,
    clearSaved,
    copyToClipboard,
    loadDataFromUrls,
    loadMythology,
    setData,
    version: '1.0.2',
  };
})();

// Make available both as a module and on window for non-module pages
if (typeof window !== 'undefined') window.JapaneseNameGenerator = JapaneseNameGenerator;
if (typeof module !== 'undefined' && module.exports) module.exports = JapaneseNameGenerator;
