// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AI_INCLUDE_SCHEMA_KEY, AI_PRIVACY_ACK_KEY } from "../../lib/api/aiPrivacy";
import { useAiPrivacy } from "../useAiPrivacy";

describe("useAiPrivacy", () => {
  beforeEach(() => localStorage.clear());

  it("holds the first request until the user continues, then remembers consent", () => {
    const request = vi.fn();
    const { result } = renderHook(() => useAiPrivacy());

    act(() => result.current.runWithConsent(request));
    expect(request).not.toHaveBeenCalled();
    expect(result.current.isConsentPending).toBe(true);

    act(() => result.current.continueWithConsent());
    expect(request).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(AI_PRIVACY_ACK_KEY)).toBe("true");

    act(() => result.current.runWithConsent(request));
    expect(request).toHaveBeenCalledTimes(2);
    expect(result.current.isConsentPending).toBe(false);
  });

  it("drops the pending request on cancel", () => {
    const request = vi.fn();
    const { result } = renderHook(() => useAiPrivacy());

    act(() => result.current.runWithConsent(request));
    act(() => result.current.cancelConsent());

    expect(request).not.toHaveBeenCalled();
    expect(localStorage.getItem(AI_PRIVACY_ACK_KEY)).toBeNull();
  });

  it("includes schema by default and persists the choice", () => {
    const { result } = renderHook(() => useAiPrivacy());
    expect(result.current.includeSchema).toBe(true);

    act(() => result.current.setIncludeSchema(false));
    expect(result.current.includeSchema).toBe(false);
    expect(localStorage.getItem(AI_INCLUDE_SCHEMA_KEY)).toBe("false");
  });
});
