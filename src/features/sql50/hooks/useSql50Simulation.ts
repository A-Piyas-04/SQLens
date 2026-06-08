import { useCallback, useState } from "react";
import type { PGlite } from "@electric-sql/pglite";

import { generateSnapshots } from "../../../lib/simulator/snapshot/generateSnapshots";
import type { SimulatorSnapshot, StageDiff } from "../../../lib/simulator/types/snapshotTypes";

type SimulationData = {
  snapshots: SimulatorSnapshot[];
  diffs: StageDiff[];
  originalSql: string;
};

export function useSql50Simulation(db: PGlite) {
  const [isPreparing, setIsPreparing] = useState(false);
  const [error, setError] = useState("");
  const [simulation, setSimulation] = useState<SimulationData | null>(null);

  const clearError = useCallback(() => setError(""), []);

  const prepareSimulation = useCallback(
    async (query: string, selectedText: string) => {
      const sql = selectedText.trim() || query.trim();
      if (!sql) {
        setError("No SQL to simulate.");
        return false;
      }

      setIsPreparing(true);
      setError("");

      const result = await generateSnapshots({ sql, db });

      setIsPreparing(false);

      if (!result.success) {
        setError(result.error);
        return false;
      }

      setSimulation({
        snapshots: result.snapshots,
        diffs: result.diffs,
        originalSql: sql,
      });
      return true;
    },
    [db]
  );

  const closeSimulation = useCallback(() => setSimulation(null), []);

  return {
    isPreparing,
    error,
    simulation,
    prepareSimulation,
    closeSimulation,
    clearError,
  };
}
