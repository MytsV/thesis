"use client";

import { useRouter } from "next/navigation";
import { UserViewModel } from "@/lib/types";
import NavigationBar from "@/components/NavigationBar";
import { logoutUser } from "@/lib/api";

export interface HeaderProps {
  user?: UserViewModel;
}

export default function Header({ user }: HeaderProps) {
  const router = useRouter();

  const onLogoClick = () => {
    router.push("/");
  };

  const onLogout = async () => {
    try {
      await logoutUser();
      router.push("/");
      router.refresh();
    } catch (error) {
      // TODO: handle errors with toasts
    }
  };

  return (
    <NavigationBar onLogout={onLogout} onLogoClick={onLogoClick} user={user} />
  );
}
