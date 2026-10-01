/**
 * Fixed simulator dataset + representative query set for playback tests and
 * manual QA (plan §15 Phase 0, §18.3 queries A–I).
 */

export const PLAYBACK_SCHEMA_SQL = `
CREATE TABLE departments (
  id INT PRIMARY KEY,
  name TEXT NOT NULL
);
CREATE TABLE employees (
  id INT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  department_id INT,
  salary INT NOT NULL,
  hired_at TEXT NOT NULL
);
INSERT INTO departments VALUES
  (1, 'Engineering'), (2, 'Product'), (3, 'People Ops'), (4, 'Legal');
INSERT INTO employees VALUES
  (1, 'Alice Chen',  'alice@x.io', 1, 145000, '2019-02-01'),
  (2, 'Bob Diaz',    'bob@x.io',   1, 132000, '2020-06-15'),
  (3, 'Carla Ruiz',  'carla@x.io', 2, 118000, '2021-01-10'),
  (4, 'David Kim',   'david@x.io', 3,  95000, '2018-09-30'),
  (5, 'Elena Petr',  'elena@x.io', 2, 125000, '2022-03-03'),
  (6, 'Frank Moss',  'frank@x.io', NULL, 88000, '2023-07-19');
CREATE TABLE customers (id INT PRIMARY KEY, full_name TEXT NOT NULL);
CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT NOT NULL);
CREATE TABLE order_items (id INT PRIMARY KEY, order_id INT NOT NULL, price NUMERIC(10,2) NOT NULL);
INSERT INTO customers VALUES (1, 'Alice Chen'), (2, 'Bob Martinez'), (3, 'Carla Singh');
INSERT INTO orders VALUES (1, 1), (2, 1), (3, 2), (4, 3);
INSERT INTO order_items VALUES
  (1, 1, 100.00), (2, 1, 40.00), (3, 2, 28.47), (4, 3, 68.00), (5, 4, 50.00), (6, 4, 35.49);
`;

export type PlaybackQuery = {
  id: string;
  label: string;
  sql: string;
  expectedStages: string[];
};

export const PLAYBACK_QUERIES: PlaybackQuery[] = [
  { id: "from-only", label: "FROM only", sql: "SELECT * FROM employees", expectedStages: ["FROM", "SELECT"] },
  {
    id: "A-where",
    label: "Query A — WHERE",
    sql: "SELECT * FROM employees WHERE salary > 100000",
    expectedStages: ["FROM", "WHERE", "SELECT"],
  },
  {
    id: "B-select",
    label: "Query B — SELECT",
    sql: "SELECT full_name, salary FROM employees",
    expectedStages: ["FROM", "SELECT"],
  },
  {
    id: "C-order-by",
    label: "Query C — ORDER BY",
    sql: "SELECT * FROM employees ORDER BY salary DESC",
    expectedStages: ["FROM", "SELECT", "ORDER_BY"],
  },
  {
    id: "D-limit",
    label: "Query D — LIMIT",
    sql: "SELECT * FROM employees ORDER BY salary DESC LIMIT 3",
    expectedStages: ["FROM", "SELECT", "ORDER_BY", "LIMIT"],
  },
  {
    id: "E-group-by",
    label: "Query E — GROUP BY + aggregates",
    sql: "SELECT department_id, AVG(salary), COUNT(*) FROM employees GROUP BY department_id",
    expectedStages: ["FROM", "GROUP_BY", "SELECT"],
  },
  {
    id: "F-having",
    label: "Query F — HAVING",
    sql: "SELECT department_id, AVG(salary) FROM employees GROUP BY department_id HAVING AVG(salary) > 120000",
    expectedStages: ["FROM", "GROUP_BY", "HAVING", "SELECT"],
  },
  {
    id: "G-inner-join",
    label: "Query G — INNER JOIN",
    sql: "SELECT e.full_name, d.name FROM employees e INNER JOIN departments d ON e.department_id = d.id",
    expectedStages: ["FROM", "JOIN", "SELECT"],
  },
  {
    id: "H-left-join",
    label: "Query H — LEFT JOIN with unmatched rows",
    sql: "SELECT d.name, e.full_name FROM departments d LEFT JOIN employees e ON d.id = e.department_id",
    expectedStages: ["FROM", "JOIN", "SELECT"],
  },
  {
    id: "I-one-to-many",
    label: "Query I — one-to-many JOIN",
    sql: "SELECT d.name, e.full_name FROM departments d INNER JOIN employees e ON d.id = e.department_id",
    expectedStages: ["FROM", "JOIN", "SELECT"],
  },
  {
    id: "multi-join-group",
    label: "Two JOINs + GROUP BY + ORDER BY (row ids from both joins)",
    sql: `SELECT c.full_name, COUNT(o.id) AS order_count, SUM(oi.price) AS revenue
FROM customers c
JOIN orders o ON o.customer_id = c.id
JOIN order_items oi ON oi.order_id = o.id
GROUP BY c.id, c.full_name
ORDER BY revenue DESC`,
    expectedStages: ["FROM", "JOIN", "JOIN", "GROUP_BY", "SELECT", "ORDER_BY"],
  },
  {
    id: "full",
    label: "Full multi-stage query",
    sql: `SELECT full_name, salary
FROM employees
WHERE salary > 90000
ORDER BY salary DESC
LIMIT 3`,
    expectedStages: ["FROM", "WHERE", "SELECT", "ORDER_BY", "LIMIT"],
  },
];
