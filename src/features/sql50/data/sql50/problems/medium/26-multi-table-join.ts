import type { PracticeProblem } from "../../../../../../lib/practice/types";

export const problem: PracticeProblem = {
  id: 26,
  slug: "multi-table-join",
  title: "Student Courses",
  difficulty: "medium",
  topics: ["JOIN"],
  description: "List student names with their enrolled course titles.",
  schemaSql: `
CREATE TABLE students (id SERIAL PRIMARY KEY, name VARCHAR(100)); CREATE TABLE courses (id SERIAL PRIMARY KEY, title VARCHAR(100)); CREATE TABLE enrollments (student_id INT REFERENCES students(id), course_id INT REFERENCES courses(id), PRIMARY KEY (student_id, course_id));
  `,
  seedSql: `
INSERT INTO students (name) VALUES ('Alice'), ('Bob'); INSERT INTO courses (title) VALUES ('SQL'), ('Python'); INSERT INTO enrollments VALUES (1,1), (1,2), (2,1);
  `,
  expectedOutputSql: `SELECT s.name, c.title FROM enrollments e JOIN students s ON e.student_id = s.id JOIN courses c ON e.course_id = c.id ORDER BY s.name, c.title;`,
  hints: [
    `Join enrollments to both students and courses.`,
    `Use the bridge table enrollments.`,
    `Two JOIN clauses needed.`,
  ],
  explanation: "Multiple JOINs traverse relationships.",
  officialSolution: `SELECT s.name, c.title FROM enrollments e JOIN students s ON e.student_id = s.id JOIN courses c ON e.course_id = c.id;`,
};
