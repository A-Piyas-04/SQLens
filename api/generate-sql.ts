import type { VercelRequest, VercelResponse } from "@vercel/node";

import { handleAiRoute } from "./_lib/aiRoute";
import { buildSqlGenerationPrompt } from "./_lib/buildSqlPrompt";
import { generateWithGemini } from "./_lib/gemini";
import { sanitizeGeneratedSql } from "./_lib/sanitizeSql";
import { validatePromptRequest } from "./_lib/validateAiRequest";

/** Legacy direct-SQL endpoint; the UI uses guidance routes, so production exposure is opt-in. */
export function isLegacyGenerateSqlEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.ENABLE_LEGACY_GENERATE_SQL === "true"
  );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!isLegacyGenerateSqlEnabled()) {
    res.status(404).setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Not found" }));
    return;
  }

  await handleAiRoute(req, res, {
    route: "generate-sql",
    parse: validatePromptRequest,
    measure: ({ prompt }) => ({ promptChars: prompt.length, schemaChars: 0 }),
    execute: async ({ prompt }) => {
      const raw = await generateWithGemini(buildSqlGenerationPrompt(prompt));
      return { sql: sanitizeGeneratedSql(raw) };
    },
  });
}
