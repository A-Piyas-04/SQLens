import type { VercelRequest, VercelResponse } from "@vercel/node";

import { handleAiRoute, sanitizeGuidanceOutput } from "./_lib/aiRoute";
import { buildSql50CoachingPrompt } from "./_lib/buildSql50CoachingPrompt";
import { generateWithGemini } from "./_lib/gemini";
import { validateCoachingRequest } from "./_lib/validateAiRequest";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await handleAiRoute(req, res, {
    route: "sql50-coaching",
    parse: validateCoachingRequest,
    measure: (ctx) => ({
      promptChars: ctx.userPrompt.length,
      schemaChars: ctx.schema?.length ?? 0,
    }),
    execute: async (ctx) => {
      const raw = await generateWithGemini(buildSql50CoachingPrompt(ctx), {
        jsonMode: true,
      });
      return { guidance: sanitizeGuidanceOutput(raw) };
    },
  });
}
