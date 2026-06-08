import type { PracticeProblem } from "../../../../../lib/practice/types";

export const basicAggregateProblems: PracticeProblem[] = [
  {
    id: 15,
    leetcodeId: 620,
    slug: "not-boring-movies",
    title: "Not Boring Movies",
    difficulty: "easy",
    topics: ["Basic Aggregate"],
    description:
      "Return odd-id movies whose description is not boring, by rating desc.",
    statement: `Table: Cinema

+-------------+--------------+
| Column Name | Type         |
+-------------+--------------+
| id          | int          |
| movie       | varchar      |
| description | varchar      |
| rating      | float        |
+-------------+--------------+
id is the primary key.

Report movies with odd id and description not boring, ordered by rating desc.

Example:
Input:
Cinema: (1,'War','great 3D',8.9), (2,'Science','fiction',8.5), (3,'irish','boring',6.2), (4,'Ice song','Fantacy',8.6), (5,'House card','Interesting',9.1)
Output:
+-------------+--------------+-------------+----------+
| id          | movie        | description | rating   |
+-------------+--------------+-------------+----------+
| 5           | House card   | Interesting | 9.1      |
| 1           | War          | great 3D    | 8.9      |
+-------------+--------------+-------------+----------+

Constraints:
- id % 2 = 1; description NOT LIKE '%boring%'; ORDER BY rating DESC.`,
    schemaSql: `
CREATE TABLE Cinema (
  id INT PRIMARY KEY,
  movie VARCHAR(255) NOT NULL,
  description VARCHAR(255) NOT NULL,
  rating DOUBLE PRECISION NOT NULL
);`,
    seedSql: `
INSERT INTO Cinema (id, movie, description, rating) VALUES
  (1, 'War', 'great 3D', 8.9),
  (2, 'Science', 'fiction', 8.5),
  (3, 'irish', 'boring', 6.2),
  (4, 'Ice song', 'Fantacy', 8.6),
  (5, 'House card', 'Interesting', 9.1);`,
    expectedOutputSql: `
SELECT * FROM Cinema
WHERE id % 2 = 1 AND description NOT LIKE '%boring%'
ORDER BY rating DESC, id;`,
    hints: [
      "Filter odd ids with id % 2 = 1.",
      "Exclude descriptions containing 'boring' using NOT LIKE.",
      "Sort by rating descending.",
    ],
    explanation:
      "Filter odd ids and non-boring descriptions, then order by rating descending.",
    officialSolution: `
SELECT * FROM Cinema
WHERE id % 2 = 1 AND description NOT LIKE '%boring%'
ORDER BY rating DESC;`,
  },
  {
    id: 16,
    leetcodeId: 1251,
    slug: "average-selling-price",
    title: "Average Selling Price",
    difficulty: "easy",
    topics: ["Basic Aggregate"],
    description:
      "Compute weighted average selling price per product.",
    statement: `Tables: Prices, UnitsSold

Prices: product_id, start_date, end_date, price
UnitsSold: product_id, purchase_date, units

Average price = SUM(price * units) / SUM(units) for sales within the price period.

Example:
Input:
Prices: (1,'2019-02-17','2019-02-28',5), (1,'2019-03-01','2019-03-31',20), (2,'2019-02-01','2019-02-28',15), (2,'2019-03-01','2019-03-31',20)
UnitsSold: (1,'2019-02-25',100), (1,'2019-03-01',15), (2,'2019-02-10',200), (2,'2019-03-22',30)
Output:
+------------+-----------------+
| product_id | average_price   |
+------------+-----------------+
| 1          | 6.96            |
| 2          | 16.96           |
+------------+-----------------+

Constraints:
- Join where purchase_date is between start_date and end_date; ROUND to 2 decimals.`,
    schemaSql: `
CREATE TABLE Prices (
  product_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  price INT NOT NULL
);
CREATE TABLE UnitsSold (
  product_id INT NOT NULL,
  purchase_date DATE NOT NULL,
  units INT NOT NULL
);`,
    seedSql: `
INSERT INTO Prices (product_id, start_date, end_date, price) VALUES
  (1, '2019-02-17', '2019-02-28', 5),
  (1, '2019-03-01', '2019-03-31', 20),
  (2, '2019-02-01', '2019-02-28', 15),
  (2, '2019-03-01', '2019-03-31', 20);
INSERT INTO UnitsSold (product_id, purchase_date, units) VALUES
  (1, '2019-02-25', 100),
  (1, '2019-03-01', 15),
  (2, '2019-02-10', 200),
  (2, '2019-03-22', 30);`,
    expectedOutputSql: `
SELECT p.product_id,
  ROUND(SUM(p.price * u.units)::numeric / SUM(u.units), 2) AS average_price
FROM Prices p
JOIN UnitsSold u
  ON p.product_id = u.product_id
  AND u.purchase_date BETWEEN p.start_date AND p.end_date
GROUP BY p.product_id
ORDER BY p.product_id;`,
    hints: [
      "Join Prices to UnitsSold where purchase_date falls in the price window.",
      "Weighted average: SUM(price * units) / SUM(units).",
      "GROUP BY product_id and ROUND to 2 decimal places.",
    ],
    explanation:
      "Join sales to valid price periods, then compute weighted average price per product.",
    officialSolution: `
SELECT p.product_id,
  ROUND(SUM(p.price * u.units)::numeric / SUM(u.units), 2) AS average_price
FROM Prices p
JOIN UnitsSold u
  ON p.product_id = u.product_id
  AND u.purchase_date BETWEEN p.start_date AND p.end_date
GROUP BY p.product_id;`,
  },
  {
    id: 17,
    leetcodeId: 1075,
    slug: "project-employees-i",
    title: "Project Employees I",
    difficulty: "easy",
    topics: ["Basic Aggregate"],
    description:
      "Average years of experience per project, rounded to 2 decimals.",
    statement: `Tables: Project, Employee

Project: project_id, employee_id
Employee: employee_id, name, experience_years

Average experience years per project, rounded to 2 decimals.

Example:
Input:
Project: (1,1), (1,2), (1,3), (2,1), (2,4)
Employee: (1,'Khaled',3), (2,'Ali',2), (3,'John',1), (4,'Doe',2)
Output:
+------------+---------------+
| project_id | average_years |
+------------+---------------+
| 1          | 2.00          |
| 2          | 2.50          |
+------------+---------------+

Constraints:
- JOIN Project and Employee; GROUP BY project_id.`,
    schemaSql: `
CREATE TABLE Project (
  project_id INT NOT NULL,
  employee_id INT NOT NULL,
  PRIMARY KEY (project_id, employee_id)
);
CREATE TABLE Employee (
  employee_id INT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  experience_years INT NOT NULL
);`,
    seedSql: `
INSERT INTO Project (project_id, employee_id) VALUES
  (1, 1), (1, 2), (1, 3), (2, 1), (2, 4);
INSERT INTO Employee (employee_id, name, experience_years) VALUES
  (1, 'Khaled', 3), (2, 'Ali', 2), (3, 'John', 1), (4, 'Doe', 2);`,
    expectedOutputSql: `
SELECT p.project_id,
  ROUND(AVG(e.experience_years)::numeric, 2) AS average_years
FROM Project p
JOIN Employee e ON p.employee_id = e.employee_id
GROUP BY p.project_id
ORDER BY p.project_id;`,
    hints: [
      "JOIN Project to Employee on employee_id.",
      "Use AVG(experience_years) grouped by project_id.",
      "ROUND the result to 2 decimal places.",
    ],
    explanation:
      "Join project assignments to employee experience and average per project.",
    officialSolution: `
SELECT p.project_id,
  ROUND(AVG(e.experience_years)::numeric, 2) AS average_years
FROM Project p
JOIN Employee e ON p.employee_id = e.employee_id
GROUP BY p.project_id;`,
  },
  {
    id: 18,
    leetcodeId: 1633,
    slug: "percentage-of-users-attended-a-contest",
    title: "Percentage of Users Attended a Contest",
    difficulty: "easy",
    topics: ["Basic Aggregate"],
    description:
      "Percentage of registered users who attended a contest, rounded to 2 decimals.",
    statement: `Tables: Users, Register

Users: user_id, user_name
Register: contest_id, user_id

Percentage of users who registered and attended. Round to 2 decimals.

Example:
Input:
Users: (6,'Alice'), (2,'Bob'), (7,'Alex')
Register: (215,6), (209,2), (208,2)
Output:
+------------+
| percentage |
+------------+
| 33.33      |
+------------+

Constraints:
- COUNT(DISTINCT registered users who attended) / COUNT(all users) * 100.`,
    schemaSql: `
CREATE TABLE Users (
  user_id INT PRIMARY KEY,
  user_name VARCHAR(255) NOT NULL
);
CREATE TABLE Register (
  contest_id INT NOT NULL,
  user_id INT NOT NULL,
  PRIMARY KEY (contest_id, user_id)
);`,
    seedSql: `
INSERT INTO Users (user_id, user_name) VALUES
  (6, 'Alice'), (2, 'Bob'), (7, 'Alex');
INSERT INTO Register (contest_id, user_id) VALUES
  (215, 6), (209, 2), (208, 2);`,
    expectedOutputSql: `
SELECT ROUND(
  COUNT(DISTINCT user_id)::numeric / (SELECT COUNT(*) FROM Users) * 100,
  2
) AS percentage
FROM Register;`,
    hints: [
      "Count distinct registered user_ids divided by total users.",
      "Multiply by 100 for percentage.",
      "Use a subquery for total user count from Users.",
    ],
    explanation:
      "Divide distinct registered users by total users and multiply by 100.",
    officialSolution: `
SELECT ROUND(
  COUNT(DISTINCT user_id)::numeric / (SELECT COUNT(*) FROM Users) * 100,
  2
) AS percentage
FROM Register;`,
  },
  {
    id: 19,
    leetcodeId: 1211,
    slug: "queries-quality-and-percentage",
    title: "Queries Quality and Percentage",
    difficulty: "easy",
    topics: ["Basic Aggregate"],
    description:
      "Compute quality and poor query percentage per query name.",
    statement: `Table: Queries

+-------------+---------+
| Column Name | Type    |
+-------------+---------+
| query_name  | varchar |
| result      | varchar |
| position    | int     |
| rating      | int     |
+-------------+---------+

Quality = AVG(rating / position). Poor percentage = % of queries with rating < 3.
Round both to 2 decimal places.

Example:
Input:
Queries: ('Dog','purebreed',1,5), ('Dog','*purebreed',2,2), ('Dog','*purebreed',1,1), ('Cat','shorthair',3,4), ('Cat','shorthair',4,5), ('Cat','shorthair',5,4)
Output:
+------------+---------+-------------------+
| query_name | quality | poor_query_percentage |
+------------+---------+-------------------+
| Dog        | 2.50    | 33.33             |
| Cat        | 0.66    | 33.33             |
+------------+---------+-------------------+

Constraints:
- GROUP BY query_name; ROUND to 2 decimals.`,
    schemaSql: `
CREATE TABLE Queries (
  query_name VARCHAR(255) NOT NULL,
  result VARCHAR(255) NOT NULL,
  position INT NOT NULL,
  rating INT NOT NULL
);`,
    seedSql: `
INSERT INTO Queries (query_name, result, position, rating) VALUES
  ('Dog', 'purebreed', 1, 5),
  ('Dog', '*purebreed', 2, 2),
  ('Dog', '*purebreed', 1, 1),
  ('Cat', 'shorthair', 3, 4),
  ('Cat', 'shorthair', 4, 5),
  ('Cat', 'shorthair', 5, 4);`,
    expectedOutputSql: `
SELECT query_name,
  ROUND(AVG(rating::numeric / position), 2) AS quality,
  ROUND(SUM(CASE WHEN rating < 3 THEN 1 ELSE 0 END)::numeric / COUNT(*) * 100, 2) AS poor_query_percentage
FROM Queries
GROUP BY query_name
ORDER BY query_name;`,
    hints: [
      "Quality is AVG(rating / position) per query_name.",
      "Poor percentage: count rating < 3 divided by total rows.",
      "Use CASE WHEN for conditional counting.",
    ],
    explanation:
      "Group by query_name and compute average quality score and poor query percentage.",
    officialSolution: `
SELECT query_name,
  ROUND(AVG(rating::numeric / position), 2) AS quality,
  ROUND(SUM(CASE WHEN rating < 3 THEN 1 ELSE 0 END)::numeric / COUNT(*) * 100, 2) AS poor_query_percentage
FROM Queries
GROUP BY query_name;`,
  },
  {
    id: 20,
    leetcodeId: 1193,
    slug: "monthly-transactions-i",
    title: "Monthly Transactions I",
    difficulty: "medium",
    topics: ["Basic Aggregate"],
    description:
      "Summarize approved and declined transactions per month and country.",
    statement: `Table: Transactions

+--------------+---------+
| Column Name  | Type    |
+--------------+---------+
| id           | int     |
| country      | varchar |
| state        | varchar |
| amount       | int     |
| trans_date   | date    |
+--------------+---------+

Report month, country, approved count, total approved amount, declined count per month/country.

Example:
Input:
Transactions: (121,'US','approved',1000,'2018-12-18'), (122,'US','declined',2000,'2018-12-19'), (123,'US','approved',2000,'2019-01-01')
Output:
+----------+---------+-------------+----------------+----------------+---------------+
| month    | country | trans_count | approved_count | total_amount   | approved_amount |
+----------+---------+-------------+----------------+----------------+---------------+
| 2018-12  | US      | 2           | 1              | 3000           | 1000          |
| 2019-01  | US      | 1           | 1              | 2000           | 2000          |
+----------+---------+-------------+----------------+----------------+---------------+

Constraints:
- Format month as YYYY-MM using TO_CHAR in PostgreSQL.`,
    schemaSql: `
CREATE TABLE Transactions (
  id INT PRIMARY KEY,
  country VARCHAR(255) NOT NULL,
  state VARCHAR(20) NOT NULL,
  amount INT NOT NULL,
  trans_date DATE NOT NULL
);`,
    seedSql: `
INSERT INTO Transactions (id, country, state, amount, trans_date) VALUES
  (121, 'US', 'approved', 1000, '2018-12-18'),
  (122, 'US', 'declined', 2000, '2018-12-19'),
  (123, 'US', 'approved', 2000, '2019-01-01');`,
    expectedOutputSql: `
SELECT TO_CHAR(trans_date, 'YYYY-MM') AS month,
  country,
  COUNT(*) AS trans_count,
  SUM(CASE WHEN state = 'approved' THEN 1 ELSE 0 END) AS approved_count,
  SUM(amount) AS total_amount,
  SUM(CASE WHEN state = 'approved' THEN amount ELSE 0 END) AS approved_amount
FROM Transactions
GROUP BY TO_CHAR(trans_date, 'YYYY-MM'), country
ORDER BY month, country;`,
    hints: [
      "Use TO_CHAR(trans_date, 'YYYY-MM') for the month column.",
      "Use conditional SUM/CASE for approved counts and amounts.",
      "GROUP BY month and country.",
    ],
    explanation:
      "Group transactions by month and country with conditional aggregates for approved rows.",
    officialSolution: `
SELECT TO_CHAR(trans_date, 'YYYY-MM') AS month,
  country,
  COUNT(*) AS trans_count,
  SUM(CASE WHEN state = 'approved' THEN 1 ELSE 0 END) AS approved_count,
  SUM(amount) AS total_amount,
  SUM(CASE WHEN state = 'approved' THEN amount ELSE 0 END) AS approved_amount
FROM Transactions
GROUP BY TO_CHAR(trans_date, 'YYYY-MM'), country
ORDER BY month, country;`,
  },
  {
    id: 21,
    leetcodeId: 1174,
    slug: "immediate-food-delivery-ii",
    title: "Immediate Food Delivery II",
    difficulty: "medium",
    topics: ["Basic Aggregate"],
    description:
      "Percentage of first orders delivered immediately, rounded to 2 decimals.",
    statement: `Table: Delivery

+-------------+---------+
| Column Name | Type    |
+-------------+---------+
| delivery_id | int     |
| customer_id | int     |
| order_date  | date    |
| customer_pref_delivery_date | date |
+-------------+---------+

Immediate delivery when order_date equals customer_pref_delivery_date.
Of first orders per customer, what percentage were immediate? Round to 2 decimals.

Example:
Input:
Delivery: (1,1,'2019-08-01','2019-08-02'), (2,2,'2019-08-02','2019-08-02'), (3,1,'2019-08-11','2019-08-12'), (4,3,'2019-08-24','2019-08-24'), (5,3,'2019-08-21','2019-08-22'), (7,2,'2019-08-13','2019-08-13')
Output:
+----------------------+
| immediate_percentage |
+----------------------+
| 33.33                |
+----------------------+

Constraints:
- Identify first order per customer with MIN(order_date) or ROW_NUMBER.`,
    schemaSql: `
CREATE TABLE Delivery (
  delivery_id INT PRIMARY KEY,
  customer_id INT NOT NULL,
  order_date DATE NOT NULL,
  customer_pref_delivery_date DATE NOT NULL
);`,
    seedSql: `
INSERT INTO Delivery (delivery_id, customer_id, order_date, customer_pref_delivery_date) VALUES
  (1, 1, '2019-08-01', '2019-08-02'),
  (2, 2, '2019-08-02', '2019-08-02'),
  (3, 1, '2019-08-11', '2019-08-12'),
  (4, 3, '2019-08-24', '2019-08-24'),
  (5, 3, '2019-08-21', '2019-08-22'),
  (7, 2, '2019-08-13', '2019-08-13');`,
    expectedOutputSql: `
WITH first_orders AS (
  SELECT DISTINCT ON (customer_id) *
  FROM Delivery
  ORDER BY customer_id, order_date, delivery_id
)
SELECT ROUND(
  SUM(CASE WHEN order_date = customer_pref_delivery_date THEN 1 ELSE 0 END)::numeric
    / COUNT(*) * 100,
  2
) AS immediate_percentage
FROM first_orders;`,
    hints: [
      "Find each customer's first order (earliest order_date).",
      "In PostgreSQL, DISTINCT ON (customer_id) ORDER BY order_date works.",
      "Count immediate deliveries (order_date = pref date) over first orders.",
    ],
    explanation:
      "Isolate first orders per customer, then compute percentage where delivery was immediate.",
    officialSolution: `
WITH first_orders AS (
  SELECT DISTINCT ON (customer_id) *
  FROM Delivery
  ORDER BY customer_id, order_date, delivery_id
)
SELECT ROUND(
  SUM(CASE WHEN order_date = customer_pref_delivery_date THEN 1 ELSE 0 END)::numeric
    / COUNT(*) * 100,
  2
) AS immediate_percentage
FROM first_orders;`,
  },
  {
    id: 22,
    leetcodeId: 550,
    slug: "game-play-analysis-iv",
    title: "Game Play Analysis IV",
    difficulty: "medium",
    topics: ["Basic Aggregate"],
    description:
      "Fraction of players who logged in on both first and second day.",
    statement: `Table: Activity

+--------------+---------+
| Column Name  | Type    |
+--------------+---------+
| player_id    | int     |
| device_id    | int     |
| event_date   | date    |
| games_played | int     |
+--------------+---------+
(player_id, event_date) is the primary key.

Fraction of players who logged in on day 2 after their first login. Round to 2 decimals.

Example:
Input:
Activity: (1,2,'2016-03-01',5), (1,2,'2016-03-02',2), (2,3,'2017-06-25',1), (3,1,'2016-03-02',0), (3,4,'2018-07-03',5)
Output:
+-----------+
| fraction  |
+-----------+
| 0.33      |
+-----------+

Constraints:
- Compare first login date with first login + 1 day activity.`,
    schemaSql: `
CREATE TABLE Activity (
  player_id INT NOT NULL,
  device_id INT NOT NULL,
  event_date DATE NOT NULL,
  games_played INT NOT NULL,
  PRIMARY KEY (player_id, event_date)
);`,
    seedSql: `
INSERT INTO Activity (player_id, device_id, event_date, games_played) VALUES
  (1, 2, '2016-03-01', 5),
  (1, 2, '2016-03-02', 2),
  (2, 3, '2017-06-25', 1),
  (3, 1, '2016-03-02', 0),
  (3, 4, '2018-07-03', 5);`,
    expectedOutputSql: `
WITH first_login AS (
  SELECT player_id, MIN(event_date) AS first_date
  FROM Activity
  GROUP BY player_id
)
SELECT ROUND(
  COUNT(DISTINCT a.player_id)::numeric / (SELECT COUNT(*) FROM first_login),
  2
) AS fraction
FROM first_login f
JOIN Activity a
  ON f.player_id = a.player_id
  AND a.event_date = f.first_date + INTERVAL '1 day';`,
    hints: [
      "Find each player's first login date with MIN(event_date).",
      "Check if they have activity on first_date + 1 day.",
      "Divide matching players by total players.",
    ],
    explanation:
      "Find first login per player, count those with next-day activity, divide by total players.",
    officialSolution: `
WITH first_login AS (
  SELECT player_id, MIN(event_date) AS first_date
  FROM Activity
  GROUP BY player_id
)
SELECT ROUND(
  COUNT(DISTINCT a.player_id)::numeric / (SELECT COUNT(*) FROM first_login),
  2
) AS fraction
FROM first_login f
JOIN Activity a
  ON f.player_id = a.player_id
  AND a.event_date = f.first_date + INTERVAL '1 day';`,
  },
];
