"use client";

import { usePathname, useRouter } from "next/navigation";
import { UserViewModel } from "@/lib/types";
import NavigationBar from "@/components/NavigationBar";
import { getUserClient, logoutUser } from "@/lib/api";
import { useEffect, useRef, useState } from "react";

export interface HeaderProps {
  initialUser?: UserViewModel;
}

export default function Header({ initialUser }: HeaderProps) {
  const router = useRouter();
  const [user, setUser] = useState(initialUser);
  const pathname = usePathname();
  const previousPathName = useRef<string>(pathname);

  const updateUser = async () => {
    const user = await getUserClient();
    setUser(user);
  };

  useEffect(() => {
    if (previousPathName.current !== pathname) {
      updateUser();
      previousPathName.current = pathname;
    }
  }, [pathname]);

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
