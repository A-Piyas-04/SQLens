import { ChevronDown } from "lucide-react";

import {
  PRACTICE_CATEGORIES,
  type PracticeCategoryId,
} from "../../constants/practiceCategories";
import { cn } from "../../lib/utils/cn";

type Props = {
  activeCategory: PracticeCategoryId | null;
  onSelectCategory: (id: PracticeCategoryId | null) => void;
};

export default function PracticeNavList({
  activeCategory,
  onSelectCategory,
}: Props) {
  return (
    <nav className="border-t border-slate-800/60 pt-4" aria-label="Practice tools">
      <ul className="divide-y divide-slate-800/60">
        {PRACTICE_CATEGORIES.map((category) => {
          const isActive = activeCategory === category.id;
          const Icon = category.icon;

          return (
            <li key={category.id}>
              <button
                type="button"
                onClick={() =>
                  onSelectCategory(isActive ? null : category.id)
                }
                className={cn(
                  "flex w-full items-center justify-between gap-2 py-3 text-left",
                  "transition-colors hover:bg-slate-800/30",
                  isActive && "bg-slate-800/20"
                )}
                aria-expanded={isActive}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Icon className="size-4 shrink-0 text-blue-400" aria-hidden />
                  <span className="truncate text-sm font-semibold text-slate-100">
                    {category.title}
                  </span>
                </span>
                <ChevronDown
                  className={cn(
                    "size-4 shrink-0 text-slate-500 transition-transform duration-200",
                    isActive && "rotate-180"
                  )}
                  aria-hidden
                />
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
