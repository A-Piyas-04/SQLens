/**
 * Simulator fixture queries for manual testing and regression test suite.
 *
 * All fixtures target the "Students" sample database which has tables:
 *   departments(id, name, budget)
 *   students(id, name, department_id, gpa, enrolled_at)
 *   courses(id, title, department_id, credits)
 *   enrollments(student_id, course_id, grade)
 */

export type SimulatorFixture = {
  id: string;
  label: string;
  description: string;
  sql: string;
  /** Sample database this fixture requires */
  database: "students" | "ecommerce" | "library" | "hr";
  /** Expected stage types in pipeline order */
  expectedStages: string[];
};

export const FIXTURE_QUERIES: SimulatorFixture[] = [
  // ── WHERE ────────────────────────────────────────────────────────────────
  {
    id: "where-simple",
    label: "WHERE — GPA filter",
    description: "Filter students with GPA above 3.5; tests row removal at WHERE stage.",
    sql: "SELECT id, name, gpa FROM students WHERE gpa > 3.5",
    database: "students",
    expectedStages: ["FROM", "WHERE", "SELECT"],
  },
  {
    id: "where-string",
    label: "WHERE — string equality",
    description: "Filter a specific department; tests string predicate.",
    sql: "SELECT * FROM departments WHERE name = 'Computer Science'",
    database: "students",
    expectedStages: ["FROM", "WHERE", "SELECT"],
  },

  // ── ORDER BY ─────────────────────────────────────────────────────────────
  {
    id: "order-by-gpa-desc",
    label: "ORDER BY — GPA descending",
    description: "Sort students by GPA descending; tests row reordering.",
    sql: "SELECT id, name, gpa FROM students ORDER BY gpa DESC",
    database: "students",
    expectedStages: ["FROM", "SELECT", "ORDER_BY"],
  },
  {
    id: "order-by-name-asc",
    label: "ORDER BY — name ascending",
    description: "Sort students by name; tests stable sort behaviour.",
    sql: "SELECT name, gpa FROM students ORDER BY name ASC",
    database: "students",
    expectedStages: ["FROM", "SELECT", "ORDER_BY"],
  },

  // ── LIMIT ─────────────────────────────────────────────────────────────────
  {
    id: "limit-top3",
    label: "LIMIT — top 3 students",
    description: "Return only the first 3 rows; tests row truncation.",
    sql: "SELECT id, name, gpa FROM students ORDER BY gpa DESC LIMIT 3",
    database: "students",
    expectedStages: ["FROM", "SELECT", "ORDER_BY", "LIMIT"],
  },

  // ── INNER JOIN ─────────────────────────────────────────────────────────────
  {
    id: "inner-join-students-departments",
    label: "INNER JOIN — students × departments",
    description:
      "Join students to their departments; every student has a department so no rows are lost.",
    sql: `SELECT s.name, d.name AS department
FROM students s
INNER JOIN departments d ON s.department_id = d.id`,
    database: "students",
    expectedStages: ["FROM", "JOIN", "SELECT"],
  },
  {
    id: "inner-join-where",
    label: "INNER JOIN + WHERE — CS students",
    description: "Join then filter; tests JOIN followed by WHERE elimination.",
    sql: `SELECT s.name, s.gpa, d.name AS department
FROM students s
INNER JOIN departments d ON s.department_id = d.id
WHERE d.name = 'Computer Science'`,
    database: "students",
    expectedStages: ["FROM", "JOIN", "WHERE", "SELECT"],
  },

  // ── LEFT JOIN ─────────────────────────────────────────────────────────────
  {
    id: "left-join-courses-enrollments",
    label: "LEFT JOIN — courses with optional enrollments",
    description:
      "All courses, even those with no enrolled students; tests NULL-row generation.",
    sql: `SELECT c.title, e.grade
FROM courses c
LEFT JOIN enrollments e ON c.id = e.course_id`,
    database: "students",
    expectedStages: ["FROM", "JOIN", "SELECT"],
  },
  {
    id: "left-join-full",
    label: "LEFT JOIN + WHERE + ORDER BY",
    description: "Left join with subsequent WHERE and ORDER BY; full pipeline test.",
    sql: `SELECT c.title, c.credits, e.grade
FROM courses c
LEFT JOIN enrollments e ON c.id = e.course_id
WHERE c.credits >= 3
ORDER BY c.title`,
    database: "students",
    expectedStages: ["FROM", "JOIN", "WHERE", "SELECT", "ORDER_BY"],
  },

  // ── NULL in source data ────────────────────────────────────────────────────
  {
    id: "null-gpa",
    label: "NULL — students with NULL gpa",
    description:
      "Select students filtering where gpa IS NOT NULL; tests NULL predicate handling.",
    sql: "SELECT id, name, gpa FROM students WHERE gpa IS NOT NULL ORDER BY gpa DESC",
    database: "students",
    expectedStages: ["FROM", "WHERE", "SELECT", "ORDER_BY"],
  },

  // ── Full pipeline (no JOIN) ────────────────────────────────────────────────
  {
    id: "full-pipeline",
    label: "Full pipeline — WHERE + SELECT + ORDER BY + LIMIT",
    description: "All non-JOIN stages exercised in one query.",
    sql: `SELECT name, gpa
FROM students
WHERE gpa > 3.0
ORDER BY gpa DESC
LIMIT 3`,
    database: "students",
    expectedStages: ["FROM", "WHERE", "SELECT", "ORDER_BY", "LIMIT"],
  },
];
