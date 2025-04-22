import { ActiveUserViewModel } from "@/lib/types";
import UserAvatar from "@/components/common/UserAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface UsersTabProps {
  users: ActiveUserViewModel[];
  canInvite: boolean;
  inviteUsername: string;
  setInviteUsername: (username: string) => void;
  onInviteClick?: () => void;
}

export default function UsersTab(props: UsersTabProps) {
  return (
    <div className="flex flex-col space-y-4">
      <h1 className="text-xl font-medium">Sharing</h1>
      {props.canInvite && (
        <>
          <Input
            placeholder="Username"
            value={props.inviteUsername}
            onChange={(event) => props.setInviteUsername(event.target.value)}
          />
          <Button onClick={props.onInviteClick}>Invite</Button>
        </>
      )}
      {props.users.map((user) => (
        <div key={user.id} className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <UserAvatar user={user} className="cursor-auto" />
            <span className="text-sm font-medium">{user.username}</span>
          </div>
          {user.color && (
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: user.color }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
