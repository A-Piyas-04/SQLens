import { BellIcon } from "../icons";
import { cn } from "../../lib/utils/cn";
import {
  HEADER_ACTION_ICON_SIZE,
  headerActionButtonClass,
} from "./headerActionButton";

type Props = {
  onOpenNotes: () => void;
};

export default function AppHeaderNotes({ onOpenNotes }: Props) {
  return (
    <button
      type="button"
      onClick={onOpenNotes}
      aria-label="Open notes"
      title="Good to know"
      className={cn(
        headerActionButtonClass,
        "relative w-9 justify-center px-0"
      )}
    >
      <BellIcon size={HEADER_ACTION_ICON_SIZE} className="shrink-0" />
      <span
        className="absolute right-1 top-1 size-1.5 rounded-full bg-danger-ink ring-1 ring-surface-elevated"
        aria-hidden
      />
    </button>
  );
}
