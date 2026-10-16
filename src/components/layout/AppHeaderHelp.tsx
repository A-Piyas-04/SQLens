import { cn } from "../../lib/utils/cn";
import { headerActionButtonClass } from "./headerActionButton";

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
      <span>Help</span>
    </button>
  );
}
