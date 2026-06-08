import "@xyflow/react/dist/style.css";

import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Edge,
  type ReactFlowInstance,
} from "@xyflow/react";
import { GitFork } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";

import type { SchemaTable } from "../../lib/db/schema";
import { buildErdGraph, type ErdTableNodeData } from "../../lib/erd/buildErdGraph";
import type { Node } from "@xyflow/react";
import ErdCardinalityEdge from "./ErdCardinalityEdge";
import ErdExportMenu from "./ErdExportMenu";
import ErdMaximizeButton from "./ErdMaximizeButton";
import ErdRelationLegend from "./ErdRelationLegend";
import ErdTableNode from "./ErdTableNode";

type ErdNode = Node<ErdTableNodeData, "erdTable">;

const nodeTypes = { erdTable: ErdTableNode };
const edgeTypes = { erdCardinality: ErdCardinalityEdge };

type Props = {
  tables: SchemaTable[];
  fullscreen?: boolean;
  projectId?: string;
};

export default function ErdViewer({ tables, fullscreen = false, projectId }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState<ErdNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const rfInstanceRef = useRef<ReactFlowInstance<ErdNode, Edge> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = buildErdGraph(tables);
    setNodes(newNodes);
    setEdges(newEdges);

    if (rfInstanceRef.current) {
      setTimeout(
        () => rfInstanceRef.current?.fitView({ padding: 0.15, duration: 350 }),
        50
      );
    }
  }, [tables, setNodes, setEdges]);

  const onInit = useCallback((instance: ReactFlowInstance<ErdNode, Edge>) => {
    rfInstanceRef.current = instance;
    instance.fitView({ padding: 0.15 });
  }, []);

  if (tables.length === 0) {
    return (
      <div
        className={
          fullscreen
            ? "flex h-full min-h-[12rem] flex-col items-center justify-center gap-2 rounded-sm border border-dashed border-line bg-surface-raised text-ink-muted"
            : "flex h-44 flex-col items-center justify-center gap-2 rounded-sm border border-dashed border-line bg-surface-raised text-ink-muted"
        }
      >
        <GitFork className="size-5 opacity-40" aria-hidden />
        <p className="text-sm">No tables yet — create some to see the ERD.</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={
        fullscreen
          ? "h-full min-h-0 overflow-hidden rounded-sm border border-line"
          : "h-[540px] overflow-hidden rounded-sm border border-line"
      }
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onInit={onInit}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        minZoom={0.15}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        className="bg-surface"
      >
        <Background
          color="var(--color-line-strong)"
          gap={20}
          size={1}
          variant={BackgroundVariant.Dots}
        />

        <Controls
          style={{
            background: "transparent",
            border: "none",
            gap: 4,
          }}
        />

        <MiniMap
          nodeColor="var(--color-accent)"
          maskColor="rgba(28, 25, 22, 0.12)"
          style={{
            background: "var(--color-bg-subtle)",
            border: "1px solid var(--color-border)",
            borderRadius: "4px",
          }}
        />

        {projectId && !fullscreen ? (
          <ErdMaximizeButton projectId={projectId} />
        ) : null}

        <ErdRelationLegend />

        <ErdExportMenu tables={tables} containerRef={containerRef} />
      </ReactFlow>
    </div>
  );
}
