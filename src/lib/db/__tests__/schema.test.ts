import { describe, expect, it } from "vitest";

import { isPkRedundantUnique, isSystemNotNullCheck } from "../schema";
import type { UniqueConstraint } from "../schema";

describe("schema constraint helpers", () => {
  it("detects system NOT NULL check clauses", () => {
    expect(isSystemNotNullCheck("(email IS NOT NULL)")).toBe(true);
    expect(isSystemNotNullCheck("((age > 0))")).toBe(false);
  });

  it("treats unique constraints matching PK columns as redundant", () => {
    const unique: UniqueConstraint = {
      table_name: "t",
      constraint_name: "t_pkey",
      column_names: ["id"],
    };
    expect(isPkRedundantUnique({ primaryKeys: ["id"] }, unique)).toBe(true);
    expect(
      isPkRedundantUnique({ primaryKeys: ["id"] }, {
        ...unique,
        column_names: ["email"],
      })
    ).toBe(false);
  });
});
