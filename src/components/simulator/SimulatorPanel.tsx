import { useState } from "react";
import { AlertTriangle, Cpu, Info } from "lucide-react";

import Panel from "../common/Panel";
import Button from "../common/Button";
import SimulatorStageList from "./SimulatorStageList";
import { parseSql } from "../../lib/simulator/parseSql";
import { validateSqlSupport } from "../../lib/simulator/supportedSql";
import { buildPipeline } from "../../lib/simulator/buildPipeline";
import type { SimulatorResult } from "../../lib/simulator/simulatorTypes";
import { cn } from "../../lib/utils/cn";

type Props = {
  query: string;
  selectedText: string;
};

export default function SimulatorPanel({ query, selectedText }: Props) {
  const [result, setResult] = useState<SimulatorResult | null>(null);
  const [simulatedSql, setSimulatedSql] = useState<string>("");

  const isSelection = !!selectedText.trim();

  function handleSimulate() {
    const sqlToSimulate = selectedText.trim() || query;
    setSimulatedSql(sqlToSimulate);

    const parseResult = parseSql(sqlToSimulate);
    if (!parseResult.ok) {
      setResult({ ok: false, error: parseResult.error });
      return;
    }

    const validation = validateSqlSupport(parseResult.ast);
    if (!validation.supported) {
      setResult({ ok: false, error: validation.reason });
      return;
    }

    const pipeline = buildPipeline(parseResult.ast, sqlToSimulate);
    setResult({ ok: true, pipeline });
  }

  const isEmpty = !query.trim() && !selectedText.trim();

  return (
    <Panel
      title="SQL Execution Simulator"
      action={
        <Button
          variant="secondary"
          size="sm"
          onClick={handleSimulate}
          disabled={isEmpty}
          title={
            isSelection
              ? "Simulate selected SQL"
              : "Simulate query structure"
          }
        >
          <Cpu className="size-3.5" aria-hidden />
          {isSelection ? "Simulate Selection" : "Simulate Query"}
        </Button>
      }
    >
      <div className="space-y-4">
        {result === null && (
          <EmptyState />
        )}

        {result !== null && !result.ok && (
          <ErrorState message={result.error} sql={simulatedSql} />
        )}

        {result !== null && result.ok && (
          <PipelineResult
            stages={result.pipeline.stages}
            sql={result.pipeline.sql}
            isSelection={isSelection && simulatedSql === selectedText.trim()}
          />
        )}
      </div>
    </Panel>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
      <div className="rounded-full border border-slate-700/60 bg-slate-800/40 p-3">
        <Cpu className="size-5 text-slate-500" aria-hidden />
      </div>
      <p className="text-sm text-slate-400">
        Click <strong className="text-slate-300">Simulate Query</strong> to
        visualize the logical execution pipeline.
      </p>
      <p className="text-xs text-slate-600">
        Supports SELECT with FROM, JOIN, WHERE, ORDER BY, and LIMIT.
      </p>
    </div>
  );
}

type ErrorStateProps = {
  message: string;
  sql: string;
};

function ErrorState({ message, sql }: ErrorStateProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/8 px-4 py-3">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-400" aria-hidden />
        <p className="text-sm text-amber-300">{message}</p>
      </div>

      {sql && (
        <SqlPreview sql={sql} />
      )}
    </div>
  );
}

type PipelineResultProps = {
  stages: import("../../lib/simulator/simulatorTypes").SimulatorStage[];
  sql: string;
  isSelection: boolean;
};

function PipelineResult({ stages, sql, isSelection }: PipelineResultProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-400">
            {stages.length} execution{" "}
            {stages.length === 1 ? "stage" : "stages"} detected
          </span>
          {isSelection && (
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">
              selection
            </span>
          )}
        </div>
      </div>

      <SimulatorStageList stages={stages} />

      <SqlPreview sql={sql} />
    </div>
  );
}

type SqlPreviewProps = {
  sql: string;
};

function SqlPreview({ sql }: SqlPreviewProps) {
  const preview = sql.length > 160 ? `${sql.slice(0, 157)}…` : sql;

  return (
    <div
      className={cn(
        "rounded-lg border border-slate-700/50 bg-slate-950/60 px-3 py-2",
        "flex items-start gap-2"
      )}
    >
      <Info className="mt-0.5 size-3.5 shrink-0 text-slate-600" aria-hidden />
      <p className="font-mono text-[11px] leading-relaxed text-slate-500 break-all">
        {preview}
      </p>
    </div>
  );
}
