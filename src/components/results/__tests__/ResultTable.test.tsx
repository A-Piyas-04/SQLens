// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import ResultTable, { MAX_RENDERED_ROWS } from "../ResultTable";

function makeRows(count: number) {
  return Array.from({ length: count }, (_, i) => ({ id: i + 1 }));
}

describe("ResultTable render cap", () => {
  afterEach(cleanup);

  it("renders every row for normal result sizes", () => {
    render(<ResultTable rows={makeRows(5)} />);
    expect(screen.getAllByRole("row")).toHaveLength(6);
    expect(screen.queryByRole("note")).toBeNull();
  });

  it("caps DOM rows for huge results while reporting the full count", () => {
    const { container } = render(<ResultTable rows={makeRows(MAX_RENDERED_ROWS + 500)} />);
    expect(container.querySelectorAll("tbody tr")).toHaveLength(MAX_RENDERED_ROWS);
    expect(screen.getByRole("note").textContent).toContain(
      `Showing first ${MAX_RENDERED_ROWS.toLocaleString()} rows`
    );
    expect(screen.getByText("1500")).toBeTruthy();
  }, 30_000);
});
