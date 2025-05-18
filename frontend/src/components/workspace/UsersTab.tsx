import { ActiveUserViewModel } from "@/lib/types";
import UserAvatar from "@/components/common/UserAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils/ui-utils";
import { Eye } from "lucide-react";

interface UsersTabProps {
  users: ActiveUserViewModel[];
  canInvite: boolean;
  inviteUsername: string;
  setInviteUsername: (username: string) => void;
  onInviteClick?: () => void;
  isLoading?: boolean;
  onUserClick?: (user: ActiveUserViewModel) => void;
  subscriptionUserId?: number;
}

export default function UsersTab(props: UsersTabProps) {
  if (props.isLoading) {
    return (
      <div className="flex flex-col h-full justify-center items-center">
        <Spinner />
      </div>
    );
  }

  const getUserComponent = (user: ActiveUserViewModel) => {
    const isSubscriptionUser = user.id === props.subscriptionUserId;

    const presenceIndicator = isSubscriptionUser ? (
      <Eye className="w-5 h-5" style={{ color: user.color }} />
    ) : (
      <div
        className="w-4 h-4 rounded-full flex items-center justify-center"
        style={{ backgroundColor: user.color }}
      />
    );
    return (
      <div
        key={user.id}
        className={cn(
          "flex justify-between items-center cursor-pointer p-2 rounded-md",
          isSubscriptionUser && "border shadow-sm",
        )}
        onClick={() => props.onUserClick?.(user)}
      >
        <div className="flex items-center space-x-2">
          <UserAvatar user={user} className="cursor-auto" />
          <span className="text-sm font-medium">{user.username}</span>
        </div>
        {user.color && presenceIndicator}
      </div>
    );
  };

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
      <div className="flex flex-col">
        {props.users.map((user) => getUserComponent(user))}
      </div>
    </div>
  );
}
