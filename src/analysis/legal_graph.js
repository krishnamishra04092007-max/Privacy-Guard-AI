/**
 * src/analysis/legal_graph.js
 * In-memory Legal Knowledge Graph (LKG) for offline structural and relational mapping.
 * Organizes document terms into distinct cluster hubs with clean relational semantics.
 */

export class LegalKnowledgeGraph {
  constructor() {
    this.nodes = new Map();
    this.edges = [];
  }

  addNode(id, type, label, properties = {}) {
    if (!this.nodes.has(id)) {
      this.nodes.set(id, { id, type, label, properties });
    }
    return this.nodes.get(id);
  }

  addEdge(sourceId, targetId, relationship, weight = 1) {
    // Avoid duplicate edges
    const exists = this.edges.some(
      (e) => e.source === sourceId && e.target === targetId && e.relationship === relationship
    );
    if (!exists) {
      this.edges.push({ source: sourceId, target: targetId, relationship, weight });
    }
  }

  findHighRiskPaths() {
    const riskChains = [];

    for (const edge of this.edges) {
      if (edge.relationship === 'WAIVES' || edge.relationship === 'EXTINGUISHES') {
        const source = this.nodes.get(edge.source);
        const target = this.nodes.get(edge.target);
        if (source && target) {
          riskChains.push({
            type: 'CIVIL_RIGHTS_FORFEITURE',
            severity: 'HIGH',
            weight: edge.weight || 30,
            title: 'Forfeiture of Legal Redress',
            description: `${source.label} directly limits ${target.label}.`
          });
        }
      }

      if (edge.relationship === 'TRANSFERRED_TO' || edge.relationship === 'SOLD_TO') {
        const dataNode = this.nodes.get(edge.source);
        const targetNode = this.nodes.get(edge.target);
        if (dataNode && targetNode) {
          riskChains.push({
            type: 'THIRD_PARTY_DATA_DISTRIBUTION',
            severity: 'HIGH',
            weight: edge.weight || 25,
            title: 'Third-Party Data Flow',
            description: `[${dataNode.label}] connects to [${targetNode.label}].`
          });
        }
      }

      if (edge.relationship === 'CIRCUMVENTS') {
        const modNode = this.nodes.get(edge.source);
        const rightNode = this.nodes.get(edge.target);
        if (modNode && rightNode) {
          riskChains.push({
            type: 'UNILATERAL_CHANGE_OVERRIDE',
            severity: 'MEDIUM',
            weight: edge.weight || 15,
            title: 'Discretionary Policy Modification',
            description: `[${modNode.label}] bypasses [${rightNode.label}].`
          });
        }
      }
    }

    return riskChains;
  }
}

export function buildGraphFromText(text) {
  const graph = new LegalKnowledgeGraph();
  if (!text) return graph;

  const lowerText = text.toLowerCase();

  // Root Service Document Node
  graph.addNode('doc_root', 'DOC_ROOT', 'Terms & Policies');

  // 1. Ownership & Content Rights Cluster
  const claimsOwnership = lowerText.includes('you own') || lowerText.includes('you retain ownership');
  const claimsNoTraining = lowerText.includes('do not train') || lowerText.includes('not train models');
  const broadLicense = lowerText.includes('perpetual') || lowerText.includes('worldwide license') || lowerText.includes('royalty-free');

  if (claimsOwnership || broadLicense) {
    graph.addNode('user_ip', 'USER_RIGHT', 'User Code & Content Ownership');
    if (claimsOwnership) {
      graph.addNode('owner_guarantee', 'SAFE_TERM', 'Explicit Ownership Retention');
      graph.addEdge('doc_root', 'owner_guarantee', 'AFFIRMS');
      graph.addEdge('owner_guarantee', 'user_ip', 'PROTECTS');
    }
    if (claimsNoTraining) {
      graph.addNode('no_train', 'SAFE_TERM', 'No AI Model Training');
      graph.addEdge('owner_guarantee', 'no_train', 'GUARANTEES');
    }
    if (broadLicense && !claimsOwnership) {
      graph.addNode('clause_ip', 'CLAUSE', 'Broad Content License');
      graph.addEdge('clause_ip', 'user_ip', 'WAIVES', 20);
      graph.addEdge('doc_root', 'clause_ip', 'IMPOSES');
    }
  }

  // 2. Dispute Resolution & Litigation Cluster
  const hasArbitration = lowerText.includes('arbitration') || lowerText.includes('binding arbitration');
  const hasClassWaiver = lowerText.includes('class action') || lowerText.includes('jury trial');

  if (hasArbitration || hasClassWaiver) {
    graph.addNode('right_court', 'USER_RIGHT', 'Right to Jury & Class Action');
    const arbClauseId = 'clause_arb';
    graph.addNode(arbClauseId, 'CLAUSE', 'Mandatory Dispute Terms');
    graph.addEdge('doc_root', arbClauseId, 'CONTAINS');
    graph.addEdge(arbClauseId, 'right_court', 'WAIVES', 30);
  } else if (lowerText.includes('governing law') || lowerText.includes('jurisdiction')) {
    graph.addNode('gov_law', 'SAFE_TERM', 'Standard Governing Law');
    graph.addEdge('doc_root', 'gov_law', 'SPECIFIES');
  }

  // 3. Telemetry & Data Privacy Cluster
  const collectsData = lowerText.includes('telemetry') || lowerText.includes('analytics') || lowerText.includes('personal data') || lowerText.includes('cookies');
  const sharesWithBrokers = lowerText.includes('sell personal') || lowerText.includes('data broker') || (lowerText.includes('share') && lowerText.includes('third party advertisers'));
  const encryptsData = lowerText.includes('encrypted') || lowerText.includes('confidential information') || lowerText.includes('request export or deletion');

  if (collectsData || sharesWithBrokers || encryptsData) {
    graph.addNode('data_telemetry', 'DATA_TYPE', 'Usage & Telemetry Data');
    graph.addEdge('doc_root', 'data_telemetry', 'PROCESSES');

    if (encryptsData) {
      graph.addNode('data_confidential', 'SAFE_TERM', 'Confidentiality & Deletion Rights');
      graph.addEdge('data_telemetry', 'data_confidential', 'SECURED_BY');
    }

    if (sharesWithBrokers) {
      graph.addNode('entity_broker', 'THIRD_PARTY', 'Third-Party Ad Brokers');
      graph.addEdge('data_telemetry', 'entity_broker', 'TRANSFERRED_TO', 25);
    }
  }

  // 4. Financial & Renewal Mechanics Cluster
  const hasAutoRenew = lowerText.includes('renew until cancelled') || lowerText.includes('automatically renew');
  const canCancelAnytime = lowerText.includes('cancel at any time') || lowerText.includes('cancel anytime');
  const unilateralChanges = lowerText.includes('sole discretion') && lowerText.includes('without notice');

  if (hasAutoRenew) {
    if (canCancelAnytime) {
      graph.addNode('term_cancel', 'SAFE_TERM', 'Cancel Anytime Subscription');
      graph.addEdge('doc_root', 'term_cancel', 'OFFERS');
    } else {
      graph.addNode('clause_renewal', 'CLAUSE', 'Auto-Renewal Terms');
      graph.addEdge('doc_root', 'clause_renewal', 'IMPOSES');
    }
  }

  if (unilateralChanges) {
    graph.addNode('mod_clause', 'CLAUSE', 'Unilateral Contract Change');
    graph.addNode('user_notice', 'USER_RIGHT', 'Advance Written Notice');
    graph.addEdge('mod_clause', 'user_notice', 'CIRCUMVENTS', 15);
  }

  return graph;
}