# Cursor Skill: Scalability and Maintainability

## Purpose

Use this skill whenever working on this project in Cursor. The goal is to keep the codebase scalable, maintainable, readable, and easy for multiple teammates to work on.

This skill should guide all code generation, refactoring, debugging, file creation, and architectural decisions.

---

## Core Principles

### 1. Prefer Simple, Clear Solutions

- Write code that is easy to understand before optimizing for cleverness.
- Avoid unnecessary abstractions.
- Do not introduce complex patterns unless the project clearly needs them.
- Make the code readable for beginner and intermediate developers.

### 2. Keep Files Small and Focused

- Each file should have one clear responsibility.
- Avoid large files that contain unrelated logic.
- Split code into smaller modules when a file becomes difficult to understand.
- Do not create too many unnecessary files too early.

### 3. Separate Responsibilities

Keep these concerns separate whenever possible:

- UI components
- API calls
- Business logic
- Database logic
- Validation logic
- Types/interfaces
- Constants/configuration
- Utility/helper functions

A function, component, or module should have one main reason to change.

---

## Project Structure Rules

### Frontend

Use a structure similar to this when working with Next.js or React:

```txt
src/
  app/
  components/
    common/
    layout/
    features/
  features/
    feature-name/
      components/
      hooks/
      services/
      types.ts
      constants.ts
  lib/
  utils/
  styles/
```

Guidelines:

- Put reusable UI in `components/common`.
- Put feature-specific UI inside the related feature folder.
- Keep API calls in `services` or `lib/api`.
- Keep reusable logic in hooks or utility functions.
- Avoid mixing UI rendering with complex business logic.

### Backend

Use a structure similar to this when working with FastAPI, Node.js, or backend services:

```txt
backend/
  app/
    api/
      routes/
    core/
    models/
    schemas/
    services/
    db/
    utils/
```

Guidelines:

- Routes/controllers should be thin.
- Business logic should live in services.
- Database queries should be separated from route handlers.
- Request and response validation should use schemas/types.
- Avoid putting everything in one route file.

---

## Code Quality Rules

### Naming

- Use descriptive variable, function, and file names.
- Avoid vague names like `data`, `temp`, `stuff`, `thing`, or `handleClick2` unless the context is obvious.
- Name functions based on what they do.
- Name boolean variables clearly, such as `isLoading`, `hasError`, `canSubmit`, or `shouldRetry`.

### Functions

- Keep functions short and focused.
- A function should do one thing well.
- Avoid deeply nested logic.
- Use early returns to reduce complexity.
- Extract repeated logic into reusable functions.

### Components

- Keep React components focused on rendering UI.
- Move complex state logic into hooks.
- Move API logic outside components when possible.
- Avoid large components that handle too many responsibilities.
- Use props with clear names and types.

### Types

- Use TypeScript types or interfaces for important data structures.
- Avoid using `any` unless absolutely necessary.
- Define shared types in a clear location.
- Keep API request and response types explicit.

---

## Scalability Rules

### Design for Growth, But Do Not Overengineer

- Build in a way that allows new features to be added easily.
- Do not create enterprise-level architecture for a small feature.
- Add abstraction only when duplication or complexity justifies it.
- Prefer practical organization over theoretical perfection.

### Avoid Tight Coupling

- Do not make unrelated modules depend on each other directly.
- Avoid importing feature-specific logic into global/shared files.
- Keep reusable utilities independent of specific UI or database logic.

### Use Configuration Properly

- Store environment-specific values in environment variables.
- Do not hardcode secrets, API keys, URLs, or credentials.
- Keep constants in dedicated files when reused in multiple places.

---

## Maintainability Rules

### Refactoring

When refactoring:

- Preserve existing behavior unless explicitly asked to change it.
- Make small, safe changes.
- Do not rewrite large parts of the project unnecessarily.
- Explain what changed and why.
- Remove dead code only when confident it is unused.

### Error Handling

- Handle expected errors clearly.
- Show useful error messages to users.
- Log technical errors where appropriate.
- Avoid silent failures.
- Do not expose sensitive backend errors directly to users.

### Loading and Empty States

For frontend features, always consider:

- Loading state
- Error state
- Empty state
- Success state
- Disabled state when submitting forms

---

## Database and API Rules

### Database

- Use clear table and column names.
- Avoid unnecessary duplication.
- Use foreign keys where relationships matter.
- Add indexes when queries will frequently filter or join by a column.
- Keep migrations/schema changes organized.

### API

- Keep API endpoints consistent and predictable.
- Use meaningful HTTP methods:
  - `GET` for reading
  - `POST` for creating
  - `PUT/PATCH` for updating
  - `DELETE` for deleting
- Validate input before processing.
- Return consistent response shapes.
- Avoid exposing sensitive data in API responses.

Example response shape:

```ts
{
  success: true,
  data: {},
  message: "Operation completed successfully"
}
```

Example error shape:

```ts
{
  success: false,
  error: "Something went wrong"
}
```

---

## UI/UX Maintainability Rules

- Reuse common components such as buttons, cards, modals, inputs, and loaders.
- Keep styling consistent across the app.
- Avoid inline styles unless necessary.
- Use responsive design from the beginning.
- Make components accessible when possible.
- Use clear labels, helpful messages, and predictable layouts.

---

## Team Collaboration Rules

- Write code that teammates can understand quickly.
- Avoid personal coding shortcuts that make the code harder to read.
- Keep naming and structure consistent with the existing project.
- Add comments only when the reason behind the code is not obvious.
- Do not add comments that simply repeat what the code already says.

Good comment:

```ts
// Supabase returns no rows for successful DDL queries, so we show a success message manually.
```

Bad comment:

```ts
// Increment i by 1
```

---

## Cursor Behavior Instructions

When generating or modifying code, Cursor should:

1. First inspect the existing structure before creating new files.
2. Follow the current project style if one already exists.
3. Prefer small, incremental changes.
4. Avoid unnecessary rewrites.
5. Explain where each new file should be placed.
6. Mention any assumptions made.
7. Point out possible future improvements separately from required changes.
8. Keep beginner-friendly clarity in mind.

Cursor should not:

- Add unused libraries.
- Create too many abstractions too early.
- Mix frontend, backend, database, and AI logic in one place.
- Hardcode secrets or credentials.
- Delete existing logic without explaining why.
- Ignore error, loading, and empty states.

---

## Checklist Before Accepting Code

Before finalizing any generated code, check:

- Does the code solve the actual problem?
- Is the file in the right place?
- Is the naming clear?
- Is the logic easy to understand?
- Are errors handled?
- Are loading and empty states considered?
- Are types used properly?
- Is repeated logic extracted?
- Are secrets kept out of the code?
- Can another teammate understand this tomorrow?

---

## Preferred Response Style From Cursor

When giving implementation guidance, Cursor should respond like this:

1. Briefly explain the goal.
2. Show the exact files to create or edit.
3. Provide the code.
4. Explain how to test it.
5. Mention what changed.
6. Mention what can be improved later.

Keep explanations clear, structured, and practical.

---

## Final Rule

Always prioritize code that is:

- Easy to understand
- Easy to debug
- Easy to extend
- Safe to modify
- Friendly for teamwork

Do not optimize for cleverness. Optimize for long-term maintainability.
