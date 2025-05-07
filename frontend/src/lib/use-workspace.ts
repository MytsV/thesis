import { getApiUrl } from "@/lib/utils/api-utils";
import { useEffect, useState } from "react";
import {
  ActiveUserViewModel,
  InitEvent,
  UserFocusChangedEvent,
  UserJoinedEvent,
  UserLeftEvent,
  UserViewChangedEvent,
  ViewViewModel,
} from "@/lib/types";

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

interface UseWorkspaceParams {
  projectId: string;
  initialUsers: ActiveUserViewModel[];
}

export function useWorkspace(params: UseWorkspaceParams) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [activeUsers, setActiveUsers] = useState<ActiveUserViewModel[]>(
    params.initialUsers,
  );

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

  useEffect(() => {
    const ws = new WebSocket(
      `ws://${getApiUrl().replace("http://", "")}/ws/projects/${params.projectId}/collaborate`,
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
  }, [params.projectId]);

  return {
    socket,
    changeView,
    changeFocus,
    activeUsers,
  };
}
