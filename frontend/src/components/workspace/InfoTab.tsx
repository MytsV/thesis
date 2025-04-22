import { DetailedProjectViewModel } from "@/lib/types";
import {
  Clock,
  LucideIcon,
  Text,
  User,
  File as FileIcon,
  X,
  Download,
} from "lucide-react";
import React from "react";

export interface InfoTabProps {
  project: DetailedProjectViewModel;
  onFileDownload: (fileName: string, relativePath: string) => void;
}

interface FieldDescriptionProps {
  icon: LucideIcon;
  title: string;
}

function FieldDescription(props: FieldDescriptionProps) {
  return (
    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
      <props.icon className="w-4 h-4" />
      <span>{props.title}</span>
    </div>
  );
}

function formatDate(date: Date): string {
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function InfoTab({ project, onFileDownload }: InfoTabProps) {
  const displayFiles = () => {
    return project.files.map((file) => {
      return (
        <div
          key={file.id}
          className="flex items-center justify-between w-full space-y-2"
        >
          <div className="flex flex-row items-center space-x-2 min-w-0 flex-1">
            <FileIcon className="flex-shrink-0 h-5 w-5" />
            <span className="text-sm truncate overflow-hidden">
              {file.name}
            </span>
          </div>
          <div
            className="p-2 rounded-md hover:bg-gray-100 cursor-pointer"
            onClick={() => onFileDownload(file.name, file.relativePath)}
          >
            <Download className="flex-shrink-0 h-5 w-5" />
          </div>
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col space-y-4">
      <h1 className="font-medium text-xl">Info</h1>
      <div>
        <FieldDescription icon={Text} title="Title" />
        <p>{project.title}</p>
      </div>
      {project.description && (
        <div>
          <FieldDescription icon={Text} title="Description" />
          <p>{project.description}</p>
        </div>
      )}
      <div>
        <FieldDescription icon={Clock} title="Created At" />
        <p>{formatDate(new Date(project.createdAt))}</p>
      </div>
      <div>
        <FieldDescription icon={User} title="Author" />
        <p>{project.owner.username}</p>
      </div>
      <h1 className="text-xl font-medium">Files</h1>
      {displayFiles()}
    </div>
  );
}
