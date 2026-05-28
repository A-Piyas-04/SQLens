import Button from "../common/Button";
import { cn } from "../../lib/utils/cn";

type Props = {
  targetId?: string;
  className?: string;
};

export default function ErdScrollButton({
  targetId = "erd-section",
  className,
}: Props) {
  function scrollToErd() {
    document.getElementById(targetId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={scrollToErd}
      aria-label="Scroll to Entity Relationship Diagram"
      className={cn(
        "border-amber-500/25 bg-amber-500/10 font-bold text-yellow-400 shadow-amber-950/20",
        "hover:border-amber-400/40 hover:bg-amber-500/15 hover:text-yellow-300",
        className
      )}
    >
      View ERD
    </Button>
  );
}
