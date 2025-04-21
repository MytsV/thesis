import { UserViewModel } from "@/lib/types";
import React from "react";
import { cn } from "@/lib/utils";

export interface UserAvatarProps {
  user: UserViewModel;
  className?: string;
  outlineColor?: string;
}

export default function UserAvatar({
  user,
  className,
  outlineColor,
}: UserAvatarProps) {
  const borderStyle = outlineColor
    ? { borderColor: outlineColor, borderWidth: "2px" }
    : {};

  return (
    <div
      className={cn(
        "flex w-10 h-10 rounded-full bg-background border shadow-xs items-center justify-center cursor-pointer",
        className,
      )}
      style={borderStyle}
    >
      {user.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt={`${user.username}'s avatar`}
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        user.username[0].toUpperCase()
      )}
    </div>
  );
}
