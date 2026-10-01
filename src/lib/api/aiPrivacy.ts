import { safeGetLocalStorage, safeSetLocalStorage } from "../storage/safeStorage";

export const AI_PRIVACY_ACK_KEY = "sqlens-ai-privacy-ack";
export const AI_INCLUDE_SCHEMA_KEY = "sqlens-ai-include-schema";

export function hasAcknowledgedAiPrivacy(): boolean {
  return safeGetLocalStorage(AI_PRIVACY_ACK_KEY) === "true";
}

export function acknowledgeAiPrivacy(): void {
  safeSetLocalStorage(AI_PRIVACY_ACK_KEY, "true");
}

/** Schema sharing defaults to on so existing schema-aware guidance keeps working. */
export function getIncludeSchemaPreference(): boolean {
  return safeGetLocalStorage(AI_INCLUDE_SCHEMA_KEY) !== "false";
}

export function setIncludeSchemaPreference(include: boolean): void {
  safeSetLocalStorage(AI_INCLUDE_SCHEMA_KEY, include ? "true" : "false");
}
