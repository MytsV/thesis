"use client";

import { useRouter } from "next/navigation";
import Landing from "@/components/Landing";
import { useUser } from "@/lib/user-provision";

export default function Home() {
  const router = useRouter();
  const user = useUser();

  const onLogin = () => {
    router.push("/login");
  };

  const onRegister = () => {
    router.push("/register");
  };

  const onDashboard = () => {
    router.push("/dashboard");
  };

  return (
    <Landing
      onLogin={onLogin}
      onRegister={onRegister}
      onDashboard={onDashboard}
      isAuthenticated={user !== undefined}
    />
  );
}
