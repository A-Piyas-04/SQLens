import type { PracticeProblem } from "../../../../../../lib/practice/types";

export const problem: PracticeProblem = {
  id: 32,
  slug: "union-all-combined",
  title: "Combined Contact List",
  difficulty: "medium",
  topics: ["UNION"],
  description: "Combine all customer and supplier names into one list as contact_name.",
  schemaSql: `
CREATE TABLE customers (id SERIAL PRIMARY KEY, name VARCHAR(100)); CREATE TABLE suppliers (id SERIAL PRIMARY KEY, name VARCHAR(100));
  `,
  seedSql: `
INSERT INTO customers (name) VALUES ('Alice'), ('Bob'); INSERT INTO suppliers (name) VALUES ('Carla'), ('David');
  `,
  expectedOutputSql: `SELECT name AS contact_name FROM customers UNION ALL SELECT name FROM suppliers ORDER BY contact_name;`,
  hints: [
    `UNION ALL stacks result sets.`,
    `Both SELECTs need same column count.`,
    `Alias as contact_name.`,
  ],
  explanation: "UNION ALL concatenates rows.",
  officialSolution: `SELECT name AS contact_name FROM customers UNION ALL SELECT name FROM suppliers;`,
};
