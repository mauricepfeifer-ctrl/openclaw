import type { OpenClawPluginApi } from "../../src/plugins/types.js";
import { createVibeclawTools } from "./src/tools.js";
import { createVibeclawService } from "./src/service.js";

export default function register(api: OpenClawPluginApi) {
  const config = api.pluginConfig ?? {};
  const workspace = (config.workspace as string) ?? process.env.VIBECLAW_WORKSPACE ?? "";

  // Register Vibeclaw agent tools
  api.registerTool(
    (ctx) => createVibeclawTools(api, workspace, ctx),
    { names: ["vibeclaw_campaign", "vibeclaw_status", "vibeclaw_learn"] },
  );

  // Register CLI commands
  api.registerCli(
    ({ program }) => {
      const cmd = program.command("vibeclaw").description("Vibeclaw autonomous marketing suite");

      cmd
        .command("status")
        .description("Show status of all Vibeclaw agents and campaigns")
        .action(async () => {
          api.logger.info("Vibeclaw agent suite status:");
          api.logger.info(`  Workspace: ${workspace || "(not configured)"}`);
          api.logger.info("  Skills: vibeclaw-orchestrator, intent-sniper, content-syndication,");
          api.logger.info("          directory-submitter, social-content-factory, x-reply-agent,");
          api.logger.info("          job-sniper, seo-gap-exploiter, community-engagement,");
          api.logger.info("          skill-learner, youtube-automation");
        });

      cmd
        .command("init")
        .description("Initialize Vibeclaw workspace with default config and directories")
        .argument("[path]", "Workspace path", "~/vibeclaw-workspace")
        .action(async (path: string) => {
          api.logger.info(`Initializing Vibeclaw workspace at: ${path}`);
          api.logger.info("Create this directory and set VIBECLAW_WORKSPACE env var to use.");
        });
    },
    { commands: ["vibeclaw"] },
  );

  // Register hooks for learning and compounding
  api.on("agent_end", async (event) => {
    // After each agent session, check if there are learnings to capture
    if (!workspace) return;
    // The skill-learner skill handles the actual learning logic
    // This hook just ensures it gets triggered
  });

  api.on("before_agent_start", async (event) => {
    if (!workspace) return;
    // Inject Vibeclaw context into agent sessions
    const productName = config.productName as string;
    const productUrl = config.productUrl as string;
    const productDescription = config.productDescription as string;

    if (productName && productUrl) {
      return {
        prependContext: [
          "<vibeclaw-context>",
          `Product: ${productName}`,
          `URL: ${productUrl}`,
          productDescription ? `Description: ${productDescription}` : "",
          `Workspace: ${workspace}`,
          "</vibeclaw-context>",
        ]
          .filter(Boolean)
          .join("\n"),
      };
    }
    return undefined;
  });

  api.logger.info("Vibeclaw marketing suite registered");
}
