export const routes = {
  /* Workspaces */
  workspace: "workspace",
  newWorkspace: "new-workspace",
  workspaceExists: "workspace-exists",
  setup: "setup",
  profile: "profile",
  session: "session",

  /* Providers */
  providers: "providers",
  provider: (providerId = ":providerId") => `providers/${providerId}`,
  providerConfigs: "provider-configs",
  providerConfig: (providerId = ":providerId") =>
    `provider-configs/${providerId}`,
  validateProviderConfig: (providerId = ":providerId") =>
    `provider-configs/${providerId}/validate`,
  providerModels: (providerId = ":providerId") =>
    `provider-configs/${providerId}/models`,
  validateProviderKey: (provider = ":provider") => `validate-key/${provider}`,

  /* Agents */
  agents: "agents",
  agentConfigs: "agent-configs",
  agentConfig: (configId = ":configId") => `agent-configs/${configId}`,

  /* Threads */
  threads: "threads",
  thread: (threadId = ":threadId") => `threads/${threadId}`,
  retryThread: (threadId = ":threadId") => `threads/${threadId}/retry`,
};
