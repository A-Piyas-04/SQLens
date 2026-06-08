import { lazy, Suspense } from "react";

import type { SimulatorSnapshot, StageDiff } from "../../../lib/simulator/types/snapshotTypes";

const SimulatorPlaybackModal = lazy(
  () => import("../../../components/simulator/playback/SimulatorPlaybackModal")
);

type Props = {
  snapshots: SimulatorSnapshot[];
  diffs: StageDiff[];
  originalSql: string;
  onClose: () => void;
};

export default function Sql50SimulationModal({
  snapshots,
  diffs,
  originalSql,
  onClose,
}: Props) {
  return (
    <Suspense fallback={null}>
      <SimulatorPlaybackModal
        snapshots={snapshots}
        diffs={diffs}
        originalSql={originalSql}
        onClose={onClose}
      />
    </Suspense>
  );
}
