import { getApiUrl } from "@/lib/utils/api-utils";
import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FilterSortUpdateEvent } from "@/lib/types";

interface UseSubscriptionParams {
  projectId: string;
}

export function useSubscription(params: UseSubscriptionParams) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState<number | undefined>(
    undefined,
  );

  const queryClient = useQueryClient();

  const handleFilterSortUpdate = useCallback((data: FilterSortUpdateEvent) => {
    queryClient.setQueryData(["filterModel", data.view_id], () => {
      return data.filter_model;
    });
    queryClient.setQueryData(["sortModel", data.view_id], () => {
      return data.sort_model.map((item) => {
        return {
          columnName: item.column_name,
          sortDirection: item.sort_direction,
        };
      });
    });
  }, []);

  const messageHandlers: Record<string, (data: any) => void> = {
    filter_sort_update: handleFilterSortUpdate,
  };

  const handleMessage = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      console.log(data);
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

  const subscribe = useCallback(
    (viewId: string, userId: number) => {
      // Don't create a new connection if one already exists or is connecting
      if (socket || isConnecting) return;

      setSubscriptionId(userId);
      setIsConnecting(true);

      const ws = new WebSocket(
        `ws://${getApiUrl().replace("http://", "")}/ws/projects/${params.projectId}/views/${viewId}/users/${userId}/subscribe`,
      );

      ws.onopen = () => {
        setSocket(ws);
        setIsConnecting(false);
      };

      ws.onmessage = handleMessage;

      ws.onerror = (error) => {
        setIsConnecting(false);
        // TODO: handle app.websocket error
      };

      ws.onclose = () => {
        setSocket(null);
        setIsConnecting(false);
      };
    },
    [params.projectId, socket, isConnecting],
  );

  const unsubscribe = useCallback(() => {
    if (socket) {
      socket.close();
      setSocket(null);
    }
    setIsConnecting(false);
    setSubscriptionId(undefined);
  }, [socket]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [socket]);

  return {
    socket,
    subscribe,
    unsubscribe,
    isConnecting,
    subscriptionId,
  };
}
