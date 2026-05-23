export type SampleDatabase = {
  id: string;
  name: string;
  description: string;
  sql: string;
  /** Optional starter query shown in the editor after load */
  starterQuery?: string;
};

const STUDENTS_DEPARTMENTS_SQL = `
CREATE TABLE departments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  budget NUMERIC(12, 2)
);

CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  department_id INT NOT NULL REFERENCES departments(id),
  gpa NUMERIC(3, 2),
  enrolled_at DATE DEFAULT CURRENT_DATE
);

CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  title VARCHAR(120) NOT NULL,
  department_id INT NOT NULL REFERENCES departments(id),
  credits INT NOT NULL DEFAULT 3
);

CREATE TABLE enrollments (
  student_id INT NOT NULL REFERENCES students(id),
  course_id INT NOT NULL REFERENCES courses(id),
  grade VARCHAR(2),
  PRIMARY KEY (student_id, course_id)
);

INSERT INTO departments (name, budget) VALUES
  ('Computer Science', 250000),
  ('Mathematics', 180000),
  ('Physics', 210000);

INSERT INTO students (name, department_id, gpa) VALUES
  ('Alice Chen', 1, 3.85),
  ('Bob Martinez', 1, 3.42),
  ('Carla Singh', 2, 3.91),
  ('David Kim', 3, 3.55),
  ('Elena Rossi', 2, 3.68);

INSERT INTO courses (title, department_id, credits) VALUES
  ('Databases', 1, 4),
  ('Linear Algebra', 2, 3),
  ('Quantum Mechanics', 3, 4),
  ('Algorithms', 1, 3);

INSERT INTO enrollments (student_id, course_id, grade) VALUES
  (1, 1, 'A'),
  (1, 4, 'A'),
  (2, 1, 'B'),
  (3, 2, 'A'),
  (4, 3, 'B'),
  (5, 2, 'A');
`;

const ECOMMERCE_SQL = `
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  email VARCHAR(120) NOT NULL UNIQUE,
  full_name VARCHAR(100) NOT NULL,
  city VARCHAR(80)
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  category VARCHAR(60) NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  stock INT NOT NULL DEFAULT 0
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_id INT NOT NULL REFERENCES customers(id),
  order_date TIMESTAMP NOT NULL DEFAULT NOW(),
  status VARCHAR(30) NOT NULL DEFAULT 'pending'
);

CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL REFERENCES orders(id),
  product_id INT NOT NULL REFERENCES products(id),
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL
);

INSERT INTO customers (email, full_name, city) VALUES
  ('alice@example.com', 'Alice Chen', 'Seattle'),
  ('bob@example.com', 'Bob Martinez', 'Austin'),
  ('carla@example.com', 'Carla Singh', 'Boston');

INSERT INTO products (name, category, price, stock) VALUES
  ('Wireless Mouse', 'electronics', 29.99, 120),
  ('Mechanical Keyboard', 'electronics', 89.99, 45),
  ('SQL Practice Notebook', 'books', 18.50, 200),
  ('Desk Lamp', 'home', 34.00, 60);

INSERT INTO orders (customer_id, status) VALUES
  (1, 'completed'),
  (1, 'completed'),
  (2, 'pending'),
  (3, 'shipped');

INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
  (1, 1, 2, 29.99),
  (1, 3, 1, 18.50),
  (2, 2, 1, 89.99),
  (3, 4, 2, 34.00),
  (4, 1, 1, 29.99),
  (4, 3, 3, 18.50);
`;

const LIBRARY_SQL = `
CREATE TABLE authors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  country VARCHAR(60)
);

CREATE TABLE books (
  id SERIAL PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  author_id INT NOT NULL REFERENCES authors(id),
  published_year INT,
  isbn VARCHAR(20) UNIQUE
);

CREATE TABLE members (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(120) UNIQUE,
  joined_at DATE DEFAULT CURRENT_DATE
);

CREATE TABLE loans (
  id SERIAL PRIMARY KEY,
  book_id INT NOT NULL REFERENCES books(id),
  member_id INT NOT NULL REFERENCES members(id),
  loaned_at DATE NOT NULL DEFAULT CURRENT_DATE,
  due_at DATE NOT NULL,
  returned_at DATE
);

INSERT INTO authors (name, country) VALUES
  ('Ada Lovelace', 'UK'),
  ('Edsger Dijkstra', 'Netherlands'),
  ('Grace Hopper', 'USA');

INSERT INTO books (title, author_id, published_year, isbn) VALUES
  ('Analytical Engine Notes', 1, 1843, '978-0000000001'),
  ('Structured Programming', 2, 1972, '978-0000000002'),
  ('Compilers and Compiling', 3, 1952, '978-0000000003'),
  ('SQL for Practitioners', 3, 1985, '978-0000000004');

INSERT INTO members (name, email) VALUES
  ('Alice Chen', 'alice@library.test'),
  ('Bob Martinez', 'bob@library.test'),
  ('Carla Singh', 'carla@library.test');

INSERT INTO loans (book_id, member_id, due_at, returned_at) VALUES
  (1, 1, '2026-06-01', '2026-05-10'),
  (2, 2, '2026-06-15', NULL),
  (3, 1, '2026-05-20', NULL),
  (4, 3, '2026-07-01', NULL);
`;

