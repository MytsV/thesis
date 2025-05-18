import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { FilterModel, SortModelItem } from "@/lib/types";
import { Column } from "ag-grid-community";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";

  const base = 1000;
  const suffixes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const unitIndex = Math.floor(Math.log(Math.abs(bytes)) / Math.log(base));
  const safeUnitIndex = Math.min(unitIndex, suffixes.length - 1);
  const value = bytes / Math.pow(base, safeUnitIndex);
  const prefix = bytes < 0 ? "-" : "";

  // Show decimal places only for values >= 1 KB and use appropriate precision
  const precision = safeUnitIndex === 0 ? 0 : 1; // 0 decimals for bytes, 1 for KB and up
  const formattedValue = Math.abs(value).toFixed(precision);

  // Remove unnecessary trailing zeros after decimal point
  const cleanValue = formattedValue.replace(/\.0$/, "");

  return `${prefix}${cleanValue} ${suffixes[safeUnitIndex]}`;
}

export function transformFilterModel(
  filterModel: FilterModel,
  columns: Column[] | null,
): Record<string, unknown> {
  const transformedFilterModel: FilterModel = {};

  Object.entries(filterModel).forEach(([colId, filter]) => {
    const column = columns?.find((col) => col.getColId() === colId);
    const columnName = column?.getColDef().headerName;

    if (columnName) {
      transformedFilterModel[columnName] = filter;
    }
  });

  return transformedFilterModel;
}

export function getSortModel(columns: Column[] | null): SortModelItem[] {
  const sortModel: SortModelItem[] = [];

  columns?.forEach((column) => {
    const sort = column.getSort();
    const name = column.getColDef().headerName;
    if (sort && name) {
      sortModel.push({
        columnName: name,
        sortDirection: sort,
      });
    }
  });

  return sortModel;
}
