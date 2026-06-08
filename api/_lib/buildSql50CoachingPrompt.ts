const MAX_DESC_CHARS = 1_000;
const MAX_SCHEMA_CHARS = 4_000;
const MAX_USER_PROMPT_CHARS = 1_000;

export type Sql50CoachingContext = {
  problemTitle: string;
  problemDescription: string;
  topics: string[];
  userPrompt: string;
  userError?: string;
  hintsUsed: number;
  unlockedHints: string[];
  schema?: string;
};

export function buildSql50CoachingPrompt(ctx: Sql50CoachingContext): string {
  const schemaBlock =
    ctx.schema && ctx.schema.trim()
      ? `\nActive database schema (use only these tables/columns):\n${ctx.schema.trim().slice(0, MAX_SCHEMA_CHARS)}\n`
      : "\nNo schema was provided.\n";

  const hintsBlock =
    ctx.unlockedHints.length > 0
      ? `\nHints the student has already seen (do not repeat verbatim):\n${ctx.unlockedHints.map((h, i) => `${i + 1}. ${h}`).join("\n")}\n`
      : "";

  const errorBlock = ctx.userError?.trim()
    ? `\nThe student's last query failed with:\n${ctx.userError.trim().slice(0, 500)}\nHelp them understand the error without giving the fix as SQL.\n`
    : "";

  const topicsLine =
    ctx.topics.length > 0 ? ctx.topics.join(", ") : "general SQL";

  return `You are a strict PostgreSQL tutor for SQLens Practice SQL 50. The student is working on a coding problem. Your job is to COACH — never to solve.

Problem: ${ctx.problemTitle}
Topics: ${topicsLine}
Description:
${ctx.problemDescription.trim().slice(0, MAX_DESC_CHARS)}
${schemaBlock}${hintsBlock}${errorBlock}
Student question:
${ctx.userPrompt.trim().slice(0, MAX_USER_PROMPT_CHARS)}

Hints already used: ${ctx.hintsUsed}

Respond with ONLY a single JSON object matching this shape:
{
  "summary": "one short coaching paragraph",
  "problemBreakdown": ["guiding step in plain English", ...],
  "techniques": [{ "name": "clause or concept", "whenToUse": "why it might help", "notes": "optional" }],
  "tablesAndColumns": ["which tables/columns to think about"],
  "pitfalls": ["common mistakes for this problem type"]
}

STRICT RULES — violations cause rejection:
- NEVER output runnable or near-complete SQL: no SELECT, INSERT, UPDATE, DELETE, WITH, CREATE, or statement examples.
- NEVER reconstruct the full query or list columns in SELECT order as a template.
- NEVER reveal the official answer or expected output rows.
- You MAY name one SQL clause type per technique (e.g. "consider a JOIN").
- You MAY ask guiding questions ("What table holds customer names?").
- Ask the student to think; do not hand them the solution.
- problemBreakdown, tablesAndColumns, and pitfalls must each have at least 1 item.
- techniques must have at least 1 item.`;
}
