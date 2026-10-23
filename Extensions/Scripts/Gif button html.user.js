// ==UserScript==
// @name         Onshape GIF popup button
// @namespace    local.onshape.gifpopup
// @match        https://cad.onshape.com/*
// @grant        GM_xmlhttpRequest
// @connect      raw.githubusercontent.com
// @run-at       document-idle
// ==/UserScript==

(() => {
  'use strict';

  const GIF_URL = 'https://raw.githubusercontent.com/BZRocket/OffshapeStuff/refs/heads/main/Offshape.gif'; // same link as in Stylus
  const GAP_RIGHT = 8;   // documents page: px between Create and the icon
  const GAP_BELOW = 6;   // editor: px between the toolbar's last icon and the button

  // ---- read the GIF's width/height from its header (bytes 6-9) ----
  let gifSize = null;
  GM_xmlhttpRequest({
    method: 'GET',
    url: GIF_URL,
    responseType: 'arraybuffer',
    onload: (res) => {
      try {
        const dv = new DataView(res.response);
        const w = dv.getUint16(6, true);
        const h = dv.getUint16(8, true);
        if (w && h) gifSize = { w, h };
      } catch (e) { console.warn('[osgif] could not read GIF size', e); }
    },
    onerror: () => console.warn('[osgif] could not download GIF to read its size'),
  });

  const btn = document.createElement('button');
  btn.id = 'osgif-btn';
  btn.style.display = 'block';
  btn.style.visibility = 'hidden';
  document.body.appendChild(btn);

  const inEditor = () => /^\/documents\/[0-9a-f]{10,}/i.test(location.pathname);

  // ---- documents page: next to the purple Create button ----
  let createEl = null;

  function visibleBox(el) {
    for (let e = el; e && e !== document.body; e = e.parentElement) {
      const bg = getComputedStyle(e).backgroundColor;
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
        const r = e.getBoundingClientRect();
        if (r.width > 60 && r.width < 300 && r.height < 70) return e;
      }
    }
    return el;
  }

  function findCreate() {
    for (const el of document.querySelectorAll('button, [role="button"], a, span, div')) {
      if (el.childElementCount > 3 || el.textContent.trim() !== 'Create') continue;
      const r = el.getBoundingClientRect();
      if (r.width && r.left < 300 && r.top > 30 && r.top < 300) return visibleBox(el);
    }
    return null;
  }

  function placeByCreate() {
    if (!createEl || !createEl.isConnected) createEl = findCreate();
    if (!createEl) return false;
    createEl.classList.add('osgif-create'); // Stylus shifts it left
    const r = createEl.getBoundingClientRect();
    if (!r.width) return false;
    btn.style.left = Math.round(r.right + GAP_RIGHT) + 'px';
    btn.style.top = Math.round(r.top + r.height / 2 - btn.offsetHeight / 2) + 'px';
    return true;
  }

  // ---- editor: under the last icon of the left toolbar ----
  // climb from an element to the outermost ancestor shaped like a toolbar tile
  function tileFrom(el) {
    let best = null;
    for (let e = el; e && e !== document.body; e = e.parentElement) {
      const r = e.getBoundingClientRect();
      if (r.left < 12 && r.width >= 28 && r.width <= 64 && r.height >= 24 && r.height <= 56) best = r;
    }
    return best;
  }

  function findLastToolbarTile() {
    // 1) an element labelled "Action items", if Onshape exposes one
    const labelled = document.querySelector(
      '[aria-label*="action items" i], [title*="action items" i], [data-tooltip*="action items" i]');
    const t = labelled && tileFrom(labelled);
    if (t) return t;

    // 2) otherwise scan down the toolbar column and take the lowest tile
    let bottom = null, y = 45, misses = 0;
    const x = 18;
    while (y < window.innerHeight - 10 && misses < 4) {
      const hit = document.elementFromPoint(x, y);
      const tile = hit && hit !== btn ? tileFrom(hit) : null;
      if (tile) {
        if (!bottom || tile.bottom > bottom.bottom) bottom = tile;
        y = tile.bottom + 2;
        misses = 0;
      } else {
        y += 8;
        misses++;
      }
    }
    return bottom;
  }

  function placeByToolbar() {
    const tile = findLastToolbarTile();
    if (!tile) return false;
    btn.style.left = Math.round(tile.left + (tile.width - btn.offsetWidth) / 2) + 'px';
    btn.style.top = Math.round(tile.bottom + GAP_BELOW) + 'px';
    return true;
  }

  function update() {
    // popup open: the backdrop covers the page, so leave the button where it is
    if (document.getElementById('osgif-backdrop')) return;
    const ok = inEditor() ? placeByToolbar() : placeByCreate();
    btn.style.visibility = ok ? 'visible' : 'hidden';
  }
  setInterval(update, 400);
  window.addEventListener('resize', update);
  update();

  // ---- popup ----
  function closePopup() {
    const el = document.getElementById('osgif-backdrop');
    if (el) el.remove();
    document.removeEventListener('keydown', onKey, true);
  }
  function onKey(e) { if (e.key === 'Escape') closePopup(); }

  function openPopup() {
    if (document.getElementById('osgif-backdrop')) return;
    const backdrop = document.createElement('div');
    backdrop.id = 'osgif-backdrop';
    const panel = document.createElement('div');
    panel.id = 'osgif-panel';

    if (gifSize) {
      const ratio = gifSize.w / gifSize.h;
      panel.style.aspectRatio = `${gifSize.w} / ${gifSize.h}`;
      panel.style.width = `min(90vw, calc(90vh * ${ratio}))`;
    } else {
      panel.style.width = '90vw';
      panel.style.height = '90vh';
      panel.style.backgroundSize = 'contain';
    }

    backdrop.appendChild(panel);
    backdrop.addEventListener('mousedown', (e) => { if (e.target === backdrop) closePopup(); });
    document.body.appendChild(backdrop);
    document.addEventListener('keydown', onKey, true);
  }

  btn.addEventListener('click', openPopup);
})();