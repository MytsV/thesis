export function getApiUrl(): string {
  if (typeof window === "undefined") {
    return process.env.API_URL!;
  }
  return process.env.NEXT_PUBLIC_API_URL!;
}
