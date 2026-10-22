/**
 * Renders an interactive SVG topological view of Legal AST nodes and relationships.
 * Features distinct colors for safe terms, user rights, clauses, and data types with tooltips.
 */

export function renderLegalGraph(svgElement, nodes, edges) {
  if (!svgElement) return;

  svgElement.innerHTML = '';

  if (!nodes || nodes.length === 0) {
    const textNode = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textNode.setAttribute('x', '50%');
    textNode.setAttribute('y', '50%');
    textNode.setAttribute('dominant-baseline', 'middle');
    textNode.setAttribute('text-anchor', 'middle');
    textNode.setAttribute('fill', '#64748b');
    textNode.setAttribute('font-size', '11');
    textNode.textContent = 'No structural nodes detected';
    svgElement.appendChild(textNode);
    return;
  }

  const width = svgElement.clientWidth || 300;
  const height = svgElement.clientHeight || 220;
  const centerX = width / 2;
  const centerY = height / 2;

  // Position nodes with center root or circular orbits
  const nodePositions = new Map();
  const rootNode = nodes.find((n) => n.id === 'doc_root');
  const otherNodes = nodes.filter((n) => n.id !== 'doc_root');

  if (rootNode) {
    nodePositions.set('doc_root', { x: centerX, y: centerY, ...rootNode });
  }

  const radius = Math.min(width, height) / 2 - 32;

  otherNodes.forEach((node, i) => {
    const angle = (i / otherNodes.length) * 2 * Math.PI - Math.PI / 2;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    nodePositions.set(node.id, { x, y, ...node });
  });

  // Render edges
  edges.forEach((edge) => {
    const src = nodePositions.get(edge.source);
    const tgt = nodePositions.get(edge.target);
    if (!src || !tgt) return;

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', src.x);
    line.setAttribute('y1', src.y);
    line.setAttribute('x2', tgt.x);
    line.setAttribute('y2', tgt.y);

    let strokeColor = '#3b82f6';
    let isDashed = false;

    if (edge.relationship === 'WAIVES' || edge.relationship === 'EXTINGUISHES') {
      strokeColor = '#ef4444';
      isDashed = true;
    } else if (edge.relationship === 'PROTECTS' || edge.relationship === 'GUARANTEES' || edge.relationship === 'SECURED_BY') {
      strokeColor = '#10b981';
    } else if (edge.relationship === 'TRANSFERRED_TO') {
      strokeColor = '#f59e0b';
      isDashed = true;
    }

    line.setAttribute('stroke', strokeColor);
    line.setAttribute('stroke-width', '1.5');
    if (isDashed) {
      line.setAttribute('stroke-dasharray', '3,3');
    }

    svgElement.appendChild(line);
  });

  // Render nodes
  nodes.forEach((node) => {
    const pos = nodePositions.get(node.id);
    if (!pos) return;

    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.style.cursor = 'pointer';

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', pos.x);
    circle.setAttribute('cy', pos.y);
    circle.setAttribute('r', node.id === 'doc_root' ? '12' : '9');

    let fillColor = '#3b82f6';
    if (node.type === 'USER_RIGHT') fillColor = '#10b981';
    if (node.type === 'SAFE_TERM') fillColor = '#06b6d4';
    if (node.type === 'CLAUSE') fillColor = '#ef4444';
    if (node.type === 'DATA_TYPE') fillColor = '#f59e0b';
    if (node.type === 'THIRD_PARTY') fillColor = '#a855f7';
    if (node.type === 'DOC_ROOT') fillColor = '#6366f1';

    circle.setAttribute('fill', fillColor);
    circle.setAttribute('stroke', '#0f172a');
    circle.setAttribute('stroke-width', '2');

    const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    title.textContent = `[${node.type}] ${node.label}`;
    circle.appendChild(title);
    group.appendChild(circle);

    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', pos.x);
    label.setAttribute('y', pos.y + (node.id === 'doc_root' ? -16 : 18));
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('fill', '#cbd5e1');
    label.setAttribute('font-size', '8.5');
    label.setAttribute('font-weight', '500');
    label.textContent = node.label.length > 16 ? node.label.slice(0, 14) + '...' : node.label;
    group.appendChild(label);

    svgElement.appendChild(group);
  });
}