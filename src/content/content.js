/*
 * content.js
 * Content script running in page context.
 */

function extractDocument() {
  const selectors = [
    'main',
    'article',
    '[role="main"]',
    '.terms-content',
    '#privacy-policy',
    '.legal-doc',
    '.policy-body',
    '#terms-and-conditions',
    '.terms-body',
    '.privacy-content'
  ];

  let root = selectors
    .map(function(s) { return document.querySelector(s); })
    .find(function(el) { return el && el.innerText && el.innerText.length > 300; }) || document.body;

  const clone = root.cloneNode(true);

  clone.querySelectorAll(
    'script, style, nav, footer, header, iframe, button, svg, form, [aria-hidden="true"], noscript'
  ).forEach(function(node) { node.remove(); });

  const cleanText = (clone.innerText || '')
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, 40000);

  return {
    text: cleanText,
    url: window.location.href,
    title: document.title
  };
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'EXTRACT_PAGE_TEXT') {
    try {
      const data = extractDocument();
      sendResponse({ success: true, ...data });
    } catch (err) {
      sendResponse({ success: false, error: err.message });
    }
  }
  return true;
});