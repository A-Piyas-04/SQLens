import { Play, RotateCcw } from "lucide-react";

import Button from "../common/Button";

type Props = {
  isRunning: boolean;
  onRun: () => void;
  onReset: () => void;
};

export default function QueryToolbar({ isRunning, onRun, onReset }: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Button
        variant="primary"
        onClick={onRun}
        disabled={isRunning}
        className="sm:min-w-[160px]"
      >
        <Play className="size-4" aria-hidden />
        {isRunning ? "Running..." : "Run Query"}
      </Button>

      <Button variant="danger" onClick={onReset} disabled={isRunning}>
        <RotateCcw className="size-4" aria-hidden />
        Reset DB
      </Button>
    </div>
  );
}
