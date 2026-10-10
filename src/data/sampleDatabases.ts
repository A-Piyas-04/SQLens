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
  ('Physics', 210000),
  ('Chemistry', 165000),
  ('Economics', 140000),
  ('Philosophy', 90000);

INSERT INTO students (name, department_id, gpa, enrolled_at) VALUES
  ('Alice Chen', 1, 3.85, '2023-09-01'),
  ('Bob Martinez', 1, 3.42, '2023-09-01'),
  ('Priya Patel', 1, 3.91, '2022-09-01'),
  ('Marcus Johnson', 1, 2.78, '2024-01-15'),
  ('Sofia Hernandez', 1, 3.96, '2022-09-01'),
  ('Liam Walsh', 1, 3.12, '2023-09-01'),
  ('Noah Williams', 1, 2.31, '2024-09-01'),
  ('Hana Suzuki', 1, 3.58, '2023-01-15'),
  ('Ethan Brooks', 1, 3.27, '2023-09-01'),
  ('Zara Ahmed', 1, 3.74, '2025-09-01'),
  ('Carla Singh', 2, 3.93, '2022-09-01'),
  ('Daniel Park', 2, 3.05, '2023-09-01'),
  ('Fatima Khan', 2, 2.64, '2024-01-15'),
  ('George Miller', 2, 3.48, '2023-09-01'),
  ('Isabel Costa', 2, 2.89, '2024-09-01'),
  ('Jonas Weber', 2, 3.88, '2022-09-01'),
  ('Kofi Mensah', 2, 2.45, '2024-09-01'),
  ('Lena Novak', 2, NULL, '2025-09-01'),
  ('David Kim', 3, 3.55, '2022-09-01'),
  ('Emma Thompson', 3, 2.97, '2023-09-01'),
  ('Felix Wagner', 3, 3.81, '2022-09-01'),
  ('Grace Liu', 3, 2.18, '2024-01-15'),
  ('Hugo Laurent', 3, 3.33, '2023-09-01'),
  ('Ines Silva', 3, 3.67, '2023-01-15'),
  ('Jack Taylor', 3, 2.71, '2024-09-01'),
  ('Kira Ivanova', 3, 3.15, '2025-09-01'),
  ('Elena Rossi', 4, 3.68, '2022-09-01'),
  ('Mateo Garcia', 4, 3.02, '2023-09-01'),
  ('Nadia Rahman', 4, 2.83, '2024-01-15'),
  ('Oscar Lindqvist', 4, 3.77, '2022-09-01'),
  ('Paula Mendes', 4, 2.95, '2024-09-01'),
  ('Quentin Moreau', 4, 3.39, '2023-09-01'),
  ('Rosa Delgado', 4, 2.22, '2024-09-01'),
  ('Samuel Okafor', 5, 3.89, '2022-09-01'),
  ('Tara Nguyen', 5, 3.21, '2023-09-01'),
  ('Umar Farooq', 5, 2.56, '2024-01-15'),
  ('Vera Petrova', 5, 3.71, '2023-01-15'),
  ('William Scott', 5, 2.93, '2024-09-01'),
  ('Yuki Tanaka', 5, 2.08, '2024-09-01'),
  ('Zoe Adams', 5, NULL, '2025-09-01');

INSERT INTO courses (title, department_id, credits) VALUES
  ('Databases', 1, 4),
  ('Algorithms', 1, 3),
  ('Operating Systems', 1, 4),
  ('Machine Learning', 1, 3),
  ('Linear Algebra', 2, 3),
  ('Calculus II', 2, 4),
  ('Probability', 2, 3),
  ('Discrete Math', 2, 3),
  ('Quantum Mechanics', 3, 4),
  ('Thermodynamics', 3, 3),
  ('Electromagnetism', 3, 4),
  ('Organic Chemistry', 4, 4),
  ('Physical Chemistry', 4, 3),
  ('Microeconomics', 5, 3),
  ('Econometrics', 5, 4),
  ('Logic and Reasoning', 6, 3);

