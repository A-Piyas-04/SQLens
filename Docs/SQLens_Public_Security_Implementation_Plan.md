# SQLens Public Security Implementation Plan

> **Goal:** make SQLens safe to publish without breaking or removing existing logic, user flows, UI, simulator behavior, ERD behavior, SQL execution, SQL50 practice, or AI tutor features.

---

## 0. Non-breaking rules

These rules apply to every security change in this plan.

### Must remain unchanged

- Main SQL editor behavior
- `Ctrl+Enter` / selected-query execution
- PGlite browser-side PostgreSQL execution
- Project switching
- Project-specific IndexedDB databases
- Query history behavior
- Schema sidebar
- ERD generation and export
- SQL execution simulator
- SQL50 practice flow
- SQL50 grading logic
- AI SQL guidance UI
- AI coaching UI
- Existing page routes
- Existing visual design unless a small security notice/error message is required

### Security changes should be additive

Prefer:

```text
existing flow
    ↓
validation / rate limit / safe guard
    ↓
existing logic
```

instead of rewriting existing features.

### Do not

- Replace PGlite with a remote database.
- Require login just to use SQLens.
- Block normal SQL such as `DROP TABLE`, `ALTER TABLE`, or `DELETE` inside the user's own PGlite database.
- Remove simulator functionality for normal queries.
- Remove ERD functionality for normal schemas.
- Remove AI functionality for normal users.
- Redesign the existing interface.
- Change existing API response shapes unless backward compatibility is preserved.

---

# 1. Priority overview

## P0 — Required before public release

1. Protect Gemini API usage.
2. Replace serverless in-memory rate limiting.
3. Add a global AI usage ceiling.
4. Remove production debug leakage.
5. Normalize safe server error responses.
6. Cap AI request sizes consistently.
7. Keep `GEMINI_API_KEY` server-only.
8. Add baseline security headers.

## P1 — Strongly recommended before launch

9. Protect result rendering from huge result sets.
10. Protect simulator execution from oversized workloads.
11. Handle `localStorage` quota failures.
12. Properly delete IndexedDB databases.
13. Add AI privacy disclosure.
14. Explicitly control schema sharing.

## P2 — Soon after launch

15. Add stronger observability.
16. Add CSP reporting/enforcement.
17. Add abuse analytics.
18. Add automated security regression tests.

---

# 2. Protect the shared Gemini API

## Problem

The AI endpoints use the application's shared Gemini credential.

Current AI routes include:

```text
POST /api/sql-guidance
POST /api/sql50-coaching
POST /api/generate-sql
```

The key itself is already server-side, which is correct.

The actual risk is:

```text
public endpoint
    ↓
attacker/bot
    ↓
your Gemini quota / billing
```

## Implementation

Add protection *before* the existing Gemini call.

Recommended flow:

```text
Frontend
   ↓
existing API request
   ↓
request validation
   ↓
shared rate limiter
   ↓
global daily quota check
   ↓
existing prompt builder
   ↓
existing Gemini logic
   ↓
existing sanitizer
   ↓
existing frontend response
```

### Important

Do **not** modify the frontend feature behavior.

The frontend should still call:

```text
/api/sql-guidance
/api/sql50-coaching
```

exactly as it does now.

Only the server-side protection layer changes.

---

# 3. Replace Vercel in-memory rate limiting

## Current risk

A module-level `Map` is not a reliable public limiter in serverless deployment because:

- multiple function instances do not share memory,
- cold starts reset counters,
- per-instance limits are not global.

## Required change

Replace the serverless limiter implementation with shared storage.

Recommended options:

- Upstash Redis
- Redis-compatible Vercel storage
- another managed Redis instance

### Suggested shared key

```text
sqlens:ai:rate:{clientIdentifier}:{timeWindow}
```

### Client identifier

Use trusted deployment/platform request information.

Do not blindly trust a user-supplied forwarding header.

If reliable client IP extraction is difficult, generate a short-lived anonymous server session identifier and combine it with other signals.

---

# 4. Use layered AI limits

Use more than one limit.

## Layer A — burst protection

Example:

```text
3 AI calls / 10 seconds
```

Stops accidental rapid-clicking and basic scripts.

## Layer B — normal per-client limit

Example initial value:

```text
10 AI calls / minute
```

## Layer C — global daily ceiling

Example:

