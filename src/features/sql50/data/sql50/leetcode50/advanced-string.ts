import type { PracticeProblem } from "../../../../../lib/practice/types";

export const advancedStringProblems: PracticeProblem[] = [
  {
    id: 44,
    leetcodeId: 1667,
    slug: "fix-names-in-a-table",
    title: "Fix Names in a Table",
    difficulty: "easy",
    topics: ["Advanced String"],
    description:
      "Capitalize the first letter and lowercase the rest of each name.",
    statement: `Table: Users

+-------------+---------+
| Column Name | Type    |
+-------------+---------+
| user_id     | int     |
| name        | varchar |
+-------------+---------+
user_id is the primary key.

Fix names so only the first character is uppercase and the rest lowercase.

Example:
Input:
Users: (1,'aLice'), (2,'bOB')
Output:
+---------+-------+
| user_id | name  |
+---------+-------+
| 1       | Alice |
| 2       | Bob   |
+---------+-------+

Constraints:
- Use UPPER/LOWER with SUBSTRING or INITCAP carefully (INITCAP capitalizes each word).`,
    schemaSql: `
CREATE TABLE Users (
  user_id INT PRIMARY KEY,
  name VARCHAR(255) NOT NULL
);`,
    seedSql: `
INSERT INTO Users (user_id, name) VALUES
  (1, 'aLice'), (2, 'bOB');`,
    expectedOutputSql: `
SELECT user_id,
  UPPER(LEFT(name, 1)) || LOWER(SUBSTRING(name FROM 2)) AS name
FROM Users
ORDER BY user_id;`,
    hints: [
      "Take the first character with LEFT(name, 1) and uppercase it.",
      "Lowercase the remainder with SUBSTRING(name FROM 2).",
      "Concatenate with || in PostgreSQL.",
    ],
    explanation:
      "Uppercase the first character and lowercase the rest using string functions.",
    officialSolution: `
SELECT user_id,
  UPPER(LEFT(name, 1)) || LOWER(SUBSTRING(name FROM 2)) AS name
FROM Users;`,
  },
  {
    id: 45,
    leetcodeId: 1527,
    slug: "patients-with-a-condition",
    title: "Patients With a Condition",
    difficulty: "easy",
    topics: ["Advanced String"],
    description:
      "Find patients whose conditions start with DIAB1 or have DIAB1 after a non-letter.",
    statement: `Table: Patients

+--------------+---------+
| Column Name  | Type    |
+--------------+---------+
| patient_id   | int     |
| patient_name | varchar |
| conditions   | varchar |
+--------------+---------+
patient_id is the primary key.

Find patients with Type I Diabetes (conditions starting with 'DIAB1' or preceded by non-letter).

Example:
Input:
Patients: (1,'Daniel','YEV 5'), (2,'Alice',''), (3,'Bob','DIABC739862'), (4,'Louis','DIAB100212'), (5,'Alex','DIAB1')
Output:
+------------+--------------+--------------+
| patient_id | patient_name | conditions   |
+------------+--------------+--------------+
| 4          | Louis        | DIAB100212   |
| 5          | Alex         | DIAB1        |
+------------+--------------+--------------+

Constraints:
- conditions LIKE 'DIAB1%' OR conditions LIKE '% DIAB1%'.`,
    schemaSql: `
CREATE TABLE Patients (
  patient_id INT PRIMARY KEY,
  patient_name VARCHAR(255) NOT NULL,
  conditions VARCHAR(255) NOT NULL
);`,
    seedSql: `
INSERT INTO Patients (patient_id, patient_name, conditions) VALUES
  (1, 'Daniel', 'YEV 5'),
  (2, 'Alice', ''),
  (3, 'Bob', 'DIABC739862'),
  (4, 'Louis', 'DIAB100212'),
  (5, 'Alex', 'DIAB1');`,
    expectedOutputSql: `
SELECT patient_id, patient_name, conditions
FROM Patients
WHERE conditions LIKE 'DIAB1%'
   OR conditions LIKE '% DIAB1%'
ORDER BY patient_id;`,
    hints: [
      "Match conditions starting with 'DIAB1'.",
      "Also match ' DIAB1' after a space (non-letter separator).",
      "Use LIKE with appropriate patterns.",
    ],
    explanation:
      "Filter conditions that start with DIAB1 or contain DIAB1 after a non-letter character.",
    officialSolution: `
SELECT patient_id, patient_name, conditions
FROM Patients
WHERE conditions LIKE 'DIAB1%'
   OR conditions LIKE '% DIAB1%';`,
  },
  {
    id: 46,
    leetcodeId: 196,
    slug: "delete-duplicate-emails",
    title: "Delete Duplicate Emails",
    difficulty: "easy",
    topics: ["Advanced String"],
    description:
      "Return one row per unique email, keeping the smallest id.",
    statement: `Table: Person

+-------------+---------+
| Column Name | Type    |
+-------------+---------+
| id          | int     |
| email       | varchar |
+-------------+---------+
id is the primary key.

For each unique email, keep only the row with the smallest id.
Return the deduplicated result (id, email).

Example:
Input:
Person: (1,'john@example.com'), (2,'bob@example.com'), (3,'john@example.com')
Output:
+----+------------------+
| id | email            |
+----+------------------+
| 1  | john@example.com |
| 2  | bob@example.com  |
+----+------------------+

Constraints:
- One row per email; keep MIN(id).`,
    schemaSql: `
CREATE TABLE Person (
  id INT PRIMARY KEY,
  email VARCHAR(255) NOT NULL
);`,
    seedSql: `
INSERT INTO Person (id, email) VALUES
  (1, 'john@example.com'),
  (2, 'bob@example.com'),
  (3, 'john@example.com');`,
    expectedOutputSql: `
SELECT MIN(id) AS id, email
FROM Person
GROUP BY email
ORDER BY id;`,
    hints: [
      "GROUP BY email and take MIN(id) for each group.",
      "This keeps the smallest id per email.",
      "Equivalent to deleting duplicate rows in a DELETE statement.",
    ],
    explanation:
      "Group by email and select the minimum id to deduplicate while keeping the first record.",
    officialSolution: `
DELETE FROM Person
WHERE id NOT IN (
  SELECT MIN(id) FROM Person GROUP BY email
);`,
  },
  {
    id: 47,
    leetcodeId: 176,
    slug: "second-highest-salary",
    title: "Second Highest Salary",
    difficulty: "medium",
    topics: ["Advanced String"],
    description: "Return the second highest distinct salary, or null if none.",
    statement: `Table: Employee

+-------------+------+
| Column Name | Type |
+-------------+------+
| id          | int  |
| salary      | int  |
+-------------+------+
id is the primary key.

Find the second highest distinct salary. Return null if it does not exist.

Example:
Input:
Employee: (1,100), (2,200), (3,300)
Output:
+---------------------+
| SecondHighestSalary |
+---------------------+
| 200                 |
+---------------------+

Constraints:
- Use subquery or DISTINCT ON / LIMIT OFFSET.`,
    schemaSql: `
CREATE TABLE Employee (
  id INT PRIMARY KEY,
  salary INT NOT NULL
);`,
    seedSql: `
INSERT INTO Employee (id, salary) VALUES
  (1, 100), (2, 200), (3, 300);`,
    expectedOutputSql: `
SELECT (
  SELECT DISTINCT salary
  FROM Employee
  ORDER BY salary DESC
  OFFSET 1 LIMIT 1
) AS SecondHighestSalary;`,
    hints: [
      "Order salaries descending and skip the first with OFFSET 1.",
      "Use DISTINCT to handle duplicate top salaries.",
      "Wrap in scalar subquery to return NULL when missing.",
    ],
    explanation:
      "Select the distinct salary at offset 1 in descending order for the second highest.",
    officialSolution: `
SELECT (
  SELECT DISTINCT salary
  FROM Employee
  ORDER BY salary DESC
  OFFSET 1 LIMIT 1
) AS SecondHighestSalary;`,
  },
  {
    id: 48,
    leetcodeId: 1484,
    slug: "group-sold-products-by-the-date",
    title: "Group Sold Products By The Date",
    difficulty: "easy",
    topics: ["Advanced String"],
    description:
      "Concatenate product names sold on each date, sorted alphabetically.",
    statement: `Table: Activities

+-------------+---------+
| Column Name | Type    |
+-------------+---------+
| sell_date   | date    |
| product     | varchar |
+-------------+---------+
There is no primary key.

Group products sold on each date into a comma-separated list sorted alphabetically.

Example:
Input:
Activities: ('2020-05-30','Headphone'), ('2020-05-30','Pencil'), ('2020-06-01','Mask'), ('2020-05-30','Mask'), ('2020-06-01','Book'), ('2020-06-01','Mask')
Output:
+------------+---------------------------------+
| sell_date  | num_sold | products           |
+------------+----------+--------------------+
| 2020-05-30 | 3        | Headphone,Mask,Pencil |
| 2020-06-01 | 3        | Book,Mask,Mask     |
+------------+----------+--------------------+

Constraints:
- Use STRING_AGG in PostgreSQL ordered by product.`,
    schemaSql: `
CREATE TABLE Activities (
  sell_date DATE NOT NULL,
  product VARCHAR(255) NOT NULL
);`,
    seedSql: `
INSERT INTO Activities (sell_date, product) VALUES
  ('2020-05-30', 'Headphone'),
  ('2020-05-30', 'Pencil'),
  ('2020-06-01', 'Mask'),
  ('2020-05-30', 'Mask'),
  ('2020-06-01', 'Book'),
  ('2020-06-01', 'Mask');`,
    expectedOutputSql: `
SELECT sell_date,
  COUNT(*) AS num_sold,
  STRING_AGG(product, ',' ORDER BY product) AS products
FROM Activities
GROUP BY sell_date
ORDER BY sell_date;`,
    hints: [
      "GROUP BY sell_date.",
      "Use STRING_AGG(product, ',' ORDER BY product) in PostgreSQL.",
      "COUNT(*) gives num_sold.",
    ],
    explanation:
      "Group by date, count products, and aggregate names with STRING_AGG sorted alphabetically.",
    officialSolution: `
SELECT sell_date,
  COUNT(*) AS num_sold,
  STRING_AGG(product, ',' ORDER BY product) AS products
FROM Activities
GROUP BY sell_date;`,
  },
  {
    id: 49,
    leetcodeId: 1327,
    slug: "list-the-products-ordered-in-a-period",
    title: "List the Products Ordered in a Period",
    difficulty: "easy",
    topics: ["Advanced String"],
    description:
      "Count products with at least 100 units ordered between 2020-02-01 and 2020-02-28.",
    statement: `Table: Products

+-------------+---------+
| Column Name | Type    |
+-------------+---------+
| product_id  | int     |
| product_name | varchar |
| unit_price  | int     |
+-------------+---------+

Table: Orders

+-------------+------+
| Column Name | Type |
+-------------+------+
| product_id  | int  |
| order_date  | date |
| unit_ordered | int |
+-------------+------+
(product_id, order_date) is the primary key.

List product names with total unit_ordered >= 100 in February 2020.

Example:
Input:
Products: (1,'apple'), (2,'banana'), (3,'pear'), (4,'avocado')
Orders: (1,'2020-02-05',60), (1,'2020-02-10',70), (2,'2020-01-18',30), (3,'2020-02-04',20), (3,'2020-02-14',30), (4,'2020-03-01',20)
Output:
+--------------+------------+
| product_id   | product_name | unit |
+--------------+------------+
| 1            | apple      | 130  |
+--------------+------------+

Constraints:
- Filter order_date between 2020-02-01 and 2020-02-29; HAVING SUM >= 100.`,
    schemaSql: `
CREATE TABLE Products (
  product_id INT PRIMARY KEY,
  product_name VARCHAR(255) NOT NULL,
  unit_price INT NOT NULL
);
CREATE TABLE Orders (
  product_id INT NOT NULL,
  order_date DATE NOT NULL,
  unit_ordered INT NOT NULL,
  PRIMARY KEY (product_id, order_date)
);`,
    seedSql: `
INSERT INTO Products (product_id, product_name, unit_price) VALUES
  (1, 'apple', 10), (2, 'banana', 20), (3, 'pear', 15), (4, 'avocado', 25);
INSERT INTO Orders (product_id, order_date, unit_ordered) VALUES
  (1, '2020-02-05', 60),
  (1, '2020-02-10', 70),
  (2, '2020-01-18', 30),
  (3, '2020-02-04', 20),
  (3, '2020-02-14', 30),
  (4, '2020-03-01', 20);`,
    expectedOutputSql: `
SELECT p.product_id, p.product_name, SUM(o.unit_ordered) AS unit
FROM Orders o
JOIN Products p ON o.product_id = p.product_id
WHERE o.order_date >= '2020-02-01' AND o.order_date <= '2020-02-29'
GROUP BY p.product_id, p.product_name
HAVING SUM(o.unit_ordered) >= 100
ORDER BY p.product_id;`,
    hints: [
      "JOIN Orders and Products; filter February 2020 dates.",
      "SUM(unit_ordered) per product.",
      "HAVING SUM >= 100.",
    ],
    explanation:
      "Join orders to products, filter to February 2020, group and keep totals of at least 100.",
    officialSolution: `
SELECT p.product_id, p.product_name, SUM(o.unit_ordered) AS unit
FROM Orders o
JOIN Products p ON o.product_id = p.product_id
WHERE o.order_date >= '2020-02-01' AND o.order_date <= '2020-02-29'
GROUP BY p.product_id, p.product_name
HAVING SUM(o.unit_ordered) >= 100;`,
  },
  {
    id: 50,
    leetcodeId: 1517,
    slug: "find-users-with-valid-e-mails",
    title: "Find Users With Valid E-Mails",
    difficulty: "easy",
    topics: ["Advanced String"],
    description:
      "Return users whose email matches the valid pattern name@domain.com.",
    statement: `Table: Users

+-------------+---------+
| Column Name | Type    |
+-------------+---------+
| user_id     | int     |
| name        | varchar |
| mail        | varchar |
+-------------+---------+
user_id is the primary key.
mail is the email (lowercase letters, digits, dots, underscores only before @).

Valid email: name@domain.com where name and domain contain only lowercase letters, digits, dots, underscores; domain has a dot.

Example:
Input:
Users: (1,'Winston','winston@bump.com'), (2,'Jonathan','jonathan@gmail.com'), (3,'Annabelle','annabelle@m2.com'), (4,'Sally','sally2@hotmail.com'), (5,'Marwan','marwan@hotmail.com'), (6,'David','david123@gmail.com'), (7,'Philip','Philip!@gmail.com'), (8,'unknown','unknown@unknown.com'), (9,'Gerald','Gerald@m4.co.com')
Output:
+---------+----------+---------------------+
| user_id | name     | mail                |
+---------+----------+---------------------+
| 1       | Winston  | winston@bump.com    |
| 2       | Jonathan | jonathan@gmail.com  |
| 3       | Annabelle| annabelle@m2.com    |
| 4       | Sally    | sally2@hotmail.com  |
| 5       | Marwan   | marwan@hotmail.com  |
| 6       | David    | david123@gmail.com  |
+---------+----------+---------------------+

Constraints:
- Use regex: mail ~ '^[a-zA-Z0-9_.]+@[a-zA-Z0-9_]+\\.[a-zA-Z]+$' (case per LC rules).`,
    schemaSql: `
CREATE TABLE Users (
  user_id INT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  mail VARCHAR(255) NOT NULL
);`,
    seedSql: `
INSERT INTO Users (user_id, name, mail) VALUES
  (1, 'Winston', 'winston@bump.com'),
  (2, 'Jonathan', 'jonathan@gmail.com'),
  (3, 'Annabelle', 'annabelle@m2.com'),
  (4, 'Sally', 'sally2@hotmail.com'),
  (5, 'Marwan', 'marwan@hotmail.com'),
  (6, 'David', 'david123@gmail.com'),
  (7, 'Philip', 'Philip!@gmail.com'),
  (8, 'unknown', 'unknown@unknown.com'),
  (9, 'Gerald', 'Gerald@m4.co.com');`,
    expectedOutputSql: `
SELECT user_id, name, mail
FROM Users
WHERE mail ~ '^[A-Za-z0-9_]+@[A-Za-z0-9_]+\\.[A-Za-z]+$'
ORDER BY user_id;`,
    hints: [
      "Valid emails match: letters/digits/underscores, @, domain, dot, extension.",
      "Use PostgreSQL regex operator ~ for pattern matching.",
      "Exclude emails with invalid characters like ! or multiple dots in domain.",
    ],
    explanation:
      "Filter emails matching the LeetCode valid pattern using a regular expression.",
    officialSolution: `
SELECT user_id, name, mail
FROM Users
WHERE mail ~ '^[A-Za-z0-9_]+@[A-Za-z0-9_]+\\.[A-Za-z]+$';`,
  },
];
