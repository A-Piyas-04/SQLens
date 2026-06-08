import type { PracticeProblem } from "../../../../../../lib/practice/types";

export const problem: PracticeProblem = {
  id: 15,
  slug: "not-null-phone",
  title: "Has Phone Number",
  difficulty: "easy",
  topics: ["NULL", "WHERE"],
  description: "List customers who have a phone number on file.",
  schemaSql: `
CREATE TABLE customers (id SERIAL PRIMARY KEY, name VARCHAR(100), phone VARCHAR(20));
  `,
  seedSql: `
INSERT INTO customers (name, phone) VALUES ('Alice', '555-0100'), ('Bob', NULL), ('Carla', '555-0200');
  `,
  expectedOutputSql: `SELECT name, phone FROM customers WHERE phone IS NOT NULL ORDER BY name;`,
  hints: [
    `IS NOT NULL finds present values.`,
    `Opposite of IS NULL.`,
    `Return name and phone.`,
  ],
  explanation: "IS NOT NULL filters rows with values present.",
  officialSolution: `SELECT name, phone FROM customers WHERE phone IS NOT NULL;`,
};
