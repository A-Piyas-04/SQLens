import { Panel, useReactFlow } from "@xyflow/react";
import { ChevronDown, Download } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import type { SchemaTable } from "../../lib/db/schema";
import { buildDesignedText } from "../../lib/erd/buildDesignedText";
import { captureErdViewport } from "../../lib/erd/export/captureErdViewport";
import { downloadFile } from "../../lib/erd/export/downloadFile";
import { exportErdPdf } from "../../lib/erd/export/exportErdPdf";
import { cn } from "../../lib/utils/cn";
import Button from "../common/Button";
import DesignedTextModal from "./DesignedTextModal";

type Props = {
  tables: SchemaTable[];
  containerRef: React.RefObject<HTMLDivElement | null>;
};

type ExportOption = "pdf" | "png" | "svg" | "text";

const DESIGNED_TEXT_HINT =
  "Copy, Paste text to AI chat, no need for it to analyze img or pdf";

const MENU_ITEMS: { id: ExportOption; label: string; hint?: string }[] = [
  { id: "pdf", label: "as pdf" },
  { id: "png", label: "as png" },
  { id: "svg", label: "as svg" },
  { id: "text", label: "Designed Text", hint: DESIGNED_TEXT_HINT },
];

export default function ErdExportMenu({ tables, containerRef }: Props) {
  const { getNodes, getEdges } = useReactFlow();
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [designedText, setDesignedText] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const closeMenu = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeMenu();
    }

    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isOpen, closeMenu]);

  function getViewportElement(): HTMLElement | null {
    const root = containerRef.current;
    if (!root) return null;
    return root.querySelector<HTMLElement>(".react-flow__viewport");
  }

  function handleExport(option: ExportOption) {
    if (tables.length === 0) return;

    if (option === "text") {
      closeMenu();
      setDesignedText(buildDesignedText(tables));
      return;
    }

    if (isExporting) return;

    void runVisualExport(option);
  }

  async function runVisualExport(option: Exclude<ExportOption, "text">) {
    setIsExporting(true);
    closeMenu();

    try {
      const viewportElement = getViewportElement();
      if (!viewportElement) return;

      const nodes = getNodes();
      const edges = getEdges();
      const captureBase = { nodes, edges, viewportElement };

      if (option === "pdf") {
        await exportErdPdf(captureBase);
        return;
      }

      const format = option === "png" ? "png" : "svg";
      const { blob } = await captureErdViewport({ ...captureBase, format });
      const filename = format === "png" ? "erd-diagram.png" : "erd-diagram.svg";
      const mimeType = format === "png" ? "image/png" : "image/svg+xml";
      downloadFile(new Blob([blob], { type: mimeType }), filename);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <>
      {designedText ? (
        <DesignedTextModal text={designedText} onClose={() => setDesignedText(null)} />
      ) : null}

      <Panel position="top-right" className="!m-3">
      <div ref={menuRef} className="relative">
        <Button
          variant="ghost"
          size="sm"
          disabled={isExporting}
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          aria-haspopup="menu"
        >
          <Download className="size-3.5" aria-hidden />
          {isExporting ? "Exporting…" : "Export"}
          <ChevronDown
            className={cn("size-3.5 transition-transform", isOpen && "rotate-180")}
            aria-hidden
          />
        </Button>

        {isOpen ? (
          <div
            role="menu"
            className={cn(
              "absolute right-0 top-full z-50 mt-1 min-w-[10.5rem]",
              "rounded-sm border border-line bg-surface-elevated py-1 shadow-md",
              "shadow-sm "
            )}
          >
            {MENU_ITEMS.map((item) => (
              <div key={item.id} className={cn("relative", item.hint && "group")}>
                <button
                  type="button"
                  role="menuitem"
                  aria-describedby={item.hint ? `erd-export-hint-${item.id}` : undefined}
                  className={cn(
                    "w-full px-3 py-2 text-left text-xs text-ink",
                    "transition-colors hover:bg-surface-muted hover:text-ink",
                    item.hint && "hover:bg-accent-muted"
                  )}
                  onClick={() => handleExport(item.id)}
                >
                  {item.label}
                </button>
                {item.hint ? (
                  <p
                    id={`erd-export-hint-${item.id}`}
                    role="tooltip"
                    className={cn(
                      "pointer-events-none absolute right-full top-1/2 z-[60] mr-2 w-52",
                      "-translate-y-1/2 rounded-sm border border-line",
                      "bg-surface-elevated px-3 py-2.5 text-sm font-bold leading-snug text-ink",
                      "shadow-sm",
                      "opacity-0 transition-opacity duration-150",
                      "group-hover:opacity-100"
                    )}
                  >
                    {item.hint}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </Panel>
    </>
  );
}
