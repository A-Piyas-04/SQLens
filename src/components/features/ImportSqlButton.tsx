import { Upload } from "lucide-react";
import { useRef, useState } from "react";

import { readSqlFile } from "../../lib/sql/readSqlFile";
import Button from "../common/Button";

type Props = {
  disabled?: boolean;
  currentQuery: string;
  onImport: (sql: string, filename: string) => void;
  onError?: (message: string) => void;
};

export default function ImportSqlButton({
  disabled = false,
  currentQuery,
  onImport,
  onError,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isReading, setIsReading] = useState(false);

  function handleClick() {
    inputRef.current?.click();
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setIsReading(true);

    try {
      const sql = await readSqlFile(file);

      if (currentQuery.trim().length > 0) {
        const confirmed = window.confirm(
          `Replace current editor content with "${file.name}"?`
        );
        if (!confirmed) return;
      }

      onImport(sql, file.name);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to import file.";
      onError?.(message);
    } finally {
      setIsReading(false);
    }
  }

  return (
    <div data-tour="import-sql" className="inline-flex">
      <input
        ref={inputRef}
        type="file"
        accept=".sql,.txt,text/plain"
        className="hidden"
        aria-hidden
        onChange={handleFileChange}
      />
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={handleClick}
        disabled={disabled || isReading}
        aria-label="Import SQL file"
        className="border-accent/35 hover:border-accent/60"
      >
        <Upload className="size-3.5 text-accent-ink" aria-hidden />
        {isReading ? "Importing…" : "Import SQL"}
      </Button>
    </div>
  );
}
