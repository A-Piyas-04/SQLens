import cors from "cors";
import express from "express";
import helmet from "helmet";
import "dotenv/config";

import aiRoutes from "./routes/aiRoutes";
import { aiRateLimit } from "./middleware/aiRateLimit";
import { resolveModelChain } from "./services/gemini";

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

app.listen(PORT, () => {
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY?.trim());
  console.log(`SQLens backend running on port ${PORT}`);
  if (!hasGeminiKey) {
    console.warn(
      "[sqlens] GEMINI_API_KEY is missing — SQL Assistant requests will fail until backend/.env is configured."
    );
  } else {
    console.info(`[sqlens] Gemini model chain: ${resolveModelChain().join(" → ")}`);
  }
});
