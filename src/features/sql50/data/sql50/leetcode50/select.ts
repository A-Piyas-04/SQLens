import type { PracticeProblem } from "../../../../../lib/practice/types";

export const selectProblems: PracticeProblem[] = [
  {
    id: 1,
    leetcodeId: 1757,
    slug: "recyclable-and-low-fat-products",
    title: "Recyclable and Low Fat Products",
    difficulty: "easy",
    topics: ["Select"],
    description:
      "Return product IDs that are both low fat and recyclable.",
    statement: `Table: Products

+-------------+---------+
| Column Name | Type    |
+-------------+---------+
| product_id  | int     |
| low_fats    | varchar |
| recyclable  | varchar |
+-------------+---------+
product_id is the primary key.
low_fats and recyclable are 'Y' or 'N' (yes or no).

Write a solution to find the ids of products that are both low fat and recyclable.

Example:
Input:
Products table:
+-------------+----------+------------+
| product_id  | low_fats | recyclable |
+-------------+----------+------------+
| 0           | Y        | N          |
| 1           | Y        | Y          |
| 2           | N        | Y          |
| 3           | Y        | Y          |
+-------------+----------+------------+
Output:
+-------------+
| product_id  |
+-------------+
| 1           |
| 3           |
+-------------+

Constraints:
- All values in low_fats and recyclable are 'Y' or 'N'.`,
    schemaSql: `
CREATE TABLE Products (
  product_id INT PRIMARY KEY,
  low_fats VARCHAR(1) NOT NULL,
  recyclable VARCHAR(1) NOT NULL
);`,
    seedSql: `
INSERT INTO Products (product_id, low_fats, recyclable) VALUES
  (0, 'Y', 'N'),
  (1, 'Y', 'Y'),
  (2, 'N', 'Y'),
  (3, 'Y', 'Y');`,
    expectedOutputSql: `
SELECT product_id FROM Products
WHERE low_fats = 'Y' AND recyclable = 'Y'
ORDER BY product_id;`,
    hints: [
      "Filter rows where both low_fats and recyclable equal 'Y'.",
      "Use AND to combine both conditions in the WHERE clause.",
      "Return only the product_id column.",
    ],
    explanation:
      "Select product_id from Products where both low_fats and recyclable are 'Y'.",
    officialSolution: `
SELECT product_id
FROM Products
WHERE low_fats = 'Y' AND recyclable = 'Y';`,
  },
  {
    id: 2,
    leetcodeId: 584,
    slug: "find-customer-referee",
    title: "Find Customer Referee",
    difficulty: "easy",
    topics: ["Select"],
    description:
      "Return customers whose referee is not customer 2 (including NULL referees).",
    statement: `Table: Customer

+-------------+---------+
| Column Name | Type    |
+-------------+---------+
| id          | int     |
| name        | varchar |
| referee_id  | int     |
+-------------+---------+
id is the primary key.
Each row indicates the id of a customer and the id of the customer who referred them.

Write a solution to find the names of the customer that are not referred by the customer with id = 2.

Example:
Input:
Customer table:
+----+------+------------+
| id | name | referee_id |
+----+------+------------+
| 1  | Will | null       |
| 2  | Jane | null       |
| 3  | Alex | 2          |
| 4  | Bill | null       |
| 5  | Zack | 1          |
| 6  | Mark | 2          |
+----+------+------------+
Output:
+------+
| name |
+------+
| Will |
| Jane |
| Alex |
| Bill |
| Zack |
+------+

Constraints:
- referee_id may be NULL.`,
    schemaSql: `
CREATE TABLE Customer (
  id INT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  referee_id INT
);`,
    seedSql: `
INSERT INTO Customer (id, name, referee_id) VALUES
  (1, 'Will', NULL),
  (2, 'Jane', NULL),
  (3, 'Alex', 2),
  (4, 'Bill', NULL),
  (5, 'Zack', 1),
  (6, 'Mark', 2);`,
    expectedOutputSql: `
SELECT name FROM Customer
WHERE referee_id != 2 OR referee_id IS NULL
ORDER BY name;`,
    hints: [
      "Customers with NULL referee_id should be included.",
      "In SQL, NULL != 2 is unknown — use OR referee_id IS NULL.",
      "Exclude only customers referred by id 2 (referee_id = 2).",
    ],
    explanation:
      "Return customers where referee_id is not 2 or is NULL, since NULL comparisons need explicit handling.",
    officialSolution: `
SELECT name
FROM Customer
WHERE referee_id != 2 OR referee_id IS NULL;`,
  },
  {
    id: 3,
    leetcodeId: 595,
    slug: "big-countries",
    title: "Big Countries",
    difficulty: "easy",
    topics: ["Select"],
    description:
      "Return countries with area at least 3M km² or population at least 25M.",
    statement: `Table: World

+-------------+---------+
| Column Name | Type    |
+-------------+---------+
| name        | varchar |
| continent   | varchar |
| area        | int     |
| population  | int     |
+-------------+---------+
name is the primary key.

A country is big if area >= 3,000,000 km² or population >= 25,000,000.

Example:
Input:
World table:
+-------------+-----------+------+------------+
| name        | continent | area | population |
+-------------+-----------+------+------------+
| Afghanistan | Asia      | 652230 | 25500100 |
| Albania     | Europe    | 28748  | 2831741  |
| Algeria     | Africa    | 2381741| 37100000 |
+-------------+-----------+------+------------+
Output:
+-------------+------------+---------+
| name        | population | area    |
+-------------+------------+---------+
| Afghanistan | 25500100   | 652230  |
| Algeria     | 37100000   | 2381741 |
+-------------+------------+---------+

Constraints:
- Return name, population, and area columns.`,
    schemaSql: `
CREATE TABLE World (
  name VARCHAR(255) PRIMARY KEY,
  continent VARCHAR(255) NOT NULL,
  area INT NOT NULL,
  population INT NOT NULL
);`,
    seedSql: `
INSERT INTO World (name, continent, area, population) VALUES
  ('Afghanistan', 'Asia', 652230, 25500100),
  ('Albania', 'Europe', 28748, 2831741),
  ('Algeria', 'Africa', 2381741, 37100000);`,
    expectedOutputSql: `
SELECT name, population, area FROM World
WHERE area >= 3000000 OR population >= 25000000
ORDER BY name;`,
    hints: [
      "Use OR to combine the area and population thresholds.",
      "Area threshold is 3,000,000; population threshold is 25,000,000.",
      "Return name, population, and area as specified.",
    ],
    explanation:
      "Filter countries meeting either the area or population threshold using OR in the WHERE clause.",
    officialSolution: `
SELECT name, population, area
FROM World
WHERE area >= 3000000 OR population >= 25000000;`,
  },
  {
    id: 4,
    leetcodeId: 1148,
    slug: "article-views-i",
    title: "Article Views I",
    difficulty: "easy",
    topics: ["Select"],
    description:
      "Find authors who viewed at least one of their own articles.",
    statement: `Table: Views

+-------------+---------+
| Column Name | Type    |
+-------------+---------+
| article_id  | int     |
| author_id   | int     |
| viewer_id   | int     |
| view_date   | date    |
+-------------+---------+
There is no primary key; rows may be duplicated.
Each row indicates that viewer_id viewed article_id on view_date.
article_id is the id of the author who wrote the article.

Write a solution to find all the authors that viewed at least one of their own articles.

Example:
Input:
Views table:
+------------+-----------+-----------+------------+
| article_id | author_id | viewer_id | view_date  |
+------------+-----------+-----------+------------+
| 1          | 3         | 5         | 2019-08-01 |
| 1          | 3         | 6         | 2019-08-02 |
| 2          | 7         | 7         | 2019-08-01 |
| 2          | 7         | 6         | 2019-08-02 |
| 4          | 7         | 1         | 2019-08-01 |
| 3          | 4         | 4         | 2019-08-02 |
| 3          | 4         | 4         | 2019-08-02 |
+------------+-----------+-----------+------------+
Output:
+------+
| id   |
+------+
| 4    |
| 7    |
+------+

Constraints:
- Sort by id ascending; use DISTINCT.`,
    schemaSql: `
CREATE TABLE Views (
  article_id INT NOT NULL,
  author_id INT NOT NULL,
  viewer_id INT NOT NULL,
  view_date DATE NOT NULL
);`,
    seedSql: `
INSERT INTO Views (article_id, author_id, viewer_id, view_date) VALUES
  (1, 3, 5, '2019-08-01'),
  (1, 3, 6, '2019-08-02'),
  (2, 7, 7, '2019-08-01'),
  (2, 7, 6, '2019-08-02'),
  (4, 7, 1, '2019-08-01'),
  (3, 4, 4, '2019-08-02'),
  (3, 4, 4, '2019-08-02');`,
    expectedOutputSql: `
SELECT DISTINCT author_id AS id FROM Views
WHERE author_id = viewer_id
ORDER BY id;`,
    hints: [
      "An author viewed their own article when author_id equals viewer_id.",
      "Use DISTINCT to avoid duplicate author ids.",
      "Return the column aliased as id.",
    ],
    explanation:
      "Select distinct author_id where the author is also the viewer, meaning they read their own article.",
    officialSolution: `
SELECT DISTINCT author_id AS id
FROM Views
WHERE author_id = viewer_id
ORDER BY id;`,
  },
  {
    id: 5,
    leetcodeId: 1683,
    slug: "invalid-tweets",
    title: "Invalid Tweets",
    difficulty: "easy",
    topics: ["Select"],
    description: "Return tweet IDs whose content exceeds 15 characters.",
    statement: `Table: Tweets

+----------------+---------+
| Column Name    | Type    |
+----------------+---------+
| tweet_id       | int     |
| content        | varchar |
+----------------+---------+
tweet_id is the primary key.
content is the text of the tweet (max 50 chars).

Write a solution to find the ids of invalid tweets. A tweet is invalid if it has more than 15 characters.

Example:
Input:
Tweets table:
+----------+----------------------------------+
| tweet_id | content                          |
+----------+----------------------------------+
| 1        | Vote for Biden                   |
| 2        | Let us make America great again! |
+----------+----------------------------------+
Output:
+----------+
| tweet_id |
+----------+
| 2        |
+----------+

Constraints:
- Use LENGTH or CHAR_LENGTH to count characters.`,
    schemaSql: `
CREATE TABLE Tweets (
  tweet_id INT PRIMARY KEY,
  content VARCHAR(50) NOT NULL
);`,
    seedSql: `
INSERT INTO Tweets (tweet_id, content) VALUES
  (1, 'Vote for Biden'),
  (2, 'Let us make America great again!');`,
    expectedOutputSql: `
SELECT tweet_id FROM Tweets
WHERE LENGTH(content) > 15
ORDER BY tweet_id;`,
    hints: [
      "Use LENGTH(content) to count characters in PostgreSQL.",
      "Filter tweets where the length exceeds 15.",
      "Return only tweet_id.",
    ],
    explanation:
      "Filter tweets where LENGTH(content) > 15 to find invalid tweets.",
    officialSolution: `
SELECT tweet_id
FROM Tweets
WHERE LENGTH(content) > 15;`,
  },
];
