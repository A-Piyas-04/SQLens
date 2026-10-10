import { Loader2, MonitorSmartphone } from "lucide-react";
import type { ReactNode } from "react";

import type { DatabaseLockStatus } from "../../lib/db/tabLock";
import Button from "../common/Button";

type Props = {
  status: Exclude<DatabaseLockStatus, "held">;
  /** What is open elsewhere, e.g. `"My First Project"`. */
  subject: string;
  onTakeOver: () => void;
  children?: ReactNode;
};

export default function DatabaseInUseScreen({ status, subject, onTakeOver, children }: Props) {
  if (status === "acquiring") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface text-ink-muted" role="status">
        <Loader2 className="size-5 animate-spin" aria-label="Opening database" />
      </div>
    );
  }

  const title =
    status === "taken" ? "Opened in another tab" : "Already open in another tab";
  const body =
    status === "taken"
      ? `${subject} is now being used in another SQLens tab. This tab stepped back so the two copies can't overwrite each other.`
      : `${subject} is open in another SQLens tab. Only one tab can use a database at a time, otherwise changes from one tab would overwrite the other.`;

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-6 text-ink">
      <div className="retro-panel w-full max-w-md space-y-4 bg-surface-raised p-6" role="alert">
        <div className="flex items-center gap-3">
          <MonitorSmartphone className="size-5 shrink-0 text-accent" aria-hidden />
          <h1 className="font-display text-lg font-semibold">{title}</h1>
        </div>
        <p className="text-sm leading-relaxed text-ink-secondary">{body}</p>
        <p className="text-xs text-ink-muted">
          This tab opens it automatically when the other tab closes or switches away.
        </p>
        <Button variant="primary" size="sm" className="w-full" onClick={onTakeOver}>
          Use it in this tab instead
        </Button>
        {children}
      </div>
    </div>
  );
}
