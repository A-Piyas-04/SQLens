import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "../../lib/utils/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
};

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white shadow-md shadow-blue-950/45 hover:shadow-blue-900/55 border border-blue-400/35 ring-1 ring-white/10",
  secondary:
    "bg-slate-800/90 hover:bg-slate-700/90 text-slate-100 border border-slate-700/80 hover:border-slate-600 shadow-sm shadow-slate-950/35 ring-1 ring-white/[0.03]",
  ghost:
    "bg-transparent hover:bg-slate-800/70 text-slate-300 hover:text-white border border-transparent hover:border-slate-700/60",
  danger:
    "bg-slate-800/90 hover:bg-red-950/80 text-slate-200 hover:text-red-200 border border-slate-700/80 hover:border-red-800/60",
};

const sizeStyles: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs rounded-md",
  md: "px-5 py-2.5 text-sm rounded-lg",
};

export default function Button({
  variant = "secondary",
  size = "md",
  className,
  children,
  ...props
}: Props) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium",
        "transition-all duration-200 ease-out",
        "hover:-translate-y-px active:translate-y-0 active:scale-[0.97]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:active:scale-100",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
