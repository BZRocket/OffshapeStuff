// ==UserScript==
// @name         Onshape text tweaks
// @match        https://cad.onshape.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const replacements = [
    {
      selector: 'osx-document-filter-item[icon="explore-onshape-circle"] .document-filter-item > span',
      text: 'Explore Offshape',
    },
    {
    selector: 'osx-subscription-info.sidebar-subscription-info .os-plan-name',
    text: 'Larper',
    },
    {
    selector: 'osx-footer .os-footer-rights-link > a',
    text: '© 2026, DDS, Inc.',
    },
    // add more { selector, text } pairs here
  ];

  let queued = false;
  function apply() {
    queued = false;
    for (const { selector, text } of replacements) {
      document.querySelectorAll(selector).forEach((el) => {
        if (el.textContent !== text) el.textContent = text;
      });
    }
  }

  apply();
  new MutationObserver(() => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(apply);
    }
  }).observe(document.body, { childList: true, subtree: true });
})();