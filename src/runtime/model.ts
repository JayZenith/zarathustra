export interface AgentAction {
  tool: string;
  input: Record<string, unknown>;
}

export interface AgentPlan {
  summary: string;
  objective: string;
  expectedEvidence: string[];
  memoryUpdates: string[];
  actions: AgentAction[];
}

export interface ModelClient {
  plan(input: string): Promise<AgentPlan>;
}

export class StubModelClient implements ModelClient {
  async plan(_input: string): Promise<AgentPlan> {
    return {
      summary: "No external model is wired yet; using deterministic runtime stub.",
      objective: "Gather current target state and preserve loop continuity.",
      expectedEvidence: ["git status snapshot", "configured primary metric"],
      memoryUpdates: ["record current repo cleanliness"],
      actions: [
        {
          tool: "shell",
          input: {
            cmd: "git status --short",
          },
        },
      ],
    };
  }
}
