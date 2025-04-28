export interface UserLoginViewModel {
  username: string;
  email: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface UserViewModel {
  id: number;
  username: string;
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
  activeUserCount?: number;
}

export enum ProjectListTabs {
  MINE = "mine",
  SHARED = "shared",
}

export interface ActiveUserViewModel {
  id: number;
  username: string;
  avatarUrl?: string;
  color?: string;
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
  createdAt: number;
  owner: UserViewModel;
  files: FileViewModel[];
}

export interface UserJoinedEvent {
  event: "user_joined";
  id: number;
  username: string;
  color: string;
}

export interface UserLeftEvent {
  event: "user_left";
  id: number;
}

export interface InitEvent {
  event: "init";
  users: ActiveUserViewModel[];
}

export interface ViewViewModel {
  id: string;
  name: string;
  viewType: ViewType;
}

export interface ListViewsResponse {
  views: ViewViewModel[];
}

export enum ViewType {
  SIMPLE_TABLE = "simple_table",
  CHART = "chart",
}

export enum ColumnType {
  STRING = "string",
  INT = "int",
  FLOAT = "float",
  BOOLEAN = "boolean",
  DATETIME = "datetime",
}

export interface ColumnViewModel {
  columnName: string;
  columnType: ColumnType;
}

export interface ListColumnsResponse {
  columns: ColumnViewModel[];
}

export interface RowViewModel {
  id: string;
  data: Record<string, any>;
}

export interface ListRowsResponse {
  rows: RowViewModel[];
}

export interface ViewCreateRequest {
  name: string;
  fileId: number;
}
