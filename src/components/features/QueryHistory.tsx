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
      <Panel title="Query History">
        <div className="space-y-2">
          {items.map((item, index) => (
            <button
              key={`${index}-${item.slice(0, 24)}`}
              type="button"
              onClick={() => onSelect(item)}
              className={cn(
                "block w-full truncate rounded-lg border border-slate-800/80",
                "bg-slate-950/70 p-3 text-left text-sm text-slate-300",
                "transition-all duration-200 ease-out",
                "hover:border-slate-600/80 hover:bg-slate-800/80 hover:text-white",
                "hover:-translate-y-px hover:shadow-md hover:shadow-slate-950/40",
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
