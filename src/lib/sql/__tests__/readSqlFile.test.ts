import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  readSqlFile,
  SqlFileReadError,
  validateSqlFile,
} from "../readSqlFile";

let mockResult: string | ArrayBuffer | null = "SELECT 1;";
let shouldFailRead = false;

function createFile(name: string, content: string, sizeOverride?: number): File {
  const blob = new Blob([content], { type: "text/plain" });
  const file = new File([blob], name, { type: "text/plain" });

  if (sizeOverride !== undefined) {
    Object.defineProperty(file, "size", { value: sizeOverride });
  }

  return file;
}

class MockFileReader {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  result: string | ArrayBuffer | null = null;

  readAsText(_file: File, _encoding?: string) {
    queueMicrotask(() => {
      if (shouldFailRead) {
        this.onerror?.();
        return;
      }

      this.result = mockResult;
      this.onload?.();
    });
  }
}

describe("validateSqlFile", () => {
  it("accepts .sql and .txt extensions", () => {
    expect(() => validateSqlFile(createFile("queries.sql", "SELECT 1;"))).not.toThrow();
    expect(() => validateSqlFile(createFile("notes.TXT", "SELECT 1;"))).not.toThrow();
  });

  it("rejects unsupported extensions", () => {
    expect(() => validateSqlFile(createFile("data.json", "{}"))).toThrow(
      new SqlFileReadError("Only .sql and .txt files are supported.")
    );
  });

  it("rejects files larger than 1 MB", () => {
    expect(() =>
      validateSqlFile(createFile("big.sql", "SELECT 1;", 1024 * 1024 + 1))
    ).toThrow(new SqlFileReadError("File is too large (max 1 MB)."));
  });
});

describe("readSqlFile", () => {
  beforeEach(() => {
    vi.stubGlobal("FileReader", MockFileReader);
    mockResult = "SELECT 1;\n\n  ";
    shouldFailRead = false;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns trimmed trailing whitespace from file content", async () => {
    await expect(readSqlFile(createFile("query.sql", "ignored"))).resolves.toBe(
      "SELECT 1;"
    );
  });

  it("rejects empty file content", async () => {
    mockResult = "   \n  ";

    await expect(readSqlFile(createFile("empty.sql", "ignored"))).rejects.toThrow(
      new SqlFileReadError("File is empty.")
    );
  });

  it("rejects unsupported extensions before reading", async () => {
    await expect(readSqlFile(createFile("data.csv", "a,b"))).rejects.toThrow(
      new SqlFileReadError("Only .sql and .txt files are supported.")
    );
  });

  it("rejects read failures", async () => {
    shouldFailRead = true;

    await expect(readSqlFile(createFile("query.sql", "SELECT 1;"))).rejects.toThrow(
      new SqlFileReadError("Failed to read file.")
    );
  });
});
