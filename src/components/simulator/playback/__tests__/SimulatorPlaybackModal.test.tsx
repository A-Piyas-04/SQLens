// @vitest-environment jsdom
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SimulatorPlaybackModal, { LESSON_COLLAPSED_KEY, LESSON_RAIL_WIDTH } from "../SimulatorPlaybackModal";
import { LESSON_PANEL_ID } from "../LessonPanel";
import { DWELL_MS } from "../../../../hooks/useSimulatorPlayback";
import { PLAYBACK_QUERIES } from "../__fixtures__/playbackQueries";
import {
  advance,
  advanceUntil,
  expectSettledMatchesSnapshot,
  installDomStubs,
  recorded,
  simulate,
  useFakeTime,
  type Simulation,
} from "./playbackTestUtils";

vi.mock("../SqlContextPanel", () => ({
  default: () => <div data-testid="sql-context" />,
}));

const sims = new Map<string, Simulation>();

beforeAll(async () => {
  for (const id of ["A-where", "G-inner-join", "full"]) {
    sims.set(id, await simulate(PLAYBACK_QUERIES.find((q) => q.id === id)!.sql));
  }
}, 120_000);

beforeEach(() => {
  installDomStubs();
  useFakeTime();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function openModal(id: string, onClose = vi.fn()) {
  const sim = sims.get(id)!;
  const utils = render(
    <SimulatorPlaybackModal snapshots={sim.snapshots} diffs={sim.diffs} originalSql={sim.sql} onClose={onClose} />
  );
  return { ...utils, sim, onClose };
}

function stageNumber(): number {
  const m = document.body.textContent?.match(/Stage (\d+) of/);
  return m ? Number(m[1]) : -1;
}

const phaseLabel = () => document.querySelector("[data-phase-label]")?.textContent;
const stageRoot = () => document.querySelector<HTMLElement>("[data-stage-root]")!;

async function waitDone() {
  await advanceUntil(() => phaseLabel() === "Done", 60000);
}

describe("autoplay waits for stage completion (plan §5.6)", () => {
  it("advances only after the active stage completes and the dwell elapses", async () => {
    openModal("full");
    fireEvent.click(screen.getByRole("button", { name: "Switch to autoplay" }));
    await waitDone();
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    // Stage 1 was already complete → dwell, then stage 2 starts.
    await advance(DWELL_MS[1] + 10);
    expect(stageNumber()).toBe(2);
    for (let expected = 2; expected <= sims.get("full")!.snapshots.length; expected++) {
      expect(stageNumber()).toBe(expected);
      // While the stage animation runs the stage never changes.
      await advanceUntil(() => {
        expect(stageNumber()).toBe(expected);
        return phaseLabel() === "Done";
      }, 60000, 25);
      if (expected === sims.get("full")!.snapshots.length) break;
      await advance(DWELL_MS[1] - 100);
      expect(stageNumber()).toBe(expected);
      await advance(150);
    }
    const sim = sims.get("full")!;
    expectSettledMatchesSnapshot(stageRoot().parentElement!, sim.snapshots.at(-1)!);
  });

  it("R.7 JOIN cannot auto-advance before completion", async () => {
    openModal("G-inner-join");
    fireEvent.click(screen.getByRole("button", { name: "Switch to autoplay" }));
    await waitDone();
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    await advanceUntil(() => stageNumber() === 2, 10000, 10);
    let joinMs = 0;
    await advanceUntil(() => {
      expect(stageNumber()).toBe(2);
      joinMs += 10;
      return phaseLabel() === "Done";
    }, 60000, 10);
    expect(joinMs).toBeGreaterThan(DWELL_MS[1]);
    await advance(DWELL_MS[1] + 50);
    expect(stageNumber()).toBe(3);
  });
});

describe("transport controls", () => {
  it("Space pauses an active animation and resumes it", async () => {
    openModal("A-where");
    fireEvent.click(screen.getByRole("button", { name: "Next stage" }));
    await advance(300);
    expect(phaseLabel()).not.toBe("Done");
    fireEvent.keyDown(window, { key: " " });
    await advance(1);
    expect(screen.getByRole("button", { name: "Resume" })).toBeTruthy();
    const html = stageRoot().innerHTML;
    await advance(5000);
    expect(stageRoot().innerHTML).toBe(html);
    fireEvent.keyDown(window, { key: " " });
    await waitDone();
    expect(stageNumber()).toBe(2);
  });

  it("navigation during an animation cancels it and starts the next stage", async () => {
    const { sim } = openModal("full");
    fireEvent.click(screen.getByRole("button", { name: "Next stage" }));
    await advance(200);
    fireEvent.click(screen.getByRole("button", { name: "Next stage" }));
    await waitDone();
    expect(stageNumber()).toBe(3);
    expectSettledMatchesSnapshot(stageRoot().parentElement!, sim.snapshots[2]);
  });

  it("backward navigation animates back to the previous snapshot", async () => {
    const { sim } = openModal("A-where");
    fireEvent.click(screen.getByRole("button", { name: "Next stage" }));
    await waitDone();
    const before = recorded.length;
    fireEvent.click(screen.getByRole("button", { name: "Previous stage" }));
    await waitDone();
    expect(recorded.length).toBeGreaterThan(before);
    expectSettledMatchesSnapshot(stageRoot().parentElement!, sim.snapshots[0]);
  });

  it("Replay restarts the current stage", async () => {
    openModal("A-where");
    fireEvent.click(screen.getByRole("button", { name: "Next stage" }));
    await waitDone();
    fireEvent.click(screen.getByRole("button", { name: "Replay stage" }));
    await advance(50);
    expect(phaseLabel()).not.toBe("Done");
    await waitDone();
  });

  it("Focus on changes toggle persists and re-lays out the stage", async () => {
    openModal("A-where");
    await waitDone();
    const btn = screen.getByRole("button", { name: "Focus on changes" });
    expect(btn.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(btn);
    await waitDone();
    expect(btn.getAttribute("aria-pressed")).toBe("false");
    expect(localStorage.getItem("simulator:focusOnChanges")).toBe("0");
  });
});

describe("T.5 / R.10 Lesson panel collapse", () => {
  it("is expanded by default with an accessible toggle", () => {
    openModal("A-where");
    const toggle = screen.getByRole("button", { name: "Collapse lesson panel" });
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(toggle.getAttribute("aria-controls")).toBe(LESSON_PANEL_ID);
    expect(document.getElementById(LESSON_PANEL_ID)?.hidden).toBe(false);
    expect(document.querySelector("[data-lesson-rail]")).toBeNull();
  });

  it("collapses to a rail without unmounting content, expands the centre, persists", () => {
    openModal("A-where");
    const content = document.getElementById(LESSON_PANEL_ID)!;
    fireEvent.click(screen.getByRole("button", { name: "Collapse lesson panel" }));
    const rail = document.querySelector("[data-lesson-rail]");
    expect(rail).not.toBeNull();
    expect(rail!.textContent).toContain("Lesson");
    expect(document.getElementById(LESSON_PANEL_ID)).toBe(content);
    expect(content.isConnected).toBe(true);
    expect(content.hidden).toBe(true);
    const expand = screen.getByRole("button", { name: "Expand lesson panel" });
    expect(expand.getAttribute("aria-expanded")).toBe("false");
    expect(localStorage.getItem(LESSON_COLLAPSED_KEY)).toBe("1");
    expect(document.querySelector("[data-playback-center]")?.hasAttribute("data-lesson-collapsed")).toBe(true);
    expect(document.querySelector<HTMLElement>("[data-lesson-container]")!.style.width).toBe(`${LESSON_RAIL_WIDTH}px`);
  });

  it("restores the persisted collapsed state on reopen", () => {
    localStorage.setItem(LESSON_COLLAPSED_KEY, "1");
    openModal("A-where");
    expect(document.querySelector("[data-lesson-rail]")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Expand lesson panel" })).toBeTruthy();
  });

  it("toggles with the keyboard", async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    openModal("A-where");
    const toggle = screen.getByRole("button", { name: "Collapse lesson panel" });
    toggle.focus();
    await user.keyboard("{Enter}");
    expect(document.querySelector("[data-lesson-rail]")).not.toBeNull();
    const expand = screen.getByRole("button", { name: "Expand lesson panel" });
    expand.focus();
    await user.keyboard("{Enter}");
    expect(document.querySelector("[data-lesson-rail]")).toBeNull();
    expect(localStorage.getItem(LESSON_COLLAPSED_KEY)).toBe("0");
  });
});

describe("T.6 operation bar", () => {
  it("shows stage, expression and before→after counts in normal flow", async () => {
    const { sim } = openModal("A-where");
    fireEvent.click(screen.getByRole("button", { name: "Next stage" }));
    await advance(1);
    const bar = document.querySelector<HTMLElement>("[data-operation-bar]")!;
    expect(bar.textContent).toContain("WHERE");
    expect(bar.textContent).toContain("salary > 100000");
    expect(bar.querySelector("[data-count-before]")?.textContent).toBe(`${sim.snapshots[0].rowCount} rows`);
    expect(bar.querySelector("[data-count-after]")?.textContent).toBe("…");
    // Not an overlay: a sibling before the visualisation, never inside it.
    expect(stageRoot().contains(bar)).toBe(false);
    expect(bar.compareDocumentPosition(stageRoot()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(bar.className).not.toMatch(/\b(absolute|fixed)\b/);
    await waitDone();
    expect(bar.querySelector("[data-count-after]")?.textContent).toBe(`${sim.snapshots[1].rowCount} rows`);
  });
});

describe("R.12 closing the modal cleans up animation objects", () => {
  it("cancels in-flight animations and leaves no timers behind", async () => {
    const onClose = vi.fn();
    const { unmount } = openModal("A-where", onClose);
    fireEvent.click(screen.getByRole("button", { name: "Next stage" }));
    await advanceUntil(() => recorded.some((r) => r.anim.playState === "running"), 10000, 10);
    const inflight = recorded.filter((r) => r.anim.playState === "running");
    expect(inflight.length).toBeGreaterThan(0);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
    act(() => unmount());
    expect(inflight.every((r) => r.anim.playState === "finished")).toBe(true);
    await advance(1);
    expect(vi.getTimerCount()).toBe(0);
  });
});
