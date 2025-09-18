export interface UserData {
  name: string;
  lastName: string;
  email: string;
  uid: string;
  createdAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  lastName: string;
  email: string;
  password: string;
}