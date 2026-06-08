import type { PracticeProblem } from "../../../../../../lib/practice/types";

export const problem: PracticeProblem = {
  id: 16,
  slug: "order-by-name-asc",
  title: "Alphabetical Products",
  difficulty: "easy",
  topics: ["ORDER BY"],
  description: "List all product names in alphabetical order.",
  schemaSql: `
CREATE TABLE products (id SERIAL PRIMARY KEY, name VARCHAR(100));
  `,
  seedSql: `
INSERT INTO products (name) VALUES ('Zebra'), ('Apple'), ('Mango');
  `,
  expectedOutputSql: `SELECT name FROM products ORDER BY name ASC;`,
  hints: [
    `ORDER BY name sorts alphabetically.`,
    `ASC is default ascending order.`,
    `Select only the name column.`,
  ],
  explanation: "ORDER BY name sorts A to Z.",
  officialSolution: `SELECT name FROM products ORDER BY name;`,
};
