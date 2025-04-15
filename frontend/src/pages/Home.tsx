"use client";

import { useRouter } from "next/navigation";
import Landing from "@/components/Landing";

export const Home = () => {
  const router = useRouter();

  const onLogin = () => {
    router.push("/login");
  };

  const onRegister = () => {
    router.push("/register");
  };

  return <Landing onLogin={onLogin} onRegister={onRegister} />;
};
