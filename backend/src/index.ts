import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";
import "dotenv/config";

import aiRoutes from "./routes/aiRoutes";
import { aiRateLimit } from "./middleware/aiRateLimit";
import { isPlaceholderGeminiKey, resolveModelChain } from "./services/gemini";

const app = express();
const PORT = Number(process.env.PORT) || 3001;

function parseAllowedOrigins(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const isProduction = process.env.NODE_ENV === "production";
const allowedOrigins = parseAllowedOrigins(process.env.ALLOWED_ORIGINS);

if (isProduction && allowedOrigins.length === 0) {
  throw new Error(
    "Missing ALLOWED_ORIGINS in production. Set a comma-separated list of allowed frontend origins."
  );
}

app.use(
  cors({
    origin(origin, callback) {
      // Allow tools like curl/postman and same-origin requests without Origin header.
      if (!origin) {
        callback(null, true);
        return;
      }

      if (!isProduction) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
  })
);

app.use(helmet());
app.use(express.json({ limit: "16kb" }));
app.set("trust proxy", 1);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api", aiRateLimit, aiRoutes);

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const type =
    error && typeof error === "object" && "type" in error
      ? String((error as { type: unknown }).type)
      : "";

  if (type === "entity.too.large") {
    res.status(413).json({ error: "Request is too large." });
    return;
  }

  if (type === "entity.parse.failed") {
    res.status(400).json({ error: "Invalid request." });
    return;
  }

  if (error instanceof Error && error.message === "Not allowed by CORS") {
    res.status(403).json({ error: "Origin not allowed." });
    return;
  }

  console.error(
    "[sqlens] unhandled error:",
    error instanceof Error ? `${error.name}: ${error.message.slice(0, 200)}` : "non-error thrown"
  );
  res.status(500).json({ error: "Internal server error." });
});

app.listen(PORT, () => {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  console.log(`SQLens backend running on port ${PORT}`);
  if (!isProduction) {
    console.warn(
      "[sqlens] Development mode allows any CORS origin — keep this backend on localhost or a private network."
    );
  }
  if (!apiKey) {
    console.warn(
      "[sqlens] GEMINI_API_KEY is missing — SQL Assistant requests will fail until backend/.env is configured."
    );
  } else if (isPlaceholderGeminiKey(apiKey)) {
    console.warn(
      "[sqlens] GEMINI_API_KEY is still the .env.example placeholder — get a free key at https://aistudio.google.com/apikey and restart this backend."
    );
  } else {
    console.info(`[sqlens] Gemini model chain: ${resolveModelChain().join(" → ")}`);
  }
});
