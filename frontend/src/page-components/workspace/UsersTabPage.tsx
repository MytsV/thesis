import { ActiveUserViewModel, UserViewModel } from "@/lib/types";
import React, { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listSharedUsers, shareProject } from "@/lib/client-api";
import { toast } from "sonner";
import UsersTab from "@/components/workspace/UsersTab";

interface UsersTabPageProps {
  projectId: string;
  activeUsers: ActiveUserViewModel[];
  canInvite: boolean;
  onUserClick: (user: ActiveUserViewModel) => void;
  subscriptionUserId?: number;
}

export default function UsersTabPage({
  projectId,
  activeUsers,
  canInvite,
  onUserClick,
  subscriptionUserId,
}: UsersTabPageProps) {
  const [inviteUsername, setInviteUsername] = useState<string>("");
  const queryClient = useQueryClient();

  const inviteMutation = useMutation({
    mutationFn: () => shareProject(projectId, inviteUsername),
    onSuccess: () => {
      setInviteUsername("");
      queryClient.invalidateQueries({
        queryKey: ["sharedUsers", projectId],
        refetchType: "active",
      });
      toast("User invited successfully");
    },
    onError: (error: Error) => {
      toast.error("Couldn't invite the user", { description: error.message });
    },
  });

  const handleInvite = () => {
    if (inviteUsername.trim()) {
      inviteMutation.mutate();
    }
  };

  const sharedUsersQuery = useCallback(async () => {
    return listSharedUsers(projectId);
  }, [projectId]);

  const {
    data: sharedUsers,
    error: sharedUsersError,
    isLoading: sharedUsersLoading,
  } = useQuery<UserViewModel[]>({
    queryKey: ["sharedUsers", projectId],
    queryFn: sharedUsersQuery,
  });

  const allUsers: ActiveUserViewModel[] = [...activeUsers];
  if (sharedUsers && sharedUsers.length > 0) {
    for (const user of sharedUsers) {
      if (activeUsers.some((activeUser) => activeUser.id === user.id)) {
        continue;
      }
      allUsers.push({
        id: user.id,
        username: user.username,
        avatar_url: user.avatarUrl,
      });
    }
  }

  return (
    <UsersTab
      users={allUsers}
      canInvite={canInvite}
      inviteUsername={inviteUsername}
      setInviteUsername={setInviteUsername}
      onInviteClick={handleInvite}
      isLoading={sharedUsersLoading || inviteMutation.isPending}
      onUserClick={onUserClick}
      subscriptionUserId={subscriptionUserId}
    />
  );
}
