import { useCallback, useEffect, useState } from "react";
import {
  ActiveUserViewModel,
  ChatMessageEvent,
  chatMessageEventToViewModel,
  ChatMessageViewModel,
  FilterModel,
  InitEvent,
  RowUpdateEvent,
  RowViewModel,
  SortModelItem,
  UserFocusChangedEvent,
  UserJoinedEvent,
  UserLeftEvent,
  UserViewChangedEvent,
  ViewViewModel,
} from "@/lib/types";
import { useQueryClient } from "@tanstack/react-query";

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

enum SocketStatus {
  INITIAL = "initial",
  CONNECTING = "connecting",
  OPEN = "open",
  DISCONNECTED = "disconnected",
  ERROR = "error",
}

interface UseWorkspaceParams {
  projectId: string;
  initialUsers: ActiveUserViewModel[];
}

export function useWorkspace(params: UseWorkspaceParams) {
  const [socketStatus, setSocketStatus] = useState<SocketStatus>(
    SocketStatus.INITIAL,
  );
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [activeUsers, setActiveUsers] = useState<ActiveUserViewModel[]>(
    params.initialUsers,
  );

  const queryClient = useQueryClient();

  const handleRowUpdate = (event: RowUpdateEvent) => {
    queryClient.setQueryData(
      ["rows", event.view_id],
      (oldRows: RowViewModel[]) => {
        if (!oldRows) return oldRows;
        return oldRows.map((row) => {
          if (row.id === event.row_id) {
            return {
              ...row,
              data: {
                ...row.data,
                [event.column_name]: event.value,
              },
              version: event.row_version,
            };
          }
          return row;
        });
      },
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
          avatar_url: data.avatar_url,
        },
      ];
    });
  };

  const handleUserLeft = (data: UserLeftEvent) => {
    setActiveUsers((prevUsers) =>
      prevUsers.filter((user) => user.id !== data.id),
    );
  };

  const handleInitEvent = (data: InitEvent) => {
    setActiveUsers(data.users);
  };

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

  const [unreadMessages, setUnreadMessages] = useState<number>(0);

  const handleChatMessage = (data: ChatMessageEvent) => {
    queryClient.setQueryData(
      ["messages", params.projectId],
      (oldMessages: ChatMessageEvent[]) => {
        if (!oldMessages) return oldMessages;
        const chatMessage = chatMessageEventToViewModel(data);
        return [...oldMessages, chatMessage];
      },
    );

    setUnreadMessages((prev) => prev + 1);
  };

  const messageHandlers: Record<string, (data: any) => void> = {
    user_joined: handleUserJoin,
    user_left: handleUserLeft,
    init: handleInitEvent,
    user_focus_changed: handleUserFocusChanged,
    user_view_changed: handleUserViewChanged,
    row_update: handleRowUpdate,
    chat_message: handleChatMessage,
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

  const changeView = throttle((view: ViewViewModel) => {
    socket?.send(
      JSON.stringify({
        event: "view_change",
        view_id: view.id,
      }),
    );
  }, 250);

  const changeFocus = throttle((rowId: string) => {
    socket?.send(
      JSON.stringify({
        event: "focus_change",
        row_id: rowId,
      }),
    );
  }, 250);

  const changeFilterSort = throttle(
    (viewId: string, filterModel: FilterModel, sortModel: SortModelItem[]) => {
      socket?.send(
        JSON.stringify({
          event: "filter_sort_update",
          filter_model: filterModel,
          view_id: viewId,
          sort_model: sortModel.map((item) => ({
            column_name: item.columnName,
            sort_direction: item.sortDirection,
          })),
        }),
      );
    },
    250,
  );

  const sendChatMessage = throttle((content: string, viewId?: string) => {
    socket?.send(
      JSON.stringify({
        event: "chat_message",
        content: content,
        view_id: viewId,
      }),
    );
  }, 250);

  const connect = useCallback(() => {
    if (socketStatus !== SocketStatus.INITIAL) {
      return;
    }

    console.log("Connecting to WebSocket...");

    setSocketStatus(SocketStatus.CONNECTING);

    const ws = new WebSocket(
      `${process.env.NEXT_PUBLIC_WEBSOCKET_URL}/projects/${params.projectId}/collaborate`,
    );

    ws.onopen = () => {
      console.log("WebSocket connection established");
      setSocket(ws);
      setSocketStatus(SocketStatus.OPEN);
    };

    ws.onmessage = handleMessage;

    ws.onerror = (error) => {
      setSocketStatus(SocketStatus.ERROR);
    };

    ws.onclose = () => {
      setSocketStatus(SocketStatus.DISCONNECTED);
      setSocket(null);
    };

    return ws;
  }, [params.projectId, socketStatus]);

  useEffect(() => {
    const ws = connect();

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [params.projectId, connect]);

  return {
    socketStatus,
    changeView,
    changeFocus,
    changeFilterSort,
    sendChatMessage,
    unreadMessages,
    setUnreadMessages,
    activeUsers,
  };
}
