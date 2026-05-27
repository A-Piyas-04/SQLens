import { Copy, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { cn } from "../../lib/utils/cn";
import Button from "../common/Button";

type Props = {
  text: string;
  onClose: () => void;
};

export default function DesignedTextModal({ text, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [text]);

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        aria-label="Close designed text"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="designed-text-modal-title"
        className={cn(
          "relative z-10 flex w-full max-w-3xl flex-col",
          "max-h-[min(90vh,720px)] overflow-hidden",
          "rounded-xl border border-slate-700/80 bg-slate-900 shadow-2xl shadow-slate-950/60"
        )}
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-800/80 px-4 py-3 sm:px-5">
          <div className="min-w-0 pr-2">
            <h2
              id="designed-text-modal-title"
              className="text-sm font-semibold text-slate-100 sm:text-base"
            >
              Designed Text
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Paste into AI chat — no image or PDF needed
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "shrink-0 rounded-lg p-2 text-slate-400",
              "transition-colors hover:bg-slate-800 hover:text-slate-100",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
            )}
            aria-label="Close"
          >
            <X className="size-5" aria-hidden />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-auto px-4 py-3 sm:px-5">
          <pre
            className={cn(
              "whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-slate-200",
              "sm:text-sm"
            )}
          >
            {text}
          </pre>
        </div>

        <footer className="shrink-0 border-t border-slate-800/80 bg-slate-900/95 px-4 py-4 sm:px-5">
          <Button
            variant="primary"
            size="md"
            className="w-full text-sm sm:w-auto sm:min-w-[10rem]"
            onClick={() => void handleCopy()}
          >
            <Copy className="size-4" aria-hidden />
            {copied ? "Copied!" : "Copy entire text"}
          </Button>
        </footer>
      </div>
    </div>,
    document.body
  );
}
