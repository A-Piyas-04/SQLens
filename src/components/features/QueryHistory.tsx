import AnimatedReveal from "../common/AnimatedReveal";
import Panel from "../common/Panel";
import { cn } from "../../lib/utils/cn";

type Props = {
  items: string[];
  onSelect: (query: string) => void;
};

export default function QueryHistory({ items, onSelect }: Props) {
  if (items.length === 0) {
    return null;
  }

  return (
    <AnimatedReveal>
      <Panel title="Query History" raised>
        <div className="space-y-2">
          {items.map((item, index) => (
            <button
              key={`${index}-${item.slice(0, 24)}`}
              type="button"
              onClick={() => onSelect(item)}
              className={cn(
                "block w-full truncate rounded-sm border border-line",
                "bg-surface-muted p-3 text-left text-sm text-ink-secondary",
                "transition-all duration-200 ease-out",
                "hover:border-line-strong hover:bg-surface-muted hover:text-ink",
                "hover:border-line-strong",
                "active:scale-[0.99] active:translate-y-0"
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </Panel>
    </AnimatedReveal>
  );
}
