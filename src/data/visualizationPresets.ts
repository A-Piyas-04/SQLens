export type VisualizationPreset = {
  id: string;
  title: string;
  description: string;
  databaseId: string;
  sql: string;
};

export const VISUALIZATION_PRESETS: VisualizationPreset[] = [
  {
    id: "inner-join-demo",
    title: "INNER JOIN Demo",
    description: "Matching students, courses, and grades.",
    databaseId: "students-departments",
    sql: `SELECT s.name AS student, c.title AS course, e.grade
FROM enrollments e
INNER JOIN students s ON s.id = e.student_id
INNER JOIN courses c ON c.id = e.course_id
ORDER BY s.name;`,
  },
  {
    id: "left-join-demo",
    title: "LEFT JOIN Demo",
    description: "All departments including those without students.",
    databaseId: "students-departments",
    sql: `SELECT d.name AS department, s.name AS student
FROM departments d
LEFT JOIN students s ON s.department_id = d.id
ORDER BY d.name, s.name;`,
  },
  {
    id: "group-by-demo",
    title: "GROUP BY Demo",
    description: "Average GPA per department.",
    databaseId: "students-departments",
    sql: `SELECT d.name AS department, ROUND(AVG(s.gpa), 2) AS avg_gpa, COUNT(s.id) AS student_count
FROM departments d
LEFT JOIN students s ON s.department_id = d.id
GROUP BY d.id, d.name
ORDER BY avg_gpa DESC NULLS LAST;`,
  },
  {
    id: "where-filter-demo",
    title: "WHERE Filtering Demo",
    description: "High-GPA students in Computer Science.",
    databaseId: "students-departments",
    sql: `SELECT s.name, s.gpa, d.name AS department
FROM students s
JOIN departments d ON d.id = s.department_id
WHERE d.name = 'Computer Science' AND s.gpa >= 3.5
ORDER BY s.gpa DESC;`,
  },
  {
    id: "order-by-demo",
    title: "ORDER BY Demo",
    description: "Products sorted by price.",
    databaseId: "ecommerce",
    sql: `SELECT name, category, price
FROM products
ORDER BY price DESC, name ASC;`,
  },
  {
    id: "ecommerce-revenue",
    title: "Revenue by Customer",
    description: "Aggregation across orders and line items.",
    databaseId: "ecommerce",
    sql: `SELECT c.full_name, SUM(oi.quantity * oi.unit_price) AS total_spent
FROM customers c
JOIN orders o ON o.customer_id = c.id
JOIN order_items oi ON oi.order_id = o.id
GROUP BY c.id, c.full_name
ORDER BY total_spent DESC;`,
  },
  {
    id: "library-active-loans",
    title: "Active Loans",
    description: "Open loans with due dates.",
    databaseId: "library",
    sql: `SELECT b.title, m.name AS member, l.due_at
FROM loans l
JOIN books b ON b.id = l.book_id
JOIN members m ON m.id = l.member_id
WHERE l.returned_at IS NULL
ORDER BY l.due_at;`,
  },
  {
    id: "hr-salary-by-dept",
    title: "Salary by Department",
    description: "GROUP BY with employee counts.",
    databaseId: "company-hr",
    sql: `SELECT d.name AS department, ROUND(AVG(e.salary), 2) AS avg_salary, COUNT(*) AS headcount
FROM employees e
JOIN departments d ON d.id = e.department_id
GROUP BY d.id, d.name
ORDER BY avg_salary DESC;`,
  },
];
