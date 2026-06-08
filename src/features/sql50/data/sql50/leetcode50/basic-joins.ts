import type { PracticeProblem } from "../../../../../lib/practice/types";

export const basicJoinsProblems: PracticeProblem[] = [
  {
    id: 6,
    leetcodeId: 1378,
    slug: "replace-employee-id-with-the-unique-identifier",
    title: "Replace Employee ID With The Unique Identifier",
    difficulty: "easy",
    topics: ["Basic Joins"],
    description:
      "Show each employee's name with their unique identifier, or null if missing.",
    statement: `Tables: Employees, EmployeeUNI

Employees:
+-------------+---------+
| Column Name | Type    |
+-------------+---------+
| id          | int     |
| name        | varchar |
+-------------+---------+
id is the primary key.

EmployeeUNI:
+-------------+---------+
| Column Name | Type    |
+-------------+---------+
| id          | int     |
| unique_id   | int     |
+-------------+---------+
(id, unique_id) is the primary key.

Show the unique ID of each employee. If an employee does not have a unique ID, show null.

Example:
Input:
Employees: id=1 name='Alice', id=7 name='Bob', id=11 name='Meir', id=90 name='Winston', id=3 name='Jonathan'
EmployeeUNI: (1,10), (7,11), (11,1), (90,13), (3,12)
Output:
+-------------+-------+
| unique_id   | name  |
+-------------+-------+
| null        | Alice |
| 11          | Bob   |
| 1           | Meir  |
| 13          | Winston |
| 12          | Jonathan |
+-------------+-------+

Constraints:
- Use a LEFT JOIN from Employees to EmployeeUNI.`,
    schemaSql: `
CREATE TABLE Employees (
  id INT PRIMARY KEY,
  name VARCHAR(255) NOT NULL
);
CREATE TABLE EmployeeUNI (
  id INT NOT NULL,
  unique_id INT NOT NULL,
  PRIMARY KEY (id, unique_id)
);`,
    seedSql: `
INSERT INTO Employees (id, name) VALUES
  (1, 'Alice'), (7, 'Bob'), (11, 'Meir'), (90, 'Winston'), (3, 'Jonathan');
INSERT INTO EmployeeUNI (id, unique_id) VALUES
  (1, 10), (7, 11), (11, 1), (90, 13), (3, 12);`,
    expectedOutputSql: `
SELECT eu.unique_id, e.name
FROM Employees e
LEFT JOIN EmployeeUNI eu ON e.id = eu.id
ORDER BY e.id;`,
    hints: [
      "LEFT JOIN Employees to EmployeeUNI on id.",
      "Employees without a match should show NULL for unique_id.",
      "Select unique_id and name columns.",
    ],
    explanation:
      "LEFT JOIN Employees with EmployeeUNI so every employee appears even without a unique_id.",
    officialSolution: `
SELECT eu.unique_id, e.name
FROM Employees e
LEFT JOIN EmployeeUNI eu ON e.id = eu.id;`,
  },
  {
    id: 7,
    leetcodeId: 1068,
    slug: "product-sales-analysis-i",
    title: "Product Sales Analysis I",
    difficulty: "easy",
    topics: ["Basic Joins"],
    description:
      "Return product name, year, and price for each sale.",
    statement: `Tables: Sales, Product

Sales:
+-------------+---------+
| Column Name | Type    |
+-------------+---------+
| sale_id     | int     |
| product_id  | int     |
| year        | int     |
| quantity    | int     |
| price       | int     |
+-------------+---------+

Product:
+--------------+---------+
| Column Name  | Type    |
+--------------+---------+
| product_id   | int     |
| product_name | varchar |
+--------------+---------+

Write a solution to report product_name, year, and price for each sale_id.

Example:
Input:
Sales: (1,100,2008,5,5000), (2,100,2009,7,5000), (7,200,2011,15,9000)
Product: (100,'Nokia'), (200,'Apple'), (300,'Samsung')
Output:
+--------------+------+-------+
| product_name | year | price |
+--------------+------+-------+
| Nokia        | 2008 | 5000  |
| Nokia        | 2009 | 5000  |
| Apple        | 2011 | 9000  |
+--------------+------+-------+

Constraints:
- Join Sales and Product on product_id.`,
    schemaSql: `
CREATE TABLE Sales (
  sale_id INT PRIMARY KEY,
  product_id INT NOT NULL,
  year INT NOT NULL,
  quantity INT NOT NULL,
  price INT NOT NULL
);
CREATE TABLE Product (
  product_id INT PRIMARY KEY,
  product_name VARCHAR(255) NOT NULL
);`,
    seedSql: `
INSERT INTO Sales (sale_id, product_id, year, quantity, price) VALUES
  (1, 100, 2008, 5, 5000),
  (2, 100, 2009, 7, 5000),
  (7, 200, 2011, 15, 9000);
INSERT INTO Product (product_id, product_name) VALUES
  (100, 'Nokia'), (200, 'Apple'), (300, 'Samsung');`,
    expectedOutputSql: `
SELECT p.product_name, s.year, s.price
FROM Sales s
JOIN Product p ON s.product_id = p.product_id
ORDER BY s.sale_id;`,
    hints: [
      "INNER JOIN Sales to Product on product_id.",
      "Return product_name, year, and price.",
      "Every sale row should produce one output row.",
    ],
    explanation:
      "Join Sales with Product to attach product_name to each sale record.",
    officialSolution: `
SELECT p.product_name, s.year, s.price
FROM Sales s
JOIN Product p ON s.product_id = p.product_id;`,
  },
  {
    id: 8,
    leetcodeId: 1581,
    slug: "customer-who-visited-but-did-not-make-any-transactions",
    title: "Customer Who Visited but Did Not Make Any Transactions",
    difficulty: "easy",
    topics: ["Basic Joins"],
    description:
      "Count visits by customers who never made a transaction.",
    statement: `Tables: Visits, Transactions

Visits:
+-------------+---------+
| Column Name | Type    |
+-------------+---------+
| visit_id    | int     |
| customer_id | int     |
+-------------+---------+

Transactions:
+-------------+---------+
| Column Name | Type    |
+-------------+---------+
| transaction_id | int  |
| visit_id    | int     |
| amount      | int     |
+-------------+---------+

Find the number of times each customer visited but did not make any transactions.

Example:
Input:
Visits: (1,23), (2,9), (4,30), (5,30), (6,2), (7,3)
Transactions: (2,1,120), (3,2,54), (4,6,310), (5,7,1400), (6,8,200)
Output:
+-------------+----------------+
| customer_id | count_no_trans |
+-------------+----------------+
| 30          | 2              |
+-------------+----------------+

Constraints:
- Use LEFT JOIN and filter where transaction_id IS NULL.`,
    schemaSql: `
CREATE TABLE Visits (
  visit_id INT PRIMARY KEY,
  customer_id INT NOT NULL
);
CREATE TABLE Transactions (
  transaction_id INT PRIMARY KEY,
  visit_id INT NOT NULL,
  amount INT NOT NULL
);`,
    seedSql: `
INSERT INTO Visits (visit_id, customer_id) VALUES
  (1, 23), (2, 9), (4, 30), (5, 30), (6, 2), (7, 3);
INSERT INTO Transactions (transaction_id, visit_id, amount) VALUES
  (2, 1, 120), (3, 2, 54), (4, 6, 310), (5, 7, 1400), (6, 8, 200);`,
    expectedOutputSql: `
SELECT v.customer_id, COUNT(*) AS count_no_trans
FROM Visits v
LEFT JOIN Transactions t ON v.visit_id = t.visit_id
WHERE t.transaction_id IS NULL
GROUP BY v.customer_id
ORDER BY v.customer_id;`,
    hints: [
      "LEFT JOIN Visits to Transactions on visit_id.",
      "Keep rows where transaction_id IS NULL.",
      "GROUP BY customer_id and COUNT visits.",
    ],
    explanation:
      "LEFT JOIN to find visits without transactions, then count per customer.",
    officialSolution: `
SELECT v.customer_id, COUNT(*) AS count_no_trans
FROM Visits v
LEFT JOIN Transactions t ON v.visit_id = t.visit_id
WHERE t.transaction_id IS NULL
GROUP BY v.customer_id;`,
  },
  {
    id: 9,
    leetcodeId: 197,
    slug: "rising-temperature",
    title: "Rising Temperature",
    difficulty: "easy",
    topics: ["Basic Joins"],
    description:
      "Find dates when the temperature was higher than the previous day.",
    statement: `Table: Weather

+-------------+------+
| Column Name | Type |
+-------------+------+
| id          | int  |
| recordDate  | date |
| temperature | int  |
+-------------+------+
id is the primary key.

Find all dates with a higher temperature than the previous day.

Example:
Input:
Weather:
+----+------------+-------------+
| id | recordDate | temperature |
+----+------------+-------------+
| 1  | 2015-01-01 | 10          |
| 2  | 2015-01-02 | 25          |
| 3  | 2015-01-03 | 20          |
| 4  | 2015-01-04 | 30          |
+----+------------+-------------+
Output:
+------------+
| recordDate |
+------------+
| 2015-01-02 |
| 2015-01-04 |
+------------+

Constraints:
- Self-join on consecutive dates (recordDate = previous + 1 day).`,
    schemaSql: `
CREATE TABLE Weather (
  id INT PRIMARY KEY,
  recordDate DATE NOT NULL,
  temperature INT NOT NULL
);`,
    seedSql: `
INSERT INTO Weather (id, recordDate, temperature) VALUES
  (1, '2015-01-01', 10),
  (2, '2015-01-02', 25),
  (3, '2015-01-03', 20),
  (4, '2015-01-04', 30);`,
    expectedOutputSql: `
SELECT w1.recordDate
FROM Weather w1
JOIN Weather w2 ON w1.recordDate = w2.recordDate + INTERVAL '1 day'
WHERE w1.temperature > w2.temperature
ORDER BY w1.recordDate;`,
    hints: [
      "Self-join Weather to compare each day with the previous day.",
      "In PostgreSQL, add INTERVAL '1 day' to the earlier date.",
      "Filter where today's temperature exceeds yesterday's.",
    ],
    explanation:
      "Self-join on consecutive dates and filter where the current day's temperature is higher.",
    officialSolution: `
SELECT w1.recordDate
FROM Weather w1
JOIN Weather w2 ON w1.recordDate = w2.recordDate + INTERVAL '1 day'
WHERE w1.temperature > w2.temperature;`,
  },
  {
    id: 10,
    leetcodeId: 1661,
    slug: "average-time-of-process-per-machine",
    title: "Average Time of Process per Machine",
    difficulty: "easy",
    topics: ["Basic Joins"],
    description:
      "Compute average processing time per machine from start/end events.",
    statement: `Table: Activity

+-------------+---------+
| Column Name | Type    |
+-------------+---------+
| machine_id  | int     |
| process_id  | int     |
| activity_type | varchar |
| timestamp   | float   |
+-------------+---------+
(machine_id, process_id, activity_type) is the primary key.
activity_type is 'start' or 'end'.
timestamp is seconds since epoch.

Find average processing time per machine. Round to 3 decimal places.

Example:
Input:
Activity:
+------------+------------+---------------+-----------+
| machine_id | process_id | activity_type | timestamp |
+------------+------------+---------------+-----------+
| 0          | 0          | start         | 0.712     |
| 0          | 0          | end           | 1.520     |
| 0          | 1          | start         | 3.140     |
| 0          | 1          | end           | 4.120     |
| 1          | 0          | start         | 0.550     |
| 1          | 0          | end           | 1.550     |
| 1          | 1          | start         | 0.430     |
| 1          | 1          | end           | 1.420     |
| 2          | 0          | start         | 4.100     |
| 2          | 0          | end           | 4.512     |
| 2          | 1          | start         | 2.500     |
| 2          | 1          | end           | 5.000     |
+------------+------------+---------------+-----------+
Output:
+------------+-----------------+
| machine_id | processing_time |
+------------+-----------------+
| 0          | 0.894           |
| 1          | 0.995           |
| 2          | 1.456           |
+------------+-----------------+

Constraints:
- Join start and end rows per (machine_id, process_id), then average.`,
    schemaSql: `
CREATE TABLE Activity (
  machine_id INT NOT NULL,
  process_id INT NOT NULL,
  activity_type VARCHAR(10) NOT NULL,
  timestamp DOUBLE PRECISION NOT NULL,
  PRIMARY KEY (machine_id, process_id, activity_type)
);`,
    seedSql: `
INSERT INTO Activity (machine_id, process_id, activity_type, timestamp) VALUES
  (0, 0, 'start', 0.712), (0, 0, 'end', 1.520),
  (0, 1, 'start', 3.140), (0, 1, 'end', 4.120),
  (1, 0, 'start', 0.550), (1, 0, 'end', 1.550),
  (1, 1, 'start', 0.430), (1, 1, 'end', 1.420),
  (2, 0, 'start', 4.100), (2, 0, 'end', 4.512),
  (2, 1, 'start', 2.500), (2, 1, 'end', 5.000);`,
    expectedOutputSql: `
SELECT a1.machine_id,
  ROUND(AVG(a2.timestamp - a1.timestamp)::numeric, 3) AS processing_time
FROM Activity a1
JOIN Activity a2
  ON a1.machine_id = a2.machine_id
  AND a1.process_id = a2.process_id
  AND a1.activity_type = 'start'
  AND a2.activity_type = 'end'
GROUP BY a1.machine_id
ORDER BY a1.machine_id;`,
    hints: [
      "Self-join Activity matching start/end pairs for the same machine and process.",
      "Processing time is end timestamp minus start timestamp.",
      "GROUP BY machine_id and ROUND the average to 3 decimals.",
    ],
    explanation:
      "Join start and end events per process, compute duration, then average per machine.",
    officialSolution: `
SELECT a1.machine_id,
  ROUND(AVG(a2.timestamp - a1.timestamp)::numeric, 3) AS processing_time
FROM Activity a1
JOIN Activity a2
  ON a1.machine_id = a2.machine_id
  AND a1.process_id = a2.process_id
  AND a1.activity_type = 'start'
  AND a2.activity_type = 'end'
GROUP BY a1.machine_id;`,
  },
  {
    id: 11,
    leetcodeId: 577,
    slug: "employee-bonus",
    title: "Employee Bonus",
    difficulty: "easy",
    topics: ["Basic Joins"],
    description:
      "List employees with bonus less than 1000, including those with no bonus.",
    statement: `Tables: Employee, Bonus

Employee:
+-------------+---------+
| Column Name | Type    |
+-------------+---------+
| empId       | int     |
| name        | varchar |
| supervisor  | int     |
| salary      | int     |
+-------------+---------+

Bonus:
+-------------+------+
| Column Name | Type |
+-------------+------+
| empId       | int  |
| bonus       | int  |
+-------------+------+

Find employees who received a bonus less than 1000 (or no bonus at all).

Example:
Input:
Employee: (3,'Brad',null,4000), (1,'John',3,1000), (2,'Dan',3,2000), (4,'Thomas',3,4000)
Bonus: (2,500), (4,2000)
Output:
+------+
| name |
+------+
| Brad |
| John |
| Dan  |
+------+

Constraints:
- Use LEFT JOIN; include NULL bonuses.`,
    schemaSql: `
CREATE TABLE Employee (
  empId INT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  supervisor INT,
  salary INT NOT NULL
);
CREATE TABLE Bonus (
  empId INT PRIMARY KEY,
  bonus INT NOT NULL
);`,
    seedSql: `
INSERT INTO Employee (empId, name, supervisor, salary) VALUES
  (3, 'Brad', NULL, 4000),
  (1, 'John', 3, 1000),
  (2, 'Dan', 3, 2000),
  (4, 'Thomas', 3, 4000);
INSERT INTO Bonus (empId, bonus) VALUES
  (2, 500), (4, 2000);`,
    expectedOutputSql: `
SELECT e.name
FROM Employee e
LEFT JOIN Bonus b ON e.empId = b.empId
WHERE b.bonus IS NULL OR b.bonus < 1000
ORDER BY e.name;`,
    hints: [
      "LEFT JOIN Employee to Bonus on empId.",
      "Include rows where bonus IS NULL or bonus < 1000.",
      "Return the employee name.",
    ],
    explanation:
      "LEFT JOIN to include employees without bonuses, filtering for missing or low bonuses.",
    officialSolution: `
SELECT e.name
FROM Employee e
LEFT JOIN Bonus b ON e.empId = b.empId
WHERE b.bonus IS NULL OR b.bonus < 1000;`,
  },
  {
    id: 12,
    leetcodeId: 1280,
    slug: "students-and-examinations",
    title: "Students and Examinations",
    difficulty: "medium",
    topics: ["Basic Joins"],
    description:
      "Count how many times each student attended each subject exam.",
    statement: `Tables: Students, Subjects, Examinations

Students: student_id, student_name
Subjects: subject_name
Examinations: student_id, subject_name

Find the number of times each student attended each exam. Include zero counts.

Example:
Input:
Students: (1,'Alice'), (2,'Bob'), (13,'John'), (6,'Alex')
Subjects: 'Math', 'Physics', 'Programming'
Examinations: (1,'Math'), (1,'Physics'), (1,'Programming'), (2,'Programming'), (1,'Physics'), (13,'Math'), (13,'Programming'), (13,'Physics'), (2,'Math'), (1,'Math')
Output:
+------------+--------------+--------------+----------------+
| student_id | student_name | subject_name | attended_exams |
+------------+--------------+--------------+----------------+
| 1          | Alice        | Math         | 2              |
| 1          | Alice        | Physics      | 2              |
| 1          | Alice        | Programming  | 1              |
| 2          | Bob          | Math         | 1              |
| 2          | Bob          | Physics      | 0              |
| 2          | Bob          | Programming  | 1              |
| 6          | Alex         | Math         | 0              |
| 6          | Alex         | Physics      | 0              |
| 6          | Alex         | Programming  | 0              |
| 13         | John         | Math         | 1              |
| 13         | John         | Physics      | 1              |
| 13         | John         | Programming  | 1              |
+------------+--------------+--------------+----------------+

Constraints:
- Cross join students × subjects, LEFT JOIN examinations, GROUP BY.`,
    schemaSql: `
CREATE TABLE Students (
  student_id INT PRIMARY KEY,
  student_name VARCHAR(255) NOT NULL
);
CREATE TABLE Subjects (
  subject_name VARCHAR(255) PRIMARY KEY
);
CREATE TABLE Examinations (
  student_id INT NOT NULL,
  subject_name VARCHAR(255) NOT NULL
);`,
    seedSql: `
INSERT INTO Students (student_id, student_name) VALUES
  (1, 'Alice'), (2, 'Bob'), (13, 'John'), (6, 'Alex');
INSERT INTO Subjects (subject_name) VALUES
  ('Math'), ('Physics'), ('Programming');
INSERT INTO Examinations (student_id, subject_name) VALUES
  (1, 'Math'), (1, 'Physics'), (1, 'Programming'),
  (2, 'Programming'), (1, 'Physics'), (13, 'Math'),
  (13, 'Programming'), (13, 'Physics'), (2, 'Math'), (1, 'Math');`,
    expectedOutputSql: `
SELECT s.student_id, s.student_name, sub.subject_name,
  COUNT(e.student_id) AS attended_exams
FROM Students s
CROSS JOIN Subjects sub
LEFT JOIN Examinations e
  ON s.student_id = e.student_id AND sub.subject_name = e.subject_name
GROUP BY s.student_id, s.student_name, sub.subject_name
ORDER BY s.student_id, sub.subject_name;`,
    hints: [
      "CROSS JOIN Students with Subjects to get every student-subject pair.",
      "LEFT JOIN Examinations and COUNT matches.",
      "COUNT(e.student_id) returns 0 when no exam was taken.",
    ],
    explanation:
      "Cross join all student-subject combinations, left join exams, and count attendances.",
    officialSolution: `
SELECT s.student_id, s.student_name, sub.subject_name,
  COUNT(e.student_id) AS attended_exams
FROM Students s
CROSS JOIN Subjects sub
LEFT JOIN Examinations e
  ON s.student_id = e.student_id AND sub.subject_name = e.subject_name
GROUP BY s.student_id, s.student_name, sub.subject_name
ORDER BY s.student_id, sub.subject_name;`,
  },
  {
    id: 13,
    leetcodeId: 570,
    slug: "managers-with-at-least-5-direct-reports",
    title: "Managers with at Least 5 Direct Reports",
    difficulty: "medium",
    topics: ["Basic Joins"],
    description:
      "Find managers who have at least five direct reports.",
    statement: `Table: Employee

+-------------+---------+
| Column Name | Type    |
+-------------+---------+
| id          | int     |
| name        | varchar |
| department  | varchar |
| managerId   | int     |
+-------------+---------+
id is the primary key.

Find managers with at least five direct reports.

Example:
Input:
Employee:
+-----+-------+------------+-----------+
| id  | name  | department | managerId |
+-----+-------+------------+-----------+
| 101 | John  | A          | null      |
| 102 | Dan   | A          | 101       |
| 103 | James | A          | 101       |
| 104 | Amy   | A          | 101       |
| 105 | Anne  | A          | 101       |
| 106 | Ron   | B          | 101       |
+-----+-------+------------+-----------+
Output:
+------+
| name |
+------+
| John |
+------+

Constraints:
- Self-join Employee; GROUP BY managerId HAVING COUNT >= 5.`,
    schemaSql: `
CREATE TABLE Employee (
  id INT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  department VARCHAR(255) NOT NULL,
  managerId INT
);`,
    seedSql: `
INSERT INTO Employee (id, name, department, managerId) VALUES
  (101, 'John', 'A', NULL),
  (102, 'Dan', 'A', 101),
  (103, 'James', 'A', 101),
  (104, 'Amy', 'A', 101),
  (105, 'Anne', 'A', 101),
  (106, 'Ron', 'B', 101);`,
    expectedOutputSql: `
SELECT m.name
FROM Employee e
JOIN Employee m ON e.managerId = m.id
GROUP BY e.managerId, m.name
HAVING COUNT(e.id) >= 5
ORDER BY m.name;`,
    hints: [
      "Join Employee to itself: reports.managerId = manager.id.",
      "GROUP BY manager and use HAVING COUNT(*) >= 5.",
      "Return the manager's name.",
    ],
    explanation:
      "Self-join to link employees to managers, group by manager, filter groups with 5+ reports.",
    officialSolution: `
SELECT m.name
FROM Employee e
JOIN Employee m ON e.managerId = m.id
GROUP BY e.managerId, m.name
HAVING COUNT(e.id) >= 5;`,
  },
  {
    id: 14,
    leetcodeId: 1934,
    slug: "confirmation-rate",
    title: "Confirmation Rate",
    difficulty: "medium",
    topics: ["Basic Joins"],
    description:
      "Compute the confirmation rate for each user, rounded to 2 decimals.",
    statement: `Table: Signups, Confirmations

Signups: user_id, time_stamp
Confirmations: user_id, action, time_stamp (action is 'confirmed' or 'timeout')

The confirmation rate is the number of confirmed messages divided by total requests.
Return 0.00 if a user has no confirmations. Round to 2 decimal places.

Example:
Input:
Signups: (0,'2020-05-02 10:28:56'), (1,'2020-05-07 10:57:39'), (2,'2020-07-29 12:57:37'), (3,'2020-12-09 10:39:37')
Confirmations: (3,'confirmed','2021-01-06 03:30:46'), (3,'timeout','2021-07-14 14:00:00'), (0,'timeout','2020-05-03 23:39:20'), (0,'timeout','2020-06-14 19:19:03'), (1,'timeout','2021-06-14 19:19:03'), (2,'confirmed','2021-06-14 19:19:03')
Output:
+---------+-------------------+
| user_id | confirmation_rate |
+---------+-------------------+
| 0       | 0.00              |
| 1       | 0.00              |
| 2       | 1.00              |
| 3       | 0.50              |
+---------+-------------------+

Constraints:
- LEFT JOIN Signups to Confirmations; use conditional aggregation.`,
    schemaSql: `
CREATE TABLE Signups (
  user_id INT PRIMARY KEY,
  time_stamp TIMESTAMP NOT NULL
);
CREATE TABLE Confirmations (
  user_id INT NOT NULL,
  action VARCHAR(20) NOT NULL,
  time_stamp TIMESTAMP NOT NULL
);`,
    seedSql: `
INSERT INTO Signups (user_id, time_stamp) VALUES
  (0, '2020-05-02 10:28:56'),
  (1, '2020-05-07 10:57:39'),
  (2, '2020-07-29 12:57:37'),
  (3, '2020-12-09 10:39:37');
INSERT INTO Confirmations (user_id, action, time_stamp) VALUES
  (3, 'confirmed', '2021-01-06 03:30:46'),
  (3, 'timeout', '2021-07-14 14:00:00'),
  (0, 'timeout', '2020-05-03 23:39:20'),
  (0, 'timeout', '2020-06-14 19:19:03'),
  (1, 'timeout', '2021-06-14 19:19:03'),
  (2, 'confirmed', '2021-06-14 19:19:03');`,
    expectedOutputSql: `
SELECT s.user_id,
  ROUND(
    COALESCE(SUM(CASE WHEN c.action = 'confirmed' THEN 1 ELSE 0 END)::numeric
      / NULLIF(COUNT(c.action), 0), 0),
    2
  ) AS confirmation_rate
FROM Signups s
LEFT JOIN Confirmations c ON s.user_id = c.user_id
GROUP BY s.user_id
ORDER BY s.user_id;`,
    hints: [
      "LEFT JOIN Signups to Confirmations so users with no confirmations appear.",
      "Count confirmed actions divided by total confirmation rows.",
      "Use COALESCE and NULLIF to handle division by zero.",
    ],
    explanation:
      "Left join signups to confirmations, compute confirmed/total ratio per user with safe division.",
    officialSolution: `
SELECT s.user_id,
  ROUND(
    COALESCE(SUM(CASE WHEN c.action = 'confirmed' THEN 1 ELSE 0 END)::numeric
      / NULLIF(COUNT(c.action), 0), 0),
    2
  ) AS confirmation_rate
FROM Signups s
LEFT JOIN Confirmations c ON s.user_id = c.user_id
GROUP BY s.user_id
ORDER BY s.user_id;`,
  },
];
