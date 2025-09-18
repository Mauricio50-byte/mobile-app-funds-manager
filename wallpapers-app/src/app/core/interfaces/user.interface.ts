export interface UserData {
  name: string;
  lastName: string;
  email: string;
  uid: string;
  phone?: string;
  bio?: string;
  createdAt: Date;
  updatedAt?: Date;
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