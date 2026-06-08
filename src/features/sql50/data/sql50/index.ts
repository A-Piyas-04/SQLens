import { LEETCODE50_PROBLEMS } from "./leetcode50";

import type { ProblemPack } from "../../../../lib/practice/types";
import { SQL50_PACK_ID } from "../../types/sql50";

export const SQL50_PROBLEMS = LEETCODE50_PROBLEMS;

export const SQL50_PACK: ProblemPack = {
  id: SQL50_PACK_ID,
  name: "SQL 50",
  problems: SQL50_PROBLEMS,
};

export function getAllProblems() {
  return SQL50_PROBLEMS;
}

export function getProblemBySlug(slug: string) {
  return SQL50_PROBLEMS.find((p) => p.slug === slug);
}

export function getProblemById(id: number) {
  return SQL50_PROBLEMS.find((p) => p.id === id);
}

export function getDefaultProblem() {
  return SQL50_PROBLEMS[0];
}
