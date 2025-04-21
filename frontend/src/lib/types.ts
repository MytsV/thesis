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
  avatarUrl?: string;
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
  id: string;
  title: string;
  description: string;
  createdAt: Date;
  ownerId: number;
  ownerUsername?: string;
  isShared: boolean;
}

export enum ProjectListTabs {
  MINE = "mine",
  SHARED = "shared",
}

export interface ActiveUserViewModel {
  id: number;
  username: string;
  email: string;
  avatarUrl?: string;
  outlineColor?: string;
}

export interface FileViewModel {
  id: number;
  name: string;
  relativePath: string;
  fileSize?: number;
  fileType?: string;
}

export interface DetailedProjectViewModel {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
  owner: UserViewModel;
  files: FileViewModel[];
}
