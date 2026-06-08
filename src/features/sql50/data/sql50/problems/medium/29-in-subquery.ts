import type { PracticeProblem } from "../../../../../../lib/practice/types";

export const problem: PracticeProblem = {
  id: 29,
  slug: "in-subquery",
  title: "Products in Popular Category",
  difficulty: "medium",
  topics: ["Subqueries", "IN"],
  description: "Find products in the Electronics category.",
  schemaSql: `
CREATE TABLE products (id SERIAL PRIMARY KEY, name VARCHAR(100), category VARCHAR(50));
  `,
  seedSql: `
INSERT INTO products (name, category) VALUES ('Phone','Electronics'), ('Desk','Furniture'), ('Laptop','Electronics');
  `,
  expectedOutputSql: `SELECT name FROM products WHERE category IN (SELECT DISTINCT category FROM products WHERE category = 'Electronics') ORDER BY name;`,
  hints: [
    `Filter category = 'Electronics'.`,
    `Subquery variant uses IN.`,
    `Simple WHERE works too.`,
  ],
  explanation: "IN with subquery or direct filter both work.",
  officialSolution: `SELECT name FROM products WHERE category = 'Electronics';`,
};
