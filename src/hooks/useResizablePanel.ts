import { useCallback, useEffect, useRef, useState } from "react";

import {
  SIDEBAR_DEFAULT_WIDTH,
  SIDEBAR_MAX_WIDTH,
  SIDEBAR_MIN_WIDTH,
  SIDEBAR_STORAGE_KEY,
} from "../constants/layout";

function clampWidth(width: number) {
  return Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, width));
}

function readStoredWidth() {
  if (typeof window === "undefined") {
    return SIDEBAR_DEFAULT_WIDTH;
  }

  const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
  if (!stored) {
    return SIDEBAR_DEFAULT_WIDTH;
  }

  const parsed = Number.parseInt(stored, 10);
  return Number.isFinite(parsed)
    ? clampWidth(parsed)
    : SIDEBAR_DEFAULT_WIDTH;
}

export function useResizablePanel() {
  const [width, setWidth] = useState(readStoredWidth);
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
      setWidth(clampWidth(startWidthRef.current + delta));
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
  }, [isResizing]);

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(width));
  }, [width]);

  return {
    width,
    isResizing,
    onResizeStart,
  };
}
