import {
  LoginCredentials,
  PaginatedResponse,
  ProjectViewModel,
  RegisterData,
  UserLoginViewModel,
  UserViewModel,
} from "@/lib/types";
import axios, { AxiosProgressEvent } from "axios";
import { getApiUrl } from "@/lib/utils/api-utils";

function buildQueryString(params: Record<string, any>): string {
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

export async function registerUser(
  data: RegisterData,
): Promise<UserLoginViewModel> {
  const response = await fetch(`${getApiUrl()}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Registration failed");
  }

  return response.json();
}

export async function getUser(): Promise<UserViewModel> {
  const response = await fetch(`${getApiUrl()}/auth/validate`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to fetch user");
  }

  return response.json();
}

export async function getUserClient(): Promise<UserViewModel | undefined> {
  try {
    const user = await getUser();
    return user;
  } catch (error) {
    return undefined;
  }
}

export interface ListProjectsRequest {
  page?: number;
  pageSize?: number;
}

export async function listProjects({
  page,
  pageSize,
}: ListProjectsRequest): Promise<PaginatedResponse<ProjectViewModel>> {
  const response = await fetch(
    `${getApiUrl()}/projects${buildQueryString({ page, pageSize })}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to fetch projects");
  }

  return response.json();
}

export async function listSharedProjects({
  page,
  pageSize,
}: ListProjectsRequest): Promise<PaginatedResponse<ProjectViewModel>> {
  const response = await fetch(
    `${getApiUrl()}/projects/shared-with-me${buildQueryString({ page, pageSize })}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to fetch projects");
  }

  return response.json();
}

export interface CreateProjectRequest {
  formData: FormData;
  onUploadProgress: (progressEvent: AxiosProgressEvent) => void;
}

export async function createProject(
  request: CreateProjectRequest,
): Promise<ProjectViewModel> {
  try {
    const response = await axios.post(
      `${getApiUrl()}/projects/`,
      request.formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
        onUploadProgress: request.onUploadProgress,
      },
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    } else {
      throw new Error("An unexpected error occurred");
    }
  }
}

export async function listSharedUsers(
  projectId: string,
): Promise<UserViewModel[]> {
  const response = await fetch(
    `${getApiUrl()}/projects/${projectId}/shared-users`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to fetch shared users");
  }

  return response.json();
}

export async function shareProject(
  projectId: string,
  username: string,
): Promise<void> {
  const response = await fetch(
    `${getApiUrl()}/projects/${projectId}/invite${buildQueryString({ username })}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to share project");
  }
}
