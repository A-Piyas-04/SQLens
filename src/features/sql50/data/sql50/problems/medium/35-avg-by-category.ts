import type { PracticeProblem } from "../../../../../../lib/practice/types";

export const problem: PracticeProblem = {
  id: 35,
  slug: "avg-by-category",
  title: "Average Price by Category",
  difficulty: "medium",
  topics: ["GROUP BY", "Aggregates"],
  description: "Calculate average price for each product category.",
  schemaSql: `
CREATE TABLE products (id SERIAL PRIMARY KEY, name VARCHAR(100), category VARCHAR(50), price NUMERIC(10,2));
  `,
  seedSql: `
INSERT INTO products (name, category, price) VALUES ('A','Books',10), ('B','Books',20), ('C','Tech',100);
  `,
  expectedOutputSql: `SELECT category, ROUND(AVG(price)::numeric, 2) AS avg_price FROM products GROUP BY category ORDER BY category;`,
  hints: [
    `GROUP BY category.`,
    `AVG(price) per group.`,
    `Include category in SELECT.`,
  ],
  explanation: "GROUP BY enables per-category averages.",
  officialSolution: `SELECT category, AVG(price) AS avg_price FROM products GROUP BY category;`,
};
