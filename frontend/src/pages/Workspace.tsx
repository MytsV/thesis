"use client";

import WorkspaceNavigationBar from "@/components/workspace/WorkspaceNavigationBar";
import { DetailedProjectViewModel } from "@/lib/types";
import { useUser } from "@/lib/user-provision";
import { notFound } from "next/navigation";
import WorkspaceSidebar from "@/components/workspace/WorkspaceSidebar";
import InfoTab from "@/components/workspace/InfoTab";

export interface WorkspaceProps {
  project: DetailedProjectViewModel;
}

export default function Workspace(props: WorkspaceProps) {
  const user = useUser();
  if (!user) {
    return notFound();
  }

  return (
    <div className="h-full grow flex">
      <WorkspaceSidebar
        infoTab={<InfoTab project={props.project} onFileDownload={() => {}} />}
        usersTab={<div>Not implemented</div>}
        viewsTab={<div>Not implemented</div>}
        chatTab={<div>Not implemented</div>}
        user={user}
      />
      <WorkspaceNavigationBar
        onLogoClick={() => {}}
        projectName={props.project.title}
      />
    </div>
  );
}
