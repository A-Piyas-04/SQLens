import type { PracticeProblem } from "../../../../../lib/practice/types";

import { advancedSelectProblems } from "./advanced-select";
import { advancedStringProblems } from "./advanced-string";
import { basicAggregateProblems } from "./basic-aggregate";
import { basicJoinsProblems } from "./basic-joins";
import { selectProblems } from "./select";
import { sortingProblems } from "./sorting";
import { subqueriesProblems } from "./subqueries";

/** LeetCode SQL 50 study plan problems in official order (PostgreSQL / PGlite). */
export const LEETCODE50_PROBLEMS: PracticeProblem[] = [
  ...selectProblems,
  ...basicJoinsProblems,
  ...basicAggregateProblems,
  ...sortingProblems,
  ...advancedSelectProblems,
  ...subqueriesProblems,
  ...advancedStringProblems,
];
