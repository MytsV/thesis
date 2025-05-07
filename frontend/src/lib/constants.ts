export const PROJECT_PAGE_SIZE = 6;

export const workspaceKeys = {
  activeUsers: (projectId: string) => ["activeUsers", projectId] as const,
};
