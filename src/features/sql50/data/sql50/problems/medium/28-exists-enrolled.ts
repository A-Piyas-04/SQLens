import type { PracticeProblem } from "../../../../../../lib/practice/types";

export const problem: PracticeProblem = {
  id: 28,
  slug: "exists-enrolled",
  title: "Enrolled Students",
  difficulty: "medium",
  topics: ["EXISTS", "Subqueries"],
  description: "Find students who have at least one enrollment.",
  schemaSql: `
CREATE TABLE students (id SERIAL PRIMARY KEY, name VARCHAR(100)); CREATE TABLE enrollments (student_id INT REFERENCES students(id), course_id INT);
  `,
  seedSql: `
INSERT INTO students (name) VALUES ('Alice'), ('Bob'), ('Carla'); INSERT INTO enrollments (student_id, course_id) VALUES (1,1), (2,1);
  `,
  expectedOutputSql: `SELECT name FROM students s WHERE EXISTS (SELECT 1 FROM enrollments e WHERE e.student_id = s.id) ORDER BY name;`,
  hints: [
    `EXISTS checks if subquery returns rows.`,
    `Correlate e.student_id = s.id.`,
    `SELECT 1 is idiomatic for EXISTS.`,
  ],
  explanation: "EXISTS tests for related rows.",
  officialSolution: `SELECT name FROM students s WHERE EXISTS (SELECT 1 FROM enrollments e WHERE e.student_id = s.id);`,
};
