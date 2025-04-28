import React from "react";
import { ActiveUserViewModel } from "@/lib/types";
import UserAvatar from "@/components/common/UserAvatar";
import WebsiteLogo from "@/components/common/WebsiteLogo";

export interface WorkspaceNavigationBarProps {
  onLogoClick: () => void;
  projectName: string;
  activeUsers?: ActiveUserViewModel[];
  viewName?: string;
}

const MAX_VISIBLE_USERS = 3;

export default function WorkspaceNavigationBar(
  props: WorkspaceNavigationBarProps,
) {
  const activeUsers = props.activeUsers || [];

  const additionalUsersCount = Math.max(
    0,
    activeUsers.length - MAX_VISIBLE_USERS,
  );
  const visibleUsers = activeUsers.slice(0, MAX_VISIBLE_USERS);

  const getMoreUsers = (count: number) => {
    return (
      <div className="flex w-10 h-10 rounded-full bg-background border items-center justify-center cursor-pointer shadow-xs z-10">
        <span className="text-xs font-medium">+{count}</span>
      </div>
    );
  };

  const getActiveUsers = () => {
    return (
      visibleUsers.length > 0 && (
        <>
          <div className="sm:flex -space-x-2 mr-2 hidden">
            {visibleUsers.map((user) => (
              <UserAvatar
                key={user.id}
                user={user}
                outlineColor={user.color}
                className="border-2"
              />
            ))}

            {additionalUsersCount > 0 && getMoreUsers(additionalUsersCount)}
          </div>
          <div className="sm:hidden mr-2">
            {getMoreUsers(activeUsers.length)}
          </div>
        </>
      )
    );
  };

  const title = props.viewName
    ? `${props.viewName} - ${props.projectName}`
    : props.projectName;

  return (
    <div className="w-full h-14 border-b shadow-xs">
      <div className="grid grid-cols-3 items-center h-full px-4">
        <div className="flex items-center">
          <WebsiteLogo onLogoClick={props.onLogoClick} />
        </div>

        <div className="flex items-center justify-center overflow-hidden px-2">
          <div className="flex space-x-2 items-center max-w-full">
            <span className="font-medium truncate">{title}</span>
          </div>
        </div>

        <div className="flex items-center justify-end">{getActiveUsers()}</div>
      </div>
    </div>
  );
}