INSERT INTO enrollments (student_id, course_id, grade) VALUES
  (1, 1, 'A'), (1, 2, 'A'), (1, 4, 'A-'), (1, 5, 'B+'),
  (2, 1, 'B'), (2, 2, 'B+'), (2, 3, 'B'),
  (3, 1, 'A-'), (3, 3, 'A'), (3, 4, 'B+'), (3, 8, 'A'),
  (4, 2, 'C+'), (4, 1, 'B-'), (4, 6, 'C'),
  (5, 1, 'A'), (5, 4, 'A'), (5, 7, 'A-'),
  (6, 2, 'B'), (6, 3, 'B-'), (6, 8, 'B+'),
  (7, 1, 'C'), (7, 2, 'D'), (7, 5, 'C+'),
  (8, 3, 'A-'), (8, 4, 'B'), (8, 7, 'B+'), (8, 1, 'B+'),
  (9, 1, 'B+'), (9, 2, 'A-'), (9, 14, 'B'),
  (10, 4, NULL), (10, 1, 'A'), (10, 2, 'B+'),
  (11, 5, 'A'), (11, 6, 'A-'), (11, 7, 'A'), (11, 8, 'A'),
  (12, 5, 'B'), (12, 6, 'B+'), (12, 1, 'B'),
  (13, 6, 'C+'), (13, 7, 'B-'), (13, 8, 'C'),
  (14, 5, 'A-'), (14, 7, 'A'), (14, 2, 'B+'),
  (15, 6, 'B'), (15, 8, 'B-'), (15, 9, 'C+'),
  (16, 5, 'A'), (16, 6, 'A'), (16, 8, 'A-'), (16, 4, 'B+'),
  (17, 7, 'C'), (17, 8, 'C+'), (17, 15, 'B-'),
  (18, 5, NULL), (18, 6, 'B'),
  (19, 9, 'A'), (19, 10, 'A-'), (19, 11, 'B+'), (19, 5, 'B+'),
  (20, 9, 'B'), (20, 11, 'B-'), (20, 6, 'C+'),
  (21, 10, 'A'), (21, 11, 'A'), (21, 9, 'A-'),
  (22, 9, 'C'), (22, 10, 'C+'), (22, 11, 'D'),
  (23, 9, 'B+'), (23, 10, 'B'), (23, 7, 'B'),
  (24, 11, 'A-'), (24, 9, 'A'), (24, 4, 'B+'),
  (25, 10, 'B-'), (25, 11, 'C+'), (25, 12, 'C'),
  (26, 9, NULL), (26, 10, 'B+'),
  (27, 12, 'A'), (27, 13, 'A-'), (27, 10, 'B+'),
  (28, 12, 'B'), (28, 13, 'B+'), (28, 9, 'C'),
  (29, 12, 'C+'), (29, 13, 'C'), (29, 14, 'B-'),
  (30, 12, 'A-'), (30, 13, 'A'), (30, 6, 'B+'),
  (31, 12, 'B-'), (31, 13, NULL), (31, 1, 'C+'),
  (32, 12, 'A'), (32, 13, 'B+'), (32, 15, 'B'),
  (33, 13, 'C'), (33, 12, 'D'),
  (34, 14, 'A'), (34, 15, 'A-'), (34, 7, 'B+'),
  (35, 14, 'B+'), (35, 15, 'B'), (35, 5, 'B-'),
  (36, 14, 'C'), (36, 15, 'C+'), (36, 8, 'C'),
  (37, 14, 'A-'), (37, 15, 'A'), (37, 1, 'B+'),
  (38, 14, 'B'), (38, 15, 'B-'), (38, 2, 'C+'),
  (39, 14, 'F'), (39, 15, 'D'),
  (40, 14, NULL), (40, 15, 'B+'), (40, 7, 'B');
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
  ('carla@example.com', 'Carla Singh', 'Boston'),
  ('david@example.com', 'David Kim', 'Chicago'),
  ('elena@example.com', 'Elena Rossi', 'Seattle'),
  ('farah@example.com', 'Farah Haddad', 'Denver'),
  ('gabriel@example.com', 'Gabriel Silva', 'Miami'),
  ('hannah@example.com', 'Hannah Becker', 'Portland'),
  ('ivan@example.com', 'Ivan Petrov', 'New York'),
  ('julia@example.com', 'Julia Santos', 'Austin'),
  ('kenji@example.com', 'Kenji Watanabe', 'Seattle'),
  ('laura@example.com', 'Laura Bianchi', 'Boston'),
  ('mohammed@example.com', 'Mohammed Ali', 'Chicago'),
  ('nina@example.com', 'Nina Kowalski', 'New York'),
  ('omar@example.com', 'Omar Hassan', 'Denver'),
  ('patricia@example.com', 'Patricia Lopez', 'Miami'),
  ('quinn@example.com', 'Quinn Murphy', 'Portland'),
  ('rahul@example.com', 'Rahul Verma', 'Austin'),
  ('sara@example.com', 'Sara Lindgren', 'Boston'),
  ('tomas@example.com', 'Tomas Novak', 'Chicago'),
  ('uma@example.com', 'Uma Reddy', 'Seattle'),
  ('victor@example.com', 'Victor Dubois', 'New York'),
  ('wendy@example.com', 'Wendy Zhao', 'Portland'),
  ('xavier@example.com', 'Xavier Moreno', 'Miami'),
  ('yasmin@example.com', 'Yasmin Aziz', 'Denver'),
  ('zane@example.com', 'Zane Cooper', 'Austin'),
  ('amelia@example.com', 'Amelia Ward', 'Chicago'),
  ('bruno@example.com', 'Bruno Ferreira', 'New York'),
  ('chloe@example.com', 'Chloe Martin', 'Boston'),
  ('diego@example.com', 'Diego Ramirez', 'Seattle');

