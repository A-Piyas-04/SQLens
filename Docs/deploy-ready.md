# SQLens Deployment Hardening Log

This document captures all production-readiness changes applied for deploying SQLens to Vercel/Netlify (frontend) with a hardened AI backend.

## 1) Security and Abuse Protection

### 1.1 Restricted CORS in production

Updated backend CORS from open (`cors()`) to an allowlist model driven by `ALLOWED_ORIGINS`.

- File: `backend/src/index.ts`
- Behavior:
  - In development (`NODE_ENV !== "production"`): allows all origins for local convenience.
  - In production: only origins listed in `ALLOWED_ORIGINS` are accepted.
  - Backend now fails fast at startup if `ALLOWED_ORIGINS` is missing in production.

### 1.2 Added API rate limiting

Added per-IP rate limiting to AI endpoints.

- New file: `backend/src/middleware/aiRateLimit.ts`
- Wired in: `backend/src/index.ts` via `app.use("/api", aiRateLimit, aiRoutes)`
- Env-configurable knobs:
  - `AI_RATE_LIMIT_WINDOW_MS` (default `60000`)
  - `AI_RATE_LIMIT_MAX` (default `15`)

### 1.3 Hardened API baseline middleware

- Added `helmet` for secure default HTTP headers.
- Reduced JSON payload size surface via `express.json({ limit: "16kb" })`.
- Enabled `trust proxy` for accurate client IP handling behind reverse proxies/CDNs.

Files:

- `backend/src/index.ts`
- `backend/package.json` (new deps: `helmet`, `express-rate-limit`)

### 1.4 Prompt size guard

AI route now rejects excessive prompt payloads.

- File: `backend/src/routes/aiRoutes.ts`
- Added `MAX_PROMPT_CHARS = 2000`
- Returns `400` when exceeded

## 2) Frontend API Safety and Deployment Defaults

### 2.1 Removed localhost fallback from runtime API base

Frontend AI client no longer silently defaults to `http://localhost:3001` in production builds.

- File: `src/lib/api/aiClient.ts`
- New behavior:
  - Uses `VITE_API_URL` when provided
  - Otherwise uses same-origin (`""`), resulting in `/api/...` requests

This prevents accidental broken production deploys where client browsers would call their own localhost.

### 2.2 Updated frontend environment template

- File: `.env.example`
- Added explicit guidance for local and production values for `VITE_API_URL`
- Default is now empty (`VITE_API_URL=`), encouraging explicit deployment config

## 3) User Data Transparency and Controls

### 3.1 Added one-click local data cleanup action

Implemented a clear data action from the UI so users can remove all browser-stored SQLens state.

- New store utility: `clearAllLocalData()` in `src/lib/projects/projectStore.ts`
- UI integration:
  - `src/components/projects/ProjectSwitcher.tsx` (new `Clear Local Data` action)
  - `src/App.tsx` (confirmation dialog + reload after purge)

Data cleared:

- Project list and active project
- Per-project draft/history keys
- Simulator preference keys

## 4) Deployment Configuration Files

### 4.1 Netlify

Added SPA-friendly Netlify config:

- New file: `netlify.toml`
  - Build command: `npm run build`
  - Publish dir: `dist`
  - Redirect all routes to `/index.html`

### 4.2 Vercel

Added Vercel config for Vite SPA routing:

- New file: `vercel.json`
  - Framework hint: `vite`
  - Rewrite all routes to `/index.html`

## 5) Backend Environment Template

Added missing backend env template with production-safe variables.

- New file: `backend/.env.example`
- Includes:
  - `GEMINI_API_KEY`
  - `GEMINI_MODEL`
  - `GEMINI_MODEL_FALLBACKS`
  - `ALLOWED_ORIGINS`
  - `AI_RATE_LIMIT_WINDOW_MS`
  - `AI_RATE_LIMIT_MAX`

## 6) README Production Documentation

Expanded deployment and operations documentation in `README.md`:

- Added AI privacy note (prompts are sent to Gemini)
- Expanded env var table (CORS + rate limit + API base behavior)
- Added dedicated "Deploying for real users" section:
  - Frontend deploy targets (Vercel/Netlify)
  - Backend deployment expectations
  - Required env vars
  - Security baseline checklist
- Added discoverability note for `Clear Local Data` UI action

## 7) What still requires deployment-time setup

These are not code changes and must be configured in your hosting dashboards:

1. Set frontend `VITE_API_URL` to your backend domain (if backend is separate).
2. Set backend `GEMINI_API_KEY`.
3. Set backend `ALLOWED_ORIGINS` to your deployed frontend URL(s).
4. Confirm backend is reachable over HTTPS.
5. Verify AI route limiter values are acceptable for your expected traffic.

## 8) Post-deploy verification checklist

1. Frontend loads and client-side routing works on deep links.
2. `/health` on backend returns `{ ok: true }`.
3. AI SQL generation works from frontend.
4. Requests from unapproved origins are blocked by CORS.
5. Rapid repeated AI calls return `429` when rate limit is exceeded.
6. `Clear Local Data` removes projects/history/drafts and reloads cleanly.

## 9) Option A implementation (Vercel serverless, no separate backend)

To remove the need for a separately deployed backend, AI generation is now served by a Vercel function in this repository.

### 9.1 New serverless AI endpoint

- Added `api/generate-sql.ts`
- Endpoint: `POST /api/generate-sql`
- Responsibilities:
  - Prompt validation (`prompt` required, max length 2000 chars)
  - In-function IP rate limiting (`AI_RATE_LIMIT_WINDOW_MS`, `AI_RATE_LIMIT_MAX`)
  - Gemini call with model fallback chain
  - SQL safety sanitization before returning response

Supporting modules added:

- `api/_lib/buildSqlPrompt.ts`
- `api/_lib/gemini.ts`
- `api/_lib/rateLimit.ts`
- `api/_lib/sanitizeSql.ts`

### 9.2 Vercel routing safety fix

- Updated `vercel.json` so `/api/*` routes are preserved and not rewritten to `index.html`.
- This prevents SPA fallback from breaking API responses.

### 9.3 Environment model after Option A

No separate backend deployment is required for production.

Set these in Vercel Project Environment Variables:

- `GEMINI_API_KEY` (required)
- `GEMINI_MODEL` (optional)
- `GEMINI_MODEL_FALLBACKS` (optional)
- `AI_RATE_LIMIT_WINDOW_MS` (optional)
- `AI_RATE_LIMIT_MAX` (optional)

`VITE_API_URL` should remain empty for same-origin serverless calls.

### 9.4 API key exposure posture

With Option A:

- `GEMINI_API_KEY` is read only in serverless function code.
- Frontend never receives or stores the key.
- Client calls only `/api/generate-sql`, not Gemini directly.
