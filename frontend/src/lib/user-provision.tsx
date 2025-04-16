"use client";

import { createContext, useContext, ReactNode } from "react";
import { UserViewModel } from "@/lib/types";

const UserContext = createContext<UserViewModel | undefined>(undefined);

export function useUser() {
  return useContext(UserContext);
}

type UserProviderProps = {
  user?: UserViewModel;
  children: ReactNode;
};

export function UserProvider({ user, children }: UserProviderProps) {
  // TODO: handle user state changes
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}
