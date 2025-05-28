import { FilterModel as AgGridFilterModel } from "ag-grid-community";

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
  avatar_url?: string;
  color?: string;
  current_view_id?: string;
  focused_row_id?: string;
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
  avatar_url?: string;
}

export interface UserLeftEvent {
  event: "user_left";
  id: number;
}

export interface InitEvent {
  event: "init";
  users: ActiveUserViewModel[];
}

export interface UserFocusChangedEvent {
  event: "user_focus_changed";
  id: number;
  focused_row_id: string;
}

export interface UserViewChangedEvent {
  event: "user_view_changed";
  id: number;
  current_view_id: string;
}

export interface RowUpdateEvent {
  event: "row_update";
  view_id: string;
  file_id: number;
  row_id: string;
  row_version: number;
  column_name: string;
  value: string;
}

export interface ViewViewModel {
  id: string;
  name: string;
  viewType: ViewType;
  fileId: number;
}

export interface ListViewsResponse {
  views: ViewViewModel[];
}

export enum ViewType {
  SIMPLE_TABLE = "simple_table",
  DISCRETE_COLUMN_CHART = "discrete_column_chart",
}

export enum ColumnType {
  STRING = "string",
  INT = "int",
  FLOAT = "float",
  BOOLEAN = "boolean",
  DATETIME = "datetime",
}

export interface ColumnViewModel {
  id: number;
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

export interface SimpleTableViewCreateRequest {
  name: string;
  fileId: number;
}

export interface DiscreteColumnChartViewCreateRequest {
  name: string;
  fileId: number;
  columnId: number;
}

export type FilterModel = AgGridFilterModel;

export interface SortModelItem {
  columnName: string;
  sortDirection: "asc" | "desc" | null;
}

export interface FilterModelResponse {
  filterModel: FilterModel | null;
}

export interface SortModelResponse {
  sortModel: SortModelItem[] | null;
}

interface SortUpdateItem {
  column_name: string;
  sort_direction: "asc" | "desc" | null;
}

export interface FilterSortUpdateEvent {
  event: "filter_sort_update";
  filter_model: FilterModel;
  sort_model: SortUpdateItem[];
  view_id: string;
}

export interface ChatMessageViewModel {
  id: string;
  content: string;
  createdAt: number;
  user: {
    id: number;
    username: string;
    avatarUrl?: string;
  };
  view?: ViewViewModel;
}

export interface ChatMessageEvent {
  event: "chat_message";
  message_id: string;
  content: string;
  user_id: number;
  user_username: string;
  user_avatar_url?: string;
  view_id?: string;
  view_name?: string;
  view_type?: ViewType;
  view_file_id?: number;
  created_at: number;
}

export function chatMessageEventToViewModel(
  event: ChatMessageEvent,
): ChatMessageViewModel {
  let view: ViewViewModel | undefined;
  if (
    event.view_id &&
    event.view_name &&
    event.view_type &&
    event.view_file_id
  ) {
    view = {
      id: event.view_id,
      name: event.view_name,
      viewType: event.view_type,
      fileId: event.view_file_id,
    };
  }
  return {
    id: event.message_id,
    content: event.content,
    createdAt: event.created_at,
    user: {
      id: event.user_id,
      username: event.user_username,
      avatarUrl: event.user_avatar_url,
    },
    view: view,
  };
}

export interface DiscreteColumnChartViewModel {
  columnName: string;
  data: {
    label: string;
    value: number;
  }[];
}
