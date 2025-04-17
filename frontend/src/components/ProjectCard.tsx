import { Card } from "@/components/ui/card";
import { ChevronRight, Circle, Dot, Share2, User } from "lucide-react";

export interface ProjectCardProps {
  title: string;
  description?: string;
  isLive?: boolean;
  liveCollaboratorsCount?: number;
  author?: string;
  onClick: () => void;
}

export default function ProjectCard(props: ProjectCardProps) {
  return (
    <Card
      className="w-full h-52 p-4 gap-2 cursor-pointer relative"
      onClick={props.onClick}
    >
      <div className="flex flex-row items-center space-x-2">
        <div className="font-medium text-lg truncate">{props.title}</div>
        {props.isLive && <Share2 className="h-4 w-4 flex-shrink-0" />}
      </div>
      {props.liveCollaboratorsCount && (
        <div className="flex flex-row items-center space-x-2">
          <Circle
            fill="var(--success)"
            className="h-3 w-3 text-success flex-shrink-0"
          />
          <span className="truncate">
            {props.liveCollaboratorsCount} currently viewing
          </span>
        </div>
      )}
      {props.author && (
        <div className="flex flex-row items-center space-x-2">
          <User className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">{props.author}</span>
        </div>
      )}
      <div className="text-sm line-clamp-2 overflow-hidden">
        {props.description}
      </div>
      <ChevronRight className="absolute right-4 bottom-4 flex-shrink-0" />
    </Card>
  );
}
