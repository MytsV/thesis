import { getProjectDetails } from "@/lib/server-api";
import { DetailedProjectViewModel } from "@/lib/types";
import { notFound } from "next/navigation";

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
  return (
    <div>
      <h1>Project Details {id}</h1>
      <p>Details about the project will go here.</p>
    </div>
  );
}
