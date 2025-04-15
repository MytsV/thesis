import { useState, useEffect } from "react";
import { API_URL } from "@/lib/api";

export default function WebSocketDisplay() {
  const [message, setMessage] = useState<string>("");
  const [connected, setConnected] = useState(false);
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(`ws://${API_URL.replace("http://", "")}/ws/test`);

    ws.onopen = () => {
      console.log("WebSocket Connected");
      setConnected(true);
      setSocket(ws);
    };

    ws.onmessage = (event) => {
      setMessage(event.data);
    };

    ws.onerror = (error) => {
      console.error("WebSocket Error:", error);
    };

    ws.onclose = () => {
      console.log("WebSocket Disconnected");
      setConnected(false);
      setSocket(null);
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <div>
      <h2>WebSocket Updates</h2>
      <p>Status: {connected ? "Connected" : "Disconnected"}</p>
      <div>{message}</div>
    </div>
  );
}
