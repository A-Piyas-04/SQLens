import type { PracticeProblem } from "../../../../../../lib/practice/types";

export const problem: PracticeProblem = {
  id: 19,
  slug: "case-grade-label",
  title: "Pass or Fail",
  difficulty: "easy",
  topics: ["CASE"],
  description: "Return student names with a label: 'Pass' if score >= 60, else 'Fail'.",
  schemaSql: `
CREATE TABLE students (id SERIAL PRIMARY KEY, name VARCHAR(100), score INT);
  `,
  seedSql: `
INSERT INTO students (name, score) VALUES ('Alice', 85), ('Bob', 55), ('Carla', 72);
  `,
  expectedOutputSql: `SELECT name, CASE WHEN score >= 60 THEN 'Pass' ELSE 'Fail' END AS result FROM students ORDER BY name;`,
  hints: [
    `CASE WHEN ... THEN ... ELSE ... END creates conditional values.`,
    `Compare score >= 60.`,
    `Alias the computed column as result.`,
  ],
  explanation: "CASE evaluates conditions per row.",
  officialSolution: `SELECT name, CASE WHEN score >= 60 THEN 'Pass' ELSE 'Fail' END AS result FROM students;`,
};
