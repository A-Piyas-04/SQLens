/** AI routes are off unless the deployment explicitly opts in; requests cannot toggle this. */
export function isAiFeatureEnabled(): boolean {
  return process.env.AI_FEATURES_ENABLED?.trim() === "true";
}
