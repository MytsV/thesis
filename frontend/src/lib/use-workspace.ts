import { useCallback, useEffect, useRef, useState } from "react";
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

export enum SocketStatus {
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

const HEARTBEAT_INTERVAL = 10000; // 10 seconds
const HEARTBEAT_TIMEOUT = 5000; // 5 seconds to wait for pong
const MAX_MISSED_HEARTBEATS = 2;

export function useWorkspace(params: UseWorkspaceParams) {
  const [socketStatus, setSocketStatus] = useState<SocketStatus>(
    SocketStatus.INITIAL,
  );
  const socket = useRef<WebSocket | null>(null);
  const [activeUsers, setActiveUsers] = useState<ActiveUserViewModel[]>(
    params.initialUsers,
  );

  const queryClient = useQueryClient();

  const handleRowUpdate = (event: RowUpdateEvent) => {
    queryClient.setQueryData(
      ["rows", event.file_id],
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
    queryClient.invalidateQueries({ queryKey: ["chartData", event.file_id] });
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

  const handleHeartbeat = () => {
    missedHeartbeats.current = 0;

    if (heartbeatTimeout.current) {
      clearTimeout(heartbeatTimeout.current);
      heartbeatTimeout.current = null;
    }
  };

  const messageHandlers: Record<string, (data: any) => void> = {
    user_joined: handleUserJoin,
    user_left: handleUserLeft,
    init: handleInitEvent,
    user_focus_changed: handleUserFocusChanged,
    user_view_changed: handleUserViewChanged,
    row_update: handleRowUpdate,
    chat_message: handleChatMessage,
    heartbeat_ack: handleHeartbeat,
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
    socket.current?.send(
      JSON.stringify({
        event: "view_change",
        view_id: view.id,
      }),
    );
  }, 250);

  const changeFocus = throttle((rowId: string) => {
    socket.current?.send(
      JSON.stringify({
        event: "focus_change",
        row_id: rowId,
      }),
    );
  }, 250);

  const changeFilterSort = throttle(
    (viewId: string, filterModel: FilterModel, sortModel: SortModelItem[]) => {
      socket.current?.send(
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
    socket.current?.send(
      JSON.stringify({
        event: "chat_message",
        content: content,
        view_id: viewId,
      }),
    );
  }, 250);

  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimeout = useRef<NodeJS.Timeout | null>(null);
  const missedHeartbeats = useRef<number>(0);

  const cleanup = useCallback(() => {
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
      heartbeatInterval.current = null;
    }
    if (heartbeatTimeout.current) {
      clearTimeout(heartbeatTimeout.current);
      heartbeatTimeout.current = null;
    }
    missedHeartbeats.current = 0;
  }, []);

  const disconnect = useCallback(() => {
    if (!socket) {
      return;
    }
    cleanup();
    socket.current?.close();
  }, [setSocketStatus]);

  const startHeartbeat = useCallback(() => {
    cleanup();
    heartbeatInterval.current = setInterval(() => {
      socket.current?.send(JSON.stringify({ event: "heartbeat" }));

      heartbeatTimeout.current = setTimeout(() => {
        missedHeartbeats.current += 1;
        console.warn(
          `Missed heartbeat ${missedHeartbeats.current}/${MAX_MISSED_HEARTBEATS}`,
        );

        if (missedHeartbeats.current >= MAX_MISSED_HEARTBEATS) {
          console.error("Too many missed heartbeats, closing connection");
          disconnect();
        }
      }, HEARTBEAT_TIMEOUT);
    }, HEARTBEAT_INTERVAL);
  }, [disconnect, cleanup]);

  const connect = useCallback(() => {
    setSocketStatus(SocketStatus.CONNECTING);

    const ws = new WebSocket(
      `${process.env.NEXT_PUBLIC_WEBSOCKET_URL}/projects/${params.projectId}/collaborate`,
    );

    ws.onopen = () => {
      socket.current = ws;
      setSocketStatus(SocketStatus.OPEN);
      startHeartbeat();
    };

    ws.onmessage = handleMessage;

    ws.onerror = (error) => {
      setSocketStatus(SocketStatus.ERROR);
    };

    ws.onclose = () => {
      setSocketStatus(SocketStatus.DISCONNECTED);
      socket.current = null;
    };

    return ws;
  }, [params.projectId, setSocketStatus]);

  const initializeConnection = useCallback(() => {
    if (socketStatus === SocketStatus.INITIAL) {
      connect();
    }
  }, [socketStatus, connect]);

  useEffect(() => {
    initializeConnection();

    return () => {
      if (socket.current && socket.current.readyState === WebSocket.OPEN) {
        socket.current.close();
      }
    };
  }, [params.projectId, connect]);

  return {
    socketStatus,
    connect,
    changeView,
    changeFocus,
    changeFilterSort,
    sendChatMessage,
    unreadMessages,
    setUnreadMessages,
    activeUsers,
  };
}
