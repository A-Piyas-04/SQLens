import type { VercelRequest, VercelResponse } from "@vercel/node";

import { handleAiRoute, sanitizeGuidanceOutput } from "./_lib/aiRoute";
import { buildSqlGuidancePrompt } from "./_lib/buildSqlGuidancePrompt";
import { generateWithGemini } from "./_lib/gemini";
import { validateGuidanceRequest } from "./_lib/validateAiRequest";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await handleAiRoute(req, res, {
    route: "sql-guidance",
    parse: validateGuidanceRequest,
    measure: ({ prompt, schema }) => ({
      promptChars: prompt.length,
      schemaChars: schema?.length ?? 0,
    }),
    execute: async ({ prompt, schema }) => {
      const raw = await generateWithGemini(buildSqlGuidancePrompt(prompt, schema), {
        jsonMode: true,
      });
      return { guidance: sanitizeGuidanceOutput(raw) };
    },
  });
}
