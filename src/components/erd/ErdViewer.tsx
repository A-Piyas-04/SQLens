import "@xyflow/react/dist/style.css";

import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type ReactFlowInstance,
} from "@xyflow/react";
import { GitFork } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";

import type { SchemaTable } from "../../lib/db/schema";
import { buildErdGraph } from "../../lib/erd/buildErdGraph";
import ErdTableNode from "./ErdTableNode";

const nodeTypes = { erdTable: ErdTableNode };

type Props = {
  tables: SchemaTable[];
};

export default function ErdViewer({ tables }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const rfInstanceRef = useRef<ReactFlowInstance | null>(null);

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

  const onInit = useCallback((instance: ReactFlowInstance) => {
    rfInstanceRef.current = instance;
    instance.fitView({ padding: 0.15 });
  }, []);

  if (tables.length === 0) {
    return (
      <div className="flex h-44 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-700/60 bg-slate-900/40 text-slate-500">
        <GitFork className="size-5 opacity-40" aria-hidden />
        <p className="text-sm">No tables yet — create some to see the ERD.</p>
      </div>
    );
  }

  return (
    <div className="h-[540px] overflow-hidden rounded-lg border border-slate-700/60">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onInit={onInit}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.15}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        className="bg-slate-950"
      >
        <Background
          color="#1e293b"
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
          nodeColor="#1e3a5f"
          maskColor="rgba(2, 6, 23, 0.75)"
          style={{
            background: "#0f172a",
            border: "1px solid rgb(30 41 59 / 0.8)",
            borderRadius: "8px",
          }}
        />
      </ReactFlow>
    </div>
  );
}
