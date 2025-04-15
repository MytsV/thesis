import WebSocketDisplay from "@/components/custom/WebSocketDisplay";
import { getUser } from "@/lib/auth";

export default async function Dashboard() {
  const user = await getUser();

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {user.username}!</p>
      <WebSocketDisplay />
    </div>
  );
}
