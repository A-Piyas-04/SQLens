import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useSimulatorPlayback } from "../../../hooks/useSimulatorPlayback";
import PlaybackStage from "./PlaybackStage";
import PlaybackControls from "./PlaybackControls";
import type { SimulatorSnapshot, StageDiff } from "../../../lib/simulator";
import SqlContextPanel from "./SqlContextPanel";
import LessonPanel from "./LessonPanel";

type Props = {
  snapshots: SimulatorSnapshot[];
  diffs:     StageDiff[];
  originalSql: string;
  onClose:   () => void;
};

const SIDEBAR_WIDTH_MIN = 160;
const SIDEBAR_WIDTH_MAX = 480;
const SIDEBAR_WIDTH_DEFAULT = 220;

function readSidebarWidth(): number {
  if (typeof localStorage === "undefined") return SIDEBAR_WIDTH_DEFAULT;
  const raw = localStorage.getItem("simulator:playbackSidebarWidth");
  const n = raw ? Number.parseInt(raw, 10) : SIDEBAR_WIDTH_DEFAULT;
  if (!Number.isFinite(n)) return SIDEBAR_WIDTH_DEFAULT;
  return Math.min(SIDEBAR_WIDTH_MAX, Math.max(SIDEBAR_WIDTH_MIN, n));
}

/**
 * Fullscreen animated playback modal.
 *
 * Rendered into document.body via a React portal so it is not clipped by any
 * overflow:hidden ancestor. Closes on Escape, × button, or backdrop click.
 * Keyboard shortcuts (Space, ←, →, R) are handled here and forwarded to the
 * playback hook.
 */
