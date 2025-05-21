import {
  ActiveUserViewModel,
  FileViewModel,
  ViewType,
  ViewViewModel,
} from "@/lib/types";
import React, { useCallback, useState } from "react";
import ViewsTab, { ViewTypeMeta } from "@/components/workspace/ViewsTab";
import { listViews } from "@/lib/client-api";
import { useQuery } from "@tanstack/react-query";
import CreateSimpleTableViewDialog from "@/pages/workspace/CreateSimpleTableViewPage";

interface ViewsTabPageProps {
  projectId: string;
  files: FileViewModel[];
  onViewClick: (view: ViewViewModel) => void;
  currentView: ViewViewModel | null;
  activeUsers: ActiveUserViewModel[];
}

export default function ViewsTabPage(props: ViewsTabPageProps) {
  const [openViewType, setOpenViewType] = useState<ViewType | null>(null);

  const viewTypesMeta: ViewTypeMeta[] = [
    {
      type: ViewType.SIMPLE_TABLE,
      name: "Simple Table",
      icon: <span>📑</span>,
    },
  ];

  const viewsQuery = useCallback(async () => {
    const response = await listViews(props.projectId);
    return response.views;
  }, [props.projectId]);

  const {
    data: views,
    error: viewsError,
    isFetching: viewsLoading,
  } = useQuery<ViewViewModel[]>({
    queryKey: ["views", props.projectId],
    queryFn: viewsQuery,
  });

  const groupUsersByViewId = (users: ActiveUserViewModel[]) => {
    const result: Record<string, ActiveUserViewModel[]> = {};

    users.forEach((user) => {
      if (user.current_view_id) {
        if (!result[user.current_view_id]) {
          result[user.current_view_id] = [];
        }

        result[user.current_view_id].push(user);
      }
    });

    return result;
  };

  return (
    <>
      <CreateSimpleTableViewDialog
        availableFiles={props.files}
        projectId={props.projectId}
        openViewType={openViewType}
        setOpenViewType={setOpenViewType}
      />
      <ViewsTab
        onCreateClick={(viewType) => setOpenViewType(viewType)}
        views={views ?? []}
        viewTypesMeta={viewTypesMeta}
        onViewClick={props.onViewClick}
        currentViewId={props.currentView?.id}
        users={groupUsersByViewId(props.activeUsers)}
      />
    </>
  );
}
