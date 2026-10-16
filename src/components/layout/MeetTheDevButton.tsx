import { SIDEBAR_COLLAPSED_WIDTH } from "../../constants/layout";
import { cn } from "../../lib/utils/cn";

const DEV_URL = "https://ahnaf-s-p.vercel.app/";

export default function MeetTheDevButton() {
  return (
    <a
      href={DEV_URL}
      target="_blank"
      rel="noopener noreferrer"
      style={{ width: SIDEBAR_COLLAPSED_WIDTH }}
      className={cn(
        "retro-button inline-flex shrink-0 flex-col items-center justify-center gap-0.5",
        "border border-retro-edge bg-surface-elevated px-1 py-2.5",
        "font-mono text-[9px] font-semibold uppercase leading-tight tracking-[0.06em] text-ink-secondary",
        "shadow-[2px_2px_0_0_var(--color-retro-edge)]",
        "transition-[color,background-color,transform,box-shadow]",
        "hover:-translate-x-px hover:-translate-y-px hover:bg-surface-muted hover:text-ink",
        "hover:shadow-[3px_3px_0_0_var(--color-retro-edge)]",
        "active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      )}
    >
      <span>Meet</span>
      <span>the</span>
      <span>Dev</span>
    </a>
  );
}
