import { describe, expect, it } from "vitest";

import {
  AI_FIELD_LIMITS,
  AI_MAX_BODY_BYTES,
  AiRequestValidationError,
  assertBodyWithinBudget,
  validateCoachingRequest,
  validateGuidanceRequest,
  validatePromptRequest,
} from "../validateAiRequest";

const validCoaching = {
  problemTitle: "Recyclable and Low Fat Products",
  problemDescription: "Find the ids of products that are both low fat and recyclable.",
  topics: ["select", "where"],
  userPrompt: "Which column should I filter on?",
  hintsUsed: 1,
  unlockedHints: ["Look at the products table."],
};

function expectRejected(fn: () => unknown, status = 400) {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(AiRequestValidationError);
    expect((error as AiRequestValidationError).status).toBe(status);
    return;
  }
  throw new Error("expected validation to fail");
}

describe("validateGuidanceRequest", () => {
  it("accepts a normal guidance request", () => {
    expect(
      validateGuidanceRequest({ prompt: "  list students  ", schema: "- students: id" })
    ).toEqual({ prompt: "list students", schema: "- students: id" });
  });

  it("rejects an empty prompt", () => {
    expectRejected(() => validateGuidanceRequest({ prompt: "   " }));
  });

  it("rejects an oversized prompt", () => {
    expectRejected(() =>
      validateGuidanceRequest({ prompt: "a".repeat(AI_FIELD_LIMITS.prompt + 1) })
    );
  });

  it("rejects an oversized schema instead of truncating it", () => {
    expectRejected(() =>
      validateGuidanceRequest({
        prompt: "ok",
        schema: "s".repeat(AI_FIELD_LIMITS.schema + 1),
      })
    );
  });

  it("rejects a non-string schema", () => {
    expectRejected(() => validateGuidanceRequest({ prompt: "ok", schema: 42 }));
  });
});

describe("validateCoachingRequest", () => {
  it("accepts a normal coaching request", () => {
    const ctx = validateCoachingRequest(validCoaching);
    expect(ctx.problemTitle).toBe(validCoaching.problemTitle);
    expect(ctx.topics).toEqual(["select", "where"]);
    expect(ctx.hintsUsed).toBe(1);
  });

  it("rejects too many topics", () => {
    expectRejected(() =>
      validateCoachingRequest({
        ...validCoaching,
        topics: Array.from({ length: AI_FIELD_LIMITS.topicCount + 1 }, (_, i) => `t${i}`),
      })
    );
  });

  it("rejects an oversized topic", () => {
    expectRejected(() =>
      validateCoachingRequest({
        ...validCoaching,
        topics: ["x".repeat(AI_FIELD_LIMITS.topicChars + 1)],
      })
    );
  });

  it("rejects too many hints", () => {
    expectRejected(() =>
      validateCoachingRequest({
        ...validCoaching,
        unlockedHints: Array.from({ length: AI_FIELD_LIMITS.hintCount + 1 }, () => "hint"),
      })
    );
  });

  it("rejects an oversized hint", () => {
    expectRejected(() =>
      validateCoachingRequest({
        ...validCoaching,
        unlockedHints: ["h".repeat(AI_FIELD_LIMITS.hintChars + 1)],
      })
    );
  });

  it("rejects an oversized problem description and last error", () => {
    expectRejected(() =>
      validateCoachingRequest({
        ...validCoaching,
        problemDescription: "d".repeat(AI_FIELD_LIMITS.problemDescription + 1),
      })
    );
    expectRejected(() =>
      validateCoachingRequest({
        ...validCoaching,
        userError: "e".repeat(AI_FIELD_LIMITS.lastError + 1),
      })
    );
  });

  it("rejects a missing required field", () => {
    expectRejected(() => validateCoachingRequest({ ...validCoaching, userPrompt: "" }));
  });
});

describe("validatePromptRequest", () => {
  it("rejects non-object bodies", () => {
    expectRejected(() => validatePromptRequest("not json"));
    expectRejected(() => validatePromptRequest(null));
  });
});

describe("assertBodyWithinBudget", () => {
  it("allows normal bodies", () => {
    expect(() => assertBodyWithinBudget({ body: { prompt: "hello" } })).not.toThrow();
  });

  it("rejects a declared content-length over budget with 413", () => {
    expectRejected(
      () =>
        assertBodyWithinBudget({
          headers: { "content-length": String(AI_MAX_BODY_BYTES + 1) },
          body: {},
        }),
      413
    );
  });

  it("rejects a parsed body over budget with 413", () => {
    expectRejected(
      () => assertBodyWithinBudget({ body: { prompt: "x".repeat(AI_MAX_BODY_BYTES) } }),
      413
    );
  });
});