INSERT INTO products (name, category, price, stock) VALUES
  ('Wireless Mouse', 'electronics', 29.99, 120),
  ('Mechanical Keyboard', 'electronics', 89.99, 45),
  ('USB-C Hub', 'electronics', 39.99, 80),
  ('Noise-Cancelling Headphones', 'electronics', 199.00, 25),
  ('Ultrawide Monitor', 'electronics', 349.00, 15),
  ('SQL Practice Notebook', 'books', 18.50, 200),
  ('Database Internals', 'books', 54.00, 40),
  ('Designing Data-Intensive Apps', 'books', 47.99, 60),
  ('Clean Code', 'books', 36.50, 70),
  ('Desk Lamp', 'home', 34.00, 60),
  ('Ergonomic Chair', 'home', 249.00, 12),
  ('Standing Desk Mat', 'home', 45.00, 50),
  ('Ceramic Mug Set', 'home', 24.99, 90),
  ('Yoga Mat', 'sports', 32.00, 75),
  ('Adjustable Dumbbells', 'sports', 159.00, 20),
  ('Running Shoes', 'sports', 119.00, 35),
  ('Water Bottle', 'sports', 19.99, 150),
  ('Hoodie', 'clothing', 49.00, 65),
  ('Rain Jacket', 'clothing', 89.00, 30),
  ('Wool Socks 3-Pack', 'clothing', 15.99, 140);

INSERT INTO orders (customer_id, order_date, status) VALUES
  (1, '2025-11-04 10:15', 'completed'),
  (2, '2025-11-18 14:02', 'completed'),
  (3, '2025-12-02 09:40', 'completed'),
  (1, '2025-12-20 16:25', 'cancelled'),
  (4, '2026-01-05 11:10', 'completed'),
  (5, '2026-01-12 13:45', 'completed'),
  (6, '2026-01-19 08:30', 'completed'),
  (7, '2026-01-27 19:05', 'shipped'),
  (8, '2026-02-03 12:00', 'completed'),
  (2, '2026-02-10 15:20', 'completed'),
  (9, '2026-02-14 10:05', 'completed'),
  (10, '2026-02-21 17:40', 'cancelled'),
  (11, '2026-03-01 09:15', 'completed'),
  (12, '2026-03-08 14:50', 'completed'),
  (3, '2026-03-15 11:35', 'completed'),
  (13, '2026-03-22 16:10', 'completed'),
  (14, '2026-03-29 13:25', 'shipped'),
  (15, '2026-04-04 10:45', 'completed'),
  (16, '2026-04-11 18:00', 'completed'),
  (1, '2026-04-18 09:55', 'completed'),
  (17, '2026-04-25 12:30', 'completed'),
  (18, '2026-05-02 15:15', 'cancelled'),
  (19, '2026-05-09 11:05', 'completed'),
  (20, '2026-05-16 14:40', 'completed'),
  (5, '2026-05-23 10:20', 'completed'),
  (21, '2026-05-30 17:55', 'shipped'),
  (22, '2026-06-06 09:35', 'completed'),
  (23, '2026-06-13 13:00', 'completed'),
  (8, '2026-06-20 16:45', 'completed'),
  (24, '2026-06-27 11:50', 'completed'),
  (25, '2026-07-04 10:10', 'completed'),
  (26, '2026-07-11 15:30', 'shipped'),
  (4, '2026-07-18 12:15', 'completed'),
  (27, '2026-07-25 18:20', 'completed'),
  (28, '2026-08-01 09:45', 'completed'),
  (11, '2026-08-08 14:05', 'completed'),
  (29, '2026-08-15 11:25', 'shipped'),
  (30, '2026-08-22 16:35', 'completed'),
  (6, '2026-08-29 10:50', 'completed'),
  (14, '2026-09-05 13:15', 'shipped'),
  (9, '2026-09-12 17:00', 'pending'),
  (19, '2026-09-19 12:40', 'pending'),
  (2, '2026-09-26 09:20', 'pending'),
  (24, '2026-10-02 15:45', 'pending'),
  (7, '2026-10-08 11:30', 'pending');

INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
  (1, 1, 2, 29.99), (1, 6, 1, 18.50),
  (2, 2, 1, 89.99), (2, 9, 1, 36.50),
  (3, 10, 2, 34.00), (3, 13, 1, 24.99), (3, 7, 1, 54.00),
  (4, 5, 1, 349.00),
  (5, 4, 1, 199.00), (5, 17, 2, 19.99),
  (6, 11, 1, 249.00), (6, 12, 1, 45.00),
  (7, 14, 1, 32.00), (7, 16, 1, 119.00), (7, 20, 3, 15.99),
  (8, 3, 2, 39.99), (8, 1, 1, 29.99),
  (9, 8, 1, 47.99), (9, 6, 2, 18.50), (9, 9, 1, 36.50),
  (10, 15, 1, 159.00),
  (11, 18, 2, 49.00), (11, 19, 1, 89.00),
  (12, 2, 1, 89.99), (12, 3, 1, 39.99),
  (13, 5, 1, 349.00), (13, 1, 1, 29.99), (13, 2, 1, 89.99),
  (14, 13, 2, 24.99), (14, 10, 1, 34.00),
  (15, 7, 1, 54.00), (15, 8, 1, 47.99),
  (16, 16, 1, 119.00), (16, 17, 3, 19.99),
  (17, 4, 1, 199.00),
  (18, 20, 4, 15.99), (18, 18, 1, 49.00),
  (19, 11, 1, 249.00), (19, 10, 1, 34.00), (19, 12, 2, 45.00),
  (20, 6, 3, 18.50), (20, 9, 1, 36.50),
  (21, 14, 2, 32.00), (21, 15, 1, 159.00),
  (22, 19, 1, 89.00),
  (23, 3, 1, 39.99), (23, 4, 1, 199.00),
  (24, 1, 2, 29.99), (24, 13, 1, 24.99),
  (25, 8, 1, 47.99), (25, 7, 1, 54.00), (25, 6, 1, 18.50),
  (26, 16, 1, 119.00), (26, 20, 2, 15.99),
  (27, 2, 1, 89.99), (27, 5, 1, 349.00),
  (28, 17, 4, 19.99), (28, 14, 1, 32.00),
  (29, 18, 1, 49.00), (29, 19, 1, 89.00), (29, 20, 2, 15.99),
  (30, 12, 1, 45.00), (30, 10, 2, 34.00),
  (31, 9, 2, 36.50),
  (32, 11, 1, 249.00),
  (33, 4, 1, 199.00), (33, 3, 1, 39.99),
  (34, 15, 2, 159.00),
  (35, 6, 2, 18.50), (35, 8, 1, 47.99), (35, 13, 1, 24.99),
  (36, 1, 1, 29.99), (36, 2, 1, 89.99),
  (37, 16, 1, 119.00), (37, 14, 1, 32.00),
  (38, 5, 1, 349.00), (38, 3, 2, 39.99),
  (39, 10, 1, 34.00), (39, 13, 2, 24.99),
  (40, 19, 1, 89.00), (40, 18, 1, 49.00),
  (41, 7, 1, 54.00),
  (42, 17, 2, 19.99), (42, 15, 1, 159.00),
  (43, 11, 1, 249.00),
  (44, 4, 1, 199.00), (44, 1, 1, 29.99),
  (45, 9, 1, 36.50), (45, 6, 1, 18.50);
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
  ('Grace Hopper', 'USA'),
  ('Donald Knuth', 'USA'),
  ('Barbara Liskov', 'USA'),
  ('Alan Turing', 'UK'),
  ('Niklaus Wirth', 'Switzerland'),
  ('Margaret Hamilton', 'USA'),
  ('Tim Berners-Lee', 'UK'),
  ('Frances Allen', 'USA'),
  ('Bjarne Stroustrup', 'Denmark'),
  ('Guido van Rossum', 'Netherlands');

INSERT INTO books (title, author_id, published_year, isbn) VALUES
  ('Analytical Engine Notes', 1, 1843, '978-0000000001'),
  ('Structured Programming', 2, 1972, '978-0000000002'),
  ('Compilers and Compiling', 3, 1952, '978-0000000003'),
  ('SQL for Practitioners', 3, 1985, '978-0000000004'),
  ('A Discipline of Programming', 2, 1976, '978-0000000005'),
  ('Selected Writings on Computing', 2, 1982, '978-0000000006'),
  ('The Art of Computer Programming Vol 1', 4, 1968, '978-0000000007'),
  ('The Art of Computer Programming Vol 2', 4, 1969, '978-0000000008'),
  ('Concrete Mathematics', 4, 1989, '978-0000000009'),
  ('Literate Programming', 4, 1992, '978-0000000010'),
  ('Abstraction and Specification', 5, 1986, '978-0000000011'),
  ('Program Development in Java', 5, 2000, '978-0000000012'),
  ('Computing Machinery and Intelligence', 6, 1950, '978-0000000013'),
  ('On Computable Numbers', 6, 1936, '978-0000000014'),
  ('Algorithms + Data Structures = Programs', 7, 1976, '978-0000000015'),
  ('Compiler Construction', 7, 1996, '978-0000000016'),
  ('Project Oberon', 7, 1992, '978-0000000017'),
  ('Apollo Guidance Software', 8, 1969, '978-0000000018'),
  ('Higher Order Software', 8, 1976, '978-0000000019'),
  ('Weaving the Web', 9, 1999, '978-0000000020'),
  ('Information Management: A Proposal', 9, 1989, '978-0000000021'),
  ('Program Optimization', 10, 1966, '978-0000000022'),
  ('Interprocedural Data Flow', 10, 1976, '978-0000000023'),
  ('The C++ Programming Language', 11, 1985, '978-0000000024'),
  ('The Design and Evolution of C++', 11, 1994, '978-0000000025'),
  ('A Tour of C++', 11, 2013, '978-0000000026'),
  ('Python Tutorial', 12, 1995, '978-0000000027'),
  ('Computer Programming for Everybody', 12, 1999, '978-0000000028'),
  ('Sketch of the Analytical Engine', 1, 1842, '978-0000000029'),
  ('COBOL Report', 3, 1960, '978-0000000030');

