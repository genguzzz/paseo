import type { Logger } from "pino";

import type { AgentFeature, AgentSessionConfig } from "../agent-sdk-types.js";
import { buildACPAutoAcceptFeature, type ACPConfigFeatureOption } from "./acp-agent.js";
import { GenericACPAgentClient } from "./generic-acp-agent.js";

interface CursorACPAgentClientOptions {
  logger: Logger;
  command: [string, ...string[]];
  env?: Record<string, string>;
  providerId?: string;
  label?: string;
  providerParams?: unknown;
}

const CURSOR_INITIAL_COMMANDS_WAIT_TIMEOUT_MS = 200;
const CURSOR_CLIENT_CAPABILITY_META = {
  parameterizedModelPicker: true,
};

export const CURSOR_FAST_FEATURE_OPTION: ACPConfigFeatureOption = {
  id: "fast",
  configId: "fast",
  label: "Fast",
  description: "Cursor fast mode",
  tooltip: "Select Cursor fast mode",
  icon: "zap",
};

function buildCursorFeatures(config: AgentSessionConfig): AgentFeature[] {
  const fastValue =
    config.featureValues?.[CURSOR_FAST_FEATURE_OPTION.id] === "true" ? "true" : "false";
  return [
    buildACPAutoAcceptFeature(config),
    {
      type: "select",
      id: CURSOR_FAST_FEATURE_OPTION.id,
      label: CURSOR_FAST_FEATURE_OPTION.label,
      description: CURSOR_FAST_FEATURE_OPTION.description,
      tooltip: CURSOR_FAST_FEATURE_OPTION.tooltip,
      icon: CURSOR_FAST_FEATURE_OPTION.icon,
      value: fastValue,
      options: [
        {
          id: "false",
          label: "Off",
          isDefault: fastValue === "false",
          description: undefined,
          metadata: undefined,
        },
        {
          id: "true",
          label: "Fast",
          isDefault: fastValue === "true",
          description: undefined,
          metadata: undefined,
        },
      ],
    },
  ];
}

export class CursorACPAgentClient extends GenericACPAgentClient {
  constructor(options: CursorACPAgentClientOptions) {
    super({
      logger: options.logger,
      command: options.command,
      env: options.env,
      providerId: options.providerId,
      label: options.label,
      providerParams: options.providerParams,
      // cursor-agent publishes slash commands asynchronously via available_commands_update.
      // Cap the synchronous grace period at the forwarding-layer latency budget;
      // late notifications still populate the session command cache.
      waitForInitialCommands: true,
      initialCommandsWaitTimeoutMs: CURSOR_INITIAL_COMMANDS_WAIT_TIMEOUT_MS,
      clientCapabilityMeta: CURSOR_CLIENT_CAPABILITY_META,
      configFeatureOptions: [CURSOR_FAST_FEATURE_OPTION],
    });
  }

  override async listFeatures(config: AgentSessionConfig): Promise<AgentFeature[]> {
    // Cursor's supported toggle is part of Paseo's adapter contract. Returning it
    // locally avoids an otherwise 7-9 second temporary ACP process and session.
    return buildCursorFeatures(config);
  }
}
