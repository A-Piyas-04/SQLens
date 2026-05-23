export const DEFAULT_QUERY = `CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50),
  gpa NUMERIC(3,2)
);

INSERT INTO students (name, gpa)
VALUES ('Alice', 3.80);

SELECT * FROM students;`;
