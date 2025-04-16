"use client";

import { useUser } from "@/lib/user-provision";
import WebSocketDisplay from "@/components/custom/WebSocketDisplay";

export default function Dashboard() {
  const user = useUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {user.username}!</p>
      <WebSocketDisplay />
    </div>
  );
}
