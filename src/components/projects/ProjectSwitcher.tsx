import { ChevronDown, FolderOpen, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { Project } from "../../lib/projects/projectStore";
import { cn } from "../../lib/utils/cn";

type Props = {
  projects: Project[];
  activeProject: Project | undefined;
  onCreate: (name?: string) => Project;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onSwitch: (id: string) => void;
};

export default function ProjectSwitcher({
  projects,
  activeProject,
  onCreate,
  onRename,
  onDelete,
  onSwitch,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(e: PointerEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        commitRenameIfPending();
        setIsOpen(false);
        setConfirmDeleteId(null);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  });

  function startRename(project: Project) {
    setRenamingId(project.id);
    setRenameValue(project.name);
    setConfirmDeleteId(null);
    // Focus the input after the state settles
    setTimeout(() => renameInputRef.current?.select(), 0);
  }

  function commitRenameIfPending() {
    if (renamingId && renameValue.trim()) {
      onRename(renamingId, renameValue.trim());
    }
    setRenamingId(null);
  }

  function handleRenameKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") commitRenameIfPending();
    if (e.key === "Escape") setRenamingId(null);
  }

  function handleDeleteClick(id: string) {
    if (confirmDeleteId === id) {
      onDelete(id);
      setConfirmDeleteId(null);
      setIsOpen(false);
    } else {
      setConfirmDeleteId(id);
      setRenamingId(null);
    }
  }

  function handleSwitchProject(id: string) {
    if (renamingId === id || confirmDeleteId === id) return;
    onSwitch(id);
    setIsOpen(false);
    setConfirmDeleteId(null);
  }

  function handleCreateProject() {
    const project = onCreate();
    // Immediately enter rename mode so the user can name the new project
    setRenamingId(project.id);
    setRenameValue(project.name);
    setConfirmDeleteId(null);
    setTimeout(() => renameInputRef.current?.select(), 0);
  }

  return (
    <div ref={containerRef} className="relative">
      {/* ── Trigger ─────────────────────────────────────────────────── */}
      <button
        onClick={() => {
          setIsOpen((prev) => !prev);
          setConfirmDeleteId(null);
          setRenamingId(null);
        }}
        className={cn(
          "flex w-full items-center justify-between gap-2",
          "rounded-lg border border-slate-700/60 bg-slate-800/50 px-3 py-2",
          "text-sm text-slate-200 transition-colors",
          "hover:border-slate-600/70 hover:bg-slate-800/80",
          isOpen && "border-blue-500/40 bg-slate-800/80"
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          <FolderOpen className="size-4 shrink-0 text-blue-400" aria-hidden />
          <span className="truncate font-medium">
            {activeProject?.name ?? "No project"}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 text-slate-400 transition-transform duration-150",
            isOpen && "rotate-180"
          )}
          aria-hidden
        />
      </button>

      {/* ── Dropdown ────────────────────────────────────────────────── */}
      {isOpen && (
        <div
          className={cn(
            "absolute left-0 right-0 top-full z-50 mt-1",
            "overflow-hidden rounded-lg border border-slate-700/60 bg-slate-900",
            "shadow-xl shadow-slate-950/60"
          )}
        >
          {/* Project list */}
          <ul className="max-h-64 overflow-y-auto scrollbar-thin">
            {projects.map((project) => {
              const isActive = project.id === activeProject?.id;
              const isRenaming = renamingId === project.id;
              const isConfirmingDelete = confirmDeleteId === project.id;

              return (
                <li key={project.id}>
                  <div
                    className={cn(
                      "group flex min-h-[36px] items-center gap-2 px-3 py-1.5 text-sm",
                      !isRenaming &&
                        !isConfirmingDelete &&
                        "cursor-pointer hover:bg-slate-800/60",
                      isActive && !isRenaming && "bg-blue-950/30 text-blue-200",
                      !isActive && !isRenaming && "text-slate-300"
                    )}
                    onClick={() => handleSwitchProject(project.id)}
                  >
                    {isRenaming ? (
                      /* ── Rename mode ──────────────────────────── */
                      <input
                        ref={renameInputRef}
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={handleRenameKeyDown}
                        onBlur={commitRenameIfPending}
                        onClick={(e) => e.stopPropagation()}
                        className={cn(
                          "flex-1 rounded border border-blue-500/50 bg-slate-700/60",
                          "px-2 py-0.5 text-sm text-slate-100 outline-none",
                          "focus:border-blue-400/70 focus:ring-1 focus:ring-blue-500/30"
                        )}
                      />
                    ) : isConfirmingDelete ? (
                      /* ── Delete confirm ───────────────────────── */
                      <>
                        <span className="flex-1 truncate text-xs text-red-400">
                          Delete &ldquo;{project.name}&rdquo;?
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(project.id);
                          }}
                          className="shrink-0 rounded bg-red-900/50 px-2 py-0.5 text-xs font-medium text-red-300 hover:bg-red-900/70"
                        >
                          Delete
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteId(null);
                          }}
                          className="shrink-0 rounded bg-slate-700/50 px-2 py-0.5 text-xs text-slate-400 hover:bg-slate-700/80"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      /* ── Normal row ───────────────────────────── */
                      <>
                        <span
                          className={cn(
                            "size-1.5 shrink-0 rounded-full transition-opacity",
                            isActive
                              ? "bg-blue-400 opacity-100"
                              : "opacity-0"
                          )}
                          aria-hidden
                        />
                        <span
                          className={cn(
                            "flex-1 truncate",
                            isActive && "font-medium"
                          )}
                        >
                          {project.name}
                        </span>
                        {/* Action buttons — visible on hover */}
                        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startRename(project);
                            }}
                            className="rounded p-1 text-slate-500 hover:bg-slate-700 hover:text-slate-200"
                            title="Rename"
                          >
                            <Pencil className="size-3" aria-hidden />
                          </button>
                          {projects.length > 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(project.id);
                              }}
                              className="rounded p-1 text-slate-500 hover:bg-red-950/50 hover:text-red-400"
                              title="Delete"
                            >
                              <Trash2 className="size-3" aria-hidden />
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          {/* New project footer */}
          <div className="border-t border-slate-700/60 p-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCreateProject();
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm",
                "text-slate-400 transition-colors hover:bg-slate-800/60 hover:text-slate-200"
              )}
            >
              <Plus className="size-4 shrink-0" aria-hidden />
              New Project
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
