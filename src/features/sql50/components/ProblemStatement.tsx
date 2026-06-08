import Panel from "../../../components/common/Panel";
import { cn } from "../../../lib/utils/cn";

type Props = {
  description: string;
  embedded?: boolean;
};

export default function ProblemStatement({ description, embedded = false }: Props) {
  if (embedded) {
    return (
      <p
        className={cn(
          "whitespace-pre-wrap text-sm leading-relaxed text-ink-secondary"
        )}
      >
        {description}
      </p>
    );
  }

  return (
    <Panel title="Problem">
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-secondary sm:text-base">
        {description}
      </p>
    </Panel>
  );
}
