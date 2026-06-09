import { useCallback, useEffect, useRef, useState } from "react";

import {
  SIDEBAR_DEFAULT_WIDTH,
  SIDEBAR_MAX_WIDTH,
  SIDEBAR_MIN_WIDTH,
  SIDEBAR_STORAGE_KEY,
} from "../constants/layout";

export type ResizablePanelEdge = "left" | "right";

export type ResizablePanelOptions = {
  minWidth?: number;
  maxWidth?: number;
  defaultWidth?: number;
  storageKey?: string;
  /** Handle on the right edge (left sidebar) or left edge (right sidebar). */
  edge?: ResizablePanelEdge;
};

type ResolvedOptions = Required<ResizablePanelOptions>;

function resolveOptions(options?: ResizablePanelOptions): ResolvedOptions {
  return {
    minWidth: options?.minWidth ?? SIDEBAR_MIN_WIDTH,
    maxWidth: options?.maxWidth ?? SIDEBAR_MAX_WIDTH,
    defaultWidth: options?.defaultWidth ?? SIDEBAR_DEFAULT_WIDTH,
    storageKey: options?.storageKey ?? SIDEBAR_STORAGE_KEY,
    edge: options?.edge ?? "right",
  };
}

function clampWidth(width: number, minWidth: number, maxWidth: number) {
  return Math.min(maxWidth, Math.max(minWidth, width));
}

function readStoredWidth(options: ResolvedOptions) {
  if (typeof window === "undefined") {
    return options.defaultWidth;
  }

  const stored = window.localStorage.getItem(options.storageKey);
  if (!stored) {
    return options.defaultWidth;
  }

  const parsed = Number.parseInt(stored, 10);
  return Number.isFinite(parsed)
    ? clampWidth(parsed, options.minWidth, options.maxWidth)
    : options.defaultWidth;
}

export function useResizablePanel(options?: ResizablePanelOptions) {
  const resolved = resolveOptions(options);
  const {
    minWidth,
    maxWidth,
    storageKey,
    edge,
  } = resolved;

  const [width, setWidth] = useState(() => readStoredWidth(resolved));
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(width);

  const onResizeStart = useCallback(
    (clientX: number) => {
      startXRef.current = clientX;
      startWidthRef.current = width;
      setIsResizing(true);
    },
    [width]
  );

  useEffect(() => {
    if (!isResizing) {
      return;
    }

    function handleMouseMove(event: MouseEvent) {
      const delta = event.clientX - startXRef.current;
      const nextWidth =
        edge === "right"
          ? startWidthRef.current + delta
          : startWidthRef.current - delta;
      setWidth(clampWidth(nextWidth, minWidth, maxWidth));
    }

    function handleMouseUp() {
      setIsResizing(false);
    }

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [edge, isResizing, maxWidth, minWidth]);

  useEffect(() => {
    window.localStorage.setItem(storageKey, String(width));
  }, [storageKey, width]);

  return {
    width,
    isResizing,
    onResizeStart,
  };
}
