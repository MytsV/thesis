import {
  ChatMessageViewModel,
  UserViewModel,
  ViewViewModel,
} from "@/lib/types";
import React, { useCallback } from "react";
import { listChatMessages } from "@/lib/client-api";
import { useQuery } from "@tanstack/react-query";
import ChatTab from "@/components/workspace/ChatTab";

interface ChatTabPageProps {
  projectId: string;
  currentUser: UserViewModel;
  onViewClick: (view: ViewViewModel) => void;
  onSendMessage: (message: string) => void;
}

export default function ChatTabPage(props: ChatTabPageProps) {
  const messagesQuery = useCallback(async () => {
    const response = await listChatMessages(props.projectId);
    return response;
  }, [props.projectId]);

  const {
    data: messages,
    error: messagesError,
    isFetching: messagesLoading,
  } = useQuery<ChatMessageViewModel[]>({
    queryKey: ["messages", props.projectId],
    queryFn: messagesQuery,
  });

  return (
    <ChatTab
      onSendMessage={props.onSendMessage}
      onViewClicked={props.onViewClick}
      messages={messages ?? []}
      currentUserId={props.currentUser.id}
    />
  );
}
