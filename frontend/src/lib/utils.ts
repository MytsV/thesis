import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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