```text
5,000 AI calls / day
```

The exact values should remain configurable.

### Environment variables

```env
AI_RATE_LIMIT_MAX=10
AI_RATE_LIMIT_WINDOW_MS=60000

AI_BURST_LIMIT_MAX=3
AI_BURST_LIMIT_WINDOW_MS=10000

AI_DAILY_REQUEST_LIMIT=5000
```

Do not hard-code production values.

---

# 5. Add a global Gemini usage ceiling

Per-user/IP limiting does not protect against many distributed clients.

Before the Gemini call:

```text
read today's global usage
        ↓
if daily limit reached
        ↓
return 429/503-style safe response
        ↓
otherwise increment and continue
```

Suggested Redis key:

```text
sqlens:gemini:daily:2026-10-01
```

Set automatic expiry slightly longer than one day.

### Safe user-facing response

```json
{
  "error": "AI usage limit reached for today. Please try again later."
}
```

Do not break the rest of SQLens.

Only AI becomes temporarily unavailable.

The editor, simulator, ERD, projects, SQL50, etc. must continue working normally.

---

# 6. Provider-side Gemini protection

Create a dedicated production credential for SQLens.

Use:

```text
SQLens Development Gemini Key
SQLens Production Gemini Key
```

Configure, where available:

- API quotas
- billing alerts
- spending alerts
- project-level restrictions

Do not share one Gemini key between unrelated applications.

If an existing key has ever been exposed publicly, rotate it before launch.

---

# 7. Keep Gemini credentials out of URLs

If the Vercel Gemini implementation constructs requests with the API key in a query string, replace that path.

Preferred:

```text
official server SDK
```

or another supported server-side authorization method.

The goal is:

```text
GEMINI_API_KEY
```

must never appear in:

- frontend JavaScript,
- browser network-visible application code,
- application URLs,
- debug output,
- logs you do not explicitly control.

---

# 8. Decide what to do with `/api/generate-sql`

The current product UI primarily uses tutor-style guidance.

## Preferred production option

If `/api/generate-sql` is genuinely unused:

```text
remove production exposure
```

This reduces an unnecessary AI abuse surface.

## Non-breaking alternative

If you want to preserve it for development/future features:

```ts
if (
  process.env.NODE_ENV === "production" &&
  process.env.ENABLE_LEGACY_GENERATE_SQL !== "true"
) {
  return res.status(404).end();
}
```

Then:

```env
ENABLE_LEGACY_GENERATE_SQL=false
```

This does not change the current UI because the current UI does not depend on the route.

---

# 9. Centralize AI request validation

Create one validation layer shared conceptually by:

```text
/api/sql-guidance
/api/sql50-coaching
```

Suggested modules:

```text
api/_lib/validateAiRequest.ts

backend/src/utils/validateAiRequest.ts
```

If practical later, move common validation into a shared module.

Do not refactor the complete API architecture just for this.

---

# 10. Add consistent AI field limits

Use defensive maximums before prompt construction.

Suggested limits:

| Field | Maximum |
|---|---:|
| `prompt` | 2,000 chars |
| `userPrompt` | 2,000 chars |
| `schema` | 4,000 chars |
| `problemTitle` | 200 chars |
| `problemDescription` | 1,000 chars |
| `lastError` | 500 chars |
| number of topics | 20 |
| each topic | 80 chars |
| number of hints | 10 |
| each hint | 500 chars |

Reject invalid requests with HTTP `400`.

Do not merely accept huge data and truncate it after parsing.

---

# 11. Keep API response contracts stable

Existing frontend code expects current response shapes.

Preserve:

```json
{
  "guidance": {}
}
```

for successful guidance responses.

Preserve:

```json
{
  "error": "..."
}
```

for errors.

Do not introduce a completely new envelope like:

```json
{
  "data": {
    "result": ...
  }
}
```

unless the frontend is updated simultaneously.

For this security pass, avoid changing response contracts.

---

# 12. Enforce a small request-body budget

The Express backend already uses a small JSON body limit.

Apply equivalent protection to serverless handlers.

Target:

```text
16–32 KB
```

for AI request bodies.

This is large enough for normal SQLens guidance requests and small enough to prevent abusive payloads.

### Required behavior

Normal requests:

```text
unchanged
```

Oversized requests:

```text
HTTP 413 or 400
```

