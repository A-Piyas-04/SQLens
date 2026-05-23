export type QueryTemplate = {
  id: string;
  title: string;
  category: string;
  sql: string;
};

export const QUERY_TEMPLATES: QueryTemplate[] = [
  {
    id: "inner-join",
    title: "Inner join two tables",
    category: "JOIN",
    sql: `SELECT a.id, a.name, b.title
FROM table_a a
INNER JOIN table_b b ON b.a_id = a.id
ORDER BY a.name;`,
  },
  {
    id: "left-join-null",
    title: "Left join — find unmatched rows",
    category: "JOIN",
    sql: `SELECT a.id, a.name, b.id AS related_id
FROM table_a a
LEFT JOIN table_b b ON b.a_id = a.id
WHERE b.id IS NULL;`,
  },
  {
    id: "multi-join",
    title: "Three-table join",
    category: "JOIN",
    sql: `SELECT p.name AS product, c.full_name AS customer, o.order_date
FROM orders o
JOIN customers c ON c.id = o.customer_id
JOIN order_items oi ON oi.order_id = o.id
JOIN products p ON p.id = oi.product_id
ORDER BY o.order_date DESC;`,
  },
  {
    id: "group-by-count",
    title: "Count rows per group",
    category: "GROUP BY",
    sql: `SELECT category, COUNT(*) AS item_count
FROM products
GROUP BY category
ORDER BY item_count DESC;`,
  },
  {
    id: "group-by-avg",
    title: "Average per group",
    category: "GROUP BY",
    sql: `SELECT department_id, ROUND(AVG(salary), 2) AS avg_salary
FROM employees
GROUP BY department_id
ORDER BY avg_salary DESC;`,
  },
  {
    id: "having-filter",
    title: "Filter groups with HAVING",
    category: "GROUP BY",
    sql: `SELECT customer_id, COUNT(*) AS order_count
FROM orders
GROUP BY customer_id
HAVING COUNT(*) > 1
ORDER BY order_count DESC;`,
  },
  {
    id: "order-by-limit",
    title: "Top N rows",
    category: "ORDER BY",
    sql: `SELECT name, gpa
FROM students
ORDER BY gpa DESC NULLS LAST
LIMIT 5;`,
  },
  {
    id: "count-distinct",
    title: "Distinct count",
    category: "aggregation",
    sql: `SELECT COUNT(DISTINCT department_id) AS department_count
FROM students;`,
  },
  {
    id: "subquery-in",
    title: "Subquery with IN",
    category: "nested queries",
    sql: `SELECT name, salary
FROM employees
WHERE department_id IN (
  SELECT id FROM departments WHERE location = 'San Francisco'
)
ORDER BY salary DESC;`,
  },
  {
    id: "subquery-exists",
    title: "Correlated EXISTS",
    category: "nested queries",
    sql: `SELECT d.name
FROM departments d
WHERE EXISTS (
  SELECT 1 FROM employees e WHERE e.department_id = d.id
);`,
  },
  {
    id: "coalesce-null",
    title: "Replace NULL values",
    category: "NULL handling",
    sql: `SELECT title, COALESCE(grade, 'N/A') AS grade_label
FROM enrollments e
JOIN courses c ON c.id = e.course_id;`,
  },
  {
    id: "null-filter",
    title: "Filter NULL / NOT NULL",
    category: "NULL handling",
    sql: `SELECT title, member_id, due_at
FROM loans
WHERE returned_at IS NULL
ORDER BY due_at;`,
  },
];

export const TEMPLATE_CATEGORIES = [
  ...new Set(QUERY_TEMPLATES.map((t) => t.category)),
];
