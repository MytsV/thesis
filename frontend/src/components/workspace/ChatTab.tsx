import React, { useState } from "react";
import UserAvatar from "@/components/common/UserAvatar";
import {
  ChatMessageViewModel,
  UserViewModel,
  ViewViewModel,
} from "@/lib/types";
import { Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface ChatBubbleProps {
  message: ChatMessageViewModel;
  isOwnMessage?: boolean;
  onViewClicked: (view: ViewViewModel) => void;
}

const ChatBubble = ({
  message,
  isOwnMessage = false,
  onViewClicked,
}: ChatBubbleProps) => {
  const userViewModel: UserViewModel = {
    id: message.user.id,
    username: message.user.username,
  };

  const handleViewClick = () => {
    if (!message.view) return;
    onViewClicked({
      id: message.view.id,
      name: message.view.name,
      viewType: message.view.viewType,
    });
  };

  return (
    <div
      className={`flex gap-3 max-w-3xl ${isOwnMessage ? "flex-row-reverse ml-auto" : "mr-auto"}`}
    >
      <UserAvatar user={userViewModel} />

      <div
        className={`flex flex-col gap-1 ${isOwnMessage ? "items-end" : "items-start"}`}
      >
        <div
          className={`flex items-center gap-2 text-xs text-muted-foreground ${isOwnMessage ? "flex-row-reverse" : ""}`}
        >
          <div
            className={`flex items-center gap-1 ${isOwnMessage ? "flex-row-reverse" : ""}`}
          >
            <span className="font-medium text-foreground">
              {isOwnMessage ? "You" : message.user.username}
            </span>
            {message.view && (
              <>
                <span className="text-muted-foreground/60">•</span>
                <button
                  onClick={handleViewClick}
                  className="font-medium text-foreground hover:text-foreground/80 transition-colors cursor-pointer"
                >
                  {message.view.name}
                </button>
              </>
            )}
          </div>
          <span>{new Date(message.createdAt).toLocaleString()}</span>
        </div>

        <div
          className={`
          px-3 py-2 rounded-lg max-w-md break-words
          ${
            isOwnMessage
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground"
          }
        `}
        >
          {message.content}
        </div>
      </div>
    </div>
  );
};

const MessageRow = ({
  index,
  style,
  data,
}: {
  index: number;
  style: React.CSSProperties;
  data: any;
}) => {
  const { messages, currentUserId, onViewClicked } = data;
  const message = messages[index];
  const isOwnMessage = message.user.id === currentUserId;

  return (
    <div style={style}>
      <ChatBubble
        message={message}
        isOwnMessage={isOwnMessage}
        onViewClicked={onViewClicked}
      />
    </div>
  );
};

const MessageInput = ({
  onSendMessage,
}: {
  onSendMessage: (message: string) => void;
}) => {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-center gap-2 pb-4">
      <Textarea
        cols={2}
        value={message}
        onKeyDown={handleKeyDown}
        onChange={(event) => setMessage(event.target.value)}
      />
      <button
        onClick={handleSend}
        disabled={!message.trim()}
        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 w-10 cursor-pointer"
      >
        <Send className="h-4 w-4" />
      </button>
    </div>
  );
};

export interface ChatTabProps {
  currentUserId: number;
  messages: ChatMessageViewModel[];
  onViewClicked: (view: ViewViewModel) => void;
  onSendMessage: (message: string) => void;
}

/**
 * Main views tab component displaying list of views and create button
 */
export default function ChatTab({
  currentUserId,
  messages,
  onViewClicked,
  onSendMessage,
}: ChatTabProps) {
  return (
    <div className="flex flex-col space-y-4 h-full">
      <h1 className="text-xl flex-none font-medium">Chat</h1>
      <div className="flex-1 space-y-4">
        {messages.map((message) => {
          return (
            <ChatBubble
              message={message}
              onViewClicked={onViewClicked}
              isOwnMessage={message.user.id === currentUserId}
              key={message.id}
            />
          );
        })}
      </div>
      <MessageInput onSendMessage={onSendMessage} />
    </div>
  );
}
