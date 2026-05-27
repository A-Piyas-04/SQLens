import type { SimulatorStageType } from "../types/simulatorTypes";

type Range = { from: number; to: number };

const CLAUSE_PATTERN: Record<SimulatorStageType, RegExp | null> = {
  FROM: /\bFROM\b[\s\S]*?(?=\bJOIN\b|\bWHERE\b|\bGROUP\s+BY\b|\bHAVING\b|\bORDER\s+BY\b|\bLIMIT\b|$)/i,
  JOIN: /\bJOIN\b[\s\S]*?(?=\bJOIN\b|\bWHERE\b|\bGROUP\s+BY\b|\bHAVING\b|\bORDER\s+BY\b|\bLIMIT\b|$)/gi,
  WHERE: /\bWHERE\b[\s\S]*?(?=\bGROUP\s+BY\b|\bHAVING\b|\bORDER\s+BY\b|\bLIMIT\b|$)/i,
  GROUP_BY: /\bGROUP\s+BY\b[\s\S]*?(?=\bHAVING\b|\bORDER\s+BY\b|\bLIMIT\b|$)/i,
  HAVING: /\bHAVING\b[\s\S]*?(?=\bORDER\s+BY\b|\bLIMIT\b|$)/i,
  SELECT: /^\s*SELECT\b[\s\S]*?(?=\bFROM\b|$)/i,
  ORDER_BY: /\bORDER\s+BY\b[\s\S]*?(?=\bLIMIT\b|$)/i,
  LIMIT: /\bLIMIT\b[\s\S]*$/i,
};

export function getClauseRangeForStage(sql: string, stage: SimulatorStageType, joinIndex = 0): Range | null {
  const pattern = CLAUSE_PATTERN[stage];
  if (!pattern) return null;

  if (stage === "JOIN") {
    const matches = [...sql.matchAll(pattern)];
    const target = matches[joinIndex] ?? matches[matches.length - 1];
    if (!target || target.index === undefined) return null;
    return { from: target.index, to: target.index + target[0].length };
  }

  const match = sql.match(pattern);
  if (!match || match.index === undefined) return null;
  return { from: match.index, to: match.index + match[0].length };
}
