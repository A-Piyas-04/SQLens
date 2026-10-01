type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
};

export default function AiSchemaToggle({ checked, onChange, disabled = false }: Props) {
  return (
    <label className="flex cursor-pointer items-start gap-2">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-4 shrink-0 accent-[var(--color-accent)] disabled:opacity-50"
      />
      <span className="text-xs leading-relaxed text-ink-muted">
        <span className="font-medium text-ink-secondary">Include current schema</span>
        <span className="block">
          Table and column information will be included in the AI request.
        </span>
      </span>
    </label>
  );
}
