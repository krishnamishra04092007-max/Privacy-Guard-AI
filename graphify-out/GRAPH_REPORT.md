# Graph Report - privacy-guard-ai  (2026-10-22)

## Corpus Check
- 13 files · ~4,755 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: .css 2, (none) 1)

## Summary
- 75 nodes · 76 edges · 12 communities (4 shown, 8 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- main.js
- package.json
- ui.js
- LegalKnowledgeGraph
- manifest.json
- scripts
- graph_viewer.js
- gemini.js
- analysis/prefilter.js

## God Nodes (most connected - your core abstractions)
1. `LegalKnowledgeGraph` - 6 edges
2. `buildGraphFromText()` - 5 edges
3. `scripts` - 4 edges
4. `background` - 3 edges
5. `action` - 2 edges
6. `side_panel` - 2 edges
7. `icons` - 2 edges
8. `@crxjs/vite-plugin` - 2 edges
9. `vite` - 2 edges
10. `analyzeLegalClausesWithGemini()` - 2 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (12 total, 8 thin omitted)

### Community 1 - "package.json"
Cohesion: 0.20
Nodes (9): devDependencies, @crxjs/vite-plugin, vite, name, private, type, version, @crxjs/vite-plugin (+1 more)

### Community 2 - "ui.js"
Cohesion: 0.12
Nodes (12): clauseList, gaugeFill, graphStats, graphSvg, loadingCard, loadingStatus, pageInfo, riskCount (+4 more)

### Community 4 - "manifest.json"
Cohesion: 0.12
Nodes (15): action, default_title, background, service_worker, type, description, host_permissions, icons (+7 more)

### Community 5 - "scripts"
Cohesion: 0.50
Nodes (4): scripts, build, dev, preview

## Knowledge Gaps
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `scripts` connect `scripts` to `package.json`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Should `ui.js` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._
- **Should `manifest.json` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._