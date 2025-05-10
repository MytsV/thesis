import { AgGridReact } from "ag-grid-react";
import { ColumnType, ColumnViewModel, RowViewModel } from "@/lib/types";
import {
  AllCommunityModule,
  CellEditingStoppedEvent,
  ColDef,
  ModuleRegistry,
  themeQuartz,
} from "ag-grid-community";
import { Spinner } from "@/components/ui/spinner";
import React, {RefObject, useMemo} from "react";
import { Save } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

ModuleRegistry.registerModules([AllCommunityModule]);

export interface CellEditData {
  columnName: string;
  newValue: any;
  rowId: string;
  rowVersion: number;
}

export interface SimpleTableViewProps {
  ref: RefObject<AgGridReact> | null;
  viewName: string;
  columns: ColumnViewModel[];
  rows: RowViewModel[];
  highlight: Record<string, string>;
  onRowHover: (rowId: string) => void;
  onCellEdit: (data: CellEditData) => void;
  onSave: () => void;
}

function LoadingOverlay() {
  return <Spinner />;
}

export default function SimpleTableView(props: SimpleTableViewProps) {
  const typeParser: Record<ColumnType, (value: any) => string | number> = {
    [ColumnType.STRING]: (value) => value,
    [ColumnType.INT]: (value) => parseInt(value),
    [ColumnType.FLOAT]: (value) => parseFloat(value),
    [ColumnType.BOOLEAN]: (value) => (value ? "True" : "False"),
    [ColumnType.DATETIME]: (value) => new Date(value).toLocaleString(),
  };

  const typeFilter: Record<ColumnType, string> = {
    [ColumnType.STRING]: "agTextColumnFilter",
    [ColumnType.INT]: "agNumberColumnFilter",
    [ColumnType.FLOAT]: "agNumberColumnFilter",
    [ColumnType.BOOLEAN]: "agTextColumnFilter",
    [ColumnType.DATETIME]: "agDateColumnFilter",
  };

  const columnDefs: ColDef[] = useMemo(
    () =>
      props.columns.map((column) => {
        return {
          headerName: column.columnName,
          sortable: true,
          resizable: true,
          editable: true,
          valueGetter: (params) => {
            const value = params.data.data[column.columnName];
            if (column.columnType in typeParser) {
              return typeParser[column.columnType](value);
            }
            return value;
          },
          filter: typeFilter[column.columnType],
        };
      }),
    [props.columns],
  );

  const theme = themeQuartz.withParams({
    accentColor: "var(--color-primary)",
    fontFamily: "inherit",
  });

  const onCellEditingStopped = (event: CellEditingStoppedEvent) => {
    const columnName = event.column.getColDef().headerName;
    if (!columnName) {
      console.error("Column name is undefined");
      return;
    }
    props.onCellEdit({
      rowId: event.data.id,
      columnName,
      newValue: event.newValue,
      rowVersion: event.data.version,
    });
  };

  return (
    <div className="w-full h-full space-y-4">
      <div className="flex space-x-2 items-center">
        <h1 className="font-medium text-xl">{props.viewName}</h1>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="cursor-pointer" onClick={props.onSave}>
              <Save />
            </TooltipTrigger>
            <TooltipContent>Save current filters and sorting</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <AgGridReact
        ref={props.ref}
        columnDefs={columnDefs}
        rowData={props.rows}
        loadingOverlayComponent={LoadingOverlay}
        theme={theme}
        pagination={true}
        paginationAutoPageSize={true}
        getRowStyle={(params) => {
          const highlight = props.highlight[params.data.id];
          if (highlight) {
            return {
              border: `2px solid ${highlight}`,
              backgroundColor: `${highlight}10`,
            };
          }
        }}
        onCellEditingStopped={onCellEditingStopped}
        onSortChanged={(event) => {
          event.columns?.forEach((column) => {
            console.log(column.getSort());
          });
        }}
        onFilterChanged={(event) => {
          console.log(event.api.getFilterModel());
          console.log(event.api.getColumnState());
        }}
        onCellMouseOver={(event) => {
          props.onRowHover(event.data.id);
        }}
      />
    </div>
  );
}
