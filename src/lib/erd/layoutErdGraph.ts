import dagre from "@dagrejs/dagre";
import { type Edge, type Node } from "@xyflow/react";

import type { ErdEdgeData, ErdTableNodeData } from "./buildErdGraph";
import { NODE_WIDTH, nodeHeight } from "./buildErdGraph";

type ErdNode = Node<ErdTableNodeData, "erdTable">;

const COMPONENT_GAP = 140;
const EDGE_LANE_SPACING = 22;
const MIN_EDGE_LANE_SPACING = 16;

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

function layoutSpacing(nodeCount: number) {
  const scale = Math.min(2.25, 1 + nodeCount / 10);
  return {
    nodesep: Math.round(72 * scale),
    ranksep: Math.round(96 * scale),
    marginx: Math.round(24 * scale),
    marginy: Math.round(24 * scale),
  };
}

function layoutComponent(nodes: ErdNode[], edges: Edge[]): ErdNode[] {
  if (nodes.length === 0) return [];

  const spacing = layoutSpacing(nodes.length);
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: "TB",
    ...spacing,
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

function pickDirectionalHandles(source: ErdNode, target: ErdNode): HandlePair {
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

function columnHandleId(
  role: "source" | "target",
  side: "top" | "right" | "bottom" | "left",
  columnName: string
): string {
  return `${role}-${side}-col-${columnName}`;
}

function sideFromHandle(handle: string): "top" | "right" | "bottom" | "left" {
  if (handle.includes("-top")) return "top";
  if (handle.includes("-right")) return "right";
  if (handle.includes("-bottom")) return "bottom";
  return "left";
}

function pickColumnHandles(
  source: ErdNode,
  target: ErdNode,
  sourceColumn: string,
  targetColumn: string
): HandlePair | undefined {
  const sourceIdx = source.data.table.columns.findIndex(
    (c) => c.column_name === sourceColumn
  );
  const targetIdx = target.data.table.columns.findIndex(
    (c) => c.column_name === targetColumn
  );
  if (sourceIdx < 0 || targetIdx < 0) return undefined;

  const { sourceHandle, targetHandle } = pickDirectionalHandles(source, target);
  const sourceSide = sideFromHandle(sourceHandle);
  const targetSide = sideFromHandle(targetHandle);

  return {
    sourceHandle: columnHandleId("source", sourceSide, sourceColumn),
    targetHandle: columnHandleId("target", targetSide, targetColumn),
  };
}

function edgeLaneSpacing(edgeCount: number): number {
  if (edgeCount <= 6) return EDGE_LANE_SPACING;
  return Math.max(MIN_EDGE_LANE_SPACING, EDGE_LANE_SPACING - (edgeCount - 6) * 1.5);
}

function laneOffset(index: number, count: number, spacing: number): number {
  if (count <= 1) return 0;
  return (index - (count - 1) / 2) * spacing;
}

function applyEdgeRouting(nodes: ErdNode[], edges: Edge[]): Edge[] {
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const routed = edges.map((edge) => {
    const source = nodeById.get(edge.source);
    const target = nodeById.get(edge.target);
    const edgeData = edge.data as ErdEdgeData | undefined;
    const sourceColumn = edgeData?.sourceColumn ?? "";
    const targetColumn = edgeData?.targetColumn ?? "";

    const handles =
      source && target && sourceColumn && targetColumn
        ? pickColumnHandles(source, target, sourceColumn, targetColumn) ??
          (source && target ? pickDirectionalHandles(source, target) : undefined)
        : source && target
          ? pickDirectionalHandles(source, target)
          : undefined;

    return {
      ...edge,
      type: edge.type ?? ("erdCardinality" as const),
      ...(handles ?? {}),
    };
  });

  const sourceGroups = new Map<string, Edge[]>();
  const targetGroups = new Map<string, Edge[]>();

  routed.forEach((edge) => {
    if (edge.sourceHandle) {
      const key = `${edge.source}|${edge.sourceHandle}`;
      const list = sourceGroups.get(key) ?? [];
      list.push(edge);
      sourceGroups.set(key, list);
    }
    if (edge.targetHandle) {
      const key = `${edge.target}|${edge.targetHandle}`;
      const list = targetGroups.get(key) ?? [];
      list.push(edge);
      targetGroups.set(key, list);
    }
  });

  const maxCongestion = Math.max(
    1,
    ...[...sourceGroups.values(), ...targetGroups.values()].map((g) => g.length)
  );
  const spacing = edgeLaneSpacing(maxCongestion);

  return routed.map((edge) => {
    const sourceGroup = edge.sourceHandle
      ? sourceGroups.get(`${edge.source}|${edge.sourceHandle}`)!
      : [edge];
    const targetGroup = edge.targetHandle
      ? targetGroups.get(`${edge.target}|${edge.targetHandle}`)!
      : [edge];

    const sourceOffset = laneOffset(
      sourceGroup.indexOf(edge),
      sourceGroup.length,
      spacing
    );
    const targetOffset = laneOffset(
      targetGroup.indexOf(edge),
      targetGroup.length,
      spacing
    );

    let offset = 0;
    if (sourceGroup.length > 1 && targetGroup.length > 1) {
      offset = (sourceOffset + targetOffset) / 2;
    } else if (sourceGroup.length > 1) {
      offset = sourceOffset;
    } else if (targetGroup.length > 1) {
      offset = targetOffset;
    }

    return {
      ...edge,
      pathOptions: { offset, borderRadius: 12 },
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
