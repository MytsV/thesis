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
