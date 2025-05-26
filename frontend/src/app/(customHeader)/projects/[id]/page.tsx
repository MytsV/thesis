import { getActiveUsers, getProjectDetails } from "@/lib/server-api";
import { ActiveUserViewModel, DetailedProjectViewModel } from "@/lib/types";
import { notFound } from "next/navigation";
import Workspace from "@/page-components/Workspace";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let projectDetails: DetailedProjectViewModel;
  try {
    projectDetails = await getProjectDetails(id);
  } catch (error) {
    console.error("Error fetching project details:", error);
    notFound();
  }

  let activeUsers: ActiveUserViewModel[] = [];
  try {
    activeUsers = await getActiveUsers(id);
  } catch (error) {
    console.error("Error fetching active users:", error);
    notFound();
  }

  if (!projectDetails || !activeUsers) {
    notFound();
  }

  return <Workspace project={projectDetails} activeUsers={activeUsers} />;
}
