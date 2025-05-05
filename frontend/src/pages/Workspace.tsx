"use client";

import WorkspaceNavigationBar from "@/components/workspace/WorkspaceNavigationBar";
import {
  ActiveUserViewModel,
  ColumnViewModel,
  DetailedProjectViewModel,
  FileViewModel,
  InitEvent,
  RowViewModel,
  UserFocusChangedEvent,
  UserJoinedEvent,
  UserLeftEvent,
  UserViewChangedEvent,
  UserViewModel,
  ViewType,
  ViewViewModel,
} from "@/lib/types";
import { useUser } from "@/lib/user-provision";
import { notFound, useRouter } from "next/navigation";
import WorkspaceSidebar from "@/components/workspace/WorkspaceSidebar";
import InfoTab from "@/components/workspace/InfoTab";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { getApiUrl } from "@/lib/utils/api-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createView,
  listSharedUsers,
  listViewColumns,
  listViewRows,
  listViews,
  shareProject,
} from "@/lib/client-api";
import UsersTab from "@/components/workspace/UsersTab";
import { toast } from "sonner";
import ViewsTab, { ViewTypeMeta } from "@/components/workspace/ViewsTab";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import CreateSimpleTableView from "@/components/workspace/CreateSimpleTableView";
import SimpleTableView from "@/components/workspace/SimpleTableView";
import { Spinner } from "@/components/ui/spinner";

export interface WorkspaceProps {
  project: DetailedProjectViewModel;
  activeUsers: ActiveUserViewModel[];
}

interface InfoTabPageProps {
  project: DetailedProjectViewModel;
}

