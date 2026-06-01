import { HelpTourIcon } from "../icons";
import { cn } from "../../lib/utils/cn";
import {
  HEADER_ACTION_ICON_SIZE,
  headerActionButtonClass,
} from "./headerActionButton";

type Props = {
  onStartTour: () => void;
};

export default function AppHeaderHelp({ onStartTour }: Props) {
  return (
    <button
      type="button"
      onClick={onStartTour}
      aria-label="Restart guided tour"
      title="Restart guided tour"
      className={cn(headerActionButtonClass)}
    >
      <HelpTourIcon size={HEADER_ACTION_ICON_SIZE} className="shrink-0" />
      <span>Help</span>
    </button>
  );
}
