import type { PracticeProblem } from "../../../../../../lib/practice/types";

export const problem: PracticeProblem = {
  id: 4,
  slug: "limit-top-three",
  title: "Top Three Products",
  difficulty: "easy",
  topics: ["SELECT", "ORDER BY", "LIMIT"],
  description: "Return the 3 most expensive products (name and price).",
  schemaSql: `
CREATE TABLE products (id SERIAL PRIMARY KEY, name VARCHAR(100), price NUMERIC(10,2));
  `,
  seedSql: `
INSERT INTO products (name, price) VALUES ('Laptop', 999), ('Mouse', 25), ('Monitor', 350), ('Keyboard', 75), ('Tablet', 450);
  `,
  expectedOutputSql: `SELECT name, price FROM products ORDER BY price DESC LIMIT 3;`,
  hints: [
    `Sort by price descending first.`,
    `LIMIT restricts how many rows are returned.`,
    `Combine ORDER BY DESC with LIMIT 3.`,
  ],
  explanation: "ORDER BY ... DESC LIMIT 3 returns the top 3 rows.",
  officialSolution: `SELECT name, price FROM products ORDER BY price DESC LIMIT 3;`,
};
