import {
  ActiveUserViewModel,
  FilterModel,
  SortModelItem,
  UserViewModel,
  ViewType,
  ViewViewModel,
} from "@/lib/types";
import React from "react";
import SimpleTableViewPage from "@/pages/workspace/SimpleTableViewPage";
import DiscreteColumnChartViewPage from "@/pages/workspace/DiscreteColumnChartViewPage";

interface CurrentViewProps {
  view: ViewViewModel | null;
  onFocusChange: (rowId: string) => void;
  activeUsers: ActiveUserViewModel[];
  currentUser: UserViewModel;
  onOptionsChange: (
    filterModel: FilterModel,
    sortModel: SortModelItem[],
  ) => void;
}

export default function CurrentView(props: CurrentViewProps) {
  if (!props.view) {
    return <div className="text-sm">Please select a view</div>;
  }

  switch (props.view.viewType) {
    case ViewType.SIMPLE_TABLE:
      return (
        <SimpleTableViewPage
          onOptionsChange={props.onOptionsChange}
          view={props.view}
          onFocusChange={props.onFocusChange}
          activeUsers={props.activeUsers}
          currentUser={props.currentUser}
        />
      );
    case ViewType.DISCRETE_COLUMN_CHART:
      return <DiscreteColumnChartViewPage view={props.view} />;
    default:
      return <div className="text-sm">Unknown view type</div>;
  }
}
