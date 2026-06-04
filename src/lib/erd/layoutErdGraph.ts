import dagre from "@dagrejs/dagre";
import { type Edge, type Node } from "@xyflow/react";

import type { ErdTableNodeData } from "./buildErdGraph";
import { NODE_WIDTH, nodeHeight } from "./buildErdGraph";

type ErdNode = Node<ErdTableNodeData, "erdTable">;

const COMPONENT_GAP = 120;
const PARALLEL_EDGE_OFFSET = 28;

function findComponents(nodeIds: string[], edges: Edge[]): Set<string>[] {
  const parent = new Map(nodeIds.map((id) => [id, id]));

  function find(id: string): string {
    let root = id;
    while (parent.get(root) !== root) root = parent.get(root)!;
    let current = id;
    while (current !== root) {
      const next = parent.get(current)!;
      parent.set(current, root);
      current = next;
    }
    return root;
  }

  function union(a: string, b: string) {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  }

  edges.forEach((edge) => union(edge.source, edge.target));

  const groups = new Map<string, Set<string>>();
  nodeIds.forEach((id) => {
    const root = find(id);
    if (!groups.has(root)) groups.set(root, new Set());
    groups.get(root)!.add(id);
  });

  return [...groups.values()];
}

function layoutComponent(nodes: ErdNode[], edges: Edge[]): ErdNode[] {
  if (nodes.length === 0) return [];

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: "TB",
    nodesep: 72,
    ranksep: 96,
    marginx: 16,
    marginy: 16,
  });

  nodes.forEach((node) => {
    const height = nodeHeight(node.data.table.columns.length);
    g.setNode(node.id, { width: NODE_WIDTH, height });
  });

  // Rank referenced tables above referencing tables (parent above child).
  edges.forEach((edge) => {
    g.setEdge(edge.target, edge.source);
  });

  dagre.layout(g);

  return nodes.map((node) => {
    const pos = g.node(node.id);
    const height = nodeHeight(node.data.table.columns.length);
    return {
      ...node,
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - height / 2,
      },
    };
  });
}

function componentBounds(nodes: ErdNode[]): {
  minX: number;
  minY: number;
  width: number;
  height: number;
} {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  nodes.forEach((node) => {
    const h = nodeHeight(node.data.table.columns.length);
    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + NODE_WIDTH);
    maxY = Math.max(maxY, node.position.y + h);
  });

  return {
    minX,
    minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

function layoutNodes(nodes: ErdNode[], edges: Edge[]): ErdNode[] {
  const ids = nodes.map((n) => n.id);
  const components = findComponents(ids, edges);

  let offsetX = 0;
  const laidOut: ErdNode[] = [];

  for (const component of components) {
    const compNodes = nodes.filter((n) => component.has(n.id));
    const compEdges = edges.filter(
      (e) => component.has(e.source) && component.has(e.target)
    );
    const positioned = layoutComponent(compNodes, compEdges);
    const bounds = componentBounds(positioned);

    positioned.forEach((node) => {
      laidOut.push({
        ...node,
        position: {
          x: node.position.x + offsetX - bounds.minX,
          y: node.position.y - bounds.minY,
        },
      });
    });

    offsetX += bounds.width + COMPONENT_GAP;
  }

  return laidOut;
}

type HandlePair = {
  sourceHandle: string;
  targetHandle: string;
};

function pickHandles(source: ErdNode, target: ErdNode): HandlePair {
  const sourceH = nodeHeight(source.data.table.columns.length);
  const targetH = nodeHeight(target.data.table.columns.length);
  const sourceCx = source.position.x + NODE_WIDTH / 2;
  const sourceCy = source.position.y + sourceH / 2;
  const targetCx = target.position.x + NODE_WIDTH / 2;
  const targetCy = target.position.y + targetH / 2;
  const dx = targetCx - sourceCx;
  const dy = targetCy - sourceCy;

  if (Math.abs(dy) > Math.abs(dx) * 0.75) {
    if (dy < 0) {
      return { sourceHandle: "source-top", targetHandle: "target-bottom" };
    }
    return { sourceHandle: "source-bottom", targetHandle: "target-top" };
  }

  if (dx >= 0) {
    return { sourceHandle: "source-right", targetHandle: "target-left" };
  }

  return { sourceHandle: "source-left", targetHandle: "target-right" };
}

function applyEdgeRouting(
  nodes: ErdNode[],
  edges: Edge[]
): Edge[] {
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const groups = new Map<string, Edge[]>();

  edges.forEach((edge) => {
    const key = `${edge.source}|${edge.target}`;
    const list = groups.get(key) ?? [];
    list.push(edge);
    groups.set(key, list);
  });

  return edges.map((edge) => {
    const group = groups.get(`${edge.source}|${edge.target}`)!;
    const index = group.indexOf(edge);
    const offset =
      group.length > 1
        ? (index - (group.length - 1) / 2) * PARALLEL_EDGE_OFFSET
        : 0;

    const source = nodeById.get(edge.source);
    const target = nodeById.get(edge.target);
    const handles =
      source && target ? pickHandles(source, target) : undefined;

    return {
      ...edge,
      type: "smoothstep" as const,
      ...(handles ?? {}),
      pathOptions: { offset, borderRadius: 14 },
    };
  });
}

export function layoutErdGraph(
  nodes: ErdNode[],
  edges: Edge[]
): { nodes: ErdNode[]; edges: Edge[] } {
  if (nodes.length === 0) return { nodes, edges };

  const layoutedNodes = layoutNodes(nodes, edges);
  const layoutedEdges = applyEdgeRouting(layoutedNodes, edges);

  return { nodes: layoutedNodes, edges: layoutedEdges };
}
