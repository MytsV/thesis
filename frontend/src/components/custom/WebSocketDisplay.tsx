"use client";

import { useState, useEffect } from "react";
import { getApiUrl, logoutUser } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function WebSocketDisplay() {
  const [message, setMessage] = useState<string>("");
  const [connected, setConnected] = useState(false);
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(
      `ws://${getApiUrl().replace("http://", "")}/ws/test`,
    );

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

  const router = useRouter();

  const handleLogout = async () => {
    await logoutUser();
    router.push("/login");
  };

  return (
    <div>
      <button onClick={() => handleLogout()}>Logout</button>
      <h2>WebSocket Updates</h2>
      <p>Status: {connected ? "Connected" : "Disconnected"}</p>
      <div>{message}</div>
    </div>
  );
}
