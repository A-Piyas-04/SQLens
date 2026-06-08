import { useState } from "react";

import { cn } from "../../../lib/utils/cn";

type Props = {
  description: string;
  embedded?: boolean;
  expandable?: boolean;
};

export default function ProblemStatement({
  description,
  embedded = false,
  expandable = false,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const isLong = description.length > 180 || description.split("\n").length > 3;

  const body = (
    <p
      className={cn(
        "whitespace-pre-wrap text-sm leading-relaxed text-ink-secondary",
        expandable && !expanded && isLong && "line-clamp-3"
      )}
    >
      {description}
    </p>
  );

  if (embedded) {
    return (
      <div>
        {body}
        {expandable && isLong ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-1 text-xs font-medium text-accent-ink hover:underline"
          >
            {expanded ? "Show less" : "Show more"}
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      {body}
      {expandable && isLong ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-xs font-medium text-accent-ink hover:underline"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      ) : null}
    </div>
  );
}
