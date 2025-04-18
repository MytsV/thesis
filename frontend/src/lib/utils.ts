import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const base = 1000;
  const suffixes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const unitIndex = Math.floor(Math.log(Math.abs(bytes)) / Math.log(base));
  const safeUnitIndex = Math.min(unitIndex, suffixes.length - 1);
  const value = bytes / Math.pow(base, safeUnitIndex);
  const prefix = bytes < 0 ? "-" : "";

  return `${prefix}${Math.abs(value).toFixed(2)} ${suffixes[safeUnitIndex]}`;
}
