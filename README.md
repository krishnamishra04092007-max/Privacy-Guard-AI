# Privacy Guard AI 🛡️

> **Zero-Leakage Intelligent Legal Terms & Privacy Auditor**  
> Built as a Chrome Extension (Manifest V3 Side Panel) powered by **Google Gemini AI** and **Graphify AST Knowledge Graphs**.

---

## 📌 Overview

Most internet users click **"I Agree to the Terms & Conditions"** without reading them—a task estimated by researchers to require **over 244 hours annually**. As a result, digital platforms routinely bury predatory terms deep inside legal documents (forced binding arbitration, class-action waivers, telemetry data sales, perpetual content licensing, and unexpected recurring subscriptions).

**Privacy Guard AI** audits legal documents instantly within Google Chrome. It scrapes the active tab's legal text, constructs a structural **Legal Knowledge Graph (LKG)** using Graphify's AST engine, and queries **Google Gemini AI** with legal rigor to evaluate real consumer risks.

---

## ✨ Features

- **⚡ Sub-50ms DOM Traversal:** Intelligently extracts readable contract text from active pages while stripping noise, ads, navigations, and styling.
- **🕸️ Legal Knowledge Graph (Graphify Engine):** Visualizes structural relationships (`PROTECTS`, `WAIVES`, `TRANSFERRED_TO`, `CIRCUMVENTS`) between contract clauses and user rights directly on an interactive SVG canvas.
- **🎯 Calibrated Zero-Shot Red-Flag Matrix:** Classifies predatory terms into:
  - 🔴 **Civil Litigation Waivers** (forced arbitration, jury & class action waivers)
  - 🔴 **Aggressive Data Monetization** (selling telemetry, biometrics, or broker transfers)
  - 🔴 **Perpetual IP Claims** (worldwide irrevocable royalty-free licenses to user content)
  - 🟡 **Surprise Financial Mechanics** (deceptive renewals, unilateral price adjustments)
- **⚖️ False-Positive Protection:** Strictly distinguishes between predatory terms and benign developer-friendly agreements (e.g. cancel-anytime subscriptions, user content ownership guarantees, and routine liability caps).
- **📊 Dynamic Safety Score ($1\text{--}100$):** Weighted penalty calculator outputting an objective, clear rating with an animated radial gauge dial.

---

## 🏗️ Technical Architecture

```
privacy-guard-ai/
├── manifest.json                  # Manifest V3 (Side Panel API & Scripting)
├── .env                           # Environment variables (VITE_GEMINI_API_KEY)
├── .env.example                   # Template environment variables
├── .gitignore                     # Ignores .env, node_modules, dist
├── vite.config.js                 # Bundler config (@crxjs/vite-plugin)
├── graphify-out/
│   └── graph.json                 # Graphify codebase AST knowledge graph
├── src/
│   ├── background/
│   │   └── background.js          # Service worker for Side Panel lifecycle
│   ├── sidepanel/
│   │   ├── sidepanel.html         # Side panel UI layout
│   │   ├── sidepanel.css          # Dark-mode responsive styling
│   │   ├── ui.js                  # Controller & analysis orchestrator
│   │   └── graph_viewer.js        # Interactive SVG Legal Knowledge Graph visualizer
│   └── analysis/
│       ├── gemini.js              # Resilient Gemini API client with fallback models
│       ├── legal_graph.js         # In-memory Legal AST Property Graph builder
│       └── prefilter.js           # Deterministic regex heuristic pre-filter
```

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- Google Chrome (or Chromium-based browser)

### 2. Installation & Setup
Clone or navigate to the directory:
```bash
cd privacy-guard-ai
npm install
```

Configure your Gemini API key in `.env`:
```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Build the Extension
```bash
npm run build
```
The compiled extension will be generated in `privacy-guard-ai/dist/`.

---

## 🧩 Loading into Chrome

1. Open Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked** and select the folder:
   ```
   privacy-guard-ai/dist
   ```
4. Navigate to any terms page (e.g., [Graphify Terms](https://graphify.com/terms), [Google Terms of Service](https://policies.google.com/terms), YouTube, etc.).
5. Click the **Privacy Guard AI** extension icon to open the Side Panel, then click **"Scan Active Page"**.

---

## 🔒 Privacy & Safety Guarantee

- Scrapes text strictly on-demand when the user clicks **"Scan Active Page"**.
- Does not monitor background browsing activity or retain telemetry history.
- API keys are secured via `.env` and kept out of version control.
