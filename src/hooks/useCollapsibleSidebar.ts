import { useCallback, useEffect, useState } from "react";

import { SIDEBAR_COLLAPSED_STORAGE_KEY } from "../constants/layout";

function readCollapsed(storageKey: string) {
  try {
    return window.localStorage.getItem(storageKey) === "1";
  } catch {
    return false;
  }
}

export function useCollapsibleSidebar(storageKey = SIDEBAR_COLLAPSED_STORAGE_KEY) {
  const [collapsed, setCollapsed] = useState(() => readCollapsed(storageKey));

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, collapsed ? "1" : "0");
    } catch {
      /* storage unavailable */
    }
  }, [collapsed, storageKey]);

  const toggle = useCallback(() => setCollapsed((prev) => !prev), []);

  return { collapsed, setCollapsed, toggle };
}
