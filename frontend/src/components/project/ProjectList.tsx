import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils/ui-utils";
import { ProjectListTabs } from "@/lib/types";

interface ProjectListPaginationProps {
  onPageNext: () => void;
  onPagePrevious: () => void;
  currentPage: number;
  hasNextPage: boolean;
}

export interface ProjectListProps extends ProjectListPaginationProps {
  children?: React.ReactNode;
  onTabChange: (tab: ProjectListTabs) => void;
  onCreateProject: () => void;
  isLoading?: boolean;
}

function ProjectListPagination(props: ProjectListPaginationProps) {
  const isPreviousDisabled = props.currentPage === 1;
  const isNextDisabled = !props.hasNextPage;

  return (
    <div className="flex flex-row items-center justify-center mt-auto">
      <div
        className={`flex flex-row space-x-1 items-center ${isPreviousDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        onClick={isPreviousDisabled ? undefined : props.onPagePrevious}
      >
        <ChevronLeft className="h-4 w-4 flex-shrink-0" />
        <span className="text-sm">Previous</span>
      </div>
      <Card className="py-2 px-4 rounded-sm mx-10">{props.currentPage}</Card>
      <div
        className={`flex flex-row space-x-1 items-center ${isNextDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        onClick={isNextDisabled ? undefined : props.onPageNext}
      >
        <span className="text-sm">Next</span>
        <ChevronRight className="h-4 w-4 flex-shrink-0" />
      </div>
    </div>
  );
}

interface CreateProjectButtonProps {
  onClick: () => void;
  className?: string;
}

function CreateProjectButton(props: CreateProjectButtonProps) {
  return (
    <button
      className={cn(
        "bg-foreground hover:bg-primary/90 shadow-sm text-secondary p-4 rounded-full cursor-pointer",
        props.className,
      )}
      onClick={props.onClick}
    >
      <Plus className="w-4 h-4" />
    </button>
  );
}

export default function ProjectList(props: ProjectListProps) {
  const getChildren = () => {
    if (props.isLoading) {
      return (
        <div className="flex flex-1 items-center justify-center">
          <Spinner />
        </div>
      );
    }
    if (React.Children.count(props.children) === 0) {
      return (
        <div className="flex flex-1 items-center justify-center">
          <span className="text-sm">Nothing found</span>
        </div>
      );
    }
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {props.children}
        </div>
        <ProjectListPagination
          onPageNext={props.onPageNext}
          onPagePrevious={props.onPagePrevious}
          currentPage={props.currentPage}
          hasNextPage={props.hasNextPage}
        />
      </>
    );
  };

  return (
    <div className="flex grow flex-col w-full h-full space-y-3">
      <h1 className="text-3xl font-medium">Dashboard</h1>
      <Tabs defaultValue={ProjectListTabs.MINE} className="w-full">
        <TabsList className="w-full">
          <TabsTrigger
            className="cursor-pointer"
            value={ProjectListTabs.MINE}
            onClick={() => props.onTabChange(ProjectListTabs.MINE)}
          >
            My Projects
          </TabsTrigger>
          <TabsTrigger
            className="cursor-pointer"
            value={ProjectListTabs.SHARED}
            onClick={() => props.onTabChange(ProjectListTabs.SHARED)}
          >
            Shared Projects
          </TabsTrigger>
        </TabsList>
      </Tabs>
      {getChildren()}
      <CreateProjectButton
        onClick={props.onCreateProject}
        className="fixed right-4 bottom-4"
      />
    </div>
  );
}
