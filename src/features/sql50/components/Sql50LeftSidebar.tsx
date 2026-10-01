import { useState } from "react";

import SchemaSidebar from "../../../components/schema/SchemaSidebar";
import type { SchemaTable } from "../../../lib/db/schema";
import { cn } from "../../../lib/utils/cn";
import type { UserProblemProgress } from "../../../lib/practice/types";
import ProblemSidebar from "./ProblemSidebar";
import type { Sql50Problem } from "../types/sql50";

type Tab = "problems" | "schema";

type Props = {
  problems: Sql50Problem[];
  activeSlug: string;
  getProgress: (problemId: number) => UserProblemProgress;
  onSelectProblem: (problem: Sql50Problem) => void;
  tables: SchemaTable[];
  onRefreshSchema: () => void;
  /** When set, controls tab externally (mobile). */
  activeTab?: Tab;
  onTabChange?: (tab: Tab) => void;
  hideTabBar?: boolean;
};

export default function Sql50LeftSidebar({
  problems,
  activeSlug,
  getProgress,
  onSelectProblem,
  tables,
  onRefreshSchema,
  activeTab: controlledTab,
  onTabChange,
  hideTabBar = false,
}: Props) {
  const [internalTab, setInternalTab] = useState<Tab>("problems");
  const tab = controlledTab ?? internalTab;

  function selectTab(next: Tab) {
    if (onTabChange) onTabChange(next);
    else setInternalTab(next);
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {!hideTabBar ? (
        <div
          className="retro-tablist shrink-0"
          role="tablist"
          aria-label="Sidebar sections"
        >
          {(
            [
              ["problems", "Problems"],
              ["schema", "Schema"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              aria-controls={`sql50-sidebar-${id}`}
              id={`sql50-tab-${id}`}
              onClick={() => selectTab(id)}
              className={cn(
                "retro-tab flex-1 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] transition-colors"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-hidden">
        {tab === "problems" ? (
          <div
            id="sql50-sidebar-problems"
            role="tabpanel"
            aria-labelledby="sql50-tab-problems"
            className="flex h-full min-h-0 flex-col overflow-hidden p-3"
          >
            <ProblemSidebar
              embedded
              problems={problems}
              activeSlug={activeSlug}
              getProgress={getProgress}
              onSelect={onSelectProblem}
            />
          </div>
        ) : (
          <div
            id="sql50-sidebar-schema"
            role="tabpanel"
            aria-labelledby="sql50-tab-schema"
            className="h-full min-h-0 overflow-y-auto p-3 scrollbar-thin"
          >
            <SchemaSidebar
              embedded
              tables={tables}
              onRefresh={() => void onRefreshSchema()}
            />
          </div>
        )}
      </div>
    </div>
  );
}
