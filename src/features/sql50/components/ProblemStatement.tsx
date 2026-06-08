import Panel from "../../../components/common/Panel";

type Props = {
  description: string;
};

export default function ProblemStatement({ description }: Props) {
  return (
    <Panel title="Problem">
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-secondary sm:text-base">
        {description}
      </p>
    </Panel>
  );
}
