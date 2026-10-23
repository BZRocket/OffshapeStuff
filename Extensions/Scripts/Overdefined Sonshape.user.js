// ==UserScript==
// @name         Onshape Overdefined Alert
// @namespace    offshape
// @version      1.0
// @description  Plays a sound and pops up an image when a sketch becomes overdefined
// @match        https://cad.onshape.com/*
// @run-at       document-idle
// @noframes
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @connect      raw.githubusercontent.com
// @connect      github.com
// ==/UserScript==

(function () {
  'use strict';

  const IMG_URL = 'https://raw.githubusercontent.com/BZRocket/OffshapeStuff/refs/heads/main/Sonshape.gif';
  const SND_URL = 'https://raw.githubusercontent.com/BZRocket/OffshapeStuff/refs/heads/main/fahhh.mp3';

  // Text Onshape shows when a sketch is overdefined (matched case-insensitively)
  const PATTERN = /sketch could not be solved|over[-\s]?(defined|constrained)/i;

  const DEBUG = false;        // true = log what the script matched to the console
  const COOLDOWN_MS = 2000;   // minimum time between triggers
  const SCAN_DELAY_MS = 250;  // throttle for DOM scans
  const POPUP_ID = 'osk-overdefined-popup';

  let imgDataUrl = null;
  let audioBuf = null;
  let ctx = null;

  // Userscript-privileged fetch, so the page's CSP can't block the assets
  function fetchAsset(url, type) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: 'GET',
        url,
        responseType: type,
        onload: (r) => (r.status >= 200 && r.status < 300)
          ? resolve(r.response)
          : reject(new Error('HTTP ' + r.status + ' for ' + url)),
        onerror: reject,
      });
    });
  }

  async function preload() {
    try {
      const blob = await fetchAsset(IMG_URL, 'blob');
      imgDataUrl = await new Promise((res, rej) => {
        const fr = new FileReader();
        fr.onload = () => res(fr.result);
        fr.onerror = rej;
        fr.readAsDataURL(blob);
      });
    } catch (e) {
      console.warn('[Overdefined Alert] image load failed', e);
    }
    try {
      const ab = await fetchAsset(SND_URL, 'arraybuffer');
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioBuf = await ctx.decodeAudioData(ab);
    } catch (e) {
      console.warn('[Overdefined Alert] sound load failed', e);
    }
  }

  // Make sure audio is allowed to start after the first click/keypress
  function unlockAudio() {
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }
  ['pointerdown', 'keydown'].forEach((evt) =>
    window.addEventListener(evt, unlockAudio, { capture: true }));

  function playSound() {
    if (!ctx || !audioBuf) return 0;
    if (ctx.state === 'suspended') ctx.resume();
    const src = ctx.createBufferSource();
    src.buffer = audioBuf;
    src.connect(ctx.destination);
    src.start();
    return audioBuf.duration * 1000;
  }

  function showPopup(soundMs) {
    const old = document.getElementById(POPUP_ID);
    if (old) old.remove();

    const wrap = document.createElement('div');
    wrap.id = POPUP_ID;
    wrap.style.cssText =
      'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;' +
      'z-index:2147483647;pointer-events:none;opacity:0;transition:opacity .15s ease;';

    const img = document.createElement('img');
    img.src = imgDataUrl || IMG_URL; // falls back to direct URL if the preload failed
    img.style.cssText =
      'max-width:60vw;max-height:60vh;filter:drop-shadow(0 8px 24px rgba(0,0,0,.5));';

    wrap.appendChild(img);
    document.body.appendChild(wrap);
    requestAnimationFrame(() => { wrap.style.opacity = '1'; });

    setTimeout(() => {
      wrap.style.opacity = '0';
      setTimeout(() => wrap.remove(), 200);
    }, Math.max(soundMs, 1500));
  }

  let lastFire = 0;
  function trigger() {
    lastFire = Date.now();
    showPopup(playSound());
  }

  function isVisible(el) {
    return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
  }

  // Returns the matching text if an "overdefined" message is currently visible
  function findOverdefinedText() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => PATTERN.test(n.nodeValue)
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT,
    });
    let node;
    while ((node = walker.nextNode())) {
      const el = node.parentElement;
      if (!el || el.closest('#' + POPUP_ID + ', script, style')) continue;
      if (isVisible(el)) return node.nodeValue.trim().slice(0, 100);
    }
    return null;
  }

  // Fire only on the transition "not overdefined" -> "overdefined"
  let active = false;
  let timer = null;
  function scan() {
    timer = null;
    const hit = findOverdefinedText();
    if (hit) {
      if (!active) {
        active = true;
        if (DEBUG) console.log('[Overdefined Alert] matched:', hit);
        if (Date.now() - lastFire > COOLDOWN_MS) trigger();
      }
    } else {
      active = false;
    }
  }

  new MutationObserver(() => {
    if (!timer) timer = setTimeout(scan, SCAN_DELAY_MS);
  }).observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['class', 'hidden'],
  });

  // Lets you test the sound + image without needing to overdefine anything
  if (typeof GM_registerMenuCommand === 'function') {
    GM_registerMenuCommand('Test overdefined popup', trigger);
  }

  preload();
})();