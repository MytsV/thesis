import { ActiveUserViewModel } from "@/lib/types";
import UserAvatar from "@/components/common/UserAvatar";
import { Button } from "@/components/ui/button";

interface UsersTabProps {
  activeUsers: ActiveUserViewModel[];
  canInvite: boolean;
  onInviteClick?: () => void;
}

export default function UsersTab(props: UsersTabProps) {
  return (
    <div className="flex flex-col space-y-4">
      <h1 className="text-xl font-medium">Sharing</h1>
      {props.canInvite && <Button onClick={props.onInviteClick}>Invite</Button>}
      {props.activeUsers.map((user) => (
        <div key={user.id} className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <UserAvatar user={user} className="cursor-auto" />
            <span className="text-sm font-medium">{user.username}</span>
          </div>
          {user.outlineColor && (
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: user.outlineColor }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
