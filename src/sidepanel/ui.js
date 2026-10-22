import { renderLegalGraph } from './graph_viewer.js';
import { analyzeLegalClausesWithGemini } from '../analysis/gemini.js';
import { buildGraphFromText } from '../analysis/legal_graph.js';
import { calculateSafetyScore } from '../analysis/scoring.js';

// DOM Elements
const scanBtn = document.getElementById('scan-btn');
const pageInfo = document.getElementById('page-info');
const scoreVal = document.getElementById('score-val');
const riskRating = document.getElementById('risk-rating');
const scoreSummary = document.getElementById('score-summary');
const gaugeFill = document.getElementById('gauge-fill');
const clauseList = document.getElementById('clause-list');
const riskCount = document.getElementById('risk-count');
const graphStats = document.getElementById('graph-stats');
const graphSvg = document.getElementById('graph-svg');
const loadingCard = document.getElementById('loading-card');
const loadingStatus = document.getElementById('loading-status');

function updateGauge(score, rating, summary) {
  scoreVal.textContent = score;
  const circumference = 2 * Math.PI * 42; // ~264
  const offset = circumference - (score / 100) * circumference;
  gaugeFill.style.strokeDashoffset = offset;

  if (score >= 80) {
    gaugeFill.style.stroke = 'var(--risk-low)';
    riskRating.style.background = 'rgba(16, 185, 129, 0.2)';
    riskRating.style.color = 'var(--risk-low)';
  } else if (score >= 50) {
    gaugeFill.style.stroke = 'var(--risk-med)';
    riskRating.style.background = 'rgba(245, 158, 11, 0.2)';
    riskRating.style.color = 'var(--risk-med)';
  } else {
    gaugeFill.style.stroke = 'var(--risk-high)';
    riskRating.style.background = 'rgba(239, 68, 68, 0.2)';
    riskRating.style.color = 'var(--risk-high)';
  }

  riskRating.textContent = rating;
  scoreSummary.textContent = summary;
}

function renderClauses(clauses) {
  if (!clauses || clauses.length === 0) {
    clauseList.innerHTML = `
      <div class="empty-state" style="color: #10b981; font-weight: 500;">
        ✓ No predatory clauses identified.<br/>
        <span style="color: #94a3b8; font-size: 11px;">Terms respect user content ownership and lack forced arbitration or dark-pattern billing.</span>
      </div>`;
    riskCount.textContent = '0 Detected';
    return;
  }

  riskCount.textContent = `${clauses.length} Detected`;
  clauseList.innerHTML = clauses
    .map((c) => {
      const isHigh = c.risk_level === 'HIGH';
      return `
      <div class="clause-item ${isHigh ? 'high' : 'medium'}">
        <div class="clause-header">
          <span class="clause-category">${c.category || 'Legal Term'}</span>
          <span class="clause-badge ${isHigh ? 'high' : 'medium'}">${c.risk_level}</span>
        </div>
        <div class="clause-explanation">${c.explanation}</div>
        ${c.quote ? `<div class="clause-quote">"${c.quote}"</div>` : ''}
      </div>
    `;
    })
    .join('');
}

// In-page text scraper function (executed inside active tab)
function inPageExtractor() {
  const t0 = performance.now();
  let text = '';

  const selectors = [
    'main',
    'article',
    '[role="main"]',
    '#main-content',
    '.terms-content',
    '#privacy-policy',
    '.legal-doc',
    '.policy-body',
    '#terms-and-conditions',
    '.terms-body',
    '.privacy-content'
  ];

  let root = null;
  for (const s of selectors) {
    const el = document.querySelector(s);
    if (el && el.innerText && el.innerText.length > 200) {
      root = el;
      break;
    }
  }

  if (!root) {
    root = document.body;
  }

  if (root) {
    const clone = root.cloneNode(true);
    clone.querySelectorAll(
      'script, style, nav, footer, header, iframe, button, svg, form, [aria-hidden="true"], noscript'
    ).forEach((node) => node.remove());

    text = (clone.innerText || '')
      .replace(/\r\n/g, '\n')
      .replace(/\t/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  if (!text || text.length < 50) {
    text = (document.body ? document.body.innerText : '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  return {
    text: text.slice(0, 45000),
    url: window.location.href,
    title: document.title,
    scrapeDurationMs: (performance.now() - t0).toFixed(2)
  };
}

async function handleScan() {
  console.log('[Privacy Guard AI] Scan initiated');

  try {
    const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    let tab = tabs && tabs.length > 0 ? tabs[0] : null;

    if (!tab) {
      const fallbackTabs = await chrome.tabs.query({ active: true });
      tab = fallbackTabs && fallbackTabs.length > 0 ? fallbackTabs[0] : null;
    }

    if (!tab || !tab.id) {
      alert('Could not detect an active tab. Please click on the webpage tab and try again.');
      return;
    }

    if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      alert('Cannot scan internal Chrome pages (chrome://). Please navigate to a standard website (such as Terms of Service or Privacy Policy) and click Scan.');
      return;
    }

    scanBtn.disabled = true;
    scanBtn.innerHTML = '<span class="btn-icon">⏳</span> Auditing Page...';
    loadingCard.classList.remove('hidden');
    loadingStatus.textContent = 'Extracting legal text...';

    try {
      pageInfo.textContent = new URL(tab.url).hostname;
    } catch {
      pageInfo.textContent = tab.title || 'Active Tab';
    }

    // 1. Scrape text from webpage
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: inPageExtractor
    });

    if (!results || !results[0] || !results[0].result || !results[0].result.text) {
      throw new Error('No readable text could be extracted from this webpage.');
    }

    const { text } = results[0].result;
    console.log(`[Privacy Guard AI] Extracted ${text.length} characters`);

    // 2. Construct Legal Knowledge Graph
    loadingStatus.textContent = 'Building Legal Knowledge Graph...';
    const legalGraph = buildGraphFromText(text);
    graphStats.textContent = `${legalGraph.nodes.size} nodes`;
    renderLegalGraph(
      graphSvg,
      Array.from(legalGraph.nodes.values()),
      legalGraph.edges
    );

    // 3. Audit directly with Gemini API
    loadingStatus.textContent = 'Auditing clauses with Gemini AI...';
    const geminiResult = await analyzeLegalClausesWithGemini(text);

    if (geminiResult && geminiResult.clauses && geminiResult.clauses.length > 0) {
      renderClauses(geminiResult.clauses);
      const scoreData = calculateSafetyScore(geminiResult.clauses);
      updateGauge(scoreData.score, scoreData.rating, scoreData.summary);
    } else {
      renderClauses([]);
      const scoreData = calculateSafetyScore([]);
      updateGauge(scoreData.score, scoreData.rating, scoreData.summary);
    }
  } catch (err) {
    console.error('[Privacy Guard AI] Scan error:', err);
    alert(`Audit could not complete: ${err.message}`);
  } finally {
    loadingCard.classList.add('hidden');
    scanBtn.disabled = false;
    scanBtn.innerHTML = '<span class="btn-icon">⚡</span> Scan Active Page';
  }
}

if (scanBtn) {
  scanBtn.addEventListener('click', handleScan);
}