with a small user-safe message.

---

# 13. Limit Gemini output length

The tutor does not need extremely long answers.

Configure a reasonable Gemini output token limit.

Suggested starting range:

```text
500–1000 output tokens
```

Benefits:

- lower cost,
- lower latency,
- reduced abuse,
- less UI overflow.

This should not change normal tutor behavior.

Test existing AI guidance examples before launch.

---

# 14. Prompt-injection handling

Prompt injection is mainly a tutor-behavior problem here, not a server takeover risk.

Keep the existing output sanitizer.

Also structure prompts clearly:

```text
APPLICATION INSTRUCTIONS
...
==============================

UNTRUSTED USER CONTENT
...
==============================
```

Treat these as untrusted:

- userPrompt
- prompt
- schema
- errors
- problem text
- hints

Do not treat sanitizer regexes as a true security boundary.

---

# 15. Do not apply destructive-SQL restrictions to the main editor

SQLens is a SQL playground.

The user's PGlite database is their own local sandbox.

Therefore this should remain allowed:

```sql
DROP TABLE users;
DELETE FROM orders;
ALTER TABLE products ADD COLUMN ...
```

Blocking these in the editor would break the product.

Security checks for generated model output should remain separate from normal editor execution.

---

# 16. Protect result rendering

## Current risk

A query can legitimately return a very large number of rows.

Rendering all of them into the DOM can freeze the browser.

## First implementation

Keep query execution unchanged.

Only limit rendering.

Example:

```text
query returns 25,000 rows

ResultTable renders first 1,000
```

Display:

```text
Showing first 1,000 rows for browser performance.
```

This protects the UI without changing SQL execution.

---

# 17. Add result virtualization later

For a better UX, use virtualization for larger result sets.

Possible implementation:

```text
<= 200 rows
    normal ResultTable

> 200 rows
    virtualized rows
```

Possible library:

```text
@tanstack/react-virtual
```

Do this only if the change can preserve the current visual table behavior.

The first release can safely use a simple render cap before introducing virtualization.

---

# 18. Query execution safeguards

PGlite executes locally, so one user's query cannot attack another user's database.

However, a pathological query can freeze that user's browser tab.

Add a soft execution guard.

Potential protections:

- query timeout where PGlite supports it,
- cancellation,
- watchdog state,
- worker isolation where practical.

Suggested initial target:

```text
10–15 seconds
```

### Do not

Add simplistic SQL keyword blocking to solve this.

That would break valid SQL learning scenarios.

---

# 19. Simulator workload protection

The simulator may execute several derived stage queries.

Therefore heavy input can cost much more than one normal query.

Add pre-simulation limits.

Example:

```text
maximum SQL text for automatic simulation: 50 KB
maximum rows stored per snapshot: 1,000
maximum rows rendered per stage: 500–1,000
```

If exceeded:

```text
This query is too large to simulate safely.
You can still run it normally.
```

This preserves the main SQL execution feature.

---

# 20. Keep normal simulator flow unchanged

For normal queries:

```text
Simulate Query
    ↓
parse
    ↓
build pipeline
    ↓
generate snapshots
    ↓
diff
    ↓
existing simulator UI
```

No UI redesign is required.

Security checks happen immediately before expensive execution.

---

# 21. ERD complexity protection

Large schemas can make Dagre + React Flow expensive.

Do not remove ERD.

Use graceful degradation.

Suggested initial behavior:

```text
0–75 tables
    existing full ERD behavior

76–150 tables
    existing ERD but reduce expensive optional effects if required

>150 tables
    show warning before expensive full layout
```

Example message:

```text
Large schema detected (173 tables).
Rendering the full ERD may be slow.

[Render ERD]
```

This protects automatic page load while still allowing the feature.

Test the threshold on actual hardware before finalizing it.

---

# 22. Handle `localStorage` failures safely

Every important storage write should be wrapped.

Example helper:

```ts
export function safeSetLocalStorage(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}
```

Use it for:

- editor drafts,
- project metadata,
- query history,
- SQL50 progress,
- onboarding state,
- simulator preferences.

If storage is full, show a non-blocking message.

The app should continue running.

---

# 23. Keep autosave, but cap pathological drafts

Do not remove editor autosave.

Add a generous upper bound.

Suggested starting values:

