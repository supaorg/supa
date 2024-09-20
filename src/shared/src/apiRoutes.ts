export const apiRoutes = {
  root: "/",

  /* Workspaces */
  workspaces: () => `workspaces`,
  workspace: (workspaceId = ":workspaceId") => `workspaces/${workspaceId}`,
  setup: (workspaceId = ":workspaceId") => `workspaces/${workspaceId}/setup`,
  profile: (workspaceId = ":workspaceId") =>
    `workspaces/${workspaceId}/profile`,
  session: (workspaceId = ":workspaceId") =>
    `workspaces/${workspaceId}/session`,

  /* Providers */
  providers: (workspaceId = ":workspaceId") =>
    `workspaces/${workspaceId}/providers`,
  provider: (workspaceId = ":workspaceId", providerId = ":providerId") =>
    `workspaces/${workspaceId}/providers/${providerId}`,
  providerConfigs: (workspaceId = ":workspaceId") =>
    `workspaces/${workspaceId}/provider-configs`,
  providerConfig: (workspaceId = ":workspaceId", providerId = ":providerId") =>
    `workspaces/${workspaceId}/provider-configs/${providerId}`,
  validateProviderConfig: (
    workspaceId = ":workspaceId",
    providerId = ":providerId",
  ) => `workspaces/${workspaceId}/provider-configs/${providerId}/validate`,
  providerModel: (workspaceId = ":workspaceId", providerId = ":providerId") =>
    `workspaces/${workspaceId}/provider-configs/${providerId}/models`,
  validateProviderKey: (workspaceId = ":workspaceId", provider = ":provider") =>
    `workspaces/${workspaceId}/validate-key/${provider}`,

  /* Apps */
  apps: (workspaceId = ":workspaceId") => `workspaces/${workspaceId}/apps`,
  appConfigs: (workspaceId = ":workspaceId") =>
    `workspaces/${workspaceId}/app-configs`,
  appConfig: (workspaceId = ":workspaceId", configId = ":configId") =>
    `workspaces/${workspaceId}/app-configs/${configId}`,

  /* Threads */
  threads: (workspaceId = ":workspaceId") =>
    `workspaces/${workspaceId}/threads`,
  thread: (workspaceId = ":workspaceId", threadId = ":threadId") =>
    `workspaces/${workspaceId}/threads/${threadId}`,
  retryThread: (workspaceId = ":workspaceId", threadId = ":threadId") =>
    `workspaces/${workspaceId}/threads/${threadId}/messages/retry`,
  stopThread: (workspaceId = ":workspaceId", threadId = ":threadId") =>
    `workspaces/${workspaceId}/threads/${threadId}/messages/stop`,
  threadMessages: (workspaceId = ":workspaceId", threadId = ":threadId") =>
    `workspaces/${workspaceId}/threads/${threadId}/messages`,
};