INSERT INTO members (name, email, joined_at) VALUES
  ('Alice Chen', 'alice@library.test', '2024-01-10'),
  ('Bob Martinez', 'bob@library.test', '2024-02-14'),
  ('Carla Singh', 'carla@library.test', '2024-03-03'),
  ('David Kim', 'david@library.test', '2024-04-21'),
  ('Elena Rossi', 'elena@library.test', '2024-05-09'),
  ('Farah Haddad', 'farah@library.test', '2024-06-18'),
  ('Gabriel Silva', 'gabriel@library.test', '2024-07-02'),
  ('Hannah Becker', 'hannah@library.test', '2024-08-25'),
  ('Ivan Petrov', 'ivan@library.test', '2024-09-12'),
  ('Julia Santos', 'julia@library.test', '2024-10-30'),
  ('Kenji Watanabe', 'kenji@library.test', '2024-11-11'),
  ('Laura Bianchi', 'laura@library.test', '2024-12-05'),
  ('Mohammed Ali', 'mohammed@library.test', '2025-01-17'),
  ('Nina Kowalski', 'nina@library.test', '2025-02-08'),
  ('Omar Hassan', 'omar@library.test', '2025-03-22'),
  ('Patricia Lopez', 'patricia@library.test', '2025-04-14'),
  ('Quinn Murphy', 'quinn@library.test', '2025-05-29'),
  ('Rahul Verma', 'rahul@library.test', '2025-06-06'),
  ('Sara Lindgren', 'sara@library.test', '2025-07-19'),
  ('Tomas Novak', 'tomas@library.test', '2025-08-23'),
  ('Uma Reddy', 'uma@library.test', '2025-09-15'),
  ('Victor Dubois', 'victor@library.test', '2025-10-01'),
  ('Wendy Zhao', 'wendy@library.test', '2025-11-20'),
  ('Xavier Moreno', 'xavier@library.test', '2025-12-12'),
  ('Yasmin Aziz', 'yasmin@library.test', '2026-01-03');

