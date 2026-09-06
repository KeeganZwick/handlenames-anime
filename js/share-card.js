/* =====================================================================
 *  Share Card Renderer
 *  Canvas-based image generator for sharing generated names.
 *  No backend — pure client-side canvas drawing.
 *
 *  Design:
 *   - 1200x630 (standard OG/Twitter card aspect)
 *   - Dark background matching the site
 *   - Subtle pink accent border
 *   - Kanji (or romaji) as the hero text
 *   - Romaji as subtitle
 *   - Hiragana as small detail
 *   - Meaning/tagline below
 *   - Watermark "anime.gethandlenames.com" at bottom
 * ===================================================================== */

const ShareCard = (() => {
  'use strict';

  // ----- Color palette (mirrors styles/generator.css) -----
  const COLORS = {
    bg:        '#0e1014',
    bgSoft:    '#181b22',
    border:    '#262a33',
    text:      '#e6e8ee',
    textMuted: '#8a92a1',
    textDim:   '#5d6470',
    accent:    '#f0a3ff',   // soft pink-purple, the site accent
    accent2:   '#7ad7ff',   // cyan
  };

  const W = 1200;
  const H = 630;

  // -----------------------------------------------------------------
  //  Wrap a string into a max-width string array (for canvas fillText)
  //  using a hidden canvas to measure text width.
  // -----------------------------------------------------------------
  const wrapText = (ctx, text, maxWidth) => {
    const out = [];
    const paragraphs = String(text || '').split('\n');
    for (const para of paragraphs) {
      // Soft word break for Latin chars, char break for CJK
      const tokens = para.match(/[\u3000-\u9fff\uf900-\ufaff]+|[^\s]+|\s+/g) || [para];
      let line = '';
      for (const tok of tokens) {
        const tentative = line + tok;
        if (ctx.measureText(tentative).width > maxWidth && line) {
          out.push(line.trim());
          line = tok.trimStart();
        } else {
          line = tentative;
        }
      }
      if (line.trim()) out.push(line.trim());
    }
    return out;
  };

  // -----------------------------------------------------------------
  //  Choose the hero text: prefer kanji, fall back to romaji.
  // -----------------------------------------------------------------
  const pickHero = (name) => {
    if (name.kanji && /\p{Script=Han}/u.test(name.kanji)) {
      return { text: name.kanji, kind: 'kanji' };
    }
    if (name.romaji) return { text: name.romaji.toUpperCase(), kind: 'romaji' };
    return { text: '???', kind: 'fallback' };
  };

  // -----------------------------------------------------------------
  //  Adjust font size until the hero text fits within maxWidth.
  // -----------------------------------------------------------------
  const fitFont = (ctx, text, family, weight, maxWidth, maxPx, minPx) => {
    let px = maxPx;
    while (px > minPx) {
      ctx.font = `${weight} ${px}px ${family}`;
      if (ctx.measureText(text).width <= maxWidth) return px;
      px -= 4;
    }
    ctx.font = `${weight} ${minPx}px ${family}`;
    return minPx;
  };

  // -----------------------------------------------------------------
  //  Draw a rounded-rect path
  // -----------------------------------------------------------------
  const roundRect = (ctx, x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  };

  // -----------------------------------------------------------------
  //  Main render: returns a HTMLCanvasElement
  // -----------------------------------------------------------------
  const render = (name, opts = {}) => {
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // ---- Background ----
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, COLORS.bg);
    grad.addColorStop(1, COLORS.bgSoft);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Subtle radial glow in top-right (accent)
    const radial = ctx.createRadialGradient(W * 0.85, H * 0.15, 0, W * 0.85, H * 0.15, 600);
    radial.addColorStop(0, 'rgba(240, 163, 255, 0.10)');
    radial.addColorStop(1, 'rgba(240, 163, 255, 0)');
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, W, H);

    // Subtle radial in bottom-left (cyan)
    const radial2 = ctx.createRadialGradient(W * 0.15, H * 0.85, 0, W * 0.15, H * 0.85, 500);
    radial2.addColorStop(0, 'rgba(122, 215, 255, 0.06)');
    radial2.addColorStop(1, 'rgba(122, 215, 255, 0)');
    ctx.fillStyle = radial2;
    ctx.fillRect(0, 0, W, H);

    // ---- Subtle accent border ----
    ctx.strokeStyle = COLORS.accent;
    ctx.globalAlpha = 0.15;
    ctx.lineWidth = 2;
    roundRect(ctx, 24, 24, W - 48, H - 48, 24);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // ---- Top label (small caps "ANIME NAME") ----
    ctx.fillStyle = COLORS.accent;
    ctx.font = '600 20px -apple-system, "Segoe UI", "Hiragino Sans", system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(window.SHARE_CARD_LABEL || 'ANIME HANDLE GENERATOR', 80, 70);

    // ---- Hero text (kanji or romaji) ----
    const hero = pickHero(name);
    const isKanji = hero.kind === 'kanji';
    const heroFontFamily = isKanji
      ? '"Hiragino Mincho ProN", "Yu Mincho", "YuMincho", "MS Mincho", "Hiragino Sans", serif'
      : '-apple-system, "Segoe UI", system-ui, sans-serif';

    // Layout: hero at y=210, romaji at y=400, hiragana at y=450, meaning at y=510, watermark at y=580
    // Romaji/meaning pushed down to clear the kanji (max ~220px tall, centered at y=210 → extends to ~y=320)
    const heroPx = fitFont(ctx, hero.text, heroFontFamily, '700', W - 240, 220, 60);
    ctx.font = `700 ${heroPx}px ${heroFontFamily}`;
    ctx.fillStyle = COLORS.text;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Drop shadow on hero
    ctx.shadowColor = 'rgba(240, 163, 255, 0.4)';
    ctx.shadowBlur = 30;
    ctx.fillText(hero.text, W / 2, 210);
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';

    // ---- Romaji (subtitle, ALWAYS shown if present) ----
    if (name.romaji && !(isKanji && !name.kanji && hero.text === name.romaji.toUpperCase())) {
      ctx.font = '500 48px -apple-system, "Segoe UI", "Hiragino Sans", system-ui, sans-serif';
      ctx.fillStyle = COLORS.accent;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(name.romaji, W / 2, 400);
    }

    // ---- Hiragana (smaller, only if present) ----
    if (name.hiragana && !(isKanji && hero.text === name.kanji && name.hiragana === name.kanji)) {
      ctx.font = '400 28px -apple-system, "Hiragino Sans", "Yu Gothic", system-ui, sans-serif';
      ctx.fillStyle = COLORS.textMuted;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(name.hiragana, W / 2, 450);
    }

    // ---- Divider line ----
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 60, 480);
    ctx.lineTo(W / 2 + 60, 480);
    ctx.stroke();

    // ---- Meaning (small tagline) ----
    if (name.meaning) {
      ctx.font = '400 20px -apple-system, "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = COLORS.textDim;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const lines = wrapText(ctx, name.meaning, W - 320);
      const lineH = 28;
      const startY = 510;
      lines.slice(0, 2).forEach((line, i) => {
        ctx.fillText(line, W / 2, startY + i * lineH);
      });
    }

    // ---- Watermark (bottom) ----
    ctx.font = '500 18px -apple-system, "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = COLORS.textMuted;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    ctx.fillText(window.SHARE_CARD_WATERMARK || 'anime.gethandlenames.com  \u00b7  anime handle generator', W / 2, H - 48);

    return canvas;
  };

  // -----------------------------------------------------------------
  //  Download the canvas as a PNG
  // -----------------------------------------------------------------
  const download = (canvas, filename) => {
    const name = filename || `anime-name-${Date.now()}.png`;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, 'image/png');
  };

  // -----------------------------------------------------------------
  //  Native share (Web Share API) or fallback to copy/download
  // -----------------------------------------------------------------
  const nativeShare = async (canvas, name) => {
    // Try the Web Share API with files (mobile-friendly)
    try {
      if (navigator.canShare && navigator.share) {
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
        if (!blob) throw new Error('canvas.toBlob failed');
        const file = new File([blob], `anime-name.png`, { type: 'image/png' });
        // Short share caption: "Tengu 天狗 — check out anime.gethandlenames.com/anime-names"
        // Romaji comes first, then kanji if present, then a fixed CTA + URL.
        const titleStr = name.kanji
          ? `${name.romaji} ${name.kanji}`
          : name.romaji;
        const captionTpl = window.SHARE_CARD_CAPTION || '${name.romaji} \u2014 check out anime.gethandlenames.com/anime-names';
        const textStr = name.kanji
          ? captionTpl.replace('${name.romaji}', `${name.romaji} ${name.kanji}`)
          : captionTpl.replace('${name.romaji}', name.romaji);
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: titleStr,
            text: textStr,
          });
          return { shared: true, method: 'native-files' };
        }
        // No file share support, but can share text
        await navigator.share({
          title: titleStr,
          text: textStr,
        });
        return { shared: true, method: 'native-text' };
      }
    } catch (e) {
      // User cancelled or API error — fall through to copy/download
      if (e && e.name === 'AbortError') return { shared: false, cancelled: true };
    }
    return { shared: false, method: null };
  };

  // -----------------------------------------------------------------
  //  Returns true if the browser supports the Web Share API with file
  //  attachments. The check has to be async because the underlying
  //  navigator.canShare({ files }) call requires a real File object,
  //  which we create from a tiny throwaway PNG via canvas.
  //
  //  We return a Promise<boolean> because the test itself is async.
  //  Used by the share-button click handler to decide whether to go
  //  straight to the native share sheet or open the fallback modal.
  // -----------------------------------------------------------------
  const supportsNativeFileShare = async () => {
    try {
      if (typeof navigator === 'undefined' || !navigator.share || !navigator.canShare) {
        return false;
      }
      // Build a 1x1 PNG file to test the file-share capability
      const tiny = document.createElement('canvas');
      tiny.width = 1; tiny.height = 1;
      const tctx = tiny.getContext('2d');
      tctx.fillStyle = '#000'; tctx.fillRect(0, 0, 1, 1);
      const blob = await new Promise((resolve) => tiny.toBlob(resolve, 'image/png'));
      if (!blob) return false;
      const file = new File([blob], 'test.png', { type: 'image/png' });
      return navigator.canShare({ files: [file] });
    } catch (_) {
      return false;
    }
  };

  // -----------------------------------------------------------------
  //  Copy the canvas to clipboard (PNG)
  // -----------------------------------------------------------------
  const copyToClipboard = async (canvas) => {
    try {
      if (!navigator.clipboard || !window.ClipboardItem) {
        return { copied: false, reason: 'no-clipboard-api' };
      }
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) return { copied: false, reason: 'toBlob-failed' };
      const item = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([item]);
      return { copied: true };
    } catch (e) {
      return { copied: false, reason: e.message || 'unknown' };
    }
  };

  // Public API
  return {
    render,
    download,
    nativeShare,
    copyToClipboard,
    supportsNativeFileShare,
    W,
    H,
  };
})();

if (typeof window !== 'undefined') window.ShareCard = ShareCard;
if (typeof module !== 'undefined' && module.exports) module.exports = ShareCard;
