import type { AgentPlan } from "./model.js";

export function validatePlan(plan: AgentPlan): AgentPlan {
  if (!plan.objective) {
    throw new Error("Agent plan is missing objective");
  }
  if (!Array.isArray(plan.actions)) {
    throw new Error("Agent plan actions must be an array");
  }
  return plan;
}
