import { LoginCredentials, UserLoginViewModel } from "@/lib/types";

export function getApiUrl(): string {
  if (typeof window === "undefined") {
    return process.env.API_URL!;
  }
  return process.env.NEXT_PUBLIC_API_URL!;
}

export async function loginUser(
  credentials: LoginCredentials,
): Promise<UserLoginViewModel> {
  const response = await fetch(`${getApiUrl()}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Login failed");
  }

  return response.json();
}

export async function logoutUser(): Promise<{ message: string }> {
  const response = await fetch(`${getApiUrl()}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });

  return response.json();
}
