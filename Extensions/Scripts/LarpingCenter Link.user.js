// ==UserScript==
// @name         Onshape Learning Center button -> FRC Design
// @namespace    local.onshape.learningcenter
// @match        https://cad.onshape.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(() => {
  'use strict';

  const NEW_URL = 'https://frcdesign.org/';
  const OPEN_IN_NEW_TAB = true;     // the original opened a new window; false = same tab
  const LABEL = 'Go to Larping Center';       // tooltip text ('' to leave Onshape's tooltip alone)

  const SELECTOR = 'button.nav-invite[ng-click*="goToLearningCenter"]';

  // capture phase on the document: runs before Onshape's own click handler,
  // and keeps working even when Onshape re-renders the navbar
  document.addEventListener('click', (e) => {
    const btn = e.target.closest && e.target.closest(SELECTOR);
    if (!btn) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (OPEN_IN_NEW_TAB) window.open(NEW_URL, '_blank', 'noopener');
    else location.href = NEW_URL;
  }, true);

  // optional: replace the tooltip / accessibility text
  if (LABEL) {
    setInterval(() => {
      const btn = document.querySelector(SELECTOR);
      if (!btn || btn.dataset.osLabelFixed === LABEL) return;
      btn.setAttribute('aria-label', LABEL);
      btn.setAttribute('title', LABEL);
      btn.setAttribute('data-bs-original-title', LABEL);
      btn.dataset.osLabelFixed = LABEL;
    }, 500);
  }
})();
