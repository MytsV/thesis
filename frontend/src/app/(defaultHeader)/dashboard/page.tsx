import Dashboard from "@/pages/Dashboard";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { ProjectListTabs } from "@/lib/types";
import { listProjects } from "@/lib/server-api";
import { PROJECT_PAGE_SIZE } from "@/lib/constants";

export default async function Page() {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["projects", 1, ProjectListTabs.MINE],
    queryFn: () => listProjects({ page: 1, pageSize: PROJECT_PAGE_SIZE }),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Dashboard />
    </HydrationBoundary>
  );
}