const COMPANY_HR_SQL = `
CREATE TABLE departments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE,
  location VARCHAR(80)
);

CREATE TABLE employees (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  department_id INT NOT NULL REFERENCES departments(id),
  salary NUMERIC(10, 2) NOT NULL,
  hired_at DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  department_id INT NOT NULL REFERENCES departments(id),
  budget NUMERIC(12, 2)
);

CREATE TABLE employee_projects (
  employee_id INT NOT NULL REFERENCES employees(id),
  project_id INT NOT NULL REFERENCES projects(id),
  role VARCHAR(60) NOT NULL,
  hours_allocated INT NOT NULL DEFAULT 0,
  PRIMARY KEY (employee_id, project_id)
);

INSERT INTO departments (name, location) VALUES
  ('Engineering', 'San Francisco'),
  ('Product', 'New York'),
  ('People Ops', 'Remote');

INSERT INTO employees (full_name, email, department_id, salary, hired_at) VALUES
  ('Alice Chen', 'alice@acme.co', 1, 145000, '2022-03-01'),
  ('Bob Martinez', 'bob@acme.co', 1, 132000, '2021-11-15'),
  ('Carla Singh', 'carla@acme.co', 2, 118000, '2023-01-10'),
  ('David Kim', 'david@acme.co', 3, 95000, '2020-08-20'),
  ('Elena Rossi', 'elena@acme.co', 2, 125000, '2022-07-01');

INSERT INTO projects (name, department_id, budget) VALUES
  ('Data Platform', 1, 500000),
  ('Mobile App', 2, 320000),
  ('Hiring Portal', 3, 80000);

INSERT INTO employee_projects (employee_id, project_id, role, hours_allocated) VALUES
  (1, 1, 'Tech Lead', 24),
  (2, 1, 'Engineer', 32),
  (3, 2, 'PM', 20),
  (5, 2, 'Designer', 16),
  (4, 3, 'Coordinator', 12);
`;

export const SAMPLE_DATABASES: SampleDatabase[] = [
  {
    id: "students-departments",
    name: "Students & Departments",
    description: "Departments, students, courses, and enrollments — ideal for JOINs.",
    sql: STUDENTS_DEPARTMENTS_SQL,
    starterQuery: `-- Explore enrollments with department names
SELECT s.name AS student, d.name AS department, c.title AS course, e.grade
FROM enrollments e
JOIN students s ON s.id = e.student_id
JOIN courses c ON c.id = e.course_id
JOIN departments d ON d.id = s.department_id
ORDER BY s.name;`,
  },
  {
    id: "ecommerce",
    name: "E-commerce Store",
    description: "Customers, products, orders, and line items with multiple FKs.",
    sql: ECOMMERCE_SQL,
    starterQuery: `-- Order totals per customer
SELECT c.full_name, COUNT(o.id) AS order_count, SUM(oi.quantity * oi.unit_price) AS revenue
FROM customers c
JOIN orders o ON o.customer_id = c.id
JOIN order_items oi ON oi.order_id = o.id
GROUP BY c.id, c.full_name
ORDER BY revenue DESC;`,
  },
  {
    id: "library",
    name: "Library System",
    description: "Authors, books, members, and active loans.",
    sql: LIBRARY_SQL,
    starterQuery: `-- Books currently on loan
SELECT b.title, m.name AS member, l.loaned_at, l.due_at
FROM loans l
JOIN books b ON b.id = l.book_id
JOIN members m ON m.id = l.member_id
WHERE l.returned_at IS NULL
ORDER BY l.due_at;`,
  },
  {
    id: "company-hr",
    name: "Company HR",
    description: "Employees, departments, projects, and assignments.",
    sql: COMPANY_HR_SQL,
    starterQuery: `-- Average salary by department
SELECT d.name AS department, ROUND(AVG(e.salary), 2) AS avg_salary, COUNT(*) AS headcount
FROM employees e
JOIN departments d ON d.id = e.department_id
GROUP BY d.id, d.name
ORDER BY avg_salary DESC;`,
  },
];

export function getSampleDatabaseById(id: string): SampleDatabase | undefined {
  return SAMPLE_DATABASES.find((db) => db.id === id);
}