```text
draft autosave: 500 KB / project
query history item: 100 KB
history count: existing 10 items
```

If a draft exceeds the limit:

```text
The query can still run.
Only automatic draft persistence is skipped.
```

Example UI notice:

```text
This script is too large to auto-save, but you can still run it.
```

---

# 24. Properly delete project IndexedDB data

Current deletion should remove both metadata and real local database storage.

Target lifecycle:

```text
delete project
    ↓
close PGlite instance
    ↓
remove instance from internal registry
    ↓
delete corresponding IndexedDB database
    ↓
remove draft/history
    ↓
remove project metadata
    ↓
refresh active project state
```

Important:

Do not change what the user sees during normal project switching.

Only the deletion path changes.

---

# 25. Fix "Clear Local Data"

The action should remove all SQLens local data.

Delete:

- project metadata,
- active project id,
- editor drafts,
- query history,
- SQL50 progress,
- SQL50 drafts,
- onboarding state,
- simulator preferences,
- layout preferences,
- every SQLens PGlite IndexedDB database,
- legacy SQLens database storage.

Then reload into the same normal fresh-start state the app already uses.

---

# 26. AI privacy notice

The application already sends AI prompts and schema summaries outside the browser when AI is used.

Add a small notice at the point of use.

## Recommended UX

Before the first AI request:

```text
AI requests are processed by Google Gemini.

Your prompt and, when enabled, a summary of your schema may be sent to Google.

Do not include passwords, credentials, production secrets, or sensitive personal data.

[Continue] [Cancel]
```

Persist:

```text
sqlens-ai-privacy-ack=true
```

locally.

This should appear once, not on every request.

---

# 27. Make schema sharing visible

Current AI usefulness benefits from schema context.

Preserve that feature.

Preferred UI addition:

```text
[x] Include current schema
```

Small helper text:

```text
Table and column information will be included in the AI request.
```

## Best privacy default

For the strongest privacy posture:

```text
unchecked initially
```

The user can enable it for schema-aware guidance.

## Feature-preserving alternative

If you strongly prefer current behavior:

```text
checked by default
```

but clearly show the disclosure.

Either approach preserves the feature.

---

# 28. Never automatically attach real table rows to AI

Keep current behavior:

```text
schema metadata
```

may be attached.

Do not later silently add:

```text
SELECT results
sample rows
database contents
```

to Gemini requests.

If such a feature is ever added, require explicit user action.

---

# 29. Remove debug network code

Delete the leftover debug fetch in:

```text
api/generate-sql.ts
```

Production code should not send stack traces, prompt metadata, or exception details to an improvised endpoint.

If observability is needed later, use a deliberate logging provider with redaction.

---

# 30. Never return raw unexpected server exceptions

Do not expose:

```ts
error.message
error.stack
```

for unknown failures.

Use safe API responses:

```text
400 — Invalid request.
429 — Too many AI requests. Please try again shortly.
503 — AI service is temporarily unavailable.
500 — AI request failed.
```

Keep detailed information only in server-side logs.

---

# 31. Safe logging rules

Production logs may include:

```text
request ID
route
status code
duration
prompt length
schema length
rate-limit decision
Gemini model name
provider error category
```

Do not log:

```text
GEMINI_API_KEY
full prompts
full schemas
user SQL
local database data
auth/session secrets
```

---

# 32. Add frontend security headers

Because the frontend stores useful data in `localStorage` and IndexedDB, future XSS bugs should have additional containment.

Add a Content Security Policy.

Suggested starting point:

```text
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data: blob:;
connect-src 'self' https://generativelanguage.googleapis.com;
worker-src 'self' blob:;
object-src 'none';
base-uri 'self';
frame-ancestors 'none';
```

## Important compatibility requirement

Before enforcing CSP, test:

- PGlite WASM loading,
- PGlite workers,
- CodeMirror,
- React Flow,
- ERD PNG export,
- ERD SVG export,
- ERD PDF export,
- Google Fonts,
- serverless AI routes.

If uncertain, first deploy:

```text
Content-Security-Policy-Report-Only
```

then enforce after confirming there are no legitimate violations.

---

# 33. Add standard headers

Recommended:

