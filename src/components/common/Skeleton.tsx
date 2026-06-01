import { cn } from "../../lib/utils/cn";

type Props = {
  className?: string;
};

/** Shimmer placeholder block for loading states */
export default function Skeleton({ className }: Props) {
  return (
    <div
      className={cn("skeleton-shimmer rounded-sm bg-surface-muted", className)}
      aria-hidden
    />
  );
}
