import type { RequestHandler } from "express";

/** AI routes are off unless the deployment explicitly opts in; requests cannot toggle this. */
export function isAiFeatureEnabled(): boolean {
  return process.env.AI_FEATURES_ENABLED?.trim() === "true";
}

export const aiFeatureGate: RequestHandler = (_req, res, next) => {
  if (!isAiFeatureEnabled()) {
    res.setHeader("Cache-Control", "no-store");
    res.status(404).json({ error: "Not found" });
    return;
  }
  next();
};
