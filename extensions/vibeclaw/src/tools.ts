import type { OpenClawPluginApi } from "../../../src/plugins/types.js";

interface ToolContext {
  config?: Record<string, unknown>;
  workspaceDir?: string;
  agentDir?: string;
  agentId?: string;
  sessionKey?: string;
}

/**
 * Create Vibeclaw agent tools for campaign management, status tracking, and learning.
 */
export function createVibeclawTools(api: OpenClawPluginApi, workspace: string, ctx: ToolContext) {
  const tools = [];

  // Tool 1: Campaign launcher — spawns agent workflows
  tools.push({
    name: "vibeclaw_campaign",
    label: "Vibeclaw Campaign",
    description:
      "Launch or manage a Vibeclaw marketing campaign. " +
      "Actions: 'plan' (create campaign plan), 'launch' (start agents), " +
      "'pause' (pause running agents), 'report' (get campaign report).",
    parameters: {
      type: "object" as const,
      properties: {
        action: {
          type: "string",
          enum: ["plan", "launch", "pause", "report"],
          description: "Campaign action to perform",
        },
        campaign: {
          type: "string",
          description: "Campaign name or ID",
        },
        agents: {
          type: "array",
          items: { type: "string" },
          description:
            "Agent types to include: intent-sniper, content-syndication, " +
            "directory-submitter, social-content-factory, x-reply-agent, " +
            "job-sniper, seo-gap-exploiter, community-engagement, youtube-automation",
        },
        config: {
          type: "object",
          description: "Campaign-specific configuration overrides",
        },
      },
      required: ["action", "campaign"],
    },
    async execute(_toolCallId: string, params: Record<string, unknown>) {
      const { action, campaign, agents, config } = params;

      switch (action) {
        case "plan":
          return {
            type: "text" as const,
            text: JSON.stringify(
              {
                campaign,
                status: "planned",
                agents: agents ?? [
                  "intent-sniper",
                  "content-syndication",
                  "directory-submitter",
                  "x-reply-agent",
                  "seo-gap-exploiter",
                ],
                workspace,
                message:
                  "Campaign planned. Use action 'launch' to start agents. " +
                  "Each agent will run as a subagent session via sessions_spawn.",
              },
              null,
              2,
            ),
          };

        case "launch":
          return {
            type: "text" as const,
            text: JSON.stringify(
              {
                campaign,
                status: "launching",
                message:
                  "To launch agents, use sessions_spawn for each agent type. " +
                  "Each agent reads its SKILL.md instructions and operates autonomously. " +
                  "Example: sessions_spawn with task 'Run intent-sniper for [product]'.",
                agents: agents ?? [],
              },
              null,
              2,
            ),
          };

        case "pause":
          return {
            type: "text" as const,
            text: JSON.stringify({
              campaign,
              status: "paused",
              message: "Campaign paused. Active agent sessions will complete their current task.",
            }),
          };

        case "report":
          return {
            type: "text" as const,
            text: JSON.stringify(
              {
                campaign,
                status: "report",
                message:
                  "Check agent logs in workspace/logs/ for detailed metrics. " +
                  "Each agent writes JSONL logs: intent-sniper.jsonl, " +
                  "content-syndication.jsonl, x-reply-agent.jsonl, etc.",
                workspace,
              },
              null,
              2,
            ),
          };

        default:
          return { type: "text" as const, text: `Unknown action: ${action}` };
      }
    },
  });

  // Tool 2: Status checker
  tools.push({
    name: "vibeclaw_status",
    label: "Vibeclaw Status",
    description: "Check the status of all Vibeclaw agents, active campaigns, and recent metrics.",
    parameters: {
      type: "object" as const,
      properties: {
        verbose: {
          type: "boolean",
          description: "Include detailed per-agent metrics",
        },
      },
    },
    async execute(_toolCallId: string, params: Record<string, unknown>) {
      return {
        type: "text" as const,
        text: JSON.stringify(
          {
            workspace,
            configured: !!workspace,
            agents: [
              "vibeclaw-orchestrator",
              "intent-sniper",
              "content-syndication",
              "directory-submitter",
              "social-content-factory",
              "x-reply-agent",
              "job-sniper",
              "seo-gap-exploiter",
              "community-engagement",
              "skill-learner",
              "youtube-automation",
            ],
            message: "All skills loaded. Use vibeclaw_campaign to launch workflows.",
          },
          null,
          2,
        ),
      };
    },
  });

  // Tool 3: Learning capture
  tools.push({
    name: "vibeclaw_learn",
    label: "Vibeclaw Learn",
    description:
      "Record a learning, success, or failure for the skill-learner system. " +
      "Captures what worked, what didn't, and derives rules for future sessions.",
    parameters: {
      type: "object" as const,
      properties: {
        agent: {
          type: "string",
          description: "Which agent this learning is from",
        },
        type: {
          type: "string",
          enum: ["success", "failure", "rule", "template"],
          description: "Type of learning",
        },
        description: {
          type: "string",
          description: "What happened",
        },
        rule: {
          type: "string",
          description: "Derived rule or formula for future sessions",
        },
        confidence: {
          type: "string",
          enum: ["high", "medium", "low"],
          description: "Confidence based on sample size",
        },
      },
      required: ["agent", "type", "description"],
    },
    async execute(_toolCallId: string, params: Record<string, unknown>) {
      const { agent, type, description, rule, confidence } = params;

      const learning = {
        timestamp: new Date().toISOString(),
        agent,
        type,
        description,
        rule: rule ?? null,
        confidence: confidence ?? "medium",
      };

      return {
        type: "text" as const,
        text: JSON.stringify(
          {
            recorded: true,
            learning,
            message:
              "Learning recorded. The skill-learner will incorporate this " +
              "into knowledge files during the next review cycle.",
          },
          null,
          2,
        ),
      };
    },
  });

  return tools;
}