INSERT INTO loans (book_id, member_id, loaned_at, due_at, returned_at) VALUES
  (7, 1, '2026-01-05', '2026-01-26', '2026-01-20'),
  (2, 2, '2026-01-08', '2026-01-29', '2026-01-27'),
  (13, 3, '2026-01-12', '2026-02-02', '2026-01-30'),
  (24, 4, '2026-01-15', '2026-02-05', '2026-02-04'),
  (8, 5, '2026-01-20', '2026-02-10', '2026-02-08'),
  (20, 6, '2026-01-25', '2026-02-15', '2026-02-12'),
  (15, 7, '2026-02-01', '2026-02-22', '2026-02-20'),
  (3, 8, '2026-02-04', '2026-02-25', '2026-02-24'),
  (9, 9, '2026-02-10', '2026-03-03', '2026-03-01'),
  (27, 10, '2026-02-14', '2026-03-07', '2026-03-05'),
  (14, 11, '2026-02-18', '2026-03-11', '2026-03-10'),
  (5, 12, '2026-02-22', '2026-03-15', '2026-03-14'),
  (7, 13, '2026-03-01', '2026-03-22', '2026-03-21'),
  (25, 14, '2026-03-05', '2026-03-26', '2026-03-25'),
  (11, 15, '2026-03-09', '2026-03-30', '2026-03-28'),
  (18, 16, '2026-03-14', '2026-04-04', '2026-04-02'),
  (1, 17, '2026-03-18', '2026-04-08', '2026-04-07'),
  (4, 18, '2026-03-22', '2026-04-12', '2026-04-10'),
  (13, 19, '2026-03-27', '2026-04-17', '2026-04-15'),
  (16, 20, '2026-04-01', '2026-04-22', '2026-04-21'),
  (8, 21, '2026-04-05', '2026-04-26', '2026-04-24'),
  (26, 22, '2026-04-10', '2026-05-01', '2026-04-29'),
  (2, 23, '2026-04-15', '2026-05-06', '2026-05-05'),
  (20, 24, '2026-04-20', '2026-05-11', '2026-05-10'),
  (10, 25, '2026-04-25', '2026-05-16', '2026-05-14'),
  (6, 1, '2026-05-01', '2026-05-22', '2026-05-20'),
  (29, 2, '2026-05-06', '2026-05-27', '2026-05-26'),
  (24, 3, '2026-05-11', '2026-06-01', '2026-05-30'),
  (17, 4, '2026-05-16', '2026-06-06', '2026-06-05'),
  (12, 5, '2026-05-21', '2026-06-11', '2026-06-10'),
  (7, 6, '2026-05-26', '2026-06-16', '2026-06-14'),
  (30, 7, '2026-06-01', '2026-06-22', '2026-06-20'),
  (21, 8, '2026-06-06', '2026-06-27', '2026-06-25'),
  (14, 9, '2026-06-11', '2026-07-02', '2026-07-01'),
  (28, 10, '2026-06-16', '2026-07-07', '2026-07-06'),
  (5, 11, '2026-06-21', '2026-07-12', '2026-07-10'),
  (19, 12, '2026-06-26', '2026-07-17', '2026-07-15'),
  (9, 13, '2026-07-01', '2026-07-22', '2026-07-21'),
  (24, 14, '2026-07-06', '2026-07-27', '2026-07-25'),
  (13, 15, '2026-07-11', '2026-08-01', '2026-07-30'),
  (3, 16, '2026-07-16', '2026-08-06', '2026-08-04'),
  (15, 17, '2026-07-21', '2026-08-11', '2026-08-10'),
  (27, 18, '2026-07-26', '2026-08-16', '2026-08-15'),
  (8, 19, '2026-08-01', '2026-08-22', NULL),
  (1, 20, '2026-08-06', '2026-08-27', '2026-08-25'),
  (2, 21, '2026-08-11', '2026-09-01', NULL),
  (20, 22, '2026-08-16', '2026-09-06', '2026-09-04'),
  (11, 23, '2026-08-21', '2026-09-11', '2026-09-10'),
  (7, 24, '2026-08-26', '2026-09-16', NULL),
  (25, 25, '2026-09-01', '2026-09-22', '2026-09-20'),
  (13, 1, '2026-09-05', '2026-09-26', NULL),
  (4, 2, '2026-09-10', '2026-10-01', NULL),
  (16, 3, '2026-09-15', '2026-10-06', NULL),
  (9, 4, '2026-09-18', '2026-10-09', NULL),
  (26, 5, '2026-09-22', '2026-10-13', NULL),
  (18, 6, '2026-09-25', '2026-10-16', NULL),
  (5, 7, '2026-09-28', '2026-10-19', NULL),
  (10, 8, '2026-10-01', '2026-10-22', NULL),
  (24, 9, '2026-10-03', '2026-10-24', NULL),
  (14, 10, '2026-10-06', '2026-10-27', NULL);
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
  ('People Ops', 'Remote'),
  ('Design', 'Berlin'),
  ('Sales', 'Chicago'),
  ('Marketing', 'London');

INSERT INTO employees (full_name, email, department_id, salary, hired_at) VALUES
  ('Alice Chen', 'alice@acme.co', 1, 145000, '2022-03-01'),
  ('Bob Martinez', 'bob@acme.co', 1, 132000, '2021-11-15'),
  ('Carla Singh', 'carla@acme.co', 2, 118000, '2023-01-10'),
  ('David Kim', 'david@acme.co', 3, 95000, '2020-08-20'),
  ('Elena Rossi', 'elena@acme.co', 2, 125000, '2022-07-01'),
  ('Farah Haddad', 'farah@acme.co', 1, 158000, '2017-05-08'),
  ('Gabriel Silva', 'gabriel@acme.co', 1, 121000, '2023-06-12'),
  ('Hannah Becker', 'hannah@acme.co', 1, 99000, '2024-02-19'),
  ('Ivan Petrov', 'ivan@acme.co', 1, 167000, '2016-09-26'),
  ('Julia Santos', 'julia@acme.co', 1, 138000, '2019-04-15'),
  ('Kenji Watanabe', 'kenji@acme.co', 1, 112000, '2024-08-05'),
  ('Laura Bianchi', 'laura@acme.co', 2, 131000, '2018-10-01'),
  ('Mohammed Ali', 'mohammed@acme.co', 2, 109000, '2021-03-22'),
  ('Nina Kowalski', 'nina@acme.co', 2, 142000, '2017-01-09'),
  ('Omar Hassan', 'omar@acme.co', 2, 98000, '2025-01-13'),
  ('Patricia Lopez', 'patricia@acme.co', 4, 115000, '2020-06-29'),
  ('Quinn Murphy', 'quinn@acme.co', 4, 104000, '2022-11-07'),
  ('Rahul Verma', 'rahul@acme.co', 4, 127000, '2018-03-19'),
  ('Sara Lindgren', 'sara@acme.co', 4, 92000, '2024-05-27'),
  ('Tomas Novak', 'tomas@acme.co', 5, 88000, '2021-08-16'),
  ('Uma Reddy', 'uma@acme.co', 5, 135000, '2016-04-04'),
  ('Victor Dubois', 'victor@acme.co', 5, 97000, '2023-02-06'),
  ('Wendy Zhao', 'wendy@acme.co', 5, 79000, '2025-03-03'),
  ('Xavier Moreno', 'xavier@acme.co', 5, 112000, '2019-12-02'),
  ('Yasmin Aziz', 'yasmin@acme.co', 6, 101000, '2020-01-20'),
  ('Zane Cooper', 'zane@acme.co', 6, 86000, '2023-09-11'),
  ('Amelia Ward', 'amelia@acme.co', 6, 119000, '2018-07-23'),
  ('Bruno Ferreira', 'bruno@acme.co', 6, 93000, '2024-10-14'),
  ('Chloe Martin', 'chloe@acme.co', 3, 89000, '2022-04-25'),
  ('Diego Ramirez', 'diego@acme.co', 3, 104000, '2019-02-11'),
  ('Erik Larsen', 'erik@acme.co', 3, 78000, '2025-06-02'),
  ('Fiona Walsh', 'fiona@acme.co', 1, 149000, '2015-11-30'),
  ('Gustavo Reyes', 'gustavo@acme.co', 1, 126000, '2020-10-19'),
  ('Helena Fischer', 'helena@acme.co', 2, 117000, '2022-01-24'),
  ('Isaac Newman', 'isaac@acme.co', 4, 108000, '2021-05-17'),
  ('Jasmine Patel', 'jasmine@acme.co', 5, 94000, '2022-08-08'),
  ('Karl Johansson', 'karl@acme.co', 6, 99000, '2021-12-06'),
  ('Leila Moradi', 'leila@acme.co', 1, 141000, '2018-06-11'),
  ('Marco Conti', 'marco@acme.co', 5, 83000, '2024-07-15'),
  ('Naomi Brooks', 'naomi@acme.co', 3, 97000, '2017-09-04');

