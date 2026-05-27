import { useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { sql } from "@codemirror/lang-sql";
import { EditorState } from "@codemirror/state";
import { Decoration, EditorView } from "@codemirror/view";

import type { SimulatorSnapshot, SimulatorStageType, StageDiff } from "../../../lib/simulator";
import StageStepList from "../StageStepList";
import { getClauseRangeForStage } from "../../../lib/simulator/sql/clauseRanges";

type Props = {
  originalSql: string;
  activeStageType: SimulatorStageType;
  joinStageIndex: number;
  snapshots: SimulatorSnapshot[];
  diffs: StageDiff[];
  activeIndex: number;
  navigate: (index: number) => void;
  className?: string;
};

export default function SqlContextPanel({
  originalSql,
  activeStageType,
  joinStageIndex,
  snapshots,
  diffs,
  activeIndex,
  navigate,
  className,
}: Props) {
  const highlightRange = useMemo(
    () => getClauseRangeForStage(originalSql, activeStageType, joinStageIndex),
    [activeStageType, joinStageIndex, originalSql]
  );

  const highlightExtension = useMemo(() => {
    if (!highlightRange) {
      return EditorView.decorations.of(Decoration.none);
    }
    const mark = Decoration.mark({ class: "cm-active-clause" });
    return EditorView.decorations.of(Decoration.set([mark.range(highlightRange.from, highlightRange.to)]));
  }, [highlightRange]);

  const extensions = useMemo(
    () => [sql(), EditorState.readOnly.of(true), highlightExtension],
    [highlightExtension]
  );

  return (
    <aside className={className}>
      <div className="border-b border-slate-700/50 p-3">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">SQL Context</p>
        <div className="overflow-hidden rounded-lg border border-slate-700/70 bg-slate-950/60">
          <CodeMirror
            value={originalSql}
            editable={false}
            theme="dark"
            basicSetup={{ lineNumbers: false, foldGutter: false }}
            extensions={extensions}
          />
        </div>
      </div>

      <div className="p-2">
        <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Execution Stages</p>
        <StageStepList snapshots={snapshots} diffs={diffs} activeIndex={activeIndex} onSelect={navigate} />
      </div>
    </aside>
  );
}
