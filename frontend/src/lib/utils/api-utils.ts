export function getApiUrl(): string {
  if (typeof window === "undefined") {
    return process.env.API_URL!;
  }
  return process.env.NEXT_PUBLIC_API_URL!;
}

export function buildQueryString(params: Record<string, any>): string {
  // Filter out undefined and null values
  const validParams = Object.entries(params).filter(
    ([_, value]) => value !== undefined && value !== null,
  );

  // Return empty string if no valid params
  if (validParams.length === 0) return "";

  // Build query string with valid params, converting keys to snake_case
  return (
    "?" +
    validParams
      .map(([key, value]) => {
        // Convert camelCase or PascalCase to snake_case
        const snakeKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
        // Remove leading underscore if present
        const finalKey = snakeKey.startsWith("_")
          ? snakeKey.substring(1)
          : snakeKey;
        return `${encodeURIComponent(finalKey)}=${encodeURIComponent(value)}`;
      })
      .join("&")
  );
}
