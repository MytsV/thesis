import { AgGridReact } from "ag-grid-react";
import { ColumnType, ColumnViewModel, RowViewModel } from "@/lib/types";
import {
  AllCommunityModule,
  ColDef,
  ModuleRegistry,
  themeQuartz,
} from "ag-grid-community";
import { Spinner } from "@/components/ui/spinner";
import { useMemo } from "react";

ModuleRegistry.registerModules([AllCommunityModule]);

export interface SimpleTableViewProps {
  columns: ColumnViewModel[];
  rows: RowViewModel[];
  highlight: Record<string, string>;
  onRowHover: (rowId: string) => void;
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

  return (
    <div className="w-full h-full">
      <AgGridReact
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
        onCellMouseOver={(event) => {
          props.onRowHover(event.data.id);
        }}
      />
    </div>
  );
}
