import { NotesIcon } from "../icons";
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
      className={cn(headerActionButtonClass)}
    >
      <NotesIcon size={HEADER_ACTION_ICON_SIZE} className="shrink-0" />
      <span>Notes</span>
    </button>
  );
}
