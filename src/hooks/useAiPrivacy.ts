import { useCallback, useRef, useState } from "react";

import {
  acknowledgeAiPrivacy,
  getIncludeSchemaPreference,
  hasAcknowledgedAiPrivacy,
  setIncludeSchemaPreference,
} from "../lib/api/aiPrivacy";

/**
 * One-time AI data notice plus the schema-sharing preference.
 * `runWithConsent` runs the request immediately once acknowledged; before that it
 * holds the request until the user continues (or drops it on cancel).
 */
export function useAiPrivacy() {
  const [isConsentPending, setIsConsentPending] = useState(false);
  const [includeSchema, setIncludeSchemaState] = useState(getIncludeSchemaPreference);
  const pendingRequestRef = useRef<(() => void) | null>(null);

  const runWithConsent = useCallback((request: () => void) => {
    if (hasAcknowledgedAiPrivacy()) {
      request();
      return;
    }
    pendingRequestRef.current = request;
    setIsConsentPending(true);
  }, []);

  const continueWithConsent = useCallback(() => {
    acknowledgeAiPrivacy();
    setIsConsentPending(false);
    const request = pendingRequestRef.current;
    pendingRequestRef.current = null;
    request?.();
  }, []);

  const cancelConsent = useCallback(() => {
    pendingRequestRef.current = null;
    setIsConsentPending(false);
  }, []);

  const setIncludeSchema = useCallback((include: boolean) => {
    setIncludeSchemaPreference(include);
    setIncludeSchemaState(include);
  }, []);

  return {
    isConsentPending,
    runWithConsent,
    continueWithConsent,
    cancelConsent,
    includeSchema,
    setIncludeSchema,
  };
}
