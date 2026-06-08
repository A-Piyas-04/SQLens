import type { PracticeProblem } from "../../../../../../lib/practice/types";

export const problem: PracticeProblem = {
  id: 10,
  slug: "like-name-search",
  title: "Name Starts With A",
  difficulty: "easy",
  topics: ["WHERE", "String Functions"],
  description: "Find product names that start with the letter 'A'.",
  schemaSql: `
CREATE TABLE products (id SERIAL PRIMARY KEY, name VARCHAR(100));
  `,
  seedSql: `
INSERT INTO products (name) VALUES ('Apple'), ('Apricot'), ('Banana'), ('Avocado');
  `,
  expectedOutputSql: `SELECT name FROM products WHERE name LIKE 'A%' ORDER BY name;`,
  hints: [
    `LIKE 'A%' matches strings starting with A.`,
    `% is a wildcard for any characters.`,
    `Use WHERE with LIKE.`,
  ],
  explanation: "LIKE 'A%' matches names beginning with A.",
  officialSolution: `SELECT name FROM products WHERE name LIKE 'A%';`,
};
