import { ShieldAlert } from "lucide-react";

import Button from "../common/Button";

type Props = {
  onContinue: () => void;
  onCancel: () => void;
};

export default function AiPrivacyNotice({ onContinue, onCancel }: Props) {
  return (
    <div
      role="alertdialog"
      aria-labelledby="ai-privacy-notice-title"
      className="retro-inset space-y-3 border-accent px-4 py-3"
    >
      <p
        id="ai-privacy-notice-title"
        className="flex items-center gap-1.5 text-sm font-semibold text-ink"
      >
        <ShieldAlert className="size-4 shrink-0 text-accent-ink" aria-hidden />
        AI requests are processed by Google Gemini.
      </p>
      <p className="text-xs leading-relaxed text-ink-secondary">
        Your prompt and related context and, when enabled, a summary of your schema
        (table and column names only) are sent to Google. Table rows are never sent.
      </p>
      <p className="text-xs leading-relaxed text-ink-secondary">
        Do not include passwords, credentials, production secrets, or sensitive personal data.
      </p>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="danger-solid" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" variant="primary" size="sm" onClick={onContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
}
