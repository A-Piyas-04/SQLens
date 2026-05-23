import type { ReactNode } from "react";

import { cn } from "../../lib/utils/cn";

type Props = {
  children: ReactNode;
  className?: string;
};

export default function AnimatedReveal({ children, className }: Props) {
  return (
    <div className={cn("animate-fade-in-up motion-reduce:animate-none", className)}>
      {children}
    </div>
  );
}
