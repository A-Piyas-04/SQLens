const MAX_FILE_SIZE_BYTES = 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([".sql", ".txt"]);

export class SqlFileReadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SqlFileReadError";
  }
}

function getExtension(filename: string): string {
  const dotIndex = filename.lastIndexOf(".");
  if (dotIndex < 0) return "";
  return filename.slice(dotIndex).toLowerCase();
}

export function validateSqlFile(file: File): void {
  const extension = getExtension(file.name);
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    throw new SqlFileReadError("Only .sql and .txt files are supported.");
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new SqlFileReadError("File is too large (max 1 MB).");
  }
}

export function readSqlFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      validateSqlFile(file);
    } catch (error) {
      reject(error);
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const content =
        typeof reader.result === "string" ? reader.result.trimEnd() : "";

      if (!content.trim()) {
        reject(new SqlFileReadError("File is empty."));
        return;
      }

      resolve(content);
    };

    reader.onerror = () => {
      reject(new SqlFileReadError("Failed to read file."));
    };

    reader.readAsText(file, "UTF-8");
  });
}
