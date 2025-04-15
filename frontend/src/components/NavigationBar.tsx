"use client";

import { UserViewModel } from "@/lib/types";
import { Cat } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export interface HeaderProps {
  user?: UserViewModel;
  onLogoClick: () => void;
  onLogout: () => void;
  isUserLoading?: boolean;
}

function UserAvatar({ user }: { user: UserViewModel }) {
  return (
    <div className="flex w-10 h-10 rounded-full border shadow-xs items-center justify-center cursor-pointer">
      {user.username[0].toUpperCase()}
    </div>
  );
}

interface UserDropdownProps {
  user: UserViewModel;
  onLogout: () => void;
}

function UserDropdown(props: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  const onLogout = async () => {
    props.onLogout();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div onClick={toggleDropdown}>
        <UserAvatar user={props.user} />
      </div>

      {isOpen && (
        <div className="absolute right-0 mt-4 w-96 max-w-[calc(100vw-2rem)] bg-popover border shadow-xs rounded-md flex flex-col space-y-2 p-3 truncate">
          <h1 className="text-xl">Hello, {props.user.username}!</h1>
          <Button className="w-full cursor-pointer" onClick={onLogout}>
            Sign Out
          </Button>
        </div>
      )}
    </div>
  );
}

export default function NavigationBar(props: HeaderProps) {
  const showAvatar = props.user && !props.isUserLoading;

  return (
    <div className="w-full h-14 border-b shadow-xs">
      <div className="flex items-center justify-between h-full max-w-7xl mx-auto px-4">
        <Cat
          className="h-8 w-8 text-primary cursor-pointer"
          onClick={props.onLogoClick}
        />
        {showAvatar && (
          <UserDropdown user={props.user!} onLogout={props.onLogout} />
        )}
      </div>
    </div>
  );
}
