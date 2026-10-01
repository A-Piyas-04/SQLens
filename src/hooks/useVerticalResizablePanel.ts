import { useCallback, useEffect, useRef, useState } from "react";

import {
  SQL50_RESULTS_DEFAULT_HEIGHT,
  SQL50_RESULTS_MAX_HEIGHT_RATIO,
  SQL50_RESULTS_MIN_HEIGHT,
} from "../constants/layout";
import { safeSetLocalStorage } from "../lib/storage/safeStorage";

export type VerticalResizablePanelOptions = {
  minHeight?: number;
  maxHeight?: number;
  defaultHeight?: number;
  storageKey?: string;
};

function resolveResultsMaxHeight(maxHeight?: number) {
  if (maxHeight !== undefined && maxHeight > 0) {
    return maxHeight;
  }

  if (typeof window === "undefined") {
    return SQL50_RESULTS_DEFAULT_HEIGHT;
  }

  return Math.min(
    Math.floor(window.innerHeight * SQL50_RESULTS_MAX_HEIGHT_RATIO),
    Math.floor(window.innerHeight * 0.45)
  );
}

function clampHeight(
  height: number,
  minHeight: number,
  maxHeight: number
) {
  return Math.min(maxHeight, Math.max(minHeight, height));
}

function readStoredHeight(options: Required<VerticalResizablePanelOptions>) {
  const maxHeight = resolveResultsMaxHeight(options.maxHeight);

  if (typeof window === "undefined") {
    return options.defaultHeight;
  }

  const stored = window.localStorage.getItem(options.storageKey);
  if (!stored) {
    return clampHeight(options.defaultHeight, options.minHeight, maxHeight);
  }

  const parsed = Number.parseInt(stored, 10);
  return Number.isFinite(parsed)
    ? clampHeight(parsed, options.minHeight, maxHeight)
    : clampHeight(options.defaultHeight, options.minHeight, maxHeight);
}

export function useVerticalResizablePanel(
  options?: VerticalResizablePanelOptions
) {
  const resolved: Required<VerticalResizablePanelOptions> = {
    minHeight: options?.minHeight ?? SQL50_RESULTS_MIN_HEIGHT,
    maxHeight: options?.maxHeight ?? 0,
    defaultHeight: options?.defaultHeight ?? SQL50_RESULTS_DEFAULT_HEIGHT,
    storageKey: options?.storageKey ?? "sql50-results-height",
  };

  const [height, setHeight] = useState(() => readStoredHeight(resolved));
  const [isResizing, setIsResizing] = useState(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(height);

  const getMaxHeight = useCallback(() => {
    return resolveResultsMaxHeight(
      resolved.maxHeight > 0 ? resolved.maxHeight : undefined
    );
  }, [resolved.maxHeight]);

  const onResizeStart = useCallback(
    (clientY: number) => {
      startYRef.current = clientY;
      startHeightRef.current = height;
      setIsResizing(true);
    },
    [height]
  );

  useEffect(() => {
    if (!isResizing) {
      return;
    }

    function handleMouseMove(event: MouseEvent) {
      const delta = event.clientY - startYRef.current;
      const nextHeight = startHeightRef.current - delta;
      setHeight(
        clampHeight(nextHeight, resolved.minHeight, getMaxHeight())
      );
    }

    function handleMouseUp() {
      setIsResizing(false);
    }

    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [getMaxHeight, isResizing, resolved.minHeight]);

  useEffect(() => {
    safeSetLocalStorage(resolved.storageKey, String(height));
  }, [height, resolved.storageKey]);

  useEffect(() => {
    function handleWindowResize() {
      setHeight((current) =>
        clampHeight(current, resolved.minHeight, getMaxHeight())
      );
    }

    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, [getMaxHeight, resolved.minHeight]);

  return {
    height,
    isResizing,
    onResizeStart,
  };
}
