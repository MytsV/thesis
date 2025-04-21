import React, { useEffect, useState } from "react";
import {
  ChevronLeft,
  FileChartColumn,
  Info,
  LucideIcon,
  Menu,
  MessageSquare,
  Users,
} from "lucide-react";
import { UserViewModel } from "@/lib/types";
import UserAvatar from "@/components/common/UserAvatar";

type TabType = "info" | "users" | "views" | "chat";

export interface WorkspaceSidebarProps {
  infoTab: React.ReactNode;
  usersTab: React.ReactNode;
  viewsTab: React.ReactNode;
  chatTab: React.ReactNode;
  user: UserViewModel;
}

interface SidebarIconProps {
  Icon: LucideIcon;
  onClick: () => void;
  isActive: boolean;
}

function SidebarIcon(props: SidebarIconProps) {
  return (
    <button
      className={`p-2 rounded-md hover:bg-gray-100 transition-colors ${props.isActive ? "bg-gray-200 text-gray-900" : "text-gray-600"}`}
      onClick={props.onClick}
    >
      <props.Icon size={20} />
    </button>
  );
}

export default function WorkspaceSidebar(props: WorkspaceSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("info");
  const [contentVisible, setContentVisible] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (isExpanded) {
      timeoutId = setTimeout(() => {
        setContentVisible(true);
      }, 100);
    } else {
      setContentVisible(false);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isExpanded]);

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  const getTabContent = () => {
    switch (activeTab) {
      case "info":
        return props.infoTab;
      case "users":
        return props.usersTab;
      case "views":
        return props.viewsTab;
      case "chat":
        return props.chatTab;
      default:
        return <div></div>;
    }
  };

  return (
    <div className="flex h-full">
      <div className="flex flex-col justify-between h-full py-4 w-16 border-r">
        <div className="flex flex-col items-center space-y-4">
          <SidebarIcon
            onClick={toggleSidebar}
            Icon={isExpanded ? ChevronLeft : Menu}
            isActive={false}
          />

          <div className="w-full h-px bg-gray-200"></div>

          <SidebarIcon
            Icon={Info}
            onClick={() => {
              setActiveTab("info");
              setIsExpanded(true);
            }}
            isActive={isExpanded && activeTab === "info"}
          />

          <SidebarIcon
            Icon={Users}
            onClick={() => {
              setActiveTab("users");
              setIsExpanded(true);
            }}
            isActive={isExpanded && activeTab === "users"}
          />

          <SidebarIcon
            Icon={FileChartColumn}
            onClick={() => {
              setActiveTab("views");
              setIsExpanded(true);
            }}
            isActive={isExpanded && activeTab === "views"}
          />

          <SidebarIcon
            Icon={MessageSquare}
            onClick={() => {
              setActiveTab("chat");
              setIsExpanded(true);
            }}
            isActive={isExpanded && activeTab === "chat"}
          />
        </div>

        <div className="flex flex-col items-center">
          <UserAvatar user={props.user} className="cursor-auto" />
        </div>
      </div>

      <div
        className={`fixed left-16 top-0 h-full bg-white border-l border-gray-200 shadow-sm transition-all duration-300 flex ${
          isExpanded ? "md:w-120 w-[calc(100%-4rem)]" : "w-0"
        }`}
      >
        <div
          className={`w-full h-full transition-opacity duration-50 ${
            contentVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="flex-1 overflow-y-auto h-full p-4">
            {getTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
