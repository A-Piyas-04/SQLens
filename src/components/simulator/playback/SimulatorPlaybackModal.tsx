import {
  useCallback,
  useEffect,
  useRef,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useSimulatorPlayback } from "../../../hooks/useSimulatorPlayback";
import PlaybackTimeline from "./PlaybackTimeline";
import PlaybackStage from "./PlaybackStage";
import PlaybackControls from "./PlaybackControls";
import type { SimulatorSnapshot, StageDiff } from "../../../lib/simulator";

type Props = {
  snapshots: SimulatorSnapshot[];
  diffs:     StageDiff[];
  onClose:   () => void;
};

/**
 * Fullscreen animated playback modal.
 *
 * Rendered into document.body via a React portal so it is not clipped by any
 * overflow:hidden ancestor. Closes on Escape, × button, or backdrop click.
 * Keyboard shortcuts (Space, ←, →, R) are handled here and forwarded to the
 * playback hook.
 */
export default function SimulatorPlaybackModal({ snapshots, diffs, onClose }: Props) {
  const pb = useSimulatorPlayback(snapshots.length);
  const { activeIndex, navigate, togglePlay, restart } = pb;

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
          navigate(activeIndex + 1);
          break;
        case "ArrowLeft":
          e.preventDefault();
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
    [activeIndex, navigate, togglePlay, restart, onClose]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // ── Derived data ──────────────────────────────────────────────────────────
  const snapshot     = snapshots[activeIndex];
  const prevSnapshot = activeIndex > 0 ? snapshots[activeIndex - 1] : null;
  const diff         = diffs[activeIndex - 1] ?? null; // diffs[i] = prev→curr for stage i+1

  const dbLabel = snapshot?.label.replace(/^FROM\s+/i, "") ?? "query";

  // ── Render ────────────────────────────────────────────────────────────────
  const modal = (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-stretch bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="SQL Execution Playback"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Panel */}
      <div className="relative flex flex-1 flex-col overflow-hidden bg-[#0d1117] ring-1 ring-slate-700/50 m-3 rounded-xl">
        {/* Header */}
        <header className="flex items-center gap-3 border-b border-slate-700/50 bg-slate-900/60 px-5 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              SQL Execution Playback
            </span>
            <span className="text-slate-700">/</span>
            <span className="truncate text-sm font-medium text-slate-300">
              {dbLabel}
            </span>
          </div>

          {/* Keyboard hint */}
          <div className="ml-auto mr-3 hidden items-center gap-3 text-[10px] text-slate-600 sm:flex">
            <kbd className="rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-slate-500">Space</kbd>
            play/pause
            <kbd className="rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-slate-500">← →</kbd>
            navigate
            <kbd className="rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-slate-500">R</kbd>
            restart
            <kbd className="rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-slate-500">Esc</kbd>
            close
          </div>

          <button
            ref={closeButtonRef}
            aria-label="Close playback"
            onClick={onClose}
            className="flex size-7 shrink-0 items-center justify-center rounded-md border border-slate-700/60 bg-slate-800/50 text-slate-400 transition-colors hover:bg-slate-700/60 hover:text-slate-200"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </header>

        {/* Body: timeline + stage content */}
        <div className="flex flex-1 min-h-0">
          <PlaybackTimeline
            snapshots={snapshots}
            activeIndex={activeIndex}
            navigate={(i) => { pb.navigate(i); }}
            onNavigate={() => { /* autoplay continues — user can pause via controls */ }}
          />

          {snapshot && (
            <main className="flex flex-1 flex-col min-h-0 min-w-0">
              <PlaybackStage
                snapshot={snapshot}
                prevSnapshot={prevSnapshot}
                diff={diff}
                animationKey={pb.animationKey}
                speed={pb.speed}
              />
            </main>
          )}
        </div>

        {/* Controls bar */}
        <PlaybackControls
          activeIndex={activeIndex}
          isPlaying={pb.isPlaying}
          speed={pb.speed}
          animationKey={pb.animationKey}
          navigate={navigate}
          togglePlay={togglePlay}
          restart={restart}
          setSpeed={pb.setSpeed}
          totalStages={snapshots.length}
        />
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
