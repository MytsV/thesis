"use client";

import WorkspaceNavigationBar from "@/components/workspace/WorkspaceNavigationBar";
import {
  ActiveUserViewModel,
  DetailedProjectViewModel,
  InitEvent,
  UserJoinedEvent,
  UserLeftEvent,
} from "@/lib/types";
import { useUser } from "@/lib/user-provision";
import { notFound } from "next/navigation";
import WorkspaceSidebar from "@/components/workspace/WorkspaceSidebar";
import InfoTab from "@/components/workspace/InfoTab";
import { useEffect, useState } from "react";
import { getApiUrl } from "@/lib/utils/api-utils";

export interface WorkspaceProps {
  project: DetailedProjectViewModel;
  activeUsers: ActiveUserViewModel[];
}

export default function Workspace(props: WorkspaceProps) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [activeUsers, setActiveUsers] = useState<ActiveUserViewModel[]>(
    props.activeUsers,
  );
  const currentUser = useUser();

  const handleUserJoin = (data: UserJoinedEvent) => {
    setActiveUsers((prevUsers) => {
      const userExists = prevUsers.some((user) => user.id === data.id);
      if (userExists) {
        return prevUsers;
      }
      return [
        ...prevUsers,
        {
          id: data.id,
          username: data.username,
          color: data.color,
        },
      ];
    });
  };

  const handleInitEvent = (data: InitEvent) => {
    setActiveUsers(data.users);
  };

  const handleUserLeft = (data: UserLeftEvent) => {
    setActiveUsers((prevUsers) =>
      prevUsers.filter((user) => user.id !== data.id),
    );
  };

  const messageHandlers: Record<string, (data: any) => void> = {
    user_joined: handleUserJoin,
    user_left: handleUserLeft,
    init: handleInitEvent,
  };

  const handleMessage = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      const handler = messageHandlers[data.event];
      if (handler) {
        handler(data);
      } else {
        console.error("Unknown event received", data.event);
      }
    } catch (e) {
      console.error("Error parsing message:", e);
    }
  };

  useEffect(() => {
    const ws = new WebSocket(
      `ws://${getApiUrl().replace("http://", "")}/ws/projects/${props.project.id}/collaborate`,
    );

    ws.onopen = () => {
      setSocket(ws);
    };

    ws.onmessage = handleMessage;

    ws.onerror = (error) => {
      // TODO: handle websocket error
    };

    ws.onclose = () => {
      setSocket(null);
    };

    return () => {
      ws.close();
    };
  }, []);

  if (!currentUser) {
    return notFound();
  }

  return (
    <div className="h-full grow flex">
      <WorkspaceSidebar
        infoTab={<InfoTab project={props.project} onFileDownload={() => {}} />}
        usersTab={<div>Not implemented</div>}
        viewsTab={<div>Not implemented</div>}
        chatTab={<div>Not implemented</div>}
        user={currentUser}
      />
      <WorkspaceNavigationBar
        onLogoClick={() => {}}
        projectName={props.project.title}
        activeUsers={activeUsers.filter((user) => user.id !== currentUser.id)}
      />
    </div>
  );
}
