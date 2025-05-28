import {
  ActiveUserViewModel,
  ColumnViewModel,
  FilterModel,
  RowViewModel,
  SortModelItem,
  UserViewModel,
  ViewViewModel,
} from "@/lib/types";
import React, { useCallback, useEffect, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  getViewFilterModel,
  getViewSortModel,
  listViewColumns,
  listViewRows,
  updateCell,
  UpdateCellRequest,
  updateViewFilterModel,
  updateViewSortModel,
} from "@/lib/client-api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { GridApi, GridReadyEvent } from "ag-grid-community";
import { toast } from "sonner";
import SimpleTableView, {
  CellEditData,
} from "@/components/workspace/SimpleTableView";
import { getSortModel, transformFilterModel } from "@/lib/utils/ui-utils";
import { Spinner } from "@/components/ui/spinner";

interface SimpleTableViewPageProps {
  view: ViewViewModel;
  onFocusChange: (rowId: string) => void;
  activeUsers: ActiveUserViewModel[];
  currentUser: UserViewModel;
  onOptionsChange: (
    filterModel: FilterModel,
    sortModel: SortModelItem[],
  ) => void;
}

export default function SimpleTableViewPage(props: SimpleTableViewPageProps) {
  const gridRef = useRef<AgGridReact>(null);

  const columnsQuery = useCallback(async () => {
    const response = await listViewColumns(props.view.id);
    return response.columns;
  }, [props.view.id]);

  const {
    data: columns,
    error: columnsError,
    isFetching: columnsLoading,
  } = useQuery<ColumnViewModel[]>({
    queryKey: ["columns", props.view.fileId],
    queryFn: columnsQuery,
  });

  const rowsQuery = useCallback(async () => {
    const response = await listViewRows(props.view.id);
    return response.rows;
  }, [props.view.id]);

  const {
    data: rows,
    error: rowsError,
    isFetching: rowsLoading,
  } = useQuery<RowViewModel[]>({
    queryKey: ["rows", props.view.fileId],
    queryFn: rowsQuery,
  });

  const sortModelQuery = useCallback(async () => {
    const response = await getViewSortModel(props.view.id);
    return response.sortModel;
  }, [props.view.id]);

  const {
    data: sortModel,
    error: sortModelError,
    isFetching: sortModelLoading,
  } = useQuery<SortModelItem[] | null>({
    queryKey: ["sortModel", props.view.id],
    queryFn: sortModelQuery,
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  const filterModelQuery = useCallback(async () => {
    const response = await getViewFilterModel(props.view.id);
    return response.filterModel;
  }, [props.view.id]);

  const {
    data: filterModel,
    error: filterModelError,
    isFetching: filterModelLoading,
  } = useQuery<FilterModel | null>({
    queryKey: ["filterModel", props.view.id],
    queryFn: filterModelQuery,
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  const updateGridState = useCallback(
    (api: GridApi) => {
      const columns = api.getColumns();

      if (filterModel) {
        const transformedFilterModel: FilterModel = {};

        Object.entries(filterModel).forEach(([columnName, filter]) => {
          const column = columns?.find(
            (col) => col.getColDef().headerName === columnName,
          );
          const colId = column?.getColId();

          if (colId) {
            transformedFilterModel[colId] = filter;
          }
        });

        api.setFilterModel(transformedFilterModel);
      }

      if (sortModel) {
        const transformedSortModel = sortModel.map((item) => {
          const column = columns?.find(
            (col) => col.getColDef().headerName === item.columnName,
          );
          return {
            colId: column?.getColId() ?? "",
            sort: item.sortDirection,
          };
        });

        api.resetColumnState();

        api.applyColumnState({
          state: transformedSortModel,
          applyOrder: true,
        });
      }
    },
    [sortModel, filterModel],
  );

  useEffect(() => {
    const api = gridRef.current?.api;
    if (!api) return;

    updateGridState(api);
  }, [filterModel, sortModel]);

  const onGridReady = (event: GridReadyEvent) => {
    updateGridState(event.api);
  };

  const updateCellMutation = useMutation({
    mutationFn: (data: UpdateCellRequest) => {
      return updateCell(data);
    },
    onError: (error: Error) => {
      toast.error("Couldn't update the cell", { description: error.message });
    },
  });

  const onCellEdit = (data: CellEditData) => {
    updateCellMutation.mutate({
      value: data.newValue,
      viewId: props.view.id,
      rowId: data.rowId,
      columnName: data.columnName,
      rowVersion: data.rowVersion,
    });
  };

  const currentRowId = useRef<string | null>(null);

  const onRowClicked = async (rowId: string) => {
    if (rowId === currentRowId.current) return;
    currentRowId.current = rowId;
    props.onFocusChange(rowId);
  };

  const updateSortModelMutation = useMutation({
    mutationFn: (sortModel: SortModelItem[]) =>
      updateViewSortModel(props.view.id, sortModel),
    onError: (error: Error) => {
      toast.error("Couldn't update the sort model", {
        description: error.message,
      });
    },
    onSuccess: () => {
      toast("Sort model updated successfully");
    },
  });

  const updateFilterModelMutation = useMutation({
    mutationFn: (filterModel: FilterModel) =>
      updateViewFilterModel(props.view.id, filterModel),
    onError: (error: Error) => {
      toast.error("Couldn't update the filter model", {
        description: error.message,
      });
    },
    onSuccess: () => {
      toast("Filter model updated successfully");
    },
  });

  const onSave = () => {
    const api = gridRef.current?.api;
    if (!api) return;
    const filterModel = api.getFilterModel();
    const columns = api.getColumns();

    updateFilterModelMutation.mutate(
      transformFilterModel(filterModel, columns),
    );
    updateSortModelMutation.mutate(getSortModel(columns));
  };

  const onOptionsChange = () => {
    const api = gridRef.current?.api;
    if (!api) return;

    const filterModel = api.getFilterModel();
    const columns = api.getColumns();

    props.onOptionsChange(
      transformFilterModel(filterModel, columns),
      getSortModel(columns),
    );
  };

  if (!columns || !rows) {
    return <Spinner />;
  }

  const highlight: Record<string, string> = {};
  props.activeUsers.forEach((user) => {
    if (
      user.id !== props.currentUser.id &&
      user.focused_row_id &&
      user.color &&
      user.current_view_id === props.view.id
    ) {
      highlight[user.focused_row_id] = user.color;
    }
  });

  const isSavable =
    !updateSortModelMutation.isPending && !updateFilterModelMutation.isPending;

  return (
    <SimpleTableView
      onSave={isSavable ? onSave : undefined}
      viewName={props.view.name}
      ref={gridRef}
      columns={columns}
      rows={rows}
      highlight={highlight}
      onRowHover={onRowClicked}
      onCellEdit={onCellEdit}
      onGridReady={onGridReady}
      onOptionsChange={onOptionsChange}
    />
  );
}
