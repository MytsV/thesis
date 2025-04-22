"use client";

import WorkspaceNavigationBar from "@/components/workspace/WorkspaceNavigationBar";
import { DetailedProjectViewModel } from "@/lib/types";
import { useUser } from "@/lib/user-provision";
import { notFound } from "next/navigation";

export interface WorkspaceProps {
  project: DetailedProjectViewModel;
}

export default function Workspace(props: WorkspaceProps) {
  const user = useUser();
  if (!user) {
    return notFound();
  }

  return (
    <div className="h-full">
      <WorkspaceNavigationBar
        onLogoClick={() => {}}
        projectName={"Bubu"}
        currentUser={user}
      />
    </div>
  );
}