INSERT INTO projects (name, department_id, budget) VALUES
  ('Data Platform', 1, 500000),
  ('Mobile App', 2, 320000),
  ('Hiring Portal', 3, 80000),
  ('Payments API', 1, 410000),
  ('Search Revamp', 1, 260000),
  ('Customer Insights', 2, 180000),
  ('Design System', 4, 150000),
  ('Brand Refresh', 6, 120000),
  ('Enterprise Deals', 5, 200000),
  ('Partner Program', 5, 95000),
  ('Onboarding Flow', 4, 110000),
  ('Wellness Initiative', 3, 60000);

INSERT INTO employee_projects (employee_id, project_id, role, hours_allocated) VALUES
  (1, 1, 'Tech Lead', 24), (1, 4, 'Advisor', 8),
  (2, 1, 'Engineer', 32), (2, 5, 'Engineer', 8),
  (3, 2, 'PM', 20), (3, 6, 'PM', 16),
  (4, 3, 'Coordinator', 12), (4, 12, 'Coordinator', 10),
  (5, 2, 'Designer', 16), (5, 11, 'Designer', 12),
  (6, 4, 'Tech Lead', 28), (6, 1, 'Architect', 8),
  (7, 4, 'Engineer', 36),
  (8, 5, 'Engineer', 30), (8, 2, 'Engineer', 6),
  (9, 1, 'Architect', 16), (9, 5, 'Tech Lead', 20),
  (10, 4, 'Engineer', 24), (10, 6, 'Engineer', 12),
  (11, 5, 'Engineer', 36),
  (12, 6, 'Product Lead', 24), (12, 9, 'Advisor', 4),
  (13, 2, 'Analyst', 20), (13, 6, 'Analyst', 16),
  (14, 2, 'Product Lead', 18), (14, 4, 'PM', 14),
  (15, 6, 'Analyst', 30),
  (16, 7, 'Design Lead', 24), (16, 2, 'Designer', 12),
  (17, 7, 'Designer', 30), (17, 8, 'Designer', 8),
  (18, 11, 'Design Lead', 20), (18, 7, 'Reviewer', 6),
  (19, 11, 'Designer', 32),
  (20, 9, 'Account Exec', 28),
  (21, 9, 'Sales Lead', 20), (21, 10, 'Sales Lead', 16),
  (22, 10, 'Account Exec', 30),
  (23, 9, 'SDR', 36),
  (24, 10, 'Partner Manager', 24), (24, 6, 'Advisor', 4),
  (25, 8, 'Marketing Lead', 24), (25, 10, 'Marketer', 10),
  (26, 8, 'Content Writer', 30),
  (27, 8, 'Strategist', 16), (27, 9, 'Marketer', 12),
  (28, 8, 'Designer', 20),
  (29, 3, 'Recruiter', 28),
  (30, 12, 'Program Lead', 20), (30, 3, 'Advisor', 6),
  (31, 3, 'Recruiter', 32),
  (32, 1, 'Engineering Manager', 12), (32, 4, 'Engineering Manager', 12),
  (33, 1, 'Engineer', 36),
  (34, 6, 'PM', 20), (34, 11, 'PM', 12),
  (35, 7, 'Designer', 28),
  (36, 9, 'Account Exec', 32),
  (37, 8, 'Analyst', 18), (37, 6, 'Analyst', 10),
  (38, 5, 'Engineer', 28), (38, 1, 'Engineer', 8),
  (39, 10, 'SDR', 36),
  (40, 12, 'Coordinator', 16), (40, 3, 'Coordinator', 12);
