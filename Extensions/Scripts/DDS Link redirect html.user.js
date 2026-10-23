// ==UserScript==
// @name         Onshape footer link redirect
// @namespace    local.onshape.footerlink
// @match        https://cad.onshape.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(() => {
  'use strict';

  const NEW_URL = 'https://discord.gg/rS5ZHtTKfp';   // <- where the link should go
  const OPEN_IN_NEW_TAB = false;           // true = open in a new tab

  function fix() {
    for (const a of document.querySelectorAll('a')) {
      if (!a.textContent.includes('DDS, Inc.')) continue;
      if (a.dataset.osLinkFixed === NEW_URL) continue;

      a.href = NEW_URL;
      a.target = OPEN_IN_NEW_TAB ? '_blank' : '_self';
      a.rel = 'noopener';
      a.dataset.osLinkFixed = NEW_URL;

      // capture phase, so Onshape's own click handling can't send you to the old address
      a.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (OPEN_IN_NEW_TAB) window.open(NEW_URL, '_blank', 'noopener');
        else location.href = NEW_URL;
      }, true);
    }
  }

  setInterval(fix, 500);   // Onshape re-renders the footer, so keep re-applying
  fix();
})();