export default function SimulatorPlaybackModal({ snapshots, diffs, originalSql, onClose }: Props) {
  const pb = useSimulatorPlayback(snapshots.length);
  const { activeIndex, navigate, togglePlay, restart } = pb;
  const [showRowIds, setShowRowIds] = useState<boolean>(() => localStorage.getItem("simulator:showRowIds") === "1");
  const [showSqlMobile, setShowSqlMobile] = useState(false);
  const [showLessonMobile, setShowLessonMobile] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(readSidebarWidth);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);

  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // ── Scroll lock ───────────────────────────────────────────────────────────
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // ── Focus trap ────────────────────────────────────────────────────────────
  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore when user is typing in an input
      if ((e.target as HTMLElement).tagName === "INPUT") return;

      switch (e.key) {
        case "Escape":
          e.preventDefault();
          onClose();
          break;
        case " ":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowRight":
          e.preventDefault();
          if (pb.isTransitioning) return;
          navigate(activeIndex + 1);
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (pb.isTransitioning) return;
          navigate(activeIndex - 1);
          break;
        case "r":
        case "R":
          e.preventDefault();
          restart();
          break;
        default:
          break;
      }
    },
    [activeIndex, navigate, togglePlay, restart, onClose, pb.isTransitioning]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // ── Derived data ──────────────────────────────────────────────────────────
  const snapshot     = snapshots[activeIndex];
  const prevSnapshot = activeIndex > 0 ? snapshots[activeIndex - 1] : null;
  const diff         = diffs[activeIndex - 1] ?? null; // diffs[i] = prev→curr for stage i+1
  if (!snapshot) return null;

  const dbLabel = snapshot?.label.replace(/^FROM\s+/i, "") ?? "query";
  const joinStageIndex = snapshots.slice(0, activeIndex + 1).filter((s) => s.stageType === "JOIN").length - 1;

  useEffect(() => {
    localStorage.setItem("simulator:showRowIds", showRowIds ? "1" : "0");
  }, [showRowIds]);

  const handleSidebarResizeStart = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      const startX = e.clientX;
      const startW = sidebarWidth;
      setIsResizingSidebar(true);

      const onMove = (ev: PointerEvent) => {
        const next = Math.min(
          SIDEBAR_WIDTH_MAX,
          Math.max(SIDEBAR_WIDTH_MIN, startW + ev.clientX - startX)
        );
        setSidebarWidth(next);
      };

      const onUp = () => {
        setIsResizingSidebar(false);
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        setSidebarWidth((w) => {
          localStorage.setItem("simulator:playbackSidebarWidth", String(w));
          return w;
        });
      };

      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [sidebarWidth]
  );

  // ── Render ────────────────────────────────────────────────────────────────
  const modal = (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-stretch bg-ink/40 "
      role="dialog"
      aria-modal="true"
      aria-label="SQL Execution Playback"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Panel */}
      <div className="relative flex flex-1 flex-col overflow-hidden bg-surface-elevated ring-1 ring-line m-3 rounded-sm shadow-md">
        {/* Header */}
        <header className="flex items-center gap-3 border-b border-line bg-surface-raised px-5 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
              Query Execution Simulation
            </span>
            <span className="text-ink-muted">/</span>
            <span className="truncate text-sm font-medium text-ink-secondary">
              {dbLabel}
            </span>
          </div>

          {/* Keyboard hint */}
          <div className="ml-auto mr-3 hidden items-center gap-3 text-[10px] text-ink-muted sm:flex">
            <kbd className="rounded border border-line bg-surface-muted px-1.5 py-0.5 text-ink-muted">Space</kbd>
            play/pause
            <kbd className="rounded border border-line bg-surface-muted px-1.5 py-0.5 text-ink-muted">← →</kbd>
            navigate
            <kbd className="rounded border border-line bg-surface-muted px-1.5 py-0.5 text-ink-muted">R</kbd>
            restart
            <kbd className="rounded border border-line bg-surface-muted px-1.5 py-0.5 text-ink-muted">Esc</kbd>
            close
          </div>

          <button
            ref={closeButtonRef}
            aria-label="Close playback"
            onClick={onClose}
            className="flex size-7 shrink-0 items-center justify-center rounded-sm border border-line bg-surface-muted text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </header>

        {/* Body: context + stage + lesson */}
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <div
            className="relative hidden shrink-0 lg:flex lg:flex-col"
            style={{ width: sidebarWidth }}
          >
            <SqlContextPanel
              className="h-full min-w-0 flex-1 overflow-y-auto border-r border-line bg-surface-raised"
              originalSql={originalSql}
              activeStageType={snapshot.stageType}
              joinStageIndex={Math.max(0, joinStageIndex)}
              snapshots={snapshots}
              diffs={diffs}
              activeIndex={activeIndex}
              navigate={pb.navigate}
            />
            <div
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize SQL context panel"
              aria-valuenow={sidebarWidth}
              onPointerDown={handleSidebarResizeStart}
              className={
                isResizingSidebar
                  ? "absolute right-0 top-0 z-20 h-full w-1.5 cursor-col-resize bg-accent"
                  : "absolute right-0 top-0 z-20 h-full w-1.5 cursor-col-resize bg-transparent hover:bg-accent-muted active:bg-accent"
              }
            />
          </div>

          {snapshot && (
            <main className="flex min-h-0 min-w-0 flex-1 flex-col">
              <div className="flex items-center gap-2 border-b border-line px-4 py-2 lg:hidden">
                <button
                  onClick={() => setShowSqlMobile((v) => !v)}
                  className="rounded-sm border border-line bg-surface-muted px-2 py-1 text-xs text-ink-secondary"
                >
                  Show SQL
                </button>
                <button
                  onClick={() => setShowLessonMobile((v) => !v)}
                  className="rounded-sm border border-line bg-surface-muted px-2 py-1 text-xs text-ink-secondary"
                >
                  Lesson
                </button>
              </div>
              <PlaybackStage
                snapshot={snapshot}
                prevSnapshot={prevSnapshot}
                diff={diff}
                animationKey={pb.animationKey}
                speed={pb.speed}
                transitionPhase={pb.transitionPhase}
                setTransitionPhase={pb.setTransitionPhase}
                showRowIds={showRowIds}
              />
            </main>
          )}

          <div className="hidden w-[280px] shrink-0 lg:block">
            {snapshot && (
              <LessonPanel
                snapshot={snapshot}
                prevSnapshot={prevSnapshot}
                diff={diff}
                showRowIds={showRowIds}
                onToggleRowIds={setShowRowIds}
              />
            )}
          </div>
        </div>

        {showSqlMobile && snapshot && (
          <div className="border-t border-line lg:hidden">
            <SqlContextPanel
              originalSql={originalSql}
              activeStageType={snapshot.stageType}
              joinStageIndex={Math.max(0, joinStageIndex)}
              snapshots={snapshots}
              diffs={diffs}
              activeIndex={activeIndex}
              navigate={pb.navigate}
            />
          </div>
        )}

        {showLessonMobile && snapshot && (
          <div className="max-h-[50vh] border-t border-line lg:hidden">
            <LessonPanel
              snapshot={snapshot}
              prevSnapshot={prevSnapshot}
              diff={diff}
              showRowIds={showRowIds}
              onToggleRowIds={setShowRowIds}
            />
          </div>
        )}

        {/* Controls bar */}
        <PlaybackControls
          activeIndex={activeIndex}
          isPlaying={pb.isPlaying}
          speed={pb.speed}
          navigate={navigate}
          togglePlay={togglePlay}
          setSpeed={pb.setSpeed}
          toggleStepMode={pb.toggleStepMode}
          stepMode={pb.stepMode}
          isTransitioning={pb.isTransitioning}
          activeStageType={snapshot.stageType}
          stageTypes={snapshots.map((s) => s.stageType)}
          totalStages={snapshots.length}
        />
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
