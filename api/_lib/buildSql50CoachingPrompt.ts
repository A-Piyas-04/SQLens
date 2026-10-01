import { UNTRUSTED_CONTENT_NOTICE, wrapUntrustedContent } from "./untrustedContent";

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
    ? `\nThe student's last query failed with:\n${ctx.userError.trim().slice(0, 500)}\n`
    : "";

  const topicsLine =
    ctx.topics.length > 0 ? ctx.topics.join(", ") : "general SQL";

  const untrusted = wrapUntrustedContent(`Problem: ${ctx.problemTitle}
Topics: ${topicsLine}
Description:
${ctx.problemDescription.trim().slice(0, MAX_DESC_CHARS)}
${schemaBlock}${hintsBlock}${errorBlock}
Student question:
${ctx.userPrompt.trim().slice(0, MAX_USER_PROMPT_CHARS)}`);

  return `APPLICATION INSTRUCTIONS
You are a strict PostgreSQL tutor for SQLens Practice SQL 50. The student is working on a coding problem. Your job is to COACH — never to solve.

${UNTRUSTED_CONTENT_NOTICE}

Hints already used: ${ctx.hintsUsed}
${errorBlock ? "If a failed-query error is included, help the student understand it without giving the fix as SQL.\n" : ""}
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
- techniques must have at least 1 item.

${untrusted}

Reply with the JSON object described in the application instructions.`;
}
