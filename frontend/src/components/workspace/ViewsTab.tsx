import { Button } from "@/components/ui/button";
import { ActiveUserViewModel, ViewType, ViewViewModel } from "@/lib/types";
import React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils/ui-utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface ViewTypeMeta {
  type: ViewType;
  name: string;
  icon: React.ReactNode;
}

export interface ViewsTabProps {
  onCreateClick: (viewType: ViewType) => void;
  currentViewId?: string;
  views: ViewViewModel[];
  users?: Record<string, ActiveUserViewModel[]>;
  viewTypesMeta: ViewTypeMeta[];
  onViewClick: (viewId: string) => void;
}

interface ViewCardProps {
  view: ViewViewModel;
  users?: ActiveUserViewModel[];
  isActive?: boolean;
  icon?: React.ReactNode;
  onClick: () => void;
}

/**
 * Renders a single view card with optional active state and connected users
 */
function ViewCard({ view, icon, users, isActive, onClick }: ViewCardProps) {
  return (
    <div
      className={cn(
        "flex space-x-2 p-2 cursor-pointer rounded-md justify-between items-center",
        isActive && "border shadow-sm",
      )}
      onClick={onClick}
    >
      <div className="flex space-x-2 truncate">
        {icon}
        <h2>{view.name}</h2>
      </div>

      {users && users.length > 0 && (
        <div className="flex space-x-2">
          {users.map((user) => (
            <UserAvatar key={user.id} user={user} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * User avatar component with tooltip showing username
 */
function UserAvatar({ user }: { user: ActiveUserViewModel }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: user.color }}
          />
        </TooltipTrigger>
        <TooltipContent>{user.username}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Create view button with popover menu
 */
function CreateViewButton({
  viewTypesMeta,
  onCreateClick,
}: {
  viewTypesMeta: ViewTypeMeta[];
  onCreateClick: (viewType: ViewType) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button className="w-full">Create</Button>
      </PopoverTrigger>
      <PopoverContent className="popover-content-width-same-as-its-trigger">
        <div className="flex flex-col space-y-2">
          {viewTypesMeta.map((meta) => (
            <Button
              key={meta.type}
              variant="outline"
              className="w-full justify-start"
              onClick={() => onCreateClick(meta.type)}
            >
              {meta.icon}
              <span>{meta.name}</span>
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Main views tab component displaying list of views and create button
 */
export default function ViewsTab({
  views,
  viewTypesMeta,
  users = {},
  currentViewId,
  onViewClick,
  onCreateClick,
}: ViewsTabProps) {
  return (
    <div className="flex flex-col space-y-4">
      <h1 className="text-xl font-medium">Views</h1>

      <CreateViewButton
        viewTypesMeta={viewTypesMeta}
        onCreateClick={onCreateClick}
      />

      {views.map((view) => (
        <ViewCard
          key={view.id}
          view={view}
          icon={viewTypesMeta.find((meta) => meta.type === view.viewType)?.icon}
          users={users[view.id]}
          isActive={currentViewId === view.id}
          onClick={() => onViewClick(view.id)}
        />
      ))}
    </div>
  );
}
