import { useCallback, useEffect, useSyncExternalStore } from "react";

import type { SchemaTable } from "../lib/db/schema";
import {
  getDatabaseLockStatus,
  onTabMessage,
  postTabMessage,
  subscribeDatabaseLock,
  takeOverDatabase,
} from "../lib/db/tabLock";

/** Only render database-using UI while `status === "held"`. */
export function useDatabaseTabLock(dbId: string) {
  const subscribe = useCallback(
    (listener: () => void) => subscribeDatabaseLock(dbId, listener),
    [dbId]
  );
  const status = useSyncExternalStore(subscribe, () => getDatabaseLockStatus(dbId));
  const takeOver = useCallback(() => takeOverDatabase(dbId), [dbId]);
  return { status, takeOver };
}

/** The owning tab answers schema requests (e.g. from the fullscreen ERD tab) and pushes updates. */
export function useShareSchemaWithOtherTabs(dbId: string, tables: SchemaTable[]) {
  useEffect(() => {
    postTabMessage({ type: "schema", dbId, tables });
  }, [dbId, tables]);

  useEffect(
    () =>
      onTabMessage((message) => {
        if (message.type === "schema-request" && message.dbId === dbId) {
          postTabMessage({ type: "schema", dbId, tables });
        }
      }),
    [dbId, tables]
  );
}
