import type { PracticeProblem } from "../../../../../../lib/practice/types";

export const problem: PracticeProblem = {
  id: 37,
  slug: "having-avg-filter",
  title: "High Average Score Classes",
  difficulty: "medium",
  topics: ["HAVING", "GROUP BY"],
  description: "Find classes whose average student score is above 80.",
  schemaSql: `
CREATE TABLE students (id SERIAL PRIMARY KEY, name VARCHAR(100), class VARCHAR(20), score INT);
  `,
  seedSql: `
INSERT INTO students (name, class, score) VALUES ('A','Math',90), ('B','Math',85), ('C','Art',70), ('D','Art',75);
  `,
  expectedOutputSql: `SELECT class, AVG(score) AS avg_score FROM students GROUP BY class HAVING AVG(score) > 80 ORDER BY class;`,
  hints: [
    `GROUP BY class first.`,
    `HAVING filters on AVG(score).`,
    `Threshold is 80.`,
  ],
  explanation: "HAVING filters aggregated groups.",
  officialSolution: `SELECT class, AVG(score) AS avg_score FROM students GROUP BY class HAVING AVG(score) > 80;`,
};
