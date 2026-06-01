import { ChevronDown } from "lucide-react";

import {
  PRACTICE_CATEGORIES,
  type PracticeCategoryId,
} from "../../constants/practiceCategories";
import { IconTile } from "../icons/IconTile";
import { cn } from "../../lib/utils/cn";

const SIDEBAR_ICON_SIZE = 26;

type Props = {
  activeCategory: PracticeCategoryId | null;
  onSelectCategory: (id: PracticeCategoryId | null) => void;
};

export default function PracticeNavList({
  activeCategory,
  onSelectCategory,
}: Props) {
  return (
    <nav className="border-t border-line pt-4" aria-label="Practice tools">
      <ul className="divide-y divide-line">
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
                  "transition-colors hover:bg-surface-muted",
                  isActive && "bg-surface-muted"
                )}
                aria-expanded={isActive}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <IconTile>
                    <Icon size={SIDEBAR_ICON_SIZE} />
                  </IconTile>
                  <span className="truncate text-sm font-semibold text-ink">
                    {category.title}
                  </span>
                </span>
                <ChevronDown
                  className={cn(
                    "size-4 shrink-0 text-ink-muted transition-transform duration-200",
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
