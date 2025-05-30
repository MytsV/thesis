import {
  ActiveUserViewModel,
  DetailedProjectViewModel,
  PaginatedResponse,
  ProjectViewModel,
  UserViewModel,
} from "@/lib/types";
import { cookies, headers } from "next/headers";
import { buildQueryString, getApiUrl } from "@/lib/utils/api-utils";
import { ListProjectsRequest } from "@/lib/client-api";

export async function getUserServer(): Promise<UserViewModel | undefined> {
  const headersList = await headers();

  const userId = headersList.get("x-user-id");
  const username = headersList.get("x-user-name");
  const email = headersList.get("x-user-email");
  const avatarUrl = headersList.get("x-user-avatar");

  // TODO: either redirect to login or throw an error
  if (!userId || !username || !email) {
    return undefined;
  }

  return {
    id: parseInt(userId),
    username: username,
    avatarUrl: avatarUrl ?? undefined,
  };
}

export async function getProjectDetails(
  project_id: string,
): Promise<DetailedProjectViewModel> {
  // Get the session cookie from the request
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");

  const response = await fetch(`${getApiUrl()}/projects/${project_id}`, {
    method: "GET",
    headers: {
      ...(sessionCookie ? { Cookie: `session=${sessionCookie.value}` } : {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to fetch project details");
  }

  return response.json();
}

export async function listProjects({
  page,
  pageSize,
}: ListProjectsRequest): Promise<PaginatedResponse<ProjectViewModel>> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");

  const response = await fetch(
    `${getApiUrl()}/projects${buildQueryString({ page, pageSize })}`,
    {
      method: "GET",
      headers: {
        ...(sessionCookie ? { Cookie: `session=${sessionCookie.value}` } : {}),
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to fetch projects");
  }

  return response.json();
}

export async function getActiveUsers(
  project_id: string,
): Promise<ActiveUserViewModel[]> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");

  const response = await fetch(
    `${getApiUrl()}/projects/${project_id}/active-users`,
    {
      method: "GET",
      headers: {
        ...(sessionCookie ? { Cookie: `session=${sessionCookie.value}` } : {}),
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to fetch active users");
  }

  return response.json();
}
