import type { PracticeProblem } from "../../../../../../lib/practice/types";

export const problem: PracticeProblem = {
  id: 42,
  slug: "dense-rank-scores",
  title: "Dense Rank Scores",
  difficulty: "hard",
  topics: ["Window Functions"],
  description: "Rank students by score using DENSE_RANK (no gaps).",
  schemaSql: `
CREATE TABLE students (id SERIAL PRIMARY KEY, name VARCHAR(100), score INT);
  `,
  seedSql: `
INSERT INTO students (name, score) VALUES ('A', 95), ('B', 95), ('C', 80);
  `,
  expectedOutputSql: `SELECT name, score, DENSE_RANK() OVER (ORDER BY score DESC) AS rnk FROM students ORDER BY rnk, name;`,
  hints: [
    `DENSE_RANK leaves no gaps after ties.`,
    `OVER (ORDER BY score DESC).`,
    `Different from RANK().`,
  ],
  explanation: "DENSE_RANK handles ties without skipping ranks.",
  officialSolution: `SELECT name, score, DENSE_RANK() OVER (ORDER BY score DESC) AS rnk FROM students;`,
};
