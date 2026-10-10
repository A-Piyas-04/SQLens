// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const deleteAllSqlensDatabases = vi.fn().mockResolvedValue(undefined);
vi.mock("../../db/createDatabase", () => ({
  deleteAllSqlensDatabases: (...args: unknown[]) => deleteAllSqlensDatabases(...args),
}));

import { saveQueryToHistory, getQueryHistory, MAX_HISTORY_ITEM_CHARS } from "../../../hooks/useQueryHistory";
import {
  clearAllLocalData,
  createProject,
  deleteProject,
  draftKey,
  getProjects,
  historyKey,
  MAX_DRAFT_AUTOSAVE_CHARS,
  setProjectDraft,
} from "../../projects/projectStore";
import { safeSetLocalStorage } from "../safeStorage";

describe("local data safety", () => {
  beforeEach(() => {
    localStorage.clear();
    deleteAllSqlensDatabases.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not throw when localStorage is full", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("quota", "QuotaExceededError");
    });

    expect(safeSetLocalStorage("sqlens-x", "1")).toBe(false);
    expect(() => createProject("Full")).not.toThrow();
    expect(setProjectDraft("p1", "SELECT 1;")).toBe("failed");
    expect(() => saveQueryToHistory("p1", "SELECT 1;")).not.toThrow();
  });

  it("skips autosave for pathological drafts without blocking normal ones", () => {
    expect(setProjectDraft("p1", "SELECT 1;")).toBe("saved");
    expect(setProjectDraft("p1", "x".repeat(MAX_DRAFT_AUTOSAVE_CHARS + 1))).toBe("too-large");
    expect(localStorage.getItem(draftKey("p1"))).toBe("SELECT 1;");
  });

  it("does not store oversized queries in history", () => {
    saveQueryToHistory("p1", "SELECT 1;");
    saveQueryToHistory("p1", "x".repeat(MAX_HISTORY_ITEM_CHARS + 1));
    expect(getQueryHistory("p1")).toEqual(["SELECT 1;"]);
  });

  it("delete project removes its metadata, draft, and history", () => {
    const keep = createProject("Keep");
    const remove = createProject("Remove");
    setProjectDraft(remove.id, "SELECT 2;");
    saveQueryToHistory(remove.id, "SELECT 2;");

    deleteProject(remove.id);

    expect(getProjects().map((p) => p.id)).toEqual([keep.id]);
    expect(localStorage.getItem(draftKey(remove.id))).toBeNull();
    expect(localStorage.getItem(historyKey(remove.id))).toBeNull();
  });

  it("returns only valid projects and backs up an unreadable project list", () => {
    localStorage.setItem("sqlens-projects", "{not json");
    expect(getProjects()).toEqual([]);
    expect(localStorage.getItem("sqlens-projects-unreadable-backup")).toBe("{not json");

    const valid = { id: "p1", name: "One", createdAt: "", updatedAt: "" };
    localStorage.setItem("sqlens-projects", JSON.stringify([valid, null, { name: "no id" }]));
    expect(getProjects()).toEqual([valid]);

    localStorage.setItem("sqlens-projects", JSON.stringify({ id: "p1" }));
    expect(getProjects()).toEqual([]);
  });

  it("clear local data removes every SQLens key and database but nothing else", async () => {
    const project = createProject("One");
    setProjectDraft(project.id, "SELECT 1;");
    localStorage.setItem("sqlens-active-project", project.id);
    localStorage.setItem("sqlens-practice-progress-sql50", "{}");
    localStorage.setItem("sqlens-onboarding-complete", "1");
    localStorage.setItem("sqlens-ai-privacy-ack", "true");
    localStorage.setItem("sqlens-sidebar-width", "300");
    localStorage.setItem("simulator:lessonPanelWidth", "320");
    localStorage.setItem("sql50-results-height", "240");
    localStorage.setItem("unrelated-app-key", "keep");

    await clearAllLocalData();

    expect(Object.keys(localStorage)).toEqual(["unrelated-app-key"]);
    expect(deleteAllSqlensDatabases).toHaveBeenCalledWith([project.id, "practice-sql50"]);
  });
});