`;

export const SAMPLE_DATABASES: SampleDatabase[] = [
  {
    id: "students-departments",
    name: "Students & Departments",
    description: "Departments, students, courses, and enrollments — ideal for JOINs.",
    sql: STUDENTS_DEPARTMENTS_SQL,
    starterQuery: `-- Department performance report
-- 3 JOINs → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT
SELECT d.name AS department,
       COUNT(DISTINCT s.id) AS students,
       COUNT(*) AS enrollments,
       SUM(c.credits) AS total_credits,
       ROUND(AVG(s.gpa), 2) AS avg_gpa,
       SUM(CASE WHEN e.grade IN ('A', 'A-') THEN 1 ELSE 0 END) AS top_grades
FROM enrollments e
INNER JOIN students s ON s.id = e.student_id
INNER JOIN courses c ON c.id = e.course_id
INNER JOIN departments d ON d.id = c.department_id
WHERE e.grade IS NOT NULL
  AND s.gpa >= 2.5
GROUP BY d.id, d.name
HAVING COUNT(*) >= 13
ORDER BY avg_gpa DESC, total_credits DESC
LIMIT 3;`,
  },
  {
    id: "ecommerce",
    name: "E-commerce Store",
    description: "Customers, products, orders, and line items with multiple FKs.",
    sql: ECOMMERCE_SQL,
    starterQuery: `-- Revenue by city for fulfilled 2026 orders
-- 3 JOINs → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT
SELECT c.city,
       COUNT(DISTINCT c.id) AS customers,
       COUNT(DISTINCT o.id) AS orders,
       SUM(oi.quantity) AS units_sold,
       ROUND(SUM(oi.quantity * oi.unit_price), 2) AS revenue,
       MAX(p.price) AS priciest_item
FROM order_items oi
INNER JOIN orders o ON o.id = oi.order_id
INNER JOIN customers c ON c.id = o.customer_id
INNER JOIN products p ON p.id = oi.product_id
WHERE o.status IN ('completed', 'shipped')
  AND o.order_date >= '2026-01-01'
GROUP BY c.city
HAVING COUNT(DISTINCT o.id) >= 3
ORDER BY revenue DESC
LIMIT 5;`,
  },
  {
    id: "library",
    name: "Library System",
    description: "Authors, books, members, and active loans.",
    sql: LIBRARY_SQL,
    starterQuery: `-- Most borrowed authors (LEFT JOINs keep books that were never loaned)
-- 3 LEFT JOINs → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT
SELECT a.name AS author,
       a.country,
       COUNT(DISTINCT b.id) AS books,
       COUNT(l.id) AS loans,
       COUNT(DISTINCT m.id) AS borrowers,
       SUM(CASE WHEN l.id IS NOT NULL AND l.returned_at IS NULL THEN 1 ELSE 0 END) AS on_loan,
       MIN(b.published_year) AS first_published
FROM authors a
LEFT JOIN books b ON b.author_id = a.id
LEFT JOIN loans l ON l.book_id = b.id
LEFT JOIN members m ON m.id = l.member_id
WHERE a.country IN ('UK', 'USA', 'Netherlands', 'Switzerland')
GROUP BY a.id, a.name, a.country
HAVING COUNT(l.id) >= 3
ORDER BY loans DESC, author ASC
LIMIT 6;`,
  },
  {
    id: "company-hr",
    name: "Company HR",
    description: "Employees, departments, projects, and assignments.",
    sql: COMPANY_HR_SQL,
    starterQuery: `-- Project staffing by department for employees hired since 2019
-- 3 JOINs → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT
SELECT d.name AS department,
       d.location,
       COUNT(DISTINCT e.id) AS staffed_employees,
       COUNT(DISTINCT p.id) AS projects,
       SUM(ep.hours_allocated) AS weekly_hours,
       ROUND(AVG(e.salary), 0) AS avg_salary,
       MAX(e.salary) AS top_salary
FROM employee_projects ep
INNER JOIN employees e ON e.id = ep.employee_id
INNER JOIN projects p ON p.id = ep.project_id
INNER JOIN departments d ON d.id = e.department_id
WHERE e.hired_at >= '2019-01-01'
  AND ep.hours_allocated >= 8
GROUP BY d.id, d.name, d.location
HAVING SUM(ep.hours_allocated) >= 110
ORDER BY weekly_hours DESC
LIMIT 4;`,
  },
];

export function getSampleDatabaseById(id: string): SampleDatabase | undefined {
  return SAMPLE_DATABASES.find((db) => db.id === id);
}
