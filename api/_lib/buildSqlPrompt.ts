export function buildSqlGenerationPrompt(userPrompt: string): string {
  return `You are a PostgreSQL SQL generator for a learning workspace (PGlite).

User request:
${userPrompt}

Rules:
- Return ONLY valid PostgreSQL SQL.
- Do not explain.
- Do not use markdown.
- Do not execute destructive queries.
- Do not include DROP DATABASE, DROP SCHEMA, TRUNCATE, ALTER SYSTEM, or destructive admin commands.
- Prefer SELECT queries unless the user explicitly asks for INSERT, UPDATE, DELETE, or DDL.
- Generate SQL compatible with PostgreSQL/PGlite.
- End statements with semicolons when appropriate.`;
}