```text
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

Also prevent framing using CSP:

```text
frame-ancestors 'none'
```

Production should use HTTPS only.

---

# 34. Keep existing React output behavior

Current React rendering of result values as text is good.

Keep avoiding:

```text
dangerouslySetInnerHTML
```

for:

- query results,
- AI output,
- errors,
- schema names,
- project names.

If rich text is introduced later, sanitize it with a well-maintained sanitizer.

---

# 35. Production environment checklist

Example:

```env
NODE_ENV=production

GEMINI_API_KEY=...

GEMINI_MODEL=...

AI_RATE_LIMIT_MAX=10
AI_RATE_LIMIT_WINDOW_MS=60000

AI_BURST_LIMIT_MAX=3
AI_BURST_LIMIT_WINDOW_MS=10000

AI_DAILY_REQUEST_LIMIT=5000

ALLOWED_ORIGINS=https://your-domain.example
```

Never use:

```env
VITE_GEMINI_API_KEY=...
```

Any `VITE_*` value should be considered public client configuration.

---

# 36. Development deployment safety

Development CORS is intentionally permissive.

Therefore do not expose the development Express backend directly to the public internet.

Safe:

```text
localhost
private development environment
authenticated preview environment
```

Not safe:

```text
public IP + NODE_ENV=development
```

---

# 37. Security regression tests

Add tests without modifying existing feature tests.

## API tests

Test:

```text
oversized prompt → rejected
oversized schema → rejected
too many topics → rejected
too many hints → rejected
rate limit → returns expected status
global limit → blocks Gemini call
unexpected exception → generic error message
```

## Storage tests

Test:

```text
localStorage quota failure does not crash app
delete project removes local metadata
clear local data removes known keys
```

## UI behavior tests

Test that security changes do **not** change:

```text
run query
run selection
switch project
SQL50 run
SQL50 submit
simulate query
open ERD
AI guidance normal request
```

---

# 38. Non-breaking acceptance test matrix

Before deploying, manually verify all of these.

| Feature | Expected after hardening |
|---|---|
| Main editor | unchanged |
| Run Query | unchanged |
| Run Selection | unchanged |
| Multi-statement SQL | unchanged |
| DDL / DML | unchanged |
| Project create | unchanged |
| Project rename | unchanged |
| Project switch | unchanged |
| Project delete | same UI, better cleanup |
| Query history | unchanged |
| Draft autosave | unchanged for normal files |
| Import SQL | unchanged |
| Schema sidebar | unchanged |
| ERD | unchanged for normal schemas |
| ERD export PNG | unchanged |
| ERD export SVG | unchanged |
| ERD export PDF | unchanged |
| Designed Text export | unchanged |
| Simulator | unchanged for normal queries |
| Playback | unchanged |
| SQL50 | unchanged |
| SQL50 grading | unchanged |
| SQL50 AI coach | unchanged for normal use |
| AI SQL guidance | unchanged for normal use |
| Browser refresh persistence | unchanged |
| Clear Local Data | same intent, now actually complete |

---

# 39. Suggested implementation order

Implement in this exact sequence to minimize regression risk.

## Step 1 — Pure server-side changes

Implement:

```text
shared rate limiter
global daily AI quota
safe error responses
remove debug fetch
Gemini output limit
request validation
request body limits
```

Why first?

These changes have almost no impact on the existing UI.

---

## Step 2 — Production deployment configuration

Implement:

```text
production Gemini key
quota/billing alerts
production environment variables
production CORS
security headers
```

Again, no application flow should change.

---

## Step 3 — Browser reliability protections

Implement:

```text
safe localStorage writes
draft/history size checks
proper IndexedDB cleanup
```

Keep UI behavior the same except for useful failure messages.

---

## Step 4 — Resource safeguards

Implement:

```text
result rendering cap
simulator row/snapshot cap
large ERD warning
query timeout/cancellation if reliable
```

Apply only to pathological cases.

Normal usage should be visually and functionally identical.

---

## Step 5 — Privacy UX

Add:

```text
one-time AI privacy notice
schema-sharing indicator / checkbox
```

Do not redesign the AI popover.

Fit these controls into the existing component.

---

## Step 6 — CSP enforcement

First:

```text
Report-Only
```

Test all existing features.

Then:

```text
enforced CSP
```

Do this last because CSP is the security change most likely to accidentally interfere with WASM, workers, export libraries, or font loading.

---

# 40. Files likely to change

Based on the current SQLens structure, security work should remain localized.

## Vercel API

```text
api/sql-guidance.ts
api/sql50-coaching.ts
api/generate-sql.ts
api/_lib/gemini.ts
api/_lib/rateLimit.ts
```

Possible additions:

```text
api/_lib/validateAiRequest.ts
api/_lib/globalAiQuota.ts
api/_lib/safeApiError.ts
```

## Express backend

```text
backend/src/index.ts
backend/src/routes/aiRoutes.ts
backend/src/middleware/aiRateLimit.ts
backend/src/services/gemini.ts
```

Possible additions:

```text
backend/src/utils/validateAiRequest.ts
backend/src/utils/safeApiError.ts
```

## Browser storage

```text
src/lib/projects/projectStore.ts
src/lib/db/createDatabase.ts
src/hooks/useQueryHistory.ts
src/hooks/useSqlWorkspace.ts
```

Possible addition:

```text
src/lib/storage/safeStorage.ts
```

## Result protection

```text
src/components/results/ResultTable.tsx
```

## Simulator protection

```text
src/lib/simulator/snapshot/generateSnapshots.ts
src/components/simulator/SimulatorPanel.tsx
src/components/simulator/playback/PlaybackTable.tsx
```

## ERD protection

```text
src/lib/erd/layoutErdGraph.ts
src/components/erd/ErdViewer.tsx
```

## AI privacy UI

```text
src/components/ai/AiSqlGeneratorPopover.tsx
src/features/sql50/components/AiCoachPanel.tsx
src/lib/api/aiClient.ts
```

Do not perform unrelated refactors in these files during the security pass.

---

# 41. Things that are NOT required before public release

Given the current browser-first architecture, you do **not** need to add all of these before launch:

```text
full account system
OAuth
RBAC
remote PostgreSQL
encrypted server-side SQL projects
multi-tenant database isolation
JWT-based project authorization
cloud project sync
```

Those become relevant if SQLens later adds:

```text
accounts
cloud saved projects
sharing
classrooms
multiplayer
server-side user databases
```

Do not introduce that complexity solely for the current public MVP.

---

# 42. Final public-launch security gate

Before making SQLens public, all of these should be true.

## API

- [ ] Gemini key is server-only.
- [ ] Production and development keys are separate.
- [ ] Shared serverless rate limiting is active.
- [ ] Global AI daily limit is active.
- [ ] Oversized AI requests are rejected.
- [ ] Gemini output length is bounded.
- [ ] Raw unexpected server errors are hidden.
- [ ] Debug network call is removed.
- [ ] Legacy generate endpoint is disabled if unused.

## Browser

- [ ] Large results cannot freeze the page purely from DOM rendering.
- [ ] Simulator has reasonable workload limits.
- [ ] `localStorage` failures are handled.
- [ ] Deleted projects remove their IndexedDB data.
- [ ] Clear Local Data really clears SQLens data.

## Privacy

- [ ] AI usage clearly states that content is sent to Gemini.
- [ ] Schema sharing is visible to the user.
- [ ] Table rows are not automatically sent to Gemini.
- [ ] Sensitive AI payloads are not logged.

## Deployment

- [ ] Production runs with `NODE_ENV=production`.
- [ ] Production CORS origin is configured.
- [ ] Security headers are configured.
- [ ] CSP has been compatibility-tested.
- [ ] HTTPS is used.
- [ ] Gemini billing/quota alerting is configured.

## Regression

- [ ] Existing unit tests pass.
- [ ] Production build passes.
- [ ] Main SQL flow manually tested.
- [ ] Simulator manually tested.
- [ ] ERD + exports manually tested.
- [ ] SQL50 manually tested.
- [ ] AI guidance manually tested.
- [ ] AI coaching manually tested.

---

# 43. Definition of done

SQLens is ready for a public MVP when:

```text
normal users experience the same product
+
AI abuse cannot freely drain the shared Gemini budget
+
unexpected server errors do not leak internals
+
large workloads fail gracefully instead of crashing the UI
+
local browser data can actually be removed
+
users know when information is sent to Gemini
+
security headers are active without breaking WASM/UI behavior
```

The goal is **hardening**, not restriction.

The existing product architecture should remain:

```text
React UI
   +
PGlite in-browser PostgreSQL
   +
IndexedDB/localStorage
   +
optional server-side Gemini tutor
```

with security controls added around the risky boundaries.
