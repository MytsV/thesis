import { getProjectDetails } from "@/lib/server-api";
import { DetailedProjectViewModel } from "@/lib/types";
import { notFound } from "next/navigation";
import Workspace from "@/pages/Workspace";

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

  console.log(projectDetails);
  return <Workspace project={projectDetails} />;
}
