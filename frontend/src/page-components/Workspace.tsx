"use client";

import WorkspaceNavigationBar from "@/components/workspace/WorkspaceNavigationBar";
import {
  ActiveUserViewModel,
  DetailedProjectViewModel,
  ViewViewModel,
} from "@/lib/types";
import { useUser } from "@/lib/user-provision";
import { notFound, useRouter } from "next/navigation";
import WorkspaceSidebar, {
  TabType,
} from "@/components/workspace/WorkspaceSidebar";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { SocketStatus, useWorkspace } from "@/lib/use-workspace";
import { useSubscription } from "@/lib/use-subscription";
import InfoTabPage from "@/page-components/workspace/InfoTabPage";
import UsersTabPage from "@/page-components/workspace/UsersTabPage";
import ViewsTabPage from "@/page-components/workspace/ViewsTabPage";
import ChatTabPage from "@/page-components/workspace/ChartTabPage";
import CurrentView from "@/page-components/workspace/CurrentView";
import { Button } from "@/components/ui/button";

export interface WorkspaceProps {
  project: DetailedProjectViewModel;
  activeUsers: ActiveUserViewModel[];
}

export default function Workspace(props: WorkspaceProps) {
  const {
    activeUsers,
    connect,
    changeView,
    changeFocus,
    changeFilterSort,
    sendChatMessage,
    socketStatus,
    unreadMessages,
    setUnreadMessages,
  } = useWorkspace({
    projectId: props.project.id,
    initialUsers: props.activeUsers,
  });

  const { subscribe, unsubscribe, subscriptionId } = useSubscription({
    projectId: props.project.id,
  });
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("info");

  useEffect(() => {
    if (activeTab === "chat" && isSidebarExpanded) {
      setUnreadMessages(0);
    }
  }, [activeTab, unreadMessages, isSidebarExpanded]);

  const currentUser = useUser();
  const router = useRouter();

  const [currentView, setCurrentView] = useState<ViewViewModel | null>(null);

  useEffect(() => {
    if (currentView) {
      changeView(currentView);
    }
    unsubscribe();
  }, [currentView]);

  const subscribeToUser = useCallback(
    (user: ActiveUserViewModel) => {
      if (!currentView) {
        toast.error("Please select a view to subscribe");
        return;
      }
      if (user.id === currentUser?.id) {
        toast.error("You cannot select yourself");
        return;
      }
      if (!user.color) {
        toast.error("User is offline");
        return;
      }
      if (user.current_view_id !== currentView?.id) {
        toast.error("User is not in the same view");
        return;
      }
      subscribe(currentView.id, user.id);
    },
    [currentView, currentUser],
  );

  if (!currentUser) {
    return notFound();
  }

  const subscriptionUserColor = activeUsers.find(
    (user) => user.id === subscriptionId,
  )?.color;

  if (socketStatus !== SocketStatus.OPEN) {
    let content;
    if (
      socketStatus === SocketStatus.ERROR ||
      socketStatus === SocketStatus.DISCONNECTED
    ) {
      content = (
        <>
          <span>Disconnected from the server.</span>
          <Button onClick={connect}>Click to reconnect</Button>
        </>
      );
    } else {
      content = <span>Connecting to the server...</span>;
    }

    return (
      <div className="grow mx-auto flex flex-col justify-center max-w-xl items-center space-y-2">
        {content}
      </div>
    );
  }

  return (
    <div className="h-full grow flex">
      <WorkspaceSidebar
        infoTab={<InfoTabPage project={props.project} />}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isExpanded={isSidebarExpanded}
        setIsExpanded={setIsSidebarExpanded}
        usersTab={
          <UsersTabPage
            activeUsers={activeUsers}
            projectId={props.project.id}
            canInvite={props.project.owner.id === currentUser.id}
            onUserClick={subscribeToUser}
            subscriptionUserId={subscriptionId}
          />
        }
        viewsTab={
          <ViewsTabPage
            projectId={props.project.id}
            files={props.project.files}
            onViewClick={setCurrentView}
            currentView={currentView}
            activeUsers={activeUsers}
          />
        }
        chatTab={
          <ChatTabPage
            currentUser={currentUser}
            projectId={props.project.id}
            onViewClick={setCurrentView}
            onSendMessage={(message) => {
              sendChatMessage(message, currentView?.id);
            }}
          />
        }
        user={currentUser}
        subscriptionUserColor={subscriptionUserColor}
        unreadMessagesCount={
          activeTab === "chat" && isSidebarExpanded ? 0 : unreadMessages
        }
      />
      <div className="flex flex-col w-full h-auto">
        <WorkspaceNavigationBar
          onLogoClick={() => {
            router.push("/");
          }}
          projectName={props.project.title}
          activeUsers={activeUsers.filter((user) => user.id !== currentUser.id)}
        />
        <div className="w-full flex grow items-center justify-center p-4">
          <CurrentView
            view={currentView}
            onFocusChange={changeFocus}
            activeUsers={activeUsers}
            currentUser={currentUser}
            onOptionsChange={(filterModel, sortModel) => {
              if (!currentView) return;
              changeFilterSort(currentView.id, filterModel, sortModel);
            }}
          />
        </div>
      </div>
    </div>
  );
}