function InfoTabPage({ project }: InfoTabPageProps) {
  const onFileDownload = async (fileName: string, relativePath: string) => {
    try {
      const apiUrl = getApiUrl();
      const fileUrl = `${apiUrl}${relativePath}`;

      const response = await fetch(fileUrl);

      if (!response.ok) {
        throw new Error(
          `Failed to download file: ${response.status} ${response.statusText}`,
        );
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = fileName;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      // TODO: handle error
    }
  };

  return <InfoTab project={project} onFileDownload={onFileDownload} />;
}

interface UsersTabPageProps {
  projectId: string;
  activeUsers: ActiveUserViewModel[];
  canInvite: boolean;
}

function UsersTabPage({
  projectId,
  activeUsers,
  canInvite,
}: UsersTabPageProps) {
  const [inviteUsername, setInviteUsername] = useState<string>("");
  const queryClient = useQueryClient();

  const inviteMutation = useMutation({
    mutationFn: () => shareProject(projectId, inviteUsername),
    onSuccess: () => {
      setInviteUsername("");
      queryClient.invalidateQueries({
        queryKey: ["sharedUsers"],
        refetchType: "active",
      });
      toast("User invited successfully");
    },
    onError: (error: Error) => {
      toast.error("Couldn't invite the user", { description: error.message });
    },
  });

  const handleInvite = () => {
    if (inviteUsername.trim()) {
      inviteMutation.mutate();
    }
  };

  const sharedUsersQuery = useCallback(async () => {
    return listSharedUsers(projectId);
  }, [projectId]);

  const {
    data: sharedUsers,
    error: sharedUsersError,
    isLoading: sharedUsersLoading,
  } = useQuery<UserViewModel[]>({
    queryKey: ["sharedUsers"],
    queryFn: sharedUsersQuery,
  });

  const allUsers: ActiveUserViewModel[] = [...activeUsers];
  if (sharedUsers && sharedUsers.length > 0) {
    for (const user of sharedUsers) {
      if (activeUsers.some((activeUser) => activeUser.id === user.id)) {
        continue;
      }
      allUsers.push({
        id: user.id,
        username: user.username,
        avatarUrl: user.avatarUrl,
      });
    }
  }

  return (
    <UsersTab
      users={allUsers}
      canInvite={canInvite}
      inviteUsername={inviteUsername}
      setInviteUsername={setInviteUsername}
      onInviteClick={handleInvite}
      isLoading={sharedUsersLoading || inviteMutation.isPending}
    />
  );
}

interface CreateSimpleTableViewProps {
  availableFiles: FileViewModel[];
  projectId: string;
  openViewType: ViewType | null;
  setOpenViewType: (viewType: ViewType | null) => void;
}

function CreateSimpleTableViewDialog(props: CreateSimpleTableViewProps) {
  const [name, setName] = useState<string>("");
  const [selectedFileId, setSelectedFileId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (fileId: number) => {
      return createView(props.projectId, { name, fileId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["views"],
        refetchType: "active",
      });
      toast("View created successfully");
    },
    onError: (error: Error) => {
      toast.error("Couldn't create a view", { description: error.message });
    },
  });

  const onSubmit = () => {
    if (!selectedFileId) {
      toast.error("Please select a file");
      return;
    }
    createMutation.mutate(selectedFileId);
    props.setOpenViewType(null);
  };

  return (
    <Dialog
      open={props.openViewType === ViewType.SIMPLE_TABLE}
      onOpenChange={(open) => {
        if (!open) {
          props.setOpenViewType(null);
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Simple Table View</DialogTitle>
        </DialogHeader>
        <CreateSimpleTableView
          availableFiles={props.availableFiles}
          setName={setName}
          onFileSelect={setSelectedFileId}
          onSubmit={onSubmit}
          name={name}
        />
      </DialogContent>
    </Dialog>
  );
}

interface ViewsTabPageProps {
  projectId: string;
  files: FileViewModel[];
  onViewClick: (view: ViewViewModel) => void;
  currentView: ViewViewModel | null;
  activeUsers: ActiveUserViewModel[];
}

function ViewsTabPage(props: ViewsTabPageProps) {
  const [openViewType, setOpenViewType] = useState<ViewType | null>(null);

  const viewTypesMeta: ViewTypeMeta[] = [
    {
      type: ViewType.SIMPLE_TABLE,
      name: "Simple Table",
      icon: <span>📑</span>,
    },
  ];

  const viewsQuery = useCallback(async () => {
    const response = await listViews(props.projectId);
    return response.views;
  }, [props.projectId]);

  const {
    data: views,
    error: viewsError,
    isFetching: viewsLoading,
  } = useQuery<ViewViewModel[]>({
    queryKey: ["views"],
    queryFn: viewsQuery,
  });

  const groupUsersByViewId = (users: ActiveUserViewModel[]) => {
    const result: Record<string, ActiveUserViewModel[]> = {};

    users.forEach((user) => {
      if (user.current_view_id) {
        if (!result[user.current_view_id]) {
          result[user.current_view_id] = [];
        }

        result[user.current_view_id].push(user);
      }
    });

    return result;
  };

  return (
    <>
      <CreateSimpleTableViewDialog
        availableFiles={props.files}
        projectId={props.projectId}
        openViewType={openViewType}
        setOpenViewType={setOpenViewType}
      />
      <ViewsTab
        onCreateClick={(viewType) => setOpenViewType(viewType)}
        views={views ?? []}
        viewTypesMeta={viewTypesMeta}
        onViewClick={props.onViewClick}
        currentViewId={props.currentView?.id}
        users={groupUsersByViewId(props.activeUsers)}
      />
    </>
  );
}

interface SimpleTableViewPageProps {
  view: ViewViewModel;
  onFocusChange: (rowId: string) => void;
  activeUsers: ActiveUserViewModel[];
  currentUser: UserViewModel;
}

function SimpleTableViewPage(props: SimpleTableViewPageProps) {
  const columnsQuery = useCallback(async () => {
    const response = await listViewColumns(props.view.id);
    return response.columns;
  }, [props.view.id]);

  const {
    data: columns,
    error: columnsError,
    isFetching: columnsLoading,
  } = useQuery<ColumnViewModel[]>({
    queryKey: ["columns", props.view.id],
    queryFn: columnsQuery,
  });

  const rowsQuery = useCallback(async () => {
    const response = await listViewRows(props.view.id);
    return response.rows;
  }, [props.view.id]);

  const {
    data: rows,
    error: rowsError,
    isFetching: rowsLoading,
  } = useQuery<RowViewModel[]>({
    queryKey: ["rows", props.view.id],
    queryFn: rowsQuery,
  });

  const currentRowId = useRef<string | null>(null);

  const onRowClicked = async (rowId: string) => {
    if (rowId === currentRowId.current) return;
    currentRowId.current = rowId;
    props.onFocusChange(rowId);
  };

  if (!columns || !rows) {
    return <Spinner />;
  }

  const highlight: Record<string, string> = {};
  props.activeUsers.forEach((user) => {
    if (user.id !== props.currentUser.id && user.focused_row_id && user.color) {
      highlight[user.focused_row_id] = user.color;
    }
  });

  return (
    <SimpleTableView
      columns={columns}
      rows={rows}
      highlight={highlight}
      onRowHover={onRowClicked}
    />
  );
}

interface CurrentViewProps {
  view: ViewViewModel | null;
  onFocusChange: (rowId: string) => void;
  activeUsers: ActiveUserViewModel[];
  currentUser: UserViewModel;
}

function CurrentView(props: CurrentViewProps) {
  if (!props.view) {
    return <div className="text-sm">Please select a view</div>;
  }

  switch (props.view.viewType) {
    case ViewType.SIMPLE_TABLE:
      return (
        <SimpleTableViewPage
          view={props.view}
          onFocusChange={props.onFocusChange}
          activeUsers={props.activeUsers}
          currentUser={props.currentUser}
        />
      );
    default:
      return <div className="text-sm">Unknown view type</div>;
  }
}

function throttle<T extends (...args: any[]) => void>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    lastArgs = args;

    if (now - lastCall >= wait) {
      lastCall = now;
      func(...args);
    } else if (!timeout) {
      timeout = setTimeout(
        () => {
          lastCall = Date.now();
          if (lastArgs) {
            func(...lastArgs);
          }
          timeout = null;
        },
        wait - (now - lastCall),
      );
    }
  };
}

export default function Workspace(props: WorkspaceProps) {
  // TODO: refactor into a custom hook
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [activeUsers, setActiveUsers] = useState<ActiveUserViewModel[]>(
    props.activeUsers,
  );

  const handleUserFocusChanged = (data: UserFocusChangedEvent) => {
    setActiveUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === data.id
          ? { ...user, focused_row_id: data.focused_row_id }
          : user,
      ),
    );
  };

  const handleUserViewChanged = (data: UserViewChangedEvent) => {
    setActiveUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === data.id
          ? { ...user, current_view_id: data.current_view_id }
          : user,
      ),
    );
  };

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
    user_focus_changed: handleUserFocusChanged,
    user_view_changed: handleUserViewChanged,
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

  const onViewChange = throttle((view: ViewViewModel) => {
    if (socket) {
      socket.send(
        JSON.stringify({
          event: "view_change",
          view_id: view.id,
        }),
      );
    }
  }, 250);

  const onFocusChange = throttle((rowId: string) => {
    if (socket) {
      socket.send(
        JSON.stringify({
          event: "focus_change",
          row_id: rowId,
        }),
      );
    }
  }, 250);

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

  const currentUser = useUser();
  const router = useRouter();

  const [currentView, setCurrentView] = useState<ViewViewModel | null>(null);

  useEffect(() => {
    if (currentView) {
      onViewChange(currentView);
    }
  }, [currentView]);

  if (!currentUser) {
    return notFound();
  }

  return (
    <div className="h-full grow flex">
      <WorkspaceSidebar
        infoTab={<InfoTabPage project={props.project} />}
        usersTab={
          <UsersTabPage
            activeUsers={activeUsers}
            projectId={props.project.id}
            canInvite={props.project.owner.id === currentUser.id}
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
        chatTab={<div>Not implemented</div>}
        user={currentUser}
      />
      <div className="flex flex-col w-full h-auto">
        <WorkspaceNavigationBar
          onLogoClick={() => {
            router.push("/");
          }}
          viewName={currentView?.name}
          projectName={props.project.title}
          activeUsers={activeUsers.filter((user) => user.id !== currentUser.id)}
        />
        <div className="w-full flex grow items-center justify-center p-4">
          <CurrentView
            view={currentView}
            onFocusChange={onFocusChange}
            activeUsers={activeUsers}
            currentUser={currentUser}
          />
        </div>
      </div>
    </div>
  );
}
