import type { PracticeProblem } from "../../../../../lib/practice/types";

export const advancedSelectProblems: PracticeProblem[] = [
  {
    id: 30,
    leetcodeId: 1731,
    slug: "the-number-of-employees-which-report-to-each-employee",
    title: "The Number of Employees Which Report to Each Employee",
    difficulty: "easy",
    topics: ["Advanced Select"],
    description:
      "List managers with at least five direct reports and their report counts.",
    statement: `Table: Employees

+-------------+---------+
| Column Name | Type    |
+-------------+---------+
| employee_id | int     |
| name        | varchar |
| reports_to  | int     |
| age         | int     |
+-------------+---------+
employee_id is the primary key.
reports_to is the employee_id of the manager.

Return employees who have at least 5 direct reports, with employee_id, name, and reports_count.
Order by employee_id.

Example:
Input:
Employees: (9,'Hercy',null,43), (6,'Alice',9,41), (4,'Bob',9,36), (2,'Cyril',9,50), (7,'David',9,39), (5,'Eve',9,40), (8,'Frank',9,35)
Output:
+-------------+---------+---------------+
| employee_id | name    | reports_count |
+-------------+---------+---------------+
| 9           | Hercy   | 5             |
+-------------+---------+---------------+

Constraints:
- Self-join on reports_to; HAVING COUNT >= 5.`,
    schemaSql: `
CREATE TABLE Employees (
  employee_id INT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  reports_to INT,
  age INT NOT NULL
);`,
    seedSql: `
INSERT INTO Employees (employee_id, name, reports_to, age) VALUES
  (9, 'Hercy', NULL, 43),
  (6, 'Alice', 9, 41),
  (4, 'Bob', 9, 36),
  (2, 'Cyril', 9, 50),
  (7, 'David', 9, 39),
  (5, 'Eve', 9, 40);`,
    expectedOutputSql: `
SELECT m.employee_id, m.name, COUNT(e.employee_id) AS reports_count
FROM Employees e
JOIN Employees m ON e.reports_to = m.employee_id
GROUP BY m.employee_id, m.name
HAVING COUNT(e.employee_id) >= 5
ORDER BY m.employee_id;`,
    hints: [
      "Join Employees to itself: reports.reports_to = manager.employee_id.",
      "GROUP BY manager and COUNT direct reports.",
      "Filter with HAVING COUNT >= 5.",
    ],
    explanation:
      "Self-join to count direct reports per manager, keeping managers with at least five.",
    officialSolution: `
SELECT m.employee_id, m.name, COUNT(e.employee_id) AS reports_count
FROM Employees e
JOIN Employees m ON e.reports_to = m.employee_id
GROUP BY m.employee_id, m.name
HAVING COUNT(e.employee_id) >= 5;`,
  },
  {
    id: 31,
    leetcodeId: 1789,
    slug: "primary-department-for-each-employee",
    title: "Primary Department for Each Employee",
    difficulty: "easy",
    topics: ["Advanced Select"],
    description:
      "Return each employee's primary department (explicit or sole department).",
    statement: `Tables: Employee, Department

Employee: employee_id, department_id, primary_flag ('Y' or 'N')
Department: department_id, department_name

Primary department: row with primary_flag='Y', or the only department if employee has one row.

Example:
Input:
Employee: (1,1,'N'), (2,1,'Y'), (3,1,'N'), (3,2,'Y'), (4,3,'N')
Department: (1,'IT'), (2,'Sales'), (3,'HR')
Output:
+-------------+---------------+
| employee_id | department_name |
+-------------+---------------+
| 1           | IT            |
| 2           | IT            |
| 3           | Sales         |
| 4           | HR            |
+-------------+---------------+

Constraints:
- Use UNION or CASE to handle single-department employees without primary flag.`,
    schemaSql: `
CREATE TABLE Employee (
  employee_id INT NOT NULL,
  department_id INT NOT NULL,
  primary_flag VARCHAR(1) NOT NULL,
  PRIMARY KEY (employee_id, department_id)
);
CREATE TABLE Department (
  department_id INT PRIMARY KEY,
  department_name VARCHAR(255) NOT NULL
);`,
    seedSql: `
INSERT INTO Employee (employee_id, department_id, primary_flag) VALUES
  (1, 1, 'N'), (2, 1, 'Y'), (3, 1, 'N'), (3, 2, 'Y'), (4, 3, 'N');
INSERT INTO Department (department_id, department_name) VALUES
  (1, 'IT'), (2, 'Sales'), (3, 'HR');`,
    expectedOutputSql: `
SELECT employee_id, department_name
FROM (
  SELECT e.employee_id, d.department_name
  FROM Employee e
  JOIN Department d ON e.department_id = d.department_id
  WHERE e.primary_flag = 'Y'
  UNION
  SELECT e.employee_id, d.department_name
  FROM Employee e
  JOIN Department d ON e.department_id = d.department_id
  WHERE e.employee_id IN (
    SELECT employee_id FROM Employee GROUP BY employee_id HAVING COUNT(*) = 1
  )
) primary_dept
ORDER BY employee_id;`,
    hints: [
      "Primary flag 'Y' marks the primary department.",
      "Employees with only one department row use that department.",
      "Combine both cases with UNION.",
    ],
    explanation:
      "Union employees with explicit primary flag and those with a single department assignment.",
    officialSolution: `
SELECT employee_id, department_name
FROM (
  SELECT e.employee_id, d.department_name
  FROM Employee e
  JOIN Department d ON e.department_id = d.department_id
  WHERE e.primary_flag = 'Y'
  UNION
  SELECT e.employee_id, d.department_name
  FROM Employee e
  JOIN Department d ON e.department_id = d.department_id
  WHERE e.employee_id IN (
    SELECT employee_id FROM Employee GROUP BY employee_id HAVING COUNT(*) = 1
  )
) primary_dept;`,
  },
  {
    id: 32,
    leetcodeId: 610,
    slug: "triangle-judgement",
    title: "Triangle Judgement",
    difficulty: "easy",
    topics: ["Advanced Select"],
    description:
      "For each row, report whether three side lengths can form a triangle.",
    statement: `Table: Triangle

+-------------+------+
| Column Name | Type |
+-------------+------+
| x           | int  |
| y           | int  |
| z           | int  |
+-------------+---------+
(x, y, z) is the primary key.

Report 'Yes' if x, y, z can form a triangle (sum of any two sides > third), else 'No'.

Example:
Input:
Triangle: (13,15,30), (10,12,20)
Output:
+----+----+----+----------+
| x  | y  | z  | triangle |
+----+----+----+----------+
| 13 | 15 | 30 | No       |
| 10 | 12 | 20 | Yes      |
+----+----+----+----------+

Constraints:
- Check x+y>z AND x+z>y AND y+z>x.`,
    schemaSql: `
CREATE TABLE Triangle (
  x INT NOT NULL,
  y INT NOT NULL,
  z INT NOT NULL,
  PRIMARY KEY (x, y, z)
);`,
    seedSql: `
INSERT INTO Triangle (x, y, z) VALUES
  (13, 15, 30), (10, 12, 20);`,
    expectedOutputSql: `
SELECT x, y, z,
  CASE
    WHEN x + y > z AND x + z > y AND y + z > x THEN 'Yes'
    ELSE 'No'
  END AS triangle
FROM Triangle
ORDER BY x, y, z;`,
    hints: [
      "A triangle requires each pair of sides to sum greater than the third.",
      "Use CASE WHEN to return 'Yes' or 'No'.",
      "Check all three inequalities.",
    ],
    explanation:
      "Use CASE to test the triangle inequality for all three side combinations.",
    officialSolution: `
SELECT x, y, z,
  CASE
    WHEN x + y > z AND x + z > y AND y + z > x THEN 'Yes'
    ELSE 'No'
  END AS triangle
FROM Triangle;`,
  },
  {
    id: 33,
    leetcodeId: 180,
    slug: "consecutive-numbers",
    title: "Consecutive Numbers",
    difficulty: "medium",
    topics: ["Advanced Select"],
    description:
      "Find numbers that appear at least three times consecutently.",
    statement: `Table: Logs

+-------------+---------+
| Column Name | Type    |
+-------------+---------+
| id          | int     |
| num         | varchar |
+-------------+---------+
id is the primary key.

Find all numbers that appear at least three times consecutively.

Example:
Input:
Logs: (1,'1'), (2,'1'), (3,'1'), (4,'2'), (5,'1'), (6,'2'), (7,'2')
Output:
+-----------------+
| ConsecutiveNums |
+-----------------+
| 1               |
+-----------------+

Constraints:
- Self-join on id, id+1, id+2 or use LAG window functions.`,
    schemaSql: `
CREATE TABLE Logs (
  id INT PRIMARY KEY,
  num VARCHAR(50) NOT NULL
);`,
    seedSql: `
INSERT INTO Logs (id, num) VALUES
  (1, '1'), (2, '1'), (3, '1'), (4, '2'), (5, '1'), (6, '2'), (7, '2');`,
    expectedOutputSql: `
SELECT DISTINCT l1.num AS ConsecutiveNums
FROM Logs l1
JOIN Logs l2 ON l1.id = l2.id - 1 AND l1.num = l2.num
JOIN Logs l3 ON l2.id = l3.id - 1 AND l2.num = l3.num
ORDER BY ConsecutiveNums;`,
    hints: [
      "Join Logs to itself twice for consecutive id rows.",
      "Require all three rows have the same num value.",
      "Use DISTINCT to avoid duplicate results.",
    ],
    explanation:
      "Self-join three consecutive rows and filter where all share the same number.",
    officialSolution: `
SELECT DISTINCT l1.num AS ConsecutiveNums
FROM Logs l1
JOIN Logs l2 ON l1.id = l2.id - 1 AND l1.num = l2.num
JOIN Logs l3 ON l2.id = l3.id - 1 AND l2.num = l3.num;`,
  },
  {
    id: 34,
    leetcodeId: 1164,
    slug: "product-price-at-a-given-date",
    title: "Product Price at a Given Date",
    difficulty: "medium",
    topics: ["Advanced Select"],
    description:
      "Find each product's price on or before 2019-08-01.",
    statement: `Table: Products

+-------------+---------+
| Column Name | Type    |
+-------------+---------+
| product_id  | int     |
| new_price   | int     |
| change_date | date    |
+-------------+---------+
(product_id, change_date) is the primary key.

Find price of each product on 2019-08-01. Use most recent price on or before that date.

Example:
Input:
Products: (1,20,'2019-08-14'), (2,50,'2019-08-14'), (1,30,'2019-08-15'), (1,35,'2019-08-16'), (2,65,'2019-08-17'), (3,20,'2019-08-18')
Output:
+-------------+-------+
| product_id  | price |
+-------------+-------+
| 1           | 20    |
| 2           | 50    |
| 3           | null  |
+-------------+-------+

Constraints:
- change_date <= '2019-08-01'; pick MAX(change_date) per product.`,
    schemaSql: `
CREATE TABLE Products (
  product_id INT NOT NULL,
  new_price INT NOT NULL,
  change_date DATE NOT NULL,
  PRIMARY KEY (product_id, change_date)
);`,
    seedSql: `
INSERT INTO Products (product_id, new_price, change_date) VALUES
  (1, 20, '2019-08-01'),
  (2, 50, '2019-08-01'),
  (1, 30, '2019-08-15'),
  (1, 35, '2019-08-16'),
  (2, 65, '2019-08-17'),
  (3, 20, '2019-08-18');`,
    expectedOutputSql: `
SELECT p1.product_id, p1.new_price AS price
FROM Products p1
INNER JOIN (
  SELECT product_id, MAX(change_date) AS max_date
  FROM Products
  WHERE change_date <= '2019-08-01'
  GROUP BY product_id
) latest ON p1.product_id = latest.product_id AND p1.change_date = latest.max_date
UNION ALL
SELECT p.product_id, NULL::INT AS price
FROM (SELECT DISTINCT product_id FROM Products) p
WHERE p.product_id NOT IN (
  SELECT product_id FROM Products WHERE change_date <= '2019-08-01'
)
ORDER BY product_id;`,
    hints: [
      "For each product, find the latest change_date on or before 2019-08-01.",
      "Products with no price history before that date return NULL.",
      "Use subquery with MAX(change_date) grouped by product_id.",
    ],
    explanation:
      "Select the most recent price on or before the target date; NULL for products without one.",
    officialSolution: `
SELECT DISTINCT p1.product_id, p1.new_price AS price
FROM Products p1
WHERE (p1.product_id, p1.change_date) IN (
  SELECT product_id, MAX(change_date)
  FROM Products
  WHERE change_date <= '2019-08-01'
  GROUP BY product_id
)
UNION
SELECT DISTINCT product_id, NULL::INT AS price
FROM Products
WHERE product_id NOT IN (
  SELECT product_id FROM Products WHERE change_date <= '2019-08-01'
);`,
  },
  {
    id: 35,
    leetcodeId: 1204,
    slug: "last-person-to-fit-in-the-bus",
    title: "Last Person to Fit in the Bus",
    difficulty: "medium",
    topics: ["Advanced Select"],
    description:
      "Find the last person who can board without exceeding 1000 kg total weight.",
    statement: `Table: Queue

+-------------+---------+
| Column Name | Type    |
+-------------+---------+
| person_id   | int     |
| person_name | varchar |
| weight      | int     |
| turn        | int     |
+-------------+---------+
person_id is the primary key.
turn determines boarding order (1 boards first).

Find the last person who can board without total weight exceeding 1000 kg.

Example:
Input:
Queue: (5,'Alice',250,1), (4,'Bob',175,5), (3,'Alex',350,2), (6,'Johnny',400,3)
Output:
+-------------+
| person_name |
+-------------+
| Alex        |
+-------------+

Constraints:
- Use running sum window function ordered by turn.`,
    schemaSql: `
CREATE TABLE Queue (
  person_id INT PRIMARY KEY,
  person_name VARCHAR(255) NOT NULL,
  weight INT NOT NULL,
  turn INT NOT NULL
);`,
    seedSql: `
INSERT INTO Queue (person_id, person_name, weight, turn) VALUES
  (5, 'Alice', 250, 1),
  (4, 'Bob', 175, 5),
  (3, 'Alex', 350, 2),
  (6, 'Johnny', 401, 3);`,
    expectedOutputSql: `
SELECT person_name
FROM (
  SELECT person_name,
    SUM(weight) OVER (ORDER BY turn) AS running_weight
  FROM Queue
) t
WHERE running_weight <= 1000
ORDER BY running_weight DESC
LIMIT 1;`,
    hints: [
      "Compute cumulative weight with SUM() OVER (ORDER BY turn).",
      "Filter rows where running total <= 1000.",
      "Pick the last person (highest turn) who still fits.",
    ],
    explanation:
      "Running sum of weights by boarding order; return the last person within the 1000 kg limit.",
    officialSolution: `
SELECT person_name
FROM (
  SELECT person_name,
    SUM(weight) OVER (ORDER BY turn) AS running_weight
  FROM Queue
) t
WHERE running_weight <= 1000
ORDER BY running_weight DESC
LIMIT 1;`,
  },
  {
    id: 36,
    leetcodeId: 1907,
    slug: "count-salary-categories",
    title: "Count Salary Categories",
    difficulty: "easy",
    topics: ["Advanced Select"],
    description:
      "Count accounts in Low, Average, and High salary categories.",
    statement: `Table: Accounts

+-------------+------+
| Column Name | Type |
+-------------+------+
| account_id  | int  |
| income      | int  |
+-------------+------+
account_id is the primary key.

Categories: Low (<20000), Average ([20000,50000]), High (>50000).
Count accounts in each category including zero counts.

Example:
Input:
Accounts: (3,108939), (2,12747), (8,87709), (6,91796)
Output:
+------------+-------+
| category   | accounts_count |
+------------+-------+
| Low Salary | 1     |
| Average Salary | 0 |
| High Salary | 3    |
+------------+-------+

Constraints:
- Use UNION ALL with fixed category labels or CASE aggregation.`,
    schemaSql: `
CREATE TABLE Accounts (
  account_id INT PRIMARY KEY,
  income INT NOT NULL
);`,
    seedSql: `
INSERT INTO Accounts (account_id, income) VALUES
  (3, 108939), (2, 12747), (8, 87709), (6, 91796);`,
    expectedOutputSql: `
SELECT category, accounts_count
FROM (
  SELECT 'Low Salary' AS category,
    SUM(CASE WHEN income < 20000 THEN 1 ELSE 0 END) AS accounts_count
  FROM Accounts
  UNION ALL
  SELECT 'Average Salary',
    SUM(CASE WHEN income BETWEEN 20000 AND 50000 THEN 1 ELSE 0 END)
  FROM Accounts
  UNION ALL
  SELECT 'High Salary',
    SUM(CASE WHEN income > 50000 THEN 1 ELSE 0 END)
  FROM Accounts
) cats
ORDER BY category;`,
    hints: [
      "Define three salary buckets with CASE WHEN on income.",
      "Use UNION ALL to produce all three category rows.",
      "Include categories with zero count.",
    ],
    explanation:
      "Union three conditional counts to always show all salary categories.",
    officialSolution: `
SELECT 'Low Salary' AS category,
  SUM(CASE WHEN income < 20000 THEN 1 ELSE 0 END) AS accounts_count
FROM Accounts
UNION ALL
SELECT 'Average Salary',
  SUM(CASE WHEN income BETWEEN 20000 AND 50000 THEN 1 ELSE 0 END)
FROM Accounts
UNION ALL
SELECT 'High Salary',
  SUM(CASE WHEN income > 50000 THEN 1 ELSE 0 END)
FROM Accounts;`,
  },
];
