import type { PracticeProblem } from "../../../../../lib/practice/types";

export const sortingProblems: PracticeProblem[] = [
  {
    id: 23,
    leetcodeId: 2356,
    slug: "number-of-unique-subjects-taught-by-each-teacher",
    title: "Number of Unique Subjects Taught by Each Teacher",
    difficulty: "easy",
    topics: ["Sorting"],
    description:
      "Count distinct subjects per teacher; include teachers with zero subjects.",
    statement: `Table: Teacher

+--------------+------+
| Column Name  | Type |
+--------------+------+
| teacher_id   | int  |
| subject_id   | int  |
| dept_id      | int  |
+--------------+------+
(teacher_id, subject_id) is the primary key.

Count unique subjects per teacher. Sort by subject_count desc, then teacher_id asc.

Example:
Input:
Teacher: (1,2,3), (2,2,3), (3,2,3), (1,1,1), (1,3,3), (2,4,3)
Output:
+------------+---------------------+
| teacher_id | subject_count       |
+------------+---------------------+
| 1          | 3                   |
| 2          | 2                   |
| 3          | 1                   |
+------------+---------------------+

Constraints:
- COUNT(DISTINCT subject_id); ORDER BY subject_count DESC, teacher_id ASC.`,
    schemaSql: `
CREATE TABLE Teacher (
  teacher_id INT NOT NULL,
  subject_id INT NOT NULL,
  dept_id INT NOT NULL,
  PRIMARY KEY (teacher_id, subject_id)
);`,
    seedSql: `
INSERT INTO Teacher (teacher_id, subject_id, dept_id) VALUES
  (1, 2, 3), (2, 2, 3), (3, 2, 3), (1, 1, 1), (1, 3, 3), (2, 4, 3);`,
    expectedOutputSql: `
SELECT teacher_id, COUNT(DISTINCT subject_id) AS subject_count
FROM Teacher
GROUP BY teacher_id
ORDER BY subject_count DESC, teacher_id ASC;`,
    hints: [
      "GROUP BY teacher_id and COUNT(DISTINCT subject_id).",
      "Sort by subject_count descending, then teacher_id ascending.",
      "Every teacher in the table should appear in output.",
    ],
    explanation:
      "Group by teacher and count distinct subjects, ordered as specified.",
    officialSolution: `
SELECT teacher_id, COUNT(DISTINCT subject_id) AS subject_count
FROM Teacher
GROUP BY teacher_id
ORDER BY subject_count DESC, teacher_id ASC;`,
  },
  {
    id: 24,
    leetcodeId: 1141,
    slug: "user-activity-for-the-past-30-days-i",
    title: "User Activity for the Past 30 Days I",
    difficulty: "easy",
    topics: ["Sorting"],
    description:
      "Daily active users and total sessions in the 30 days ending 2019-07-27.",
    statement: `Table: Activity

+---------------+---------+
| Column Name   | Type    |
+---------------+---------+
| user_id       | int     |
| session_id    | int     |
| activity_date | date    |
| activity_type | varchar |
+---------------+---------+
There is no primary key.

For the 30 days ending 2019-07-27, report daily active users and session count.

Example:
Input:
Activity: (1,1,'2019-07-20','open'), (1,1,'2019-07-20','scroll'), (1,1,'2019-07-20','end'), (2,4,'2019-07-20','open'), (2,4,'2019-07-21','send'), (3,1,'2019-07-21','open'), (3,1,'2019-07-21','end'), (4,2,'2019-07-21','open'), (4,2,'2019-07-21','send'), (4,2,'2019-07-21','close'), (5,3,'2019-07-21','open'), (5,3,'2019-07-22','open'), (5,3,'2019-07-22','send'), (5,3,'2019-07-22','close'), (5,3,'2019-07-22','open'), (6,5,'2019-07-23','open'), (6,5,'2019-07-23','send')
Output:
+------------+--------------+----------------+
| day        | active_users | active_sessions |
+------------+--------------+----------------+
| 2019-07-20 | 2            | 2              |
| 2019-07-21 | 2            | 3              |
| 2019-07-23 | 1            | 1              |
+------------+--------------+----------------+

Constraints:
- activity_date between '2019-06-28' and '2019-07-27'.`,
    schemaSql: `
CREATE TABLE Activity (
  user_id INT NOT NULL,
  session_id INT NOT NULL,
  activity_date DATE NOT NULL,
  activity_type VARCHAR(50) NOT NULL
);`,
    seedSql: `
INSERT INTO Activity (user_id, session_id, activity_date, activity_type) VALUES
  (1, 1, '2019-07-20', 'open'), (1, 1, '2019-07-20', 'scroll'), (1, 1, '2019-07-20', 'end'),
  (2, 4, '2019-07-20', 'open'), (2, 4, '2019-07-21', 'send'),
  (3, 1, '2019-07-21', 'open'), (3, 1, '2019-07-21', 'end'),
  (4, 2, '2019-07-21', 'open'), (4, 2, '2019-07-21', 'send'), (4, 2, '2019-07-21', 'close'),
  (5, 3, '2019-07-21', 'open'), (5, 3, '2019-07-22', 'open'), (5, 3, '2019-07-22', 'send'),
  (5, 3, '2019-07-22', 'close'), (5, 3, '2019-07-22', 'open'),
  (6, 5, '2019-07-23', 'open'), (6, 5, '2019-07-23', 'send');`,
    expectedOutputSql: `
SELECT activity_date AS day,
  COUNT(DISTINCT user_id) AS active_users,
  COUNT(DISTINCT session_id) AS active_sessions
FROM Activity
WHERE activity_date BETWEEN '2019-06-28' AND '2019-07-27'
GROUP BY activity_date
ORDER BY day;`,
    hints: [
      "Filter dates in the 30-day window ending 2019-07-27.",
      "COUNT(DISTINCT user_id) and COUNT(DISTINCT session_id) per day.",
      "GROUP BY activity_date and ORDER BY day.",
    ],
    explanation:
      "Filter to the 30-day window, group by date, count distinct users and sessions.",
    officialSolution: `
SELECT activity_date AS day,
  COUNT(DISTINCT user_id) AS active_users,
  COUNT(DISTINCT session_id) AS active_sessions
FROM Activity
WHERE activity_date BETWEEN '2019-06-28' AND '2019-07-27'
GROUP BY activity_date
ORDER BY day;`,
  },
  {
    id: 25,
    leetcodeId: 1070,
    slug: "product-sales-analysis-iii",
    title: "Product Sales Analysis III",
    difficulty: "medium",
    topics: ["Sorting"],
    description:
      "For each product, find the first year it was sold.",
    statement: `Tables: Sales, Product

Sales: sale_id, product_id, year, quantity, price
Product: product_id, product_name

For each product, report product_id, product_name, and first year sold.

Example:
Input:
Sales: (1,100,2008,10,5000), (2,100,2009,12,5000), (3,200,2011,15,9000)
Product: (100,'Nokia'), (200,'Apple'), (300,'Samsung')
Output:
+------------+--------------+--------+
| product_id | product_name | year   |
+------------+--------------+--------+
| 100        | Nokia        | 2008   |
| 200        | Apple        | 2011   |
+------------+--------------+--------+

Constraints:
- Use MIN(year) grouped by product.`,
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
  (1, 100, 2008, 10, 5000),
  (2, 100, 2009, 12, 5000),
  (3, 200, 2011, 15, 9000);
INSERT INTO Product (product_id, product_name) VALUES
  (100, 'Nokia'), (200, 'Apple'), (300, 'Samsung');`,
    expectedOutputSql: `
SELECT p.product_id, p.product_name, MIN(s.year) AS year
FROM Sales s
JOIN Product p ON s.product_id = p.product_id
GROUP BY p.product_id, p.product_name
ORDER BY p.product_id;`,
    hints: [
      "JOIN Sales and Product on product_id.",
      "Use MIN(year) to find the first sale year.",
      "GROUP BY product_id and product_name.",
    ],
    explanation:
      "Join sales to products and take MIN(year) per product for the first sale year.",
    officialSolution: `
SELECT p.product_id, p.product_name, MIN(s.year) AS year
FROM Sales s
JOIN Product p ON s.product_id = p.product_id
GROUP BY p.product_id, p.product_name;`,
  },
  {
    id: 26,
    leetcodeId: 596,
    slug: "classes-more-than-5-students",
    title: "Classes More Than 5 Students",
    difficulty: "easy",
    topics: ["Sorting"],
    description: "Find classes with more than five students.",
    statement: `Table: Courses

+---------+---------+
| Column  | Type    |
+---------+---------+
| student | varchar |
| class   | varchar |
+---------+---------+
(student, class) is the primary key.

Find classes with at least five students.

Example:
Input:
Courses: ('A','Math'), ('B','English'), ('C','Math'), ('D','Biology'), ('E','Math'), ('F','Computer'), ('G','Math'), ('H','Math'), ('I','Math')
Output:
+---------+
| class   |
+---------+
| Math    |
+---------+

Constraints:
- GROUP BY class HAVING COUNT(*) >= 5.`,
    schemaSql: `
CREATE TABLE Courses (
  student VARCHAR(255) NOT NULL,
  class VARCHAR(255) NOT NULL,
  PRIMARY KEY (student, class)
);`,
    seedSql: `
INSERT INTO Courses (student, class) VALUES
  ('A', 'Math'), ('B', 'English'), ('C', 'Math'), ('D', 'Biology'),
  ('E', 'Math'), ('F', 'Computer'), ('G', 'Math'), ('H', 'Math'), ('I', 'Math');`,
    expectedOutputSql: `
SELECT class FROM Courses
GROUP BY class
HAVING COUNT(*) >= 5
ORDER BY class;`,
    hints: [
      "GROUP BY class and count students.",
      "Use HAVING COUNT(*) >= 5 to filter groups.",
      "Return the class column.",
    ],
    explanation:
      "Group by class and filter groups with five or more students using HAVING.",
    officialSolution: `
SELECT class FROM Courses
GROUP BY class
HAVING COUNT(*) >= 5;`,
  },
  {
    id: 27,
    leetcodeId: 1729,
    slug: "find-followers-count",
    title: "Find Followers Count",
    difficulty: "easy",
    topics: ["Sorting"],
    description:
      "Count how many users follow each account; order by count desc, user_id asc.",
    statement: `Table: Followers

+-------------+------+
| Column Name | Type |
+-------------+------+
| user_id     | int  |
| follower_id | int  |
+-------------+------+
(user_id, follower_id) is the primary key.
Each row means user_id follows follower_id.

Count followers for each user (how many users follow them).
Order by follower_count desc, user_id asc.

Example:
Input:
Followers: (0,1), (1,0), (2,0), (2,1)
Output:
+---------+----------------+
| user_id | follower_count |
+---------+----------------+
| 0       | 2              |
| 1       | 1              |
| 2       | 0              |
+---------+----------------+

Constraints:
- Group by the followed user (follower_id column).`,
    schemaSql: `
CREATE TABLE Followers (
  user_id INT NOT NULL,
  follower_id INT NOT NULL,
  PRIMARY KEY (user_id, follower_id)
);`,
    seedSql: `
INSERT INTO Followers (user_id, follower_id) VALUES
  (0, 1), (1, 0), (2, 0), (2, 1);`,
    expectedOutputSql: `
WITH all_users AS (
  SELECT user_id FROM Followers
  UNION
  SELECT follower_id FROM Followers
)
SELECT u.user_id, COUNT(f.user_id) AS follower_count
FROM all_users u
LEFT JOIN Followers f ON u.user_id = f.follower_id
GROUP BY u.user_id
ORDER BY follower_count DESC, u.user_id ASC;`,
    hints: [
      "Each row means user_id follows follower_id.",
      "Count followers per followed user (follower_id); include users with zero followers.",
      "Use UNION of both columns to get all user ids, then LEFT JOIN.",
    ],
    explanation:
      "Collect all user ids, left join follower counts grouped by followee (follower_id).",
    officialSolution: `
SELECT u.user_id, COUNT(f.user_id) AS follower_count
FROM (
  SELECT user_id FROM Followers
  UNION
  SELECT follower_id FROM Followers
) u(user_id)
LEFT JOIN Followers f ON u.user_id = f.follower_id
GROUP BY u.user_id
ORDER BY follower_count DESC, u.user_id ASC;`,
  },
  {
    id: 28,
    leetcodeId: 619,
    slug: "biggest-single-number",
    title: "Biggest Single Number",
    difficulty: "easy",
    topics: ["Sorting"],
    description: "Find the largest number that appears exactly once.",
    statement: `Table: MyNumbers

+-------------+------+
| Column Name | Type |
+-------------+------+
| num         | int  |
+-------------+------+
There is no primary key.

Find the largest number that appears only once. Return null if none.

Example:
Input:
MyNumbers: 8, 8, 3, 3, 3, 9, 4, 4, 4
Output:
+-----+
| num |
+-----+
| 9   |
+-----+

Constraints:
- GROUP BY num HAVING COUNT = 1; take MAX.`,
    schemaSql: `
CREATE TABLE MyNumbers (
  num INT NOT NULL
);`,
    seedSql: `
INSERT INTO MyNumbers (num) VALUES
  (8), (8), (3), (3), (3), (9), (4), (4), (4);`,
    expectedOutputSql: `
SELECT MAX(num) AS num
FROM (
  SELECT num FROM MyNumbers
  GROUP BY num
  HAVING COUNT(*) = 1
) singles;`,
    hints: [
      "Find numbers appearing exactly once with GROUP BY HAVING COUNT(*) = 1.",
      "Take MAX of those singleton numbers.",
      "Returns NULL when no number appears once.",
    ],
    explanation:
      "Filter numbers with count 1, then select the maximum.",
    officialSolution: `
SELECT MAX(num) AS num
FROM (
  SELECT num FROM MyNumbers
  GROUP BY num
  HAVING COUNT(*) = 1
) singles;`,
  },
  {
    id: 29,
    leetcodeId: 1045,
    slug: "customers-who-bought-all-products",
    title: "Customers Who Bought All Products",
    difficulty: "medium",
    topics: ["Sorting"],
    description:
      "Find customers who bought every product in the Product table.",
    statement: `Tables: Customer, Product

Customer: customer_id, product_key
Product: product_key

Find customer_id of customers who bought all products.

Example:
Input:
Customer: (1,5), (2,6), (3,5), (1,6), (1,10), (1,8)
Product: 5, 6, 10
Output:
+-------------+
| customer_id |
+-------------+
| 1           |
+-------------+

Constraints:
- GROUP BY customer_id HAVING COUNT(DISTINCT product_key) = total products.`,
    schemaSql: `
CREATE TABLE Customer (
  customer_id INT NOT NULL,
  product_key INT NOT NULL,
  PRIMARY KEY (customer_id, product_key)
);
CREATE TABLE Product (
  product_key INT PRIMARY KEY
);`,
    seedSql: `
INSERT INTO Customer (customer_id, product_key) VALUES
  (1, 5), (2, 6), (3, 5), (1, 6), (1, 10), (1, 8);
INSERT INTO Product (product_key) VALUES (5), (6), (10);`,
    expectedOutputSql: `
SELECT customer_id
FROM Customer
GROUP BY customer_id
HAVING COUNT(DISTINCT product_key) = (SELECT COUNT(*) FROM Product)
ORDER BY customer_id;`,
    hints: [
      "Count distinct products bought per customer.",
      "Compare to total product count from Product table.",
      "Use HAVING with a subquery for total products.",
    ],
    explanation:
      "Group by customer and keep those whose distinct product count equals all products.",
    officialSolution: `
SELECT customer_id
FROM Customer
GROUP BY customer_id
HAVING COUNT(DISTINCT product_key) = (SELECT COUNT(*) FROM Product);`,
  },
];
