import { problem as p1 } from "./problems/easy/01-select-all-employees";
import { problem as p2 } from "./problems/easy/02-filter-by-department";
import { problem as p3 } from "./problems/easy/03-order-by-salary";
import { problem as p4 } from "./problems/easy/04-limit-top-three";
import { problem as p5 } from "./problems/easy/05-count-employees";
import { problem as p6 } from "./problems/easy/06-average-salary";
import { problem as p7 } from "./problems/easy/07-distinct-departments";
import { problem as p8 } from "./problems/easy/08-salary-greater-than";
import { problem as p9 } from "./problems/easy/09-null-email";
import { problem as p10 } from "./problems/easy/10-like-name-search";
import { problem as p11 } from "./problems/easy/11-between-salary";
import { problem as p12 } from "./problems/easy/12-in-departments";
import { problem as p13 } from "./problems/easy/13-sum-revenue";
import { problem as p14 } from "./problems/easy/14-min-max-price";
import { problem as p15 } from "./problems/easy/15-not-null-phone";
import { problem as p16 } from "./problems/easy/16-order-by-name-asc";
import { problem as p17 } from "./problems/easy/17-select-specific-columns";
import { problem as p18 } from "./problems/easy/18-not-equal-status";
import { problem as p19 } from "./problems/easy/19-case-grade-label";
import { problem as p20 } from "./problems/easy/20-upper-name";
import { problem as p21 } from "./problems/medium/21-inner-join-orders";
import { problem as p22 } from "./problems/medium/22-group-by-department";
import { problem as p23 } from "./problems/medium/23-having-high-count";
import { problem as p24 } from "./problems/medium/24-left-join-no-orders";
import { problem as p25 } from "./problems/medium/25-subquery-high-salary";
import { problem as p26 } from "./problems/medium/26-multi-table-join";
import { problem as p27 } from "./problems/medium/27-group-sum-revenue";
import { problem as p28 } from "./problems/medium/28-exists-enrolled";
import { problem as p29 } from "./problems/medium/29-in-subquery";
import { problem as p30 } from "./problems/medium/30-self-join-managers";
import { problem as p31 } from "./problems/medium/31-coalesce-default";
import { problem as p32 } from "./problems/medium/32-union-all-combined";
import { problem as p33 } from "./problems/medium/33-date-extract-year";
import { problem as p34 } from "./problems/medium/34-string-concat";
import { problem as p35 } from "./problems/medium/35-avg-by-category";
import { problem as p36 } from "./problems/medium/36-not-exists";
import { problem as p37 } from "./problems/medium/37-having-avg-filter";
import { problem as p38 } from "./problems/medium/38-three-way-join";
import { problem as p39 } from "./problems/medium/39-conditional-count";
import { problem as p40 } from "./problems/medium/40-rank-by-salary";
import { problem as p41 } from "./problems/hard/41-running-total";
import { problem as p42 } from "./problems/hard/42-dense-rank-scores";
import { problem as p43 } from "./problems/hard/43-cte-department-stats";
import { problem as p44 } from "./problems/hard/44-correlated-subquery";
import { problem as p45 } from "./problems/hard/45-lead-lag-orders";
import { problem as p46 } from "./problems/hard/46-recursive-not-needed-cte";
import { problem as p47 } from "./problems/hard/47-complex-join-aggregate";
import { problem as p48 } from "./problems/hard/48-nested-subquery-in";
import { problem as p49 } from "./problems/hard/49-union-intersect-pattern";
import { problem as p50 } from "./problems/hard/50-full-analytics-query";

import type { ProblemPack } from "../../../../lib/practice/types";
import { SQL50_PACK_ID } from "../../types/sql50";

export const SQL50_PROBLEMS = [
  p1,
  p2,
  p3,
  p4,
  p5,
  p6,
  p7,
  p8,
  p9,
  p10,
  p11,
  p12,
  p13,
  p14,
  p15,
  p16,
  p17,
  p18,
  p19,
  p20,
  p21,
  p22,
  p23,
  p24,
  p25,
  p26,
  p27,
  p28,
  p29,
  p30,
  p31,
  p32,
  p33,
  p34,
  p35,
  p36,
  p37,
  p38,
  p39,
  p40,
  p41,
  p42,
  p43,
  p44,
  p45,
  p46,
  p47,
  p48,
  p49,
  p50,
];

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
