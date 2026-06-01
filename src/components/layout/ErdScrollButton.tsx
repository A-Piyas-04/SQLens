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
      className={cn("font-semibold text-accent-ink", className)}
    >
      View ERD
    </Button>
  );
}
