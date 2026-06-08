import type { PracticeProblem } from "../../../../../lib/practice/types";

export const subqueriesProblems: PracticeProblem[] = [
  {
    id: 37,
    leetcodeId: 1978,
    slug: "employees-whose-manager-left-the-company",
    title: "Employees Whose Manager Left the Company",
    difficulty: "medium",
    topics: ["Subqueries"],
    description:
      "Find employees earning under $30000 whose manager no longer works at the company.",
    statement: `Table: Employees

+-------------+---------+
| Column Name | Type    |
+-------------+---------+
| employee_id | int     |
| name        | varchar |
| manager_id  | int     |
| salary      | int     |
+-------------+---------+
employee_id is the primary key.

Find employees with salary < 30000 whose manager left the company (manager not in table or manager salary < 30000).

Example:
Input:
Employees: (3,'Mila',9,60301), (12,'Antonella',null,41000), (13,'Emery',null,48000), (1,'Kale',11,21241), (7,'Haley',11,16593), (11,'Jaxon',9,77165), (15,'Penelope',null,93967), (9,'Lucia',null,37501)
Output:
+-------------+
| employee_id |
+-------------+
| 1           |
| 7           |
+-------------+

Constraints:
- Manager left if manager_id not in active employees earning >= 30000.`,
    schemaSql: `
CREATE TABLE Employees (
  employee_id INT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  manager_id INT,
  salary INT NOT NULL
);`,
    seedSql: `
INSERT INTO Employees (employee_id, name, manager_id, salary) VALUES
  (3, 'Mila', 9, 60301),
  (12, 'Antonella', NULL, 41000),
  (13, 'Emery', NULL, 48000),
  (1, 'Kale', 11, 21241),
  (7, 'Haley', 11, 16593),
  (11, 'Jaxon', 9, 25000),
  (15, 'Penelope', NULL, 93967),
  (9, 'Lucia', NULL, 37501);`,
    expectedOutputSql: `
SELECT employee_id
FROM Employees
WHERE salary < 30000
  AND manager_id NOT IN (
    SELECT employee_id FROM Employees WHERE salary >= 30000
  )
ORDER BY employee_id;`,
    hints: [
      "Filter employees with salary < 30000.",
      "Manager 'left' if manager_id is not among employees earning >= 30000.",
      "Use NOT IN subquery on employee_id.",
    ],
    explanation:
      "Find low-salary employees whose manager is absent from the set of well-paid active employees.",
    officialSolution: `
SELECT employee_id
FROM Employees
WHERE salary < 30000
  AND manager_id NOT IN (
    SELECT employee_id FROM Employees WHERE salary >= 30000
  );`,
  },
  {
    id: 38,
    leetcodeId: 626,
    slug: "exchange-seats",
    title: "Exchange Seats",
    difficulty: "medium",
    topics: ["Subqueries"],
    description: "Swap adjacent seat ids; keep the last seat unchanged if odd count.",
    statement: `Table: Seat

+-------------+---------+
| Column Name | Type    |
+-------------+---------+
| id          | int     |
| student     | varchar |
+-------------+---------+
id is a consecutive increasing integer representing seat order.

Swap seats of every two consecutive students. If odd count, last student stays.

Example:
Input:
Seat: (1,'Abbot'), (2,'Doris'), (3,'Emerson'), (4,'Green'), (5,'Jeames')
Output:
+----+---------+
| id | student |
+----+---------+
| 1  | Doris   |
| 2  | Abbot   |
| 3  | Green   |
| 4  | Emerson |
| 5  | Jeames  |
+----+---------+

Constraints:
- Use CASE on odd/even id to swap with neighbor.`,
    schemaSql: `
CREATE TABLE Seat (
  id INT PRIMARY KEY,
  student VARCHAR(255) NOT NULL
);`,
    seedSql: `
INSERT INTO Seat (id, student) VALUES
  (1, 'Abbot'), (2, 'Doris'), (3, 'Emerson'), (4, 'Green'), (5, 'Jeames');`,
    expectedOutputSql: `
SELECT id,
  CASE
    WHEN id % 2 = 1 AND id = (SELECT MAX(id) FROM Seat) THEN student
    WHEN id % 2 = 1 THEN (SELECT student FROM Seat s2 WHERE s2.id = Seat.id + 1)
    ELSE (SELECT student FROM Seat s2 WHERE s2.id = Seat.id - 1)
  END AS student
FROM Seat
ORDER BY id;`,
    hints: [
      "Odd ids swap with id+1; even ids swap with id-1.",
      "If total seats is odd, the last id keeps its student.",
      "Use CASE WHEN id % 2 with subqueries for neighbor lookup.",
    ],
    explanation:
      "Swap adjacent pairs using CASE on odd/even id, leaving the last seat unchanged when count is odd.",
    officialSolution: `
SELECT id,
  CASE
    WHEN id % 2 = 1 AND id = (SELECT MAX(id) FROM Seat) THEN student
    WHEN id % 2 = 1 THEN (SELECT student FROM Seat s2 WHERE s2.id = Seat.id + 1)
    ELSE (SELECT student FROM Seat s2 WHERE s2.id = Seat.id - 1)
  END AS student
FROM Seat
ORDER BY id;`,
  },
  {
    id: 39,
    leetcodeId: 1341,
    slug: "movie-rating",
    title: "Movie Rating",
    difficulty: "medium",
    topics: ["Subqueries"],
    description:
      "Find the user who rated the most movies in Feb 2020 and the highest-rated movie that month.",
    statement: `Tables: Movies, Users, MovieRating

Movies: movie_id, title
Users: user_id, name
MovieRating: movie_id, user_id, rating, created_at

February 2020: find (1) user who rated the most movies, (2) movie with highest avg rating.
Return name, title (either can come first in UNION).

Example uses combined results — return both answers as two rows with user name and movie title columns.

Constraints:
- Filter created_at to February 2020; use subqueries for max counts/averages.`,
    schemaSql: `
CREATE TABLE Movies (
  movie_id INT PRIMARY KEY,
  title VARCHAR(255) NOT NULL
);
CREATE TABLE Users (
  user_id INT PRIMARY KEY,
  name VARCHAR(255) NOT NULL
);
CREATE TABLE MovieRating (
  movie_id INT NOT NULL,
  user_id INT NOT NULL,
  rating INT NOT NULL,
  created_at DATE NOT NULL
);`,
    seedSql: `
INSERT INTO Movies (movie_id, title) VALUES
  (1, 'Avengers'), (2, 'Frozen 2'), (3, 'Joker');
INSERT INTO Users (user_id, name) VALUES
  (1, 'Daniel'), (2, 'Monica'), (3, 'Maria'), (4, 'James');
INSERT INTO MovieRating (movie_id, user_id, rating, created_at) VALUES
  (1, 1, 3, '2020-02-12'),
  (1, 1, 4, '2020-02-15'),
  (1, 2, 2, '2020-02-08'),
  (1, 2, 4, '2020-02-18'),
  (2, 2, 4, '2020-02-05'),
  (2, 2, 3, '2020-02-20'),
  (2, 3, 2, '2020-02-02'),
  (3, 3, 4, '2020-02-14');`,
    expectedOutputSql: `
SELECT results FROM (
  SELECT u.name AS results, 1 AS ord
  FROM Users u
  WHERE u.user_id = (
    SELECT user_id FROM MovieRating
    WHERE created_at >= '2020-02-01' AND created_at < '2020-03-01'
    GROUP BY user_id
    ORDER BY COUNT(*) DESC, user_id ASC
    LIMIT 1
  )
  UNION ALL
  SELECT m.title, 2
  FROM Movies m
  WHERE m.movie_id = (
    SELECT movie_id FROM MovieRating
    WHERE created_at >= '2020-02-01' AND created_at < '2020-03-01'
    GROUP BY movie_id
    ORDER BY AVG(rating) DESC, movie_id ASC
    LIMIT 1
  )
) t
ORDER BY ord;`,
    hints: [
      "Filter MovieRating to February 2020.",
      "Top user: GROUP BY user_id, ORDER BY COUNT DESC.",
      "Top movie: GROUP BY movie_id, ORDER BY AVG(rating) DESC.",
    ],
    explanation:
      "Use subqueries to find the most active rater and highest-rated movie in February 2020.",
    officialSolution: `
(SELECT u.name AS results
 FROM Users u
 JOIN MovieRating mr ON u.user_id = mr.user_id
 WHERE mr.created_at >= '2020-02-01' AND mr.created_at < '2020-03-01'
 GROUP BY u.user_id, u.name
 ORDER BY COUNT(*) DESC, u.name ASC
 LIMIT 1)
UNION ALL
(SELECT m.title
 FROM Movies m
 JOIN MovieRating mr ON m.movie_id = mr.movie_id
 WHERE mr.created_at >= '2020-02-01' AND mr.created_at < '2020-03-01'
 GROUP BY m.movie_id, m.title
 ORDER BY AVG(mr.rating) DESC, m.title ASC
 LIMIT 1);`,
  },
  {
    id: 40,
    leetcodeId: 1321,
    slug: "restaurant-growth",
    title: "Restaurant Growth",
    difficulty: "hard",
    topics: ["Subqueries"],
    description:
      "Compare each day's 7-day moving average amount to the average from 7 days earlier.",
    statement: `Table: Customer

+-------------+------+
| Column Name | Type |
+-------------+------+
| customer_id | int  |
| name        | varchar |
| visited_on  | date |
| amount      | int  |
+-------------+------+
(customer_id, visited_on) is the primary key.

For each day with at least 7 days of prior data, compare the 7-day average ending that day
to the 7-day average ending 7 days before. Round to 2 decimals.

Example:
Input:
Customer: (1,'Jhon','2019-01-01',100), (2,'Daniel','2019-01-02',110), (3,'Jade','2019-01-03',120), (4,'Khaled','2019-01-04',130), (5,'Winston','2019-01-05',110), (6,'Belle','2019-01-06',120), (7,'Jonathan','2019-01-07',145), (8,'Khaled','2019-01-08',140), (9,'Xavier','2019-01-09',99), (10,'Jade','2019-01-10',100)
Output:
+------------+-------------+--------------+
| visited_on | amount      | average_amount |
+------------+-------------+--------------+
| 2019-01-07 | 145         | 120.67       |
| 2019-01-08 | 140         | 122.00       |
| 2019-01-09 | 99          | 124.67       |
| 2019-01-10 | 100         | 126.00       |
+------------+-------------+--------------+

Constraints:
- Use window functions for 7-day rolling averages.`,
    schemaSql: `
CREATE TABLE Customer (
  customer_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  visited_on DATE NOT NULL,
  amount INT NOT NULL,
  PRIMARY KEY (customer_id, visited_on)
);`,
    seedSql: `
INSERT INTO Customer (customer_id, name, visited_on, amount) VALUES
  (1, 'Jhon', '2019-01-01', 100),
  (2, 'Daniel', '2019-01-02', 110),
  (3, 'Jade', '2019-01-03', 120),
  (4, 'Khaled', '2019-01-04', 130),
  (5, 'Winston', '2019-01-05', 110),
  (6, 'Belle', '2019-01-06', 120),
  (7, 'Jonathan', '2019-01-07', 145),
  (8, 'Khaled', '2019-01-08', 140),
  (9, 'Xavier', '2019-01-09', 99),
  (10, 'Jade', '2019-01-10', 100);`,
    expectedOutputSql: `
WITH daily AS (
  SELECT visited_on, SUM(amount) AS amount
  FROM Customer
  GROUP BY visited_on
),
rolling AS (
  SELECT visited_on, amount,
    ROUND(
      100.0 * amount / AVG(amount) OVER (
        ORDER BY visited_on ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
      ),
      2
    ) AS average_amount,
    ROW_NUMBER() OVER (ORDER BY visited_on) AS rn
  FROM daily
)
SELECT visited_on, amount, average_amount
FROM rolling
WHERE rn >= 7
ORDER BY visited_on;`,
    hints: [
      "Aggregate amount per visited_on first.",
      "Use AVG() OVER with 7-row window for rolling average.",
      "Only output days where at least 7 days of history exist.",
    ],
    explanation:
      "Compute 7-day rolling average of daily totals and return days with sufficient history.",
    officialSolution: `
WITH daily AS (
  SELECT visited_on, SUM(amount) AS amount
  FROM Customer
  GROUP BY visited_on
),
rolling AS (
  SELECT visited_on, amount,
    ROUND(AVG(amount) OVER (ORDER BY visited_on ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)::numeric, 2) AS average_amount,
    ROW_NUMBER() OVER (ORDER BY visited_on) AS rn
  FROM daily
)
SELECT visited_on, amount, average_amount
FROM rolling
WHERE rn >= 7;`,
  },
  {
    id: 41,
    leetcodeId: 602,
    slug: "friend-requests-ii-who-has-the-most-friends",
    title: "Friend Requests II: Who Has the Most Friends",
    difficulty: "medium",
    topics: ["Subqueries"],
    description: "Find the person with the most friends from accepted requests.",
    statement: `Table: RequestAccepted

+--------------+-----+
| Column Name  | Type |
+--------------+-----+
| requester_id | int |
| accepter_id  | int |
| accept_date  | date |
+--------------+-----+
(requester_id, accepter_id) is the primary key.

Find the person with the most friends (count both requester and accepter roles).

Example:
Input:
RequestAccepted: (1,2,'2016/06/03'), (1,3,'2016/07/08'), (2,3,'2016/06/08'), (3,4,'2016/06/09')
Output:
+----+-----+
| id | num |
+----+-----+
| 3  | 3   |
+----+-----+

Constraints:
- UNION requester and accepter ids, then GROUP BY and take MAX count.`,
    schemaSql: `
CREATE TABLE RequestAccepted (
  requester_id INT NOT NULL,
  accepter_id INT NOT NULL,
  accept_date DATE NOT NULL,
  PRIMARY KEY (requester_id, accepter_id)
);`,
    seedSql: `
INSERT INTO RequestAccepted (requester_id, accepter_id, accept_date) VALUES
  (1, 2, '2016-06-03'),
  (1, 3, '2016-07-08'),
  (2, 3, '2016-06-08'),
  (3, 4, '2016-06-09');`,
    expectedOutputSql: `
SELECT id, num
FROM (
  SELECT id, COUNT(*) AS num
  FROM (
    SELECT requester_id AS id FROM RequestAccepted
    UNION ALL
    SELECT accepter_id AS id FROM RequestAccepted
  ) friends
  GROUP BY id
) counts
WHERE num = (SELECT MAX(num) FROM (
  SELECT COUNT(*) AS num
  FROM (
    SELECT requester_id AS id FROM RequestAccepted
    UNION ALL
    SELECT accepter_id AS id FROM RequestAccepted
  ) f
  GROUP BY id
) m)
ORDER BY id;`,
    hints: [
      "Each friendship counts for both requester and accepter.",
      "UNION ALL both id columns, then GROUP BY id.",
      "Filter to the maximum friend count.",
    ],
    explanation:
      "Treat each user as friend of both parties in a request, count, and return those with the max.",
    officialSolution: `
SELECT id, COUNT(*) AS num
FROM (
  SELECT requester_id AS id FROM RequestAccepted
  UNION ALL
  SELECT accepter_id AS id FROM RequestAccepted
) friends
GROUP BY id
ORDER BY num DESC
LIMIT 1;`,
  },
  {
    id: 42,
    leetcodeId: 585,
    slug: "investments-in-2016",
    title: "Investments in 2016",
    difficulty: "medium",
    topics: ["Subqueries"],
    description:
      "Sum 2016 investments for customers whose tiv matches another customer but not in 2015.",
    statement: `Table: Insurance

+-------------+-------+
| Column Name | Type  |
+-------------+-------+
| pid         | int   |
| tiv         | int   |
| lat         | float |
| lon         | float |
| year        | int   |
+-------------+-------+
pid is the primary key.

Report sum of tiv for customers who:
- Have same tiv as at least one other person
- Are NOT at the same (lat, lon) as anyone else
- Invested in 2016

Example:
Input:
Insurance: (1,10,10,10,2016), (2,20,20,20,2016), (3,10,40,45,2015), (4,10,40,45,2016), (5,20,40,45,2016)
Output:
+------+
| tiv  |
+------+
| 45   |
+------+

Constraints:
- Filter year=2016; use GROUP BY for duplicate tiv and unique location checks.`,
    schemaSql: `
CREATE TABLE Insurance (
  pid INT PRIMARY KEY,
  tiv INT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lon DOUBLE PRECISION NOT NULL,
  year INT NOT NULL
);`,
    seedSql: `
INSERT INTO Insurance (pid, tiv, lat, lon, year) VALUES
  (1, 10, 10, 10, 2016),
  (2, 20, 20, 20, 2016),
  (3, 10, 40, 45, 2015),
  (4, 10, 40, 45, 2016),
  (5, 20, 40, 45, 2016);`,
    expectedOutputSql: `
SELECT ROUND(SUM(tiv)::numeric, 2) AS tiv
FROM Insurance
WHERE year = 2016
  AND tiv IN (SELECT tiv FROM Insurance GROUP BY tiv HAVING COUNT(*) > 1)
  AND (lat, lon) IN (
    SELECT lat, lon FROM Insurance GROUP BY lat, lon HAVING COUNT(*) = 1
  );`,
    hints: [
      "tiv must appear more than once across all records.",
      "(lat, lon) must be unique to that person only.",
      "Sum tiv for year 2016 matching both conditions.",
    ],
    explanation:
      "Filter 2016 rows where tiv is shared but location is unique, then sum tiv.",
    officialSolution: `
SELECT ROUND(SUM(tiv)::numeric, 2) AS tiv
FROM Insurance
WHERE year = 2016
  AND tiv IN (SELECT tiv FROM Insurance GROUP BY tiv HAVING COUNT(*) > 1)
  AND (lat, lon) IN (
    SELECT lat, lon FROM Insurance GROUP BY lat, lon HAVING COUNT(*) = 1
  );`,
  },
  {
    id: 43,
    leetcodeId: 185,
    slug: "department-top-three-salaries",
    title: "Department Top Three Salaries",
    difficulty: "hard",
    topics: ["Subqueries"],
    description:
      "Find employees whose salary ranks in the top 3 within their department.",
    statement: `Tables: Employee, Department

Employee: id, name, salary, departmentId
Department: id, name

Find employees with salary ranking top 3 within their department.
If fewer than 3 distinct salaries, include all top earners.

Example:
Input:
Employee: (1,'Joe',85000,1), (2,'Jim',90000,1), (3,'Henry',80000,2), (4,'Sam',60000,2), (5,'Max',90000,1), (6,'Janet',69000,1), (7,'Randy',85000,1), (8,'Will',70000,1)
Department: (1,'IT'), (2,'Sales')
Output:
+------------+----------+--------+
| Department | Employee | Salary |
+------------+----------+--------+
| IT         | Jim      | 90000  |
| IT         | Max      | 90000  |
| IT         | Joe      | 85000  |
| IT         | Randy    | 85000  |
| Sales      | Henry    | 80000  |
+------------+----------+--------+

Constraints:
- Use DENSE_RANK partitioned by departmentId ordered by salary DESC.`,
    schemaSql: `
CREATE TABLE Employee (
  id INT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  salary INT NOT NULL,
  departmentId INT NOT NULL
);
CREATE TABLE Department (
  id INT PRIMARY KEY,
  name VARCHAR(255) NOT NULL
);`,
    seedSql: `
INSERT INTO Employee (id, name, salary, departmentId) VALUES
  (1, 'Joe', 85000, 1),
  (2, 'Jim', 90000, 1),
  (3, 'Henry', 80000, 2),
  (4, 'Sam', 60000, 2),
  (5, 'Max', 90000, 1),
  (6, 'Janet', 69000, 1),
  (7, 'Randy', 85000, 1),
  (8, 'Will', 70000, 1);
INSERT INTO Department (id, name) VALUES
  (1, 'IT'), (2, 'Sales');`,
    expectedOutputSql: `
SELECT d.name AS Department, e.name AS Employee, e.salary AS Salary
FROM (
  SELECT *, DENSE_RANK() OVER (PARTITION BY departmentId ORDER BY salary DESC) AS rk
  FROM Employee
) e
JOIN Department d ON e.departmentId = d.id
WHERE e.rk <= 3
ORDER BY d.name, e.salary DESC, e.name;`,
    hints: [
      "Use DENSE_RANK() OVER (PARTITION BY departmentId ORDER BY salary DESC).",
      "Keep rows where rank <= 3.",
      "Join Department for the department name.",
    ],
    explanation:
      "Dense rank salaries within each department and keep the top three ranks.",
    officialSolution: `
SELECT d.name AS Department, e.name AS Employee, e.salary AS Salary
FROM (
  SELECT *, DENSE_RANK() OVER (PARTITION BY departmentId ORDER BY salary DESC) AS rk
  FROM Employee
) e
JOIN Department d ON e.departmentId = d.id
WHERE e.rk <= 3;`,
  },
];
