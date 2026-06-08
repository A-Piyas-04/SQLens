import type { PracticeProblem } from "../../../../../../lib/practice/types";

export const problem: PracticeProblem = {
  id: 23,
  slug: "having-high-count",
  title: "Popular Categories",
  difficulty: "medium",
  topics: ["GROUP BY", "HAVING"],
  description: "Find categories with more than 2 products.",
  schemaSql: `
CREATE TABLE products (id SERIAL PRIMARY KEY, name VARCHAR(100), category VARCHAR(50));
  `,
  seedSql: `
INSERT INTO products (name, category) VALUES ('A','Electronics'), ('B','Electronics'), ('C','Electronics'), ('D','Books'), ('E','Books');
  `,
  expectedOutputSql: `SELECT category, COUNT(*) AS cnt FROM products GROUP BY category HAVING COUNT(*) > 2 ORDER BY category;`,
  hints: [
    `HAVING filters groups after GROUP BY.`,
    `WHERE filters rows; HAVING filters aggregates.`,
    `Use COUNT(*) > 2.`,
  ],
  explanation: "HAVING filters grouped results.",
  officialSolution: `SELECT category, COUNT(*) AS cnt FROM products GROUP BY category HAVING COUNT(*) > 2;`,
};
