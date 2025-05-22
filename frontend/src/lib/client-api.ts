import {
  ChatMessageViewModel,
  FilterModelResponse,
  ListColumnsResponse,
  ListRowsResponse,
  ListViewsResponse,
  LoginCredentials,
  PaginatedResponse,
  ProjectViewModel,
  RegisterData,
  SortModelItem,
  SortModelResponse,
  UserLoginViewModel,
  UserViewModel,
  SimpleTableViewCreateRequest,
  DiscreteColumnChartViewCreateRequest,
  DiscreteColumnChartViewModel,
} from "@/lib/types";
import axios, { AxiosProgressEvent } from "axios";
import { buildQueryString, getApiUrl } from "@/lib/utils/api-utils";

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
    `${getApiUrl()}/projects/shared${buildQueryString({ page, pageSize })}`,
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

export async function listViews(projectId: string): Promise<ListViewsResponse> {
  const response = await fetch(`${getApiUrl()}/views/project/${projectId}`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to fetch views");
  }

  return response.json();
}

export async function createSimpleTableView(
  projectId: string,
  request: SimpleTableViewCreateRequest,
) {
  const response = await fetch(
    `${getApiUrl()}/views/project/${projectId}/simple-table`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
      credentials: "include",
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to create view");
  }

  return response.json();
}

export async function createDiscreteColumnChartView(
  projectId: string,
  request: DiscreteColumnChartViewCreateRequest,
) {
  const response = await fetch(
    `${getApiUrl()}/views/project/${projectId}/discrete-column-chart`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
      credentials: "include",
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to create view");
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

export async function listViewColumns(
  viewId: string,
): Promise<ListColumnsResponse> {
  const response = await fetch(`${getApiUrl()}/views/${viewId}/schema`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to fetch columns");
  }

  return response.json();
}

export async function listFileColumns(
  fileId: number,
): Promise<ListColumnsResponse> {
  const response = await fetch(`${getApiUrl()}/files/${fileId}/schema`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to fetch columns");
  }

  return response.json();
}

export async function listViewRows(viewId: string): Promise<ListRowsResponse> {
  const response = await fetch(`${getApiUrl()}/views/${viewId}/rows`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to fetch rows");
  }

  return response.json();
}

export async function getDiscreteColumnChartData(
  viewId: string,
): Promise<DiscreteColumnChartViewModel> {
  const response = await fetch(`${getApiUrl()}/views/${viewId}/chart-data`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to fetch rows");
  }

  return response.json();
}

export interface UpdateCellRequest {
  value: any;
  viewId: string;
  rowId: string;
  columnName: string;
  rowVersion: number;
}

export async function updateCell({
  value,
  viewId,
  rowId,
  columnName,
  rowVersion,
}: UpdateCellRequest): Promise<void> {
  const response = await fetch(
    `${getApiUrl()}/views/${viewId}/rows/${rowId}/cell`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ value, columnName, rowVersion }),
      credentials: "include",
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to update cell");
  }
}

export async function updateViewSortModel(
  viewId: string,
  sortModel: SortModelItem[],
): Promise<void> {
  const response = await fetch(`${getApiUrl()}/views/${viewId}/sort-model`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sortModel }),
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to update sort model");
  }
}

export async function updateViewFilterModel(
  viewId: string,
  filterModel: Record<string, any>,
): Promise<void> {
  const response = await fetch(`${getApiUrl()}/views/${viewId}/filter-model`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ filterModel }),
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to update filter model");
  }
}

export async function getViewFilterModel(
  viewId: string,
): Promise<FilterModelResponse> {
  const response = await fetch(`${getApiUrl()}/views/${viewId}/filter-model`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to fetch filter model");
  }

  return response.json();
}

export async function getViewSortModel(
  viewId: string,
): Promise<SortModelResponse> {
  const response = await fetch(`${getApiUrl()}/views/${viewId}/sort-model`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to fetch sort model");
  }

  return response.json();
}

export async function listChatMessages(
  projectId: string,
): Promise<ChatMessageViewModel[]> {
  const response = await fetch(
    `${getApiUrl()}/projects/${projectId}/chat-messages`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to fetch chat messages");
  }

  return response.json();
}
