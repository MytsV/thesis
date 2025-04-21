export interface UserLoginViewModel {
  username: string;
  email: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface UserViewModel extends UserLoginViewModel {
  id: number;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export type PaginatedResponse<T> = {
  data: T[];
  hasNextPage: boolean;
};

export interface ProjectViewModel {
  id: number;
  title: string;
  description: string;
  createdAt: Date;
  userId: number;
}

export enum ProjectListTabs {
  MINE = "mine",
  SHARED = "shared",
}

export interface CreateProjectData {
  title: string;
  description: string;
}
