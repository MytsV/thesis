import WebSocketDisplay from "@/components/custom/WebSocketDisplay";
import { getUserServer } from "@/lib/auth";

export default async function Dashboard() {
  const user = await getUserServer();

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {user.username}!</p>
      <WebSocketDisplay />
    </div>
  );
}
