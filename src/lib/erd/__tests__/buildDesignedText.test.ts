import { describe, expect, it } from "vitest";

import { buildDesignedText } from "../buildDesignedText";
import type { SchemaTable } from "../../db/schema";

const fixture: SchemaTable[] = [
  {
    table_name: "users",
    primaryKeys: ["id"],
    foreignKeys: [],
    uniqueConstraints: [
      {
        table_name: "users",
        constraint_name: "users_email_key",
        column_names: ["email"],
      },
    ],
    checkConstraints: [
      {
        table_name: "users",
        constraint_name: "users_age_positive",
        check_clause: "(age > 0)",
      },
    ],
    columns: [
      {
        table_name: "users",
        column_name: "id",
        data_type: "uuid",
        is_nullable: "NO",
        column_default: null,
      },
      {
        table_name: "users",
        column_name: "email",
        data_type: "text",
        is_nullable: "NO",
        column_default: null,
      },
    ],
  },
  {
    table_name: "orders",
    primaryKeys: ["id"],
    foreignKeys: [
      {
        table_name: "orders",
        column_name: "user_id",
        foreign_table_name: "users",
        foreign_column_name: "id",
      },
    ],
    uniqueConstraints: [],
    checkConstraints: [],
    columns: [
      {
        table_name: "orders",
        column_name: "id",
        data_type: "uuid",
        is_nullable: "NO",
        column_default: null,
      },
      {
        table_name: "orders",
        column_name: "user_id",
        data_type: "uuid",
        is_nullable: "NO",
        column_default: null,
      },
    ],
  },
];

describe("buildDesignedText", () => {
  it("includes header, PK/FK markers, and relationship arrows", () => {
    const text = buildDesignedText(fixture);

    expect(text).toContain("SQLens ERD — Designed Text");
    expect(text).toContain("Tables: 2");
    expect(text).toContain("[PK]");
    expect(text).toContain("[FK → users.id]");
    expect(text).toContain("orders.user_id ──FK──> users.id");
    expect(text).toContain("PRIMARY KEY (id)");
    expect(text).toContain("[UNIQUE]");
    expect(text).toContain("UNIQUE (email)");
    expect(text).toContain("CHECK — users_age_positive");
    expect(text).toContain("(age > 0)");
    expect(text).not.toContain("not introspected");
  });

  it("returns empty-schema message when no tables", () => {
    expect(buildDesignedText([])).toContain("No tables in schema");
  });
});
