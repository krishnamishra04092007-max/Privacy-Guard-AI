/**
 * Scrapes legal document text from active DOM trees, stripping clutter nodes.
 * Latency budget: <= 50ms.
 */
export function extractLegalDocument() {
  const t0 = performance.now();
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

  // Select target root or fall back to document body
  let root = selectors
    .map((s) => document.querySelector(s))
    .find((el) => el && el.innerText && el.innerText.length > 400) || document.body;

  const clone = root.cloneNode(true);

  // Prune noise, scripts, styling, forms, and navigation
  clone.querySelectorAll(
    'script, style, nav, footer, header, iframe, button, svg, form, [aria-hidden="true"], noscript'
  ).forEach((node) => node.remove());

  const cleanText = (clone.innerText || '')
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, 40000); // 40,000 char safety limit

  const latency = (performance.now() - t0).toFixed(2);
  console.log(`[Privacy Guard AI] Scraped ${cleanText.length} chars in ${latency}ms`);

  return {
    text: cleanText,
    url: window.location.href,
    title: document.title,
    scrapeDurationMs: latency
  };
}